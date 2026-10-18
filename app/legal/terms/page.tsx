import type { Metadata } from "next";
import LegalLayout from "../_components/LegalLayout";

export const metadata: Metadata = {
  title: "Terms of Service — Lawbite",
  description:
    "The rules, rights, and responsibilities that govern your use of the Lawbite platform.",
};

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      description="The rules, rights, and responsibilities that govern your use of the Lawbite platform."
      lastUpdated="Last updated: January 2026"
    >
      <section>
        <h2 className="text-xl font-semibold text-white">1. Acceptance</h2>
        <p className="mt-3">
          By accessing or using Lawbite (the &ldquo;Service&rdquo;), you agree
          to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do
          not agree, you must not use the Service. If you are accepting these
          Terms on behalf of an organisation, you represent that you have
          authority to bind that organisation.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">2. Accounts</h2>
        <p className="mt-3">
          You are responsible for maintaining the confidentiality of your
          account credentials and for all activities that occur under your
          account. You agree to provide accurate, current, and complete
          information and to update it as necessary.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">3. Acceptable Use</h2>
        <p className="mt-3">
          You agree not to misuse the Service. This includes, without
          limitation, using the Service to:
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li>Violate any applicable law or regulation.</li>
          <li>Infringe the rights of any third party.</li>
          <li>
            Upload malicious code, attempt to disrupt the Service, or probe its
            security without authorisation.
          </li>
          <li>
            Reverse engineer, decompile, or otherwise attempt to derive source
            code from the Service except as permitted by law.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">
          4. Subscription, Fees &amp; Billing
        </h2>
        <p className="mt-3">
          Paid plans are billed in advance on a recurring basis. Fees are
          non-refundable except as expressly stated in our Refund Policy. We may
          change fees with reasonable notice; continued use after a change
          constitutes acceptance of the new fees.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">
          5. Intellectual Property
        </h2>
        <p className="mt-3">
          We retain all rights, title, and interest in and to the Service,
          including all related intellectual property. You retain ownership of
          the content you upload. You grant us a limited licence to host and
          process that content solely to provide the Service to you.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">6. Termination</h2>
        <p className="mt-3">
          We may suspend or terminate your access to the Service at any time if
          we reasonably believe you have violated these Terms. You may stop
          using the Service at any time. Sections that by their nature should
          survive termination will do so.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">
          7. Changes to the Terms
        </h2>
        <p className="mt-3">
          We may update these Terms from time to time. The &ldquo;Last
          updated&rdquo; date will reflect the date of the most recent change.
          Your continued use of the Service after changes take effect
          constitutes acceptance of the revised Terms.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">8. Governing Law</h2>
        <p className="mt-3">
          These Terms are governed by the laws of the jurisdiction in which
          Lawbite is incorporated, without regard to conflict-of-laws
          principles. Any disputes will be resolved in the competent courts of
          that jurisdiction.
        </p>
      </section>
    </LegalLayout>
  );
}
