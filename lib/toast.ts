export type ToastType = "success" | "error" | "info" | "warning" | "rival" | "combo" | "level-up";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  icon?: string;
}

const listeners: Array<(toast: ToastItem) => void> = [];

export const toast = {
  show: (value: Omit<ToastItem, "id">) => {
    const nextToast: ToastItem = {
      ...value,
      id: Math.random().toString(36).slice(2),
    };
    listeners.forEach((listener) => listener(nextToast));
  },
  success: (title: string, message?: string) => toast.show({ type: "success", title, message, duration: 3000 }),
  error: (title: string, message?: string) => toast.show({ type: "error", title, message, duration: 4000 }),
  info: (title: string, message?: string) => toast.show({ type: "info", title, message, duration: 3000 }),
  rival: (title: string, message?: string) => toast.show({ type: "rival", title, message, duration: 5000, icon: "⚔" }),
  combo: (level: number) =>
    toast.show({
      type: "combo",
      title: `${["", "", "", "🔥 COMBO x1.5!", "🔥 COMBO x1.5!", "⚡ COMBO x2!", "⚡ COMBO x2!", "⚡ COMBO x2!", "💥 COMBO x3!!!"][Math.min(level, 8)]}`,
      duration: 2000,
    }),
  levelUp: (level: number) =>
    toast.show({
      type: "level-up",
      title: `Level ${level}!`,
      message: "You leveled up!",
      duration: 4000,
      icon: "⬆",
    }),
  onToast: (listener: (toastValue: ToastItem) => void) => {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index >= 0) listeners.splice(index, 1);
    };
  },
};
