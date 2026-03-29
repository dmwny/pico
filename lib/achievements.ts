export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string; // SVG icon name
  gradient: string; // CSS gradient for the icon background
  rarity: "common" | "rare" | "epic" | "legendary";
};

export const ACHIEVEMENTS: Achievement[] = [
  // ── Common ──────────────────────────────────────────────────────────────
  {
    id: "first_lesson",
    title: "First Steps",
    description: "Complete your very first lesson",
    icon: "footprints",
    gradient: "from-emerald-400 to-green-600",
    rarity: "common",
  },
  {
    id: "streak_3",
    title: "On Fire",
    description: "Get 3 correct answers in a row in a single lesson",
    icon: "flame",
    gradient: "from-orange-400 to-red-500",
    rarity: "common",
  },
  {
    id: "xp_100",
    title: "Centurion",
    description: "Accumulate 100 XP total",
    icon: "zap",
    gradient: "from-amber-400 to-yellow-600",
    rarity: "common",
  },

  // ── Rare ────────────────────────────────────────────────────────────────
  {
    id: "perfect_lesson",
    title: "Flawless",
    description: "Finish a lesson without a single mistake",
    icon: "star",
    gradient: "from-yellow-400 to-amber-500",
    rarity: "rare",
  },
  {
    id: "speed_demon",
    title: "Speed Demon",
    description: "Complete a lesson in under 90 seconds",
    icon: "bolt",
    gradient: "from-sky-400 to-blue-600",
    rarity: "rare",
  },
  {
    id: "xp_500",
    title: "XP Hoarder",
    description: "Accumulate 500 XP total",
    icon: "gem",
    gradient: "from-violet-400 to-purple-600",
    rarity: "rare",
  },
  {
    id: "streak_7",
    title: "Week Warrior",
    description: "Maintain a 7-day login streak",
    icon: "calendar",
    gradient: "from-blue-400 to-indigo-600",
    rarity: "rare",
  },
  {
    id: "night_owl",
    title: "Night Owl",
    description: "Complete a lesson after 11 PM",
    icon: "moon",
    gradient: "from-indigo-500 to-slate-700",
    rarity: "rare",
  },

  // ── Epic ────────────────────────────────────────────────────────────────
  {
    id: "unit_1",
    title: "Print Master",
    description: "Complete every lesson in Unit 1",
    icon: "trophy",
    gradient: "from-emerald-500 to-teal-700",
    rarity: "epic",
  },
  {
    id: "xp_1000",
    title: "Thousandaire",
    description: "Accumulate 1,000 XP total",
    icon: "crown",
    gradient: "from-amber-500 to-orange-600",
    rarity: "epic",
  },
  {
    id: "perfect_3",
    title: "Hat Trick",
    description: "Get 3 perfect lessons (lifetime)",
    icon: "bullseye",
    gradient: "from-rose-400 to-pink-600",
    rarity: "epic",
  },
  {
    id: "halfway",
    title: "Halfway There",
    description: "Complete 6 of the 12 units",
    icon: "mountain",
    gradient: "from-teal-400 to-cyan-600",
    rarity: "epic",
  },

  // ── Legendary ───────────────────────────────────────────────────────────
  {
    id: "graduate",
    title: "Python Graduate",
    description: "Complete all 12 units",
    icon: "scroll",
    gradient: "from-amber-400 via-yellow-500 to-orange-500",
    rarity: "legendary",
  },
  {
    id: "all_perfect",
    title: "The Perfectionist",
    description: "Complete every lesson with a perfect score",
    icon: "diamond",
    gradient: "from-fuchsia-400 via-purple-500 to-indigo-600",
    rarity: "legendary",
  },
];

export function checkAchievements(
  completedLessons: string[],
  xp: number,
  streak: number,
  perfectLesson: boolean,
  lessonTime: number,
  consecutiveCorrect: number,
  totalPerfectLessons?: number,
): string[] {
  const earned: string[] = [];

  if (completedLessons.length >= 1) earned.push("first_lesson");
  if (perfectLesson) earned.push("perfect_lesson");
  if (consecutiveCorrect >= 3) earned.push("streak_3");
  if (streak >= 7) earned.push("streak_7");
  if (xp >= 100) earned.push("xp_100");
  if (xp >= 500) earned.push("xp_500");
  if (xp >= 1000) earned.push("xp_1000");
  if (lessonTime <= 90) earned.push("speed_demon");

  // Time-based
  const hour = new Date().getHours();
  if (hour >= 23 || hour < 4) earned.push("night_owl");

  // Perfect lesson count
  if (totalPerfectLessons && totalPerfectLessons >= 3) earned.push("perfect_3");

  // Unit-based
  const completedUnits = new Set(completedLessons.map((l) => l.split("-")[0]));
  // Check if unit 1 is fully complete (4 lessons)
  const unit1Lessons = completedLessons.filter((l) => l.startsWith("1-"));
  if (unit1Lessons.length >= 4) earned.push("unit_1");
  if (completedUnits.size >= 6) earned.push("halfway");
  if (completedUnits.size >= 12) earned.push("graduate");

  // All perfect — need all 48 lessons completed perfectly (simplified check)
  if (completedLessons.length >= 48 && totalPerfectLessons && totalPerfectLessons >= 48) {
    earned.push("all_perfect");
  }

  return earned;
}