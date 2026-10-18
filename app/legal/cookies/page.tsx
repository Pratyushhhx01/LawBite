import type { Metadata } from "next";
import LegalLayout from "../_components/LegalLayout";

export const metadata: Metadata = {
  title: "Cookies Policy — Lawbite",
  description:
    "The cookies and similar technologies Lawbite uses, and how you can manage them.",
};

export default function CookiesPage() {
  return (
    <LegalLayout
      title="Cookies Policy"
      description="The cookies and similar technologies we use, why we use them, and how you can manage them."
      lastUpdated="Last updated: January 2026"
    >
      <section>
        <h2 className="text-xl font-semibold text-white">
          1. What Are Cookies?
        </h2>
        <p className="mt-3">
          Cookies are small text files that websites store on your device to
          remember information about your visit. We also use similar
          technologies, such as local storage and pixels, which are referred to
          collectively as &ldquo;cookies&rdquo; in this Policy.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">2. Cookies We Use</h2>
        <p className="mt-3">We use cookies for the following purposes:</p>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li>
            <strong className="text-white/90">Strictly necessary:</strong>{" "}
            authentication, session integrity, and security. These cannot be
            disabled.
          </li>
          <li>
            <strong className="text-white/90">Preferences:</strong> remembering
            choices such as theme, language, and layout.
          </li>
          <li>
            <strong className="text-white/90">Analytics:</strong> aggregated
            usage data that helps us understand and improve the Service.
          </li>
          <li>
            <strong className="text-white/90">Marketing:</strong> only where you
            have opted in, to measure the effectiveness of campaigns.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">
          3. Managing Cookies
        </h2>
        <p className="mt-3">
          You can manage cookies through your browser settings. Most browsers
          allow you to block, clear, or selectively permit cookies. Where we
          offer a cookie banner or preference centre, your choices there are
          also stored. Disabling certain cookies may affect the functionality of
          the Service.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">
          4. Third-Party Cookies
        </h2>
        <p className="mt-3">
          Some cookies are set by third parties whose services we use, such as
          analytics and error monitoring providers. These third parties may use
          cookies to collect information about your online activity across
          different websites.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">
          5. Updates to this Policy
        </h2>
        <p className="mt-3">
          We may update this Cookies Policy from time to time. The &ldquo;Last
          updated&rdquo; date at the top of this page will be revised when
          changes are made.
        </p>
      </section>
    </LegalLayout>
  );
}
