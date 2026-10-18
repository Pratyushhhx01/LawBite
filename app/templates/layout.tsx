import type { ReactNode } from "react";
import Footer from "../components/Footer";
import NavbarWrapper from "../components/NavbarWrapper";

export default function TemplatesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate flex min-h-screen flex-col bg-black text-white">
      <NavbarWrapper />
      <main className="relative z-10 flex flex-1 flex-col">{children}</main>
      <Footer />
    </div>
  );
}
