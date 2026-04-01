import { NextRequest } from 'next/server';

function extractBetween(str: string, open: string, close: string): string {
  const start = str.indexOf(open);
  if (start === -1) return '';
  const end = str.indexOf(close, start + open.length);
  if (end === -1) return '';
  return str.slice(start + open.length, end).trim();
}

function cleanContent(raw: string): string {
  // Decode HTML entities first — Reddit content is HTML-encoded inside the XML
  let s = raw
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  // Strip HTML tags after decoding
  s = s.replace(/<[^>]+>/g, ' ');
  // Collapse whitespace
  return s.replace(/\s+/g, ' ').trim();
}

export async function POST(request: NextRequest) {
  const { skill } = await request.json();

  const url = `https://www.reddit.com/search.rss?q=learn+${encodeURIComponent(skill)}&sort=top&limit=12&t=year`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Casly/1.0 (learning app)' },
  });

  if (!res.ok) {
    console.error('[/api/reddit] fetch error', res.status);
    return Response.json({ error: 'Reddit fetch error' }, { status: 500 });
  }

  const xml = await res.text();
  const rawEntries = xml.split('<entry>').slice(1);

  const skillLower = skill.toLowerCase();

  const posts = rawEntries
    .map((entry) => {
      const title = cleanContent(extractBetween(entry, '<title>', '</title>'));

      const linkMatch = entry.match(/rel="alternate"[^>]*href="([^"]+)"/);
      const entryUrl = linkMatch ? linkMatch[1] : '';

      const authorRaw = extractBetween(entry, '<name>', '</name>');
      const author = authorRaw.replace(/^\/?u\//, '');

      // label="r/subreddit"
      const catMatch = entry.match(/label="(r\/[^"]+)"/);
      const subreddit = catMatch ? catMatch[1] : '';

      const contentRaw = extractBetween(entry, '<content type="html">', '</content>');
      const preview = cleanContent(contentRaw).slice(0, 120);

      return { title, author, subreddit, url: entryUrl, preview };
    })
    // Keep only posts that mention the skill in the title
    .filter(p => p.title && p.url && p.title.toLowerCase().includes(skillLower))
    .slice(0, 3);

  return Response.json({ posts });
}
