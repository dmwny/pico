"use client";

import type { StreakMilestoneReward } from "@/lib/streaks";
import StreakCelebrationScreen from "@/components/streak/StreakCelebrationScreen";

export default function StreakMilestoneModal({
  reward,
  onContinue,
}: {
  reward: StreakMilestoneReward;
  onContinue: () => void;
}) {
  return (
    <StreakCelebrationScreen
      streak={reward.milestone}
      message={reward.message}
      reward={reward}
      onContinue={onContinue}
    />
  );
}
