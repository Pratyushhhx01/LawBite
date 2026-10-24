type ClickEventLike = { preventDefault: () => void };

/** True for in-page anchors such as "#features". */
export function isSectionHref(href: string): boolean {
  return href.startsWith("#") && href.length > 1;
}

/**
 * Handles in-page section links from anywhere in the app.
 * - On the landing page: smooth-scrolls to the section and updates the hash.
 * - On any other route: navigates to the landing page at that hash.
 */
export function handleSectionAnchor(event: ClickEventLike, href: string): void {
  if (!isSectionHref(href)) return;

  if (typeof window === "undefined") return;

  if (window.location.pathname !== "/") {
    event.preventDefault();
    // This helper is called from static links and has no router instance. A
    // full navigation is required to leave the current route and land on the
    // section hash, so the Next.js client-router rule does not apply here.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`/${href}`);
    return;
  }

  const target = document.getElementById(href.slice(1));
  if (!target) return;

  event.preventDefault();
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  target.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start",
  });
  window.history.replaceState(null, "", href);
}

/**
 * Handles logo "home" links.
 * - On the landing page: smooth-scrolls back to the top (hero).
 * - On any other route: lets the Link navigate to "/" normally.
 */
export function handleTopAnchor(event: ClickEventLike): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname !== "/") return;

  event.preventDefault();
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  window.history.replaceState(null, "", "/");
}
