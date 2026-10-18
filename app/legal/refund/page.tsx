import type { Metadata } from "next";
import LegalLayout from "../_components/LegalLayout";

export const metadata: Metadata = {
  title: "Refund Policy — Lawbite",
  description:
    "Eligibility, timelines, and the process for requesting a refund of paid plans or one-off services.",
};

export default function RefundPage() {
  return (
    <LegalLayout
      title="Refund Policy"
      description="Eligibility, timelines, and the process for requesting a refund of paid plans or one-off services."
      lastUpdated="Last updated: January 2026"
    >
      <section>
        <h2 className="text-xl font-semibold text-white">1. Scope</h2>
        <p className="mt-3">
          This Refund Policy applies to fees paid to Lawbite for paid
          subscriptions, add-on services, and one-off engagements. It does not
          affect any mandatory rights you may have under consumer protection
          laws in your jurisdiction.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">
          2. Subscription Plans
        </h2>
        <p className="mt-3">
          You may cancel a subscription at any time. Cancellation stops future
          renewals but does not, by default, refund the current billing period.
          If you cancel within fourteen (14) days of a first-time subscription
          and have not used paid features, we will refund the full amount.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">
          3. One-Off Services
        </h2>
        <p className="mt-3">
          For one-off services (for example, fixed-scope engagements), we will
          refund amounts paid for work not yet performed. Where work has
          commenced, we will issue a partial refund proportional to the work
          remaining.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">
          4. How to Request a Refund
        </h2>
        <p className="mt-3">
          To request a refund, contact us at{" "}
          <span className="text-white">billing@lawbite.example</span> with your
          account email, the order or invoice number, and a short description of
          the request. We will acknowledge your request within five (5) business
          days.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">5. Processing Time</h2>
        <p className="mt-3">
          Approved refunds are issued to the original payment method. Depending
          on your bank or card issuer, the credit may take five&ndash;ten
          (5&ndash;10) business days to appear on your statement.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">6. Exceptions</h2>
        <p className="mt-3">
          We do not provide refunds where (a) the request is made outside the
          eligible window, (b) usage of paid features has materially exceeded
          what is reasonable for a trial period, or (c) the account is
          terminated for a material breach of the Terms of Service.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">
          7. Changes to this Policy
        </h2>
        <p className="mt-3">
          We may update this Refund Policy from time to time. Material changes
          will be communicated in advance where reasonably possible, and the
          &ldquo;Last updated&rdquo; date will be revised.
        </p>
      </section>
    </LegalLayout>
  );
}
