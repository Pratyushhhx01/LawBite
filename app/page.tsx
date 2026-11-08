import CTASection from "./components/CTASection";
import FAQ from "./components/FAQ";
import Features from "./components/Features";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import Marquee from "./components/Marquee";
import NavbarWrapper from "./components/NavbarWrapper";
import ReloadScrollReset from "./components/ReloadScrollReset";
import SectionHashScroll from "./components/SectionHashScroll";
import Showcase from "./components/Showcase";
import Stats from "./components/Stats";
import Testimonials from "./components/Testimonials";
import Verification from "./components/Verification";

const marqueeItems = [
  "157+ Indian Bare Acts",
  "Instant Legal Answers",
  "IPC \u00b7 BNS \u00b7 CrPC \u00b7 BNSS",
  "AI-Powered Legal Research",
  "Section-Level Retrieval",
  "Free to Start",
];

export default function Home() {
  return (
    <div className="relative isolate flex min-h-screen flex-col bg-black text-white">
      <SectionHashScroll />
      <ReloadScrollReset />
      <NavbarWrapper />
      <main className="relative z-10 flex flex-1 flex-col">
        <Hero />
        <Marquee items={marqueeItems} />
        <Features />
        <Showcase />
        <HowItWorks />
        <Verification />
        <Marquee items={marqueeItems.slice().reverse()} reverse />
        <Stats />
        <Testimonials />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
