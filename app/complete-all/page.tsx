import { notFound } from "next/navigation";
import CompleteAllClient from "@/components/CompleteAllClient";

export default function CompleteAllPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <CompleteAllClient />;
}
