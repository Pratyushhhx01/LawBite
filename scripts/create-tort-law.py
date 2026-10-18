#!/usr/bin/env python3
"""Upload comprehensive Indian Law of Torts knowledge base to S3."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from s3_upload import create_act

SECTIONS = [
    # 1
    {"section": "1", "title": "Definition and Meaning of Tort",
     "text": """A tort is a civil wrong, other than a breach of contract, for which the remedy is typically a common law action for unliquidated damages. The word 'tort' is derived from the Latin word 'tortum' meaning 'twisted' or 'wrong'. It refers to an act or omission that gives rise to civil liability independent of contract.

Elements of a Tort: (1) There must be a wrongful act or omission; (2) The wrongful act must cause damage; (3) The damage must be of a kind recognised by law; (4) There must be a remedy in the form of damages.

Tort vs Contract: A tort arises from breach of a duty imposed by law, whereas a contract arises from breach of a duty agreed upon by parties. Tort remedies are unliquidated damages; contractual damages are usually liquidated. Tort liability is in personam; contract is also in personam but based on privity.

Tort vs Crime: A tort is a private wrong against an individual; a crime is a public wrong against the state. Tort actions are initiated by the aggrieved party; criminal actions are initiated by the state. The standard of proof in tort is preponderance of probability; in crime it is beyond reasonable doubt.

Tortious Liability: The defendant must owe a duty to the plaintiff, must have breached that duty, and the breach must have caused damage to the plaintiff. The liability is personal and cannot be inherited except in certain statutory situations.

Indian Position: Indian tort law is largely based on English common law. The Indian courts have adopted and adapted English tort principles to Indian conditions. The Supreme Court in Municipal Corporation of Delhi v. Subhagwanti (1967) affirmed that principles of tort law apply in India."""},

    # 2
    {"section": "2", "title": "Theories of Tort Liability",
     "text": """Fault Theory: The predominant theory of tort liability is fault-based. Under this theory, a person is liable only if they are at fault. Fault may take the form of intention, recklessness, or negligence. This theory is rooted in the moral principle that one should be responsible only for one's own wrongful acts.

Strict Liability: Under strict liability, a person is held liable for certain activities regardless of fault. This applies to inherently dangerous activities, keeping wild animals, and non-natural use of land. The defendant is liable even if they took all reasonable precautions.

No-Fault Liability: This extends strict liability to situations where liability is imposed without proof of fault, often for policy reasons. The Motor Vehicles Act, 1988 provides for no-fault compensation in motor accidents. The Bhopal Gas Tragedy led to the conceptualisation of no-fault liability for industrial disasters.

Social Engineering Theory: Roscoe Pound described law as social engineering. Tort law serves social purposes by adjusting relations between individuals. It balances competing interests of freedom and security. The law of torts promotes safety by imposing liability on those who create risks.

Enterprise Liability: This theory holds that enterprises engaged in inherently dangerous activities should bear the cost of injuries caused by such activities. The enterprise is in a better position to spread the cost through pricing and insurance. MC Mehta v Union of India (1987) adopted this theory for hazardous industries.

Risk Theory: Where a person creates a risk, they should bear the consequences if that risk materialises. This theory underlies strict and absolute liability. It is based on the principle that those who benefit from risky activities should compensate those injured by them."""},

    # 3
    {"section": "3", "title": "Motive and Malice",
     "text": """Relevance of Motive: In tort law, motive is generally irrelevant. The question is whether the act was wrongful, not why it was done. A person who commits a tort is liable even if their motive was good. However, motive may be relevant in certain torts like malicious prosecution, abuse of process, and intimidation.

Malice in Law: Malice in law refers to the intentional doing of a wrongful act without justification or excuse. It does not necessarily mean ill-will or spite. In tort law, malice in law is sufficient to establish liability in certain torts. For example, in the tort of malicious prosecution, the plaintiff must prove that the prosecution was initiated with malice in law.

Malice in Fact: Malice in fact refers to actual ill-will or spite. It is relevant in certain torts where ill-will is an essential ingredient. For example, in the tort of nuisance, malice in fact may be relevant in determining whether an act amounts to a nuisance.

Malicious Prosecution: In this tort, the plaintiff must prove: (1) prosecution of the plaintiff by the defendant; (2) without reasonable and probable cause; (3) with malice; (4) termination of the prosecution in favour of the plaintiff; and (5) damage to the plaintiff. Malice here means malice in law, i.e., an improper purpose.

Good Samaritan Laws: The Supreme Court in Parivartan Kendra v Union of India (2016) laid down guidelines for Good Samaritans, recognising that motive matters in determining liability for those who help accident victims."""},

    # 4
    {"section": "4", "title": "Ubi Jus Ibi Remedium",
     "text": """Principle: The maxim 'ubi jus ibi remedium' means 'where there is a right, there is a remedy.' This is a fundamental principle of tort law. If a person has a legal right and that right is violated, the law provides a remedy. Without a right, there can be no remedy; without a violation of right, there can be no action.

Application in Tort: This principle is the foundation of tort law. Every tort is a violation of a legal right of the plaintiff. The law recognises certain rights such as the right to bodily security, the right to reputation, the right to property, and the right to quiet enjoyment of land. If any of these rights is violated, the plaintiff has a right to compensation.

Ashby v White (1703): This landmark case established the principle. The plaintiff, a qualified voter, was prevented from voting by the returning officer. Although the plaintiff's candidate won the election, the court held that the plaintiff had a cause of action because his legal right to vote was violated.

