import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { skill, level, reason, time } = await request.json();

  const GROQ_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;

  const prompt = `You are a learning plan generator. Create a personalized learning plan for someone learning "${skill}".

Details:
- Level: ${level}
- Reason for learning: ${reason}
- Time available: ${time}

Return ONLY valid JSON with no markdown formatting, no code blocks, no explanation. Use this exact structure:
{
  "advice": "string",
  "roadmap": [
    { "phase": "Phase 1", "title": "string", "duration": "string", "topics": ["string", "string", "string"] }
  ],
  "weeklyPlan": [
    { "day": "Monday", "task": "string", "duration": "string", "type": "learn" }
  ],
  "communityResources": [
    { "name": "string", "type": "subreddit", "description": "string", "url": "string" }
  ]
}

Requirements:
- advice: 2-3 sentences written in a direct, warm, friend-like voice. No AI clichés ("certainly!", "great choice!"). Honest and specific to this person's skill, level, and schedule. Example for Guitar/beginner/3 days: "Three days a week is actually ideal for muscle memory — more important than long sessions. Start with just 3 chords and one song you actually like. You'll be surprised how fast it clicks."
- roadmap: exactly 3-4 phases with realistic durations based on the time available
- weeklyPlan: all 7 days (Monday through Sunday), tasks tailored to ${time} availability. "type" must be one of: "learn", "practice", "review"
- communityResources: exactly 4 real communities. "type" must be one of: "subreddit", "discord", "forum", "website". Use real subreddit names (e.g. "r/learnpython"), real discord servers, or well-known forums. URLs should be real
- Keep all text concise and actionable`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.65,
    }),
  });

  if (!res.ok) {
    return Response.json({ error: 'Groq API error' }, { status: 500 });
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? '';

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return Response.json({ error: 'Could not parse response' }, { status: 500 });
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return Response.json(parsed);
  } catch {
    return Response.json({ error: 'Invalid JSON from model' }, { status: 500 });
  }
}
