'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AiraLogo } from '@/components/brand/AiraLogo';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SUBJECTS = [
  { value: 'physics', label: 'Physics', color: '#4C44B8', count: '~40 Qs' },
  { value: 'chemistry', label: 'Chemistry', color: '#B23A48', count: '~40 Qs' },
  { value: 'mathematics', label: 'Mathematics', color: '#DC8B3F', count: '~50 Qs' },
  { value: 'cs', label: 'Computer Sci.', color: '#4F7A6E', count: '~30 Qs' },
  { value: 'english', label: 'English Core', color: '#6B6680', count: '~25 Qs' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी', devanagari: true },
  { value: 'both', label: 'Both' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [displayName, setDisplayName] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['physics', 'chemistry', 'mathematics']);
  const [language, setLanguage] = useState('en');
  const [saving, setSaving] = useState(false);

  function toggleSubject(value: string) {
    setSelectedSubjects((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  }

  async function handleFinish() {
    if (selectedSubjects.length === 0) {
      toast.error('Please select at least one subject.');
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        display_name: displayName || user.user_metadata?.full_name || user.email?.split('@')[0],
        subjects: selectedSubjects,
        preferred_language: language,
      });

      router.push('/chat');
    } catch {
      toast.error('Failed to save preferences. Please try again.');
      setSaving(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--aira-canvas)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 16px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Jali corners */}
      <div className="aira-jali" style={{
        position: 'absolute', top: 0, left: 0, width: 200, height: 200,
        opacity: 0.3, maskImage: 'radial-gradient(circle at top left, black 30%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(circle at top left, black 30%, transparent 70%)',
      }} />
      <div className="aira-jali" style={{
        position: 'absolute', bottom: 0, right: 0, width: 200, height: 200,
        opacity: 0.3, maskImage: 'radial-gradient(circle at bottom right, black 30%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(circle at bottom right, black 30%, transparent 70%)',
      }} />

      <div style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}>
        {/* Progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 32 }}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{
              flex: 1, height: 4, borderRadius: 999,
              background: n <= step ? 'var(--aira-indigo)' : 'var(--aira-line-strong)',
              transition: 'background 0.3s',
            }} />
          ))}
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--aira-ink-4)', marginLeft: 6 }}>
            {step}/3
          </span>
        </div>

        <div style={{
          background: 'var(--aira-paper)',
          border: '1px solid var(--aira-line)',
          borderRadius: 20,
          padding: 32,
          boxShadow: '0 1px 0 rgba(46,40,128,0.04), 0 4px 16px rgba(26,24,39,0.06)',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <AiraLogo size={40} />
          </div>

          {/* Step 1: Name */}
          {step === 1 && (
            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--aira-ink-3)', marginBottom: 6 }}>
                Step 1 of 3
              </div>
              <h2 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 28, fontWeight: 400, color: 'var(--aira-ink)', marginBottom: 8, letterSpacing: '-0.02em' }}>
                What should we call you?
              </h2>
              <p style={{ fontSize: 14, color: 'var(--aira-ink-3)', marginBottom: 24, lineHeight: 1.6 }}>
                Aira will personalise your experience.
              </p>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name…"
                autoFocus
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 12,
                  border: '1px solid var(--aira-line-strong)', background: 'var(--aira-paper)',
                  fontSize: 15, fontFamily: 'inherit', color: 'var(--aira-ink)',
                  outline: 'none', marginBottom: 24,
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') setStep(2); }}
              />
              <button
                onClick={() => setStep(2)}
                style={{
                  width: '100%', padding: '12px 20px', borderRadius: 12, border: 'none',
                  background: 'var(--aira-indigo)', color: '#fff', fontSize: 15,
                  fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Subjects */}
          {step === 2 && (
            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--aira-ink-3)', marginBottom: 6 }}>
                Step 2 of 3 — Pick your subjects
              </div>
              <h2 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 28, fontWeight: 400, color: 'var(--aira-ink)', marginBottom: 8, letterSpacing: '-0.02em' }}>
                What are <em style={{ color: 'var(--aira-indigo)' }}>you</em> tackling?
              </h2>
              <p style={{ fontSize: 14, color: 'var(--aira-ink-3)', marginBottom: 20, lineHeight: 1.6 }}>
                We'll prioritise these in the sidebar. Change anytime.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                {SUBJECTS.map((s) => {
                  const selected = selectedSubjects.includes(s.value);
                  return (
                    <button
                      key={s.value}
                      onClick={() => toggleSubject(s.value)}
                      style={{
                        padding: '14px 14px', borderRadius: 12, cursor: 'pointer',
                        background: 'var(--aira-paper)',
                        border: selected ? `1.5px solid ${s.color}` : '1px solid var(--aira-line)',
                        boxShadow: selected ? `0 0 0 3px ${s.color}20` : 'none',
                        textAlign: 'left', fontFamily: 'inherit', position: 'relative',
                      }}
                    >
                      {selected && (
                        <CheckCircle2 style={{ position: 'absolute', top: 10, right: 10, width: 16, height: 16, color: s.color }} />
                      )}
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, marginBottom: 10 }} />
                      <div style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 15, color: 'var(--aira-ink)', letterSpacing: '-0.01em' }}>{s.label}</div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--aira-ink-4)', marginTop: 2 }}>{s.count}</div>
                    </button>
                  );
                })}
              </div>

              {/* Language */}
              <div style={{ marginBottom: 8, fontSize: 13, color: 'var(--aira-ink-3)' }}>Explanations in</div>
              <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--aira-paper-2)', borderRadius: 999, border: '1px solid var(--aira-line)', marginBottom: 24 }}>
                {LANGUAGES.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => setLanguage(l.value)}
                    style={{
                      flex: 1, textAlign: 'center', padding: '8px 10px', borderRadius: 999,
                      fontSize: 13, cursor: 'pointer', border: 'none',
                      background: language === l.value ? 'var(--aira-ink)' : 'transparent',
                      color: language === l.value ? 'white' : 'var(--aira-ink-2)',
                      fontFamily: l.devanagari ? 'Tiro Devanagari Hindi, serif' : 'inherit',
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(3)}
                disabled={selectedSubjects.length === 0}
                style={{
                  width: '100%', padding: '12px 20px', borderRadius: 12, border: 'none',
                  background: selectedSubjects.length > 0 ? 'var(--aira-indigo)' : 'var(--aira-line)',
                  color: selectedSubjects.length > 0 ? '#fff' : 'var(--aira-ink-4)',
                  fontSize: 15, fontWeight: 500, cursor: selectedSubjects.length > 0 ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                }}
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 3: Ready */}
          {step === 3 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--aira-ink-3)', marginBottom: 6 }}>
                Almost there
              </div>
              <h2 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 28, fontWeight: 400, color: 'var(--aira-ink)', marginBottom: 8, letterSpacing: '-0.02em' }}>
                You&apos;re all set{displayName ? `, ${displayName}` : ''}!
              </h2>
              <p style={{ fontSize: 14, color: 'var(--aira-ink-3)', marginBottom: 28, lineHeight: 1.6 }}>
                Aira is ready with {selectedSubjects.length} subjects in {language === 'en' ? 'English' : language === 'hi' ? 'Hindi' : 'English + Hindi'}.
              </p>

              {/* Summary chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 32 }}>
                {SUBJECTS.filter((s) => selectedSubjects.includes(s.value)).map((s) => (
                  <span key={s.value} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 12px', borderRadius: 999,
                    border: `1px solid ${s.color}40`, background: `${s.color}10`,
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: s.color,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: 999, background: s.color }} />
                    {s.label}
                  </span>
                ))}
              </div>

              <button
                onClick={handleFinish}
                disabled={saving}
                style={{
                  width: '100%', padding: '14px 20px', borderRadius: 12, border: 'none',
                  background: 'var(--aira-indigo)', color: '#fff',
                  fontSize: 15, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {saving ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : null}
                Start studying with Aira
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
