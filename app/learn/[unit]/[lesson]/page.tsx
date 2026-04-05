"use client";

import { useParams, useSearchParams } from "next/navigation";
import LessonArcClient from "@/components/lessonArc/LessonArcClient";

export default function LessonPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  return (
    <LessonArcClient
      unitId={String(params.unit ?? "")}
      lessonId={String(params.lesson ?? "")}
      requestedLanguage={searchParams.get("lang")}
      reviewMode={searchParams.get("mode") === "review"}
    />
  );
}
