import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const reqUrl = new URL(req.url);
  const url = reqUrl.searchParams.get("url");

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    const response = await fetch(url);
    const text = await response.text();
    const titleMatch = text.match(/<title>(.*?)<\/title>/);
    const ogTitleMatch = text.match(/<meta property="og:title" content="(.*?)"/);
    const title = ogTitleMatch ? ogTitleMatch[1] : (titleMatch ? titleMatch[1] : 'Untitled');
    
    const res = NextResponse.json({ title }, { status: 200 });
    res.headers.set('Cache-Control', 'public, max-age=86400');
    return res;
  } catch {
    return NextResponse.json({ error: 'Failed to fetch title' }, { status: 500 });
  }
}