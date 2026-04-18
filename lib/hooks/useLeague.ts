"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type {
  GlobalLeaderboardEntry,
  HotStreak,
  LeaderboardEntry,
  League,
  LeagueHistoryItem,
  LeagueMembership,
  LeagueMission,
  LeagueTier,
  LeagueWeek,
  OvertakeEvent,
  RewardChest,
  WeekRecap,
} from "@/lib/types/leagues";

const LEAGUE_NAMES: LeagueTier[] = [
  "Bronze",
  "Silver",
  "Gold",
  "Sapphire",
  "Ruby",
  "Emerald",
  "Amethyst",
  "Pearl",
  "Obsidian",
  "Diamond",
];

const PROMOTION_CUTOFF = 10;
const DEMOTION_CUTOFF = 5;

type LeagueRow = {
  id: number;
  name: string;
  tier: number;
  promotion_cutoff: number;
  demotion_cutoff: number;
  color_hex: string;
  icon_emoji: string;
  bg_gradient_from: string;
  bg_gradient_to: string;
  perk_description: string | null;
  hard_mode_unlocked: boolean | null;
  animated_border: boolean | null;
};

type LeagueWeekRow = {
  id: string;
  week_start: string;
  week_end: string;
  is_current: boolean;
  modifier_type: string | null;
  modifier_label: string | null;
  modifier_description: string | null;
};

type LeagueMembershipRow = {
  id: string;
  user_id: string;
  league_group_id: string;
  league_week_id: string;
  league_id: number;
  xp_earned_this_week: number;
  peak_rank_this_week: number | null;
  players_passed: number | null;
  final_rank: number | null;
  promoted: boolean | null;
  demoted: boolean | null;
  stayed: boolean | null;
  is_ghost: boolean | null;
  rival_user_id: string | null;
  promotion_protected: boolean | null;
  placement_week: number | null;
  xp_multiplier: number | string | null;
  joined_at: string;
  leagues?: LeagueRow | null;
  league_weeks?: LeagueWeekRow | null;
};

type LeagueHistoryMembershipRow = {
  league_week_id: string;
  xp_earned_this_week: number;
  final_rank: number | null;
  promoted: boolean | null;
  demoted: boolean | null;
  stayed: boolean | null;
  league_weeks: LeagueWeekRow | LeagueWeekRow[] | null;
  leagues: LeagueRow | LeagueRow[] | null;
};

type CurrentMembershipMissionRow = {
  league_id: number;
  league_weeks: Pick<LeagueWeekRow, "id" | "is_current"> | Array<Pick<LeagueWeekRow, "id" | "is_current">> | null;
};

type CurrentGroupLeaderboardRow = {
  user_id: string;
  xp_earned_this_week: number;
  league_group_id: string;
  rival_user_id: string | null;
  is_ghost: boolean | null;
  xp_multiplier: number | string | null;
  username: string | null;
  avatar_url: string | null;
  rank_in_group: number;
};

type GroupCacheRow = {
  user_id: string;
  play_style_tag: string | null;
  total_xp: number | null;
  weekly_xp: number | null;
  username: string | null;
  avatar_url: string | null;
};

type XpLeaderboardCacheRow = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  total_xp: number | null;
  weekly_xp: number | null;
  daily_xp: number | null;
  current_streak: number | null;
  league_id: number | null;
  play_style_tag: string | null;
};

type LeagueMissionRow = {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  mission_type: string;
  target_value: number;
  league_min_tier: number | null;
};

type UserMissionProgressRow = {
  mission_id: string;
  current_value: number | null;
  completed: boolean | null;
  reward_claimed: boolean | null;
};

type RewardChestRow = {
  id: string;
  chest_tier: RewardChest["chestTier"];
  xp_reward: number | null;
  multiplier_reward: number | string | null;
  multiplier_duration_days: number | null;
  streak_shield: boolean | null;
  cosmetic_item: string | null;
  opened: boolean | null;
};

