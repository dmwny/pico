"use client";

import dynamic from "next/dynamic";

const ApiMiniCourseLessonClient = dynamic(
  () => import("@/components/minicourse/ApiMiniCourseLessonClient"),
  {
    ssr: false,
    loading: () => (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-gray-100 bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-black text-gray-900">Loading lesson...</p>
        </div>
      </main>
    ),
  }
);

export default function ApiMiniCourseLessonPage() {
  return <ApiMiniCourseLessonClient />;
}
