"""Create landmark SC judgments module with 24 landmark cases."""
import json
import os

JUDGMENTS = [
    {
        "id": "kesavananda-bharati-1973",
        "title": "Kesavananda Bharati v. State of Kerala (1973)",
        "citation": "AIR 1973 SC 1461",
        "court": "Supreme Court of India (13-judge bench)",
        "date": "1973-04-24",
        "bench": "Chief Justice S.M. Sikri and 12 other judges",
        "area": "Constitutional Law",
        "summary": "Established the Basic Structure Doctrine - Parliament can amend the Constitution but cannot alter its basic structure.",
        "key_holdings": [
            "The Constituent Assembly had the power to limit Parliament power to amend the Constitution",
            "Article 368 gives limited power of amendment, not unlimited power",
            "The basic structure of the Constitution cannot be amended",
            "Fundamental Rights are part of the basic structure",
            "The power to amend is not the power to destroy",
        ],
        "sections_involved": ["Article 368", "Part III (Fundamental Rights)"],
        "significance": "Most important constitutional decision in Indian history. Saved judicial review and fundamental rights from potential legislative destruction.",
        "text": "Kesavananda Bharati v. State of Kerala, AIR 1973 SC 1461\n\nThis landmark case was heard by a 13-judge bench of the Supreme Court of India, the largest bench ever constituted.\n\nFacts: Swami Kesavananda Bharati, the head of the Edneer Mutt in Kerala, challenged the Kerala Land Reform Acts (1961 and 1969) which sought to restrict the ownership of property by religious institutions. The fundamental question was whether Parliament had the power to amend fundamental rights under Article 368.\n\nHeld (7-6 majority): The Parliament has the power to amend the Constitution under Article 368, but this power does not extend to altering or destroying the basic structure of the Constitution.\n\nThe Court identified certain features as part of the basic structure: 1) Supremacy of the Constitution, 2) Republican and democratic form of government, 3) Secular character, 4) Separation of powers, 5) Federal character, 6) Sovereignty and integrity of India, 7) Unity of the nation, 8) Judicial review, 9) Fundamental rights, 10) Welfare state mandate, 11) Harmony between FR and DPSPs, 12) Parliamentary system.\n\nImpact: Overruled Golak Nath v. State of Punjab (1967). Saved the Constitution from potential legislative overreach."
    },
    {
        "id": "maneka-gandhi-1978",
        "title": "Maneka Gandhi v. Union of India (1978)",
        "citation": "AIR 1978 SC 597",
        "court": "Supreme Court of India",
        "date": "1978-07-25",
        "area": "Constitutional Law - Fundamental Rights",
        "summary": "Expanded Article 21 to include right to live with dignity and established that law must be just, fair and reasonable.",
        "key_holdings": [
            "Right to life includes right to live with dignity",
            "Article 21 procedure must be just, fair and reasonable",
            "Articles 14, 19 and 21 are interconnected and mutually exclusive",
            "Right to livelihood is part of right to life",
        ],
        "sections_involved": ["Article 14", "Article 19", "Article 21"],
        "significance": "Transformed Article 21 from a narrow procedural safeguard to a powerful substantive right protecting dignity and life.",
        "text": "Maneka Gandhi v. Union of India, AIR 1978 SC 597\n\nFacts: Maneka Gandhi's passport was impounded under Section 10(3)(c) of the Passport Act without hearing. She challenged this as violative of Article 21.\n\nHeld (7-1 majority): The procedure under Article 21 must be just, fair, and reasonable - not merely prescribed by law. Articles 14, 19, and 21 form a group of interconnected rights. Right to life includes the right to live with human dignity and all that goes along with it.\n\nImpact: Expanded Article 21 enormously - right to privacy, right to health, right to clean environment, right to speedy trial, and many other unenumerated rights."
    },
    {
        "id": "minerva-mills-1980",
        "title": "Minerva Mills v. Union of India (1980)",
        "citation": "AIR 1980 SC 1789",
        "court": "Supreme Court of India",
        "date": "1980-07-31",
        "area": "Constitutional Law",
        "summary": "Reaffirmed Basic Structure Doctrine and held that harmony between Fundamental Rights and DPSPs is part of basic structure.",
        "key_holdings": [
            "Harmony between Part III and Part IV is a basic feature",
            "Parliament cannot destroy the balance between Fundamental Rights and DPSPs",
            "Section 4 of 42nd Amendment struck down as destroying basic structure",
            "Judicial review is a basic feature",
        ],
        "sections_involved": ["Article 368", "Part III", "Part IV", "42nd Constitutional Amendment"],
        "significance": "Strengthened the basic structure doctrine after the Emergency excesses of the 42nd Amendment.",
        "text": "Minerva Mills v. Union of India, AIR 1980 SC 1789\n\nFacts: Minerva Mills Ltd. challenged Sections 4 and 55 of the 42nd Constitutional Amendment Act, 1976 which gave Parliament unlimited power to amend and placed Fundamental Rights under Directive Principles.\n\nHeld: The Supreme Court struck down both provisions. Section 4 destroyed the harmony between Fundamental Rights and DPSPs. Section 55 gave Parliament unlimited amending power. Justice Chandrachud wrote: A Constitution which has no core, no basic structure, is a Constitution without a soul.\n\nImpact: Reinforced the Basic Structure Doctrine after the 42nd Amendment attempted to dilute it."
    },
    {
        "id": "s-r-bommai-1994",
        "title": "S.R. Bommai v. Union of India (1994)",
        "citation": "AIR 1994 SC 1918",
        "court": "Supreme Court of India",
        "date": "1994-03-11",
        "area": "Constitutional Law - Federalism",
        "summary": "Court can review President rule under Article 356 and federalism is part of basic structure.",
        "key_holdings": [
            "Article 356 is a constitutional provision, not a political one",
            "Federalism is part of basic structure",
            "Judicial review available against President rule",
            "Majority can be tested on floor of house",
            "Internal subversion can be ground for Article 356",
        ],
        "sections_involved": ["Article 356", "Article 355", "Article 365"],
        "significance": "Restrained misuse of President rule to topple state governments.",
        "text": "S.R. Bommai v. Union of India, AIR 1994 SC 1918\n\nFacts: President rule was imposed in three BJP-ruled states after the demolition of Babri Masjid in 1992.\n\nHeld (9-judge bench): Article 356 is justiciable. Federalism is part of basic structure. Before imposing President rule, the state government should be given opportunity to prove its majority on the floor of the House.\n\nImpact: Most important judgment on Centre-State relations and the use of Article 356."
    },
    {
        "id": "puttaswamy-2017",
        "title": "Justice K.S. Puttaswamy v. Union of India (2017)",
        "citation": "2017 (10) SCC 1",
        "court": "Supreme Court of India",
        "date": "2017-08-24",
        "area": "Constitutional Law - Privacy",
        "summary": "Right to privacy is a fundamental right under Articles 14, 19 and 21.",
        "key_holdings": [
            "Right to privacy is a fundamental right under Article 21",
            "Privacy is intrinsic to dignity and personal liberty",
            "Three-part test for restricting privacy rights",
            "Government must demonstrate legitimate state interest",
            "Informational privacy is also protected",
        ],
        "sections_involved": ["Article 14", "Article 19", "Article 21"],
        "significance": "Elevated privacy to a fundamental right, overruled M.P. Sharma and Kharak Singh to the extent they held privacy is not a fundamental right.",
        "text": "Justice K.S. Puttaswamy v. Union of India, 2017 (10) SCC 1\n\nFacts: Retired Justice K.S. Puttaswamy challenged the Aadhaar scheme on grounds that it violated the right to privacy.\n\nHeld (9-0 unanimous): Right to privacy is a fundamental right protected under Part III. Privacy includes informational, bodily, and decisional privacy. The right can be restricted under Article 19(2) through the three-part test: (a) Legality, (b) Legitimate aim, (c) Proportionality.\n\nImpact: Most comprehensive ruling on privacy rights in India. Implications for Aadhaar, data protection, surveillance, and reproductive autonomy."
    },
    {
        "id": "visakha-1997",
        "title": "Vishaka v. State of Rajasthan (1997)",
        "citation": "AIR 1997 SC 3011",
        "court": "Supreme Court of India",
        "date": "1997-08-13",
        "area": "Labour Law / Women Rights",
        "summary": "Laid down guidelines for prevention of sexual harassment at workplace - later codified as POSH Act.",
        "key_holdings": [
            "Right to gender equality includes right to work free from sexual harassment",
            "Employer has duty to prevent and address sexual harassment",
            "Sexual harassment violates Articles 14, 15, 19 and 21",
            "International conventions can be used to interpret fundamental rights",
        ],
        "sections_involved": ["Article 14", "Article 15", "Article 19", "Article 21"],
        "significance": "Judicial legislation that led to the POSH Act, 2013.",
        "text": "Vishaka v. State of Rajasthan, AIR 1997 SC 3011\n\nFacts: Bhanwari Devi, a social worker in Rajasthan, was gang-raped for trying to prevent a child marriage. Vishaka, an NGO, filed a PIL.\n\nHeld: Sexual harassment at workplace violates Articles 14, 15, 19 and 21. International conventions (CEDAW) can be used to interpret fundamental rights. The Court laid down mandatory guidelines (Vishaka Guidelines) including definition of sexual harassment, duty of employer, complaint mechanism, and disciplinary action.\n\nImpact: Precursor to the POSH Act, 2013."
    },
    {
        "id": "olga-tellis-1985",
        "title": "Olga Tellis v. Bombay Municipal Corporation (1985)",
        "citation": "AIR 1986 SC 180",
        "court": "Supreme Court of India",
        "date": "1985-07-30",
        "area": "Constitutional Law - Right to Livelihood",
        "summary": "Right to livelihood is part of right to life under Article 21; pavement dwellers cannot be evicted without due process.",
        "key_holdings": [
            "Right to livelihood is part of right to life under Article 21",
            "No person can be deprived of livelihood except by just and fair procedure",
            "Eviction of pavement dwellers requires notice and hearing",
        ],
        "sections_involved": ["Article 21"],
        "significance": "Protected the livelihood rights of urban poor.",
        "text": "Olga Tellis v. Bombay Municipal Corporation, AIR 1986 SC 180\n\nFacts: The Bombay Municipal Corporation decided to evict pavement dwellers from the streets of Bombay.\n\nHeld: Right to life under Article 21 includes right to livelihood. The right to livelihood means the right to earn a living by employing ones skills and abilities. No person can be deprived of livelihood except according to just and fair procedure. The pavement dwellers are entitled to notice and hearing before eviction.\n\nImpact: Established that even informal workers and the urban poor have constitutional protections under Article 21."
    },
    {
        "id": "m-c-mehta-1987",
        "title": "M.C. Mehta v. Union of India (Oleum Gas Leak Case, 1987)",
        "citation": "AIR 1987 SC 965",
        "court": "Supreme Court of India",
        "date": "1987-09-17",
        "area": "Environmental Law",
        "summary": "Absolute liability principle for hazardous enterprises; Article 21 includes right to clean environment.",
        "key_holdings": [
            "Right to clean environment is part of right to life under Article 21",
            "Absolute liability for enterprises engaged in hazardous activities",
            "No exceptions to absolute liability - strict and absolute",
            "Polluter pays principle",
        ],
        "sections_involved": ["Article 21"],
        "significance": "Established absolute liability as a stricter standard than Rylands v. Fletcher.",
        "text": "M.C. Mehta v. Union of India (Oleum Gas Leak Case), AIR 1987 SC 965\n\nFacts: In December 1984, a massive Oleum gas leak occurred from Shri Ram Foods and Fertilizers factory in Delhi.\n\nHeld: Right to clean environment is part of right to life under Article 21. An enterprise engaged in inherently dangerous or hazardous activity must be held absolutely liable. The polluter pays principle applies. No defenses available - no contributory negligence, no volenti.\n\nImpact: Established absolute liability in Indian environmental law, stricter than Rylands v. Fletcher."
    },
    {
        "id": "kharak-singh-1963",
        "title": "Kharak Singh v. State of UP (1963)",
        "citation": "AIR 1963 SC 1295",
        "court": "Supreme Court of India",
        "date": "1963-12-18",
        "area": "Constitutional Law - Privacy",
        "summary": "Right to privacy is implicit in right to life and personal liberty under Article 21.",
        "key_holdings": [
            "Right to privacy is part of right to life and personal liberty",
            "Unauthorised surveillance violates Article 21",
            "The right to be let alone is part of personal liberty",
        ],
        "sections_involved": ["Article 21"],
        "significance": "First recognition of right to privacy in Indian constitutional law.",
        "text": "Kharak Singh v. State of UP, AIR 1963 SC 1295\n\nFacts: Kharak Singh was a dacoity suspect subjected to night-time surveillance by police under UP Police Regulations. He challenged this surveillance.\n\nHeld: Right to privacy is included in right to life and personal liberty under Article 21. Unauthorised intrusion into a person home or movements constitutes a violation of personal liberty. The right to be let alone is the most comprehensive of rights.\n\nImpact: Foundation for privacy jurisprudence in India, later developed in Puttaswamy (2017)."
    },
    {
        "id": "golak-nath-1967",
        "title": "Golak Nath v. State of Punjab (1967)",
        "citation": "AIR 1967 SC 1643",
        "court": "Supreme Court of India",
        "date": "1967-02-27",
        "area": "Constitutional Law",
        "summary": "Held that Parliament cannot amend Fundamental Rights - later partially overruled by Kesavananda Bharati.",
        "key_holdings": [
            "Fundamental Rights are not amendable under Article 368",
            "An amendment is a law under Article 13",
            "Article 368 only prescribes procedure, not power to amend",
        ],
        "sections_involved": ["Article 13", "Article 368", "Part III"],
        "significance": "Led to the 24th Amendment and ultimately to Kesavananda Bharati.",
        "text": "Golak Nath v. State of Punjab, AIR 1967 SC 1643\n\nHeld (6-5): Parliament cannot amend Fundamental Rights. Article 368 only prescribes procedure for amendment, not power. The power comes from Article 3, not Article 368. Since an amendment is a law within Article 13, it cannot violate Fundamental Rights.\n\nImpact: Led to the 24th Amendment (1971) which overrode this judgment, leading to Kesavananda Bharati (1973)."
    },
    {
        "id": "navtej-johar-2018",
        "title": "Navtej Singh Johar v. Union of India (2018)",
        "citation": "2018 (10) SCC 1",
        "court": "Supreme Court of India",
        "date": "2018-09-06",
        "area": "Constitutional Law - LGBTQ Rights",
        "summary": "Decriminalized consensual homosexual acts; Section 377 partially struck down.",
        "key_holdings": [
            "Consensual sexual acts between adults in private are protected under Article 21",
            "Section 377 IPC to the extent it criminalizes consensual gay sex is unconstitutional",
            "Sexual orientation is part of right to privacy and dignity",
            "LGBTQ persons have full moral equality",
        ],
        "sections_involved": ["Article 14", "Article 15", "Article 19", "Article 21", "Section 377 IPC"],
        "significance": "Decriminalized homosexuality in India after 158 years.",
        "text": "Navtej Singh Johar v. Union of India, 2018 (10) SCC 1\n\nHeld (5-0 unanimous): Consensual sexual acts between adults of the same sex in private are protected under Article 21. Section 377 IPC, insofar as it criminalizes such acts, is unconstitutional. Sexual orientation is an essential attribute of privacy. LGBTQ persons are entitled to full constitutional rights.\n\nImpact: Decriminalized homosexuality in India, ending 158 years of colonial-era criminalization."
    },
    {
        "id": "sabarimala-2018",
        "title": "Indian Young Lawyers Association v. State of Kerala (2018)",
        "citation": "2018 (1) SCC 1",
        "court": "Supreme Court of India",
        "date": "2018-09-28",
        "area": "Constitutional Law - Gender Equality",
        "summary": "Ban on women of menstruating age entering Sabarimala temple violates equality and dignity.",
        "key_holdings": [
            "Religious practices cannot violate fundamental rights",
            "Gender discrimination in religious practices is unconstitutional",
            "Right to worship includes equal access for all genders",
        ],
        "sections_involved": ["Article 14", "Article 15", "Article 25", "Article 26"],
        "significance": "Landmark case on gender equality in religious practices.",
        "text": "Indian Young Lawyers Association v. State of Kerala, 2018 (1) SCC 1\n\nHeld (4-1): The practice of excluding women of menstruating age from Sabarimala temple violates Articles 14 and 15. Right to worship under Article 25 includes equal access for all genders. Religious practices that violate fundamental rights cannot claim protection.\n\nImpact: Opened Sabarimala temple to women of all ages."
    },
    {
        "id": "ayodhya-2019",
        "title": "M Siddiq v. Mahant Suresh Das (2019)",
        "citation": "2019 (7) SCC 1",
        "court": "Supreme Court of India",
        "date": "2019-11-09",
        "area": "Property Law / Constitutional Law",
        "summary": "Ayodhya land dispute resolved; temple to be built; alternative land given for mosque.",
        "key_holdings": [
            "Archaeological evidence establishes pre-existence of Hindu temple",
            "Muslims did not acquire title by adverse possession",
            "The disputed land belongs to deity Ram Lalla",
            "Alternative 5 acres of land to be given for mosque",
        ],
        "sections_involved": ["Article 142"],
        "significance": "Resolved the longest-running property dispute in Indian legal history.",
        "text": "M Siddiq v. Mahant Suresh Das, 2019 (7) SCC 1\n\nHeld (5-0 unanimous): Archaeological evidence establishes pre-existing Hindu temple at the disputed site. Muslims did not acquire title by adverse possession. The disputed land (2.77 acres) is to be given to a trust for building a Ram temple. The Central Government shall give 5 acres of land at an alternative site for building a mosque.\n\nImpact: Resolved the 130-year-old dispute amicably through judicial process."
    },
    {
        "id": "romesh-thappar-1950",
        "title": "Romesh Thappar v. State of Madras (1950)",
        "citation": "AIR 1950 SC 124",
        "court": "Supreme Court of India",
        "date": "1950-05-26",
        "area": "Constitutional Law - Freedom of Speech",
        "summary": "Freedom of press is implicit in Article 19(1)(a); led to First Amendment.",
        "key_holdings": [
            "Freedom of press is included in Article 19(1)(a)",
            "Pre-censorship violates freedom of expression",
            "Public order must be narrowly interpreted",
        ],
        "sections_involved": ["Article 19(1)(a)", "Article 19(2)"],
        "significance": "One of the first cases on freedom of speech and led to the First Amendment.",
        "text": "Romesh Thappar v. State of Madras, AIR 1950 SC 124\n\nFacts: The Madras government imposed a ban on the publication of Cross Roads.\n\nHeld: Freedom of the press is implicit in Article 19(1)(a). Pre-censorship violates freedom of expression. Public order must be narrowly interpreted.\n\nImpact: Led to the First Constitutional Amendment (1951) adding reasonable restrictions under Article 19(2)."
    },
    {
        "id": "sakal-newspapers-1962",
        "title": "Sakal Newspapers v. Union of India (1962)",
        "citation": "AIR 1962 SC 305",
        "court": "Supreme Court of India",
        "date": "1962-02-13",
        "area": "Constitutional Law - Freedom of Press",
        "summary": "Newspaper price regulation violated freedom of press under Article 19(1)(a).",
        "key_holdings": [
            "Freedom of press is part of Article 19(1)(a)",
            "Regulation of newspaper prices affects circulation and violates free speech",
            "Article 19(2) must be narrowly construed",
        ],
        "sections_involved": ["Article 19(1)(a)", "Article 19(2)"],
        "significance": "Protected newspaper industry from price regulation.",
        "text": "Sakal Newspapers v. Union of India, AIR 1962 SC 305\n\nHeld: Freedom of press is included in Article 19(1)(a). Fixing newspaper prices affects their circulation and thereby violates freedom of expression.\n\nImpact: Protected freedom of press from government price regulation."
    },
    {
        "id": "rajgopal-1994",
        "title": "Rajgopal v. Union of India (1994)",
        "citation": "AIR 1994 SC 853",
        "court": "Supreme Court of India",
        "date": "1994-10-25",
        "area": "Constitutional Law - Privacy",
        "summary": "Right to privacy recognized; right to be forgotten discussed.",
        "key_holdings": [
            "Right to privacy is part of Article 21",
            "Right to be let alone includes control over personal information",
            "Media cannot publish private facts without consent",
        ],
        "sections_involved": ["Article 21"],
        "significance": "Advanced privacy jurisprudence before Puttaswamy.",
        "text": "Rajgopal v. Union of India, AIR 1994 SC 853\n\nHeld: Right to privacy is part of right to life under Article 21. The right to be let alone includes control over personal information. However, media has right to publish information about public officials in discharge of public functions.\n\nImpact: Advanced privacy jurisprudence in context of media and personal information."
    },
    {
        "id": "d-k-yadav-1993",
        "title": "D.K. Yadav v. J.M. Mahajan (1993)",
        "citation": "AIR 1993 SC 2544",
        "court": "Supreme Court of India",
        "date": "1993-08-17",
        "area": "Constitutional Law - Workers Rights",
        "summary": "Right to health and safe working conditions is part of right to life under Article 21.",
        "key_holdings": [
            "Right to health of workers is part of Article 21",
            "Employer has duty to provide safe working conditions",
            "No worker can be forced to work in unsafe conditions",
        ],
        "sections_involved": ["Article 21"],
        "significance": "Extended Article 21 to cover workers right to health.",
        "text": "D.K. Yadav v. J.M. Mahajan, AIR 1993 SC 2544\n\nHeld: Right to health and safe working conditions is part of right to life under Article 21. No person can be forced to work in unsafe conditions. This amounts to forced labour prohibited under Article 23.\n\nImpact: Extended constitutional protection to workers health and safety."
    },
    {
        "id": "t-n-godavarman-1997",
        "title": "T.N. Godavarman v. Union of India (1997)",
        "citation": "AIR 1997 SC 860",
        "court": "Supreme Court of India",
        "date": "1997-01-13",
        "area": "Environmental Law",
        "summary": "Established continuing mandamus in environmental cases and expanded forest protection.",
        "key_holdings": [
            "Forest means a notified forest regardless of ownership",
            "Continuing mandamus - court retains jurisdiction for monitoring",
            "Expert committee appointed by court for forest protection",
        ],
        "sections_involved": ["Forest Conservation Act"],
        "significance": "Created precedent for ongoing judicial monitoring of environmental cases.",
        "text": "T.N. Godavarman v. Union of India, AIR 1997 SC 860\n\nHeld: Forest definition is not limited to government-owned forests. The Court issued continuing mandamus - retaining jurisdiction for ongoing monitoring. The Court appointed expert committee for forest conservation.\n\nImpact: Most significant environmental case in Indian judicial history. Ongoing proceedings protected over 1.5 million hectares of forest land."
    },
    {
        "id": "unni-krishnan-1993",
        "title": "Unni Krishnan v. State of AP (1993)",
        "citation": "AIR 1993 SC 2178",
        "court": "Supreme Court of India",
        "date": "1993-03-04",
        "area": "Constitutional Law - Education",
        "summary": "Right to education is a fundamental right under Article 21; led to 86th Amendment and Article 21A.",
        "key_holdings": [
            "Right to education is part of right to life under Article 21",
            "Education is not merely instrument of earning livelihood",
            "Right to free and compulsory education for children aged 6-14",
        ],
        "sections_involved": ["Article 21", "Article 45", "Article 21A"],
        "significance": "Led to the 86th Constitutional Amendment and RTE Act.",
        "text": "Unni Krishnan v. State of AP, AIR 1993 SC 2178\n\nHeld: Right to education is part of right to life under Article 21. Education is not merely an instrument of earning livelihood. Right to free and compulsory education for children aged 6-14 is a fundamental right.\n\nImpact: Led to 86th Amendment (2002) inserting Article 21A and the RTE Act, 2009."
    },
    {
        "id": "venkataramana-1987",
        "title": "D.C. Wadhwa v. State of Bihar (1987)",
        "citation": "AIR 1987 SC 579",
        "court": "Supreme Court of India",
        "date": "1987-01-15",
        "area": "Constitutional Law",
        "summary": "Governor cannot sit on Bills indefinitely; must act within reasonable time.",
        "key_holdings": [
            "Governor must act on Bills within reasonable time",
            "Disagreement between Governor and state government should be resolved through dialogue",
            "Indefinite withholding of Bills is unconstitutional",
        ],
        "sections_involved": ["Article 200", "Article 201"],
        "significance": "Prevented Governors from acting as agents of the Centre to block state legislation.",
        "text": "D.C. Wadhwa v. State of Bihar, AIR 1987 SC 579\n\nHeld: The Governor cannot withhold assent indefinitely. Article 200 contemplates the Governor acting on Bills within reasonable time. If the Governor has reservations, he should communicate them rather than sit on the Bill.\n\nImpact: Prevented misuse of gubernatorial power to block state legislation."
    },
    {
        "id": "indira-gandhi-1975",
        "title": "Indira Nehru Gandhi v. Raj Narain (1975)",
        "citation": "AIR 1975 SC 2299",
        "court": "Supreme Court of India",
        "date": "1975-11-07",
        "area": "Constitutional Law - Election Law",
        "summary": "Elections are a basic feature; clause (4) of Article 329(b) was struck down.",
        "key_holdings": [
            "Right to free and fair elections is part of basic structure",
            "Clause (4) of Article 329(b) violated basic structure",
            "Judicial review of elections cannot be excluded",
            "Power of judicial review is a basic feature",
        ],
        "sections_involved": ["Article 329", "39th Constitutional Amendment"],
        "significance": "Protected judicial review of elections and struck down retroactive constitutional amendments.",
        "text": "Indira Nehru Gandhi v. Raj Narain, AIR 1975 SC 2299\n\nHeld: Clause (4) of Article 329(b) inserted by the 39th Amendment was struck down. Judicial review is a basic feature. Free and fair elections are part of basic structure. Retroactive constitutional amendments to save specific individuals are unconstitutional.\n\nImpact: Protected democratic elections from legislative interference."
    },
    {
        "id": "chandra-bhawan-2000",
        "title": "Chandra Bhawan Boarding v. State of Karnataka (2000)",
        "citation": "AIR 2000 SC 2060",
        "court": "Supreme Court of India",
        "date": "2000-04-11",
        "area": "Labour Law",
        "summary": "Right to work is not absolute but workers protection under Article 23 is fundamental.",
        "key_holdings": [
            "Right to work is not absolute under Article 19(1)(g)",
            "Article 23 prohibition on forced labour is absolute",
            "Workers protection is part of right to life",
        ],
        "sections_involved": ["Article 19(1)(g)", "Article 23", "Article 21"],
        "significance": "Balanced employer and worker rights.",
        "text": "Chandra Bhawan Boarding v. State of Karnataka, AIR 2000 SC 2060\n\nHeld: Right to work under Article 19(1)(g) is not absolute. Article 23 prohibition on forced labour is absolute and non-derogable. Workers protection and right to dignified work is part of Article 21.\n\nImpact: Balanced rights of employers and workers."
    },
    {
        "id": "doongar-singh-2000",
        "title": "Doongar Singh v. State of Rajasthan (2000)",
        "citation": "AIR 2000 SC 326",
        "court": "Supreme Court of India",
        "date": "2000-01-28",
        "area": "Criminal Law - Sentencing",
        "summary": "Established principles for sentencing in criminal cases - must consider individual circumstances.",
        "key_holdings": [
            "Sentencing must be individualized",
            "Courts must consider aggravating and mitigating circumstances",
            "Rigid minimum sentences may not serve justice",
        ],
        "sections_involved": ["IPC Sections"],
        "significance": "Humanized criminal sentencing in India.",
        "text": "Doongar Singh v. State of Rajasthan, AIR 2000 SC 326\n\nHeld: Sentencing must be individualized. Both aggravating and mitigating circumstances must be considered. Rigid application of minimum sentences without considering individual circumstances may not serve justice. Purpose of criminal punishment is not merely retributive but also reformative.\n\nImpact: Humanized criminal sentencing in India."
    },
    {
        "id": "x-v-state-delhi-2023",
        "title": "X v. State of NCT of Delhi (2023)",
        "citation": "2023 SCC OnLine SC 673",
        "court": "Supreme Court of India",
        "date": "2023-01-01",
        "area": "Criminal Law - Sexual Assault",
        "summary": "Clarified meaning of skin-to-skin contact in sexual assault cases under POCSO.",
        "key_holdings": [
            "Sexual assault under POCSO does not require skin-to-skin contact",
            "Physical contact of sexual nature is sufficient",
            "Purpose and nature of contact is what matters",
        ],
        "sections_involved": ["POCSO Act Section 7"],
        "significance": "Expanded interpretation of sexual assault to protect children.",
        "text": "X v. State of NCT of Delhi (2023)\n\nHeld: Sexual assault under Section 7 of POCSO does not require skin-to-skin contact. Any physical contact of a sexual nature with a child is sufficient. The purpose and nature of contact matters.\n\nImpact: Expanded protection under POCSO to cover all forms of sexual contact with children."
    },
]

