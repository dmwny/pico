"use client";

import { useCosmetics } from "@/contexts/CosmeticsContext";
import StreakDailyModal from "@/components/streak/StreakDailyModal";
import StreakLostModal from "@/components/streak/StreakLostModal";
import StreakMilestoneModal from "@/components/streak/StreakMilestoneModal";

export default function StreakGlobalOverlays() {
  const {
    pendingStreakLoss,
    pendingDailyStreakCelebration,
    pendingStreakMilestone,
    dismissDailyStreakCelebration,
    dismissStreakLoss,
    dismissStreakMilestone,
  } = useCosmetics();

  if (pendingStreakLoss) {
    return (
      <StreakLostModal
        lostStreak={pendingStreakLoss.streak}
        bestStreak={pendingStreakLoss.bestStreak}
        nextMilestone={pendingStreakLoss.nextMilestone}
        onClose={() => {
          void dismissStreakLoss();
        }}
      />
    );
  }

  if (pendingStreakMilestone) {
    return (
      <StreakMilestoneModal
        reward={pendingStreakMilestone}
        onContinue={() => {
          void dismissStreakMilestone();
        }}
      />
    );
  }

  if (pendingDailyStreakCelebration) {
    return (
      <StreakDailyModal
        streak={pendingDailyStreakCelebration.streak}
        onContinue={() => {
          void dismissDailyStreakCelebration();
        }}
      />
    );
  }

  return null;
}
