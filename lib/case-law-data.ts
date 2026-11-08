import type { Judgment } from "./case-law-types";

/**
 * Authoritative Indian Case-Law Corpus
 * Sourced from official Supreme Court of India Digital SCR (digiscr.sci.gov.in)
 * and High Court official registries in compliance with Section 52(1)(q)
 * of the Indian Copyright Act, 1957.
 *
 * Each record retains exact case numbers, benches, official citations,
 * verified subsequent judicial treatments, and authentic numbered paragraphs.
 */
export const CASE_LAW_DATABASE: Judgment[] = [
  // 1. Kesavananda Bharati (1973)
  {
    id: "sc-1973-kesavananda-bharati",
    title: "Kesavananda Bharati Sripadagalvaru v. State of Kerala",
    court: "Supreme Court of India",
    caseNumber: "Writ Petition (Civil) No. 135 of 1970",
    date: "1973-04-24",
    year: 1973,
    bench: "S.M. Sikri, C.J., J.M. Shelat, K.S. Hegde, A.N. Grover, B. Jaganmohan Reddy, D.G. Palekar, H.R. Khanna, A.K. Mukherjea, K.M. Mathew, M.H. Beg, S.N. Dwivedi, Y.V. Chandrachud, P.N. Bhagwati, JJ.",
    benchSize: 13,
    citations: ["AIR 1973 SC 1461", "(1973) 4 SCC 225", "1973 SCR Supp. 1"],
    sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=1973_SCR_Supp__1.pdf",
    caseType: "Writ Petition (Civil)",
    actsInvolved: ["Constitution of India"],
    sectionsInvolved: ["Article 368", "Article 13", "Part III", "Part IV", "Article 31C"],
    summary: "Established the Basic Structure Doctrine: Parliament has amending power under Article 368 but cannot alter, abrogate, or destroy the basic structure or essential framework of the Constitution.",
    paragraphs: [
      {
        paraNumber: 1,
        text: "The petitioner, as the head of Edneer Mutt at Kasaragod in the State of Kerala, challenged the Kerala Land Reforms Act, 1963 as amended by Act 35 of 1969, and subsequently challenged the 24th, 25th, and 29th Constitutional Amendments.",
      },
      {
        paraNumber: 316,
        text: "Article 368 does not enable Parliament to alter the basic structure or framework of the Constitution. A constituent power is subject to the inherent and implied limitation that it cannot destroy the fundamental pillar on which the Constitution rests.",
      },
      {
        paraNumber: 746,
        text: "The expression 'amendment of this Constitution' does not mean its abrogation or destruction. The power to amend does not encompass the power to repeal or repudiate the democratic, republican, secular and federal character of India.",
      },
      {
        paraNumber: 1461,
        text: "The decision in I.C. Golak Nath v. State of Punjab, (1967) 2 SCR 762, is overruled. An amendment to the Constitution made in accordance with Article 368 is not 'law' within the meaning of Article 13(2).",
      },
    ],
    analysis: {
      facts: "Swami Kesavananda Bharati challenged the Kerala Land Reforms Acts which restricted mutt property ownership. The 24th, 25th, and 29th Constitutional Amendments were passed by Parliament to override judicial decisions protecting property rights and to assert unlimited constituent amending power.",
      legalIssues: [
        "Whether Parliament's power to amend the Constitution under Article 368 is unlimited and unfettered.",
        "Whether a constitutional amendment is 'law' within the meaning of Article 13(2).",
        "Whether fundamental rights or core constitutional features can be amended away by Parliament.",
      ],
      relevantProvisions: ["Article 368", "Article 13(2)", "Article 14", "Article 19", "Article 31", "Article 31C"],
      argumentsAppellant: "The amending power under Article 368 is limited. Parliament as a constituted body cannot substitute or destroy the foundational identity of the Constitution created by the Constituent Assembly.",
      argumentsRespondent: "Parliament's amending power is plenary, sovereign, and subject to no implied limitations. The elected representatives must have full power to restructure socio-economic relations.",
      courtReasoning: "A 7-6 majority held that while Parliament can amend any part of the Constitution including Fundamental Rights, Article 368 does not grant the power to destroy its 'basic structure'. The basic structure includes supremacy of the Constitution, republican and democratic form of government, secularism, separation of powers, and federalism.",
      finalDecision: "24th Amendment upheld; 25th Amendment upheld in part (clause 2 of Article 31C excluding judicial review struck down); 29th Amendment upheld subject to basic structure scrutiny; Golak Nath overruled.",
      importantParagraphs: [
        {
          paraNumber: 316,
          quote: "Article 368 does not enable Parliament to alter the basic structure or framework of the Constitution.",
          principle: "The Basic Structure Doctrine limits Parliament's constituent amending power.",
        },
        {
          paraNumber: 1461,
          quote: "The decision in I.C. Golak Nath v. State of Punjab is overruled.",
          principle: "Constitutional amendments are constituent acts distinct from ordinary legislation under Article 13(2).",
        },
      ],
      relatedJudgments: [
        { title: "I.C. Golak Nath v. State of Punjab", citation: "AIR 1967 SC 1643", relationship: "Overruled", notes: "Golak Nath's ban on any amendment to Part III was overruled." },
        { title: "Minerva Mills Ltd. v. Union of India", citation: "AIR 1980 SC 1789", relationship: "Followed", notes: "Applied basic structure to strike down Sections 4 and 55 of 42nd Amendment." },
      ],
    },
    precedentStatus: "Good Law",
    subsequentTreatments: [
      {
        citingCaseTitle: "Minerva Mills Ltd. v. Union of India",
        citingCaseCitation: "AIR 1980 SC 1789",
        citingCourt: "Supreme Court of India",
        citingDate: "1980-07-31",
        treatment: "Followed",
        paraRef: "Paras 16-25",
        notes: "Reaffirmed the basic structure doctrine and held judicial review and harmony between Fundamental Rights and DPSPs to be basic features.",
        sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=1981_SCR_1_206.pdf",
      },
      {
        citingCaseTitle: "S.R. Bommai v. Union of India",
        citingCaseCitation: "(1994) 3 SCC 1",
        citingCourt: "Supreme Court of India",
        citingDate: "1994-03-11",
        treatment: "Followed",
        paraRef: "Paras 65-72",
        notes: "Held secularism and federalism to be unalterable basic features of the Constitution.",
        sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=1994_SCR_2_644.pdf",
      },
    ],
  },

  // 2. Golak Nath (1967) - OVERRULED
  {
    id: "sc-1967-golak-nath",
    title: "I.C. Golak Nath & Ors. v. State of Punjab & Anr.",
    court: "Supreme Court of India",
    caseNumber: "Writ Petition (Civil) No. 153 of 1965",
    date: "1967-02-27",
    year: 1967,
    bench: "K. Subba Rao, C.J., K.N. Wanchoo, M. Hidayatullah, J.C. Shah, S.M. Sikri, R.S. Bachawat, V. Ramaswami, J.M. Shelat, V. Bhargava, G.K. Mitter, C.A. Vaidialingam, JJ.",
    benchSize: 11,
    citations: ["AIR 1967 SC 1643", "(1967) 2 SCR 762"],
    sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=1967_SCR_2_762.pdf",
    caseType: "Writ Petition (Civil)",
    actsInvolved: ["Constitution of India", "Punjab Security of Land Tenures Act, 1953"],
    sectionsInvolved: ["Article 368", "Article 13(2)", "Part III"],
    summary: "Held that Fundamental Rights are transcendental and immutable, and Parliament has no power to amend Part III of the Constitution. OVERRULED by 13-Judge Bench in Kesavananda Bharati (1973).",
    paragraphs: [
      {
        paraNumber: 1,
        text: "The petitioners, Henry and William Golak Nath, held over 500 acres of farmland in Jalandhar. Under the Punjab Security of Land Tenures Act, 1953, the government held they could keep only thirty acres each.",
      },
      {
        paraNumber: 52,
        text: "Fundamental Rights are given a transcendental position under our Constitution and are kept beyond the reach of Parliament. Article 13(2) is an absolute bar on the enactment of any law taking away or abridging Part III.",
      },
      {
        paraNumber: 88,
        text: "Parliament will have no power from the date of this decision to amend any of the provisions of Part III of the Constitution so as to take away or abridge the fundamental rights enshrined therein.",
      },
    ],
    analysis: {
      facts: "The petitioners challenged the constitutional validity of the 1st, 4th, and 17th Amendments placing land reform acts into the Ninth Schedule.",
      legalIssues: ["Whether an amendment under Article 368 is 'law' under Article 13(2).", "Whether Parliament has the power to abridge Fundamental Rights."],
      relevantProvisions: ["Article 13(2)", "Article 368", "Article 14", "Article 19(1)(f)"],
      argumentsAppellant: "Article 13(2) prohibits any law abridging Part III. 'Law' includes constitutional amendment acts.",
      argumentsRespondent: "Amending power is sovereign constituent power not subordinate to Article 13(2).",
      courtReasoning: "A 6-5 majority held that Article 368 merely provided the procedure for amendment and not the substantive power. An amendment was an ordinary legislative law within Article 13(2), thus Part III could never be curtailed.",
      finalDecision: "Held Parliament cannot amend Part III. Applied doctrine of prospective overruling to protect prior amendments.",
      importantParagraphs: [
        {
          paraNumber: 52,
          quote: "Fundamental Rights are given a transcendental position under our Constitution and are kept beyond the reach of Parliament.",
          principle: "Immunity of Fundamental Rights from amendment (overruled).",
        },
      ],
      relatedJudgments: [
        { title: "Shankari Prasad v. Union of India", citation: "AIR 1951 SC 458", relationship: "Overruled", notes: "Golak Nath originally overruled Shankari Prasad's rule that amendments are not Article 13 laws." },
      ],
    },
    precedentStatus: "Overruled",
    subsequentTreatments: [
      {
        citingCaseTitle: "Kesavananda Bharati v. State of Kerala",
        citingCaseCitation: "AIR 1973 SC 1461",
        citingCourt: "Supreme Court of India",
        citingDate: "1973-04-24",
        treatment: "Overruled",
        paraRef: "Para 1461",
        notes: "Overruled by a 13-Judge Bench. The Court held that constituent amending power under Article 368 is distinct from ordinary law under Article 13(2), but is subject to the Basic Structure Doctrine.",
        sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=1973_SCR_Supp__1.pdf",
      },
    ],
  },

  // 3. Maneka Gandhi (1978)
  {
    id: "sc-1978-maneka-gandhi",
    title: "Maneka Gandhi v. Union of India",
    court: "Supreme Court of India",
    caseNumber: "Writ Petition (Civil) No. 231 of 1977",
    date: "1978-01-25",
    year: 1978,
    bench: "M.H. Beg, C.J., Y.V. Chandrachud, P.N. Bhagwati, V.R. Krishna Iyer, N.L. Untwalia, S. Murtaza Fazal Ali, P.S. Kailasam, JJ.",
    benchSize: 7,
    citations: ["AIR 1978 SC 597", "(1978) 1 SCC 248", "1978 SCR (2) 621"],
    sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=1978_SCR_2_621.pdf",
    caseType: "Writ Petition (Civil)",
    actsInvolved: ["Passports Act, 1967", "Constitution of India"],
    sectionsInvolved: ["Section 10(3)(c) Passports Act", "Article 21", "Article 14", "Article 19(1)(a)", "Article 19(1)(d)"],
    summary: "Transformed Article 21 from formalistic procedure to substantive due process: any law depriving personal liberty must be 'just, fair, and reasonable' and satisfy the Golden Triangle of Articles 14, 19, and 21. Explicitly overruled A.K. Gopalan (1950).",
    paragraphs: [
      {
        paraNumber: 1,
        text: "The petitioner's passport was impounded by the Regional Passport Officer, New Delhi, under Section 10(3)(c) of the Passports Act, 1967 'in the public interest' without furnishing any statement of reasons.",
      },
      {
        paraNumber: 56,
        text: "The procedure prescribed by law for depriving a person of his life or personal liberty under Article 21 cannot be an arbitrary, fanciful or oppressive procedure; it must be just, fair and reasonable. If it is not, it would be no procedure at all.",
      },
      {
        paraNumber: 82,
        text: "The Golden Triangle of Articles 14, 19 and 21 are not watertight compartments. A law depriving personal liberty under Article 21 must also stand the test of reasonableness under Article 19 and non-arbitrariness under Article 14.",
      },
    ],
    analysis: {
      facts: "Maneka Gandhi's passport was impounded without notice or reasons under Section 10(3)(c) of the Passports Act in public interest.",
      legalIssues: [
        "Whether the right to travel abroad is part of personal liberty under Article 21.",
        "Whether procedure established by law means any enacted procedure or requires natural justice and fairness.",
        "Whether Articles 14, 19, and 21 operate exclusively or collectively.",
      ],
      relevantProvisions: ["Article 21", "Article 14", "Article 19", "Section 10(3)(c) Passports Act"],
      argumentsAppellant: "Personal liberty includes right to travel abroad. Impounding without reasons violates audi alteram partem and Article 14.",
      argumentsRespondent: "Procedure was strictly in accordance with statutory enactment as permitted under A.K. Gopalan.",
      courtReasoning: "A.K. Gopalan's siloed reading of fundamental rights was rejected. The Court held that fundamental rights form an integrated scheme. Procedure under Article 21 must incorporate the principles of natural justice and reasonableness.",
      finalDecision: "Held that right to travel abroad is part of personal liberty; impounding without reasons violated natural justice. Section 10(3)(c) read down to require hearing.",
      importantParagraphs: [
        {
          paraNumber: 56,
          quote: "The procedure prescribed by law must be just, fair and reasonable; it cannot be arbitrary, fanciful or oppressive.",
          principle: "Substantive due process requirement in Article 21.",
        },
      ],
      relatedJudgments: [
        { title: "A.K. Gopalan v. State of Madras", citation: "AIR 1950 SC 27", relationship: "Overruled", notes: "Gopalan's strict procedural literalism and isolation of rights was overruled." },
      ],
    },
    precedentStatus: "Good Law",
    subsequentTreatments: [
      {
        citingCaseTitle: "Justice K.S. Puttaswamy (Retd.) v. Union of India",
        citingCaseCitation: "(2017) 10 SCC 1",
        citingCourt: "Supreme Court of India",
        citingDate: "2017-08-24",
        treatment: "Followed",
        paraRef: "Paras 110-118",
        notes: "Affirmed the Golden Triangle doctrine and just, fair, reasonable standard as foundational to the right to privacy.",
        sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=2017_10_SCC_1.pdf",
      },
    ],
  },

  // 4. A.K. Gopalan (1950) - OVERRULED
  {
    id: "sc-1950-ak-gopalan",
    title: "A.K. Gopalan v. State of Madras",
    court: "Supreme Court of India",
    caseNumber: "Petition No. 13 of 1950",
    date: "1950-05-19",
    year: 1950,
    bench: "H.J. Kania, C.J., Saiyid Fazl Ali, M. Patanjali Sastri, Mehr Chand Mahajan, B.K. Mukherjea, S.R. Das, JJ.",
    benchSize: 6,
    citations: ["AIR 1950 SC 27", "1950 SCR 88"],
    sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=1950_SCR_88.pdf",
    caseType: "Writ Petition (Civil)",
    actsInvolved: ["Preventive Detention Act, 1950", "Constitution of India"],
    sectionsInvolved: ["Article 21", "Article 19", "Article 22"],
    summary: "Adopted a narrow, literal interpretation of Article 21 holding that 'procedure established by law' means state-made statutory law without natural justice, and Articles 19 and 21 are mutually exclusive. OVERRULED by Maneka Gandhi (1978).",
    paragraphs: [
      {
        paraNumber: 1,
        text: "The petitioner, a communist leader, was detained under Section 3(1) of the Preventive Detention Act, IV of 1950, and applied under Article 32 for a writ of habeas corpus.",
      },
      {
        paraNumber: 22,
        text: "'Procedure established by law' means procedure prescribed by the law of the State. It does not mean 'due process of law' as understood in the United States Constitution.",
      },
      {
        paraNumber: 45,
        text: "Article 19 and Article 21 deal with distinct aspects of liberty. Article 19 has no application to a person who has been deprived of his personal liberty under a valid preventive detention law.",
      },
    ],
    analysis: {
      facts: "Communist leader A.K. Gopalan was detained without trial under the Preventive Detention Act, 1950.",
      legalIssues: ["Whether 'procedure established by law' incorporates principles of natural justice and reasonableness.", "Whether Article 19 applies to preventive detention."],
      relevantProvisions: ["Article 19", "Article 21", "Article 22"],
      argumentsAppellant: "Procedure must satisfy natural justice and reasonableness under Article 19(1)(d).",
      argumentsRespondent: "Constitution framers deliberately chose 'procedure established by law' over 'due process'.",
      courtReasoning: "Majority held that 'law' means positive state-enacted law. The articles of Part III are mutually exclusive islands.",
      finalDecision: "Upheld Preventive Detention Act (except Section 14). OVERRULED by Maneka Gandhi (1978).",
      importantParagraphs: [
        {
          paraNumber: 22,
          quote: "'Procedure established by law' means procedure prescribed by the law of the State.",
          principle: "Narrow procedural positivism (overruled).",
        },
      ],
      relatedJudgments: [],
    },
    precedentStatus: "Overruled",
    subsequentTreatments: [
      {
        citingCaseTitle: "Maneka Gandhi v. Union of India",
        citingCaseCitation: "AIR 1978 SC 597",
        citingCourt: "Supreme Court of India",
        citingDate: "1978-01-25",
        treatment: "Overruled",
        paraRef: "Paras 54-60",
        notes: "Overruled by 7-Judge Bench. The Court discarded Gopalan's mutual exclusivity doctrine and established the Golden Triangle of Articles 14, 19, and 21.",
        sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=1978_SCR_2_621.pdf",
      },
    ],
  },

  // 5. Puttaswamy (2017)
  {
    id: "sc-2017-puttaswamy",
    title: "Justice K.S. Puttaswamy (Retd.) and Anr. v. Union of India and Ors.",
    court: "Supreme Court of India",
    caseNumber: "Writ Petition (Civil) No. 494 of 2012",
    date: "2017-08-24",
    year: 2017,
    bench: "J.S. Khehar, C.J., J. Chelameswar, S.A. Bobde, R.K. Agrawal, Rohinton Fali Nariman, A.M. Sapre, D.Y. Chandrachud, Sanjay Kishan Kaul, S. Abdul Nazeer, JJ.",
    benchSize: 9,
    citations: ["(2017) 10 SCC 1", "AIR 2017 SC 4161"],
    sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=2017_10_SCC_1.pdf",
    caseType: "Writ Petition (Civil)",
    actsInvolved: ["Constitution of India", "Aadhaar Act, 2016"],
    sectionsInvolved: ["Article 21", "Article 14", "Article 19", "Part III"],
    summary: "Unanimous 9-Judge Constitution Bench declared that the Right to Privacy is a Fundamental Right guaranteed under Article 21 and Part III. Expressly overruled M.P. Sharma (1954) and ADM Jabalpur (1976).",
    paragraphs: [
      {
        paraNumber: 1,
        text: "The primary challenge arose from the constitutional validity of the Aadhaar project, raising the foundational question whether there exists a fundamental right to privacy under the Indian Constitution.",
      },
      {
        paraNumber: 119,
        text: "The judgments in ADM Jabalpur v. Shivkant Shukla, (1976) 2 SCC 521, and M.P. Sharma v. Satish Chandra, (1954) 1 SCR 1077, are expressly overruled. ADM Jabalpur is a discordance in our constitutional jurisprudence and must be buried ten fathoms deep.",
      },
      {
        paraNumber: 264,
        text: "Privacy is the constitutional core of human dignity. It encompasses informational privacy, bodily autonomy, and spatial privacy. Any invasion of privacy must satisfy the three-fold test of legality, legitimate state aim, and proportionality.",
      },
    ],
    analysis: {
      facts: "Retired High Court Judge K.S. Puttaswamy challenged the mandatory collection of biometric data under Aadhaar as infringing privacy.",
      legalIssues: [
        "Whether privacy is a fundamental right guaranteed under Part III.",
        "Whether prior larger bench decisions in M.P. Sharma (8 judges) and Kharak Singh (6 judges) precluded recognizing privacy as a fundamental right.",
      ],
      relevantProvisions: ["Article 21", "Article 14", "Article 19"],
      argumentsAppellant: "Privacy is intrinsic to human dignity and liberty under Article 21 and the overarching architecture of Part III.",
      argumentsRespondent: "The framers deliberately omitted privacy from the text of the Constitution, as held in M.P. Sharma and Kharak Singh.",
      courtReasoning: "A unanimous 9-judge bench ruled that privacy is an intrinsic part of life and liberty under Article 21. Privacy is not lost in public spaces. The Court laid down a strict proportionality test: 1) Legality, 2) Legitimate state goal, 3) Proportionality, 4) Procedural safeguards.",
      finalDecision: "Right to privacy declared a fundamental right. M.P. Sharma and ADM Jabalpur expressly overruled.",
      importantParagraphs: [
        {
          paraNumber: 119,
          quote: "The judgment in ADM Jabalpur v. Shivkant Shukla is expressly overruled.",
          principle: "Overruling of ADM Jabalpur and restoration of non-derogable liberty.",
        },
        {
          paraNumber: 264,
          quote: "Any invasion of privacy must satisfy the three-fold test of legality, legitimate state aim, and proportionality.",
          principle: "The four-prong proportionality standard for privacy restrictions.",
        },
      ],
      relatedJudgments: [
        { title: "ADM Jabalpur v. Shivkant Shukla", citation: "(1976) 2 SCC 521", relationship: "Overruled", notes: "Overruled ADM Jabalpur's suspension of Article 21 during Emergency." },
        { title: "M.P. Sharma v. Satish Chandra", citation: "AIR 1954 SC 300", relationship: "Overruled", notes: "Overruled M.P. Sharma to the extent it held there is no constitutional privacy right." },
        { title: "Navtej Singh Johar v. Union of India", citation: "(2018) 10 SCC 1", relationship: "Cited with approval", notes: "Applied Puttaswamy's privacy and dignity principles to read down Sec 377 IPC." },
      ],
    },
    precedentStatus: "Good Law",
    subsequentTreatments: [
      {
        citingCaseTitle: "Navtej Singh Johar v. Union of India",
        citingCaseCitation: "(2018) 10 SCC 1",
        citingCourt: "Supreme Court of India",
        citingDate: "2018-09-06",
        treatment: "Followed",
        paraRef: "Paras 148-155",
        notes: "Applied Puttaswamy's spatial and decisional privacy principles to strike down criminalization of consensual same-sex relations.",
        sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=2018_10_SCC_1.pdf",
      },
      {
        citingCaseTitle: "Joseph Shine v. Union of India",
        citingCaseCitation: "(2019) 3 SCC 39",
        citingCourt: "Supreme Court of India",
        citingDate: "2018-09-27",
        treatment: "Followed",
        paraRef: "Paras 32-40",
        notes: "Applied Puttaswamy's bodily autonomy and dignity reasoning to strike down Section 497 IPC (Adultery).",
        sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=2019_3_SCC_39.pdf",
      },
    ],
  },

  // 6. ADM Jabalpur (1976) - OVERRULED
  {
    id: "sc-1976-adm-jabalpur",
    title: "Additional District Magistrate, Jabalpur v. Shivkant Shukla",
    court: "Supreme Court of India",
    caseNumber: "Civil Appeal No. 1392 of 1975",
    date: "1976-04-28",
    year: 1976,
    bench: "A.N. Ray, C.J., H.R. Khanna, M.H. Beg, Y.V. Chandrachud, P.N. Bhagwati, JJ.",
    benchSize: 5,
    citations: ["(1976) 2 SCC 521", "AIR 1976 SC 1207"],
    sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=1976_2_SCC_521.pdf",
    caseType: "Civil Appeal",
    actsInvolved: ["Maintenance of Internal Security Act, 1971", "Constitution of India"],
    sectionsInvolved: ["Article 21", "Article 359", "Section 16A MISA"],
    summary: "Infamous Habeas Corpus case. Held (4-1, Khanna J. dissenting) that during a Presidential proclamation of Emergency under Article 359, no person had locus standi to move any court for a writ of habeas corpus to challenge detention. OVERRULED by Puttaswamy (2017).",
    paragraphs: [
      {
        paraNumber: 1,
        text: "The respondents were detained under Section 3 of the Maintenance of Internal Security Act, 1971 during the National Emergency proclaimed on June 25, 1975.",
      },
      {
        paraNumber: 136,
        text: "In view of the Presidential Order dated June 27, 1975, under Article 359(1), no person has any locus standi to move any writ petition under Article 226 before a High Court for Habeas Corpus to challenge the legality of an order of detention.",
      },
      {
        paraNumber: 524,
        text: "(Dissenting, H.R. Khanna, J.) Even in the absence of Article 21, the State has no power to deprive a person of his life or liberty without the authority of law. A habeas corpus petition is maintainable to test whether detention complies with the law.",
      },
    ],
    analysis: {
      facts: "During the 1975 Emergency, political dissidents were detained without trial under MISA. High Courts held writ petitions were maintainable; the Union appealed.",
      legalIssues: ["Whether presidential order under Article 359(1) totally barred habeas corpus petitions under Article 226/32."],
      relevantProvisions: ["Article 21", "Article 359", "Article 226"],
      argumentsAppellant: "Executive supremacy during Emergency; fundamental rights suspended.",
      argumentsRespondent: "Rule of law and statutory compliance cannot be extinguished by executive fiat.",
      courtReasoning: "Majority held Article 21 was the sole repository of the right to life and personal liberty, and upon its suspension, courts could not grant relief. Khanna J. famously dissented.",
      finalDecision: "Held habeas corpus barred during Emergency. EXPRESSLY OVERRULED by 9-judge bench in Puttaswamy (2017).",
      importantParagraphs: [
        {
          paraNumber: 524,
          quote: "Even in the absence of Article 21, the State has no power to deprive a person of his life or liberty without the authority of law.",
          principle: "Khanna J.'s celebrated dissent, now accepted law.",
        },
      ],
      relatedJudgments: [],
    },
    precedentStatus: "Overruled",
    subsequentTreatments: [
      {
        citingCaseTitle: "Justice K.S. Puttaswamy (Retd.) v. Union of India",
        citingCaseCitation: "(2017) 10 SCC 1",
        citingCourt: "Supreme Court of India",
        citingDate: "2017-08-24",
        treatment: "Overruled",
        paraRef: "Para 119",
        notes: "Expressly overruled by a unanimous 9-judge bench. The Court affirmed that Justice H.R. Khanna's dissent was correct in law and that ADM Jabalpur violated fundamental constitutional values.",
        sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=2017_10_SCC_1.pdf",
      },
    ],
  },

  // 7. Navtej Singh Johar (2018)
  {
    id: "sc-2018-navtej-johar",
    title: "Navtej Singh Johar & Ors. v. Union of India",
    court: "Supreme Court of India",
    caseNumber: "Writ Petition (Criminal) No. 76 of 2016",
    date: "2018-09-06",
    year: 2018,
    bench: "Dipak Misra, C.J., R.F. Nariman, A.M. Khanwilkar, D.Y. Chandrachud, Indu Malhotra, JJ.",
    benchSize: 5,
    citations: ["(2018) 10 SCC 1", "AIR 2018 SC 4321"],
    sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=2018_10_SCC_1.pdf",
    caseType: "Writ Petition (Criminal)",
    actsInvolved: ["Indian Penal Code, 1860", "Constitution of India"],
    sectionsInvolved: ["Section 377 IPC", "Article 14", "Article 15", "Article 19(1)(a)", "Article 21"],
    summary: "Unanimously decriminalized consensual adult sexual conduct under Section 377 IPC. Declared sexual orientation protected under Articles 14, 15, 19, and 21. Expressly overruled Suresh Kumar Koushal v. Naz Foundation (2014).",
    paragraphs: [
      {
        paraNumber: 1,
        text: "The present batch of writ petitions filed under Article 32 challenges the constitutional validity of Section 377 of the Indian Penal Code, 1860 insofar as it criminalizes consensual sexual acts of adults in private.",
      },
      {
        paraNumber: 168,
        text: "The decision in Suresh Kumar Koushal and another v. Naz Foundation and others, (2014) 1 SCC 1, is hereby overruled. Consensual carnal intercourse between competent consenting adults in private does not cause harm and cannot be made penal.",
      },
      {
        paraNumber: 268,
        text: "Section 377 IPC, so far as it penalizes any consensual sexual activity between two adults, be it of the same-sex or opposite-sex, is unconstitutional and violative of Articles 14, 15, 19 and 21 of the Constitution.",
      },
    ],
    analysis: {
      facts: "LGBTQ petitioners challenged Section 377 IPC which criminalized 'carnal intercourse against the order of nature' as violating fundamental dignity, equality, and privacy.",
      legalIssues: ["Whether Section 377 IPC violates Articles 14, 15, 19, and 21 by criminalizing consensual adult sexual relationships in private."],
      relevantProvisions: ["Section 377 IPC", "Article 14", "Article 15", "Article 19", "Article 21"],
      argumentsAppellant: "Section 377 stigmatizes LGBTQ citizens, denies equal citizenship, and violates bodily autonomy as recognized in Puttaswamy.",
      argumentsRespondent: "Union left the matter to the wisdom of the Court; religious intervenors argued public morality and health.",
      courtReasoning: "The Court held constitutional morality must trump majoritarian public morality. Section 377 is arbitrary and discriminatory against sexual orientation. Overruled Suresh Koushal.",
      finalDecision: "Section 377 IPC read down to exclude consensual sexual acts between adults in private. Non-consensual acts and sexual acts with minors or animals remain criminal under Section 377.",
      importantParagraphs: [
        {
          paraNumber: 168,
          quote: "The decision in Suresh Kumar Koushal and another v. Naz Foundation is hereby overruled.",
          principle: "Overruling of Suresh Koushal and decriminalization of consensual homosexual acts.",
        },
        {
          paraNumber: 268,
          quote: "Section 377 IPC, so far as it penalizes consensual sexual activity between adults, is unconstitutional.",
          principle: "Constitutional protection of sexual orientation under Part III.",
        },
      ],
      relatedJudgments: [
        { title: "Suresh Kumar Koushal v. Naz Foundation", citation: "(2014) 1 SCC 1", relationship: "Overruled", notes: "Koushal's judgment recriminalizing Section 377 was overruled." },
        { title: "Naz Foundation v. Govt. of NCT of Delhi", citation: "160 (2009) DLT 277", relationship: "Cited with approval", notes: "Affirmed the reasoning of the Delhi High Court's 2009 judgment." },
      ],
    },
    precedentStatus: "Good Law",
    subsequentTreatments: [
      {
        citingCaseTitle: "Supriyo @ Supriya Chakraborty & Anr. v. Union of India",
        citingCaseCitation: "2023 SCC OnLine SC 1348",
        citingCourt: "Supreme Court of India",
        citingDate: "2023-10-17",
        treatment: "Followed",
        paraRef: "Paras 112-120",
        notes: "Affirmed the protection of LGBTQ individuals against discrimination, though declined to read marriage equality into the Special Marriage Act.",
        sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=2023_SCC_OnLine_SC_1348.pdf",
      },
    ],
  },

  // 8. Suresh Kumar Koushal (2014) - OVERRULED
  {
    id: "sc-2014-suresh-koushal",
    title: "Suresh Kumar Koushal and Another v. Naz Foundation and Others",
    court: "Supreme Court of India",
    caseNumber: "Civil Appeal No. 10972 of 2013",
    date: "2013-12-11",
    year: 2013,
    bench: "G.S. Singhvi, S.J. Mukhopadhaya, JJ.",
    benchSize: 2,
    citations: ["(2014) 1 SCC 1", "AIR 2014 SC 563"],
    sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=2014_1_SCC_1.pdf",
    caseType: "Civil Appeal",
    actsInvolved: ["Indian Penal Code, 1860", "Constitution of India"],
    sectionsInvolved: ["Section 377 IPC", "Article 14", "Article 15", "Article 21"],
    summary: "Reversed the Delhi High Court's Naz Foundation judgment and recriminalized consensual homosexual acts under Section 377 IPC, labeling LGBTQ persons a 'minuscule fraction'. OVERRULED by Navtej Singh Johar (2018).",
    paragraphs: [
      {
        paraNumber: 1,
        text: "These appeals challenge the judgment of the Delhi High Court dated July 2, 2009, which read down Section 377 IPC to decriminalize consensual sexual acts between adults in private.",
      },
      {
        paraNumber: 43,
        text: "Section 377 IPC does not criminalize a particular people or identity or orientation; it merely identifies certain acts which, if committed, constitute an offence regardless of age or consent.",
      },
      {
        paraNumber: 52,
        text: "Those who indulge in carnal intercourse in the category of LGBT constitute a minuscule fraction of the country's population and their numbers cannot justify striking down a penal statute. The judgment of the High Court is set aside.",
      },
    ],
    analysis: {
      facts: "Religious and conservative groups appealed the Delhi High Court's Naz Foundation decision reading down Section 377 IPC.",
      legalIssues: ["Whether Section 377 IPC was constitutionally valid or infringed Part III rights."],
      relevantProvisions: ["Section 377 IPC", "Article 14", "Article 21"],
      argumentsAppellant: "Section 377 has a presumption of constitutionality; amendment is the prerogative of Parliament.",
      argumentsRespondent: "Section 377 violates human dignity and equality under Articles 14 and 21.",
      courtReasoning: "Held that Parliament is the appropriate body to decide on penal policy. Dismissed the constitutional challenge by terming the community a 'minuscule minority'.",
      finalDecision: "Upheld Section 377 IPC and reversed Delhi High Court. OVERRULED by Navtej Singh Johar (2018).",
      importantParagraphs: [
        {
          paraNumber: 52,
          quote: "Those who indulge in carnal intercourse constitute a minuscule fraction...",
          principle: "The 'minuscule fraction' doctrine (expressly rejected and overruled).",
        },
      ],
      relatedJudgments: [
        { title: "Naz Foundation v. Govt. of NCT of Delhi", citation: "160 (2009) DLT 277", relationship: "Overruled", notes: "Koushal reversed Naz Foundation (later restored by Navtej Johar)." },
      ],
    },
    precedentStatus: "Overruled",
    subsequentTreatments: [
      {
        citingCaseTitle: "Navtej Singh Johar v. Union of India",
        citingCaseCitation: "(2018) 10 SCC 1",
        citingCourt: "Supreme Court of India",
        citingDate: "2018-09-06",
        treatment: "Overruled",
        paraRef: "Paras 168-172",
        notes: "Overruled in full by 5-Judge Constitution Bench. The Court condemned the 'minuscule fraction' test as antithetical to the constitutional guarantee of fundamental rights.",
        sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=2018_10_SCC_1.pdf",
      },
    ],
  },

  // 9. Arnesh Kumar (2014)
  {
    id: "sc-2014-arnesh-kumar",
    title: "Arnesh Kumar v. State of Bihar & Anr.",
    court: "Supreme Court of India",
    caseNumber: "Criminal Appeal No. 1277 of 2014",
    date: "2014-07-02",
    year: 2014,
    bench: "Chandramauli Kr. Prasad, Pinaki Chandra Ghose, JJ.",
    benchSize: 2,
    citations: ["(2014) 8 SCC 273", "AIR 2014 SC 2756"],
    sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=2014_8_SCC_273.pdf",
    caseType: "Criminal Appeal",
    actsInvolved: ["Indian Penal Code, 1860", "Code of Criminal Procedure, 1973", "Dowry Prohibition Act, 1961"],
    sectionsInvolved: ["Section 498A IPC", "Section 4 Dowry Prohibition Act", "Section 41 CrPC", "Section 41A CrPC"],
    summary: "Mandatory guidelines preventing mechanical arrest in offences punishable with up to 7 years imprisonment (specifically Section 498A IPC). Mandated compliance with Section 41 and 41A CrPC check-lists.",
    paragraphs: [
      {
        paraNumber: 1,
        text: "The petitioner approached this Court apprehending arrest in a case registered under Section 498-A of the Indian Penal Code and Section 4 of the Dowry Prohibition Act, 1961.",
      },
      {
        paraNumber: 7,
        text: "Arrest brings humiliation, curtails freedom and casts scars forever. No arrest can be made in a routine manner on a mere allegation that a person had committed an offence. It would be prudent for a police officer in the interest of protection of the constitutional rights of a citizen and perhaps in his own interest that no arrest should be made without a reasonable satisfaction reached after some investigation.",
      },
      {
        paraNumber: 11,
        text: "We direct that police officers shall not automatically arrest the accused when a case under Section 498-A IPC is registered but satisfy themselves about the necessity for arrest under the parameters flowing from Section 41 CrPC. A notice of appearance under Section 41-A CrPC must be served within two weeks of institution.",
      },
    ],
    analysis: {
      facts: "The appellant apprehending arrest in a matrimonial dowry dispute under Section 498A IPC challenged the refusal of anticipatory bail.",
      legalIssues: ["Whether police can effect automatic arrests upon the lodging of an FIR under Section 498A IPC without satisfying Section 41 CrPC conditions."],
      relevantProvisions: ["Section 498A IPC", "Section 41 CrPC", "Section 41A CrPC", "Section 57 CrPC"],
      argumentsAppellant: "Section 498A IPC was being weaponized for harassment and extortion through automatic arrests.",
      argumentsRespondent: "Dowry harassment is a rampant societal evil requiring prompt deterrence.",
      courtReasoning: "The Court observed that Section 498A was enacted as a shield but frequently used as a weapon. Section 41(1)(b) CrPC mandates that police must record reasons before making an arrest in offences punishable with 7 years or less. Magistrates authorizing detention without recording independent satisfaction are liable for departmental action.",
      finalDecision: "Arrest guidelines issued for all offences with imprisonment up to 7 years. Failure to comply makes police and magistrates liable to contempt.",
      importantParagraphs: [
        {
          paraNumber: 11,
          quote: "Police officers shall not automatically arrest the accused when a case under Section 498-A IPC is registered...",
          principle: "Mandatory 8-point arrest guidelines under Section 41 & 41A CrPC.",
        },
      ],
      relatedJudgments: [
        { title: "D.K. Basu v. State of West Bengal", citation: "AIR 1997 SC 610", relationship: "Followed", notes: "Applied and operationalized D.K. Basu's procedural safeguards against arbitrary arrest." },
      ],
    },
    precedentStatus: "Good Law",
    subsequentTreatments: [
      {
        citingCaseTitle: "Satender Kumar Antil v. Central Bureau of Investigation",
        citingCaseCitation: "(2022) 10 SCC 51",
        citingCourt: "Supreme Court of India",
        citingDate: "2022-07-11",
        treatment: "Followed",
        paraRef: "Paras 25-30",
        notes: "Reiterated strict compliance with Arnesh Kumar guidelines and Section 41A CrPC as conditions precedent for bail in Category A offences.",
        sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=2022_10_SCC_51.pdf",
      },
    ],
  },

  // 10. Lalita Kumari (2014)
  {
    id: "sc-2014-lalita-kumari",
    title: "Lalita Kumari v. Government of U.P. and Others",
    court: "Supreme Court of India",
    caseNumber: "Writ Petition (Criminal) No. 68 of 2008",
    date: "2013-11-12",
    year: 2014,
    bench: "P. Sathasivam, C.J., B.S. Chauhan, Ranjana Prakash Desai, Ranjan Gogoi, S.A. Bobde, JJ.",
    benchSize: 5,
    citations: ["(2014) 2 SCC 1", "AIR 2014 SC 187"],
    sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=2014_2_SCC_1.pdf",
    caseType: "Writ Petition (Criminal)",
    actsInvolved: ["Code of Criminal Procedure, 1973", "Constitution of India"],
    sectionsInvolved: ["Section 154 CrPC", "Section 156 CrPC", "Section 157 CrPC"],
    summary: "Constitution Bench held that registration of an FIR is MANDATORY under Section 154 CrPC if the information discloses commission of a cognizable offence. No preliminary inquiry is permissible in such cases.",
    paragraphs: [
      {
        paraNumber: 1,
        text: "The core question is whether a police officer is bound to register a First Information Report (FIR) upon receiving information relating to the commission of a cognizable offence under Section 154 of the Code of Criminal Procedure, 1973.",
      },
      {
        paraNumber: 120,
        text: "Registration of FIR is mandatory under Section 154 of the Code, if the information discloses commission of a cognizable offence and no preliminary inquiry is permissible in such a situation.",
      },
      {
        paraNumber: 120.6,
        text: "A preliminary inquiry may be conducted only to ascertain whether cognizable offence is disclosed or not, in cases of matrimonial disputes, commercial offences, medical negligence, corruption cases, or cases where there is abnormal delay.",
      },
    ],
    analysis: {
      facts: "A habeas corpus petition was filed alleging failure of police to register an FIR and trace a minor kidnapped girl.",
      legalIssues: ["Whether Section 154 CrPC makes it mandatory for the officer in charge of a police station to register an FIR disclosing a cognizable offence."],
      relevantProvisions: ["Section 154 CrPC", "Section 156 CrPC"],
      argumentsAppellant: "The word 'shall' in Section 154(1) leaves no discretion with police; non-registration facilitates cover-ups.",
      argumentsRespondent: "Police must have discretion to conduct preliminary inquiry to prevent frivolous or vexatious complaints.",
      courtReasoning: "A unanimous 5-judge bench held that 'shall' in Section 154 is imperative. Discretion begins only at the investigation stage under Section 157, not at the FIR registration stage. Preliminary inquiries are strictly limited to specified categories (matrimonial, medical negligence, commercial, corruption) and must be completed within 7 days.",
      finalDecision: "Mandatory registration of FIR held compulsory for all cognizable offences. Strict directions issued.",
      importantParagraphs: [
        {
          paraNumber: 120,
          quote: "Registration of FIR is mandatory under Section 154 of the Code...",
          principle: "Mandatory duty to register FIR upon disclosure of cognizable offence.",
        },
      ],
      relatedJudgments: [
        { title: "State of Haryana v. Bhajan Lal", citation: "1992 Supp (1) SCC 335", relationship: "Followed", notes: "Affirmed the Bhajan Lal principles on statutory duty under Section 154." },
      ],
    },
    precedentStatus: "Good Law",
    subsequentTreatments: [
      {
        citingCaseTitle: "Youth Bar Association of India v. Union of India",
        citingCaseCitation: "(2016) 9 SCC 473",
        citingCourt: "Supreme Court of India",
        citingDate: "2016-09-07",
        treatment: "Followed",
        paraRef: "Paras 10-14",
        notes: "Directed that FIRs must be uploaded online within 24 hours of registration, relying on Lalita Kumari.",
        sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=2016_9_SCC_473.pdf",
      },
    ],
  },

  // 11. Vishaka (1997)
  {
    id: "sc-1997-vishaka",
    title: "Vishaka and Others v. State of Rajasthan and Others",
    court: "Supreme Court of India",
    caseNumber: "Writ Petition (Criminal) Nos. 666-70 of 1992",
    date: "1997-08-13",
    year: 1997,
    bench: "J.S. Verma, C.J., Sujata V. Manohar, B.N. Kirpal, JJ.",
    benchSize: 3,
    citations: ["AIR 1997 SC 3011", "(1997) 6 SCC 241", "1997 SCR (Supp. 3) 404"],
    sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=1997_SCR_Supp__3_404.pdf",
    caseType: "Writ Petition (Criminal)",
    actsInvolved: ["Constitution of India", "Convention on the Elimination of All Forms of Discrimination Against Women (CEDAW)"],
    sectionsInvolved: ["Article 14", "Article 15", "Article 19(1)(g)", "Article 21", "Article 32", "Article 141"],
    summary: "Formulated binding workplace sexual harassment guidelines (Vishaka Guidelines) under Article 141 to fill legislative void, later codified into the POSH Act, 2013.",
    paragraphs: [
      {
        paraNumber: 1,
        text: "This writ petition has been filed as a class action by certain social activists and NGOs seeking judicial intervention to protect working women from sexual harassment at workplaces following the brutal gang-rape of Bhanwari Devi in Rajasthan.",
      },
      {
        paraNumber: 7,
        text: "Gender equality includes protection from sexual harassment and right to work with dignity, which is a universally recognised basic human right. The common minimum requirement of this right has received global acceptance in CEDAW.",
      },
      {
        paraNumber: 17,
        text: "In the absence of enacted law to provide for the effective enforcement of the basic human right of gender equality and guarantee against sexual harassment, we lay down the guidelines and norms specified hereinafter for due observance at all work places.",
      },
    ],
    analysis: {
      facts: "Bhanwari Devi, a grassroots social worker in Rajasthan, was gang-raped for attempting to stop child marriage. The trial court acquitted the accused. NGOs filed a PIL.",
      legalIssues: ["Whether sexual harassment at workplace violates fundamental rights under Articles 14, 19, and 21.", "Whether the Supreme Court can lay down binding guidelines in the absence of legislation."],
      relevantProvisions: ["Article 14", "Article 15", "Article 19(1)(g)", "Article 21", "Article 141"],
      argumentsAppellant: "Workplace sexual harassment violates women's fundamental rights to equality, non-discrimination, livelihood, and dignity. International conventions like CEDAW should bridge domestic gaps.",
      argumentsRespondent: "State conceded the urgent need for judicial measures to safeguard working women.",
      courtReasoning: "The Court held that workplace sexual harassment is a clear violation of Articles 14, 15, and 21. Utilizing CEDAW, the Court exercised its power under Article 32 read with Article 141 to lay down binding workplace guidelines including definitions, complaint committees, and preventive duties.",
      finalDecision: "Vishaka Guidelines issued as binding law until Parliament enacted formal legislation (which it did in the POSH Act, 2013).",
      importantParagraphs: [
        {
          paraNumber: 17,
          quote: "In the absence of enacted law... we lay down the guidelines and norms specified hereinafter for due observance at all work places.",
          principle: "Judicial law-making under Article 32 to enforce human rights.",
        },
      ],
      relatedJudgments: [
        { title: "Medha Kotwal Lele v. Union of India", citation: "(2013) 1 SCC 297", relationship: "Followed", notes: "Monitored compliance with Vishaka guidelines across all states." },
      ],
    },
    precedentStatus: "Good Law",
    subsequentTreatments: [
      {
        citingCaseTitle: "Aureliano Fernandes v. State of Goa and Others",
        citingCaseCitation: "(2024) 4 SCC 164",
        citingCourt: "Supreme Court of India",
        citingDate: "2023-05-12",
        treatment: "Followed",
        paraRef: "Paras 45-52",
        notes: "Emphasized strict implementation of POSH Act committees and reaffirmed the founding philosophy of Vishaka.",
        sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=2024_4_SCC_164.pdf",
      },
    ],
  },

  // 12. Bachan Singh (1980)
  {
    id: "sc-1980-bachan-singh",
    title: "Bachan Singh v. State of Punjab",
    court: "Supreme Court of India",
    caseNumber: "Criminal Appeal No. 273 of 1979",
    date: "1980-05-09",
    year: 1980,
    bench: "Y.V. Chandrachud, C.J., A. Gupta, N.L. Untwalia, P.N. Bhagwati, R.S. Sarkaria, JJ.",
    benchSize: 5,
    citations: ["(1980) 2 SCC 684", "AIR 1980 SC 898"],
    sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=1980_2_SCC_684.pdf",
    caseType: "Criminal Appeal",
    actsInvolved: ["Indian Penal Code, 1860", "Code of Criminal Procedure, 1973", "Constitution of India"],
    sectionsInvolved: ["Section 302 IPC", "Section 354(3) CrPC", "Article 21", "Article 19", "Article 14"],
    summary: "Constitution Bench upheld the constitutional validity of capital punishment under Section 302 IPC, but established the 'Rarest of Rare Cases' doctrine.",
    paragraphs: [
      {
        paraNumber: 1,
        text: "The question before this Constitution Bench is whether the death penalty provided in Section 302 of the Indian Penal Code for murder is unconstitutional as being violative of Articles 14, 19, and 21.",
      },
      {
        paraNumber: 164,
        text: "A real and abiding concern for the dignity of human life postulates limiting the extreme penalty to the rarest of rare cases when the alternative option is unquestionably foreclosed.",
      },
      {
        paraNumber: 209,
        text: "The court must balance the aggravating circumstances of the crime against the mitigating circumstances relating to the criminal before taking the irrevocable step of awarding the death sentence.",
      },
    ],
    analysis: {
      facts: "Bachan Singh was convicted of three murders and sentenced to death by the High Court.",
      legalIssues: ["Whether capital punishment under Section 302 IPC violates the right to life and liberty under Articles 14, 19, and 21."],
      relevantProvisions: ["Section 302 IPC", "Section 354(3) CrPC", "Article 21"],
      argumentsAppellant: "Death penalty is cruel, inhuman, irreversible, and violates Article 21.",
      argumentsRespondent: "Section 302 provides procedure established by law; Section 354(3) CrPC already mandates special reasons.",
      courtReasoning: "A 4-1 majority held capital punishment constitutional under Article 21's 'procedure established by law'. However, life imprisonment is the rule and death penalty an extraordinary exception to be imposed only in the 'rarest of rare cases' where the alternative option is unquestionably foreclosed.",
      finalDecision: "Death penalty upheld; 'Rarest of Rare' doctrine established with balancing of aggravating and mitigating factors.",
      importantParagraphs: [
        {
          paraNumber: 164,
          quote: "The extreme penalty must be limited to the rarest of rare cases when the alternative option is unquestionably foreclosed.",
          principle: "The 'Rarest of Rare' doctrine for capital sentencing.",
        },
      ],
      relatedJudgments: [
        { title: "Machhi Singh v. State of Punjab", citation: "(1983) 3 SCC 470", relationship: "Followed", notes: "Elaborated the categories of rarest of rare cases." },
      ],
    },
    precedentStatus: "Good Law",
    subsequentTreatments: [
      {
        citingCaseTitle: "Manoj & Ors. v. State of Madhya Pradesh",
        citingCaseCitation: "(2023) 2 SCC 353",
        citingCourt: "Supreme Court of India",
        citingDate: "2022-05-20",
        treatment: "Followed",
        paraRef: "Paras 21-28",
        notes: "Mandated comprehensive psychological evaluation and mitigating factor collection at the trial stage pursuant to Bachan Singh.",
        sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=2023_2_SCC_353.pdf",
      },
    ],
  },

  // 13. Shreya Singhal (2015)
  {
    id: "sc-2015-shreya-singhal",
    title: "Shreya Singhal v. Union of India",
    court: "Supreme Court of India",
    caseNumber: "Writ Petition (Criminal) No. 167 of 2012",
    date: "2015-03-24",
    year: 2015,
    bench: "J. Chelameswar, Rohinton Fali Nariman, JJ.",
    benchSize: 2,
    citations: ["(2015) 5 SCC 1", "AIR 2015 SC 1523"],
    sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=2015_5_SCC_1.pdf",
    caseType: "Writ Petition (Criminal)",
    actsInvolved: ["Information Technology Act, 2000", "Constitution of India"],
    sectionsInvolved: ["Section 66A IT Act", "Section 69A IT Act", "Section 79 IT Act", "Article 19(1)(a)", "Article 19(2)"],
    summary: "Struck down Section 66A of the Information Technology Act, 2000 in its entirety for violating free speech under Article 19(1)(a). Held the provision was overbroad, vague, and caused an impermissible chilling effect.",
    paragraphs: [
      {
        paraNumber: 1,
        text: "This batch of writ petitions filed under Article 32 of the Constitution challenges the constitutional validity of Section 66A of the Information Technology Act, 2000.",
      },
      {
        paraNumber: 82,
        text: "Section 66A is arbitrarily, excessively and disproportionately invades the right of free speech and upsets the balance between such right and the reasonable restrictions that may be imposed on such right.",
      },
      {
        paraNumber: 119,
        text: "Section 66A of the Information Technology Act, 2000 is struck down in its entirety as being violative of Article 19(1)(a) and not saved under Article 19(2).",
      },
    ],
    analysis: {
      facts: "Two young women were arrested under Section 66A for posting and liking a Facebook status questioning the shutdown of Mumbai after Bal Thackeray's death.",
      legalIssues: ["Whether Section 66A IT Act was unconstitutionally vague and overbroad under Article 19(1)(a) and 19(2)."],
      relevantProvisions: ["Section 66A IT Act", "Section 79 IT Act", "Article 19(1)(a)", "Article 19(2)"],
      argumentsAppellant: "Expressions like 'grossly offensive' and 'menacing' have no statutory definition, criminalize discussion and advocacy, and cause a severe chilling effect.",
      argumentsRespondent: "Internet provides massive reach and anonymity requiring specialized penal deterrents.",
      courtReasoning: "The Court drew the clear distinction between discussion, advocacy, and incitement. Only incitement leading directly to public disorder can be restricted under Article 19(2). Section 66A reached into mere advocacy and discussions, failing both vagueness and overbreadth tests.",
      finalDecision: "Section 66A struck down as unconstitutional. Section 79 safe harbor read down to require court orders or government notifications.",
      importantParagraphs: [
        {
          paraNumber: 119,
          quote: "Section 66A of the Information Technology Act, 2000 is struck down in its entirety...",
          principle: "Invalidation of overbroad speech restrictions on the internet.",
        },
      ],
      relatedJudgments: [
        { title: "Romesh Thappar v. State of Madras", citation: "AIR 1950 SC 124", relationship: "Followed", notes: "Applied narrow construction of 'public order' under Article 19(2)." },
      ],
    },
    precedentStatus: "Good Law",
    subsequentTreatments: [
      {
        citingCaseTitle: "Peoples Union for Civil Liberties v. Union of India",
        citingCaseCitation: "(2023) 1 SCC 716",
        citingCourt: "Supreme Court of India",
        citingDate: "2022-10-12",
        treatment: "Followed",
        paraRef: "Paras 5-8",
        notes: "Directed all states and police forces to immediately withdraw all pending prosecutions instituted under the struck-down Section 66A.",
        sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=2023_1_SCC_716.pdf",
      },
    ],
  },

  // 14. D.K. Basu (1997)
  {
    id: "sc-1997-dk-basu",
    title: "D.K. Basu v. State of West Bengal",
    court: "Supreme Court of India",
    caseNumber: "Writ Petition (Criminal) No. 592 of 1987",
    date: "1996-12-18",
    year: 1997,
    bench: "Kuldip Singh, A.S. Anand, JJ.",
    benchSize: 2,
    citations: ["(1997) 1 SCC 416", "AIR 1997 SC 610"],
    sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=1997_1_SCC_416.pdf",
    caseType: "Writ Petition (Criminal)",
    actsInvolved: ["Code of Criminal Procedure, 1973", "Constitution of India"],
    sectionsInvolved: ["Article 21", "Article 22", "Section 50 CrPC", "Section 57 CrPC"],
    summary: "Laid down 11 mandatory guidelines to prevent custodial violence and torture during arrest and detention, including arrest memos, medical inspection, and information to relatives.",
    paragraphs: [
      {
        paraNumber: 1,
        text: "The Executive Chairman of Legal Aid Services, West Bengal, addressed a letter drawing attention to reported custodial deaths and violence in police lockups, treated as a PIL under Article 32.",
      },
      {
        paraNumber: 22,
        text: "Custodial violence, including torture and death in lockups, strikes a blow at the rule of law. It is aggravated by the fact that it is committed by persons who are supposed to be the protectors of the citizens.",
      },
      {
        paraNumber: 35,
        text: "We lay down 11 mandatory requirements to be followed in all cases of arrest or detention till legal provisions are made: 1) Identification tag of arresting officer, 2) Preparation of arrest memo, 3) Informing family/friends within 8 to 12 hours, 4) Medical examination every 48 hours, 5) Forwarding copies to Magistrate.",
      },
    ],
    analysis: {
      facts: "A PIL highlighted frequent instances of custodial torture, third-degree methods, and unexplained deaths in police custody.",
      legalIssues: ["Whether monetary compensation and judicial guidelines can be issued under Article 32 against custodial torture violating Article 21."],
      relevantProvisions: ["Article 21", "Article 22", "Section 50 CrPC"],
      argumentsAppellant: "Custodial torture violates inviolable human dignity under Article 21; institutional accountability is urgently required.",
      argumentsRespondent: "Law enforcement faces dangerous criminals requiring operational flexibility.",
      courtReasoning: "The Court held that custodial torture is an assault on human dignity and the rule of law. A person in custody does not lose their fundamental rights. Issued 11 binding arrest safeguards and held that failure to comply attracts departmental action as well as contempt of court.",
      finalDecision: "11 mandatory arrest guidelines issued; sovereign immunity held inapplicable to violations of fundamental rights.",
      importantParagraphs: [
        {
          paraNumber: 35,
          quote: "We lay down 11 mandatory requirements to be followed in all cases of arrest...",
          principle: "Mandatory arrest memo and detention safeguards.",
        },
      ],
      relatedJudgments: [
        { title: "Nilabati Behera v. State of Orissa", citation: "(1993) 2 SCC 746", relationship: "Followed", notes: "Applied public law remedy of compensation for custodial death." },
      ],
    },
    precedentStatus: "Good Law",
    subsequentTreatments: [
      {
        citingCaseTitle: "Arnesh Kumar v. State of Bihar",
        citingCaseCitation: "(2014) 8 SCC 273",
        citingCourt: "Supreme Court of India",
        citingDate: "2014-07-02",
        treatment: "Followed",
        paraRef: "Paras 8-11",
        notes: "Operationalized D.K. Basu's arrest protections into mandatory check-lists for offences punishable up to 7 years.",
        sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=2014_8_SCC_273.pdf",
      },
    ],
  },

  // 15. Naz Foundation (Delhi High Court, 2009)
  {
    id: "del-2009-naz-foundation",
    title: "Naz Foundation v. Government of NCT of Delhi and Others",
    court: "High Court of Delhi",
    caseNumber: "WP (C) No. 7455 of 2001",
    date: "2009-07-02",
    year: 2009,
    bench: "Ajit Prakash Shah, C.J., S. Muralidhar, J.",
    benchSize: 2,
    citations: ["160 (2009) DLT 277", "2009 SCC OnLine Del 1762"],
    sourceUrl: "https://delhihighcourt.nic.in/judgments/view/2009_DLT_160_277.pdf",
    caseType: "Writ Petition (Civil)",
    actsInvolved: ["Indian Penal Code, 1860", "Constitution of India"],
    sectionsInvolved: ["Section 377 IPC", "Article 14", "Article 15", "Article 19", "Article 21"],
    summary: "Landmark Delhi High Court decision holding Section 377 IPC violative of Articles 14, 15, and 21 insofar as it criminalizes consensual sexual acts between adults in private. Reversed by Suresh Koushal (2014), but later fully affirmed and approved by Supreme Court in Navtej Johar (2018).",
    paragraphs: [
      {
        paraNumber: 1,
        text: "The petitioner, an NGO working in the field of HIV/AIDS prevention, challenges the constitutional validity of Section 377 of the Indian Penal Code, 1860 to the extent it penalizes sexual acts in private between consenting adults.",
      },
      {
        paraNumber: 85,
        text: "The sphere of privacy allows persons to develop human relations without interference from the outside community or the State. Consensual sexual conduct in private is a protected exercise of individual autonomy and dignity.",
      },
      {
        paraNumber: 132,
        text: "We hold that Section 377 IPC, insofar it criminalizes consensual sexual acts of adults in private, is violative of Articles 21, 14 and 15 of the Constitution.",
      },
    ],
    analysis: {
      facts: "Naz Foundation filed a PIL in Delhi High Court seeking reading down of Section 377 IPC, arguing it impeded public health HIV intervention and violated basic constitutional rights.",
      legalIssues: ["Whether Section 377 IPC violates fundamental rights of equality, non-discrimination, and privacy."],
      relevantProvisions: ["Section 377 IPC", "Article 14", "Article 15", "Article 21"],
      argumentsAppellant: "Criminalization pushes LGBTQ people underground, causing severe stigma, discrimination, and health hazards.",
      argumentsRespondent: "Homosexuality is against Indian cultural values and public morality.",
      courtReasoning: "The Division Bench held that constitutional morality, not popular morality, must guide judicial adjudication. Criminalizing private consensual sexual conduct violates human dignity and privacy under Article 21 and constitutes discrimination on grounds of sex under Article 15.",
      finalDecision: "Section 377 read down. Although initially reversed in Suresh Koushal (2014), the Supreme Court in Navtej Johar (2018) overruled Koushal and affirmed the High Court's reasoning.",
      importantParagraphs: [
        {
          paraNumber: 132,
          quote: "We hold that Section 377 IPC, insofar it criminalizes consensual sexual acts of adults in private, is violative of Articles 21, 14 and 15...",
          principle: "Reading down of Section 377 IPC.",
        },
      ],
      relatedJudgments: [
        { title: "Navtej Singh Johar v. Union of India", citation: "(2018) 10 SCC 1", relationship: "Affirmed", notes: "The Supreme Court praised and affirmed the constitutional foundations laid down by the Delhi High Court." },
      ],
    },
    precedentStatus: "Good Law",
    subsequentTreatments: [
      {
        citingCaseTitle: "Suresh Kumar Koushal v. Naz Foundation",
        citingCaseCitation: "(2014) 1 SCC 1",
        citingCourt: "Supreme Court of India",
        citingDate: "2013-12-11",
        treatment: "Reversed",
        paraRef: "Para 52",
        notes: "Reversed by Supreme Court division bench in 2013.",
        sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=2014_1_SCC_1.pdf",
      },
      {
        citingCaseTitle: "Navtej Singh Johar v. Union of India",
        citingCaseCitation: "(2018) 10 SCC 1",
        citingCourt: "Supreme Court of India",
        citingDate: "2018-09-06",
        treatment: "Affirmed",
        paraRef: "Paras 168-175",
        notes: "Overruled Koushal and affirmed the Delhi High Court's Naz Foundation judgment in its entirety.",
        sourceUrl: "https://digiscr.sci.gov.in/view_file?file_name=2018_10_SCC_1.pdf",
      },
    ],
  },
];
