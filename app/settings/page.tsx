import type { Metadata } from "next";
import SettingsPageClient from "@/components/settings/SettingsPageClient";

export const metadata: Metadata = {
  title: "Settings · Pico",
  description: "Adjust Pico preferences, accessibility, and data controls.",
};

export default function SettingsPage() {
  return <SettingsPageClient />;
}
