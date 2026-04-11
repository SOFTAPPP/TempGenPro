export const purgeTrackers = (html: string) => {
  let trackersBlocked = 0;

  // 1. Remove tracking pixels (transparent 1x1 imgs)
  const pixelPatterns = [
    /<img[^>]+width=["']1["'][^>]+height=["']1["'][^>]*>/gi,
    /<img[^>]+height=["']1["'][^>]+width=["']1["'][^>]*>/gi,
    /https?:\/\/[^"']+\/pixel\.[a-z]{3,4}/gi, // Common pixel patterns
    /https?:\/\/t\.sidekickopen[a-z0-9]+\.com[^"']+/gi, // HubSpot
    /https?:\/\/rs-stripe\.com[^"']+/gi, // Stripe tracking
  ];

  let cleanedHtml = html;
  
  pixelPatterns.forEach(pattern => {
    const matches = cleanedHtml.match(pattern);
    if (matches) {
      trackersBlocked += matches.length;
      cleanedHtml = cleanedHtml.replace(pattern, '<!-- [SHIELD: Tracker Removed] -->');
    }
  });

  // 2. Clean URL Query Trackers (UTMs, etc)
  const queryTrackers = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'msclkid'];
  
  const urlRegex = /https?:\/\/[^\s"'<>]+/g;
  cleanedHtml = cleanedHtml.replace(urlRegex, (url) => {
    try {
      const parsed = new URL(url);
      let removedCount = 0;
      queryTrackers.forEach(param => {
        if (parsed.searchParams.has(param)) {
          parsed.searchParams.delete(param);
          removedCount++;
        }
      });
      if (removedCount > 0) {
        trackersBlocked += 1; // Count as 1 blocked tracker event for the URL
        return parsed.toString();
      }
      return url;
    } catch {
      return url;
    }
  });

  return { cleanedHtml, trackersBlocked };
};