type HotStreakRow = {
  consecutive_days: number | null;
  current_multiplier: number | string | null;
  last_active_date: string | null;
};

type OvertakeEventRow = {
  id: string;
  overtaker_user_id: string;
  overtaken_user_id: string;
  is_clutch: boolean | null;
  created_at: string;
};

type ProfileUsernameRow = {
  id: string;
  username: string | null;
  avatar_url?: string | null;
};

type WeekRecapRow = {
  league_week_id: string;
  xp_earned: number | null;
  players_passed: number | null;
  peak_rank: number | null;
  final_rank: number | null;
  missions_completed: number | null;
  result: WeekRecap["result"] | null;
  league_name: string | null;
  created_at: string;
};

type MyLeagueMembershipRpcRow = {
  membership: LeagueMembershipRow | null;
  league: LeagueRow | null;
  week: LeagueWeekRow | null;
};

const GHOST_FIRST_NAMES = [
  "Alex", "Jordan", "Sam", "Riley", "Morgan", "Taylor", "Casey", "Quinn", "Avery", "Drew",
  "Blake", "Cameron", "Dakota", "Emery", "Finley", "Hayden", "Jamie", "Kendall", "Logan", "Parker",
  "Peyton", "Reagan", "Rowan", "Sage", "Skyler", "Spencer", "Sydney", "Tatum", "Bailey", "Charlie",
];

const GHOST_LAST_INITIALS = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "P", "R", "S", "T", "V", "W", "Y"];
const GHOST_AVATAR_STYLES = ["micah", "personas", "adventurer-neutral", "thumbs", "fun-emoji", "bottts-neutral"] as const;

function hashSeed(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getGhostIdentity(id: string) {
  const seed = hashSeed(id);
  const first = GHOST_FIRST_NAMES[seed % GHOST_FIRST_NAMES.length] ?? "Pico";
  const last = GHOST_LAST_INITIALS[(seed >> 3) % GHOST_LAST_INITIALS.length] ?? "L";
  const style = GHOST_AVATAR_STYLES[(seed >> 5) % GHOST_AVATAR_STYLES.length] ?? "micah";
  const avatarSeed = `${first}-${last}-${seed}`;

  return {
    name: `${first} ${last}.`,
    avatarUrl: `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(avatarSeed)}`,
  };
}

function resolveDisplayXp(rowXp: number, cache: GroupCacheRow | undefined) {
  const candidates = [rowXp, cache?.weekly_xp ?? null, cache?.total_xp ?? null]
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0);

  if (candidates.length === 0) return Math.max(0, rowXp);
  return Math.min(...candidates);
}

function toLeagueTier(value: string | null | undefined): LeagueTier {
  if (value && LEAGUE_NAMES.includes(value as LeagueTier)) {
    return value as LeagueTier;
  }

  return "Bronze";
}

function toNumber(value: number | string | null | undefined, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

function getRecapStorageKey(weekId: string) {
  return `pico_recap_seen_${weekId}`;
}

function takeFirstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

async function getAuthUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return user;
}

function mapLeague(row: LeagueRow | null | undefined): League | null {
  if (!row) return null;

  return {
    id: row.id,
    name: toLeagueTier(row.name),
    tier: row.tier,
    promotionCutoff: row.promotion_cutoff,
    demotionCutoff: row.demotion_cutoff,
    colorHex: row.color_hex,
    iconEmoji: row.icon_emoji,
    bgGradientFrom: row.bg_gradient_from,
    bgGradientTo: row.bg_gradient_to,
    perkDescription: row.perk_description,
    hardModeUnlocked: Boolean(row.hard_mode_unlocked),
    animatedBorder: Boolean(row.animated_border),
  };
}

function mapLeagueWeek(row: LeagueWeekRow | null | undefined): LeagueWeek | null {
  if (!row) return null;

  return {
    id: row.id,
    weekStart: row.week_start,
    weekEnd: row.week_end,
    isCurrent: row.is_current,
    modifierType: row.modifier_type,
    modifierLabel: row.modifier_label,
    modifierDescription: row.modifier_description,
  };
}

