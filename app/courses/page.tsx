"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { navigateWithAuth } from "@/lib/auth";

export default function CoursesRoute() {
  const router = useRouter();

  useEffect(() => {
    void navigateWithAuth(router, "/courses", "/languages", true);
  }, [router]);

  return null;
}
