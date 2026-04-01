'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Step = 'input' | 'questions' | 'loading' | 'results';

interface RoadmapPhase {
  phase: string;
  title: string;
  duration: string;
  topics: string[];
}

interface WeekDay {
  day: string;
  task: string;
  duration: string;
  type: string;
}

interface LearningPlan {
  advice?: string;
  roadmap: RoadmapPhase[];
  weeklyPlan: WeekDay[];
  communityResources: unknown[];
}

interface YoutubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  url: string;
}

interface RedditPost {
  title: string;
  author: string;
  subreddit: string;
  url: string;
  preview: string;
}

const TYPE_COLORS: Record<string, string> = {
  learn:    'rgba(245,164,74,0.14)',
  practice: 'rgba(180,124,247,0.14)',
  review:   'rgba(80,200,120,0.14)',
};
const TYPE_TEXT: Record<string, string> = {
  learn:    '#F5A44A',
  practice: '#B47CF7',
  review:   '#50C878',
};

const LOADING_MESSAGES = [
  'Analyzing your background...',
  'Collecting the best resources...',
  'Building your roadmap...',
  'Planning your weekly schedule...',
  'Finding community insights...',
  'Putting it all together...',
];

const DAY_NAMES  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const LEVEL_OPTS = ['Beginner', 'Some experience', 'Intermediate'];
const HOUR_OPTS  = ['30 min', '1 hour', '2 hours'];

const SUGGESTIONS = [
  { emoji: '⚡', text: 'Learn React from scratch in 30 days', skill: 'React' },
  { emoji: '🎸', text: 'Start playing guitar as a complete beginner', skill: 'Guitar' },
  { emoji: '📷', text: 'Master photography composition', skill: 'Photography' },
  { emoji: '🌍', text: 'Learn Spanish for travel in 3 months', skill: 'Spanish' },
];

function ResultsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '64px' }}>
      <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--cream)', letterSpacing: '-0.02em', marginBottom: '22px' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function LearnPage() {
  const [step, setStep]               = useState<Step>('input');
  const [visible, setVisible]         = useState(true);
  const [skill, setSkill]             = useState('');
  const [level, setLevel]             = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [sessionHours, setSessionHours] = useState('');
  const [time, setTime]               = useState('');
  const [plan, setPlan]               = useState<LearningPlan | null>(null);
  const [videos, setVideos]           = useState<YoutubeVideo[]>([]);
  const [redditPosts, setRedditPosts] = useState<RedditPost[]>([]);
  const [error, setError]             = useState('');
  const [loadingMsgIdx, setLoadingMsgIdx]         = useState(0);
  const [loadingMsgVisible, setLoadingMsgVisible] = useState(true);
  const [progress, setProgress]                   = useState(0);

  // Derive time string whenever calendar selection changes
  useEffect(() => {
    if (selectedDays.length > 0 && sessionHours) {
      const days = [...selectedDays].sort().map(i => DAY_NAMES[i]).join(', ');
      setTime(`${days} · ${sessionHours}`);
    } else {
      setTime('');
    }
  }, [selectedDays, sessionHours]);

  // Cycle loading messages with fade
  useEffect(() => {
    if (step !== 'loading') {
      setLoadingMsgIdx(0);
      setLoadingMsgVisible(true);
      return;
    }
    const interval = setInterval(() => {
      setLoadingMsgVisible(false);
      setTimeout(() => {
        setLoadingMsgIdx(i => (i + 1) % LOADING_MESSAGES.length);
        setLoadingMsgVisible(true);
      }, 400);
    }, 2000);
    return () => clearInterval(interval);
  }, [step]);

  // Progress bar: 0 → 100 over 10 seconds (1 per 100ms)
  useEffect(() => {
    if (step !== 'loading') {
      setProgress(0);
      return;
    }
    setProgress(0);
    const id = setInterval(() => {
      setProgress(p => Math.min(p + 1, 100));
    }, 100);
    return () => clearInterval(id);
  }, [step]);


  function transition(next: Step) {
    setVisible(false);
    setTimeout(() => { setStep(next); setVisible(true); }, 340);
  }

  function toggleDay(i: number) {
    setSelectedDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i]);
  }

  function handleStart() {
    setSelectedDays([]);
    setSessionHours('');
    setLevel('');
    transition('questions');
  }

  async function handleBuildPlan() {
    setError('');
    transition('loading');
    try {
      const [planRes, ytRes, redditRes] = await Promise.all([
        fetch('/api/learn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skill, level, reason: '', time }),
        }),
        fetch('/api/youtube', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: `learn ${skill}` }),
        }),
        fetch('/api/reddit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skill }),
        }),
        // Minimum 10-second loading time
        new Promise<void>((r) => setTimeout(r, 10000)),
      ]);

      if (!planRes.ok) throw new Error('API error');
      const data = await planRes.json();
      if (data.error) throw new Error(data.error);
      setPlan(data);

      if (ytRes.ok) {
        const ytData = await ytRes.json();
        if (Array.isArray(ytData.videos)) setVideos(ytData.videos);
      }
      if (redditRes.ok) {
        const rdData = await redditRes.json();
        if (Array.isArray(rdData.posts)) setRedditPosts(rdData.posts);
      }

      transition('results');
    } catch {
      setError('Something went wrong. Please try again.');
      transition('questions');
    }
  }

  const canBuild = !!(level && time);

  // ─── Backgrounds (shared across all steps) ─────────────────────────────────
  const bgLayers = (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'conic-gradient(from 220deg at 0% 0%, rgba(245,164,74,0.06) 0deg, transparent 60deg)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: '-80px', right: '-80px', width: '480px', height: '480px', background: 'radial-gradient(circle, rgba(245,164,74,0.08) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-100px', right: '-60px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(180,124,247,0.09) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
    </>
  );

  // ─── Loading screen (full-page, centered) ──────────────────────────────────
  if (step === 'loading') {
    return (
      <>
        {bgLayers}
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 40px', position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--orange)', marginBottom: '28px', opacity: 0.85 }}>
            Building your {skill} plan
          </p>
          <p style={{
            fontSize: '22px',
            fontWeight: 500,
            color: 'var(--cream)',
            letterSpacing: '-0.01em',
            marginBottom: '36px',
            maxWidth: '480px',
            lineHeight: 1.4,
            opacity: loadingMsgVisible ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}>
            {LOADING_MESSAGES[loadingMsgIdx]}
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', marginBottom: '28px' }}>
            <span className="learn-dot" style={{ background: 'var(--orange)' }} />
            <span className="learn-dot" style={{ background: 'var(--orange)', animationDelay: '0.2s' }} />
            <span className="learn-dot" style={{ background: 'var(--orange)', animationDelay: '0.4s' }} />
          </div>
          <div style={{ width: '320px', height: '10px', background: 'rgba(240,232,216,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #E8621A, #F5A44A)',
              transition: 'width 0.1s linear',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '999px',
            }}>
              {/* Liquid wave overlay */}
              <div className="learn-wave-inner" style={{ position: 'absolute', top: 0, left: 0, width: '200%', height: '100%', display: 'flex' }}>
                <svg viewBox="0 0 200 10" preserveAspectRatio="none" style={{ flex: '0 0 50%', height: '100%' }}>
                  <path d="M0,4 C25,0 25,8 50,4 C75,0 75,8 100,4 C125,0 125,8 150,4 C175,0 175,8 200,4 L200,10 L0,10 Z" fill="rgba(255,255,255,0.2)" />
                </svg>
                <svg viewBox="0 0 200 10" preserveAspectRatio="none" style={{ flex: '0 0 50%', height: '100%' }}>
                  <path d="M0,4 C25,0 25,8 50,4 C75,0 75,8 100,4 C125,0 125,8 150,4 C175,0 175,8 200,4 L200,10 L0,10 Z" fill="rgba(255,255,255,0.2)" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {bgLayers}

      {/* Centered container — narrower for steps 1/2, wider for results */}
      <div style={{
        maxWidth: step === 'results' ? '900px' : '640px',
        margin: '0 auto',
        padding: '0 40px',
        position: 'relative',
        zIndex: 1,
      }}>

        <div style={{ paddingTop: '56px' }}>
          <Link href="/" className="back">← Back</Link>
        </div>

        {/* ── Step 1: Input ── */}
        {step === 'input' && (
          <div className={`learn-step${visible ? ' visible' : ''}`}>
            <div style={{ paddingTop: '80px', paddingBottom: '100px', textAlign: 'center' }}>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
                <span style={{ width: '6px', height: '6px', background: 'var(--orange)', borderRadius: '50%', display: 'inline-block' }} />
                <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--orange)' }}>
                  Skill Companion
                </span>
              </div>

              <h1 style={{ fontSize: 'clamp(36px, 6.5vw, 52px)', fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 1.1, color: 'var(--cream)', marginBottom: '18px' }}>
                What will you learn{' '}
                <span style={{ color: '#F5A44A' }}>today?</span>
              </h1>

              <p style={{ fontSize: '17px', fontWeight: 300, color: '#787060', lineHeight: 1.7, maxWidth: '480px', margin: '0 auto 48px' }}>
                Type a skill — get a personalized roadmap, curated videos,<br />and a week-by-week plan.
              </p>

              <div className="learn-search-wrap" style={{ marginBottom: '32px' }}>
                <input
                  className="learn-input-field"
                  type="text"
                  placeholder="e.g. React, guitar, photography..."
                  value={skill}
                  onChange={(e) => setSkill(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && skill.trim()) handleStart(); }}
                  autoFocus
                />
                <button className="learn-search-btn" disabled={!skill.trim()} onClick={() => { if (skill.trim()) handleStart(); }}>
                  Start learning →
                </button>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--cream-dark)', marginBottom: '14px', fontWeight: 400 }}>
                Not sure? Try one of these
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'left' }}>
                {SUGGESTIONS.map((s) => (
                  <button key={s.skill} type="button" className="learn-suggest-card" onClick={() => setSkill(s.skill)}>
                    <span style={{ marginRight: '8px' }}>{s.emoji}</span>{s.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Questions ── */}
        {step === 'questions' && (
          <div className={`learn-step${visible ? ' visible' : ''}`}>
            <div style={{ paddingTop: '64px', paddingBottom: '80px' }}>

              {/* Skill tag */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(245,164,74,0.07)', border: '1px solid rgba(245,164,74,0.2)', borderRadius: '999px', padding: '6px 14px 6px 16px', marginBottom: '40px' }}>
                <span style={{ fontSize: '11px', color: 'var(--orange)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Learning</span>
                <span style={{ color: 'rgba(240,232,216,0.2)', fontSize: '11px' }}>·</span>
                <span style={{ fontSize: '14px', color: 'var(--cream)', fontWeight: 700 }}>{skill}</span>
                <button type="button" onClick={() => transition('input')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cream-dark)', fontSize: '12px', padding: '0 0 0 4px', lineHeight: 1, display: 'flex', alignItems: 'center' }}>✕</button>
              </div>

              <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--cream)', marginBottom: '40px' }}>
                A few quick questions
              </h2>

              {/* ── Calendar (time) ── */}
              <div style={{ marginBottom: '44px' }}>
                <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--cream-dim)', marginBottom: '18px', letterSpacing: '-0.01em' }}>
                  Which days will you practice?
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '16px' }}>
                  {DAY_NAMES.map((name, i) => {
                    const isSel = selectedDays.includes(i);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleDay(i)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: '12px 4px', borderRadius: '10px', cursor: 'pointer',
                          border: isSel ? '1px solid var(--orange)' : '1px solid var(--border)',
                          background: isSel ? 'rgba(245,164,74,0.14)' : 'transparent',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: isSel ? 'var(--orange)' : 'var(--cream-dark)' }}>
                          {name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {HOUR_OPTS.map((h) => (
                    <button key={h} type="button" className={`learn-option${sessionHours === h ? ' selected' : ''}`} onClick={() => setSessionHours(h)}>
                      {h} / session
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Level ── */}
              <div style={{ marginBottom: '56px' }}>
                <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--cream-dim)', marginBottom: '16px', letterSpacing: '-0.01em' }}>
                  What&apos;s your experience level?
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {LEVEL_OPTS.map((opt) => (
                    <button key={opt} type="button" className={`learn-option${level === opt ? ' selected' : ''}`} onClick={() => setLevel(opt)}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p style={{ color: '#D42B10', fontSize: '14px', marginBottom: '20px' }}>{error}</p>}

              <Link
                href="#"
                onClick={(e) => { e.preventDefault(); if (canBuild) handleBuildPlan(); }}
                className="link-btn link-btn-primary"
                style={{ pointerEvents: canBuild ? 'auto' : 'none', opacity: canBuild ? 1 : 0.35 }}
              >
                Build my plan →
              </Link>
            </div>
          </div>
        )}

        {/* ── Step 3: Results ── */}
        {step === 'results' && plan && (
          <div className={`learn-step${visible ? ' visible' : ''}`}>
            <div style={{ paddingTop: '64px', paddingBottom: '110px' }}>

              {/* Header */}
              <div style={{ marginBottom: '60px' }}>
                <p style={{ fontSize: '12px', color: 'var(--cream-dark)', opacity: 0.5, marginBottom: '12px', letterSpacing: '0.01em' }}>
                  Your {skill} plan · {level} · {time}
                </p>
                <h1 style={{ fontSize: 'clamp(30px, 5.5vw, 48px)', fontWeight: 900, letterSpacing: '-0.035em', color: 'var(--cream)', lineHeight: 1.12 }}>
                  Your <span style={{ color: 'var(--orange)' }}>{skill}</span> plan
                </h1>
              </div>

              {/* Casly advice */}
              {plan.advice && (
                <div style={{
                  background: '#191710',
                  border: '1px solid var(--border)',
                  borderLeft: '2px solid rgba(245,164,74,0.4)',
                  borderRadius: '12px',
                  padding: '20px 24px',
                  marginBottom: '48px',
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--orange)', display: 'block', marginBottom: '12px' }}>
                    From Casly
                  </span>
                  <p style={{ fontSize: '16px', color: 'var(--cream)', lineHeight: 1.7, margin: 0 }}>
                    {plan.advice}
                  </p>
                </div>
              )}

              {/* Roadmap */}
              <ResultsSection title="🗺️ Personalized Roadmap">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {plan.roadmap.map((phase, i) => (
                    <div key={i} style={{ background: '#131210', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 22px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--orange)', display: 'block', marginBottom: '7px' }}>
                        {phase.phase}
                      </span>
                      <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--cream)', letterSpacing: '-0.01em', marginBottom: '14px' }}>
                        {phase.title}
                      </div>
                      <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                        {phase.topics.map((topic, j) => (
                          <span key={j} style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '999px', background: 'rgba(240,232,216,0.04)', color: 'var(--cream-dark)', border: '1px solid var(--border)' }}>
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ResultsSection>

              {/* YouTube */}
              {videos.length > 0 && (
                <ResultsSection title="▶️ YouTube Videos">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                    {videos.map((vid) => (
                      <a key={vid.id} href={vid.url} target="_blank" rel="noopener noreferrer" className="learn-yt-card" style={{ textDecoration: 'none' }}>
                        <div style={{ position: 'relative' }}>
                          <img src={vid.thumbnail} alt={vid.title} style={{ width: '100%', display: 'block', borderRadius: '8px 8px 0 0' }} />
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px 8px 0 0', background: 'rgba(0,0,0,0.18)' }}>
                            <div style={{ width: '38px', height: '38px', background: 'rgba(255,255,255,0.92)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', paddingLeft: '3px' }}>▶</div>
                          </div>
                        </div>
                        <div style={{ padding: '12px 13px 14px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cream)', lineHeight: 1.4, marginBottom: '5px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {vid.title}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--cream-dark)', opacity: 0.6 }}>{vid.channelTitle}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </ResultsSection>
              )}

              {/* Weekly Plan */}
              <ResultsSection title="📅 Week 1 Plan">
                <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', background: '#131210' }}>
                  {plan.weeklyPlan.map((day, i) => {
                    const bg = TYPE_COLORS[day.type] ?? 'rgba(240,232,216,0.06)';
                    const fg = TYPE_TEXT[day.type]  ?? 'var(--cream-dim)';
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 20px', borderBottom: i < plan.weeklyPlan.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--orange)', minWidth: '28px', flexShrink: 0 }}>
                          {day.day.slice(0, 3)}
                        </span>
                        <span style={{ fontSize: '13.5px', color: 'var(--cream)', fontWeight: 500, flex: 1, lineHeight: 1.4 }}>
                          {day.task}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--cream-dark)', opacity: 0.5, flexShrink: 0 }}>
                          {day.duration}
                        </span>
                        {day.type && (
                          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: bg, color: fg, fontWeight: 600, flexShrink: 0 }}>
                            {day.type}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ResultsSection>

              {/* Reddit */}
              {redditPosts.length > 0 && (
                <ResultsSection title="🔺 From the Community">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    {redditPosts.map((post, i) => (
                      <a
                        key={i}
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', background: '#131210', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 18px', transition: 'border-color 0.15s ease' }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(245,164,74,0.3)')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                      >
                        <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--orange)', marginBottom: '8px', opacity: 0.85 }}>
                          {post.subreddit || 'reddit'}
                        </div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--cream)', lineHeight: 1.4, marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {post.title}
                        </div>
                        {post.preview && (
                          <p style={{ fontSize: '12px', color: 'var(--cream-dark)', opacity: 0.55, lineHeight: 1.5, margin: '0 0 12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {post.preview}
                          </p>
                        )}
                        <div style={{ fontSize: '11px', color: 'var(--cream-dark)', opacity: 0.35, marginTop: 'auto' }}>
                          u/{post.author}
                        </div>
                      </a>
                    ))}
                  </div>
                </ResultsSection>
              )}

              {/* Actions */}
              <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  className="link-btn link-btn-primary"
                  onClick={() => {
                    setSkill(''); setLevel(''); setTime('');
                    setSelectedDays([]); setSessionHours('');
                    setPlan(null); setVideos([]); setRedditPosts([]); setError('');
                    transition('input');
                  }}
                >
                  Start over
                </button>
                <Link href="/" className="link-btn link-btn-outline">Back to Casly →</Link>
              </div>
            </div>
          </div>
        )}

      </div>

      <footer>
        <div className="container">
          © 2026 Casly &nbsp;·&nbsp; Founded by Lazar 🐙
        </div>
      </footer>
    </>
  );
}
