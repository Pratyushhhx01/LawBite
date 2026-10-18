"""Create constitutional amendments reference and legal reference material."""
import json
import os

# ========== Constitutional Amendments ==========
amendments = [
    {"id": "1st-amendment-1951", "title": "1st Constitutional Amendment, 1951", "year": 1951, "summary": "Added reasonable restrictions to Article 19; added Articles 31A, 31B, 31C; placed land reform laws in 9th Schedule.", "key_changes": ["Added reasonable restrictions to Article 19(2)-(6)", "Added Article 31A - acquisition of property for public purposes", "Added Article 31B - validation of certain acts in 9th Schedule", "Added Article 31C - DPSPs overriding FR", "9th Schedule - laws immune from judicial review"], "significance": "Overturned Romesh Thappar v. State of Madras and Sakal Newspapers v. Union of India.", "text": "1st Constitutional Amendment Act, 1951\n\nThe First Constitutional Amendment was passed in 1951 to overcome the Supreme Court decisions in Romesh Thappar v. State of Madras (1950) and Sakal Newspapers v. Union of India (1962).\n\nKey Changes:\n1. Added reasonable restrictions to Article 19(2) - public order, friendly relations with foreign states, defamation, incitement to offence\n2. Added Articles 31A, 31B, 31C to protect land reform and other social legislation\n3. Created the 9th Schedule for laws immune from judicial review\n4. Expanded the scope of Article 19 restrictions"},
    {"id": "7th-amendment-1956", "title": "7th Constitutional Amendment, 1956", "year": 1956, "summary": "Reorganized states on linguistic basis; introduced Union Territories; abolished Class A, B, C, D states.", "key_changes": ["States reorganized on linguistic basis", "Union Territories created", "States classification abolished", "Bicameral legislature provision"], "significance": "Fundamental reorganization of Indian federal structure.", "text": "7th Constitutional Amendment Act, 1956\n\nImplemented the recommendations of the States Reorganization Commission. Reorganized states on linguistic basis. Created Union Territories. Abolished the classification of states into Class A, B, C, D."},
    {"id": "24th-amendment-1971", "title": "24th Constitutional Amendment, 1971", "year": 1971, "summary": "Affirmed Parliament power to amend Fundamental Rights; overruled Golak Nath.", "key_changes": ["Article 368 amended to expressly give power to amend Fundamental Rights", "Amendment under Article 368 is not a law under Article 13"], "significance": "Overruled Golak Nath v. State of Punjab (1967).", "text": "24th Constitutional Amendment Act, 1971\n\nEnacted to overrule the Golak Nath v. State of Punjab (1967) decision. The Supreme Court had held that Parliament could not amend Fundamental Rights. The 24th Amendment expressly gave Parliament power to amend any part of the Constitution including Fundamental Rights under Article 368."},
    {"id": "25th-amendment-1971", "title": "25th Constitutional Amendment, 1971", "year": 1971, "summary": "Curtailed right to property; Article 31C added to give DPSPs primacy over FR.", "key_changes": ["Right to property curtailed", "Article 31C expanded to give primacy to Articles 39(b) and (c) over Fundamental Rights"], "significance": "Shifted balance from Fundamental Rights to Directive Principles.", "text": "25th Constitutional Amendment Act, 1971\n\nCurtailed the right to property and expanded Article 31C to give primacy to certain Directive Principles (Articles 39(b) and (c)) over Fundamental Rights."},
    {"id": "42nd-amendment-1976", "title": "42nd Constitutional Amendment, 1976", "year": 1976, "summary": "Mini Constitution; added Socialist, Secular, Integrity to Preamble; gave DPSPs primacy over FR; curtailed judicial review.", "key_changes": ["Added Socialist, Secular, Integrity to Preamble", "Made Fundamental Rights subject to DPSPs", "Curtailed judicial review", "Added Article 31D, 32A, 39A, 43A, 48A", "Added Part IVA - Fundamental Duties", "Curtailed High Court powers under Article 226"], "significance": "Most controversial amendment; many provisions struck down in Minerva Mills and Waman Rao.", "text": "42nd Constitutional Amendment Act, 1976\n\nCalled the Mini Constitution. Enacted during the Emergency period. Added Socialist, Secular, and Integrity to the Preamble. Made Fundamental Rights subject to Directive Principles. Curtailed judicial review. Many provisions were subsequently struck down by the Supreme Court in Minerva Mills v. Union of India (1980) and Waman Rao v. Union of India (1981)."},
    {"id": "44th-amendment-1978", "title": "44th Constitutional Amendment, 1978", "year": 1978, "summary": "Reversed 42nd Amendment excesses; restored judicial review; right to property removed from FR.", "key_changes": ["Restored judicial review", "Right to property removed from Fundamental Rights (now Article 300A)", "Reversed 42nd Amendment curtailment of FR", "Protected against detention without proper grounds"], "significance": "Restored democratic balance after Emergency.", "text": "44th Constitutional Amendment Act, 1978\n\nEnacted after the Emergency to reverse the excesses of the 42nd Amendment. Restored judicial review. Removed right to property from Fundamental Rights (now Article 300A). Protected against detention without proper grounds."},
    {"id": "61st-amendment-1989", "title": "61st Constitutional Amendment, 1989", "year": 1989, "summary": "Reduced voting age from 21 to 18 years.", "key_changes": ["Voting age reduced from 21 to 18", "Universal adult suffrage lowered"], "significance": "Enfranchised millions of young voters.", "text": "61st Constitutional Amendment Act, 1989\n\nReduced the minimum voting age from 21 years to 18 years, bringing India in line with universal adult suffrage."},
    {"id": "73rd-amendment-1992", "title": "73rd Constitutional Amendment, 1992", "year": 1992, "summary": "Constitutionalized Panchayati Raj institutions; added Part IX.", "key_changes": ["Added Part IX - Panchayats", "Three-tier Panchayati Raj system", "Reservation for SC/ST and women", "State Election Commission", "State Finance Commission"], "significance": "Constitutionalized grassroots democracy.", "text": "73rd Constitutional Amendment Act, 1992\n\nConstitutionalized the Panchayati Raj institutions. Added Part IX to the Constitution. Established three-tier Panchayati Raj system with mandatory reservations for SC/ST and women."},
    {"id": "74th-amendment-1992", "title": "74th Constitutional Amendment, 1992", "year": 1992, "summary": "Constitutionalized Municipalities; added Part IXA.", "key_changes": ["Added Part IXA - Municipalities", "Three-tier urban local bodies", "Reservation for SC/ST and women", "Ward committees"], "significance": "Constitutionalized urban local governance.", "text": "74th Constitutional Amendment Act, 1992\n\nConstitutionalized the Municipal bodies. Added Part IXA to the Constitution. Established three-tier urban local body system."},
    {"id": "86th-amendment-2002", "title": "86th Constitutional Amendment, 2002", "year": 2002, "summary": "Made right to education a fundamental right; Article 21A inserted.", "key_changes": ["Inserted Article 21A - Right to education for children aged 6-14", "Amended Article 45 - early childhood care", "Added Fundamental Duty to provide education"], "significance": "Led to the Right to Education Act, 2009.", "text": "86th Constitutional Amendment Act, 2002\n\nInserted Article 21A making right to free and compulsory education for children aged 6-14 a Fundamental Right. This led to the Right of Children to Free and Compulsory Education Act (RTE Act), 2009."},
    {"id": "99th-amendment-2014", "title": "99th Constitutional Amendment, 2014", "year": 2014, "summary": "Established National Judicial Appointments Commission (NJAC); struck down by SC in 2015.", "key_changes": ["Established NJAC for appointment of judges", "Collegium system replaced"], "significance": "Struck down by Supreme Court in 2015 as violating independence of judiciary.", "text": "99th Constitutional Amendment Act, 2014\n\nEstablished the National Judicial Appointments Commission (NJAC) to replace the Collegium system for appointment of judges. Struck down by the Supreme Court in 2015 in Supreme Court Advocates-on-Record Association v. Union of India as it violated the independence of judiciary."},
    {"id": "101st-amendment-2016", "title": "101st Constitutional Amendment, 2016", "year": 2016, "summary": "Introduced Goods and Services Tax (GST); added Article 246A.", "key_changes": ["Introduced GST", "Added Article 246A - concurrent powers for GST", "Added Article 269A - IGST", "GST Council established"], "significance": "Biggest indirect tax reform in India.", "text": "101st Constitutional Amendment Act, 2016\n\nIntroduced the Goods and Services Tax (GST) regime. Added Article 246A for concurrent power to make laws on GST. Established the GST Council under Article 279A."},
    {"id": "103rd-amendment-2019", "title": "103rd Constitutional Amendment, 2019", "year": 2019, "summary": "10% reservation for Economically Weaker Sections (EWS) in education and employment.", "key_changes": ["Added Article 15(6) - 10% EWS reservation", "Added Article 16(6) - 10% EWS reservation"], "significance": "First reservation based on economic criteria.", "text": "103rd Constitutional Amendment Act, 2019\n\nIntroduced 10% reservation for Economically Weaker Sections (EWS) in education and public employment. This was the first reservation based on economic criteria rather than social backwardness."},
    {"id": "104th-amendment-2020", "title": "104th Constitutional Amendment, 2020", "year": 2020, "summary": "Extended reservation for SC/ST in Lok Sabha and State Assemblies; removed seat reservation for Anglo-Indians.", "key_changes": ["Extended SC/ST reservation in Lok Sabha for 10 years", "Removed Anglo-Indian reservation"], "significance": "Extended affirmative action while removing one category.", "text": "104th Constitutional Amendment Act, 2020\n\nExtended the reservation of seats for SCs and STs in the Lok Sabha and State Assemblies for another 10 years (until 2030). Removed the reservation of seats for Anglo-Indians in the Lok Sabha and State Assemblies."},
    {"id": "106th-amendment-2023", "title": "106th Constitutional Amendment, 2023", "year": 2023, "summary": "Nari Shakti Vandan Adhiniyam - 33% reservation for women in Lok Sabha and State Assemblies.", "key_changes": ["33% reservation for women in Lok Sabha", "33% reservation for women in State Assemblies", "Reservation for SC/ST women within the 33%"], "significance": "Major step towards gender parity in legislature.", "text": "106th Constitutional Amendment Act, 2023 (Nari Shakti Vandan Adhiniyam)\n\nIntroduced 33% reservation for women in the Lok Sabha and State Assemblies. The reservation includes seats reserved for SC/ST women. To be implemented after delimitation based on the first census conducted after the Act."}
]

