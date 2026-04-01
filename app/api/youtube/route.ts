import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { query } = await request.json();
  const key = process.env.YOUTUBE_API_KEY;

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=3&q=${encodeURIComponent(query)}&key=${key}`;
  const res = await fetch(url);

  if (!res.ok) {
    const errText = await res.text();
    console.error('[/api/youtube] API error', res.status, errText);
    return Response.json({ error: 'YouTube API error' }, { status: 500 });
  }

  const data = await res.json();
  const videos = (data.items ?? []).map((item: {
    id: { videoId: string };
    snippet: { title: string; channelTitle: string; thumbnails: { medium: { url: string } } };
  }) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails.medium.url,
    url: `https://youtube.com/watch?v=${item.id.videoId}`,
  }));

  return Response.json({ videos });
}
