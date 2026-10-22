export type FilingGuidePreview = {
  id: string;
  name: string;
  description: string;
  estimatedTime: string;
  icon: string;
};

export const filingGuidePreviews: FilingGuidePreview[] = [
  {
    id: "consumer",
    name: "Consumer Complaint",
    description:
      "File a complaint in the Consumer Disputes Redressal Commission under the Consumer Protection Act, 2019.",
    estimatedTime: "20-25 minutes",
    icon: "M16 7V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M5 7h14l1 12H4L5 7z M9 11a1 1 0 102 0 1 1 0 00-2 0z M15 11a1 1 0 102 0 1 1 0 00-2 0z",
  },
  {
    id: "nch-grievance",
    name: "Consumer Grievance (NCH)",
    description:
      "Register a pre-litigation consumer grievance with the National Consumer Helpline before approaching the consumer court.",
    estimatedTime: "10-15 minutes",
    icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  },
  {
    id: "rti",
    name: "RTI Application",
    description:
      "File a Right to Information application under the RTI Act, 2005 to any central government public authority.",
    estimatedTime: "10-15 minutes",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    id: "cybercrime",
    name: "Cyber Crime Complaint",
    description:
      "Report online harassment, leaked or morphed intimate images, fake profiles, financial fraud and other cybercrimes on the National Cyber Crime Reporting Portal (cybercrime.gov.in).",
    estimatedTime: "15-20 minutes",
    icon: "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z",
  },
  {
    id: "fir",
    name: "FIR Draft",
    description:
      "Draft a First Information Report (FIR) to lodge a police complaint for a cognizable offence.",
    estimatedTime: "15-20 minutes",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  },
];
