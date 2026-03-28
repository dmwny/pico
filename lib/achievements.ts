export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_lesson",
    title: "First Step",
    description: "Complete your first lesson",
    icon: "🎯",
    color: "bg-green-500",
  },
  {
    id: "perfect_lesson",
    title: "Perfect!",
    description: "Complete a lesson without any mistakes",
    icon: "⭐",
    color: "bg-yellow-500",
  },
  {
    id: "streak_3",
    title: "On Fire",
    description: "Get 3 correct answers in a row",
    icon: "🔥",
    color: "bg-orange-500",
  },
  {
    id: "streak_7",
    title: "Week Warrior",
    description: "Maintain a 7 day streak",
    icon: "🗓️",
    color: "bg-blue-500",
  },
  {
    id: "xp_100",
    title: "Century",
    description: "Earn 100 XP",
    icon: "💯",
    color: "bg-purple-500",
  },
  {
    id: "xp_500",
    title: "XP Hunter",
    description: "Earn 500 XP",
    icon: "💎",
    color: "bg-cyan-500",
  },
  {
    id: "unit_1",
    title: "Basics Master",
    description: "Complete Unit 1",
    icon: "🏆",
    color: "bg-green-600",
  },
  {
    id: "speed_demon",
    title: "Speed Demon",
    description: "Complete a lesson in under 90 seconds",
    icon: "⚡",
    color: "bg-yellow-400",
  },
  {
    id: "halfway",
    title: "Halfway There",
    description: "Complete 6 units",
    icon: "🎖️",
    color: "bg-indigo-500",
  },
  {
    id: "graduate",
    title: "Python Graduate",
    description: "Complete all 12 units",
    icon: "🎓",
    color: "bg-green-700",
  },
];

export function checkAchievements(
  completedLessons: string[],
  xp: number,
  streak: number,
  perfectLesson: boolean,
  lessonTime: number,
  consecutiveCorrect: number,
): string[] {
  const earned: string[] = [];

  if (completedLessons.length >= 1) earned.push("first_lesson");
  if (perfectLesson) earned.push("perfect_lesson");
  if (consecutiveCorrect >= 3) earned.push("streak_3");
  if (streak >= 7) earned.push("streak_7");
  if (xp >= 100) earned.push("xp_100");
  if (xp >= 500) earned.push("xp_500");
  if (lessonTime <= 90) earned.push("speed_demon");

  const completedUnits = new Set(completedLessons.map(l => l.split("-")[0]));
  if (completedUnits.size >= 1) earned.push("unit_1");
  if (completedUnits.size >= 6) earned.push("halfway");
  if (completedUnits.size >= 12) earned.push("graduate");

  return earned;
}