# Create amendments directory
amend_dir = "kb-build/bare-acts/constitutional-amendments"
sec_dir = os.path.join(amend_dir, "sections")
os.makedirs(sec_dir, exist_ok=True)

with open(os.path.join(amend_dir, "index.json"), "w", encoding="utf-8") as f:
    json.dump({"id": "constitutional-amendments", "title": "Constitutional Amendments Reference", "totalSections": len(amendments), "source": "compiled"}, f, indent=2)

with open(os.path.join(amend_dir, "_sections.json"), "w", encoding="utf-8") as f:
    json.dump([{"section": a["id"], "title": a["title"]} for a in amendments], f, indent=2)

full_text = ""
for a in amendments:
    full_text += f"=== {a['title']} ({a['year']}) ===\n\n{a['text']}\n\n\n"
with open(os.path.join(amend_dir, "full.txt"), "w", encoding="utf-8") as f:
    f.write(full_text)

for a in amendments:
    with open(os.path.join(sec_dir, a["id"] + ".json"), "w", encoding="utf-8") as f:
        json.dump({"section": a["id"], "title": a["title"], "year": a["year"], "summary": a["summary"], "key_changes": a["key_changes"], "significance": a["significance"], "text": a["text"]}, f, indent=2)

print(f"Created {len(amendments)} constitutional amendments")


