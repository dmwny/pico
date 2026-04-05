"use client";

import { useParams, useSearchParams } from "next/navigation";
import UnitChallengeClient from "@/components/lessonArc/UnitChallengeClient";

export default function UnitChallengePage() {
  const params = useParams();
  const searchParams = useSearchParams();

  return (
    <UnitChallengeClient
      unitId={String(params.unit ?? "")}
      requestedLanguage={searchParams.get("lang")}
    />
  );
}
