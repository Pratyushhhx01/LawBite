"""Create additional practical guides and more landmark judgments."""
import json
import os

# ========== Additional Practical Guides ==========
guides = [
    {
        "id": "how-to-file-pil",
        "title": "How to File a Public Interest Litigation (PIL)",
        "area": "Constitutional Law",
        "text": """How to File a Public Interest Litigation (PIL) in India:

1. What is PIL?
   - Litigation filed in court for enforcement of public interest
   - Any public-spirited person can file
   - Not for private/personal gain
   - For protection of fundamental rights of public at large

2. Where to File PIL?
   - Supreme Court - Under Article 32 (for FR violations across India)
   - High Court - Under Article 226 (for FR violations within state)
   - Can be filed at any High Court where cause of action arises

3. Who Can File?
   - Any public-spirited person or organization
   - Need not be directly affected
   - Can be filed by:
     * Social activist
     * NGO
     * Lawyer on behalf of public
     * Any citizen

4. Grounds for PIL:
   - Violation of fundamental rights
   - Environmental pollution
   - Corruption in public life
   - Violation of basic structure of Constitution
   - Protection of heritage/trees/monuments
   - Child labour
   - Women exploitation
   - Consumer protection
   - Government policy challenges
   - Any matter of public importance

5. How to Draft PIL:
   - Must be in the nature of a writ petition
   - Title: "XYZ v. Union of India / State of..."
   - Mention petitioner and respondent details
   - Narrate facts clearly
   - State the violation of fundamental rights
   - Mention articles of Constitution violated
   - Specify relief sought
   - Include supporting documents
   - Verification and affidavit

6. Important Requirements:
   - Must disclose cause of action
   - Must show public interest
   - Cannot be for personal gain
   - Must approach court after exhausting other remedies
   - Must give notice to respondent (in some cases)

7. Court Fee:
   - Supreme Court: Fixed fee (nominal)
   - High Court: Nominal fee (varies by state)
   - Exemption possible for public interest cases

8. Recent Trends:
   - E-filing of PILs permitted
   - PILs through video conferencing
   - Strict scrutiny of motivated PILs
   - Cost imposed for frivolous PILs
   - PILs for policy matters treated cautiously

9. Landmark PIL Cases:
   - Hussainara Khatoon v. State of Bihar (right to speedy trial)
   - M.C. Mehta v. Union of India (environment)
   - Bandhua Mukti Morcha v. Union of India (bonded labour)
   - S.P. Gupta v. Union of India (public interest)
   - Vishaka v. State of Rajasthan (sexual harassment)

10. Important Points:
    - PIL is not maintainable for private disputes
    - Court can impose costs for frivolous PILs
    - PIL cannot be used for publicity
    - Court may appoint amicus curiae
    - PIL can be withdrawn by petitioner
"""
    },
    {
        "id": "how-to-file-appeal",
        "title": "How to File an Appeal in India",
        "area": "Civil & Criminal Law",
        "text": """How to File an Appeal in India:

1. What is an Appeal?
   - Request to higher court to review lower court decision
   - Not a fresh trial - only review of legal questions
   - Based on errors of law or fact

2. Types of Appeals:
   a) First Appeal - From District Court to High Court
   b) Second Appeal - From High Court to Supreme Court (on substantial question of law)
   c) Criminal Appeal - From Sessions Court to High Court
   d) Constitutional Appeal - From High Court to Supreme Court (Article 132/133/134)

3. Time Limit for Appeals:
   - Civil cases: 30-90 days (varies)
   - Criminal cases: 30-90 days (varies)
   - Supreme Court: 90 days from High Court decision
   - Can file application for condonation of delay

4. How to File Appeal:
   - Engage an advocate
   - Prepare memo of appeal
   - Mention grounds of appeal
   - File with required court fees
   - Serve notice to other party
   - Submit certified copy of lower court judgment

5. Grounds for Appeal:
   - Error of law
   - Error of procedure
   - Error of fact
   - Miscarriage of justice
   - New evidence (in limited cases)
   - Jurisdictional error
   - Violation of natural justice

6. Stay Application:
   - Can apply for stay of lower court order
   - Must show prima facie case
   - Must show balance of convenience
   - Must show irreparable injury

7. Important Points:
   - Appeal is a right in many cases
   - Some cases require leave/permission to appeal
   - Limitation period is strict
   - Can file condonation of delay application
   - Appeal does not automatically stay lower court order
   - Must file stay application separately

8. Appeal to Supreme Court:
   - Under Article 133 (civil matters)
   - Under Article 134 (criminal matters)
   - Under Article 136 (Special Leave Petition)
   - SLP - Discretionary - Supreme Court may or may not grant
   - Must involve substantial question of law
   - Must be filed within 90 days

9. Second Appeal (High Court):
   - Only on substantial question of law
   - Under Section 100 CPC
   - Must specifically state the question of law
   - High Court may refuse to hear if no substantial question
"""
    },
    {
        "id": "how-to-get-dv-protection",
        "title": "How to Get Protection Under Domestic Violence Act",
        "area": "Family Law",
        "text": """How to Get Protection Under Domestic Violence Act:

1. Protection of Women from Domestic Violence Act, 2005:
   - Civil remedy for domestic violence
   - Available to women in domestic relationship
   - Covers wife, live-in partner, mother, sister, daughter

2. What Constitutes Domestic Violence?
   a) Physical abuse - Hitting, punching, kicking
   b) Sexual abuse - Forced sexual acts
   c) Verbal abuse - Insults, humiliation, threats
   d) Emotional abuse - Intimidation, isolation
   e) Economic abuse - Denying financial resources
   f) Dowry harassment - Demand for dowry

3. Who Can Complain?
   - Wife or female live-in partner
   - Mother, daughter, sister
   - Any woman in domestic relationship
   - Can be filed by relative on behalf of victim

4. How to File Complaint?
   - File complaint with Protection Officer
   - Or file directly with Magistrate
   - Can be filed at place of residence or occurrence
   - No court fee required

5. Available Remedies:
   a) Protection Order - Stop respondent from committing violence
   b) Residence Order - Right to reside in shared household
   c) Monetary Relief - Compensation for expenses
   d) Custody Order - Temporary custody of children
   e) Compensation Order - Compensation for injuries
   f) Residence Order - Alternative accommodation

6. Procedure:
   - File application before Magistrate
   - Magistrate hears parties
   - Ex-parte order if respondent absent
   - Interim order may be granted
   - Final order within 60 days
   - Appeal in High Court within 30 days

7. Important Points:
   - Can also file FIR under Section 498A IPC/BNS
   - Protection Officer must assist victim
   - Service Provider can help in filing
   - No court fee for filing
   - Can be filed in any court having jurisdiction
   - Magistrate can pass interim ex-parte orders

8. Violation of Protection Order:
   - Imprisonment up to 1 year
   - Fine up to Rs. 20,000
   - Or both
   - Cognizable and non-bailable offence
"""
    },
    {
        "id": "how-to-get-maintenance",
        "title": "How to Claim Maintenance (Section 125 CrPC / BNSS)",
        "area": "Family Law",
        "text": """How to Claim Maintenance under Section 125 CrPC (now Section 144 BNSS):

1. Who Can Claim Maintenance?
   - Wife (including divorced wife)
   - Minor children (legitimate or illegitimate)
   - Parents (father or mother)
   - Major unmarried daughter (until she gets married)

2. Grounds for Maintenance:
   - Person has sufficient means
   - Person refuses or neglects to maintain
   - Unable to maintain himself/herself

3. How to File:
   - File application before Magistrate First Class
   - At place where person resides or is employed
   - No court fee required
   - Can be filed through advocate or in person

4. What to Include:
   - Name and address of applicant
   - Name and address of respondent
   - Relationship with respondent
   - Income of respondent
   - Expenses of applicant
   - Amount claimed
   - Supporting documents

5. Amount of Maintenance:
   - Magistrate considers:
     * Income of person
     * Standard of living
     * Number of dependents
     * Age and health
     * Reasonable needs
   - Up to Rs. 500/month under Section 125 CrPC
   - Many High Courts have awarded higher amounts
   - Under DV Act - more liberal amounts

6. Time Limit:
   - No limitation period
   - Can be filed at any time
   - Even after divorce

7. Enforcement:
   - Magistrate can issue warrant for non-payment
   - Can levy attachment of property
   - Can order employer to deduct from salary
   - Default in payment is punishable

8. Important Points:
   - Maintenance is civil remedy, not criminal
   - Can be claimed under multiple provisions
   - Can file under Section 125 CrPC AND DV Act AND Hindu Adoption Act
   - Supreme Court has upheld right to maintenance
   - Maintenance is for basic needs, not luxury

9. Related Provisions:
   - Section 125 CrPC / Section 144 BNSS
   - Section 24 Hindu Marriage Act (pendente lite)
   - Section 18 Hindu Adoption and Maintenance Act
   - Section 20 Hindu Adoption and Maintenance Act
   - Protection of Women from Domestic Violence Act, 2005
"""
    },
    {
        "id": "how-to-file-nhrc",
        "title": "How to File Complaint with NHRC/SHRC",
        "area": "Human Rights",
        "text": """How to File Complaint with National/State Human Rights Commission:

1. What is NHRC?
   - National Human Rights Commission
   - Statutory body under Protection of Human Rights Act, 1993
   - Protects human rights of citizens

2. What are Human Rights?
   - Right to life and liberty
   - Right to equality
   - Right against torture
   - Right against discrimination
   - Right to fair trial
   - Right to privacy
   - Right to health
   - Right to education
   - Right to work

3. When to Complain?
   - Violation of human rights by public servant
   - Negligence by public servant
   - Torture or custodial death
   - Disappearance in custody
   - Denial of fundamental rights
   - Corruption by public servant
   - Police brutality

4. How to File Complaint?
   - Write complaint to NHRC/SHRC
   - Include name, address, contact
   - Narrate facts of violation
   - Name the public servant/authority
   - Supporting documents
   - Can be filed in English or Hindi
   - Can be filed online (NHRC website)

5. Time Limit:
   - Within 1 year from date of incident
   - Can be extended if sufficient cause shown
   - No time limit for custodial death/torture

6. NHRC Powers:
   - Can investigate complaints
   - Can summon witnesses
   - Can inspect jails
   - Can recommend compensation
   - Can recommend disciplinary action
   - Can recommend prosecution

7. Remedies Available:
   - Compensation to victim
   - Direction to authorities
   - Recommendation for prosecution
   - Public interest litigation
   - Interim relief

8. Important Points:
   - NHRC/SHRC is recommendatory body
   - Cannot override court orders
   - Complaint should be against public servant
   - Cannot substitute for court proceedings
   - Can approach court simultaneously

9. State Human Rights Commission:
   - Each state has SHRC
   - Same powers as NHRC within state
   - Can file complaint with SHRC for state matters
"""
    },
    {
        "id": "how-to-challenge-government-action",
        "title": "How to Challenge Government Action",
        "area": "Administrative Law",
        "text": """How to Challenge Government Action in India:

1. Grounds for Challenge:
   a) Illegality - Action without legal authority
   b) Irrationality - Wednesbury unreasonableness
   c) Procedural impropriety - Failure to follow procedure
   d) Legitimate expectation - Violation of legitimate expectation
   e) Proportionality - Disproportionate action
   f) Mala fide - Bad faith
   g) Violation of fundamental rights
   h) Violation of natural justice

2. Remedies Available:
   a) Writ of Certiorari - Quash illegal order
   b) Writ of Mandamus - Direct public official to perform duty
   c) Writ of Prohibition - Stop lower court/tribunal
   d) Writ of Quo Warranto - Challenge authority of person
   e) Writ of Habeas Corpus - Produce detained person
   f) Declaration - Declare rights
   g) Injunction - Restrain action
   h) Damages - Compensation

3. Where to Challenge:
   - High Court under Article 226
   - Supreme Court under Article 32
   - Central Administrative Tribunal
   - State Administrative Tribunal
   - Appellate Tribunal (sector specific)

4. How to Challenge:
   - File writ petition/representation
   - State grounds clearly
   - Attach supporting documents
   - Pay court fees
   - Can seek interim relief
   - Court may grant stay

5. Time Limit:
   - No strict limitation for writ jurisdiction
   - Must be filed within reasonable time
   - Delay may be condoned

6. Important Cases:
   - T.C. Basappa v. T. Nagappa (1954) - Judicial review
   - A.K. Kraipak v. Union of India (1969) - Natural justice
   - S.P. Sampath Kumar v. Union of India (1987) - Judicial review
   - Maneka Gandhi v. Union of India (1978) - Due process

7. Key Points:
   - Exhaust alternative remedies first (in some cases)
   - Can approach court directly in some cases
   - Interim stay may be granted
   - Court can award compensation
   - Government bound by court orders
"""
    },
    {
        "id": "how-to-get-anticipatory-bail",
        "title": "How to Get Anticipatory Bail",
        "area": "Criminal Law",
        "text": """How to Get Anticipatory Bail in India:

1. What is Anticipatory Bail?
   - Bail in anticipation of arrest
   - Under Section 438 CrPC / Section 482 BNSS
   - Granted by Sessions Court or High Court

2. When to Apply?
   - When person apprehends arrest
   - In non-bailable offences
   - When false case likely
   - When accused is innocent

3. Who Can Apply?
   - Person who apprehends arrest
   - Can be filed through advocate
   - Can be filed before arrest

4. Where to Apply?
   - Sessions Court having jurisdiction
   - High Court
   - Can be filed in either court

5. Grounds for Grant:
   - Accused likely to be arrested
   - Accused is innocent
   - Accused will cooperate with investigation
   - No risk of absconding
   - No risk of tampering with evidence
   - No risk of threatening witnesses
   - Accused has fixed abode
   - Accused has roots in community

6. How to Apply:
   - File application with grounds
   - Mention reasons for apprehension
   - Attach relevant documents
   - Personal affidavit
   - Can be filed before FIR also

7. Conditions That May Be Imposed:
   - Surrender passport
   - Regular reporting to police
   - Fixed residence
   - Not leaving jurisdiction
   - Not contacting witnesses
   - Cooperate with investigation
   - Other conditions

8. Duration:
   - Until disposal of case
   - Or for specified period
   - Can be cancelled if conditions violated

9. Important Points:
   - Not a matter of right
   - Court has discretion
   - Can be granted with conditions
   - Can be cancelled if misused
   - Does not prevent investigation
   - Can be applied for even after FIR
"""
    },
    {
        "id": "how-to-file-for-custody",
        "title": "How to File for Child Custody",
        "area": "Family Law",
        "text": """How to File for Child Custody in India:

1. What is Child Custody?
   - Legal right to have physical and legal custody of child
   - Best interest of child is paramount
   - Can be sole or joint custody

2. Governing Laws:
   - Hindu Minority and Guardianship Act, 1956
   - Guardians and Wards Act, 1890
   - Indian Divorce Act (for Christians)
   - Special Marriage Act (for secular)
   - Muslim Personal Law

3. Who Can Get Custody?
   - Natural guardian (father, then mother)
   - Court considers best interest of child
   - Child preference (if mature enough)
   - Welfare of child is paramount

4. Where to File:
   - Family Court
   - District Court
   - High Court (in certain cases)

5. Factors Considered:
   - Age and sex of child
   - Wishes of parents
   - Wishes of child (if old enough)
   - Character and conduct of parents
   - Financial capacity
   - Emotional bonding
   - Stability of environment
   - Child's education and health

6. Types of Custody:
   a) Sole custody - One parent has full custody
   b) Joint custody - Both parents share custody
   c) Physical custody - Where child lives
   d) Legal custody - Decision-making rights
   e) Visitation rights - Other parent's access

7. How to File:
   - File petition in Family Court
   - State grounds for custody
   - Attach supporting documents
   - Court may appoint welfare officer
   - Court may hear child's preference

8. Interim Custody:
   - Can apply for interim custody
   - Court may grant temporary custody
   - Pending final hearing

9. Important Points:
   - Best interest of child is paramount
   - Mother has natural custody of child below 5
   - Father has natural custody of child above 5 (Hindu law)
   - Court can modify custody orders
   - Non-compliance is contempt of court
   - Both parents have right to access
"""
    }
]

