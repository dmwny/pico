"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

const ApiMiniCourseMapClient = dynamic(
  () => import("@/components/minicourse/ApiMiniCourseMapClient"),
  {
    ssr: false,
    loading: () => (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-gray-100 bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-black text-gray-900">Loading mini course...</p>
        </div>
      </main>
    ),
  }
);

const RobloxStudioMapClient = dynamic(
  () => import("@/components/minicourse/RobloxStudioMapClient"),
  {
    ssr: false,
    loading: () => (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-gray-100 bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-black text-gray-900">Loading mini course...</p>
        </div>
      </main>
    ),
  }
);

export default function ApiMiniCoursePage() {
  const params = useParams<{ language?: string; course?: string }>();
  const isRobloxStudio = params.language === "lua" && params.course === "roblox-studio";

  if (isRobloxStudio) {
    return <RobloxStudioMapClient />;
  }

  return <ApiMiniCourseMapClient />;
}
