export type LeagueTier =
  | "Bronze" | "Silver" | "Gold" | "Sapphire" | "Ruby"
  | "Emerald" | "Amethyst" | "Pearl" | "Obsidian" | "Diamond";

export type League = {
  id: number;
  name: LeagueTier;
  tier: number;
  promotionCutoff: number;
  demotionCutoff: number;
  colorHex: string;
  iconEmoji: string;
  bgGradientFrom: string;
  bgGradientTo: string;
  perkDescription: string | null;
  hardModeUnlocked: boolean;
  animatedBorder: boolean;
};

export type LeagueWeek = {
  id: string;
  weekStart: string;
  weekEnd: string;
  isCurrent: boolean;
  modifierType: string | null;
  modifierLabel: string | null;
  modifierDescription: string | null;
};

export type LeagueMembership = {
  id: string;
  userId: string;
  leagueGroupId: string;
  leagueWeekId: string;
  leagueId: number;
  xpEarnedThisWeek: number;
  peakRankThisWeek: number | null;
  playersPassed: number;
  finalRank: number | null;
  promoted: boolean;
  demoted: boolean;
  stayed: boolean;
  isGhost: boolean;
  rivalUserId: string | null;
  promotionProtected: boolean;
  placementWeek: number;
  xpMultiplier: number;
  joinedAt: string;
};

export type LeaderboardEntry = {
  userId: string;
  username: string;
  avatarUrl: string | null;
  xpThisWeek: number;
  rank: number;
  isMe: boolean;
  isRival: boolean;
  isGhost: boolean;
  xpMultiplier: number;
  playStyleTag?: string | null;
};

export type GlobalLeaderboardEntry = {
  userId: string;
  username: string;
  avatarUrl: string | null;
  totalXp: number;
  weeklyXp: number;
  dailyXp: number;
  currentStreak: number;
  leagueId: number | null;
  playStyleTag: string | null;
  rank: number;
  isMe: boolean;
};

export type LeagueMission = {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  missionType: string;
  targetValue: number;
  currentValue: number;
  completed: boolean;
  rewardClaimed: boolean;
};

export type RewardChest = {
  id: string;
  chestTier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  xpReward: number;
  multiplierReward: number | null;
  multiplierDurationDays: number | null;
  streakShield: boolean;
  cosmeticItem: string | null;
  opened: boolean;
};

export type OvertakeEvent = {
  id: string;
  overtakerUserId: string;
  overtakerUsername: string;
  overtakenUserId: string;
  overtakenUsername?: string;
  isClutch: boolean;
  createdAt: string;
};

export type WeekRecap = {
  leagueWeekId: string;
  xpEarned: number;
  playersPassed: number;
  peakRank: number | null;
  finalRank: number | null;
  missionsCompleted: number;
  result: "promoted" | "demoted" | "stayed";
  leagueName: LeagueTier;
};

export type HotStreak = {
  consecutiveDays: number;
  currentMultiplier: number;
  lastActiveDate: string | null;
};

export type DiamondTournament = {
  id: string;
  name: string;
  stage: "quarterfinal" | "semifinal" | "final";
  startedAt: string;
  endsAt: string;
  isActive: boolean;
};

export type LeagueHistoryItem = {
  weekStart: string;
  weekEnd: string;
  leagueName: LeagueTier;
  leagueColorHex: string;
  leagueIconEmoji: string;
  xpEarned: number;
  finalRank: number | null;
  missionsCompleted?: number;
  result: "promoted" | "demoted" | "stayed" | "pending";
};