# ========== Legal Reference Material ==========
legal_ref = [
    {
        "id": "legal-maxims",
        "title": "Legal Maxims",
        "text": """Legal Maxims (Latin phrases used in law):

1. Ab initio - From the beginning
2. Actus reus - Guilty act (physical element of crime)
3. Ad litem - For the litigation/purpose of the suit
4. Amicus curiae - Friend of the court
5. Audi alteram partem - Listen to the other side (natural justice)
6. Bona fide - In good faith
7. Causa causans - The immediate/proximate cause
8. Caveat emptor - Let the buyer beware
9. Damnum absque injuria - Damage without legal injury
10. De facto - In fact (as a matter of fact)
11. De jure - By law / In law
12. De minimis non curat lex - The law does not concern itself with trifles
13. Del credere - Of credit/trust
14. Dictum/Obiter dictum - A judicial remark (not binding)
15. Ejusdem generis - Of the same kind (rule of interpretation)
16. Expressio unius est exclusio alterius - Expression of one is exclusion of another
17. Fiat justitia ruat caelum - Let justice be done though the heavens fall
18. Functus officio - Having performed the function (no longer has authority)
19. Habeas corpus - Produce the body (writ against unlawful detention)
20. Ignorantia juris non excusat - Ignorance of law is no excuse
21. In loco parentis - In the place of a parent
22. In pari delicto - In equal fault
23. In personam - Against a specific person
24. In rem - Against the world at large
25. Locus standi - Right to appear/standing to sue
26. Mens rea - Guilty mind (mental element of crime)
27. Modus operandi - Method of operation
28. Nemo judex in causa sua - No one can be judge in their own cause
29. Nemo dat quod non habet - No one can give what they do not have
30. Nolo contendere - I do not wish to contest (no contest)
31. Non sequitur - It does not follow (logical fallacy)
32. Obiter dictum - A remark by the way (not binding precedent)
33. Pater est quem nuptiae demonstrant - Father is he whom marriage points to
34. Prima facie - At first glance / On the face of it
35. Pro bono - For the public good (free legal work)
36. Pro rata - In proportion
37. Qui facit per alium facit per se - He who acts through another acts himself
38. Qui non dat quod habet non accipit ille quod vult - He who gives not what he has receives not what he wants
39. Res ipsa loquitur - The thing speaks for itself
40. Res judicata - A matter already judged (cannot be re-litigated)
41. Stare decisis - To stand by things decided (precedent)
42. Stricto sensu - In the strict sense
43. Suo motu - On its own motion (suo motu)
44. Ultra vires - Beyond the powers
45. Veto - I forbid
46. Volenti non fit injuria - To a willing person, no injury is done
47. Necessity knows no law - Emergency overrides legal restrictions

Indian Law Specific Maxims:
1. Dharma - Righteous duty (Indian legal concept)
2. Nyaya - Justice (fundamental concept)
3. Vishwaguru - World teacher (India's civilizational role)
"""
    },
    {
        "id": "legal-doctrines",
        "title": "Legal Doctrines",
        "text": """Legal Doctines:

1. Basic Structure Doctrine (Kesavananda Bharati, 1973)
   - Constitution has a basic structure that cannot be amended
   - Supremacy of Constitution, democracy, secularism, federalism, judicial review are basic features
   - Parliament can amend but not destroy the basic structure

2. Doctrine of Eclipse
   - A pre-constitutional law inconsistent with FR is not dead but eclipsed
   - It revives when the FR is amended to remove the inconsistency
   - Example: Bhikaji Narain Dhakras v. State of MP (1955)

3. Doctrine of Pith and Substance
   - Determines which entry of legislature list a law falls under
   - Looks at the true nature and character of the legislation
   - Example: State of Bombay v. F.N. Balsara (1951)

4. Doctrine of Colourable Legislation
   - If legislature has no power to make a law, it cannot do so indirectly
   - What cannot be done directly cannot be done indirectly
   - Example: K.C. Gajapati Narayan Deo v. State of Orissa (1953)

5. Doctrine of Prospective Overruling
   - Court ruling applies only to future cases, not past
   - Not applied in India generally (except Minerva Mills context)
   - Used in: Kesavananda Bharati

6. Doctrine of Harmonious Construction
   - When two provisions conflict, interpret them harmoniously
   - Give effect to both provisions
   - Example: Re Kerala Education Bill (1958)

7. Doctrine of Pleasure
   - Government servant holds office during pleasure of President/Governor
   - Article 310 - Subject to provisions of Constitution
   - Article 311 - Protections for civil servants

8. Doctrine of Adverse Possession
   - Ownership acquired through continuous possession for statutory period
   - 12 years for private property, 30 years for government property
   - Limitation Act, 1963

9. Doctrine of Laches
   - Unreasonable delay in filing suit/disposing right
   - No fixed period - depends on circumstances
   - Equitable doctrine - court may refuse relief

10. Doctrine of Promissory Estoppel
    - Clear and unambiguous promise
    - Promisor should have expected promisee to rely on promise
    - Promisee actually relied and acted on the promise
    - Injustice can only be avoided by enforcing promise

11. Rule Against Perpetuities
    - No interest can be created which will not vest within lives in being
    - Property must vest within lifetime of living persons + 18 years
    - Indian Transfer of Property Act, Section 14

12. Doctrine of Res Judicata
    - Matter already decided cannot be re-litigated
    - Section 11, CPC
    - Constructive res judicata - could have been raised earlier

13. Doctrine of Necessity
    - Emergency situations justify extraordinary measures
    - Applied in constitutional law and administrative law
    - State of MP v. Bhailal Bhai (1964)

14. Doctrine of Legitimate Expectation
    - Administrative body must follow its own rules and policies
    - Person has legitimate expectation of being treated fairly
    - Can be ground for judicial review

15. Doctrine of Proportionality
    - Administrative action must be proportionate to the objective
    - Three-part test: suitability, necessity, proportionality stricto sensu
    - Used in privacy cases (Puttaswamy)
"""
    },
    {
        "id": "rules-of-interpretation",
        "title": "Rules of Statutory Interpretation",
        "text": """Rules of Statutory Interpretation:

A. Primary Rules (Internal Aids):

1. Literal Rule / Plain Meaning Rule
   - Words must be given their ordinary, natural meaning
   - If language is clear, effect must be given to it
   - Example: Tulsipur Sugar Co. v. Notified Area Committee (1980)

2. Golden Rule
   - Modified form of literal rule
   - If literal meaning leads to absurdity, modify the meaning
   - Applied to avoid repugnancy or absurdity
   - Example: Becke v. Smith (1836)

3. Rule of Reasonable Construction (Mischief Rule)
   - Interpretation should suppress the mischief and advance the remedy
   - Look at the object and purpose of the statute
   - Heydon's Case (1584) - four things to consider

4. Ejusdem Generis
   - General words following specific words take meaning from the specific words
   - Example: Animals, birds and things - "things" means living things
   - Applied in: State of Bombay v. P.S. Bhatt (1953)

5. Expressio Unius Est Exclusio Alterius
   - Expression of one thing implies exclusion of others
   - If legislature specifies certain items, others are excluded
   - Example: R v. Income Tax Commissioners (1927)

6. Noscitur a Sociis
   - Words are known by the company they keep
   - Associated words throw light on meaning of each other
   - Example: Barendra Prasad Ray v. ITO (1981)

B. Secondary Rules (External Aids):

7. Legislative History
   - Background, purpose, and objects of legislation
   - Parliamentary debates, committee reports
   - Statement of objects and reasons

8. Contemporanea Expositio
   - Contemporary interpretation is the best guide
   - How was the law understood when enacted?
   - Example: Garland v. Rover (1870)

9. Presumption against Retrospective Operation
   - Laws are presumed to be prospective
   - Unless expressly stated or by necessary implication
   - Section 6, General Clauses Act

10. Presumption Against Inconsistency
    - Legislature does not intend to create inconsistency
    - Harmonious construction preferred
    - Re Kerala Education Bill (1958)

11. Presumption Against Injustice
    - Legislature does not intend unjust consequences
    - Interpretation avoiding injustice preferred
    - Verra Bellamy v. Mabel Stanborough (1925)

12. Presumption Against Unconstitutionality
    - Constitution is supreme
    - Interpretation consistent with Constitution preferred
    - In re Kerala Education Bill (1958)

C. Specific Interpretation Principles:

13. Pith and Substance
    - Determine the true nature and character of legislation
    - Identify the entry under which it falls
    - Example: State of Bombay v. F.N. Balsara (1951)

14. Colourable Legislation
    - If legislature has no power, it cannot do so indirectly
    - What cannot be done directly cannot be done indirectly
    - Example: K.C. Gajapati Narayan Deo v. State of Orissa (1953)

15. Doctrine of Occupied Field
    - When legislature occupies a field, others are excluded
    - Concurrent list - both can legislate but state law prevails if repugnant
    - Article 254
"""
    }
]