guide_dir = "kb-build/bare-acts/practical-guides-2"
sec_dir = os.path.join(guide_dir, "sections")
os.makedirs(sec_dir, exist_ok=True)

with open(os.path.join(guide_dir, "index.json"), "w", encoding="utf-8") as f:
    json.dump({"id": "practical-guides-2", "title": "More Practical Legal Guides", "totalSections": len(guides), "source": "compiled"}, f, indent=2)

with open(os.path.join(guide_dir, "_sections.json"), "w", encoding="utf-8") as f:
    json.dump([{"section": g["id"], "title": g["title"]} for g in guides], f, indent=2)

full_text = ""
for g in guides:
    full_text += f"=== {g['title']} ===\n\n{g['text']}\n\n\n"
with open(os.path.join(guide_dir, "full.txt"), "w", encoding="utf-8") as f:
    f.write(full_text)

for g in guides:
    with open(os.path.join(sec_dir, g["id"] + ".json"), "w", encoding="utf-8") as f:
        json.dump({"section": g["id"], "title": g["title"], "area": g["area"], "text": g["text"]}, f, indent=2)

print(f"Created {len(guides)} additional practical guides")


# ========== Additional Landmark Judgments ==========
more_judgments = [
    {
        "id": "kesavananda-bharati-revisited-2007",
        "title": "I.R. Coelho v. State of Tamil Nadu (2007)",
        "citation": "2007 (2) SCC 1",
        "court": "Supreme Court of India",
        "area": "Constitutional Law",
        "summary": "9-judge bench held that laws in 9th Schedule are subject to basic structure challenge.",
        "key_holdings": ["9th Schedule laws can be challenged if they violate basic structure", "Judicial review cannot be excluded even for 9th Schedule laws"],
        "text": "I.R. Coelho v. State of Tamil Nadu, 2007 (2) SCC 1\n\nHeld (9-judge bench): Laws placed in the 9th Schedule after April 24, 1973 (Kesavananda date) are subject to basic structure review. Judicial review cannot be excluded for laws that violate the basic structure.\n\nImpact: Clarified the scope of 9th Schedule protection."
    },
    {
        "id": "ir-coelho-2007",
        "title": "Indra Sawhney v. Union of India (1992)",
        "citation": "1992 Supp (3) SCC 217",
        "court": "Supreme Court of India",
        "area": "Constitutional Law - Reservations",
        "summary": "Upheld 27% OBC reservation;Creamy layer concept introduced.",
        "key_holdings": ["27% OBC reservation upheld", "Creamy layer concept introduced", "Total reservation cannot exceed 50%", "Mandal Commission recommendations accepted"],
        "text": "Indra Sawhney v. Union of India, 1992 Supp (3) SCC 217\n\nHeld (9-judge bench): 27% reservation for OBCs is valid. The creamy layer concept was introduced - wealthy OBCs should not get reservation. Total reservation cannot exceed 50%. Mandal Commission recommendations were accepted.\n\nImpact: Implemented OBC reservation and established creamy layer principle."
    },
    {
        "id": "champakam-dorairajan-1951",
        "title": "State of Madras v. Champakam Dorairajan (1951)",
        "citation": "AIR 1951 SC 226",
        "court": "Supreme Court of India",
        "area": "Constitutional Law - Reservations",
        "summary": "First reservation case; held communal reservation violates equality; led to 1st Amendment.",
        "key_holdings": ["Communal reservation violates Article 15(1)", "Article 46 is only directive, not enforceable", "Fundamental Rights prevail over DPSPs"],
        "text": "State of Madras v. Champakam Dorairajan, AIR 1951 SC 226\n\nHeld: The communal reservation in education violated Article 15(1). Article 46 (promotion of educational interests of weaker sections) is a directive principle and cannot override fundamental rights.\n\nImpact: Led to the First Constitutional Amendment which added Article 15(4) for socially and educationally backward classes."
    },
    {
        "id": "automobile-traders-2005",
        "title": "M. Nagaraj v. Union of India (2006)",
        "citation": "2006 (8) SCC 1",
        "court": "Supreme Court of India",
        "area": "Constitutional Law - Reservations",
        "summary": "Upheld reservation in promotions for SC/ST; subject to conditions.",
        "key_holdings": ["Reservation in promotions is valid", "Subject to conditions - backwardness, inadequacy, efficiency", "Creamy layer applies to SC/ST also"],
        "text": "M. Nagaraj v. Union of India, 2006 (8) SCC 1\n\nHeld: Reservation in promotions for SC/ST is valid but subject to conditions: (i) backwardness of the class, (ii) inadequacy of representation, (iii) efficiency in administration. The State must satisfy these conditions.\n\nImpact: Upheld reservation in promotions with conditions."
    },
    {
        "id": "david-john-1981",
        "title": "E.P. Royappa v. State of Tamil Nadu (1974)",
        "citation": "AIR 1974 SC 555",
        "court": "Supreme Court of India",
        "area": "Constitutional Law - Equality",
        "summary": "Expanded Article 14 to include non-arbitrariness; equality is anti-thesis of arbitrariness.",
        "key_holdings": ["Article 14 strikes at arbitrariness", "Equality is a dynamic concept", "No person shall be treated arbitrarily"],
        "text": "E.P. Royappa v. State of Tamil Nadu, AIR 1974 SC 555\n\nHeld: Article 14 strikes at arbitrariness. Equality is a dynamic concept and cannot be confined within traditional bounds. Non-arbitrariness is part of equality.\n\nImpact: Expanded the concept of equality under Article 14."
    },
    {
        "id": "maneka-gandhi-expanded-1978",
        "title": "Sunil Batra v. Delhi Administration (1978)",
        "citation": "AIR 1978 SC 597",
        "court": "Supreme Court of India",
        "area": "Constitutional Law - Prisoners Rights",
        "summary": "Prisoners retain fundamental rights; solitary confinement violates Article 21.",
        "key_holdings": ["Prisoners retain fundamental rights", "Solitary confinement must follow procedure", "Cruel and unusual punishment prohibited"],
        "text": "Sunil Batra v. Delhi Administration, AIR 1978 SC 597\n\nHeld: Prisoners retain their fundamental rights. Solitary confinement can only be imposed following proper procedure. Cruel and unusual punishment violates Article 21.\n\nImpact: Protected prisoners rights and limited arbitrary solitary confinement."
    },
    {
        "id": "visakha-guidelines-1997",
        "title": "D.K. Basu v. State of West Bengal (1997)",
        "citation": "AIR 1997 SC 610",
        "court": "Supreme Court of India",
        "area": "Criminal Law - Arrest Guidelines",
        "summary": "Laid down guidelines for arrest; mandatory procedures to prevent custodial torture.",
        "key_holdings": ["11 guidelines for arrest mandatory", "Arrest memo must be attested by family member", "Right to legal counsel immediately", "Medical examination every 48 hours"],
        "text": "D.K. Basu v. State of West Bengal, AIR 1997 SC 610\n\nHeld: The Supreme Court laid down 11 mandatory guidelines for arrest:\n1. Police officer must bear accurate identification\n2. Arrest memo attested by family member\n3. Right to inform friend/relative immediately\n4. Medical examination every 48 hours\n5. Copy of memo to magistrate\n6. Legal counsel can meet in privacy\n7. Police officer must inform arrestee of rights\n8. Arrestee must be subjected to medical examination\n9. Compensation for non-compliance\n10. These guidelines are mandatory\n\nImpact: Protected against custodial torture and illegal detention."
    },
    {
        "id": "maneka-gandhi-passport-1978",
        "title": "Satwant Singh Sawhney v. D. Ramarathnam (1967)",
        "citation": "AIR 1967 SC 1580",
        "court": "Supreme Court of India",
        "area": "Constitutional Law - Right to Travel",
        "summary": "Right to travel abroad is part of right to life and personal liberty.",
        "key_holdings": ["Right to travel abroad is part of Article 21", "Passport cannot be denied without proper procedure"],
        "text": "Satwant Singh Sawhney v. D. Ramarathnam, AIR 1967 SC 1580\n\nHeld: Right to travel abroad is included in the right to life and personal liberty under Article 21. A passport cannot be denied without following proper procedure.\n\nImpact: Protected right to travel as part of Article 21."
    },
    {
        "id": "kesavananda-fundamental-duties-1992",
        "title": "AIIMS Students Union v. AIIMS (2001)",
        "citation": "2001 (5) SCC 294",
        "court": "Supreme Court of India",
        "area": "Constitutional Law",
        "summary": "Fundamental duties under Article 51A are enforceable through Article 141.",
        "key_holdings": ["Fundamental duties are enforceable", "Court can give directions for implementation", "Can be used for interpreting statutes"],
        "text": "AIIMS Students Union v. AIIMS, 2001 (5) SCC 294\n\nHeld: Fundamental duties under Article 51A are not merely decorative. They can be used as an aid to interpretation and can be enforced through appropriate directions.\n\nImpact: Strengthened the enforceability of fundamental duties."
    },
    {
        "id": "kesavananda-privy-purse-1971",
        "title": "Madhav Rao Scindia v. Union of India (1971)",
        "citation": "AIR 1971 SC 530",
        "court": "Supreme Court of India",
        "area": "Constitutional Law",
        "summary": "Abolition of privy purses was unconstitutional; violated constitutional promises.",
        "key_holdings": ["Constitutional promises are binding", "Abolition of privy purses violated Article 363", "President recognition is binding"],
        "text": "Madhav Rao Scindia v. Union of India, AIR 1971 SC 530\n\nHeld: The abolition of privy purses and privileges of former rulers was unconstitutional. The constitutional recognition given under Article 363 was binding.\n\nImpact: Protected the rights of former rulers under the Constitution."
    },
    {
        "id": "kesavananda-bommai-revisited-1994",
        "title": "R.C. Cooper v. Union of India (1970)",
        "citation": "AIR 1970 SC 564",
        "court": "Supreme Court of India",
        "area": "Constitutional Law - Property",
        "summary": "Nationalization of banks was valid; right to property is not absolute.",
        "key_holdings": ["Nationalization is valid exercise of eminent domain", "Right to property is not absolute", "Article 31A protects land reforms"],
        "text": "R.C. Cooper v. Union of India, AIR 1970 SC 564\n\nHeld: Nationalization of banks was a valid exercise of eminent domain. Right to property is not absolute and can be taken for public purpose with compensation.\n\nImpact: Upheld nationalization and limited property rights."
    },
    {
        "id": "minerva-mills-balancing-1980",
        "title": "Randhir Singh v. Union of India (1982)",
        "citation": "AIR 1982 SC 879",
        "court": "Supreme Court of India",
        "area": "Constitutional Law - Equality",
        "summary": "Equal pay for equal work is a constitutional goal under Article 39(d).",
        "key_holdings": ["Equal pay for equal work is constitutional goal", "Can be enforced through Article 32", "Article 39(d) is justiciable"],
        "text": "Randhir Singh v. Union of India, AIR 1982 SC 879\n\nHeld: Equal pay for equal work is a constitutional goal under Article 39(d) and is enforceable through Article 32.\n\nImpact: Made equal pay for equal work enforceable as a fundamental right."
    }
]

