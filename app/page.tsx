'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Page() {
  useEffect(() => {
    const GROQ_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    const MODEL = 'llama-3.1-8b-instant';
    const PROMPT =
      'You are Casly — a friendly, warm, and slightly playful voice of a small AI studio. You genuinely enjoy talking to people. Casly is founded by Lazar and builds AI tools that help people work alongside AI. First product coming: an AI skill learning companion. Tone: like a smart friend, never corporate, never dry. Never mention rules or constraints. Max 2 sentences. Always English unless asked otherwise.';

    // ── ORACLE ──
    const oracleInput = document.getElementById('oracleInput') as HTMLInputElement;
    const oracleDots = document.getElementById('oracleDots') as HTMLElement;
    const oracleResponse = document.getElementById('oracleResponse') as HTMLElement;
    const oracleWrap = document.getElementById('oracleWrap') as HTMLElement;
    let oracleBusy = false;
    let oracleCount = 0;

    function onOracleFocus() {
      oracleInput.placeholder = '';
    }
    function onOracleBlur() {
      if (!oracleInput.value) oracleInput.placeholder = 'ask me anything...';
    }
    function onOracleKeydown(e: KeyboardEvent) {
      if (e.key === 'Enter' && !oracleBusy) {
        const q = oracleInput.value.trim();
        if (!q) return;
        askOracle(q);
      }
      if (e.key === 'Escape') resetOracle();
    }

    oracleInput.addEventListener('focus', onOracleFocus);
    oracleInput.addEventListener('blur', onOracleBlur);
    oracleInput.addEventListener('keydown', onOracleKeydown as EventListener);

    async function askOracle(question: string) {
      oracleBusy = true;
      oracleInput.value = '';
      oracleInput.placeholder = '';
      oracleInput.classList.add('hidden');
      oracleResponse.classList.remove('visible');
      oracleResponse.textContent = '';
      oracleDots.classList.add('visible');
      try {
        await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_KEY },
          body: JSON.stringify({
            model: MODEL,
            messages: [{ role: 'system', content: PROMPT }, { role: 'user', content: question }],
            max_tokens: 60,
            temperature: 0.7,
          }),
        });
        const data = await res.json();
        const reply: string = data.choices[0].message.content;
        oracleDots.classList.remove('visible');
        oracleResponse.classList.add('visible');
        let i = 0;
        const iv = setInterval(() => {
          oracleResponse.textContent += reply[i];
          i++;
          if (i >= reply.length) {
            clearInterval(iv);
            oracleCount++;
            const wordCount = reply.trim().split(' ').length;
            const oracleDelay = wordCount < 10 ? 4000 : 6000;
            if (oracleCount >= 3) {
              setTimeout(() => showEasterEgg(), oracleDelay);
            } else {
              oracleBusy = false;
              setTimeout(resetOracle, oracleDelay);
            }
          }
        }, 24);
      } catch {
        oracleDots.classList.remove('visible');
        oracleResponse.textContent = 'Something went wrong.';
        oracleResponse.classList.add('visible');
        oracleBusy = false;
        setTimeout(resetOracle, 3000);
      }
    }

    function showEasterEgg() {
      const txt = oracleResponse.textContent ?? '';
      let j = txt.length;
      const eraseIv = setInterval(() => {
        j--;
        oracleResponse.textContent = txt.slice(0, j);
        if (j <= 0) {
          clearInterval(eraseIv);
          const egg = 'Stop wasting your time.';
          let k = 0;
          const eggIv = setInterval(() => {
            oracleResponse.textContent += egg[k];
            k++;
            if (k >= egg.length) {
              clearInterval(eggIv);
              setTimeout(() => {
                oracleResponse.style.transition = 'opacity 1s ease';
                oracleResponse.style.opacity = '0';
                setTimeout(() => {
                  oracleWrap.style.transition = 'opacity 1s ease';
                  oracleWrap.style.opacity = '0';
                  setTimeout(() => {
                    oracleWrap.style.visibility = 'hidden';
                  }, 1000);
                }, 500);
              }, 3000);
            }
          }, 38);
        }
      }, 18);
    }

    function resetOracle() {
      const txt = oracleResponse.textContent ?? '';
      if (!txt) {
        oracleInput.classList.remove('hidden');
        oracleInput.placeholder = 'ask me anything...';
        oracleResponse.classList.remove('visible');
        oracleDots.classList.remove('visible');
        oracleBusy = false;
        return;
      }
      let j = txt.length;
      const eraseIv = setInterval(() => {
        j--;
        oracleResponse.textContent = txt.slice(0, j);
        if (j <= 0) {
          clearInterval(eraseIv);
          oracleResponse.classList.remove('visible');
          oracleResponse.textContent = '';
          oracleInput.classList.remove('hidden');
          oracleInput.placeholder = 'ask me anything...';
          oracleDots.classList.remove('visible');
          oracleBusy = false;
        }
      }, 38);
    }

    // ── CHAT WIDGET ──
    const chatBtn = document.getElementById('chatBtn') as HTMLButtonElement;
    const chatWindow = document.getElementById('chatWindow') as HTMLElement;
    const chatMsgs = document.getElementById('chatMessages') as HTMLElement;
    const chatInput = document.getElementById('chatInput') as HTMLInputElement;
    const chatSend = document.getElementById('chatSend') as HTMLButtonElement;
    const chatHistory: { role: string; content: string }[] = [];

    function onChatBtnClick(e: Event) {
      e.stopPropagation();
      const isOpen = chatWindow.classList.toggle('open');
      chatBtn.classList.toggle('open', isOpen);
      if (isOpen) chatInput.focus();
    }
    function onChatWindowClick(e: Event) {
      e.stopPropagation();
    }
    function onDocClick() {
      chatWindow.classList.remove('open');
      chatBtn.classList.remove('open');
    }
    function onChatInputKeydown(e: KeyboardEvent) {
      if (e.key === 'Enter') { e.preventDefault(); sendChatMsg(); }
    }

    chatBtn.addEventListener('click', onChatBtnClick);
    chatWindow.addEventListener('click', onChatWindowClick);
    document.addEventListener('click', onDocClick);
    chatInput.addEventListener('keydown', onChatInputKeydown as EventListener);
    chatSend.addEventListener('click', sendChatMsg);

    function addChatMsg(text: string, role: string): HTMLElement {
      const div = document.createElement('div');
      div.className = 'msg ' + (role === 'user' ? 'msg-user' : 'msg-bot');
      div.textContent = text;
      chatMsgs.appendChild(div);
      chatMsgs.scrollTop = chatMsgs.scrollHeight;
      return div;
    }

    function addTyping(): HTMLElement {
      const div = document.createElement('div');
      div.className = 'msg msg-bot msg-typing';
      div.innerHTML = '<span></span><span></span><span></span>';
      chatMsgs.appendChild(div);
      chatMsgs.scrollTop = chatMsgs.scrollHeight;
      return div;
    }

    async function sendChatMsg() {
      const text = chatInput.value.trim();
      if (!text) return;
      chatInput.value = '';
      chatSend.disabled = true;
      addChatMsg(text, 'user');
      chatHistory.push({ role: 'user', content: text });
      const typing = addTyping();
      try {
        await new Promise((r) => setTimeout(r, 600 + Math.random() * 600));
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_KEY },
          body: JSON.stringify({
            model: MODEL,
            messages: [{ role: 'system', content: PROMPT }, ...chatHistory],
            max_tokens: 150,
            temperature: 0.7,
          }),
        });
        const data = await res.json();
        const reply: string = data.choices[0].message.content;
        chatHistory.push({ role: 'assistant', content: reply });
        typing.remove();
        const msgDiv = addChatMsg('', 'bot');
        let i = 0;
        const iv = setInterval(() => {
          msgDiv.textContent += reply[i];
          i++;
          chatMsgs.scrollTop = chatMsgs.scrollHeight;
          if (i >= reply.length) clearInterval(iv);
        }, 22);
      } catch {
        typing.remove();
        addChatMsg('Something went wrong. Try again!', 'bot');
      }
      chatSend.disabled = false;
      chatInput.focus();
    }

    // ── Scroll animation for project cards ──
    const cards = document.querySelectorAll<HTMLElement>('.project-card');
    const cardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.opacity = '1';
            (entry.target as HTMLElement).style.transform = 'translateY(0)';
            cardObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );

    cards.forEach((card) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(18px)';
      card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      cardObserver.observe(card);
    });

    return () => {
      oracleInput.removeEventListener('focus', onOracleFocus);
      oracleInput.removeEventListener('blur', onOracleBlur);
      oracleInput.removeEventListener('keydown', onOracleKeydown as EventListener);
      chatBtn.removeEventListener('click', onChatBtnClick);
      chatWindow.removeEventListener('click', onChatWindowClick);
      document.removeEventListener('click', onDocClick);
      chatInput.removeEventListener('keydown', onChatInputKeydown as EventListener);
      chatSend.removeEventListener('click', sendChatMsg);
      cardObserver.disconnect();
    };
  }, []);

  return (
    <>
      <div className="page-gradient" />

      <div className="container">

        <section className="hero">
          <div className="hero-title">
            <h1>Casly</h1>
            <span className="lobster-icon">🐙</span>
          </div>
          <p className="hero-tagline">
            Where humans and AI <span className="accent">build together</span>
          </p>
          <p className="hero-desc">
            Built for the ones who see AI as a partner, not a shortcut.
          </p>
        </section>

        <section className="section">
          <h2 className="section-title">Who We Are</h2>
          <div className="section-body">
            <p>Casly started with one person, one question, and too much time spent frustrated with tools that promised everything and delivered noise. That frustration became a studio. Now we build the things we always wanted to use.</p>
            <p>The future belongs to those who work <strong>alongside</strong> AI, not those who simply use it as a tool. Every product we ship is a small step in that direction.</p>
            <p>This is just the beginning.</p>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Our Values</h2>
          <div className="values-grid">
            <div className="value-card">
              <span className="value-icon">⚡</span>
              <div className="value-name">Simple by design</div>
              <div className="value-desc">If it&apos;s complicated, we haven&apos;t finished building it yet.</div>
            </div>
            <div className="value-card">
              <span className="value-icon">🎯</span>
              <div className="value-name">Real problems only</div>
              <div className="value-desc">We build things people actually need, not things that look impressive in a demo.</div>
            </div>
            <div className="value-card">
              <span className="value-icon">🤝</span>
              <div className="value-name">Partnership over tools</div>
              <div className="value-desc">AI that collaborates with you, not just executes for you. The best results come from working together.</div>
            </div>
            <div className="value-card">
              <span className="value-icon">🌱</span>
              <div className="value-name">Build in public</div>
              <div className="value-desc">We share what we learn, what fails, and what works.</div>
            </div>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Projects</h2>
          <div className="projects-grid">
            <Link href="/learn" className="project-card" style={{ display: 'block', textDecoration: 'none' }}>
              <div className="project-top">
                <span className="project-icon">🧠</span>
                <span className="project-tag">Try it →</span>
              </div>
              <div className="project-name">AI Skill Companion</div>
              <div className="project-desc">Learn any skill with a personalized roadmap, curated resources, and calendar integration. From React to gardening.</div>
            </Link>
            <div className="project-card project-card-center">
              <span style={{ fontSize: '32px' }}>➕</span>
              <div className="project-name" style={{ textAlign: 'center' }}>More coming</div>
              <div className="project-desc" style={{ textAlign: 'center' }}>We&apos;re always building something new.</div>
            </div>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Why Casly</h2>
          <div className="section-body">
            <p>The name comes from a simple idea — tools should feel like a companion, not a machine. Casly exists because we got tired of AI that&apos;s powerful but cold, complex but empty.</p>
            <p>We believe AI shouldn&apos;t just execute tasks. When humans and AI work <strong>together</strong> — sharing context, building trust, thinking in parallel — the result is something neither could achieve alone. That&apos;s not a feature. That&apos;s the future.</p>
            <p>Every tool we build is a small experiment in that direction. <strong>Something with a soul.</strong></p>
          </div>
        </section>

        <div
          className="oracle-wrap"
          id="oracleWrap"
          style={{ margin: '0 auto 80px', maxWidth: '560px', textAlign: 'center' }}
        >
          <input
            className="oracle-input"
            id="oracleInput"
            type="text"
            autoComplete="off"
            placeholder="ask me anything..."
          />
          <div className="oracle-dots" id="oracleDots">
            <span /><span /><span />
          </div>
          <div className="oracle-response" id="oracleResponse" />
        </div>

        <div className="learn-more">
          <h2 className="learn-more-title">
            Learn <span>More</span>
          </h2>
          <div className="links-row">
            <Link href="/manifesto" className="link-btn link-btn-primary">
              Read our Manifesto →
            </Link>
            <a href="https://llukic.dev" className="link-btn link-btn-outline">
              Meet the founder
            </a>
            <a href="https://github.com/LukicKucni" className="link-btn link-btn-outline">
              GitHub
            </a>
          </div>
        </div>

      </div>

      <footer>
        <div className="container">
          © 2026 Casly &nbsp;·&nbsp; Founded by Lazar 🐙 &nbsp;·&nbsp;{' '}
          <a href="mailto:lukiclazar.dev@gmail.com">lukiclazar.dev@gmail.com</a>
          &nbsp;·&nbsp;{' '}
          <a href="https://github.com/LukicKucni">GitHub</a>
        </div>
      </footer>

      <button className="chat-btn" id="chatBtn" title="Chat with Casly">
        🐙
      </button>

      <div className="chat-window" id="chatWindow">
        <div className="chat-header">
          <span className="chat-header-icon">🐙</span>
          <div className="chat-header-info">
            <div className="chat-header-name">Casly</div>
            <div className="chat-header-status">Online</div>
          </div>
        </div>
        <div className="chat-messages" id="chatMessages">
          <div className="msg msg-bot">
            Hey! 👋 I&apos;m happy to chat — ask me anything about Casly or what we&apos;re building.
          </div>
        </div>
        <div className="chat-input-row">
          <input
            className="chat-input"
            id="chatInput"
            placeholder="Ask something..."
            autoComplete="off"
          />
          <button className="chat-send" id="chatSend">
            ➤
          </button>
        </div>
      </div>
    </>
  );
}
