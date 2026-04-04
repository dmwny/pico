"use client";

import StreakCelebrationScreen from "@/components/streak/StreakCelebrationScreen";

function getDailyMessage(streak: number) {
  if (streak >= 100) return "You came back again. This is not luck anymore.";
  if (streak >= 50) return "This streak has real weight now. Protect it tomorrow.";
  if (streak >= 30) return "A month in. Most people never get here.";
  if (streak >= 14) return "Two weeks deep. The habit is real.";
  if (streak >= 7) return "A full week. Keep the fire moving.";
  if (streak >= 3) return "You're building something now.";
  return "Day one became day two. Come back tomorrow.";
}

export default function StreakDailyModal({
  streak,
  onContinue,
}: {
  streak: number;
  onContinue: () => void;
}) {
  return <StreakCelebrationScreen streak={streak} message={getDailyMessage(streak)} onContinue={onContinue} />;
}