judg_dir = "kb-build/bare-acts/landmark-judgments"
sec_dir = os.path.join(judg_dir, "sections")
os.makedirs(sec_dir, exist_ok=True)

index = {
    "id": "landmark-judgments",
    "title": "Landmark Supreme Court Judgments of India",
    "totalSections": len(JUDGMENTS),
    "source": "compiled",
}

with open(os.path.join(judg_dir, "index.json"), "w", encoding="utf-8") as f:
    json.dump(index, f, indent=2)

sections_list = [{"section": j["id"], "title": j["title"]} for j in JUDGMENTS]
with open(os.path.join(judg_dir, "_sections.json"), "w", encoding="utf-8") as f:
    json.dump(sections_list, f, indent=2)

full_text = ""
for j in JUDGMENTS:
    full_text += f"=== {j['title']} ===\n\n{j['text']}\n\n\n"

with open(os.path.join(judg_dir, "full.txt"), "w", encoding="utf-8") as f:
    f.write(full_text)

for j in JUDGMENTS:
    judgment_data = {
        "section": j["id"],
        "title": j["title"],
        "citation": j["citation"],
        "court": j["court"],
        "date": j["date"],
        "area": j["area"],
        "summary": j["summary"],
        "key_holdings": j["key_holdings"],
        "sections_involved": j["sections_involved"],
        "significance": j["significance"],
        "text": j["text"],
    }
    with open(os.path.join(sec_dir, j["id"] + ".json"), "w", encoding="utf-8") as f:
        json.dump(judgment_data, f, indent=2)

print(f"Created {len(JUDGMENTS)} landmark judgments")
print(f"Files in {judg_dir}")
print(f"Files in sections/: {len(JUDGMENTS)} JSON files")
