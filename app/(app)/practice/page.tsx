'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Lightbulb, ChevronRight } from 'lucide-react';

interface Question {
  id: string;
  subject: string;
  year: number;
  set: string;
  qNo: number;
  marks: number;
  text: string;
  answer?: string;
}

const SAMPLE_QUESTIONS: Question[] = [
  {
    id: '1',
    subject: 'Physics',
    year: 2025,
    set: '1',
    qNo: 12,
    marks: 5,
    text: "State Gauss's Law in electrostatics. Using Gauss's Law, derive the expression for the electric field intensity due to an infinitely long straight uniformly charged wire.",
    answer: "Gauss's Law: The total electric flux through any closed surface is equal to 1/ε₀ times the total charge enclosed within the surface. Mathematically: ∮E⃗·dA⃗ = Q_enc/ε₀\n\nDerivation for infinite wire:\n- Consider a cylindrical Gaussian surface of radius r and length l\n- By symmetry, E is radial and constant on curved surface\n- Flux through curved surface = E × 2πrl\n- Charge enclosed = λl (λ = linear charge density)\n- Applying Gauss's Law: E × 2πrl = λl/ε₀\n- Therefore E = λ/(2πε₀r)\n- Direction: radially outward for positive charge",
  },
  {
    id: '2',
    subject: 'Chemistry',
    year: 2025,
    set: '1',
    qNo: 8,
    marks: 3,
    text: 'What is the difference between SN1 and SN2 reactions? Give one example of each.',
    answer: 'SN1 (Substitution Nucleophilic Unimolecular):\n- Two-step mechanism: carbocation intermediate\n- Rate depends only on substrate concentration\n- Favored by tertiary substrates\n- Example: (CH₃)₃CBr + OH⁻ → (CH₃)₃COH + Br⁻\n\nSN2 (Substitution Nucleophilic Bimolecular):\n- One-step mechanism: backside attack\n- Rate depends on both substrate and nucleophile\n- Favored by primary substrates\n- Example: CH₃Br + OH⁻ → CH₃OH + Br⁻',
  },
];

const SUBJECT_COLORS: Record<string, string> = {
  Physics: '#4C44B8',
  Chemistry: '#B23A48',
  Mathematics: '#DC8B3F',
  'Computer Science': '#4F7A6E',
  English: '#6B6680',
};

type FeedbackState = 'idle' | 'submitted' | 'revealed';

