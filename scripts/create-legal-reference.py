"""Create comprehensive legal dictionary, court hierarchy, and Indian legal system overview."""
import json
import os

# ========== Legal Dictionary ==========
dictionary = {
    "id": "legal-dictionary",
    "title": "Comprehensive Legal Dictionary",
    "text": """COMPREHENSIVE LEGAL DICTIONARY (200+ Terms)

=== A ===
1. Abatement - Reduction or lessening; suspension of a suit due to death of a party
2. Accused - Person charged with a criminal offence
3. Acquittal - Freeing of an accused person from all charges
4. Adjournment - Postponement of a case to a later date
5. Adjudicate - To hear and decide a case
6. Admissible - Evidence that is allowed to be presented in court
7. Admission - A statement by a party admitting a fact
8. Advocate - Lawyer entitled to practice in court
9. Affidavit - Written statement sworn before an authorized person
10. Allegation - A claim or assertion that something is the case
11. Appellant - Person who appeals against a court decision
12. Arbitration - Alternative dispute resolution through a private tribunal
13. Arraignment - Formal reading of charges to the accused
14. Assault - Act of creating fear of imminent harmful contact
15. Attachment - Seizure of property by court order

=== B ===
16. Bail - Release of accused on furnishing security
17. Bar - Legal profession; also prohibition by law
18. Bench - The judges presiding over a case
19. Beyond reasonable doubt - Standard of proof in criminal cases
20. Bona fide - In good faith
21. Bond - Written promise to do or not do something
22. Burden of proof - Obligation to prove a fact

=== C ===
23. Case diary - Record of investigation maintained by police
24. Censure - Formal expression of disapproval
25. Charge - Formal accusation of a crime
26. Charge sheet - Police report filed after investigation
27. Civil suit - Non-criminal legal proceeding
28. Cognizable offence - Offence where police can arrest without warrant
29. Commission - Authorization to do something; also investigative body
30. Commutation - Reduction of sentence
31. Complaint - Allegation that an offence has been committed
32. Compoundable offence - Offence that can be settled between parties
33. Conclusive proof - Evidence that cannot be contradicted
34. Concurrent list - List of subjects on which both Centre and State can legislate
35. Confirmation - Approval by higher court of death sentence
36. Contempt of court - Disobedience of court order or disrespect to court
37. Counter-claim - Claim made by defendant against plaintiff
38. Cross-examination - Questioning of a witness by opposing party
39. Custody - State of being detained by police

=== D ===
40. Damages - Compensation for loss or injury
41. De facto - In fact; as a matter of fact
42. De jure - By right; according to law
43. De novo - Anew; from the beginning
44. Debenture - Debt instrument issued by a company
45. Declaration - Formal statement by court on a legal right
46. Decree - Formal expression of court's decision
47. Deponent - Person who makes an affidavit
48. Derivative suit - Action brought by shareholder on behalf of company
49. Detention - Compulsory keeping of a person in custody
50. Discovery - Pre-trial process of exchanging information
51. Dismissal - Rejection of a case without hearing merits
52. Dissolution - Ending of a marriage or company
53. Doctrine - Legal principle established by decision
54. Domicile - Permanent home; place of legal residence

=== E ===
55. Easement - Right to use another person's land
56. Empanelment - Selection of jury or judges
57. Estoppel - Prevented from denying something
58. Evidence - Material presented to prove facts
59. Ex parte - One-sided; without the other party
60. Examination-in-chief - First questioning of a witness by own side
61. Executive order - Directive issued by executive branch
62. Exemplary damages - Punitive damages to deter
63. Exemption - Freedom from an obligation
64. Expert witness - Specialist who gives evidence

=== F ===
65. Fair comment - Defence in defamation
66. Fait accompli - Thing already done
67. FIR - First Information Report
68. Forum shopping - Choosing favorable court
69. Fraud - Intentional deception for unfair advantage
70. Fugitive - Person hiding from law enforcement

=== G ===
71. Garnishee - Third party holding debtor's money
72. Good faith - Honest intention without malice
73. Grand jury - Jury that decides whether to indict
74. Guarantor - Person who guarantees another's obligation

=== H ===
75. Habeas corpus - Writ to produce detained person
76. Hearing - Formal proceeding before court
77. Hierarchy - Order of courts from lowest to highest
78. Holding - Court's determination of law

=== I ===
79. Impleading - Adding a party to a suit
80. In camera - In private (closed courtroom)
81. Injunction - Court order to do or not do something
82. Innkeeper - Person running hotel/lodging
83. Interlocutory - Temporary; pending final decision
84. Interpleader - Suit by person holding property for competing claimants
85. Intestate - Dying without a will
86. Injunction - Court order restraining a party
87. Irretrievable breakdown - Ground for divorce

=== J ===
88. Janitorial services - Maintenance of court premises
89. Joint and several liability - Each party liable for full amount
90. Judicial review - Court's power to examine legality of actions
91. Jurisdiction - Authority of court to hear a case
92. Jury - Panel of citizens who decide facts

=== K ===
93. Key witness - Most important witness

=== L ===
94. Laches - Unreasonable delay in asserting a right
95. Landmark judgment - Significant court decision establishing precedent
96. Leading question - Question suggesting the answer
97. Lessee - Person who leases property
98. Lessor - Person who grants a lease
99. Liability - Legal responsibility
100. Lis pendens - Pending litigation
101. Litigant - Party to a lawsuit
102. Locus standi - Right to appear in court

=== M ===
103. Maintaining - Supporting a case financially
104. Malafide - In bad faith
105. Mandamus - Court order to public official
106. Mens rea - Guilty mind
107. Misfeasance - Improper performance of lawful act
108. Mitigation - Reduction of damages
109. Moratorium - Temporary prohibition of an activity

=== N ===
110. Nemo dat - No one can give what they don't have
111. Nisi - Unless; conditional
112. Nolle prosequi - Decision not to prosecute
113. Non-bailable offence - Offence where bail is not automatic
114. Non-cognizable offence - Offence where police cannot arrest without warrant
115. Novation - Substitution of new obligation

=== O ===
116. Objection - Formal protest in court
117. Obiter dictum - Observation by judge not essential to decision
118. Onerous contract - Contract with burdensome terms
119. Order - Direction of court
120. Original jurisdiction - First time a case comes before a court

=== P ===
121. Pardon - Forgiveness of offence
122. Party - Person involved in legal proceedings
123. Perjury - Lying under oath
124. Plaintiff - Person who initiates a civil suit
125. Plea - Answer of defendant
126. Pleading - Formal written statements by parties
127. Possession - Physical control over property
128. Precedent - Earlier court decision used as authority
129. Preponderance of evidence - Standard in civil cases
130. Prima facie - On first impression
131. Pro tempore - For the time being
132. Probation - Release of offender under supervision
133. Proclamation - Official announcement
134. Professional misconduct - Unethical behavior by professional
135. Promissory note - Written promise to pay

=== Q ===
136. Quashing - Setting aside of proceedings
137. Quasi-judicial - Having powers similar to court

=== R ===
138. Ratification - Approval of an earlier act
139. Receiver - Person appointed to manage property
140. Recidivism - Tendency to reoffend
141. Recusal - Judge withdrawing from case
142. Remand - Sending back to lower court/custody
143. Res judicata - Matter already decided
144. Respondent - Party against whom appeal is filed
145. Retainer - Fee paid to lawyer
146. Revocation - Withdrawal of offer/authority

=== S ===
147. Sanction - Official permission or approval
148. Seizure - Confiscation by authority
149. Sentence - Punishment imposed by court
150. Service of notice - Delivery of legal notice
151. Settlement - Agreement to resolve dispute
152. Signing bonus - N/A (corporate)
153. Solicitor - Lawyer who advises clients
154. Standing - Right to bring a legal action
155. Stare decisis - To stand by decided matters
156. Statute - Written law enacted by legislature
157. Stay order - Court order suspending proceedings
158. Subpoena - Court order to attend/produce documents
159. Substantive law - Laws defining rights and duties
100. Summons - Notice to appear in court
161. Surety - Person who guarantees another's performance

=== T ===
162. Tender - Offer to perform obligation
163. Testament - Will
164. Title - Legal ownership
165. Tort - Civil wrong causing harm
166. Transfer of property - Conveyance of property rights
167. Trial - Examination of evidence before court

=== U ===
168. Ultra vires - Beyond legal power
169. Undue influence - Unfair pressure on a party
170. Usufruct - Right to use and enjoy profits

=== V ===
171. Vacatur - Setting aside of judgment
172. Vakalat - Authorization to practice
173. Vara - Conditional grant
174. Verification - Confirmation of truth
175. Voir dire - Preliminary examination of witness

=== W ===
176. Warrant - Written authorization
177. Will - Testament disposing of property
178. Writ - Court order issued in name of sovereign

=== X, Y, Z ===
179. Year and a day rule - Period after which death is presumed

--- INDIAN LEGAL TERMS ---
180. Adalat - Court (Urdu)
181. Awal - First
182. Bharatiya Nyaya Sanhita - Indian Penal Code (new)
183. Bharatiya Nagrik Suraksha Sanhita - Criminal Procedure Code (new)
184. Bharatiya Sakshya Adhiniyam - Indian Evidence Act (new)
185. Darbar - Court/royal court
186. Dharma - Righteous duty
187. Faujdar - Military commander
188. Hindoo - Person governed by Hindu law
189. Kazi - Islamic judge
190. Nyaya - Justice
191. Pandit - Hindu scholar/lawyer
192. Panchayat - Village council
193. Qazi - Islamic judge
194. Sarkar - Government
195. Shariat - Islamic law
196. Tehsildar - Revenue officer
197. Zamindar - Landlord
"""
}