function mapLeagueMembership(row: LeagueMembershipRow | null | undefined): LeagueMembership | null {
  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    leagueGroupId: row.league_group_id,
    leagueWeekId: row.league_week_id,
    leagueId: row.league_id,
    xpEarnedThisWeek: row.xp_earned_this_week,
    peakRankThisWeek: row.peak_rank_this_week,
    playersPassed: row.players_passed ?? 0,
    finalRank: row.final_rank,
    promoted: Boolean(row.promoted),
    demoted: Boolean(row.demoted),
    stayed: Boolean(row.stayed),
    isGhost: Boolean(row.is_ghost),
    rivalUserId: row.rival_user_id,
    promotionProtected: Boolean(row.promotion_protected),
    placementWeek: row.placement_week ?? 0,
    xpMultiplier: toNumber(row.xp_multiplier, 1),
    joinedAt: row.joined_at,
  };
}

function mapRewardChest(row: RewardChestRow | null | undefined): RewardChest | null {
  if (!row) return null;

  return {
    id: row.id,
    chestTier: row.chest_tier,
    xpReward: row.xp_reward ?? 0,
    multiplierReward: row.multiplier_reward === null ? null : toNumber(row.multiplier_reward),
    multiplierDurationDays: row.multiplier_duration_days,
    streakShield: Boolean(row.streak_shield),
    cosmeticItem: row.cosmetic_item,
    opened: Boolean(row.opened),
  };
}

function mapHotStreak(row: HotStreakRow | null | undefined): HotStreak {
  return {
    consecutiveDays: row?.consecutive_days ?? 0,
    currentMultiplier: toNumber(row?.current_multiplier, 1),
    lastActiveDate: row?.last_active_date ?? null,
  };
}

function mapWeekRecap(row: WeekRecapRow | null | undefined): WeekRecap | null {
  if (!row || !row.result) return null;

  return {
    leagueWeekId: row.league_week_id,
    xpEarned: row.xp_earned ?? 0,
    playersPassed: row.players_passed ?? 0,
    peakRank: row.peak_rank,
    finalRank: row.final_rank,
    missionsCompleted: row.missions_completed ?? 0,
    result: row.result,
    leagueName: toLeagueTier(row.league_name),
  };
}

function sortLeaderboardEntries(entries: LeaderboardEntry[]) {
  return [...entries].sort((left, right) => {
    if (left.rank !== right.rank) return left.rank - right.rank;
    return right.xpThisWeek - left.xpThisWeek;
  });
}

