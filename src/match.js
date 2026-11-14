// Decides whether a page URL is covered by a configured entry.
// Loaded before content_script.js (see manifest.json); also required by test/match.test.js.

// "https://www.YouTube.com/shorts/?a=1" -> { host: "youtube.com", path: "/shorts" }
function normalizeEntry(entry) {
  let text = String(entry).trim().toLowerCase();
  text = text.replace(/^[a-z][a-z0-9+.-]*:\/\//, ''); // scheme
  text = text.split(/[?#]/)[0];                         // query, fragment
  const slash = text.indexOf('/');
  let host = slash === -1 ? text : text.slice(0, slash);
  const path = slash === -1 ? '' : text.slice(slash).replace(/\/+$/, '');
  host = host.replace(/:\d*$/, '').replace(/^www\./, '');
  return { host, path };
}

// An entry matches when the page's host equals the entry's host (ignoring a leading
// "www."), and, if the entry has a path, the page's path is that path or inside it.
// Other subdomains do not match: "youtube.com" does not cover "music.youtube.com".
function entryMatchesUrl(entry, url) {
  const { host, path } = normalizeEntry(entry);
  if (!host) return false;
  let page;
  try {
    page = new URL(url);
  } catch {
    return false;
  }
  if (page.hostname.toLowerCase().replace(/^www\./, '') !== host) return false;
  if (!path) return true;
  const pagePath = page.pathname.toLowerCase();
  return pagePath === path || pagePath.startsWith(path + '/');
}

if (typeof module !== 'undefined') {
  module.exports = { normalizeEntry, entryMatchesUrl };
}