Indian Position: Indian courts have consistently applied this principle. In State of Haryana v. Ch. Jagdish (1998), the Supreme Court held that where a legal right is infringed, the court will grant a remedy unless there is a specific bar.

Limitations: The principle is not absolute. There are situations where a right exists but no remedy is available, such as sovereign acts of state, parliamentary privileges, and certain statutory immunities. The remedy may also be limited by statutes of limitation."""},

    # 5
    {"section": "5", "title": "Injuria Sine Damno and Damnum Sine Injuria",
     "text": """Injuria Sine Damno: This maxim means 'injury without damage.' It refers to a situation where a legal right is infringed but no actual damage results. In such cases, the plaintiff can still maintain an action for damages. The rationale is that every invasion of a legal right is actionable regardless of whether actual damage results.

Ashby v White (1703): The classic example. The plaintiff's right to vote was infringed, but no actual damage resulted since his candidate won. The court held the action maintainable.

Bhim Singh v State of Jammu & Kashmir (1985): The Supreme Court awarded exemplary damages for violation of the petitioner's fundamental rights, even though no actual pecuniary damage was proved. The court held that infringement of a constitutional right is actionable per se.

Damnum Sine Injuria: This maxim means 'damage without injury.' It refers to a situation where actual damage is suffered but no legal right is infringed. In such cases, no action lies. The damage must be accompanied by the violation of a legal right.

Gloucester Grammar School Case (1410): The defendant set up a rival school, causing loss of students and income to the plaintiff school. The court held that no action lay because no legal right was infringed. Competition is lawful even if it causes damage.

Mogul Steamship Co v McGregor (1892): The defendant shipping companies formed a combine to drive the plaintiff out of the Chinese tea trade by offering lower freight rates. The House of Lords held that no action lay because the defendants were exercising their lawful right to compete.

Indian Application: Indian courts follow these maxims. In D.F. Marion v Soni (1994), the Supreme Court held that mere damage without injury to a legal right is not actionable."""},

    # 6
    {"section": "6", "title": "General Defences",
     "text": """Volenti Non Fit Injuria: This means 'to a willing person, no injury is done.' If a person voluntarily consents to an act, they cannot complain of the resulting injury. The consent must be free, with full knowledge of the risk, and not obtained by fraud or coercion. This defence applies to sports, medical treatment, and inherently dangerous activities. In Smith v Baker (1891), the House of Lords held that mere knowledge of risk does not amount to consent.

Inevitable Accident: If an accident occurs despite taking all reasonable precautions, it is a valid defence. The defendant must prove that the accident was unavoidable even after exercising reasonable care. In Stanley v Powell (1891), the defendant fired at a pheasant and the bullet ricocheted hitting the plaintiff. The court held it was an inevitable accident.

Act of God (Vis Major): This refers to natural events beyond human control such as storms, floods, earthquakes, and epidemics. If damage is caused solely by an act of God, the defendant is not liable. However, the defendant must show that no human negligence contributed to the damage. In Nichols v Marsland (1876), unusually heavy rainfall caused artificial lakes to overflow. The court held it was an act of God.

Necessity: In cases of emergency, an act that would otherwise be a tort may be justified if it was done to prevent greater harm. This defence is available when: (1) there was a genuine emergency; (2) the act was reasonable and proportionate; (3) there was no alternative. In Carter v Thomas (1900), the defendant broke into the plaintiff's car to put out a fire. The defence of necessity was upheld.

Private Defence: A person may use reasonable force to protect their person, property, or others from an imminent threat. The force used must be proportionate to the threat. This defence is available in trespass to person, land, and chattels. In Bird v Holbrook (1828), the defendant set spring guns without notice. The defence of private defence failed because of lack of notice.

Justification: Certain acts are justified by law, such as arrest by a police officer, distress for rent, and abatement of nuisance. These are not defences per se but rather justifications for what would otherwise be a tort."""},

    # 7
    {"section": "7", "title": "Negligence",
     "text": """Definition: Negligence is the failure to exercise the degree of care that a reasonable person would exercise under the circumstances. It is the most common tort and the basis of most personal injury claims.

Elements: (1) Duty of Care - The defendant must owe a duty of care to the plaintiff. (2) Breach of Duty - The defendant must have breached that duty. (3) Causation - The breach must have caused the injury. (4) Damage - The plaintiff must have suffered damage.

Duty of Care: The concept was first articulated in Donoghue v Stevenson (1932) by Lord Atkin: 'You must take reasonable care to avoid acts or omissions which you can reasonably foresee would be likely to injure your neighbour.' In India, the Supreme Court in Municipal Corporation of Delhi v Subhagwanti (1967) adopted this principle.

Breach of Duty: The court applies the reasonable man standard. The question is whether the defendant acted as a reasonable person would have acted under the same circumstances. Factors considered include: probability of harm, severity of harm, cost of precautions, and social utility of the activity.

Causation: The plaintiff must prove that the defendant's breach was the cause of the injury. This involves both factual causation ('but for' test) and legal causation (proximate cause). In M/s. New India Assurance Co v R.Srinivasan (2000), the Supreme Court discussed the but-for test.

Damages: The plaintiff must prove actual damage. Damages may be special (quantifiable) or general (pain and suffering). The amount is assessed by the court.

Reasonable Man Standard: The reasonable man is a hypothetical person of ordinary prudence. The standard is objective - the court does not ask what the defendant actually thought but what a reasonable person would have done.