export function useMyLeague() {
  const [membership, setMembership] = useState<LeagueMembership | null>(null);
  const [league, setLeague] = useState<League | null>(null);
  const [week, setWeek] = useState<LeagueWeek | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const loadMyLeague = useCallback(async (active = true) => {
    setLoading(true);
    setError(null);

    try {
      const user = await getAuthUser();
      if (!active) return;
      setUserId(user?.id ?? null);

      if (!user) {
        setMembership(null);
        setLeague(null);
        setWeek(null);
        return;
      }

      const { data: rpcData, error: rpcError } = await supabase
        .rpc("get_my_league_membership");

      if (rpcError) throw rpcError;
      if (!active) return;

      const row = rpcData as MyLeagueMembershipRpcRow | null;
      const mappedMembership = mapLeagueMembership(row?.membership ?? null);
      if (user?.id && mappedMembership) {
        const { data: cacheRow } = await supabase
          .from("xp_leaderboard_cache")
          .select("user_id, play_style_tag, total_xp, weekly_xp, username, avatar_url")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!active) return;
        const safeXp = resolveDisplayXp(mappedMembership.xpEarnedThisWeek, (cacheRow as GroupCacheRow | null) ?? undefined);
        setMembership({
          ...mappedMembership,
          xpEarnedThisWeek: safeXp,
        });
      } else {
        setMembership(mappedMembership);
      }
      setLeague(mapLeague(row?.league ?? null));
      setWeek(mapLeagueWeek(row?.week ?? null));
    } catch (queryError) {
      if (!active) return;
      setMembership(null);
      setLeague(null);
      setWeek(null);
      setError(getErrorMessage(queryError));
    } finally {
      if (active) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    void loadMyLeague(active);

    return () => {
      active = false;
    };
  }, [loadMyLeague]);

  useEffect(() => {
    if (!userId) return undefined;

    const membershipChannel = supabase
      .channel(`league-membership-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "league_memberships",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void loadMyLeague();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "league_weeks",
        },
        () => {
          void loadMyLeague();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(membershipChannel);
    };
  }, [loadMyLeague, userId]);

  return {
    membership,
    league,
    week,
    loading,
    error,
  };
}

export function useGroupLeaderboard(leagueGroupId: string | null) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myEntry, setMyEntry] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!leagueGroupId) {
      setEntries([]);
      setMyEntry(null);
      setMyRank(null);
      setLoading(false);
      return undefined;
    }

    let active = true;

    const loadEntries = async () => {
      setLoading(true);

      try {
        const user = await getAuthUser();
        const { data, error } = await supabase
          .from("current_group_leaderboard")
          .select("*")
          .eq("league_group_id", leagueGroupId)
          .order("rank_in_group", { ascending: true });

        if (error) throw error;
        if (!active) return;

        const leaderboardRows = (data ?? []) as CurrentGroupLeaderboardRow[];
        const userIds = leaderboardRows.map((row) => row.user_id);
        let cacheMap = new Map<string, GroupCacheRow>();

        if (userIds.length > 0) {
          const { data: cacheData, error: cacheError } = await supabase
            .from("xp_leaderboard_cache")
            .select("user_id, play_style_tag, total_xp, weekly_xp, username, avatar_url")
            .in("user_id", userIds);

          if (cacheError) throw cacheError;
          cacheMap = new Map(
            ((cacheData ?? []) as GroupCacheRow[]).map((row) => [
              row.user_id,
              row,
            ]),
          );
        }

        const myRivalId = leaderboardRows.find((row) => row.user_id === user?.id)?.rival_user_id ?? null;
        const nextEntries = sortLeaderboardEntries(
          leaderboardRows.map((row) => {
            const cache = cacheMap.get(row.user_id);
            const ghostIdentity = row.is_ghost ? getGhostIdentity(row.user_id) : null;

            return {
              userId: row.user_id,
              username: row.username ?? cache?.username ?? ghostIdentity?.name ?? "Pico learner",
              avatarUrl: row.avatar_url ?? cache?.avatar_url ?? ghostIdentity?.avatarUrl ?? null,
              xpThisWeek: resolveDisplayXp(row.xp_earned_this_week, cache),
              rank: row.rank_in_group,
              isMe: row.user_id === user?.id,
              isRival: row.user_id === myRivalId,
              isGhost: Boolean(row.is_ghost),
              xpMultiplier: toNumber(row.xp_multiplier, 1),
              playStyleTag: cache?.play_style_tag ?? null,
            };
          }),
        );

        const nextMyEntry = nextEntries.find((entry) => entry.isMe) ?? null;
        setEntries(nextEntries);
        setMyEntry(nextMyEntry);
        setMyRank(nextMyEntry?.rank ?? null);
      } catch {
        if (!active) return;
        setEntries([]);
        setMyEntry(null);
        setMyRank(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadEntries();

    const channel = supabase
      .channel(`league-group-${leagueGroupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "league_memberships",
          filter: `league_group_id=eq.${leagueGroupId}`,
        },
        () => {
          void loadEntries();
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [leagueGroupId]);

  return {
    entries,
    myRank,
    myEntry,
    loading,
  };
}

export function useGlobalLeaderboard(period: "daily" | "weekly" | "alltime") {
  const [entries, setEntries] = useState<GlobalLeaderboardEntry[]>([]);
  const [myEntry, setMyEntry] = useState<GlobalLeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const scoreField =
      period === "daily" ? "daily_xp" : period === "weekly" ? "weekly_xp" : "total_xp";

    const mapGlobalEntry = (
      row: XpLeaderboardCacheRow,
      rank: number,
      currentUserId: string | null,
    ): GlobalLeaderboardEntry => ({
      userId: row.user_id,
      username: row.username ?? "Pico learner",
      avatarUrl: row.avatar_url,
      totalXp: row.total_xp ?? 0,
      weeklyXp: row.weekly_xp ?? 0,
      dailyXp: row.daily_xp ?? 0,
      currentStreak: row.current_streak ?? 0,
      leagueId: row.league_id,
      playStyleTag: row.play_style_tag,
      rank,
      isMe: row.user_id === currentUserId,
    });

    const loadGlobalLeaderboard = async () => {
      setLoading(true);

      try {
        const user = await getAuthUser();
        const { data, error } = await supabase
          .from("xp_leaderboard_cache")
          .select("user_id, username, avatar_url, total_xp, weekly_xp, daily_xp, current_streak, league_id, play_style_tag")
          .order(scoreField, { ascending: false })
          .limit(100);

        if (error) throw error;
        if (!active) return;

        const topRows = (data ?? []) as XpLeaderboardCacheRow[];
        const nextEntries = topRows.map((row, index) => mapGlobalEntry(row, index + 1, user?.id ?? null));
        const inTop = nextEntries.find((entry) => entry.isMe) ?? null;

        setEntries(nextEntries);
        if (inTop || !user) {
          setMyEntry(inTop);
          return;
        }

        const { data: selfData, error: selfError } = await supabase
          .from("xp_leaderboard_cache")
          .select("user_id, username, avatar_url, total_xp, weekly_xp, daily_xp, current_streak, league_id, play_style_tag")
          .eq("user_id", user.id)
          .maybeSingle();

        if (selfError) throw selfError;
        if (!active || !selfData) {
          setMyEntry(null);
          return;
        }

        const selfRow = selfData as XpLeaderboardCacheRow;
        const myScore = toNumber(selfRow[scoreField as keyof XpLeaderboardCacheRow] as number | string | null);
        const { count, error: countError } = await supabase
          .from("xp_leaderboard_cache")
          .select("user_id", { head: true, count: "exact" })
          .gt(scoreField, myScore);

        if (countError) throw countError;
        if (!active) return;

        setMyEntry(mapGlobalEntry(selfRow, (count ?? 0) + 1, user.id));
      } catch {
        if (!active) return;
        setEntries([]);
        setMyEntry(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadGlobalLeaderboard();

    return () => {
      active = false;
    };
  }, [period]);

  return {
    entries,
    myEntry,
    loading,
  };
}

export function useLeagueHistory(userId: string) {
  const [history, setHistory] = useState<LeagueHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setHistory([]);
      setLoading(false);
      return undefined;
    }

    let active = true;

    const loadHistory = async () => {
      setLoading(true);

      try {
        const [{ data: membershipData, error: membershipError }, { data: recapData, error: recapError }] = await Promise.all([
          supabase
            .from("league_memberships")
            .select(`
              id,
              league_week_id,
              xp_earned_this_week,
              final_rank,
              promoted,
              demoted,
              stayed,
              league_weeks(*),
              leagues(*)
            `)
            .eq("user_id", userId)
            .order("joined_at", { ascending: false })
            .limit(16),
          supabase
            .from("week_recap_snapshots")
            .select("league_week_id, missions_completed")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(16),
        ]);

        if (membershipError) throw membershipError;
        if (recapError) throw recapError;
        if (!active) return;

        const recapMap = new Map(
          ((recapData ?? []) as Array<{ league_week_id: string; missions_completed: number | null }>).map((row) => [
            row.league_week_id,
            row.missions_completed ?? 0,
          ]),
        );

        const mappedHistory: Array<LeagueHistoryItem | null> = ((membershipData ?? []) as unknown as LeagueHistoryMembershipRow[])
          .map((row) => {
            const week = mapLeagueWeek(takeFirstRelation(row.league_weeks));
            const league = mapLeague(takeFirstRelation(row.leagues));
            if (!week || !league) return null;

            let result: LeagueHistoryItem["result"] = "pending";
            if (row.promoted) result = "promoted";
            else if (row.demoted) result = "demoted";
            else if (row.stayed || row.final_rank !== null) result = "stayed";

            return {
              weekStart: week.weekStart,
              weekEnd: week.weekEnd,
              leagueName: league.name,
              leagueColorHex: league.colorHex,
              leagueIconEmoji: league.iconEmoji,
              xpEarned: row.xp_earned_this_week,
              finalRank: row.final_rank,
              missionsCompleted: recapMap.get(row.league_week_id) ?? 0,
              result,
            } satisfies LeagueHistoryItem;
          });

        const nextHistory = mappedHistory
          .filter((item): item is LeagueHistoryItem => item !== null)
          .sort((left, right) => new Date(right.weekStart).getTime() - new Date(left.weekStart).getTime())
          .slice(0, 10);

        setHistory(nextHistory);
      } catch {
        if (!active) return;
        setHistory([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadHistory();

    return () => {
      active = false;
    };
  }, [userId]);

  return {
    history,
    loading,
  };
}

export function useLeagueMissions() {
  const [missions, setMissions] = useState<LeagueMission[]>([]);
  const [loading, setLoading] = useState(true);

  const claimMission = useCallback(async (missionId: string) => {
    const user = await getAuthUser();
    if (!user) return false;

    const { error } = await supabase
      .from("user_mission_progress")
      .update({
        reward_claimed: true,
      })
      .eq("user_id", user.id)
      .eq("mission_id", missionId);

    if (error) {
      return false;
    }

    setMissions((current) =>
      current.map((mission) =>
        mission.id === missionId
          ? { ...mission, rewardClaimed: true }
          : mission,
      ),
    );

    return true;
  }, []);

  useEffect(() => {
    let active = true;

    const loadMissions = async () => {
      setLoading(true);

      try {
        const user = await getAuthUser();
        if (!user) {
          if (active) {
            setMissions([]);
          }
          return;
        }

        const { data: currentMembershipData, error: membershipError } = await supabase
          .from("league_memberships")
          .select(`
            league_id,
            league_weeks!inner(id, is_current)
          `)
          .eq("user_id", user.id)
          .maybeSingle();

if (membershipError) throw membershipError;
if (!active || !currentMembershipData) {
  setMissions([]);
  return;
}

        const membershipRow = currentMembershipData as unknown as CurrentMembershipMissionRow;
        const currentWeek = takeFirstRelation(membershipRow.league_weeks);
        if (!currentWeek) {
          setMissions([]);
          return;
        }

        const leagueId = membershipRow.league_id;
        const weekId = currentWeek.id;

        const { data: missionData, error: missionError } = await supabase
          .from("league_missions")
          .select("id, title, description, xp_reward, mission_type, target_value, league_min_tier")
          .eq("league_week_id", weekId)
          .lte("league_min_tier", leagueId)
          .order("xp_reward", { ascending: false });

        if (missionError) throw missionError;
        if (!active) return;

        const missionRows = (missionData ?? []) as LeagueMissionRow[];
        if (missionRows.length === 0) {
          setMissions([]);
          return;
        }

        const { data: progressData, error: progressError } = await supabase
          .from("user_mission_progress")
          .select("mission_id, current_value, completed, reward_claimed")
          .eq("user_id", user.id)
          .in("mission_id", missionRows.map((mission) => mission.id));

        if (progressError) throw progressError;
        if (!active) return;

        const progressMap = new Map(
          ((progressData ?? []) as UserMissionProgressRow[]).map((row) => [row.mission_id, row]),
        );

        setMissions(
          missionRows.map((row) => {
            const progress = progressMap.get(row.id);

            return {
              id: row.id,
              title: row.title,
              description: row.description,
              xpReward: row.xp_reward,
              missionType: row.mission_type,
              targetValue: row.target_value,
              currentValue: progress?.current_value ?? 0,
              completed: Boolean(progress?.completed),
              rewardClaimed: Boolean(progress?.reward_claimed),
            };
          }),
        );
      } catch {
        if (!active) return;
        setMissions([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadMissions();

    return () => {
      active = false;
    };
  }, []);

  return {
    missions,
    loading,
    claimMission,
  };
}

export function useHotStreak() {
  const [streakState, setStreakState] = useState<HotStreak>(() => mapHotStreak(null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadHotStreak = async () => {
      setLoading(true);

      try {
        const user = await getAuthUser();
        if (!user) {
          if (active) setStreakState(mapHotStreak(null));
          return;
        }

        const { data, error } = await supabase
          .from("hot_streak_multipliers")
          .select("consecutive_days, current_multiplier, last_active_date")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;
        if (!active) return;
        setStreakState(mapHotStreak(data as HotStreakRow | null));
      } catch {
        if (!active) return;
        setStreakState(mapHotStreak(null));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadHotStreak();

    return () => {
      active = false;
    };
  }, []);

  return {
    streak: streakState.consecutiveDays,
    multiplier: streakState.currentMultiplier,
    loading,
  };
}

export function useRewardChest() {
  const [chest, setChest] = useState<RewardChest | null>(null);
  const [loading, setLoading] = useState(true);

  const claimChest = useCallback(async () => {
    const currentChest = chest;
    if (!currentChest) return null;

    const { error } = await supabase
      .from("league_reward_chests")
      .update({
        opened: true,
        opened_at: new Date().toISOString(),
      })
      .eq("id", currentChest.id);

    if (error) {
      return null;
    }

    setChest(null);
    return currentChest;
  }, [chest]);

  useEffect(() => {
    let active = true;

    const loadRewardChest = async () => {
      setLoading(true);

      try {
        const user = await getAuthUser();
        if (!user) {
          if (active) setChest(null);
          return;
        }

        const { data, error } = await supabase
          .from("league_reward_chests")
          .select("id, chest_tier, xp_reward, multiplier_reward, multiplier_duration_days, streak_shield, cosmetic_item, opened")
          .eq("user_id", user.id)
          .eq("opened", false)
          .order("created_at", { ascending: false })
          .limit(1);

        if (error) throw error;
        if (!active) return;

        const row = ((data ?? []) as RewardChestRow[])[0] ?? null;
        setChest(mapRewardChest(row));
      } catch {
        if (!active) return;
        setChest(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadRewardChest();

    return () => {
      active = false;
    };
  }, []);

  return {
    chest,
    claimChest,
    loading,
  };
}

export function useOvertakeEvents(leagueGroupId: string | null) {
  const [events, setEvents] = useState<OvertakeEvent[]>([]);

  useEffect(() => {
    if (!leagueGroupId) {
      setEvents([]);
      return undefined;
    }

    let active = true;

    const loadEvents = async () => {
      try {
        const { data, error } = await supabase
          .from("overtake_events")
          .select("id, overtaker_user_id, overtaken_user_id, is_clutch, created_at")
          .eq("league_group_id", leagueGroupId)
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) throw error;
        if (!active) return;

        const rows = (data ?? []) as OvertakeEventRow[];
        const uniqueUserIds = Array.from(new Set(rows.flatMap((row) => [row.overtaker_user_id, row.overtaken_user_id])));
        let nameMap = new Map<string, string>();

        if (uniqueUserIds.length > 0) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("id, username")
            .in("id", uniqueUserIds);

          if (profileError) throw profileError;
          if (!active) return;

          nameMap = new Map(
            ((profileData ?? []) as ProfileUsernameRow[]).map((row) => [row.id, row.username ?? "Pico learner"]),
          );
        }

        setEvents(
          rows.map((row) => ({
            id: row.id,
            overtakerUserId: row.overtaker_user_id,
            overtakerUsername: nameMap.get(row.overtaker_user_id) ?? "Pico learner",
            overtakenUserId: row.overtaken_user_id,
            overtakenUsername: nameMap.get(row.overtaken_user_id) ?? "Pico learner",
            isClutch: Boolean(row.is_clutch),
            createdAt: row.created_at,
          })),
        );
      } catch {
        if (!active) return;
        setEvents([]);
      }
    };

    void loadEvents();

    const channel = supabase
      .channel(`overtake-events-${leagueGroupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "overtake_events",
          filter: `league_group_id=eq.${leagueGroupId}`,
        },
        () => {
          void loadEvents();
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [leagueGroupId]);

  return { events };
}

export function useWeekRecap() {
  const [recap, setRecap] = useState<WeekRecap | null>(null);
  const [hasUnseenRecap, setHasUnseenRecap] = useState(false);
  const [loading, setLoading] = useState(true);

  const markSeen = useCallback(() => {
    if (!recap || typeof window === "undefined") return;

    window.localStorage.setItem(getRecapStorageKey(recap.leagueWeekId), "true");
    setHasUnseenRecap(false);
  }, [recap]);

  useEffect(() => {
    let active = true;

    const loadRecap = async () => {
      setLoading(true);

      try {
        const user = await getAuthUser();
        if (!user) {
          if (active) {
            setRecap(null);
            setHasUnseenRecap(false);
          }
          return;
        }

        const { data, error } = await supabase
          .from("week_recap_snapshots")
          .select("league_week_id, xp_earned, players_passed, peak_rank, final_rank, missions_completed, result, league_name, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (error) throw error;
        if (!active) return;

        const row = ((data ?? []) as WeekRecapRow[])[0] ?? null;
        const nextRecap = mapWeekRecap(row);
        setRecap(nextRecap);

        if (typeof window === "undefined" || !nextRecap) {
          setHasUnseenRecap(false);
          return;
        }

        const seen = window.localStorage.getItem(getRecapStorageKey(nextRecap.leagueWeekId));
        setHasUnseenRecap(seen !== "true");
      } catch {
        if (!active) return;
        setRecap(null);
        setHasUnseenRecap(false);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadRecap();

    return () => {
      active = false;
    };
  }, []);

  return {
    recap,
    hasUnseenRecap,
    markSeen,
    loading,
  };
}

export function useDistanceToPromotion(myRank: number, myXp: number, entries: LeaderboardEntry[]) {
  return useMemo(() => {
    if (entries.length === 0) {
      return {
        xpToPromotion: 0,
        xpToDemotion: 0,
        percentToPromotion: 0,
      };
    }

    const promotionEntry = entries[Math.min(entries.length - 1, PROMOTION_CUTOFF - 1)];
    const safeRankIndex = Math.max(0, entries.length - DEMOTION_CUTOFF - 1);
    const safeEntry = entries[safeRankIndex];
    const promotionXp = promotionEntry?.xpThisWeek ?? myXp;
    const safeXp = safeEntry?.xpThisWeek ?? myXp;
    const xpToPromotion = myRank <= PROMOTION_CUTOFF ? 0 : Math.max(0, promotionXp - myXp + 1);
    const xpToDemotion = myXp - safeXp;

    let percentToPromotion = 0;
    if (myRank <= PROMOTION_CUTOFF) {
      percentToPromotion = 100;
    } else if (promotionXp <= safeXp) {
      const depth = Math.max(1, entries.length - PROMOTION_CUTOFF);
      percentToPromotion = Math.max(0, Math.min(100, ((entries.length - myRank) / depth) * 100));
    } else {
      percentToPromotion = Math.max(
        0,
        Math.min(100, ((myXp - safeXp) / (promotionXp - safeXp)) * 100),
      );
    }

    return {
      xpToPromotion,
      xpToDemotion,
      percentToPromotion: Number(percentToPromotion.toFixed(1)),
    };
  }, [entries, myRank, myXp]);
}