ref_dir = "kb-build/bare-acts/legal-reference"
sec_dir_ref = os.path.join(ref_dir, "sections")
os.makedirs(sec_dir_ref, exist_ok=True)

with open(os.path.join(ref_dir, "index.json"), "w", encoding="utf-8") as f:
    json.dump({"id": "legal-reference", "title": "Legal Reference Material", "totalSections": len(legal_ref), "source": "compiled"}, f, indent=2)

with open(os.path.join(ref_dir, "_sections.json"), "w", encoding="utf-8") as f:
    json.dump([{"section": r["id"], "title": r["title"]} for r in legal_ref], f, indent=2)

full_text_ref = ""
for r in legal_ref:
    full_text_ref += f"=== {r['title']} ===\n\n{r['text']}\n\n\n"
with open(os.path.join(ref_dir, "full.txt"), "w", encoding="utf-8") as f:
    f.write(full_text_ref)

for r in legal_ref:
    with open(os.path.join(sec_dir_ref, r["id"] + ".json"), "w", encoding="utf-8") as f:
        json.dump({"section": r["id"], "title": r["title"], "text": r["text"]}, f, indent=2)

print(f"Created {len(legal_ref)} legal reference materials")


# ========== Practical How-To Guides ==========
guides = [
    {
        "id": "how-to-file-fir",
        "title": "How to File an FIR in India",
        "area": "Criminal Law",
        "text": """How to File an FIR (First Information Report) in India:

1. What is an FIR?
   - First Information Report under Section 154 of BNSS (formerly CrPC)
   - Written information of cognizable offence given to police
   - First step in criminal justice process

2. Where to File FIR?
   - Police station having jurisdiction over the area where offence occurred
   - Can be filed at any police station under Zero FIR system
   - Can also be filed online in some states

3. How to File FIR?
   - Go to police station and inform the SHO (Station House Officer)
   - Give information orally or in writing
   - Police must reduce it to writing
   - Read the FIR before signing
   - You have the right to get a free copy of the FIR
   - FIR number will be given to you

4. What to Include in FIR?
   - Date, time, and place of incident
   - Description of what happened
   - Names and descriptions of accused (if known)
   - Names of witnesses (if any)
   - Your details (name, address, contact)
   - Section of law under which offence is made out

5. Rights of Complainant:
   - Right to free copy of FIR (Section 154(2) BNSS)
   - Right to have FIR registered for cognizable offences
   - Police cannot refuse to register FIR for cognizable offences
   - Can approach Superintendent of Police if FIR not registered
   - Can file complaint before Magistrate under Section 175(3) BNSS

6. What if Police Refuse to Register FIR?
   - Approach the Superintendent of Police
   - File complaint before the Judicial Magistrate under Section 175(3) BNSS
   - Send written complaint by post to SP
   - Can file complaint to NHRC/SHRC for human rights violation

7. Key Points:
   - FIR must be in writing and signed by complainant
   - Cannot be anonymous (except in certain cases)
   - Delay in filing FIR must be explained
   - False FIR is punishable under Section 217 BNS
   - Informant cannot withdraw FIR (police has discretion)

8. Important Sections:
   - Section 154 BNSS - Information in cognizable cases
   - Section 155 BNSS - Information in non-cognizable cases
   - Section 156 BNSS - Investigation by police
   - Section 175(3) BNSS - Complaint to Magistrate
"""
    },
    {
        "id": "how-to-file-consumer-complaint",
        "title": "How to File a Consumer Complaint",
        "area": "Consumer Protection Law",
        "text": """How to File a Consumer Complaint in India:

1. What is a Consumer Complaint?
   - Complaint against defective goods or deficient services
   - Under Consumer Protection Act, 2019
   - Three-tier quasi-judicial system

2. Who Can File?
   - Consumer (person who buys goods/services for consideration)
   - Any recognised consumer association
   - Central Government or State Government
   - Legal heir in case of death of consumer

3. Where to File?
   - District Commission - Up to Rs. 1 crore
   - State Commission - Rs. 1 crore to Rs. 10 crore
   - National Commission - Above Rs. 10 crore

4. What Issues Can Be Complained About?
   - Defective goods
   - Deficient services
   - Overcharging or unfair trade practices
   - Restrictive trade practices
   - False or misleading advertisements

5. Time Limit:
   - Within 2 years from date of cause of action
   - Can be filed within reasonable time if there is sufficient cause

6. How to File?
   - File complaint in prescribed format
   - Attach all relevant documents (bills, warranty cards, correspondence)
   - Pay prescribed court fee
   - Can file online through E-Daakhil portal

7. Reliefs Available:
   - Removal of defect
   - Replacement of goods
   - Refund of price paid
   - Compensation for loss/injury
   - Cost of litigation
   - Cease and desist order

8. Key Features of Consumer Protection Act, 2019:
   - Product liability provision
   - E-commerce regulations
   - Unfair contracts provision
   - Mediation as alternative dispute resolution
   - Central Consumer Protection Authority

9. Sample Complaint Format:
   To,
   The District Consumer Disputes Redressal Commission,
   [Address]
   
   Complaint under Section 35 of Consumer Protection Act, 2019
   
   1. Name and address of complainant
   2. Name and address of opposite party
   3. Facts of the case
   4. Cause of action
   5. Relief sought
   6. List of documents
   7. Verification
   
   Date:
   Place:
   Signature of Complainant
"""
    },
    {
        "id": "how-to-get-bail",
        "title": "How to Get Bail in India",
        "area": "Criminal Law",
        "text": """How to Get Bail in India:

1. What is Bail?
   - Release of accused from custody on furnishing bond
   - Can be with or without sureties
   - Not acquittal - only temporary release

2. Types of Bail:
   a) Regular Bail - Section 480 BNSS (formerly 437 CrPC)
      - For offences punishable with imprisonment of 7+ years
      - Granted by Sessions Court or High Court
      
   b) Anticipatory Bail - Section 482 BNSS (formerly 438 CrPC)
      - In anticipation of arrest
      - Granted by Sessions Court or High Court
      - Protection from arrest
      
   c) Default Bail - Section 187(2) BNSS
      - If charge sheet not filed within 60/90 days
      - Right of accused to bail
      - Mandatory bail
      
   d) Interim Bail - Temporary bail
      - Granted for short period
      - Pending hearing of regular bail application

3. Factors for Granting Bail:
   - Nature and gravity of offence
   - Severity of punishment
   - Character of evidence
   - Reasonable apprehension of witness tampering
   - Health of accused
   - Length of detention already undergone
   - Likelihood of fleeing from justice
   - Impact on public order

4. How to Apply for Bail?
   - File bail application through advocate
   - Mention all relevant grounds
   - Attach required documents
   - Personal bond and surety
   - Can be filed at police station (for offences up to 7 years)

5. Conditions That May Be Imposed:
   - Surrender passport
   - Regular reporting to police station
   - Not leaving jurisdiction
   - Not contacting witnesses
   - Fixed residence
   - Other conditions as court may impose

6. What if Bail is Rejected?
   - Can file bail application in next higher court
   - Can file fresh bail application with new grounds
   - Can challenge rejection before High Court

7. Important Points:
   - Bail is rule, jail is exception (for offences up to 7 years)
   - For serious offences (life imprisonment/death), bail is discretionary
   - Anticipatory bail can be for specified period
   - Bail can be cancelled if conditions violated
   - Personal liberty is fundamental right under Article 21
"""
    },
    {
        "id": "how-to-file-rti",
        "title": "How to File an RTI Application",
        "area": "Right to Information Law",
        "text": """How to File an RTI (Right to Information) Application:

1. What is RTI?
   - Right to Information Act, 2005
   - Right to access information from public authorities
   - Promotes transparency and accountability

2. Who Can File RTI?
   - Any citizen of India
   - Can be filed against any public authority
   - Central and State government bodies

3. What Information Can Be Obtained?
   - Any information held by public authority
   - Records, documents, memos, e-mails, opinions
   - Orders, circulars, contracts
   - Information about decisions and policies

4. Exceptions (Section 8 RTI Act):
   - National security and sovereignty
   - Trade secrets and commercial confidence
   - Personal information (unrelated to public activity)
   - Cabinet papers
   - Information prohibited by court

5. How to File RTI?
   - Write application in English/Hindi/regional language
   - Address to the Public Information Officer (PIO)
   - Pay Rs. 10 fee (can be exempted if below poverty line)
   - Can be filed online through rtionline.gov.in
   - Clearly specify information sought

6. Time Limit for Response:
   - 30 days from date of application
   - 48 hours if life or liberty is involved
   - If transferred to another public authority: 30 days from transfer

7. Fee Structure:
   - Rs. 10 application fee
   - Rs. 2 per page for photocopies
   - Actual cost for large documents
   - No fee for Below Poverty Line (BPL) card holders

8. First Appeal:
   - If information not provided within 30 days
   - Appeal to First Appellate Authority (senior officer)
   - Within 30 days of decision/non-response

9. Second Appeal:
   - If not satisfied with first appeal decision
   - Appeal to Central/State Information Commission
   - Within 90 days of first appeal decision

10. Penalties:
    - Rs. 250 per day for delay (maximum Rs. 25,000)
    - PIO personally liable for non-compliance
    - Disciplinary action against PIO
"""
    },
    {
        "id": "how-to-register-marriage",
        "title": "How to Register a Marriage in India",
        "area": "Family Law",
        "text": """How to Register a Marriage in India:

1. Types of Marriage Registration:
   a) Under Hindu Marriage Act, 1955
      - For Hindus, Buddhists, Sikhs, Jains
      - Registration at Sub-Registrar office
      
   b) Under Special Marriage Act, 1954
      - For all religions
      - For inter-faith marriages
      - Registration at Sub-Registrar office

2. Documents Required:
   - Marriage invitation card
   - Marriage certificate from priest/pandit (if applicable)
   - Age proof of both parties (birth certificate/school certificate)
   - Address proof of both parties
   - Passport size photographs
   - Affidavit of marital status (unmarried/widow/divorcee)
   - ID proof (Aadhaar/PAN/Passport)
   - Two witnesses with ID proof

3. Procedure:
   - Visit Sub-Registrar office in jurisdiction of either party
   - Fill application form
   - Submit documents and fees
   - Both parties must be present with two witnesses
   - Marriage certificate issued same day or within few days

4. Under Special Marriage Act:
   - 30-day notice period (public notice)
   - Notice displayed at Sub-Registrar office
   - Objection period (30 days)
   - Marriage solemnized at Sub-Registrar office
   - Certificate issued

5. Fee:
   - Varies by state (typically Rs. 100-500)
   - Some states have no fee

6. Importance of Marriage Registration:
   - Legal proof of marriage
   - Required for passport, visa
   - Required for property matters
   - Required for insurance claims
   - Required for divorce proceedings
   - Required for succession claims

7. Special Cases:
   - NRI marriages: Additional documentation required
   - Foreign nationals: Passport and visa required
   - Court marriages: Can be done under Special Marriage Act
   - Online registration: Available in many states

8. Time Limit:
   - Should be registered within 30 days of marriage
   - Late registration possible with late fee
"""
    },
    {
        "id": "how-to-claim-divorce",
        "title": "How to Get a Divorce in India",
        "area": "Family Law",
        "text": """How to Get a Divorce in India:

1. Types of Divorce:
   a) Mutual Consent Divorce
      - Both parties agree to separate
      - Under Section 13B Hindu Marriage Act
      - Under Section 28 Special Marriage Act
      
   b) Contested Divorce
      - One party files, other contests
      - Under Section 13 Hindu Marriage Act
      - Under Section 27 Special Marriage Act

2. Grounds for Divorce (Section 13 HMA):
   - Adultery
   - Cruelty (physical or mental)
   - Desertion for 2+ years
   - Conversion to another religion
   - Unsoundness of mind
   - Leprosy
   - Venereal disease
   - Renunciation of world
   - Not heard alive for 7 years

3. Mutual Consent Divorce:
   - Both parties living separately for 1 year
   - Unable to live together
   - Mutual agreement to separate
   - Custody of children settled
   - Alimony/settlement agreed
   - 6-month cooling period (can be waived)
   - Total time: 6-18 months

4. Contested Divorce:
   - File petition in family court
   - Court issues notice to other party
   - Other party files written statement
   - Evidence and cross-examination
   - Final arguments
   - Court grants decree
   - Total time: 1-3 years

5. Documents Required:
   - Marriage certificate
   - Marriage photographs
   - Address proof of both parties
   - Evidence of grounds for divorce
   - Children birth certificates (if any)
   - Financial documents
   - Property documents

6. Alimony/Maintenance:
   - Temporary maintenance during proceedings
   - Permanent alimony after divorce
   - Child custody and maintenance
   - Factors: income, standard of living, needs

7. Child Custody:
   - Best interest of child is paramount
   - Joint or sole custody possible
   - Visitation rights for non-custodial parent
   - Child preference considered (if mature enough)

8. Important Points:
   - divorce petition in jurisdiction where last resided together
   - Mediation encouraged before trial
   - Reconciliation attempts by court
   - Decree becomes final after appeal period
"""
    },
    {
        "id": "how-to-file-legal-notice",
        "title": "How to Send a Legal Notice",
        "area": "Civil Law",
        "text": """How to Send a Legal Notice in India:

1. What is a Legal Notice?
   - Formal communication through advocate
   - Intention to take legal action
   - Demand for compliance or compensation
   - Pre-litigation step

2. When to Send Legal Notice?
   - Breach of contract
   - Cheque bounce (Section 138 NI Act)
   - Defamation
   - Property disputes
   - Recovery of money
   - Consumer disputes
   - Employment issues

3. How to Draft Legal Notice?
   - Must be on advocate letterhead
   - Clearly state client details
   - Brief facts of the case
   - Legal provisions violated
   - Demand/complaint clearly stated
   - Time limit for compliance (typically 15-30 days)
   - Consequences of non-compliance
   - Advocate signature and seal

4. How to Send Legal Notice?
   - Send by Registered Post A.D.
   - Send by Speed Post
   - Send by Courier
   - Send by Email (in addition to physical copy)
   - Keep proof of delivery

5. Time Limit for Reply:
   - Typically 15-30 days as specified in notice
   - No fixed legal time limit
   - Court may consider reasonable time

6. Important Points:
   - Legal notice is not mandatory before filing suit
   - But it shows bona fide intention
   - Can lead to out-of-court settlement
   - Evidence of attempt to resolve
   - Cannot be used to threaten or harass

7. Sample Legal Notice Format:
   FROM: Advocate [Name]
   TO: [Opposite Party]
   RE: Legal Notice for [Cause]
   
   Sir/Madam,
   
   Under instructions from my client [Name], I hereby give you this legal notice stating as under:
   
   1. Brief facts
   2. Legal provisions violated
   3. Demand/complaint
   4. Time for compliance
   5. Consequences of non-compliance
   
   You are called upon to comply within [15/30] days from receipt of this notice.
   
   Failing which my client shall be constrained to initiate appropriate legal proceedings.
   
   Date:
   Place:
   Advocate Name
   Enrollment No.
"""
    },
    {
        "id": "how-to-register-property",
        "title": "How to Register Property in India",
        "area": "Property Law",
        "text": """How to Register Property in India:

1. Why Register Property?
   - Compulsory under Indian Registration Act, 1908
   - Document of value Rs. 100 and above must be registered
   - Gives legal validity to transaction
   - Creates evidence of ownership

2. Where to Register?
   - Sub-Registrar Office (SRO) having jurisdiction
   - Property situated in jurisdiction of that SRO
   - Can be done at any SRO in the state (in some states)

3. Documents Required:
   - Sale deed / agreement to sell
   - Title documents of seller
   - Encumbrance certificate
   - Property tax receipts
   - Building plan approval
   - Society NOC (if applicable)
   - ID proof of both parties
   - Passport size photographs
   - Stamp paper of requisite value
   - Two witnesses with ID proof

4. Stamp Duty:
   - Varies by state (typically 3-10% of property value)
   - Must be paid before registration
   - Can be paid through e-stamping
   - Stamp duty on market value or agreement value (whichever higher)

5. Registration Fee:
   - Typically 1% of property value
   - Maximum cap varies by state
   - Paid at time of registration

6. Procedure:
   - Prepare sale deed on stamp paper
   - Both parties visit SRO with witnesses
   - Present documents before Sub-Registrar
   - Biometric verification of parties
   - Pay stamp duty and registration fee
   - Documents registered and indexed
   - Original returned after few days

7. Time Limit:
   - Registration must be done within 4 months of execution
   - Late registration possible with penalty

8. E-Registration:
   - Many states offer online registration
   - E-stamping facility available
   - Online slot booking
   - Digital signatures accepted

9. Important Checks:
   - Verify title (30 years minimum)
   - Check encumbrance certificate
   - Verify property tax payments
   - Check building plan approval
   - Verify society NOC
   - Check for litigation
   - Verify identity of seller

10. After Registration:
    - Collect registered documents
    - Update property records
    - Pay property tax in your name
    - Transfer utilities
"""
    },
    {
        "id": "how-to-apply-for-bail-in-ndps",
        "title": "How to Get Bail in NDPS Cases",
        "area": "Criminal Law - NDPS",
        "text": """How to Get Bail in NDPS (Narcotic Drugs and Psychotropic Substances) Cases:

1. NDPS Act Overview:
   - Narcotic Drugs and Psychotropic Substances Act, 1985
   - Strict provisions for drug offences
   - Bail restrictions under Section 37

2. Bail Restrictions:
   - Section 37(1)(b) - Bail not if reasonable grounds to believe guilty AND offence punishable with 10+ years
   - Section 37(1)(ii) - Previous conviction under NDPS
   - Prosecution must oppose bail

3. When Bail Can Be Granted:
   - If prosecution case is weak
   - If evidence is可疑
   - If accused has been in jail for long time
   - If accused is not a flight risk
   - If accused will not tamper with evidence
   - If offence is commercial quantity vs personal use
   - If accused is a woman or child
   - If accused is sick/infirm

4. Grounds for Bail:
   - Weak prosecution case
   - Delay in trial
   - No criminal antecedents
   - Fixed residence and roots in community
   - Will cooperate with investigation
   - No risk of absconding
   - Not a flight risk

5. Procedure:
   - File bail application before Sessions Court/High Court
   - Oppose prosecution objection
   - Argue on merits
   - Court considers Section 37 restrictions
   - Bail with conditions

6. Conditions Often Imposed:
   - Surrender passport
   - Regular reporting to police
   - Fixed residence
   - Not leaving jurisdiction
   - Not contacting witnesses
   - Other conditions as court may impose

7. Recent Developments:
   - Supreme Court has taken liberal view in personal consumption cases
   - Commercial quantity distinction important
   - Reformative approach for addicts
   - Case-to-case basis assessment

8. Important Points:
   - Bail is not a matter of right in NDPS cases
   - Court has discretion despite Section 37
   - Personal liberty under Article 21
   - Cannot be denied mechanically
   - Each case decided on its own facts
"""
    }
]

guide_dir = "kb-build/bare-acts/practical-guides"
sec_dir_g = os.path.join(guide_dir, "sections")
os.makedirs(sec_dir_g, exist_ok=True)

with open(os.path.join(guide_dir, "index.json"), "w", encoding="utf-8") as f:
    json.dump({"id": "practical-guides", "title": "Practical Legal How-To Guides", "totalSections": len(guides), "source": "compiled"}, f, indent=2)

with open(os.path.join(guide_dir, "_sections.json"), "w", encoding="utf-8") as f:
    json.dump([{"section": g["id"], "title": g["title"]} for g in guides], f, indent=2)

full_text_g = ""
for g in guides:
    full_text_g += f"=== {g['title']} ===\n\n{g['text']}\n\n\n"
with open(os.path.join(guide_dir, "full.txt"), "w", encoding="utf-8") as f:
    f.write(full_text_g)

for g in guides:
    with open(os.path.join(sec_dir_g, g["id"] + ".json"), "w", encoding="utf-8") as f:
        json.dump({"section": g["id"], "title": g["title"], "area": g["area"], "text": g["text"]}, f, indent=2)

print(f"Created {len(guides)} practical how-to guides")