# ========== Court Hierarchy & Procedure ==========
court_hierarchy = {
    "id": "court-hierarchy-procedure",
    "title": "Indian Court Hierarchy & Procedures",
    "text": """INDIAN COURT HIERARCHY AND PROCEDURES

=== SUPREME COURT OF INDIA ===
- Established: January 28, 1950
- Location: New Delhi
- Judges: 34 (Chief Justice + 33 judges)
- Jurisdiction:
  * Original jurisdiction (Article 131) - Centre-State disputes
  * Writ jurisdiction (Article 32) - Enforcement of FR
  * Appellate jurisdiction - Civil, Criminal, Constitutional
  * Advisory jurisdiction (Article 143)
  * Review jurisdiction
  * Curative jurisdiction
- Appeals: From all High Courts
- Cases per year: ~70,000+ filed, ~40,000 disposed

=== HIGH COURTS ===
- Total: 25 High Courts
- Jurisdiction: State(s) and Union Territory
- Judges: 31-60 per High Court (varies)
- Original jurisdiction: Company matters, admiralty, testamentary, matrimonial
- Appellate jurisdiction: From District Courts and subordinate courts
- Writ jurisdiction (Article 226) - wider than Supreme Court
- Supervisory jurisdiction over subordinate courts
- Revisory jurisdiction

=== DISTRICT COURTS ===
- Principal District Court (formerly District and Sessions Court)
- District Judge - Highest judicial officer in district
- Civil Judge (Senior Division) - Civil cases up to specified amount
- Civil Judge (Junior Division) - Small causes
- Chief Judicial Magistrate - Criminal cases up to 7 years
- Judicial Magistrate First Class - Criminal cases up to 3 years
- Judicial Magistrate Second Class - Criminal cases up to 1 year
- Metropolitan Magistrate - In metropolitan areas

=== SUBORDINATE COURTS ===
- Munsif Court - Civil suits up to Rs. 1 lakh (varies by state)
- Small Causes Court - Summary trial of small civil suits
- Executive Magistrate - Maintenance of law and order
- Revenue Courts - Revenue matters

=== SPECIALIZED COURTS/TRIBUNALS ===
- National Green Tribunal - Environmental matters
- Armed Forces Tribunal - Service matters of armed forces
- Income Tax Appellate Tribunal - Tax disputes
- National Company Law Tribunal - Company law matters
- Securities Appellate Tribunal - SEBI matters
- Debt Recovery Tribunal - Bank debt recovery
- Consumer Disputes Commissions - Consumer protection
- Lok Adalats - Alternative dispute resolution
- Family Courts - Matrimonial and family disputes
- Commercial Courts - Commercial disputes above Rs. 3 lakh
- CBI Special Courts - Cases investigated by CBI
- NIA Special Courts - Cases investigated by NIA
- POCSO Courts - Child sexual abuse cases
- SC/ST Courts - Atrocities against SC/ST

=== LOK ADALATS ===
- Under Legal Services Authorities Act, 1987
- Pre-litigation and pending case resolution
- No court fee
- Binding decision (deemed decree)
- Can resolve: Civil, matrimonial, labour, motor accident, consumer cases
- Cannot resolve: Criminal cases (except compoundable)

=== COURT FEES ===
- Court Fee Act, 1870
- Varies by case type and claim amount
- Exemptions: Poverty, certain government cases
- Can be paid through e-stamping

=== LIMITATION PERIODS ===
- Limitation Act, 1963
- Civil suits: 3 years (general), 12 years (possession)
- Written contracts: 3 years from breach
- Oral contracts: 3 years from breach
- Arbitration: 3 years from award
- Tort: 1-3 years depending on type
- Appeal: 30-90 days depending on court
- Review: 30 days from judgment
- Execution: 12 years from decree
"""
}

