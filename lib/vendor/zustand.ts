import { useSyncExternalStore } from "react";

type PartialState<T> = Partial<T> | T | ((state: T) => Partial<T> | T);
type Listener = () => void;

export type SetState<T> = (partial: PartialState<T>, replace?: boolean) => void;
export type GetState<T> = () => T;
export type StateCreator<T> = (set: SetState<T>, get: GetState<T>) => T;

export type StoreApi<T> = {
  getState: GetState<T>;
  setState: SetState<T>;
  subscribe: (listener: Listener) => () => void;
};

export type UseBoundStore<T> = {
  (): T;
  <U>(selector: (state: T) => U): U;
  getState: GetState<T>;
  setState: SetState<T>;
  subscribe: (listener: Listener) => () => void;
};

function identity<T>(value: T) {
  return value;
}

export function create<T>() {
  return (initializer: StateCreator<T>): UseBoundStore<T> => {
    let state!: T;
    const listeners = new Set<Listener>();

    const getState: GetState<T> = () => state;

    const setState: SetState<T> = (partial, replace = false) => {
      const nextState =
        typeof partial === "function"
          ? (partial as (currentState: T) => Partial<T> | T)(state)
          : partial;
      const resolved =
        replace || typeof nextState !== "object" || nextState === null
          ? (nextState as T)
          : ({ ...state, ...nextState } as T);

      if (Object.is(resolved, state)) return;
      state = resolved;
      listeners.forEach((listener) => listener());
    };

    const subscribe = (listener: Listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    };

    state = initializer(setState, getState);

    const useBoundStore = (<U>(selector?: (state: T) => U) =>
      useSyncExternalStore(
        subscribe,
        () => (selector ?? (identity as unknown as (state: T) => U))(state),
        () => (selector ?? (identity as unknown as (state: T) => U))(state),
      )) as UseBoundStore<T>;

    useBoundStore.getState = getState;
    useBoundStore.setState = setState;
    useBoundStore.subscribe = subscribe;

    return useBoundStore;
  };
}