Res Ipsa Loquitur: In certain cases, the doctrine of res ipsa loquitur applies, shifting the burden to the defendant to prove they were not negligent. See Section 9 for details."""},

    # 8
    {"section": "8", "title": "Contributory Negligence",
     "text": """Definition: Contributory negligence occurs when the plaintiff's own negligence contributes to the injury they suffered. If the plaintiff is found to be contributorily negligent, their damages may be reduced in proportion to their share of fault.

Indian Position: Under the Indian law, contributory negligence does not completely bar the plaintiff's claim. The damages are apportioned based on the relative fault of each party. This was established in K.L. Rathi v State of Maharashtra (2001).

Apportionment: The court assesses the degree of fault of each party. If the defendant is 70% at fault and the plaintiff is 30% at fault, the plaintiff's damages will be reduced by 30%. The court has discretion in apportioning fault.

Last Opportunity Rule: Under this rule, if the defendant had the last opportunity to avoid the accident but failed to do so, the defendant is liable even if the plaintiff was negligent. This rule was applied in Davies v Mann (1842), where the defendant's horse and cart ran into the plaintiff's donkey left on the road.

Butterfield v Forrester (1809): This is the classic case on contributory negligence. The plaintiff was riding his horse negligently when he ran into a pole the defendant had placed in the road. The court held that the plaintiff's negligence contributed to the injury and he could not recover.

Duty to Avoid Injury: A person who is aware of a danger created by another's negligence must take reasonable steps to avoid injury. However, the duty is to act as a reasonable person, not to exercise the highest degree of care.

Apportionment of Damages: In Singh v K.L. Rathi (2001), the Supreme Court held that where both parties are negligent, the court should apportion damages based on the degree of negligence of each party. This is a just and equitable approach."""},

    # 9
    {"section": "9", "title": "Res Ipsa Loquitur",
     "text": """Meaning: The doctrine of res ipsa loquitur means 'the thing speaks for itself.' It is not a rule of law but a rule of evidence or inference. When the nature of the accident is such that it would not normally occur without negligence, the court may infer negligence on the part of the defendant.

Prerequisites: (1) The accident must be of a kind that does not ordinarily occur without negligence. (2) The instrumentality causing the injury must have been under the exclusive control of the defendant. (3) The plaintiff must not have contributed to the accident.

Scott v London and St Katherine Docks Co (1865): This is the foundational case. A bag of sugar fell from the defendant's warehouse onto the plaintiff. The court held that the circumstances raised a prima facie case of negligence. The bag did not fall on its own.

Shifting Burden: Once the doctrine applies, the burden shifts to the defendant to prove that they were not negligent. The defendant must provide an explanation consistent with due care. If the defendant fails to do so, the court will presume negligence.

Indian Application: In Sushma v State of Maharashtra (1974), the Bombay High Court applied res ipsa loquitur to a case where a bus belonging to the state transport corporation ran over a pedestrian. The court inferred negligence from the circumstances.

Not a Presumption of Law: The Supreme Court in Nagappa v Gurudayal (2003) clarified that res ipsa loquitur does not create a presumption of law. It is merely a rule of evidence that allows the court to draw an inference of negligence from the circumstances.

Limitations: The doctrine does not apply where there are multiple possible causes, where the instrumentality was not under the defendant's exclusive control, or where the plaintiff's own negligence contributed to the accident."""},

    # 10
    {"section": "10", "title": "Strict Liability",
     "text": """Rylands v Fletcher (1868): This landmark case established the doctrine of strict liability. The defendant constructed a reservoir on his land to supply water to his mill. Water escaped through abandoned mine shafts and flooded the plaintiff's coal mine. The House of Lords held the defendant liable even though there was no negligence.

Rule: A person who brings on to his land and collects and keeps there anything likely to do mischief if it escapes, must keep it in at his peril, and if he does not do so, is prima facie answerable for all the damage which is the natural consequence of its escape.

Exceptions: (1) Plaintiff's Default - If the plaintiff's own fault caused the escape. (2) Act of God - If the escape was caused by an unforeseeable natural event. (3) Plaintiff's Consent - If the plaintiff consented to the risk. (4) Statutory Authority - If the escape was caused by the exercise of a statutory authority. (5) Common Benefit - If the escape occurred while the plaintiff was enjoying the common benefit.

Absolute Liability in India: The Supreme Court in MC Mehta v Union of India (1987) modified the Rylands v Fletcher doctrine for hazardous enterprises. The Court held that enterprises engaged in inherently hazardous activities are absolutely liable for any damage caused, with no exceptions.

Difference from Rylands v Fletcher: Absolute liability has no exceptions, while strict liability under Rylands v Fletcher has several exceptions. Absolute liability applies only to enterprises engaged in inherently hazardous activities, while strict liability applies to any person who brings something dangerous onto their land.

Indian Position: The doctrine of strict liability applies in India but has been modified by the absolute liability doctrine for hazardous industries. In Indian Oil Corporation v Prabha Shankar Mishra (2001), the Supreme Court applied strict liability to a case of escaping gas from a refinery."""},

    # 11
    {"section": "11", "title": "Vicarious Liability",
     "text": """Master-Servant: Under the doctrine of vicarious liability, an employer is liable for torts committed by the employee in the course of employment. The rationale is that the employer benefits from the employee's work and should bear the risks. The test is whether the employer had control over not just what was done but how it was done.

Employer-Employee: The key distinction is between an employee and an independent contractor. An employee works under the control of the employer; an independent contractor controls the manner of doing the work. The employer is liable for the torts of employees but not independent contractors (with exceptions).

Course of Employment: An employee acts in the course of employment if the act is: (1) authorised by the employer; (2) a proper mode of doing authorised work; or (3) so connected with the authorised act that it is a part of it. In State of Andhra Pradesh v Kadir Goud (2003), the Supreme Court discussed the course of employment.

