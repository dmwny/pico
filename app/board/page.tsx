"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { navigateWithAuth } from "@/lib/auth";

export default function BoardRoute() {
  const router = useRouter();

  useEffect(() => {
    void navigateWithAuth(router, "/board", "/learn", true);
  }, [router]);

  return null;
}