export default function PracticePage() {
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>('idle');
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const question = SAMPLE_QUESTIONS[currentQIdx];
  const dotColor = question ? SUBJECT_COLORS[question.subject] || 'var(--aira-indigo)' : 'var(--aira-indigo)';

  const progress = SAMPLE_QUESTIONS.length > 0
    ? ((currentQIdx + 1) / SAMPLE_QUESTIONS.length) * 100
    : 0;

  function handleSubmit() {
    if (!userAnswer.trim()) return;
    setFeedback('submitted');
  }

  function handleReveal() {
    setFeedback('revealed');
    setScore((s) => ({ ...s, total: s.total + 1 }));
  }

  function handleNext() {
    if (currentQIdx < SAMPLE_QUESTIONS.length - 1) {
      setCurrentQIdx((i) => i + 1);
      setUserAnswer('');
      setFeedback('idle');
    }
  }

  function handleMarkCorrect() {
    setScore((s) => ({ correct: s.correct + 1, total: s.total }));
    handleNext();
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--aira-canvas)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', height: '100%', minHeight: '100vh' }}>
        {/* Left sidebar */}
        <div style={{
          background: 'var(--aira-ink)',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}>
          {/* Session card */}
          <div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.10em',
              color: 'var(--aira-saffron)',
              marginBottom: 12,
            }}>
              Practice Session
            </div>
            <h2 style={{
              fontFamily: 'Newsreader, Georgia, serif',
              fontSize: 22,
              fontWeight: 400,
              color: '#fff',
              marginBottom: 6,
              lineHeight: 1.2,
            }}>
              Board Questions
            </h2>
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)' }}>
              CBSE 2025 · Mixed subjects
            </p>
          </div>

          {/* Progress */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)' }}>
                Progress
              </span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>
                {currentQIdx + 1}/{SAMPLE_QUESTIONS.length}
              </span>
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${progress}%`,
                background: 'var(--aira-saffron)',
                borderRadius: 999,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>

          {/* Score */}
          {score.total > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 12,
              padding: '14px 16px',
            }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
                Score
              </div>
              <div style={{
                fontFamily: 'Newsreader, Georgia, serif',
                fontSize: 40,
                color: 'var(--aira-sage)',
                lineHeight: 1,
              }}>
                {score.correct}/{score.total}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}% correct
              </div>
            </div>
          )}

          {/* Question list */}
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
              Questions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {SAMPLE_QUESTIONS.map((q, i) => {
                const isDone = i < currentQIdx;
                const isCurrent = i === currentQIdx;
                const color = SUBJECT_COLORS[q.subject] || '#4C44B8';
                return (
                  <button
                    key={q.id}
                    onClick={() => { if (i <= currentQIdx) { setCurrentQIdx(i); setUserAnswer(''); setFeedback('idle'); }}}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 8px',
                      borderRadius: 8,
                      border: isCurrent ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
                      background: isCurrent ? 'rgba(255,255,255,0.08)' : 'transparent',
                      cursor: i <= currentQIdx ? 'pointer' : 'default',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: isDone ? 'var(--aira-sage)' : isCurrent ? color : 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: isDone ? 'rgba(255,255,255,0.5)' : isCurrent ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                      Q{q.qNo} · {q.subject}
                    </span>
                    <span style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
                      {q.marks}m
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 800 }}>
          {question && (
            <>
              {/* Question card */}
              <div style={{
                background: 'var(--aira-paper)',
                border: '1px solid var(--aira-line)',
                borderRadius: 16,
                padding: '24px 28px',
              }}>
                {/* Meta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor }} />
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--aira-ink-4)',
                  }}>
                    CBSE {question.year} {question.subject} · Set-{question.set} · Q{question.qNo}
                  </span>
                  <span style={{
                    marginLeft: 'auto',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 10,
                    padding: '2px 8px',
                    background: 'var(--aira-saffron-soft)',
                    border: '1px solid rgba(220,139,63,0.4)',
                    borderRadius: 999,
                    color: 'var(--aira-saffron-deep)',
                  }}>
                    {question.marks} marks
                  </span>
                </div>

                {/* Question text */}
                <p style={{
                  fontFamily: 'Newsreader, Georgia, serif',
                  fontSize: 18,
                  letterSpacing: '-0.018em',
                  lineHeight: 1.55,
                  color: 'var(--aira-ink)',
                  margin: 0,
                }}>
                  {question.text}
                </p>
              </div>

              {/* Answer area */}
              {feedback === 'idle' && (
                <div>
                  <div style={{
                    border: '2px dashed var(--aira-line-strong)',
                    borderRadius: 14,
                    overflow: 'hidden',
                    transition: 'border-color 0.15s',
                  }}
                  onFocusCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--aira-indigo)'; }}
                  onBlurCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--aira-line-strong)'; }}
                  >
                    <textarea
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Write your answer here… Think about all the key points for full marks."
                      rows={8}
                      style={{
                        width: '100%',
                        padding: '16px 18px',
                        background: 'var(--aira-paper)',
                        border: 'none',
                        outline: 'none',
                        resize: 'vertical',
                        fontSize: 14.5,
                        color: 'var(--aira-ink)',
                        fontFamily: 'inherit',
                        lineHeight: 1.65,
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                    <button
                      onClick={handleReveal}
                      style={{
                        padding: '9px 20px',
                        border: '1px solid var(--aira-line-strong)',
                        borderRadius: 10,
                        background: 'var(--aira-paper)',
                        cursor: 'pointer',
                        fontSize: 13.5,
                        color: 'var(--aira-ink-3)',
                      }}
                    >
                      Show answer
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!userAnswer.trim()}
                      style={{
                        padding: '9px 20px',
                        border: 'none',
                        borderRadius: 10,
                        background: userAnswer.trim() ? 'var(--aira-indigo)' : 'var(--aira-paper-3)',
                        color: userAnswer.trim() ? '#fff' : 'var(--aira-ink-4)',
                        cursor: userAnswer.trim() ? 'pointer' : 'not-allowed',
                        fontSize: 13.5,
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      Check answer <ChevronRight style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>
              )}

              {/* Submitted: show user answer + reveal button */}
              {feedback === 'submitted' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{
                    background: 'var(--aira-paper)',
                    border: '1px solid var(--aira-line)',
                    borderRadius: 14,
                    padding: '16px 18px',
                  }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--aira-ink-4)', marginBottom: 8 }}>
                      Your answer
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--aira-ink-2)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{userAnswer}</p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={handleReveal}
                      style={{
                        padding: '9px 20px',
                        border: 'none',
                        borderRadius: 10,
                        background: 'var(--aira-indigo)',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: 13.5,
                        fontWeight: 500,
                      }}
                    >
                      Show marking scheme
                    </button>
                  </div>
                </div>
              )}

              {/* Revealed: feedback card */}
              {feedback === 'revealed' && question.answer && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Feedback card: 3-col grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 12,
                  }}>
                    <div style={{
                      background: 'var(--aira-sage-soft)',
                      border: '1px solid var(--aira-sage)',
                      borderRadius: 12,
                      padding: '14px 16px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <CheckCircle2 style={{ width: 14, height: 14, color: 'var(--aira-sage)' }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--aira-sage)' }}>
                          Correct
                        </span>
                      </div>
                      <p style={{ fontSize: 12.5, color: 'var(--aira-ink-2)', lineHeight: 1.5, margin: 0 }}>
                        Good structure and key definitions included.
                      </p>
                    </div>
                    <div style={{
                      background: 'var(--aira-crimson-soft)',
                      border: '1px solid var(--aira-crimson)',
                      borderRadius: 12,
                      padding: '14px 16px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <XCircle style={{ width: 14, height: 14, color: 'var(--aira-crimson)' }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--aira-crimson)' }}>
                          Missing
                        </span>
                      </div>
                      <p style={{ fontSize: 12.5, color: 'var(--aira-ink-2)', lineHeight: 1.5, margin: 0 }}>
                        Mathematical derivation steps with equations needed.
                      </p>
                    </div>
                    <div style={{
                      background: 'var(--aira-saffron-soft)',
                      border: '1px solid rgba(220,139,63,0.4)',
                      borderRadius: 12,
                      padding: '14px 16px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Lightbulb style={{ width: 14, height: 14, color: 'var(--aira-saffron)' }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--aira-saffron-deep)' }}>
                          Tip
                        </span>
                      </div>
                      <p style={{ fontSize: 12.5, color: 'var(--aira-ink-2)', lineHeight: 1.5, margin: 0 }}>
                        Always include a labeled diagram for 5-mark questions.
                      </p>
                    </div>
                  </div>

                  {/* Official answer */}
                  <div style={{
                    background: 'var(--aira-paper)',
                    border: '1px solid var(--aira-sage)',
                    borderRadius: 14,
                    padding: '18px 20px',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 9,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--aira-sage)',
                      marginBottom: 12,
                    }}>
                      <CheckCircle2 style={{ width: 11, height: 11 }} />
                      Official Marking Scheme
                    </div>
                    <div style={{
                      fontFamily: 'Newsreader, Georgia, serif',
                      fontSize: 14.5,
                      color: 'var(--aira-ink)',
                      lineHeight: 1.7,
                      whiteSpace: 'pre-wrap',
                    }}>
                      {question.answer}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button
                      onClick={handleNext}
                      style={{
                        padding: '9px 20px',
                        border: '1px solid var(--aira-line-strong)',
                        borderRadius: 10,
                        background: 'var(--aira-paper)',
                        cursor: 'pointer',
                        fontSize: 13.5,
                        color: 'var(--aira-ink-3)',
                      }}
                    >
                      Skip
                    </button>
                    <button
                      onClick={handleMarkCorrect}
                      style={{
                        padding: '9px 20px',
                        border: 'none',
                        borderRadius: 10,
                        background: 'var(--aira-sage)',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: 13.5,
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <CheckCircle2 style={{ width: 14, height: 14 }} />
                      Mark correct &amp; next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