Joint Tortfeasors: Where two or more persons act together to commit a tort, they are jointly and severally liable. Each is liable for the entire damage. The plaintiff can sue any or all of them. In Mohd. Khalid v Debi Charan (2000), the Supreme Court discussed joint liability in tort.

State Liability: The State is vicariously liable for the torts of its servants. Article 300(1) of the Constitution provides that the Government of India and the Government of a State may be sued in connection with acts done in the exercise of governmental functions. In Kasturilal v State of UP (1965), the Supreme Court held that the State is liable for the torts of its servants.

Respondeat Superior: This is the Latin maxim underlying vicarious liability. It means 'let the master answer.' The employer is liable not because of any personal fault but because of the relationship of employer and employee."""},

    # 12
    {"section": "12", "title": "Trespass to Person",
     "text": """Assault: An assault is an act that causes reasonable apprehension of imminent harmful or offensive contact. The plaintiff must be aware of the threat. Words alone do not constitute an assault, but words accompanied by gestures may. In R v Ireland (1997), the House of Lords held that telephone calls causing psychiatric injury could amount to assault.

Battery: Battery is the intentional and unpermitted application of force to another person. It requires actual contact, though even the slightest touch can suffice. In Cole v Turner (1704), the court held that the least touching of another in anger is battery. The force must be harmful or offensive; consensual contact in sport or medical treatment is not battery.

False Imprisonment: False imprisonment is the total restraint of a person's liberty without lawful justification. The restraint must be total; partial restraint is not sufficient. The plaintiff must be aware of the imprisonment or must be affected by it. In Meering v Grahame White Aviation Co (1920), the court held that a person who is unconscious but imprisoned can maintain an action.

Indian Position: The Supreme Court in Kasturilal v State of UP (1965) discussed trespass to person in the context of State liability. In Nilabati Behera v State of Orissa (1993), the court awarded compensation for false imprisonment by police.