# ========== Indian Legal System Overview ==========
legal_system = {
    "id": "indian-legal-system",
    "title": "Indian Legal System Overview",
    "text": """INDIAN LEGAL SYSTEM - COMPREHENSIVE OVERVIEW

=== SOURCES OF INDIAN LAW ===

1. Primary Sources:
   a) Constitution of India - Supreme law of land
   b) Statutes/Acts - Laws enacted by Parliament and State Legislatures
   c) delegated/subordinate legislation - Rules, regulations, bylaws
   d) Judicial precedent - Case law and stare decisis

2. Historical Sources:
   a) Vedic literature - Ancient Indian law
   b) Arthashastra - Kautilya's treatise on governance
   c) Manusmriti - Ancient Hindu law text
   d) Islamic law texts - Quran, Hadith, Ijma, Qiyas
   e) British colonial laws - IPC, CPC, CrPC, Evidence Act

3. Customary Sources:
   a) Custom and usage - Long-standing practices
   b) Trade customs - Commercial practices

4. Foreign Law:
   a) English common law - Many Indian laws based on English law
   b) International treaties - Bilateral and multilateral
   c) UN conventions - Ratified by India

=== CLASSIFICATION OF LAW ===

1. Public Law vs Private Law:
   - Public law: Constitutional, Administrative, Criminal
   - Private law: Contract, Property, Tort, Family

2. Substantive Law vs Procedural Law:
   - Substantive: Defines rights and duties
   - Procedural: Methods of enforcing rights

3. Civil Law vs Criminal Law:
   - Civil: Disputes between individuals/organizations
   - Criminal: Offences against state/society

4. Municipal Law vs International Law:
   - Municipal: Domestic law
   - International: Law between nations

=== CONSTITUTIONAL LAW ===

Key Features of Indian Constitution:
1. Written and detailed constitution
2. Federal system with unitary bias
3. Parliamentary democracy
4. Fundamental Rights (Part III)
5. Directive Principles (Part IV)
6. Fundamental Duties (Part IVA)
7. Independent judiciary
8. Judicial review
9. Secular state
10. Universal adult franchise

Key Constitutional Bodies:
- Election Commission
- Union Public Service Commission
- State Public Service Commissions
- Comptroller and Auditor General
- Attorney General
- Advocate General
- Finance Commission
- National Commission for SCs
- National Commission for STs
- National Commission for BCs

=== ADMINISTRATIVE LAW ===

Principles:
1. Rule of law
2. Natural justice (audi alteram partem, nemo judex)
3. Judicial review of administrative action
4. Legitimate expectation
5. Proportionality
6. Reasonableness
7. Non-arbitrariness (Article 14)

Key Doctrines:
- Ultra vires
- Delegated legislation
- Promissory estoppel
- Estoppel by representation
- Legitimate expectation
- Proportionality
- Wednesbury unreasonableness

=== CRIMINAL LAW ===

Three New Codes (2024):
1. Bharatiya Nyaya Sanhita (BNS) - Replaced IPC
2. Bharatiya Nagrik Suraksha Sanhita (BNSS) - Replaced CrPC
3. Bharatiya Sakshya Adhiniyam (BSA) - Replaced Evidence Act

Key Concepts:
- Mens rea (guilty mind)
- Actus reus (guilty act)
- Cognizable vs non-cognizable offences
- Bailable vs non-bailable offences
- Compoundable vs non-compoundable offences
- Anticipatory bail
- Remand and custody

=== CIVIL LAW ===

Key Acts:
1. Code of Civil Procedure, 1908
2. Indian Contract Act, 1872
3. Sale of Goods Act, 1930
4. Transfer of Property Act, 1882
5. Specific Relief Act, 1963
6. Indian Partnership Act, 1932
7. Negotiable Instruments Act, 1881
8. Limitation Act, 1963
9. Indian Stamp Act, 1899
10. Registration Act, 1908

Key Remedies:
- Decree and order
- Injunction
- Specific performance
- Damages
- Declaration
- Partition
- Receiver

=== PROPERTY LAW ===

Types of Property:
1. Movable property - Can be moved
2. Immovable property - Land and buildings
3. Personal property - Belonging to individual
4. Public property - Belonging to government
5. Joint property - Owned by multiple persons
6. Ancestral property - Inherited from ancestors

Key Concepts:
- Transfer of Property Act, 1882
- Sale, mortgage, lease, gift, exchange
- Part performance (Section 53A)
- Lis pendens (Section 52)
- Rule against perpetuity (Section 14)
- Easement rights
- Adverse possession

=== FAMILY LAW ===

Hindu Law:
- Hindu Marriage Act, 1955
- Hindu Succession Act, 1956
- Hindu Adoption and Maintenance Act, 1956
- Hindu Minority and Guardianship Act, 1956

Muslim Law:
- Muslim Personal Law (Shariat) Application Act, 1937
- Dissolution of Muslim Marriages Act, 1939
- Muslim Women (Protection of Rights on Marriage) Act, 2019

Christian Law:
- Indian Christian Marriage Act, 1872
- Indian Divorce Act, 1869

Parsi Law:
- Parsi Marriage and Divorce Act, 1936

Secular Law:
- Special Marriage Act, 1954
- Indian Succession Act, 1925

=== LABOUR AND EMPLOYMENT LAW ===

Key Acts:
1. Industrial Disputes Act, 1947
2. Factories Act, 1948
3. Minimum Wages Act, 1948
4. Payment of Wages Act, 1936
5. Employees State Insurance Act, 1948
6. Employees Provident Fund Act, 1952
7. Contract Labour (Regulation and Abolition) Act, 1970
8. Child Labour (Prohibition and Regulation) Act, 1986
9. Sexual Harassment of Women at Workplace Act, 2013
10. Code on Wages, 2019 (new)
11. Code on Industrial Relations, 2020 (new)
12. Code on Social Security, 2020 (new)
13. Occupational Safety, Health and Working Conditions Code, 2020 (new)

=== ENVIRONMENTAL LAW ===

Key Acts:
1. Environment (Protection) Act, 1986
2. Water (Prevention and Control of Pollution) Act, 1974
3. Air (Prevention and Control of Pollution) Act, 1981
4. Forest Conservation Act, 1980
5. Wildlife Protection Act, 1972
6. National Green Tribunal Act, 2010
7. Biological Diversity Act, 2002
8. Coastal Regulation Zone Notification

Key Principles:
- Polluter pays principle
- Precautionary principle
- Sustainable development
- Public trust doctrine
- Intergenerational equity

=== CYBER LAW ===

Key Legislation:
1. Information Technology Act, 2000 (amended 2008)
2. Digital Personal Data Protection Act, 2023
3. Information Technology (Intermediary Guidelines) Rules, 2021
4. Information Technology (Reasonable Security Practices) Rules, 2011

Key Concepts:
- E-contracts and digital signatures
- Cyber offences (hacking, identity theft, cyber fraud)
- Intermediary liability
- Data protection and privacy
- Electronic evidence

=== CORPORATE LAW ===

Key Acts:
1. Companies Act, 2013
2. Limited Liability Partnership Act, 2008
3. Insolvency and Bankruptcy Code, 2016
4. Securities and Exchange Board of India Act, 1992
5. Securities Contracts (Regulation) Act, 1956
6. Foreign Exchange Management Act, 1999
7. Competition Act, 2002
8. Prevention of Money Laundering Act, 2002

Key Concepts:
- Separate legal entity
- Corporate veil
- Piercing the corporate veil
- Majority rule, minority protection
- Fiduciary duties of directors
- Oppression and mismanagement
- Winding up and dissolution

=== TAXATION LAW ===

Direct Taxes:
1. Income Tax Act, 1961
2. Wealth Tax Act (repealed)
3. Gift Tax Act (repealed)

Indirect Taxes:
1. Central Goods and Services Tax Act, 2017
2. State Goods and Services Tax Acts
3. Integrated Goods and Services Tax Act, 2017
4. Customs Act, 1962
5. Central Excise Act, 1944

Key Concepts:
- Assessment and reassessment
- Appeal and revision
- Advance ruling
- Transfer pricing
- Tax avoidance vs tax evasion
- Black money

=== INTERNATIONAL LAW ===

Sources:
1. Treaties and conventions
2. Customary international law
3. General principles of law
4. Judicial decisions and teachings

Key Principles:
- Sovereign equality
- Non-intervention
- Peaceful settlement of disputes
- Pacta sunt servanda (treaties must be observed)
- Jus cogens (peremptory norms)

Indian Position:
- Dualist approach (treaties need legislation)
- Article 51 - Promotion of international peace
- International treaties ratified by India

=== ALTERNATIVE DISPUTE RESOLUTION ===

1. Arbitration:
   - Arbitration and Conciliation Act, 1996
   - binding decision by arbitrator
   - Limited court intervention

2. Mediation:
   - Mediation Act, 2023
   - Voluntary process
   - Confidential

3. Conciliation:
   - Under Arbitration Act
   - Non-binding settlement

4. Lok Adalat:
   - Under Legal Services Authorities Act
   - No court fee
   - Binding decision

5. Online Dispute Resolution:
   - Growing importance for e-commerce
   - Under Consumer Protection Act
"""
}

# Create directories and write files
for data in [dictionary, court_hierarchy, legal_system]:
    act_id = data["id"]
    act_dir = f"kb-build/bare-acts/{act_id}"
    sec_dir = os.path.join(act_dir, "sections")
    os.makedirs(sec_dir, exist_ok=True)

    with open(os.path.join(act_dir, "index.json"), "w", encoding="utf-8") as f:
        json.dump({"id": act_id, "title": data["title"], "totalSections": 1, "source": "compiled"}, f, indent=2)

    with open(os.path.join(act_dir, "_sections.json"), "w", encoding="utf-8") as f:
        json.dump([{"section": act_id, "title": data["title"]}], f, indent=2)

    with open(os.path.join(act_dir, "full.txt"), "w", encoding="utf-8") as f:
        f.write(data["text"])

    with open(os.path.join(sec_dir, f"{act_id}.json"), "w", encoding="utf-8") as f:
        json.dump({"section": act_id, "title": data["title"], "text": data["text"]}, f, indent=2)

    print(f"Created: {act_id}")

print("All reference modules created")
