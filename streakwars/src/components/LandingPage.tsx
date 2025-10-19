"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

export default function LandingPage() {
  const navbarRef = useRef<HTMLElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const wordBadRef = useRef<HTMLSpanElement>(null);
  const wordGoodRef = useRef<HTMLSpanElement>(null);
  const phone1Ref = useRef<HTMLDivElement>(null);
  const phone2Ref = useRef<HTMLDivElement>(null);
  const phone3Ref = useRef<HTMLDivElement>(null);
  const caption1Ref = useRef<HTMLParagraphElement>(null);
  const caption2Ref = useRef<HTMLParagraphElement>(null);
  const caption3Ref = useRef<HTMLParagraphElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const finalCTARef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;

    function updateScrollEffects() {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // Calculate scroll progress (0 to 1 over 500vh)
      const scrollProgress = Math.min(scrollY / (windowHeight * 5), 1);
      
      // Navbar floating effect
      if (navbarRef.current) {
        if (scrollProgress > 0.05) {
          navbarRef.current.classList.add('floating');
        } else {
          navbarRef.current.classList.remove('floating');
        }
      }

      // Phase 1: Dissolve "bad habits?" (0.05 to 0.12)
      if (wordBadRef.current) {
        if (scrollProgress <= 0.12) {
          const dissolveProgress = scrollProgress / 0.12;
          wordBadRef.current.style.opacity = Math.max(1 - dissolveProgress * 1.5, 0).toString();
        } else {
          wordBadRef.current.style.opacity = '0';
        }
      }

      // Phase 2: Phone 1 appears (0.16 to 0.32)
      if (phone1Ref.current && caption1Ref.current) {
        if (scrollProgress > 0.16 && scrollProgress <= 0.36) {
          const phone1Progress = Math.min((scrollProgress - 0.16) / 0.12, 1);
          const scale = 0.3 + (phone1Progress * 0.7);
          const opacity = phone1Progress;
          
          phone1Ref.current.style.transform = `scale(${scale})`;
          phone1Ref.current.style.opacity = opacity.toString();
          caption1Ref.current.style.opacity = phone1Progress.toString();
          caption1Ref.current.style.transform = 'translateY(0)';
        } else if (scrollProgress > 0.36) {
          const fadeOut = Math.min((scrollProgress - 0.36) / 0.06, 1);
          phone1Ref.current.style.opacity = Math.max(1 - fadeOut, 0).toString();
          phone1Ref.current.style.transform = 'scale(1)';
          caption1Ref.current.style.opacity = Math.max(1 - fadeOut, 0).toString();
        } else {
          phone1Ref.current.style.transform = 'scale(0.3)';
          phone1Ref.current.style.opacity = '0';
          caption1Ref.current.style.opacity = '0';
        }
      }

      // Phase 3: Phone 2 appears (0.36 to 0.52)
      if (phone2Ref.current && caption2Ref.current) {
        if (scrollProgress > 0.36 && scrollProgress <= 0.56) {
          const phone2Progress = Math.min((scrollProgress - 0.36) / 0.12, 1);
          const scale = 0.3 + (phone2Progress * 0.7);
          const opacity = phone2Progress;
          
          phone2Ref.current.style.transform = `scale(${scale})`;
          phone2Ref.current.style.opacity = opacity.toString();
          caption2Ref.current.style.opacity = phone2Progress.toString();
          caption2Ref.current.style.transform = 'translateY(0)';
        } else if (scrollProgress > 0.56) {
          const fadeOut = Math.min((scrollProgress - 0.56) / 0.06, 1);
          phone2Ref.current.style.opacity = Math.max(1 - fadeOut, 0).toString();
          phone2Ref.current.style.transform = 'scale(1)';
          caption2Ref.current.style.opacity = Math.max(1 - fadeOut, 0).toString();
        } else {
          phone2Ref.current.style.transform = 'scale(0.3)';
          phone2Ref.current.style.opacity = '0';
          caption2Ref.current.style.opacity = '0';
        }
      }

      // Phase 4: Phone 3 appears (0.56 to 0.7)
      if (phone3Ref.current && caption3Ref.current) {
        if (scrollProgress > 0.56 && scrollProgress <= 0.7) {
          const phone3Progress = Math.min((scrollProgress - 0.56) / 0.12, 1);
          const scale = 0.3 + (phone3Progress * 0.7);
          const opacity = phone3Progress;
          
          phone3Ref.current.style.transform = `scale(${scale})`;
          phone3Ref.current.style.opacity = opacity.toString();
          caption3Ref.current.style.opacity = phone3Progress.toString();
          caption3Ref.current.style.transform = 'translateY(0)';
        } else if (scrollProgress > 0.7) {
          const fadeOut = Math.min((scrollProgress - 0.7) / 0.06, 1);
          phone3Ref.current.style.opacity = Math.max(1 - fadeOut, 0).toString();
          phone3Ref.current.style.transform = 'scale(1)';
          caption3Ref.current.style.opacity = Math.max(1 - fadeOut, 0).toString();
        } else {
          phone3Ref.current.style.transform = 'scale(0.3)';
          phone3Ref.current.style.opacity = '0';
          caption3Ref.current.style.opacity = '0';
        }
      }

      // Phase 5: Dissolve in "good habits." (0.72 to 0.78)
      if (wordGoodRef.current) {
        if (scrollProgress > 0.72 && scrollProgress <= 0.78) {
          const goodProgress = Math.min((scrollProgress - 0.72) / 0.06, 1);
          wordGoodRef.current.style.opacity = goodProgress.toString();
        } else if (scrollProgress > 0.78 && scrollProgress <= 0.84) {
          // Hold "good habits" briefly
          wordGoodRef.current.style.opacity = '1';
        } else if (scrollProgress > 0.84) {
          // Fade out good habits when video comes
          const fadeOut = Math.min((scrollProgress - 0.84) / 0.04, 1);
          wordGoodRef.current.style.opacity = Math.max(1 - fadeOut, 0).toString();
        } else {
          wordGoodRef.current.style.opacity = '0';
        }
      }

      // Phase 6: Video appears (0.84 to 0.92)
      if (videoContainerRef.current) {
        if (scrollProgress > 0.84 && scrollProgress <= 0.92) {
          const videoProgress = Math.min((scrollProgress - 0.84) / 0.08, 1);
          const scale = 0.8 + (videoProgress * 0.2);
          videoContainerRef.current.style.transform = `scale(${scale})`;
          videoContainerRef.current.style.opacity = videoProgress.toString();
        } else if (scrollProgress > 0.92 && scrollProgress <= 0.94) {
          // Hold video briefly
          videoContainerRef.current.style.transform = 'scale(1)';
          videoContainerRef.current.style.opacity = '1';
        } else if (scrollProgress > 0.94) {
          // Fade out video when final CTA comes
          const fadeOut = Math.min((scrollProgress - 0.94) / 0.03, 1);
          videoContainerRef.current.style.opacity = Math.max(1 - fadeOut, 0).toString();
        } else {
          videoContainerRef.current.style.transform = 'scale(0.8)';
          videoContainerRef.current.style.opacity = '0';
        }
      }

      // Phase 7: Final CTA appears (0.94 to 1.0)
      if (finalCTARef.current) {
        if (scrollProgress > 0.94) {
          const ctaProgress = Math.min((scrollProgress - 0.94) / 0.06, 1);
          finalCTARef.current.style.opacity = ctaProgress.toString();
          finalCTARef.current.style.transform = `translateY(${20 - (ctaProgress * 20)}px)`;
        } else {
          finalCTARef.current.style.opacity = '0';
          finalCTARef.current.style.transform = 'translateY(20px)';
        }
      }

      ticking = false;
    }

    function requestTick() {
      if (!ticking) {
        requestAnimationFrame(updateScrollEffects);
        ticking = true;
      }
    }

    window.addEventListener('scroll', requestTick);
    updateScrollEffects(); // Initial call

    return () => {
      window.removeEventListener('scroll', requestTick);
    };
  }, []);

  return (
    <>
      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .landing-page {
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif;
          background: white;
          color: #1a1a1a;
          overflow-x: hidden;
        }

        /* Extremely subtle grid background */
        .grid-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            linear-gradient(rgba(0, 0, 0, 0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 0, 0, 0.015) 1px, transparent 1px);
          background-size: 20px 20px;
          pointer-events: none;
          z-index: 0;
        }

        /* Navbar */
        nav {
          position: fixed;
          top: 2rem;
          left: 4rem;
          right: 4rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 1000;
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        nav.floating {
          left: 50%;
          right: auto;
          transform: translateX(-50%);
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(30px);
          padding: 0.75rem 1.5rem;
          border-radius: 50px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(0, 0, 0, 0.04);
          gap: 2rem;
        }

        .logo {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.5px;
          color: #1a1a1a;
        }

        .logo .uate {
          color: #888;
        }

        .cta-button {
          padding: 0.875rem 2rem;
          background: #1a1a1a;
          color: white;
          border: none;
          border-radius: 50px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        }

        nav.floating .cta-button {
          padding: 1.125rem 2.75rem;
          font-size: 1.05rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.18);
          letter-spacing: -0.01em;
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
          background: #2a2a2a;
        }

        nav.floating .cta-button:hover {
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .cta-button button {
          background: transparent;
          border: none;
          color: inherit;
          font-size: inherit;
          font-weight: inherit;
          cursor: pointer;
          padding: 0;
          width: 100%;
          height: 100%;
        }

        /* Main container for scroll hijacking */
        .scroll-container {
          height: 500vh;
          position: relative;
        }

        /* Hero Section */
        .hero {
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1;
        }

        .hero-text {
          font-size: clamp(4rem, 12vw, 10rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          text-align: center;
          line-height: 1.1;
          position: relative;
          transition: opacity 0.3s ease-out;
        }

        .word-bad {
          display: inline-block;
        }

        .word-bad .bad {
          color: #ef4444;
        }

        .word-bad .habits {
          color: #1a1a1a;
        }

        .word-good {
          display: inline-block;
          opacity: 0;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          transition: opacity 0.3s ease-in;
          white-space: nowrap;
        }

        .word-good .good {
          color: #22c55e;
        }

        .word-good .habits {
          color: #1a1a1a;
        }

        /* Phone Demo Overlay */
        .phone-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          pointer-events: none;
          z-index: 5;
        }

        .phone-container {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .phone-mockup {
          width: 280px;
          height: 570px;
          background: #1a1a1a;
          border-radius: 36px;
          padding: 10px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
          position: relative;
          transform: scale(0.3);
          opacity: 0;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .phone-notch {
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          width: 100px;
          height: 24px;
          background: #1a1a1a;
          border-radius: 0 0 18px 18px;
          z-index: 10;
        }

        .phone-screen {
          width: 100%;
          height: 100%;
          background: white;
          border-radius: 28px;
          overflow: hidden;
          position: relative;
        }

        .phone-caption {
          font-size: 0.95rem;
          color: #666;
          font-weight: 500;
          text-align: center;
          opacity: 0;
          transform: translateY(10px);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Phone Demo Content - Screen 1 */
        .demo-content {
          padding: 2.5rem 1.25rem 1.25rem;
          height: 100%;
          overflow-y: auto;
        }

        .demo-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .demo-title {
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 0.4rem;
        }

        .demo-subtitle {
          color: #666;
          font-size: 0.8rem;
        }

        .challenge-card {
          background: #f8f8f8;
          border-radius: 14px;
          padding: 1rem;
          margin-bottom: 0.875rem;
        }

        .challenge-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.875rem;
        }

        .challenge-vs {
          font-size: 0.7rem;
          color: #666;
          font-weight: 600;
        }

        .coins {
          background: #1a1a1a;
          color: white;
          padding: 0.2rem 0.65rem;
          border-radius: 18px;
          font-size: 0.7rem;
          font-weight: 700;
        }

        .habit-list {
          list-style: none;
        }

        .habit-item {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.65rem 0;
          border-bottom: 1px solid #e0e0e0;
        }

        .habit-item:last-child {
          border-bottom: none;
        }

        .checkbox {
          width: 20px;
          height: 20px;
          border: 2px solid #d0d0d0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .checkbox.checked {
          background: #1a1a1a;
          border-color: #1a1a1a;
        }

        .checkbox.checked::after {
          content: '✓';
          color: white;
          font-size: 0.65rem;
          font-weight: bold;
        }

        .habit-text {
          flex: 1;
          font-size: 0.8rem;
          color: #333;
        }

        .streak-badge {
          background: #ff6b6b;
          color: white;
          padding: 0.2rem 0.4rem;
          border-radius: 10px;
          font-size: 0.65rem;
          font-weight: 700;
        }

        .demo-status {
          text-align: center;
          margin-top: 1.25rem;
          color: #666;
          font-size: 0.75rem;
        }

        /* Phone 2 - Leaderboard */
        .leaderboard-item {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.875rem;
          background: #f8f8f8;
          border-radius: 12px;
          margin-bottom: 0.65rem;
        }

        .rank {
          font-size: 1.1rem;
          font-weight: 700;
          color: #999;
          width: 30px;
        }

        .rank.first { color: #ffd700; }
        .rank.second { color: #c0c0c0; }

        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 0.8rem;
        }

        .user-info {
          flex: 1;
        }

        .username {
          font-weight: 600;
          font-size: 0.85rem;
          margin-bottom: 0.2rem;
        }

        .user-stats {
          font-size: 0.7rem;
          color: #666;
        }

        .score {
          font-weight: 700;
          font-size: 0.95rem;
        }

        /* Phone 3 - Settlement */
        .settlement-card {
          background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
          color: white;
          border-radius: 16px;
          padding: 1.5rem;
          text-align: center;
          margin-bottom: 1rem;
        }

        .settlement-icon {
          font-size: 3rem;
          margin-bottom: 0.75rem;
        }

        .settlement-title {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .settlement-amount {
          font-size: 2.5rem;
          font-weight: 800;
          margin: 0.75rem 0;
        }

        .settlement-detail {
          font-size: 0.75rem;
          opacity: 0.8;
          margin-bottom: 1rem;
        }

        .settlement-button {
          background: white;
          color: #1a1a1a;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 25px;
          font-weight: 700;
          font-size: 0.8rem;
          width: 100%;
        }

        /* Video Section */
        .video-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          pointer-events: none;
          z-index: 6;
        }

        .video-container {
          width: 70vw;
          max-width: 900px;
          aspect-ratio: 16 / 9;
          background: #1a1a1a;
          border-radius: 24px;
          box-shadow: 0 40px 100px rgba(0, 0, 0, 0.5);
          position: relative;
          transform: scale(0.8);
          opacity: 0;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        .video-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        }

        .play-button {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.3s;
          margin-bottom: 1.5rem;
        }

        .play-button:hover {
          transform: scale(1.1);
        }

        .play-button::after {
          content: '';
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 15px 0 15px 25px;
          border-color: transparent transparent transparent #1a1a1a;
          margin-left: 5px;
        }

        .video-title {
          color: white;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .video-subtitle {
          color: rgba(255, 255, 255, 0.6);
          font-size: 1rem;
        }

        /* Final CTA Section */
        .final-cta-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          pointer-events: none;
          z-index: 7;
          gap: 3rem;
        }

        .final-cta-content {
          text-align: center;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          max-width: 700px;
        }

        .cta-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 0.5rem 1.5rem;
          border-radius: 50px;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .final-cta-title {
          font-size: 3.5rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .final-cta-subtitle {
          font-size: 1.3rem;
          color: #666;
          margin-bottom: 2rem;
          line-height: 1.6;
          max-width: 500px;
        }

        .cta-buttons {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .final-cta-button {
          padding: 1.25rem 2.5rem;
          border: none;
          border-radius: 50px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
          display: inline-block;
          letter-spacing: 0.5px;
        }

        .final-cta-button.primary {
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          color: white;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
          position: relative;
          overflow: hidden;
        }

        .final-cta-button.primary::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left 0.5s;
        }

        .final-cta-button.primary:hover::before {
          left: 100%;
        }

        .final-cta-button.primary:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.3);
        }

        .final-cta-button.secondary {
          background: transparent;
          color: #666;
          border: 2px solid #e0e0e0;
        }

        .final-cta-button.secondary:hover {
          color: #1a1a1a;
          border-color: #1a1a1a;
          transform: translateY(-2px);
          background: rgba(0, 0, 0, 0.02);
        }

        .final-cta-button button {
          background: transparent;
          border: none;
          color: inherit;
          font-size: inherit;
          font-weight: inherit;
          cursor: pointer;
          padding: 0;
          width: 100%;
          height: 100%;
        }

        .cta-stats {
          display: flex;
          gap: 3rem;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
        }

        .stat {
          text-align: center;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 800;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-size: 0.9rem;
          color: #666;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Footer */
        .footer {
          position: relative;
          padding: 3rem 2rem;
          text-align: center;
          z-index: 10;
          background: white;
        }

        .footer-text {
          color: #666;
          font-size: 0.95rem;
          font-weight: 500;
        }

        .footer-text .heart {
          color: #ef4444;
          display: inline-block;
          animation: heartbeat 1.5s ease-in-out infinite;
        }

        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.1); }
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .phone-overlay {
            gap: 1.5rem;
          }

          .phone-mockup {
            width: 240px;
            height: 490px;
          }

          .video-container {
            width: 80vw;
          }
        }

        @media (max-width: 768px) {
          nav {
            left: 2rem;
            right: 2rem;
          }

          .hero-text {
            font-size: 3.5rem;
          }

          .phone-overlay {
            flex-direction: column;
            gap: 1rem;
          }

          .phone-mockup {
            width: 220px;
            height: 450px;
          }

          .video-container {
            width: 90vw;
          }

          .final-cta-title {
            font-size: 2.5rem;
          }

          .final-cta-subtitle {
            font-size: 1.1rem;
          }

          .cta-buttons {
            flex-direction: column;
            width: 100%;
            gap: 1rem;
          }

          .final-cta-button {
            width: 100%;
            padding: 1.2rem 2rem;
            font-size: 1.1rem;
          }

          .cta-stats {
            flex-direction: column;
            gap: 1.5rem;
            margin-top: 1.5rem;
          }

          .stat-number {
            font-size: 1.8rem;
          }
        }
      `}</style>

      <div className="landing-page">
        <div className="grid-background"></div>

        <nav ref={navbarRef}>
          <div className="logo">habit<span className="uate">uate</span></div>
          <div className="cta-button">
            <SignUpButton>Get Started</SignUpButton>
          </div>
        </nav>

        <div className="scroll-container">
          <section className="hero">
            <div className="hero-text" ref={heroTextRef}>
              <span className="word-container">
                <span className="word-bad" ref={wordBadRef}><span className="bad">bad</span> <span className="habits">habits?</span></span>
                <span className="word-good" ref={wordGoodRef}><span className="good">good</span> <span className="habits">habits.</span></span>
              </span>
            </div>
          </section>

          <div className="phone-overlay">
            {/* Phone 1 */}
            <div className="phone-container">
              <div className="phone-mockup" ref={phone1Ref}>
                <div className="phone-notch"></div>
                <div className="phone-screen">
                  <div className="demo-content">
                    <div className="demo-header">
                      <h2 className="demo-title">Today's Habits</h2>
                      <p className="demo-subtitle">vs. Alex</p>
                    </div>

                    <div className="challenge-card">
                      <div className="challenge-header">
                        <span className="challenge-vs">YOU VS ALEX</span>
                        <span className="coins">+24 coins</span>
                      </div>

                      <ul className="habit-list">
                        <li className="habit-item">
                          <div className="checkbox checked"></div>
                          <span className="habit-text">Exercise 30 min</span>
                          <span className="streak-badge">🔥 7</span>
                        </li>
                        <li className="habit-item">
                          <div className="checkbox checked"></div>
                          <span className="habit-text">Read for 20 min</span>
                          <span className="streak-badge">🔥 12</span>
                        </li>
                        <li className="habit-item">
                          <div className="checkbox checked"></div>
                          <span className="habit-text">Meditate</span>
                          <span className="streak-badge">🔥 5</span>
                        </li>
                        <li className="habit-item">
                          <div className="checkbox"></div>
                          <span className="habit-text">No social media</span>
                          <span className="streak-badge">🔥 3</span>
                        </li>
                      </ul>
                    </div>

                    <div className="demo-status">
                      <p>You're ahead by 8 coins! 🎯</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="phone-caption" ref={caption1Ref}>Track daily habits in real-time</p>
            </div>

            {/* Phone 2 */}
            <div className="phone-container">
              <div className="phone-mockup" ref={phone2Ref}>
                <div className="phone-notch"></div>
                <div className="phone-screen">
                  <div className="demo-content">
                    <div className="demo-header">
                      <h2 className="demo-title">Leaderboard</h2>
                      <p className="demo-subtitle">This Month</p>
                    </div>

                    <div className="leaderboard-item">
                      <div className="rank first">1st</div>
                      <div className="avatar">Y</div>
                      <div className="user-info">
                        <div className="username">You</div>
                        <div className="user-stats">🔥 28 day streak</div>
                      </div>
                      <div className="score">342</div>
                    </div>

                    <div className="leaderboard-item">
                      <div className="rank second">2nd</div>
                      <div className="avatar" style={{background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'}}>A</div>
                      <div className="user-info">
                        <div className="username">Alex</div>
                        <div className="user-stats">🔥 22 day streak</div>
                      </div>
                      <div className="score">318</div>
                    </div>

                    <div className="leaderboard-item">
                      <div className="rank">3rd</div>
                      <div className="avatar" style={{background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'}}>S</div>
                      <div className="user-info">
                        <div className="username">Sam</div>
                        <div className="user-stats">🔥 15 day streak</div>
                      </div>
                      <div className="score">285</div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="phone-caption" ref={caption2Ref}>Compete with friends</p>
            </div>

            {/* Phone 3 */}
            <div className="phone-container">
              <div className="phone-mockup" ref={phone3Ref}>
                <div className="phone-notch"></div>
                <div className="phone-screen">
                  <div className="demo-content">
                    <div className="demo-header">
                      <h2 className="demo-title">Settlement</h2>
                      <p className="demo-subtitle">October 2025</p>
                    </div>

                    <div className="settlement-card">
                      <div className="settlement-icon">🏆</div>
                      <div className="settlement-title">You Won!</div>
                      <div className="settlement-amount">₹450</div>
                      <div className="settlement-detail">24 coin advantage × ₹18.75 per coin</div>
                      <button className="settlement-button">Claim Winnings</button>
                    </div>

                    <div style={{padding: '1rem', background: '#f8f8f8', borderRadius: '12px', marginTop: '1rem'}}>
                      <div style={{fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem'}}>Challenge Summary</div>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem'}}>
                        <span style={{fontSize: '0.8rem'}}>Your coins</span>
                        <span style={{fontWeight: '700', fontSize: '0.8rem'}}>342</span>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <span style={{fontSize: '0.8rem'}}>Alex's coins</span>
                        <span style={{fontWeight: '700', fontSize: '0.8rem'}}>318</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="phone-caption" ref={caption3Ref}>Win real money every month</p>
            </div>
          </div>

          <div className="video-overlay">
            <div className="video-container" ref={videoContainerRef}>
              <div className="video-placeholder">
                <div className="play-button"></div>
                <h3 className="video-title">Watch How It Works</h3>
                <p className="video-subtitle">See StreakWars in action</p>
              </div>
            </div>
          </div>

          <div className="final-cta-overlay">
            <div className="final-cta-content" ref={finalCTARef}>
              <div className="cta-badge">✨ Start Your Journey Today</div>
              <h2 className="final-cta-title">Ready to turn bad habits into good ones?</h2>
              <p className="final-cta-subtitle">Join thousands building better habits through friendly competition</p>
              <div className="cta-buttons">
                <div className="final-cta-button primary">
                  <SignUpButton>Let's Go! 🚀</SignUpButton>
                </div>
                <div className="final-cta-button secondary">
                  <SignInButton>I'm Back</SignInButton>
                </div>
              </div>
              <div className="cta-stats">
                <div className="stat">
                  <div className="stat-number">10K+</div>
                  <div className="stat-label">Active Users</div>
                </div>
                <div className="stat">
                  <div className="stat-number">85%</div>
                  <div className="stat-label">Success Rate</div>
                </div>
                <div className="stat">
                  <div className="stat-number">30</div>
                  <div className="stat-label">Days Free</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="footer">
          <p className="footer-text">made with <span className="heart">❤️</span> using Cursor and Convex</p>
        </footer>
      </div>
    </>
  );
}
