import re
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode

def purge_trackers(html: str):
    trackers_blocked = 0

    pixel_patterns = [
        re.compile(r'<img[^>]+width=["\']1["\'][^>]+height=["\']1["\'][^>]*>', re.IGNORECASE),
        re.compile(r'<img[^>]+height=["\']1["\'][^>]+width=["\']1["\'][^>]*>', re.IGNORECASE),
        re.compile(r'https?:\/\/[^"\']+\/pixel\.[a-z]{3,4}', re.IGNORECASE),
        re.compile(r'https?:\/\/t\.sidekickopen[a-z0-9]+\.com[^"\']+', re.IGNORECASE),
        re.compile(r'https?:\/\/rs-stripe\.com[^"\']+', re.IGNORECASE),
    ]

    cleaned_html = html

    for pattern in pixel_patterns:
        matches = pattern.findall(cleaned_html)
        if matches:
            trackers_blocked += len(matches)
            cleaned_html = pattern.sub('<!-- [SHIELD: Tracker Removed] -->', cleaned_html)

    query_trackers = {'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'msclkid'}

    def replace_url(match):
        nonlocal trackers_blocked
        url = match.group(0)
        try:
            parsed = urlparse(url)
            query = parse_qs(parsed.query, keep_blank_values=True)
            
            removed_count = 0
            new_query = {}
            for k, v in query.items():
                if k in query_trackers:
                    removed_count += 1
                else:
                    new_query[k] = v
            
            if removed_count > 0:
                trackers_blocked += 1
                new_query_str = urlencode(new_query, doseq=True)
                new_url = urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, new_query_str, parsed.fragment))
                return new_url
            return url
        except Exception:
            return url

    url_regex = re.compile(r'https?:\/\/[^\s"\'<>]+')
    cleaned_html = url_regex.sub(replace_url, cleaned_html)

    return {"cleanedHtml": cleaned_html, "trackersBlocked": trackers_blocked}
