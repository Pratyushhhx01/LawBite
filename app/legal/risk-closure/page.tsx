import type { Metadata } from "next";
import LegalLayout from "../_components/LegalLayout";

export const metadata: Metadata = {
  title: "Risk Closure — Lawbite",
  description:
    "Acknowledgement of the inherent risks of using automated legal workflows.",
};

export default function RiskClosurePage() {
  return (
    <LegalLayout
      title="Risk Closure"
      description="Acknowledgement of the inherent risks of using automated legal workflows and our shared responsibilities."
      lastUpdated="Last updated: January 2026"
    >
      <section>
        <h2 className="text-xl font-semibold text-white">1. Overview</h2>
        <p className="mt-3">
          Lawbite provides tools that help legal teams draft, review, and manage
          documents and matters. Like all software that operates on information
          you care about, there are inherent risks you should understand before
          relying on the Service. This page makes those risks explicit and
          explains our shared responsibilities.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">2. Inherent Risks</h2>
        <p className="mt-3">
          By using the Service, you acknowledge and accept risks that include
          but are not limited to:
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li>
            <strong className="text-white/90">Output variability:</strong>{" "}
            automated drafting and review tools may produce content that is
            incomplete, inaccurate, or unsuitable for your matter.
          </li>
          <li>
            <strong className="text-white/90">Jurisdictional shifts:</strong>{" "}
            laws and regulations change; an output that was accurate when
            produced may become outdated.
          </li>
          <li>
            <strong className="text-white/90">Service availability:</strong>{" "}
            despite our efforts, the Service may be temporarily unavailable or
            degraded.
          </li>
          <li>
            <strong className="text-white/90">Data exposure:</strong> despite
            reasonable safeguards, no system is immune from unauthorised access.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">
          3. Assumption of Risk
        </h2>
        <p className="mt-3">
          You assume responsibility for reviewing and validating any output
          before relying on it. You agree that the final decision to use, send,
          file, or otherwise rely on a document or recommendation produced by
          the Service is yours alone, and that professional judgement by a
          qualified lawyer remains essential.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">
          4. Mitigation Practices
        </h2>
        <p className="mt-3">
          We mitigate these risks through practices such as access controls,
          encryption in transit and at rest, routine testing, audit logs, and a
          published incident response process. We expect you to use the Service
          responsibly, including by enabling available security features,
          training authorised users, and monitoring activity under your account.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">
          5. Closure of Known Risks
        </h2>
        <p className="mt-3">
          By continuing to use the Service after reviewing this page, you
          confirm that you have been informed of the risks above, that you
          accept them, and that you waive any claim against Lawbite arising
          solely from those risks where Lawbite has complied with its
          obligations under the Terms of Service and applicable law.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">6. Contact</h2>
        <p className="mt-3">
          Questions about this Risk Closure notice can be sent to{" "}
          <span className="text-white">legal@lawbite.example</span>.
        </p>
      </section>
    </LegalLayout>
  );
}
