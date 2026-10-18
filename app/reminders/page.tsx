import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import RemindersApp from "./_components/RemindersApp";

export const metadata: Metadata = {
  title: "Deadline Reminder — Lawbite",
  description: "Track court dates, filing deadlines, and limitation periods.",
};

export default async function RemindersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/signin");
  }

  return <RemindersApp />;
}
