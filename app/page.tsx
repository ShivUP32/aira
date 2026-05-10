import Link from 'next/link';
import { AiraLogo } from '@/components/brand/AiraLogo';

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--aira-canvas)', color: 'var(--aira-ink)', minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 48px',
        height: 64,
        borderBottom: '1px solid var(--aira-line)',
        background: 'var(--aira-paper)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AiraLogo size={28} />
          <span style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 20, fontWeight: 600, color: 'var(--aira-ink)' }}>
            Aira
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <a href="#modes" style={{ fontSize: 14, color: 'var(--aira-ink-3)', textDecoration: 'none' }}>Modes</a>
          <a href="#how" style={{ fontSize: 14, color: 'var(--aira-ink-3)', textDecoration: 'none' }}>How it works</a>
          <a href="#subjects" style={{ fontSize: 14, color: 'var(--aira-ink-3)', textDecoration: 'none' }}>Subjects</a>
          <Link href="/login" style={{
            fontSize: 14,
            color: 'var(--aira-indigo)',
            textDecoration: 'none',
            border: '1px solid var(--aira-indigo)',
            borderRadius: 8,
            padding: '6px 16px',
          }}>
            Log in
          </Link>
          <Link href="/login" style={{
            fontSize: 14,
            color: '#fff',
            textDecoration: 'none',
            background: 'var(--aira-indigo)',
            borderRadius: 8,
            padding: '6px 16px',
            fontWeight: 500,
          }}>
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '80px 48px 64px',
        display: 'grid',
        gridTemplateColumns: '1.05fr 1fr',
        gap: 64,
        alignItems: 'center',
      }}>
        {/* Left */}
        <div>
          {/* Saffron badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--aira-saffron-soft)',
            border: '1px solid var(--aira-saffron)',
            borderRadius: 999,
            padding: '4px 14px',
            marginBottom: 28,
          }}>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--aira-saffron-deep)',
            }}>
              Built on the 2025 CBSE Board papers
            </span>
          </div>

          {/* H1 */}
          <h1 style={{
            fontFamily: 'Newsreader, Georgia, serif',
            fontSize: 76,
            letterSpacing: '-0.035em',
            lineHeight: 0.98,
            color: 'var(--aira-ink)',
            fontWeight: 400,
            margin: '0 0 24px',
          }}>
            The Class 12 board exam buddy that gets you{' '}
            <em style={{ color: 'var(--aira-indigo)', fontStyle: 'italic' }}>extra marks</em>
          </h1>

          <p style={{
            fontSize: 16,
            color: 'var(--aira-ink-3)',
            lineHeight: 1.65,
            marginBottom: 36,
            maxWidth: 480,
          }}>
            Aira cites every answer from real CBSE board papers with official marking schemes — so you know exactly what earns marks.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 40 }}>
            <Link href="/login" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--aira-indigo)',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: 12,
              padding: '14px 28px',
              fontSize: 15,
              fontWeight: 500,
              boxShadow: '0 1px 0 rgba(46,40,128,0.04), 0 4px 16px rgba(26,24,39,0.06)',
            }}>
              Start studying free
            </Link>
            <a href="#modes" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'transparent',
              color: 'var(--aira-ink-2)',
              textDecoration: 'none',
              borderRadius: 12,
              padding: '14px 28px',
              fontSize: 15,
              border: '1px solid var(--aira-line-strong)',
            }}>
              See how it works
            </a>
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { icon: '✓', text: 'Free, no card' },
              { icon: '✓', text: 'हिन्दी + English' },
              { icon: '✓', text: 'Cites every source' },
            ].map((badge) => (
              <div key={badge.text} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--aira-sage)', fontWeight: 600 }}>{badge.icon}</span>
                <span style={{ fontSize: 13, color: 'var(--aira-ink-3)' }}>{badge.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: floating chat preview */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            background: 'var(--aira-paper)',
            border: '1px solid var(--aira-line)',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 400,
            transform: 'rotate(0.4deg)',
            boxShadow: '0 1px 0 rgba(46,40,128,0.06), 0 12px 40px rgba(26,24,39,0.10)',
          }}>
            {/* Chat header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--aira-line-faint)' }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: 'var(--aira-indigo-tint)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <AiraLogo size={20} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--aira-ink)' }}>Aira</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--aira-ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  gemini-2.5-pro · 3 sources
                </div>
              </div>
            </div>

            {/* User message */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <div style={{
                background: 'var(--aira-ink)',
                color: 'var(--aira-paper)',
                borderRadius: '16px 16px 4px 16px',
                padding: '10px 14px',
                fontSize: 14,
                maxWidth: '80%',
              }}>
                Explain Gauss's law with derivation for CBSE
              </div>
            </div>

            {/* Aira response */}
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 13, color: 'var(--aira-ink-2)', lineHeight: 1.6, marginBottom: 12 }}>
                Gauss's Law states that the total electric flux through a closed surface equals the net charge enclosed divided by ε₀.
              </p>
              <div style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 15, fontWeight: 500, marginBottom: 8, color: 'var(--aira-ink)' }}>
                Mathematical Form
              </div>
              <div style={{
                background: 'var(--aira-paper-3)',
                border: '1px solid var(--aira-line)',
                borderRadius: 8,
                padding: '8px 12px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 12,
                color: 'var(--aira-indigo)',
                marginBottom: 12,
              }}>
                ∮ E⃗ · dA⃗ = Q_enc / ε₀
              </div>
            </div>

            {/* Citation row */}
            <div style={{ borderTop: '1px solid var(--aira-line-faint)', paddingTop: 12 }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--aira-ink-4)',
                marginBottom: 8,
              }}>
                Grounded in
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['CBSE 2025 Physics · Set-1 · Q12 · 5m', 'CBSE 2024 Physics · Set-2 · Q8 · 5m'].map((chip) => (
                  <div key={chip} style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    border: '1px solid var(--aira-line)',
                    borderRadius: 999,
                    padding: '3px 10px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 10,
                    color: 'var(--aira-ink-2)',
                    background: 'var(--aira-paper)',
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--aira-saffron)', flexShrink: 0 }} />
                    {chip}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modes section */}
      <section id="modes" style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--aira-saffron)',
            marginBottom: 12,
          }}>
            Four ways to study
          </div>
          <h2 style={{
            fontFamily: 'Newsreader, Georgia, serif',
            fontSize: 40,
            letterSpacing: '-0.025em',
            lineHeight: 1.1,
            color: 'var(--aira-ink)',
            fontWeight: 400,
            margin: 0,
          }}>
            Every mode you need, built in
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {[
            {
              kicker: 'MODE 01',
              icon: '💬',
              title: 'Doubt Solver',
              desc: 'Ask any question and get cited answers from real CBSE papers with marking scheme references.',
              color: 'var(--aira-indigo)',
              bg: 'var(--aira-indigo-tint)',
            },
            {
              kicker: 'MODE 02',
              icon: '📖',
              title: 'Learning',
              desc: 'Deep dive into concepts with structured explanations aligned to your NCERT syllabus.',
              color: 'var(--aira-sage)',
              bg: 'var(--aira-sage-soft)',
            },
            {
              kicker: 'MODE 03',
              icon: '✏️',
              title: 'Practice',
              desc: 'Attempt real board questions and get feedback on your answers vs. official marking schemes.',
              color: 'var(--aira-saffron)',
              bg: 'var(--aira-saffron-soft)',
            },
            {
              kicker: 'MODE 04',
              icon: '📝',
              title: 'Revision',
              desc: 'Quick-fire revision of key points, formulas, and definitions before your exam.',
              color: 'var(--aira-crimson)',
              bg: 'var(--aira-crimson-soft)',
            },
          ].map((mode) => (
            <div key={mode.kicker} style={{
              background: 'var(--aira-paper)',
              border: '1px solid var(--aira-line)',
              borderRadius: 16,
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: mode.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
              }}>
                {mode.icon}
              </div>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: mode.color,
              }}>
                {mode.kicker}
              </div>
              <div style={{
                fontFamily: 'Newsreader, Georgia, serif',
                fontSize: 20,
                fontWeight: 500,
                color: 'var(--aira-ink)',
                lineHeight: 1.2,
              }}>
                {mode.title}
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--aira-ink-3)', lineHeight: 1.6, margin: 0 }}>
                {mode.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--aira-line)',
        padding: '32px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AiraLogo size={22} />
          <span style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 16, color: 'var(--aira-ink-3)' }}>Aira</span>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--aira-ink-4)' }}>
          © 2025 Aira · Built for Class 12 CBSE
        </div>
      </footer>
    </div>
  );
}
