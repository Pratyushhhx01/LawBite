"use client";

import { useState } from "react";
import { exportAsWord, exportAsPdf } from "@/lib/export";
import { AUTHORITIES } from "@/lib/authorities";

/* ─── Shared helpers ─── */

function formatDate(): string {
  return new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ─── Templates Modal ─── */

interface TemplateField {
  label: string;
  placeholder?: string;
  type?: "text" | "textarea" | "date";
  required?: boolean;
}

interface Template {
  id: string;
  name: string;
  category: string;
  icon: string;
  fields: TemplateField[];
  generate: (data: Record<string, string>) => string;
}

const TEMPLATES: Template[] = [
  {
    id: "rental",
    name: "Rental Agreement",
    category: "Property",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    fields: [
      { label: "Landlord Name", required: true },
      { label: "Landlord Address", required: true },
      { label: "Tenant Name", required: true },
      { label: "Tenant Address", required: true },
      { label: "Property Address", required: true },
      { label: "Monthly Rent", required: true },
      { label: "Security Deposit", required: true },
      { label: "Lease Start Date", type: "date", required: true },
      { label: "Lease Duration", placeholder: "e.g. 11 months" },
      { label: "Notice Period", placeholder: "e.g. 2 months" },
    ],
    generate: (d) =>
      `RENTAL / LEASE AGREEMENT\n\nDate: ${formatDate()}\n\nThis Rental Agreement is entered into on ${d["Lease Start Date"] || "[Date]"} at [City], between:\n\nLANDLORD: ${d["Landlord Name"]}, residing at ${d["Landlord Address"]}\nAND\nTENANT: ${d["Tenant Name"]}, residing at ${d["Tenant Address"]}\n\n1. PROPERTY: The Landlord agrees to let the Premises at ${d["Property Address"]} for residential purposes.\n\n2. TERM: Commencing on ${d["Lease Start Date"] || "[Date]"} for ${d["Lease Duration"] || "11 months"}.\n\n3. RENT: Monthly rent of Rs. ${d["Monthly Rent"] || "[Amount]"}, payable in advance by the 5th of each month.\n\n4. SECURITY DEPOSIT: Rs. ${d["Security Deposit"] || "[Amount]"}, refundable at vacation subject to deductions.\n\n5. The Tenant shall pay electricity, water, and gas charges. Structural repairs are the Landlord's responsibility.\n\n6. TERMINATION: Either party may terminate with ${d["Notice Period"] || "2 months"} written notice.\n\nIN WITNESS WHEREOF, the parties have executed this Agreement.\n\nLANDLORD: ${d["Landlord Name"] || "___________________"} Signature: ___________________\nTENANT: ${d["Tenant Name"] || "___________________"} Signature: ___________________\n\n[DISCLAIMER: AI-generated draft for reference only. Consult a practicing lawyer before signing.]`,
  },
  {
    id: "employment",
    name: "Employment Contract",
    category: "Employment",
    icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    fields: [
      { label: "Company Name", required: true },
      { label: "Company Address", required: true },
      { label: "Employee Name", required: true },
      { label: "Designation", required: true },
      { label: "Monthly Salary", required: true },
      { label: "Joining Date", type: "date", required: true },
      { label: "Work Location" },
      { label: "Notice Period", placeholder: "e.g. 30 days" },
    ],
    generate: (d) =>
      `EMPLOYMENT CONTRACT\n\nDate: ${d["Joining Date"] || "[Date]"}\n\nEMPLOYER: ${d["Company Name"]}, ${d["Company Address"]}\nEMPLOYEE: ${d["Employee Name"]}\n\n1. DESIGNATION: ${d["Designation"] || "[Designation]"}\n2. COMMENCEMENT: ${d["Joining Date"] || "[Date]"}\n3. SALARY: Rs. ${d["Monthly Salary"] || "[Amount]"} per month (subject to PF, ESI, TDS deductions)\n4. WORK LOCATION: ${d["Work Location"] || "[Location]"}\n5. TERMINATION: Either party may give ${d["Notice Period"] || "30 days"} written notice.\n6. CONFIDENTIALITY: Employee shall not disclose confidential information.\n\nIN WITNESS WHEREOF, the parties have executed this Contract.\n\nEMPLOYER: ${d["Company Name"] || "___________________"} Signature: ___________________\nEMPLOYEE: ${d["Employee Name"] || "___________________"} Signature: ___________________\n\n[DISCLAIMER: AI-generated draft for reference only. Consult a practicing lawyer before signing.]`,
  },
  {
    id: "nda",
    name: "Non-Disclosure Agreement",
    category: "Business",
    icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    fields: [
      { label: "Party A Name", required: true },
      { label: "Party A Address", required: true },
      { label: "Party B Name", required: true },
      { label: "Party B Address", required: true },
      { label: "Purpose", required: true },
      { label: "Duration", placeholder: "e.g. 2 years" },
    ],
    generate: (d) =>
      `NON-DISCLOSURE AGREEMENT\n\nDate: ${formatDate()}\n\nPARTY A: ${d["Party A Name"]}, ${d["Party A Address"]}\nPARTY B: ${d["Party B Name"]}, ${d["Party B Address"]}\n\nWHEREAS the parties wish to engage in ${d["Purpose"] || "[Purpose]"}, the Disclosing Party may share confidential information.\n\n1. OBLIGATIONS: The Receiving Party shall hold all Confidential Information in strict confidence and use it solely for the Purpose.\n\n2. EXCLUSIONS: Does not apply to publicly available info, info already known, or info required by law to disclose.\n\n3. DURATION: ${d["Duration"] || "2 years"} from the date of disclosure.\n\n4. RETURN: On termination, all Confidential Information shall be returned or destroyed.\n\nIN WITNESS WHEREOF, the parties have executed this Agreement.\n\nPARTY A: ${d["Party A Name"] || "___________________"} Signature: ___________________\nPARTY B: ${d["Party B Name"] || "___________________"} Signature: ___________________\n\n[DISCLAIMER: AI-generated draft for reference only. Consult a practicing lawyer before signing.]`,
  },
  {
    id: "partnership",
    name: "Partnership Deed",
    category: "Business",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    fields: [
      { label: "Firm Name", required: true },
      { label: "Firm Address", required: true },
      { label: "Partner 1 Name", required: true },
      { label: "Partner 2 Name", required: true },
      {
        label: "Profit Share Ratio",
        required: true,
        placeholder: "e.g. 50:50",
      },
      { label: "Capital Partner 1", required: true },
      { label: "Capital Partner 2", required: true },
      { label: "Commencement Date", type: "date", required: true },
    ],
    generate: (d) =>
      `PARTNERSHIP DEED\n\nDate: ${d["Commencement Date"] || "[Date]"}\n\nFIRM: "${d["Firm Name"] || "[Firm Name]"}"\nPRINCIPAL PLACE: ${d["Firm Address"] || "[Address]"}\n\n1. PARTNERS:\n   (a) ${d["Partner 1 Name"]} - Capital: Rs. ${d["Capital Partner 1"] || "[Amount]"}\n   (b) ${d["Partner 2 Name"]} - Capital: Rs. ${d["Capital Partner 2"] || "[Amount]"}\n\n2. PROFIT/LOSS SHARING: ${d["Profit Share Ratio"] || "50:50"}\n\n3. COMMENCEMENT: ${d["Commencement Date"] || "[Date]"}\n\n4. Each Partner shall devote full time to the Firm's business.\n\nIN WITNESS WHEREOF, the Partners have executed this Deed.\n\nPartner 1: ${d["Partner 1 Name"] || "___________________"} Signature: ___________________\nPartner 2: ${d["Partner 2 Name"] || "___________________"} Signature: ___________________\n\n[DISCLAIMER: AI-generated draft for reference only. Consult a practicing lawyer before signing.]`,
  },
  {
    id: "poa",
    name: "Power of Attorney",
    category: "General",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    fields: [
      { label: "Principal Name", required: true },
      { label: "Principal Address", required: true },
      { label: "Agent Name", required: true },
      { label: "Agent Address", required: true },
      { label: "Purpose", required: true },
      { label: "Execution Date", type: "date", required: true },
    ],
    generate: (d) =>
      `POWER OF ATTORNEY\n\nDate: ${d["Execution Date"] || "[Date]"}\n\nI, ${d["Principal Name"]}, residing at ${d["Principal Address"]}, do hereby appoint ${d["Agent Name"]}, residing at ${d["Agent Address"]}, as my true and lawful Attorney for: ${d["Purpose"] || "[Purpose]"}\n\nThe Attorney is authorized to execute all documents, appear before authorities, and perform all acts necessary for the above purpose.\n\nThis Power of Attorney is irrevocable during my lifetime.\n\nPRINCIPAL: ${d["Principal Name"] || "___________________"} Signature: ___________________\n\nBefore me:\nNotary Public: ___________________\nRegistration No.: ___________________\n\n[DISCLAIMER: AI-generated draft for reference only. Consult a practicing lawyer before signing.]`,
  },
  {
    id: "sale-deed",
    name: "Sale Deed",
    category: "Property",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    fields: [
      { label: "Seller Name", required: true },
      { label: "Seller Address", required: true },
      { label: "Buyer Name", required: true },
      { label: "Buyer Address", required: true },
      { label: "Property Description", required: true },
      { label: "Sale Consideration", required: true },
      { label: "Sale Date", type: "date", required: true },
    ],
    generate: (d) =>
      `SALE DEED\n\nDate: ${d["Sale Date"] || "[Date]"}\n\nSELLER: ${d["Seller Name"]}, ${d["Seller Address"]}\nBUYER: ${d["Buyer Name"]}, ${d["Buyer Address"]}\n\n1. The Vendor sells to the Purchaser the property described in Schedule A for Rs. ${d["Sale Consideration"] || "[Amount]"}.\n\n2. The Purchaser has paid the full sale consideration.\n\n3. The Vendor warrants the property is free from all encumbrances.\n\nSCHEDULE A:\n${d["Property Description"] || "[Property description with survey number, area, boundaries]"}\n\nVENDOR: ${d["Seller Name"] || "___________________"} Signature: ___________________\nPURCHASER: ${d["Buyer Name"] || "___________________"} Signature: ___________________\n\n[DISCLAIMER: AI-generated draft for reference only. Consult a practicing lawyer before signing.]`,
  },
  {
    id: "will",
    name: "Will",
    category: "Document",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    fields: [
      { label: "Testator Name", required: true },
      { label: "Testator Address", required: true },
      { label: "Executor Name", required: true },
      { label: "Executor Address", required: true },
      { label: "Beneficiaries", type: "textarea", required: true },
      { label: "Assets Description", type: "textarea", required: true },
      { label: "Date", type: "date", required: true },
    ],
    generate: (d) =>
      `LAST WILL AND TESTAMENT\n\nDate: ${d["Date"] || "[Date]"}\n\nI, ${d["Testator Name"] || "[Testator Name]"}, residing at ${d["Testator Address"] || "[Address]"}, being of sound mind, do hereby make this my Last Will and Testament:\n\n1. REVOCATION: I revoke all prior wills made by me.\n\n2. EXECUTOR: I appoint ${d["Executor Name"] || "[Executor Name]"}, residing at ${d["Executor Address"] || "[Executor Address]"}, as the Executor of this Will.\n\n3. ASSETS:\n${d["Assets Description"] || "[Describe your assets]"}\n\n4. BEQUESTS:\n${d["Beneficiaries"] || "[List beneficiaries and their shares]"}\n\n5. DEBTS: All just debts and funeral expenses be paid from my estate.\n\nIN WITNESS WHEREOF, I have executed this Will.\n\nTESTATOR: ${d["Testator Name"] || "___________________"} Signature: ___________________\n\nWitness 1: ___________________\nWitness 2: ___________________\n\n[DISCLAIMER: AI-generated draft for reference only. Consult a practicing lawyer before signing.]`,
  },
  {
    id: "affidavit",
    name: "Affidavit",
    category: "Document",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    fields: [
      { label: "Deponent Name", required: true },
      { label: "Deponent Address", required: true },
      { label: "Subject", required: true },
      { label: "Affirmation Statement", type: "textarea", required: true },
      { label: "Date", type: "date", required: true },
    ],
    generate: (d) =>
      `AFFIDAVIT\n\nDate: ${d["Date"] || "[Date]"}\n\nIN THE MATTER OF: ${d["Subject"] || "[Subject]"}\n\nI, ${d["Deponent Name"] || "[Deponent Name]"}, residing at ${d["Deponent Address"] || "[Address]"}, do solemnly affirm:\n\n1. ${d["Affirmation Statement"] || "[State the facts]"}\n\n2. The contents of this affidavit are true and correct.\n\nVERIFICATION: Verified at [Place] on ${d["Date"] || "[Date]"}.\n\nDEPONENT: ${d["Deponent Name"] || "___________________"} Signature: ___________________\n\nBefore me:\nNotary Public: ___________________\n\n[DISCLAIMER: AI-generated draft for reference only. Consult a practicing lawyer before signing.]`,
  },
  {
    id: "petition",
    name: "Petition / Plaint",
    category: "Document",
    icon: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
    fields: [
      { label: "Petitioner Name", required: true },
      { label: "Respondent Name", required: true },
      { label: "Court Name", required: true },
      { label: "Cause of Action", type: "textarea", required: true },
      { label: "Relief Sought", type: "textarea", required: true },
      { label: "Date", type: "date", required: true },
    ],
    generate: (d) =>
      `PLAINT\n\nIN THE COURT OF ${d["Court Name"] || "[Court Name]"}\n\n${d["Petitioner Name"] || "[Petitioner]"} — Plaintiff\nVs.\n${d["Respondent Name"] || "[Respondent]"} — Defendant\n\n1. CAUSE OF ACTION:\n${d["Cause of Action"] || "[State the facts giving rise to the claim]"}\n\n2. RELIEF SOUGHT:\n${d["Relief Sought"] || "[State the specific relief sought]"}\n\n3. LIMITATION: This suit is filed within the period of limitation.\n\nPLAINTIFF: ${d["Petitioner Name"] || "___________________"} Signature: ___________________\n\nDate: ${d["Date"] || "[Date]"}\n\n[DISCLAIMER: AI-generated draft for reference only. Consult a practicing lawyer before filing.]`,
  },
  {
    id: "legal-notice",
    name: "Legal Notice",
    category: "Document",
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    fields: [
      { label: "Sender Name", required: true },
      { label: "Recipient Name", required: true },
      { label: "Subject", required: true },
      { label: "Facts of the Case", type: "textarea", required: true },
      { label: "Demand/Relief", type: "textarea", required: true },
    ],
    generate: (d) =>
      `LEGAL NOTICE\n\nDate: ${formatDate()}\n\nFrom: ${d["Sender Name"] || "[Sender]"}\nTo: ${d["Recipient Name"] || "[Recipient]"}\n\nSubject: ${d["Subject"] || "[Subject]"}\n\nSir/Madam,\n\n1. I, ${d["Sender Name"] || "[Name]"}, hereby issue this legal notice.\n\n2. Facts: ${d["Facts of the Case"] || "[State the facts]"}\n\n3. DEMAND: I call upon you to ${d["Demand/Relief"] || "[State your demand]"} within 30 days.\n\n4. Failure to comply will result in legal proceedings.\n\nYours faithfully,\n${d["Sender Name"] || "[Name]"}\n\n[DISCLAIMER: AI-generated draft for reference only. Consult a practicing lawyer before signing.]`,
  },
  {
    id: "fir-draft",
    name: "FIR Draft",
    category: "Document",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    fields: [
      { label: "Complainant Name", required: true },
      { label: "Police Station", required: true },
      { label: "Incident Date", type: "date", required: true },
      { label: "Incident Place", required: true },
      { label: "Incident Details", type: "textarea", required: true },
    ],
    generate: (d) =>
      `FIR DRAFT\n\nDate: ${d["Incident Date"] || "[Date]"}\n\nTo,\nThe SHO,\n${d["Police Station"] || "[Police Station]"}\n\nSubject: Information regarding offence under BNS 2023\n\nSir/Madam,\n\n1. I, ${d["Complainant Name"] || "[Name]"}, wish to lodge this complaint regarding a cognizable offence on ${d["Incident Date"] || "[Date]"} at ${d["Incident Place"] || "[Place]"}.\n\n2. Details: ${d["Incident Details"] || "[Describe the incident]"}\n\n3. I request you to register an FIR under the relevant provisions of BNS 2023.\n\nYours faithfully,\n${d["Complainant Name"] || "[Name]"}\n\n[DISCLAIMER: AI-generated draft for reference only. Consult a practicing lawyer before filing.]`,
  },
  {
    id: "consumer-complaint",
    name: "Consumer Complaint",
    category: "Document",
    icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
    fields: [
      { label: "Complainant Name", required: true },
      { label: "Opposite Party Name", required: true },
      { label: "Product/Service", required: true },
      { label: "Amount Paid", required: true },
      { label: "Deficiency Details", type: "textarea", required: true },
    ],
    generate: (d) =>
      `CONSUMER COMPLAINT\n\nDate: ${formatDate()}\n\nTo,\nThe District Consumer Disputes Redressal Commission\n\n${d["Complainant Name"] || "[Complainant]"} — Complainant\nVs.\n${d["Opposite Party Name"] || "[Opposite Party]"} — Opposite Party\n\nSubject: Complaint regarding ${d["Product/Service"] || "[Product/Service]"} under Consumer Protection Act, 2019\n\n1. The complainant purchased ${d["Product/Service"]} for Rs. ${d["Amount Paid"] || "[Amount]"}.\n\n2. Deficiency: ${d["Deficiency Details"] || "[Describe the deficiency]"}\n\n3. Despite repeated requests, the opposite party has failed to resolve the grievance.\n\nThe complainant prays for: (a) Relief sought, (b) Compensation, (c) Cost of litigation.\n\n${d["Complainant Name"] || "[Name]"}\n\n[DISCLAIMER: AI-generated draft for reference only. Consult a practicing lawyer before filing.]`,
  },
  {
    id: "rti-application",
    name: "RTI Application",
    category: "Document",
    icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    fields: [
      { label: "Applicant Name", required: true },
      { label: "Applicant Address", required: true },
      { label: "Public Authority Name", required: true },
      { label: "Information Sought", type: "textarea", required: true },
    ],
    generate: (d) =>
      `RTI APPLICATION\n\nDate: ${formatDate()}\n\nTo,\nThe CPIO,\n${d["Public Authority Name"] || "[Authority]"}\n\nSubject: Request for information under Section 6 of the RTI Act, 2005\n\nSir/Madam,\n\nI, ${d["Applicant Name"] || "[Name]"}, residing at ${d["Applicant Address"] || "[Address]"}, hereby request the following information:\n\n${d["Information Sought"] || "[Describe the information you seek]"}\n\nI am ready to pay the prescribed fee of Rs. 10.\n\nThanking you,\n${d["Applicant Name"] || "[Name]"}\n\n[DISCLAIMER: AI-generated draft for reference only.]`,
  },
  {
    id: "cyber-complaint",
    name: "Cyber Crime Complaint",
    category: "Document",
    icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    fields: [
      { label: "Complainant Name", required: true },
      { label: "Complainant Address", required: true },
      { label: "Police/Cyber Cell", required: true },
      { label: "Platform / URL", required: true },
      { label: "Incident Date", type: "date", required: true },
      { label: "Incident Details", type: "textarea", required: true },
    ],
    generate: (d) =>
      `CYBER CRIME COMPLAINT\n\nDate: ${formatDate()}\n\nTo,\nThe Station House Officer / Investigating Officer\n${d["Police/Cyber Cell"] || "[Police Station or Cyber Cell]"}\n\nSubject: Complaint of cyber crime under the Information Technology Act, 2000 and the Bharatiya Nyaya Sanhita, 2023\n\nSir/Madam,\n\n1. I, ${d["Complainant Name"] || "[Name]"}, residing at ${d["Complainant Address"] || "[Address]"}, wish to report a cyber crime committed through ${d["Platform / URL"] || "[Platform / URL]"}.\n\n2. The incident occurred on ${d["Incident Date"] || "[Date]"}.\n\n3. Details: ${d["Incident Details"] || "[Describe what happened, including how the content was created, shared or used]"}\n\n4. I have preserved screenshots, links and other evidence of the above.\n\nI request you to register the complaint, preserve the digital evidence, remove the offending content or account and initiate investigation under the applicable provisions.\n\nYours faithfully,\n${d["Complainant Name"] || "[Name]"}\n\n[DISCLAIMER: AI-generated draft for reference only. Consult a practicing lawyer before filing.]`,
  },
];

export function TemplatesModal({
  onClose,
  onBack,
  initialItem,
}: {
  onClose: () => void;
  onBack: () => void;
  initialItem?: string | null;
}) {
  const [selected, setSelected] = useState<Template | null>(
    () => TEMPLATES.find((t) => t.id === initialItem) ?? null,
  );
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleFieldChange = (label: string, value: string) => {
    setFormData((prev) => ({ ...prev, [label]: value }));
  };

  const allRequiredFilled =
    selected?.fields
      .filter((f) => f.required)
      .every((f) => formData[f.label]?.trim()) ?? false;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-overlay-in mx-4 flex h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <button
            onClick={selected ? () => setSelected(null) : onBack}
            className="rounded-lg p-1 text-white/40 hover:text-white/70"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <h3 className="text-sm font-semibold text-white">
              {selected ? selected.name : "Contract Templates"}
            </h3>
            <p className="text-[11px] text-white/40">
              {selected
                ? selected.category
                : `${TEMPLATES.length} ready-to-use templates`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1 text-white/40 hover:text-white/70"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!selected ? (
            <div className="space-y-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelected(t);
                    setFormData({});
                  }}
                  className="group flex w-full items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-left transition-all hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/50 transition-colors duration-300 group-hover:border-white/20 group-hover:text-white">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={t.icon} />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-white">
                      {t.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-white/40">
                      {t.fields.length} fields
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {selected.fields.map((field) => (
                <div key={field.label}>
                  <label className="mb-1 block text-xs font-medium text-white/50">
                    {field.label}{" "}
                    {field.required && <span className="text-red-400">*</span>}
                  </label>
                  {field.type === "date" ? (
                    <input
                      type="date"
                      value={formData[field.label] || ""}
                      onChange={(e) =>
                        handleFieldChange(field.label, e.target.value)
                      }
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/25"
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData[field.label] || ""}
                      onChange={(e) =>
                        handleFieldChange(field.label, e.target.value)
                      }
                      placeholder={field.placeholder || ""}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/25"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <div className="flex gap-3 border-t border-white/10 px-5 py-4">
            <button
              disabled={!allRequiredFilled}
              onClick={() =>
                exportAsWord(selected.generate(formData), selected.name)
              }
              className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/20 disabled:opacity-40"
            >
              Download Word
            </button>
            <button
              disabled={!allRequiredFilled}
              onClick={() =>
                exportAsPdf(selected.generate(formData), selected.name)
              }
              className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/20 disabled:opacity-40"
            >
              Download PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Filing Modal ─── */

interface FilingStep {
  title: string;
  detail: string;
  tip?: string;
}

interface FilingGuide {
  id: string;
  authorityId?: string;
  name: string;
  icon: string;
  steps: FilingStep[];
  docFields: { label: string; placeholder?: string; required?: boolean }[];
  generateDocument: (data: Record<string, string>) => string;
}

const FILING_GUIDES: FilingGuide[] = [
  {
    id: "rti",
    authorityId: "rti-online",
    name: "RTI Application",
    icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    steps: [
      {
        title: "Identify the Public Authority",
        detail:
          "Determine which government department holds the information you need.",
        tip: "Check the department website for the correct CPIO details.",
      },
      {
        title: "Draft the Application",
        detail:
          "Write a clear application addressed to the CPIO. Be precise about the information you seek.",
        tip: "Use the template below.",
      },
      {
        title: "Pay the Fee",
        detail:
          "Pay Rs. 10 via demand draft, postal order, or online. BPL card holders are exempt.",
        tip: "File online at rtionline.gov.in for central government bodies.",
      },
      {
        title: "Submit & Follow Up",
        detail:
          "Submit physically, by post, or online. The CPIO must respond within 30 days.",
        tip: "If no response, file a first appeal to the appellate authority.",
      },
    ],
    docFields: [
      { label: "Applicant Name", required: true },
      { label: "Applicant Address", required: true },
      { label: "Public Authority Name", required: true },
      { label: "Information Sought", required: true },
    ],
    generateDocument: (d) =>
      `RTI APPLICATION\n\nDate: ${formatDate()}\n\nTo,\nThe CPIO,\n${d["Public Authority Name"] || "[Authority]"}\n\nSubject: Request for information under Section 6 of the RTI Act, 2005\n\nSir/Madam,\n\nI, ${d["Applicant Name"] || "[Name]"}, residing at ${d["Applicant Address"] || "[Address]"}, hereby request the following information:\n\n${d["Information Sought"] || "[Describe the information you seek]"}\n\nI am ready to pay the prescribed fee of Rs. 10.\n\nThanking you,\n${d["Applicant Name"] || "[Name]"}\n\n[DISCLAIMER: AI-generated draft for reference only.]`,
  },
  {
    id: "consumer",
    authorityId: "e-jagriti",
    name: "Consumer Complaint",
    icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
    steps: [
      {
        title: "Determine Jurisdiction",
        detail:
          "District (up to Rs. 1 crore), State (Rs. 1-10 crore), National (above Rs. 10 crore).",
        tip: "File where you reside or where the opposite party's office is.",
      },
      {
        title: "Gather Evidence",
        detail:
          "Collect bills, invoices, warranties, photos, and communication records.",
        tip: "Keep originals safe; attach copies.",
      },
      {
        title: "Draft & File",
        detail:
          "Draft the complaint with clear facts and relief sought. Pay court fee (Rs. 100-200 for claims up to Rs. 5 lakh).",
        tip: "File within 2 years of the cause of action.",
      },
    ],
    docFields: [
      { label: "Complainant Name", required: true },
      { label: "Opposite Party Name", required: true },
      { label: "Product/Service", required: true },
      { label: "Amount Paid", required: true },
      { label: "Deficiency Details", required: true },
    ],
    generateDocument: (d) =>
      `CONSUMER COMPLAINT\n\nDate: ${formatDate()}\n\nTo,\nThe District Consumer Disputes Redressal Commission\n\nIn the matter of:\n${d["Complainant Name"] || "[Complainant]"} — Complainant\nVs.\n${d["Opposite Party Name"] || "[Opposite Party]"} — Opposite Party\n\nSubject: Complaint regarding ${d["Product/Service"] || "[Product/Service]"} under the Consumer Protection Act, 2019\n\n1. The complainant purchased/availed ${d["Product/Service"]} for Rs. ${d["Amount Paid"] || "[Amount]"}.\n2. The deficiency: ${d["Deficiency Details"] || "[Describe the deficiency]"}\n3. Despite repeated requests, the opposite party has failed to address the grievance.\n\nThe complainant prays for: (a) Relief sought, (b) Compensation, (c) Cost of litigation.\n\n${d["Complainant Name"] || "[Name]"}\n\n[DISCLAIMER: AI-generated draft for reference only.]`,
  },
  {
    id: "fir",
    authorityId: "police",
    name: "FIR Draft",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    steps: [
      {
        title: "Identify Police Station",
        detail:
          "File at the police station under whose jurisdiction the offence occurred. Zero FIR can be filed at any station.",
        tip: "Under BNSS 2023, Zero FIR is available for all cognizable offences.",
      },
      {
        title: "Draft the FIR",
        detail:
          "Write facts clearly: what happened, when, where, who was involved.",
        tip: "Stick to facts. Do not embellish.",
      },
      {
        title: "Submit to SHO",
        detail:
          "The SHO is duty-bound to register the FIR for cognizable offences under BNSS 2023.",
        tip: "If refused, approach the SP or file online.",
      },
    ],
    docFields: [
      { label: "Complainant Name", required: true },
      { label: "Police Station", required: true },
      { label: "Incident Date", required: true },
      { label: "Incident Place", required: true },
      { label: "Incident Details", required: true },
    ],
    generateDocument: (d) =>
      `FIR DRAFT\n\nDate: ${formatDate()}\n\nTo,\nThe SHO,\n${d["Police Station"] || "[Police Station]"}\n\nSubject: Information regarding offence under the Bharatiya Nyaya Sanhita, 2023\n\nSir/Madam,\n\n1. I, ${d["Complainant Name"] || "[Name]"}, wish to lodge this complaint regarding a cognizable offence on ${d["Incident Date"] || "[Date]"} at ${d["Incident Place"] || "[Place]"}.\n\n2. Details: ${d["Incident Details"] || "[Describe the incident]"}\n\n3. I request you to register an FIR under the relevant provisions of BNS 2023.\n\nYours faithfully,\n${d["Complainant Name"] || "[Name]"}\n\n[DISCLAIMER: AI-generated draft for reference only.]`,
  },
  {
    id: "cybercrime",
    authorityId: "cybercrime",
    name: "Cyber Crime Complaint",
    icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    steps: [
      {
        title: "Pick the Portal Category",
        detail:
          "On cybercrime.gov.in choose 'Crime Against Women and Children' for leaked or morphed intimate images, sexual harassment, stalking and fake profiles — or 'Other Cyber Crime' for fraud, hacking and impersonation.",
        tip: "For financial fraud call 1930 immediately so the money can be frozen.",
      },
      {
        title: "Preserve the Evidence",
        detail:
          "Capture screenshots with the URL, profile handle, message headers, dates and transaction IDs before anything is deleted.",
        tip: "Do not delete chats or posts — investigators need the original trail.",
      },
      {
        title: "Submit the Complaint",
        detail:
          "Create an OTP-based account on cybercrime.gov.in, fill the complaint form, upload the evidence and submit. You can also walk into the nearest cyber cell.",
        tip: "The portal accepts complaints 24×7 from anywhere in India and assigns jurisdiction for you.",
      },
      {
        title: "Track with the Acknowledgement Number",
        detail:
          "Note the complaint ID issued on submission, track its status on the portal and cooperate with the assigned investigating officer.",
        tip: "No action? Escalate on the portal or file a Zero FIR at your local police station.",
      },
    ],
    docFields: [
      { label: "Complainant Name", required: true },
      { label: "Complainant Address", required: true },
      {
        label: "Platform / URL",
        placeholder: "Profile, page or chat link",
        required: true,
      },
      { label: "Incident Date", required: true },
      { label: "Incident Details", required: true },
    ],
    generateDocument: (d) =>
      `CYBER CRIME COMPLAINT\n\nDate: ${formatDate()}\n\nTo,\nThe Investigating Officer\nNational Cyber Crime Reporting Portal (cybercrime.gov.in)\n\nSubject: Complaint of cyber crime under the Information Technology Act, 2000 and the Bharatiya Nyaya Sanhita, 2023\n\nSir/Madam,\n\n1. I, ${d["Complainant Name"] || "[Name]"}, residing at ${d["Complainant Address"] || "[Address]"}, wish to report a cyber crime committed through ${d["Platform / URL"] || "[Platform / URL]"}.\n\n2. The incident occurred on ${d["Incident Date"] || "[Date]"}.\n\n3. Details: ${d["Incident Details"] || "[Describe what happened, including how the content was created, shared or used]"}\n\n4. I have preserved screenshots, links and other evidence of the above.\n\nI request you to register the complaint, preserve the digital evidence, remove the offending content or account and initiate investigation under the applicable provisions.\n\nYours faithfully,\n${d["Complainant Name"] || "[Name]"}\n\n[DISCLAIMER: AI-generated draft for reference only.]`,
  },
  {
    id: "nch-grievance",
    authorityId: "nch",
    name: "Consumer Grievance (NCH)",
    icon: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z",
    steps: [
      {
        title: "Approach the Company First",
        detail:
          "Send your grievance to the seller's or brand's grievance officer and keep the ticket or reference number.",
        tip: "Most companies must respond within 15 days of the complaint.",
      },
      {
        title: "Register on the NCH Portal",
        detail:
          "File at consumerhelpline.gov.in or call 1915 with purchase proof, invoices and the company's reply, if any.",
        tip: "Registration is free and covers products and services bought anywhere in India.",
      },
      {
        title: "Escalate If Unresolved",
        detail:
          "If NCH conciliation fails, approach the Consumer Disputes Redressal Commission through e-Jagriti.",
        tip: "Keep the NCH acknowledgement number — the forum will ask for it.",
      },
    ],
    docFields: [
      { label: "Complainant Name", required: true },
      { label: "Mobile Number", required: true },
      { label: "Seller / Brand Name", required: true },
      { label: "Product/Service", required: true },
      { label: "Grievance Details", required: true },
    ],
    generateDocument: (d) =>
      `CONSUMER GRIEVANCE — NATIONAL CONSUMER HELPLINE\n\nDate: ${formatDate()}\n\nTo,\nThe Grievance Officer\nNational Consumer Helpline (consumerhelpline.gov.in)\n\nComplainant: ${d["Complainant Name"] || "[Name]"} | Mobile: ${d["Mobile Number"] || "[Number]"}\n\nSubject: Pre-litigation grievance against ${d["Seller / Brand Name"] || "[Seller/Brand]"} regarding ${d["Product/Service"] || "[Product/Service]"}\n\nSir/Madam,\n\n1. I purchased/availed ${d["Product/Service"] || "[Product/Service]"} from ${d["Seller / Brand Name"] || "[Seller/Brand]"}.\n\n2. Grievance: ${d["Grievance Details"] || "[Describe the deficiency in product, service or unfair trade practice]"}\n\n3. Despite representations, the matter remains unresolved.\n\nI request the NCH to take up conciliation with the opposite party and, failing that, to advise me on approaching the Consumer Disputes Redressal Commission.\n\nYours faithfully,\n${d["Complainant Name"] || "[Name]"}\n\n[DISCLAIMER: AI-generated draft for reference only.]`,
  },
];

type SendStep = "preview" | "credentials" | "sending" | "sent" | "portal-guide";

export function FilingModal({
  onClose,
  onBack,
  initialItem,
}: {
  onClose: () => void;
  onBack: () => void;
  initialItem?: string | null;
}) {
  const [selected, setSelected] = useState<FilingGuide | null>(
    () => FILING_GUIDES.find((g) => g.id === initialItem) ?? null,
  );
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const [showSendModal, setShowSendModal] = useState(false);
  const [sendStep, setSendStep] = useState<SendStep>("preview");
  const [sendFormData, setSendFormData] = useState<Record<string, string>>({});
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState<{
    messageId?: string;
    sentTo?: string;
  }>({});

  const authority = selected?.authorityId
    ? (AUTHORITIES[selected.authorityId] ?? null)
    : null;

  const handleOpenSend = () => {
    setSendStep("preview");
    setSendFormData({});
    setSendError("");
    setSendSuccess({});
    setShowSendModal(true);
  };

  const handleSendEmail = async () => {
    if (!authority || !selected) return;
    setSendStep("sending");
    setSendError("");
    try {
      const docContent = selected.generateDocument(formData);
      const res = await fetch("/api/filing/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: authority.email,
          subject: `${selected.name} — ${formData["Complainant Name"] || formData["Applicant Name"] || formData["Sender Name"] || "LawBite User"}`,
          documentContent: docContent,
          complaintType: selected.authorityId,
          userEmail: sendFormData["Your Email"] || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.portalUrl) {
          setSendStep("portal-guide");
          return;
        }
        setSendError(data.error || "Failed to send email");
        setSendStep("credentials");
        return;
      }
      setSendSuccess({ messageId: data.messageId, sentTo: data.sentTo });
      setSendStep("sent");
    } catch {
      setSendError("Network error. Please try again.");
      setSendStep("credentials");
    }
  };

  const handleFieldChange = (label: string, value: string) => {
    setFormData((prev) => ({ ...prev, [label]: value }));
  };

  const allRequiredFilled =
    selected?.docFields
      .filter((f) => f.required)
      .every((f) => formData[f.label]?.trim()) ?? false;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-overlay-in mx-4 flex h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <button
            onClick={
              selected
                ? () => {
                    setSelected(null);
                    setStep(0);
                  }
                : onBack
            }
            className="rounded-lg p-1 text-white/40 hover:text-white/70"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <h3 className="text-sm font-semibold text-white">
              {selected ? selected.name : "Filing Assistance"}
            </h3>
            <p className="text-[11px] text-white/40">
              {selected
                ? `${selected.steps.length} steps`
                : "Step-by-step guides"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1 text-white/40 hover:text-white/70"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!selected ? (
            <div className="space-y-2">
              {FILING_GUIDES.map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    setSelected(g);
                    setStep(0);
                    setFormData({});
                  }}
                  className="group flex w-full items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-left transition-all hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/50 transition-colors duration-300 group-hover:border-white/20 group-hover:text-white">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={g.icon} />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-white">
                      {g.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-white/40">
                      {g.steps.length} steps
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : step < selected.steps.length ? (
            <div className="space-y-3">
              {selected.steps.map((s, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-4 transition-colors ${i === step ? "border-white/20 bg-white/[0.05]" : "border-white/5 bg-white/[0.02]"}`}
                >
                  <button
                    onClick={() => setStep(i)}
                    className="flex w-full items-center gap-3 text-left"
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i === step ? "bg-white/20 text-white" : "bg-white/5 text-white/30"}`}
                    >
                      {i + 1}
                    </div>
                    <span
                      className={`text-sm font-medium ${i === step ? "text-white" : "text-white/50"}`}
                    >
                      {s.title}
                    </span>
                  </button>
                  {i === step && (
                    <div className="mt-3 ml-10">
                      <p className="text-sm text-white/60">{s.detail}</p>
                      {s.tip && (
                        <p className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-400/80">
                          Tip: {s.tip}
                        </p>
                      )}
                      <div className="mt-3 flex gap-2">
                        {i > 0 && (
                          <button
                            onClick={() => setStep(i - 1)}
                            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/40 hover:text-white/60"
                          >
                            Previous
                          </button>
                        )}
                        <button
                          onClick={() => setStep(i + 1)}
                          className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20"
                        >
                          {i < selected.steps.length - 1
                            ? "Next"
                            : "Fill Details"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs font-medium text-white/50">
                Fill in your details:
              </p>
              {selected.docFields.map((field) => (
                <div key={field.label}>
                  <label className="mb-1 block text-xs font-medium text-white/50">
                    {field.label}{" "}
                    {field.required && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    type="text"
                    value={formData[field.label] || ""}
                    onChange={(e) =>
                      handleFieldChange(field.label, e.target.value)
                    }
                    placeholder={field.placeholder || ""}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/25"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {selected && step >= selected.steps.length && (
          <div className="flex gap-3 border-t border-white/10 px-5 py-4">
            <button
              disabled={!allRequiredFilled}
              onClick={() =>
                exportAsWord(selected.generateDocument(formData), selected.name)
              }
              className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/20 disabled:opacity-40"
            >
              Download Word
            </button>
            <button
              disabled={!allRequiredFilled}
              onClick={() =>
                exportAsPdf(selected.generateDocument(formData), selected.name)
              }
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/50 transition-colors hover:text-white/70 disabled:opacity-40"
            >
              Download PDF
            </button>
            {selected.authorityId && (
              <button
                type="button"
                onClick={handleOpenSend}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
                File &amp; Send
              </button>
            )}
          </div>
        )}

        {showSendModal && selected && authority && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSendModal(false)}
          >
            <div
              className="animate-overlay-in mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    File &amp; Send
                  </h4>
                  <p className="text-[11px] text-white/40">
                    {selected.name} &rarr; {authority.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowSendModal(false)}
                  className="rounded-lg p-1 text-white/40 hover:text-white/70"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {sendStep === "preview" && (
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed text-white/60">
                    {authority.email
                      ? `Your drafted document can be emailed directly to ${authority.name}.`
                      : `${authority.name} accepts filings via ${authority.portalName}. We'll show you how to file.`}
                  </p>
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-white/50">
                    <p className="font-medium text-white/70">
                      {authority.name}
                    </p>
                    {authority.email ? (
                      <p className="mt-1">{authority.email}</p>
                    ) : null}
                    <p className="mt-1 break-all">{authority.portalUrl}</p>
                  </div>
                  {sendError ? (
                    <p className="text-xs text-red-400">{sendError}</p>
                  ) : null}
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setShowSendModal(false)}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 transition-colors hover:text-white/70"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() =>
                        setSendStep(
                          authority.email ? "credentials" : "portal-guide",
                        )
                      }
                      className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/20"
                    >
                      Continue &rarr;
                    </button>
                  </div>
                </div>
              )}

              {sendStep === "credentials" && (
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-white/50">
                    Your Email
                  </label>
                  <input
                    type="email"
                    value={sendFormData["Your Email"] || ""}
                    onChange={(e) =>
                      setSendFormData((prev) => ({
                        ...prev,
                        "Your Email": e.target.value,
                      }))
                    }
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/25"
                  />
                  {sendError ? (
                    <p className="text-xs text-red-400">{sendError}</p>
                  ) : null}
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setSendStep("preview")}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 transition-colors hover:text-white/70"
                    >
                      Back
                    </button>
                    <button
                      disabled={!sendFormData["Your Email"]?.trim()}
                      onClick={handleSendEmail}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-40"
                    >
                      Send Now
                    </button>
                  </div>
                </div>
              )}

              {sendStep === "sending" && (
                <p className="py-6 text-center text-sm text-white/50">
                  Sending&hellip;
                </p>
              )}

              {sendStep === "sent" && (
                <div className="space-y-4 text-center">
                  <p className="text-sm text-emerald-400">
                    Sent successfully to {sendSuccess.sentTo || authority.email}
                    .
                  </p>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() =>
                        exportAsWord(
                          selected.generateDocument(formData),
                          selected.name,
                        )
                      }
                      className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/20"
                    >
                      Download Word
                    </button>
                    <button
                      onClick={() => setShowSendModal(false)}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 transition-colors hover:text-white/70"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}

              {sendStep === "portal-guide" && (
                <div className="space-y-3">
                  <ol className="list-decimal space-y-1.5 pl-5 text-xs leading-relaxed text-white/60">
                    {authority.filingSteps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setShowSendModal(false)}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 transition-colors hover:text-white/70"
                    >
                      Close
                    </button>
                    <a
                      href={authority.portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-500"
                    >
                      Open {authority.portalName} &rarr;
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
