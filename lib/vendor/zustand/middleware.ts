import type { StateCreator } from "zustand";

type StorageValue = unknown;

export type PersistStorage<S = StorageValue> = {
  getItem: (name: string) => S | Promise<S | null> | null;
  setItem: (name: string, value: S) => void | Promise<void>;
  removeItem?: (name: string) => void | Promise<void>;
};

type PersistOptions<T, Persisted = Partial<T>> = {
  name: string;
  storage?: PersistStorage<Persisted>;
  partialize?: (state: T) => Persisted;
  merge?: (persistedState: Persisted, currentState: T) => T;
};

export function createJSONStorage<T>(getStorage: () => Storage): PersistStorage<T> {
  return {
    getItem: (name) => {
      const raw = getStorage().getItem(name);
      return raw ? (JSON.parse(raw) as T) : null;
    },
    setItem: (name, value) => {
      getStorage().setItem(name, JSON.stringify(value));
    },
    removeItem: (name) => {
      getStorage().removeItem(name);
    },
  };
}

export function persist<T, Persisted = Partial<T>>(
  initializer: StateCreator<T>,
  options: PersistOptions<T, Persisted>,
): StateCreator<T> {
  return (set, get) => {
    const storage = options.storage;
    const partialize = options.partialize ?? ((state: T) => state as unknown as Persisted);
    const merge =
      options.merge
      ?? ((persistedState: Persisted, currentState: T) =>
        ({ ...currentState, ...(persistedState as object) } as T));

    const persistSnapshot = () => {
      if (!storage || typeof window === "undefined") return;
      void storage.setItem(options.name, partialize(get()));
    };

    const wrappedSet: typeof set = (partial, replace) => {
      set(partial, replace);
      persistSnapshot();
    };

    const initialState = initializer(wrappedSet, get);

    if (storage && typeof window !== "undefined") {
      void Promise.resolve(storage.getItem(options.name)).then((persisted) => {
        if (persisted == null) return;
        const merged = merge(persisted, get());
        set(merged, true);
      }).catch(() => {
        return;
      });
    }

    return initialState;
  };
}
