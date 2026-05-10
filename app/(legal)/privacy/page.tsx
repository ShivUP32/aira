import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Aira',
};

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--aira-canvas)', padding: '48px 24px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <Link href="/" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--aira-indigo)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 32 }}>
          ← Back to Aira
        </Link>
        <h1 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 40, fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--aira-ink)', marginBottom: 8 }}>
          Privacy Policy
        </h1>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--aira-ink-4)', marginBottom: 40 }}>
          Last updated: May 2026
        </p>

        {[
          {
            title: '1. Information We Collect',
            body: `We collect your email address when you sign up via Google OAuth. We also store your conversation history, bookmarks, and subject preferences to personalise your experience. We do not collect any payment information.`,
          },
          {
            title: '2. How We Use Your Information',
            body: `Your information is used solely to operate Aira — to authenticate you, store your study history, and personalise recommendations. We do not sell your data to third parties or use it for advertising.`,
          },
          {
            title: '3. Data Storage',
            body: `Your data is stored in Supabase (PostgreSQL hosted on AWS). Conversation data is stored to allow you to resume your study sessions. You can delete your account and all associated data at any time from your profile settings.`,
          },
          {
            title: '4. Analytics',
            body: `We use PostHog for anonymous product analytics to understand how students use Aira and improve the product. Analytics data is anonymised and not linked to your personal identity.`,
          },
          {
            title: '5. Third-Party Services',
            body: `Aira uses OpenRouter to process AI requests, Hugging Face for embeddings, and Upstash for rate limiting. Your messages may be processed by these services to generate responses. Please review their privacy policies.`,
          },
          {
            title: '6. Data Retention',
            body: `We retain your data as long as your account is active. Inactive accounts (no login for 12 months) may be automatically deleted. You can request deletion at any time by emailing support@aira.app.`,
          },
          {
            title: '7. Contact',
            body: `For any privacy-related questions, contact us at support@aira.app.`,
          },
        ].map((section) => (
          <div key={section.title} style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 20, fontWeight: 500, color: 'var(--aira-ink)', marginBottom: 10 }}>
              {section.title}
            </h2>
            <p style={{ fontSize: 15, color: 'var(--aira-ink-2)', lineHeight: 1.7 }}>
              {section.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
