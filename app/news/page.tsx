import type { Metadata } from "next";
import NewsApp from "./_components/NewsApp";

export const metadata: Metadata = {
  title: "Legal News — Lawbite",
  description:
    "Stay updated with the latest Indian legal news, landmark judgments, and law changes.",
};

export default function NewsPage() {
  return <NewsApp />;
}
