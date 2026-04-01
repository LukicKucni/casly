'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ManifestoPage() {
  useEffect(() => {
    const container = document.querySelector<HTMLElement>('.octo-container');
    const octo = document.querySelector<HTMLElement>('.octo');
    const tooltip = document.querySelector<HTMLElement>('.octo-tooltip');
    if (!container || !octo || !tooltip) return;

    const fullText = "I'm decorative. Leave me alone.";
    let typing: ReturnType<typeof setInterval> | null = null;
    let shakeInterval: ReturnType<typeof setInterval> | null = null;
    let shakeFrame = 0;

    function startShake() {
      octo!.style.transition = 'none';
      shakeFrame = 0;
      if (shakeInterval) clearInterval(shakeInterval);
      shakeInterval = setInterval(() => {
        if (!shakeInterval) return;
        const angle = Math.sin(shakeFrame * 1.8) * 10;
        const scale = 1 + Math.abs(Math.sin(shakeFrame * 1.8)) * 0.06;
        octo!.style.transform = `rotate(${angle}deg) scale(${scale})`;
        shakeFrame++;
      }, 38);
    }

    function stopShake() {
      if (shakeInterval) clearInterval(shakeInterval);
      shakeInterval = null;
      requestAnimationFrame(() => {
        octo!.style.transition = 'transform 0.35s ease';
        octo!.style.transform = 'rotate(0deg) scale(1)';
      });
    }

    function onMouseEnter() {
      tooltip!.style.opacity = '1';
      tooltip!.childNodes.forEach((n) => { if (n.nodeType === 3) n.remove(); });
      const textNode = document.createTextNode('');
      tooltip!.appendChild(textNode);
      let i = 0;
      startShake();
      typing = setInterval(() => {
        textNode.textContent = fullText.slice(0, i + 1);
        i++;
        if (i >= fullText.length) {
          if (typing) clearInterval(typing);
          stopShake();
        }
      }, 38);
    }

    function onMouseLeave() {
      if (typing) clearInterval(typing);
      stopShake();
      tooltip!.style.opacity = '0';
      setTimeout(() => {
        tooltip!.childNodes.forEach((n) => { if (n.nodeType === 3) n.remove(); });
      }, 200);
    }

    container.addEventListener('mouseenter', onMouseEnter);
    container.addEventListener('mouseleave', onMouseLeave);

    return () => {
      container.removeEventListener('mouseenter', onMouseEnter);
      container.removeEventListener('mouseleave', onMouseLeave);
      if (typing) clearInterval(typing);
      if (shakeInterval) clearInterval(shakeInterval);
    };
  }, []);

  return (
    <div className="manifesto-container">

      <div className="manifesto-top">
        <div className="octo-container">
          <span className="octo">🐙</span>
          <span className="octo-tooltip">I&apos;m decorative. Leave me alone.</span>
        </div>
        <span className="octo-label">Casly Manifesto</span>
        <Link href="/" className="back">← Back to Casly</Link>
      </div>

      <div className="manifesto-body">
        <p>The question isn&apos;t whether AI will change the world. It already is.</p>

        <p>The question is whether you&apos;ll be someone who understands that — or someone it happens to.</p>

        <p>Most people use AI as a shortcut. Type a request, get an answer, move on. That&apos;s fine. But there&apos;s another way — working with AI as a teammate. Sharing context, building understanding, asking the right questions. Once you grasp that, what you can achieve alone becomes hard to comprehend.</p>

        <em>Someone who knows how to work with AI doesn&apos;t just do their job faster — they think bigger, move quicker, and reach outcomes that simply weren&apos;t possible two years ago.</em>

        <p>Casly was built from that belief. One developer, one vision — that AI tools should be good enough to change the way you work, not just save you five minutes.</p>

        <p>Every tool we ship is a small experiment in that direction. The goal isn&apos;t to replace yourself — it&apos;s to become a version of yourself that can do more. Ideas that once required a team now require you and the right understanding.</p>

        <p><strong>That&apos;s the power we&apos;re building towards.</strong></p>
      </div>

      <div className="signature">
        <div className="signature-name">
          Lazar 🐙
          <span>Founder, Casly</span>
        </div>
      </div>

    </div>
  );
}