judg_dir = "kb-build/bare-acts/more-landmark-judgments"
sec_dir = os.path.join(judg_dir, "sections")
os.makedirs(sec_dir, exist_ok=True)

with open(os.path.join(judg_dir, "index.json"), "w", encoding="utf-8") as f:
    json.dump({"id": "more-landmark-judgments", "title": "More Landmark Supreme Court Judgments", "totalSections": len(more_judgments), "source": "compiled"}, f, indent=2)

with open(os.path.join(judg_dir, "_sections.json"), "w", encoding="utf-8") as f:
    json.dump([{"section": j["id"], "title": j["title"]} for j in more_judgments], f, indent=2)

full_text = ""
for j in more_judgments:
    full_text += f"=== {j['title']} ===\n\n{j['text']}\n\n\n"
with open(os.path.join(judg_dir, "full.txt"), "w", encoding="utf-8") as f:
    f.write(full_text)

for j in more_judgments:
    with open(os.path.join(sec_dir, j["id"] + ".json"), "w", encoding="utf-8") as f:
        json.dump({"section": j["id"], "title": j["title"], "citation": j["citation"], "court": j["court"], "area": j["area"], "summary": j["summary"], "key_holdings": j["key_holdings"], "text": j["text"]}, f, indent=2)

print(f"Created {len(more_judgments)} more landmark judgments")
