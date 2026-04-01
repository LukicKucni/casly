import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('[api/questions] handler reached');
  const { skill } = await request.json();
  const GROQ_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;
  console.log('[api/questions] key exists:', !!process.env.NEXT_PUBLIC_GROQ_API_KEY);

  const prompt = `Generate 3 conversational questions to understand someone's background before creating a personalized learning plan for "${skill}".

Return ONLY a JSON array with exactly 3 objects. Each object must have:
- "id": one of "level", "reason", or "time" (use each exactly once, in this order)
- "question": a warm, conversational question that feels specific to ${skill}, not generic
- "options": array of exactly 3 short answer options tailored to ${skill}

Example for "painting":
[
  {"id":"level","question":"Ok, painting. Have you ever picked up a brush before?","options":["Complete beginner","I've dabbled a bit","I paint but want to improve"]},
  {"id":"reason","question":"What's pulling you toward painting right now?","options":["Creative outlet","I want to sell my art","A friend inspired me"]},
  {"id":"time","question":"How much time can you realistically carve out for painting?","options":["30min/day","1h/day","Weekends only"]}
]

Make the questions feel natural and specific to ${skill}. Return ONLY the JSON array with no markdown fences or explanation.`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.8,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('[/api/questions] Groq returned', res.status, errText);
    return Response.json({ error: 'Groq API error' }, { status: 500 });
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? '';
  console.log('[/api/questions] raw content:', content);

  // Extract the JSON array even if the model wraps it in prose or fences
  const match = content.match(/\[[\s\S]*\]/);
  if (!match) {
    console.error('[/api/questions] no JSON array found in content');
    return Response.json({ error: 'No JSON array in response' }, { status: 500 });
  }

  try {
    const questions = JSON.parse(match[0]);
    console.log('[/api/questions] parsed:', JSON.stringify(questions));
    return Response.json({ questions });
  } catch {
    console.error('[/api/questions] failed to parse:', match[0]);
    return Response.json({ error: 'Invalid JSON from model' }, { status: 500 });
  }
}