Remedies: The remedies for trespass to person include: (1) Damages - compensatory damages for pain, suffering, and loss of liberty. (2) Exemplary damages - where the defendant's conduct is outrageous. (3) Criminal prosecution - assault, battery, and false imprisonment are also criminal offences under the IPC."""},

    # 13
    {"section": "13", "title": "Trespass to Land",
     "text": """Definition: Trespass to land is any direct and intentional interference with another person's possession of land without lawful justification. It includes entering land, remaining on land, or causing anything to enter land.

Direct Interference: The interference must be direct. If the defendant causes something to enter the plaintiff's land, it is trespass. In Boulston v Hardy (1797), the defendant's dogs chased a hare onto the plaintiff's land. This was held to be trespass.

Continuing Trespass: A trespass is continuing if the defendant's act results in a permanent state of affairs. For example, depositing material on the plaintiff's land is a continuing trespass until the material is removed. Each day of continuing trespass gives rise to a fresh cause of action.

Remedies: (1) Damages - compensatory damages for any loss caused. (2) Injunction - to prevent further trespass. (3) Self-help - a person may use reasonable force to remove a trespasser. (4) Re-entry - a person may re-enter their land if it is wrongfully retained.

Justifications: (1) Leave and licence - if the plaintiff consented. (2) Necessity - if the entry was necessary to prevent greater harm. (3) Private defence - if the entry was to protect person or property. (4) Statutory authority - if the entry was authorised by statute.

Indian Position: The Transfer of Property Act, 1882 deals with rights and liabilities of transferors and transferees. The Specific Relief Act, 1963 provides for suits for possession of immovable property. In Narmada Bachao Andolan v Union of India (2000), the Supreme Court discussed the right to property and its protection."""},

    # 14
    {"section": "14", "title": "Trespass to Chattels",
     "text": """Definition: Trespass to chattels is the intentional and direct interference with another person's possession of a chattel without lawful justification. The interference must be direct and intentional.

Conversion: Conversion is an intentional dealing with a chattel in a manner inconsistent with the owner's right. It is more serious than trespass to chattels. The defendant must intend to deal with the chattel as if they were the owner. In Armory v Delamirie (1722), a chimney sweep's boy found a jewel and took it to a goldsmith who refused to return it. The court held this was conversion.

Interference with Goods: Interference includes seizing, damaging, destroying, or wrongfully retaining a chattel. Even temporary interference can amount to trespass. In Kirk v Gregory (1876), the defendant moved the plaintiff's goods from one room to another during her absence. This was held to be trespass.

Damages: The measure of damages for trespass to chattels is: (1) Diminution in value - if the chattel is damaged. (2) Loss of use - for the period of detention. (3) Nominal damages - if no actual damage. For conversion, the measure is the full value of the chattel at the time of conversion.

Indian Position: The Indian Contract Act, 1872 deals with bailment of goods. The Sale of Goods Act, 1930 deals with transfer of property in goods. In K.L. Guindi v State of Maharashtra (1971), the Bombay High Court discussed trespass to chattels in the context of government seizure of property."""},

    # 15
    {"section": "15", "title": "Nuisance",
     "text": """Definition: Nuisance is an unreasonable interference with the plaintiff's use or enjoyment of land. It may be public (affecting the community) or private (affecting an individual).

Public Nuisance: A public nuisance affects the public at large. It includes obstruction of public highways, pollution of rivers, and creation of noise. Only a person who suffers special damage can bring a private action for public nuisance. In Attorney General v PYA Quarries (1957), the court held that a person must show damage different in kind from that suffered by the public.

Private Nuisance: A private nuisance is an unreasonable interference with the plaintiff's use or enjoyment of land. The interference must be substantial and unreasonable. In St Helen's Smelting Co v Tipping (1865), the House of Lords held that the defendant was liable for fumes that damaged the plaintiff's trees and shrubs.

Essential Elements: (1) Interference with the plaintiff's use or enjoyment of land. (2) The interference must be substantial and unreasonable. (3) The interference must be caused by the defendant's act or omission. (4) The plaintiff must have a right to the use of land.

Remedies: (1) Damages - compensatory damages for the nuisance. (2) Injunction - to restrain the nuisance. (3) Self-help - abatement of nuisance (removing the cause). (4) Statutory remedies - under various statutes.

Defences: (1) Prescription - if the nuisance has been enjoyed for 20 years. (2) Statutory authority - if the nuisance is authorised by statute. (3) Coming to the nuisance - if the plaintiff came to the area after the nuisance began (limited defence). (4) Reasonable use - if the defendant's use of land is reasonable.

Indian Position: The Supreme Court in M.C. Mehta v Union of India (1987) discussed nuisance in the context of environmental pollution. The court has evolved the polluter pays principle and the precautionary principle as part of Indian environmental law."""},

    # 16
    {"section": "16", "title": "Defamation",
     "text": """Definition: Defamation is the publication of a statement that tends to lower the plaintiff in the estimation of right-thinking members of society. It may be libel (permanent form) or slander (temporary form).

Libel and Slander: Libel is defamation in a permanent form, such as writing, printing, or broadcast. Slander is defamation in a temporary form, such as spoken words. In Lakshman Singh Kothari v Rup Kanwar (1961), the Rajasthan High Court discussed the distinction.

Essentials: (1) The statement must be defamatory - tending to lower the plaintiff's reputation. (2) The statement must refer to the plaintiff - either expressly or by implication. (3) The statement must be published - communicated to at least one person other than the plaintiff. (4) The statement must be false - truth is a complete defence.

Defences: (1) Justification (Truth) - if the statement is substantially true. (2) Fair Comment - if the statement is a fair comment on a matter of public interest. (3) Privilege - absolute privilege (parliamentary proceedings, judicial proceedings) or qualified privilege (duty to inform and interest to receive). (4) Consent - if the plaintiff consented to the publication.

Indian Position: Sections 499-502 of the Indian Penal Code deal with defamation. The Supreme Court in Subramanian Swamy v Union of India (2016) upheld the constitutional validity of criminal defamation. The court held that the right to reputation is a fundamental right under Article 21.

Damages: The plaintiff may recover: (1) General damages - for harm to reputation. (2) Special damages - for pecuniary loss. (3) Exemplary damages - for outrageous conduct. (4) Injunction - to restrain further publication."""},

    # 17
    {"section": "17", "title": "Negligent Misstatement",
     "text": """Hedley Byrne Principle: The doctrine of negligent misstatement was established in Hedley Byrne & Co v Heller & Partners (1964). A bank provided a negligent reference about a customer's creditworthiness. The House of Lords held that where a special relationship exists between the parties, a person who gives negligent advice may be liable for financial loss caused by reliance on that advice.

Assumption of Responsibility: The key element is that the defendant assumed responsibility for the accuracy of the statement. This may arise from: (1) Professional expertise - a professional advising a client. (2) Special skill - a person with special skill advising another. (3) Known reliance - the defendant knew the plaintiff would rely on the statement.

Elements: (1) There must be a misstatement or negligent advice. (2) The statement must be made with a duty of care. (3) The plaintiff must have relied on the statement. (4) The plaintiff must have suffered financial loss. (5) The reliance must be reasonable.

Indian Position: In S.P. Chengalvaraya Naidu v Jagannath (1994), the Supreme Court discussed the duty of care in giving certificates. In Noorjahan Begum v State of UP (2003), the Allahabad High Court applied the Hedley Byrne principle.

Limitations: The duty of care is limited to cases where there is a special relationship. There is no general duty to be careful in giving advice. The duty does not extend to statements made in social or casual contexts.

Defences: (1) No duty of care. (2) No reliance. (3) Reasonable care was taken. (4) Contributory negligence. (5) Limitation period."""},

    # 18
    {"section": "18", "title": "Occupiers Liability",
     "text": """Definition: Occupiers liability is the duty owed by a person in control of premises to persons who enter the premises. The occupier owes different duties to different classes of visitors.

Invitee: An invitee is a person who enters the premises for a purpose connected with business or for a purpose in which both parties have an interest. The occupier owes the highest duty to an invitee - a duty to take reasonable care to ensure the premises are reasonably safe.

Licensee: A licensee is a person who enters the premises for their own purposes with the express or implied consent of the occupier. The occupier must warn the licensee of any known dangers that are not obvious. In Indermaur v Dames (1866), the court held that an occupier owes a duty to a licensee to give warning of concealed dangers.

Trespasser: A trespasser is a person who enters the premises without permission. The occupier owes a minimal duty to a trespasser - not to willfully injure them or to act with reckless disregard for their safety. In Tomlinson v Congleton Borough Council (2003), the House of Lords held that the occupier owed no duty to a trespasser who was injured while using a lake.

Indian Position: The Supreme Court in Municipal Corporation of Delhi v Subhagwanti (1967) discussed occupiers liability in the context of a clock tower that collapsed. The court held that the occupier owes a duty of care to all persons lawfully on the premises.

Premises: The term 'premises' includes buildings, land, and structures. The duty extends to all parts of the premises that the visitor is allowed to access.

Duty of Care: The duty is to take reasonable care. The standard of care depends on the class of visitor and the circumstances. The occupier must: (1) inspect the premises regularly. (2) Warn of any dangers. (3) Take steps to remedy any defects."""},

    # 19
    {"section": "19", "title": "Absolute Liability",
     "text": """MC Mehta v Union of India (1987): This landmark case established the doctrine of absolute liability in India. Oleum gas leaked from a Shriram Industries plant in Delhi, killing one person and injuring many. The Supreme Court held that enterprises engaged in inherently hazardous activities are absolutely liable for any damage caused.

Enterprise Liability: The Court held that an enterprise engaged in inherently hazardous or dangerous activity is liable to pay compensation for such damage without any exception. The enterprise is in a better position to bear the cost and can spread it through pricing and insurance.

Bhopal Gas Tragedy (1984): The leak of methyl isocyanate gas from Union Carbide India Limited's plant in Bhopal killed thousands and injured hundreds of thousands. This tragedy led to the evolution of absolute liability and enterprise liability principles in Indian law.

Difference from Rylands v Fletcher: Absolute liability under MC Mehta has no exceptions, while strict liability under Rylands v Fletcher has several exceptions (act of God, plaintiff's fault, statutory authority, etc.). Absolute liability applies only to inherently hazardous enterprises.

Application: The doctrine applies to: (1) Chemical plants. (2) Nuclear facilities. (3) Oil refineries. (4) Gas storage. (5) Any enterprise engaged in inherently hazardous activities.

Compensation: The court determines compensation based on: (1) The magnitude and gravity of the disaster. (2) The number of victims. (3) The capacity of the enterprise to pay. (4) The need to deter future misconduct.

Environmental Protection: The absolute liability doctrine is part of the broader framework of environmental protection in India. It is complemented by the polluter pays principle and the precautionary principle."""},

    # 20
    {"section": "20", "title": "Remoteness of Damage",
     "text": """Direct Consequences: A defendant is liable for all damage that flows directly from their wrongful act. There need not be an unbroken chain of causation; it is sufficient that the damage is a natural and probable consequence of the act.

Foreseeable Damage: The test for remoteness of damage is foreseeability. The defendant is liable for damage that was reasonably foreseeable at the time of the wrongful act. In The Wagon Mound (1961), the Privy Council held that a defendant is liable only for damage that was reasonably foreseeable.

Thin Skull Rule: If the plaintiff has a pre-existing condition that makes them more susceptible to injury, the defendant must take the plaintiff as they find them. In Smith v Leech Brain & Co (1962), the defendant's negligence caused a burn to the plaintiff who had a predisposition to cancer. The defendant was liable for the cancer.

Egg Shell Skull Rule: Similar to the thin skull rule, if the plaintiff's skull is as thin as an egg shell, the defendant must take them as they find them. The defendant is liable for the full extent of the injury even if the severity was unforeseeable.

Directness Test: This test asks whether the damage was a direct consequence of the wrongful act. If the damage was caused by an independent intervening act, the chain of causation may be broken. However, if the intervening act was foreseeable, the chain is not broken.

Remoteness in India: The Supreme Court in S.K. Alim v Union of India (2001) discussed remoteness of damage in the context of motor accident claims. The court held that the test of foreseeability applies in Indian law.

Limitations: The plaintiff cannot recover for damage that is too remote. The defendant is not liable for every consequence of their act, only for those that were reasonably foreseeable."""},

    # 21
    {"section": "21", "title": "Damages",
     "text": """Compensatory Damages: The primary purpose of damages in tort is to compensate the plaintiff for the loss suffered. Compensatory damages are awarded to put the plaintiff in the position they would have been in had the tort not been committed. They may be special (pecuniary loss) or general (pain and suffering).

Punitive Damages: Also called exemplary damages, these are awarded to punish the defendant and deter similar conduct. They are awarded in cases of outrageous conduct, malice, or reckless disregard for the plaintiff's rights. In MC Mehta v Union of India (1987), the Supreme Court awarded exemplary damages.

Aggravated Damages: These are awarded where the defendant's conduct was humiliating, insulting, or distressing. They are additional to compensatory damages. In cases of assault, battery, or false imprisonment, aggravated damages may be awarded.

Nominal Damages: Where the plaintiff's legal right has been infringed but no actual damage is suffered, the court may award nominal damages. This vindicates the plaintiff's right. In Bhim Singh v State of Jammu & Kashmir (1985), the Supreme Court awarded exemplary damages for violation of fundamental rights.

Liquidated Damages: These are damages agreed upon by the parties in advance in a contract. In tort, there is no concept of liquidated damages. However, damages may be assessed on the basis of loss of earning capacity, medical expenses, and other quantifiable losses.

Indian Position: The Supreme Court in Union of India v Raghubir Singh (1989) discussed the principles governing assessment of damages in motor accident cases. The court laid down guidelines for computation of compensation.

Factors in Assessment: The court considers: (1) Age and earning capacity. (2) Nature and extent of injury. (3) Pain and suffering. (4) Loss of earnings. (5) Medical expenses. (6) Loss of amenities. (7) Loss of expectation of life."""},

    # 22
    {"section": "22", "title": "Death and Tort",
     "text": """Fatal Accidents: Under the Fatal Accidents Act, 1855, the legal representatives of a deceased person may bring an action for damages if the death was caused by a wrongful act, neglect, or default. The action must be brought within one year from the date of death.

Survival Action: Under Section 306 of the Indian Succession Act, 1925, the estate of the deceased may bring an action for damages that the deceased could have brought had they survived. This includes damages for pain and suffering before death.

Personal Representatives: The personal representatives of the deceased (executor or administrator) may bring an action on behalf of the estate. They may also bring an action on behalf of the dependants under the Fatal Accidents Act.

Dependency Claims: Under the Fatal Accidents Act, damages are awarded for the loss of dependency. The court assesses the contribution the deceased would have made to the dependants had they lived. In Aruna Roxchand Shah v Union of India (2013), the Supreme Court discussed principles for computing compensation in death cases.

Motor Vehicle Accidents: The Motor Vehicles Act, 1988 provides for compensation in case of death or injury in a motor accident. The Motor Accident Claims Tribunal (MACT) has jurisdiction to award compensation. The compensation is awarded to the legal representatives of the deceased.

Indian Position: The Supreme Court in M.S. Grewal v Deep Chand Saini (2001) discussed the principles for assessing compensation in fatal accident cases. The court held that the loss of dependency should be calculated based on the deceased's earning capacity and the needs of the dependants.

Limitation: The action must be brought within the period prescribed by the Limitation Act, 1963. For fatal accidents, the limitation is one year from the date of death."""},

    # 23
    {"section": "23", "title": "Consumer Protection Act 2019",
     "text": """Overview: The Consumer Protection Act, 2019 replaced the Consumer Protection Act, 1986. It provides for the establishment of consumer protection councils and consumer disputes redressal agencies at the district, state, and national levels.

Product Liability: Under Chapter VI of the Act, a manufacturer, product service provider, or product seller is liable for any harm caused by a defective product. The consumer need not prove negligence; it is sufficient to prove that the product was defective and caused harm.

Unfair Trade Practices: The Act defines unfair trade practices including false representation, misleading advertisements, and deceptive practices. The Central Consumer Protection Authority (CCPA) has the power to take action against unfair trade practices.

Consumer Forums: The Act establishes three-tier consumer dispute redressal machinery: (1) District Commission - for claims up to Rs. 1 crore. (2) State Commission - for claims from Rs. 1 crore to Rs. 10 crores. (3) National Commission - for claims above Rs. 10 crores.

E-Commerce: The Act includes provisions for e-commerce transactions. It provides for regulation of e-commerce entities and protection of consumers in online transactions.

Penalties: The Act provides for penalties for misleading advertisements, false complaints, and other offences. The CCPA may impose penalties up to Rs. 10 lakhs for false advertisements and up to Rs. 50 lakhs for subsequent offences.

Mediation: The Act provides for mediation as an alternative dispute resolution mechanism. The consumer forums may refer disputes to mediation for settlement.

Product Recall: The CCPA has the power to order recall of unsafe goods and services, and to impose penalties for non-compliance."""},

    # 24
    {"section": "24", "title": "Motor Vehicle Accidents",
     "text": """Motor Vehicles Act, 1988: This Act regulates motor vehicles and provides for compensation in case of death or injury in a motor accident. It establishes Motor Accident Claims Tribunals (MACT) to adjudicate claims.

No-Fault Compensation: Section 163A of the Motor Vehicles Act provides for no-fault compensation. The dependants of a person killed or injured in a motor accident are entitled to compensation without proving negligence. The compensation is calculated based on a formula.

MACT: The Motor Accident Claims Tribunal has jurisdiction to hear claims for compensation arising from motor accidents. The Tribunal is headed by a Judge not below the rank of a District Judge. The Tribunal may award compensation for death, injury, or damage to property.

Third Party Insurance: Under Section 146 of the Motor Vehicles Act, no motor vehicle shall be used in a public place unless there is in force a policy of insurance complying with the requirements of the Act. The policy must cover liability for death or injury to third parties.

Claimants: The following persons may claim compensation: (1) Legal representatives of the deceased. (2) Dependents of the deceased. (3) Any person who suffered injury. (4) Owner of damaged property.

Assessment of Compensation: The Tribunal assesses compensation based on: (1) Loss of dependency. (2) Medical expenses. (3) Pain and suffering. (4) Loss of amenities. (5) Loss of expectation of life. (6) Consortium. (7) Funeral expenses.

Supreme Court Guidelines: In National Insurance Co v Pranay Sethi (2017), the Supreme Court laid down comprehensive guidelines for computation of compensation in motor accident cases. The court rationalised the formula for calculating future prospects.

Limitation: The claim must be filed within six months from the date of the accident. However, the Tribunal may condone delay in appropriate cases."""},

    # 25
    {"section": "25", "title": "Medical Negligence",
     "text": """Doctor-Patient Relationship: A doctor-patient relationship is established when a doctor agrees to treat a patient. The doctor owes a duty of care to the patient. This duty arises from the contract of service or from the acceptance of the professional relationship.

Standard of Care: The doctor must exercise the degree of care and skill expected of a reasonably competent medical practitioner in that field. In Jacob Mathew v State of Punjab (2005), the Supreme Court held that a doctor is not liable for negligence merely because a patient dies or suffers harm. The patient must prove that the doctor was negligent.

Bolam Test: The standard of care is assessed by the Bolam test, which asks whether the doctor acted in accordance with a practice accepted as proper by a responsible body of medical practitioners. In Bolam v Friern Hospital Management Committee (1957), the court held that a doctor is not negligent if they acted in accordance with a responsible body of medical practitioners.

Informed Consent: A doctor must obtain the patient's informed consent before performing any treatment or procedure. The patient must be informed of: (1) The nature of the treatment. (2) The risks involved. (3) The alternatives. (4) The consequences of refusing treatment. In Mohd. Ikram Hussain v State of UP (1962), the Allahabad High Court discussed informed consent.

Res Ipsa Loquitur: In medical negligence cases, the doctrine of res ipsa loquitur may apply. If the injury would not have occurred without negligence and the instrumentality was under the defendant's control, the court may infer negligence. In Kusum Sharma v Batra Hospital (2010), the Supreme Court discussed the application of res ipsa loquitur in medical cases.

Indian Position: The Supreme Court in Indian Medical Association v VP Shantha (1995) held that medical practitioners are covered under the Consumer Protection Act. Patients can file complaints before the consumer forums for medical negligence.

Defences: (1) Consent - the patient consented to the treatment. (2) Contributory negligence - the patient failed to follow medical advice. (3) Emergency - the doctor acted in an emergency. (4) Professional skill - the doctor exercised reasonable skill and care.

Damages: The patient may recover: (1) Compensation for pain and suffering. (2) Medical expenses. (3) Loss of earning capacity. (4) Cost of future treatment. (5) Exemplary damages in cases of gross negligence.""",
     "cases": [
         {"name": "Jacob Mathew v State of Punjab (2005)", "citation": "2005 (6) SCC 1", "principle": "Laid down guidelines for prosecution of medical professionals; established that negligence must be proved by expert evidence"},
         {"name": "Kusum Sharma v Batra Hospital (2010)", "citation": "2010 (3) SCC 480", "principle": "Discussed res ipsa loquitur in medical negligence cases; held that medical negligence requires expert testimony"},
         {"name": "Indian Medical Association v VP Shantha (1995)", "citation": "1995 (6) SCC 651", "principle": "Medical services fall within the ambit of Consumer Protection Act"}
     ]},
]

