import type { Metadata } from "next";
import LegalLayout from "../_components/LegalLayout";

export const metadata: Metadata = {
  title: "Disclaimer — Lawbite",
  description:
    "Limitations of liability and the boundaries of the information Lawbite provides.",
};

export default function DisclaimerPage() {
  return (
    <LegalLayout
      title="Disclaimer"
      description="Limitations of liability, no legal advice, and the boundaries of the information we provide."
      lastUpdated="Last updated: January 2026"
    >
      <section>
        <h2 className="text-xl font-semibold text-white">1. No Legal Advice</h2>
        <p className="mt-3">
          The content, templates, and outputs available through Lawbite are
          provided for general informational purposes only. They do not
          constitute legal advice, legal opinion, or a solicitor&ndash;client
          relationship. You should consult a qualified legal professional before
          relying on any information provided by the Service for a specific
          matter.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">2. No Warranty</h2>
        <p className="mt-3">
          The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as
          available&rdquo; basis without warranties of any kind, whether express
          or implied, including but not limited to warranties of
          merchantability, fitness for a particular purpose, and
          non-infringement. We do not warrant that the Service will be
          uninterrupted, error-free, or free of harmful components.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">
          3. Accuracy of Information
        </h2>
        <p className="mt-3">
          We strive to keep information on the Service accurate and up to date,
          but we make no representations or warranties about the completeness,
          accuracy, reliability, or suitability of the information. Laws and
          regulations change frequently, and the applicability of any
          information may vary based on your jurisdiction and circumstances.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">
          4. Third-Party Links
        </h2>
        <p className="mt-3">
          The Service may contain links to third-party websites or resources. We
          are not responsible for the content, policies, or practices of any
          third-party sites or services. Accessing them is at your own risk.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">
          5. Limitation of Liability
        </h2>
        <p className="mt-3">
          To the maximum extent permitted by law, Lawbite and its affiliates,
          officers, employees, and partners shall not be liable for any
          indirect, incidental, special, consequential, or punitive damages,
          including loss of profits, data, or goodwill, arising from or related
          to your use of the Service.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">
          6. Changes to this Disclaimer
        </h2>
        <p className="mt-3">
          We may update this Disclaimer from time to time. Material changes will
          be communicated through the Service, and the &ldquo;Last
          updated&rdquo; date will be revised accordingly.
        </p>
      </section>
    </LegalLayout>
  );
}
