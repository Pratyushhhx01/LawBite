import type { Metadata } from "next";
import LegalLayout from "../_components/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy — Lawbite",
  description:
    "How Lawbite collects, uses, and protects your information when you use our platform.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      description="How we collect, use, store, and protect information when you use Lawbite."
      lastUpdated="Last updated: January 2026"
    >
      <section>
        <h2 className="text-xl font-semibold text-white">1. Introduction</h2>
        <p className="mt-3">
          This Privacy Policy describes how Lawbite (&ldquo;we&rdquo;,
          &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses, and shares
          information about you when you access or use our website, products,
          and services (collectively, the &ldquo;Service&rdquo;). By using the
          Service, you agree to the terms of this Policy.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">
          2. Information We Collect
        </h2>
        <p className="mt-3">
          We collect information you provide directly, information collected
          automatically as you use the Service, and limited information from
          third-party integrations you choose to connect.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li>
            <strong className="text-white/90">Account information:</strong>{" "}
            name, email, organisation, role, and authentication credentials.
          </li>
          <li>
            <strong className="text-white/90">Content you submit:</strong>{" "}
            documents, matter details, drafts, and other materials you upload or
            generate through the Service.
          </li>
          <li>
            <strong className="text-white/90">Usage data:</strong> device and
            browser information, IP address, pages viewed, and feature usage
            used to operate and improve the Service.
          </li>
          <li>
            <strong className="text-white/90">Billing data:</strong> handled by
            our payment processor; we do not store full payment card numbers.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">
          3. How We Use Information
        </h2>
        <p className="mt-3">
          We use the information we collect to provide, maintain, secure, and
          improve the Service, to process transactions, to communicate with you,
          and to comply with legal obligations. We do not use your content to
          train third-party models without your explicit consent.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">4. Sharing</h2>
        <p className="mt-3">
          We do not sell your personal information. We share information only
          with your consent, with service providers that help us operate the
          Service, or where required by law.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">
          5. Data Retention &amp; Security
        </h2>
        <p className="mt-3">
          We retain information for as long as your account is active or as
          needed to provide the Service, comply with our legal obligations,
          resolve disputes, and enforce agreements. We employ administrative,
          technical, and physical safeguards designed to protect your
          information.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">6. Your Rights</h2>
        <p className="mt-3">
          Depending on your location, you may have rights to access, correct,
          delete, or export your personal information, or to object to or
          restrict its processing. Contact us at the address below to exercise
          these rights.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">7. Contact</h2>
        <p className="mt-3">
          If you have questions about this Policy, please contact us at{" "}
          <span className="text-white">privacy@lawbite.example</span>.
        </p>
      </section>
    </LegalLayout>
  );
}
