import type { Metadata } from "next";
import CompanyLayout from "../../company/_components/CompanyLayout";

export const metadata: Metadata = {
  title: "Contact — Lawbite",
  description: "Get in touch with the Lawbite team.",
};

export default function ContactPage() {
  return (
    <CompanyLayout
      title="Get in Touch"
      description="Have a question, suggestion, or need support? We'd love to hear from you."
    >
      <section>
        <h2 className="text-xl font-semibold text-white">
          Contact Information
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-white/40">
              Email
            </p>
            <p className="mt-1 text-white/90">hello@lawbite.example</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-white/40">
              Support
            </p>
            <p className="mt-1 text-white/90">support@lawbite.example</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-white/40">
              Social
            </p>
            <p className="mt-1 text-white/90">
              X (Twitter) &middot; LinkedIn &middot; GitHub
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">Response Time</h2>
        <p className="mt-3">
          We aim to respond to all inquiries within 24&ndash;48 hours during
          business days. For urgent matters, please include &ldquo;Urgent&rdquo;
          in your subject line.
        </p>
      </section>
    </CompanyLayout>
  );
}
