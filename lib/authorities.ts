export interface Authority {
  id: string;
  name: string;
  email?: string;
  portalUrl: string;
  portalName: string;
  phone?: string;
  filingSteps: string[];
  jurisdiction?: string;
  feeStructure?: { range: string; fee: string }[];
}

export const AUTHORITIES: Record<string, Authority> = {
  nch: {
    id: "nch",
    name: "National Consumer Helpline (NCH)",
    portalUrl: "https://consumerhelpline.gov.in",
    portalName: "INGRAM Portal",
    phone: "1915 / 1800-11-4000",
    filingSteps: [
      "Visit consumerhelpline.gov.in",
      "Click 'Register' and create an account with OTP verification",
      "Login and click 'Lodge Grievance'",
      "Select category and sub-category of your complaint",
      "Enter details of the company/service provider",
      "Describe the deficiency in service/defect in goods",
      "Upload supporting documents (bills, receipts, photos)",
      "Submit and note your Docket Number for tracking",
    ],
    jurisdiction: "Pre-litigation stage for all consumer disputes",
    feeStructure: [{ range: "All complaints", fee: "Free" }],
  },
  "e-jagriti": {
    id: "e-jagriti",
    name: "e-Jagriti Consumer Commission",
    portalUrl: "https://e-jagriti.gov.in",
    portalName: "e-Jagriti Portal",
    filingSteps: [
      "Visit e-jagriti.gov.in and create an account (Aadhaar OTP required)",
      "Click 'File New Case' then 'Consumer Complaint'",
      "Review required documents and fee structure",
      "Enter Case Details: amount paid, claim amount, cause of action date, state, district",
      "Enter Complainant details (name, address, senior citizen status if applicable)",
      "Enter Opposite Party details",
      "Upload: Index, Proforma, Synopsis, Memo of Parties, Notarized Affidavit, Vakalatnama",
      "Upload Annexures (bills, receipts, evidence)",
      "Select the appropriate Consumer Commission",
      "Preview and Submit — pay court fee via Bharatkosh",
    ],
    jurisdiction:
      "District: up to Rs. 50 Lakhs | State: Rs. 50L-2 Crores | National: above Rs. 2 Crores",
    feeStructure: [
      { range: "Up to Rs. 5 Lakhs", fee: "Nil" },
      { range: "Rs. 5L - Rs. 10L", fee: "Rs. 200" },
      { range: "Rs. 10L - Rs. 20L", fee: "Rs. 400" },
      { range: "Rs. 20L - Rs. 50L", fee: "Rs. 1,000" },
      { range: "Rs. 50L - Rs. 1Cr", fee: "Rs. 2,000" },
      { range: "Rs. 1Cr - Rs. 2Cr", fee: "Rs. 2,500" },
      { range: "Above Rs. 2Cr", fee: "Rs. 7,500" },
    ],
  },
  "rti-online": {
    id: "rti-online",
    name: "RTI Online (Central Govt)",
    portalUrl: "https://rtionline.gov.in",
    portalName: "RTI Online Portal",
    filingSteps: [
      "Visit rtionline.gov.in",
      "Click 'Submit Request' for new RTI Application",
      "Select the Ministry/Department/Public Authority",
      "Enter your personal details (name, address, mobile, email)",
      "Write your RTI application text (be specific about information sought)",
      "Pay Rs. 10 fee via internet banking/debit card/credit card/UPI",
      "Submit and note your Registration Number",
    ],
    jurisdiction:
      "Central Government Ministries/Departments only (not State Govt)",
    feeStructure: [{ range: "All applications", fee: "Rs. 10" }],
  },
  cybercrime: {
    id: "cybercrime",
    name: "National Cyber Crime Reporting Portal",
    portalUrl: "https://cybercrime.gov.in",
    portalName: "Cyber Crime Portal",
    phone: "1930 (National Helpline)",
    filingSteps: [
      "Visit cybercrime.gov.in",
      "Click 'Report Cyber Crime' then 'Report Now'",
      "Select complaint type: Crime Against Women/Children or Other Cyber Crime",
      "Enter your personal details and incident details",
      "Provide suspect details (if known): name, mobile, email, wallet ID, website URL",
      "Upload evidence: screenshots, chat logs, transaction records",
      "Submit and note the complaint reference number",
    ],
    jurisdiction: "All India — cyber crimes only",
    feeStructure: [{ range: "All complaints", fee: "Free" }],
  },
  police: {
    id: "police",
    name: "Local Police Station",
    portalUrl: "https://police.gov.in",
    portalName: "State Police Portal",
    filingSteps: [
      "Identify the correct police station based on jurisdiction (where the offence occurred)",
      "Visit the police station in person or use your State's online FIR portal",
      "Provide: your details, incident details, suspect details (if any)",
      "Submit any evidence you have",
      "Get the FIR copy with FIR number",
      "If police refuse to file FIR, complain to the SP or approach Magistrate under Section 156(3) CrPC",
    ],
    jurisdiction: "Based on where the offence occurred",
    feeStructure: [{ range: "FIR filing", fee: "Free" }],
  },
};

export function getAuthorityForComplaint(
  complaintType: string,
): Authority | null {
  return AUTHORITIES[complaintType] || null;
}
