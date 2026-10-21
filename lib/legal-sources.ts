/**
 * Source-quality gate for web results used by the legal chat.
 *
 * The assistant must not present social media, user-generated posts, blogs or
 * content farms as legal authority. Government domains, courts, legal
 * databases and established legal newsrooms are kept; everything else is
 * dropped before it reaches the model or the "Sources" strip.
 */

const GOVERNMENT_SUFFIXES = ["gov.in", "nic.in"] as const;

/** Domains that are never acceptable as legal sources. */
export const BLOCKED_SOURCE_DOMAINS = [
  // Social media / user-generated content
  "instagram.com",
  "facebook.com",
  "fb.com",
  "x.com",
  "twitter.com",
  "t.co",
  "threads.net",
  "tiktok.com",
  "youtube.com",
  "youtu.be",
  "reddit.com",
  "quora.com",
  "linkedin.com",
  "pinterest.com",
  "snapchat.com",
  "telegram.org",
  "t.me",
  "whatsapp.com",
  "medium.com",
  "tumblr.com",
  // Blogs, wikis and content farms
  "blogspot.com",
  "wordpress.com",
  "substack.com",
  "wikipedia.org",
  "wikihow.com",
  "answers.com",
  "scribd.com",
  "slideshare.net",
  "coursehero.com",
  "studocu.com",
  "chegg.com",
  "brainly.in",
  "byjus.com",
  "vedantu.com",
  "unacademy.com",
  "testbook.com",
  "adda247.com",
  "scoopwhoop.com",
  "buzzfeed.com",
  "9gag.com",
  "imgur.com",
] as const;

/** Reliable Indian legal databases, institutions and newsrooms. */
const TRUSTED_SOURCE_DOMAINS = [
  // Primary legal databases / repositories
  "indiankanoon.org",
  "casemine.com",
  "latestlaws.com",
  "scconline.com",
  "manupatra.com",
  "taxmann.com",
  "prsindia.org",
  "rbi.org.in",
  "pfrda.org.in",
  // Law schools and legal research
  "nls.ac.in",
  "nludelhi.ac.in",
  "nalsar.ac.in",
  "nujs.edu",
  "nliu.ac.in",
  "rmlnlu.ac.in",
  "gnlu.ac.in",
  "hnlu.ac.in",
  "cnlu.ac.in",
  "mnlu.ac.in",
  "dnlu.ac.in",
  "nluassam.ac.in",
  "hpnlu.ac.in",
  "nluo.ac.in",
  // Established legal news / analysis
  "barandbench.com",
  "livelaw.in",
  "indialegallive.com",
  "thehindu.com",
  "indianexpress.com",
  "thehindubusinessline.com",
] as const;

function matchesDomain(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

function hostnameOf(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/\.$/, "");
    return hostname || null;
  } catch {
    return null;
  }
}

/** True only for official, judicial, legal-database or established legal-news URLs. */
export function isTrustedLegalSource(url: string | null | undefined): boolean {
  if (!url) return false;
  const hostname = hostnameOf(url);
  if (!hostname) return false;

  if (BLOCKED_SOURCE_DOMAINS.some((domain) => matchesDomain(hostname, domain))) {
    return false;
  }

  if (GOVERNMENT_SUFFIXES.some((suffix) => matchesDomain(hostname, suffix))) {
    return true;
  }

  return TRUSTED_SOURCE_DOMAINS.some((domain) =>
    matchesDomain(hostname, domain),
  );
}

/** Domains sent to Tavily so social/UGC pages never enter the candidate set. */
export const TAVILY_EXCLUDED_DOMAINS = [...BLOCKED_SOURCE_DOMAINS];
