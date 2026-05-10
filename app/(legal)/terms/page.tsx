import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — Aira',
};

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--aira-canvas)', padding: '48px 24px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <Link href="/" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--aira-indigo)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 32 }}>
          ← Back to Aira
        </Link>
        <h1 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 40, fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--aira-ink)', marginBottom: 8 }}>
          Terms of Service
        </h1>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--aira-ink-4)', marginBottom: 40 }}>
          Last updated: May 2026
        </p>

        {[
          { title: '1. Acceptance', body: 'By using Aira, you agree to these terms. Aira is a free educational tool for Class 12 CBSE students. If you do not agree, please do not use the service.' },
          { title: '2. Use of Service', body: 'Aira is intended for educational use. You may not use it to generate harmful, offensive, or unlawful content. You must be at least 13 years old to use Aira.' },
          { title: '3. AI Disclaimer', body: 'Aira uses AI to generate responses. While we ground answers in real CBSE 2025 board papers, AI can make mistakes. Always verify critical answers with your teacher or official NCERT resources. Aira responses should not be treated as definitive for exam preparation.' },
          { title: '4. Free Service', body: 'Aira is currently provided free of charge. We reserve the right to introduce usage limits or paid tiers in the future with reasonable notice.' },
          { title: '5. Intellectual Property', body: 'CBSE board paper content referenced in Aira responses is the property of the Central Board of Secondary Education. It is used here under educational fair use for students to study and revise.' },
          { title: '6. Account Termination', body: 'We reserve the right to suspend accounts that violate these terms or abuse the service (e.g., automated scraping, spam).' },
          { title: '7. Changes', body: 'We may update these terms periodically. Continued use of Aira after changes constitutes acceptance of the new terms.' },
          { title: '8. Contact', body: 'Questions? Email support@aira.app.' },
        ].map((section) => (
          <div key={section.title} style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 20, fontWeight: 500, color: 'var(--aira-ink)', marginBottom: 10 }}>{section.title}</h2>
            <p style={{ fontSize: 15, color: 'var(--aira-ink-2)', lineHeight: 1.7 }}>{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