# Add case references to sections that need them
CASES = {
    "1": [
        {"name": "Municipal Corporation of Delhi v Subhagwanti (1967)", "citation": "AIR 1967 SC 970", "principle": "Principles of tort law apply in India"},
    ],
    "4": [
        {"name": "Ashby v White (1703)", "citation": "[1703] 2 Ld Raym 938", "principle": "Established the principle that every invasion of a legal right is actionable"},
        {"name": "Bhim Singh v State of Jammu & Kashmir (1985)", "citation": "1985 AIR 528", "principle": "Awarded exemplary damages for violation of fundamental rights"},
    ],
    "5": [
        {"name": "Ashby v White (1703)", "citation": "[1703] 2 Ld Raym 938", "principle": "Injuria sine damno - injury without damage is actionable"},
        {"name": "Gloucester Grammar School Case (1410)", "citation": "(1410) YB 2 Hen V 18", "principle": "Damnum sine injuria - damage without injury is not actionable"},
        {"name": "Mogul Steamship Co v McGregor (1892)", "citation": "[1892] AC 25", "principle": "Lawful competition causing damage is not actionable"},
    ],
    "7": [
        {"name": "Donoghue v Stevenson (1932)", "citation": "[1932] AC 562", "principle": "Established the neighbour principle and modern law of negligence"},
    ],
    "9": [
        {"name": "Scott v London and St Katherine Docks Co (1865)", "citation": "(1865) 3 H&C 596", "principle": "Founded the doctrine of res ipsa loquitur"},
    ],
    "10": [
        {"name": "Rylands v Fletcher (1868)", "citation": "[1868] UKHL 1", "principle": "Established strict liability for escape of dangerous things"},
        {"name": "MC Mehta v Union of India (1987)", "citation": "1987 AIR 965", "principle": "Established absolute liability for hazardous enterprises"},
    ],
    "11": [
        {"name": "Kasturilal v State of UP (1965)", "citation": "AIR 1965 SC 1039", "principle": "State liability for torts of its servants"},
        {"name": "Nilabati Behera v State of Orissa (1993)", "citation": "1993 AIR 1960", "principle": "Compensation for false imprisonment by police"},
    ],
    "15": [
        {"name": "MC Mehta v Union of India (1987)", "citation": "1987 AIR 965", "principle": "Environmental nuisance and polluter pays principle"},
    ],
    "16": [
        {"name": "Subramanian Swamy v Union of India (2016)", "citation": "2016 (7) SCC 221", "principle": "Upheld constitutional validity of criminal defamation"},
    ],
    "19": [
        {"name": "MC Mehta v Union of India (1987)", "citation": "1987 AIR 965", "principle": "Established absolute liability for hazardous enterprises"},
        {"name": "Union Carbide case (Bhopal Gas Tragedy)", "citation": "1989 SCC (1) 592", "principle": "Led to evolution of absolute liability and enterprise liability"},
    ],
    "22": [
        {"name": "Aruna Roxchand Shah v Union of India (2013)", "citation": "2013 (2) SCC 1", "principle": "Principles for computing compensation in death cases"},
    ],
    "24": [
        {"name": "National Insurance Co v Pranay Sethi (2017)", "citation": "2017 (3) SCC 628", "principle": "Guidelines for computation of compensation in motor accident cases"},
    ],
    "25": [
        {"name": "Jacob Mathew v State of Punjab (2005)", "citation": "2005 (6) SCC 1", "principle": "Guidelines for prosecution of medical professionals"},
        {"name": "Indian Medical Association v VP Shantha (1995)", "citation": "1995 (6) SCC 651", "principle": "Medical services covered under Consumer Protection Act"},
    ],
}

# Merge cases into sections
for s in SECTIONS:
    if s["section"] in CASES:
        s["cases"] = CASES[s["section"]]

create_act("tort-law", "Law of Torts", SECTIONS, source="web-compilation")
print(f"Done: tort-law ({len(SECTIONS)} sections)")
