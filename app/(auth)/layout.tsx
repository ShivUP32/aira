import type { Metadata } from 'next';
import { AiraLogoLarge } from '@/components/brand/AiraLogo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sign in — Aira',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--aira-canvas)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Jali corner decorations */}
      <div
        className="aira-jali"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 240,
          height: 240,
          opacity: 0.35,
          maskImage: 'radial-gradient(ellipse at top left, black 30%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at top left, black 30%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        className="aira-jali"
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 240,
          height: 240,
          opacity: 0.35,
          maskImage: 'radial-gradient(ellipse at bottom right, black 30%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at bottom right, black 30%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 420,
        padding: '0 16px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo + tagline header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <AiraLogoLarge size={56} />
          </div>
          <h1 style={{
            fontFamily: 'Newsreader, Georgia, serif',
            fontSize: 40,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            color: 'var(--aira-ink)',
            fontWeight: 400,
            margin: '0 0 12px',
          }}>
            Aira
          </h1>
          <p style={{
            fontSize: 15,
            color: 'var(--aira-ink-3)',
            lineHeight: 1.5,
            margin: '0 0 16px',
          }}>
            The Class 12 board exam buddy that gets you{' '}
            <em style={{ color: 'var(--aira-indigo)', fontStyle: 'italic', fontFamily: 'Newsreader, Georgia, serif' }}>
              extra marks
            </em>
          </p>
          {/* Saffron chip */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--aira-saffron-soft)',
            border: '1px solid rgba(220,139,63,0.4)',
            borderRadius: 999,
            padding: '4px 14px',
          }}>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--aira-saffron-deep)',
            }}>
              Built on the 2025 CBSE Board papers
            </span>
          </div>
        </div>

        {/* Auth card */}
        <div style={{
          background: 'var(--aira-paper)',
          border: '1px solid var(--aira-line)',
          borderRadius: 20,
          padding: 32,
          boxShadow: '0 1px 0 rgba(46,40,128,0.04), 0 4px 16px rgba(26,24,39,0.06)',
        }}>
          {children}
        </div>

        <p style={{
          textAlign: 'center',
          marginTop: 20,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--aira-ink-4)',
        }}>
          Free · No credit card required
        </p>
      </div>
    </div>
  );
}
