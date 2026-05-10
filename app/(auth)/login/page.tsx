'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleGoogleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <h2 style={{
        fontFamily: 'Newsreader, Georgia, serif',
        fontSize: 22,
        fontWeight: 500,
        color: 'var(--aira-ink)',
        marginBottom: 6,
      }}>
        Welcome back
      </h2>
      <p style={{ fontSize: 13.5, color: 'var(--aira-ink-3)', marginBottom: 28 }}>
        Sign in to continue your studies
      </p>

      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: '12px 20px',
          background: '#fff',
          border: '1px solid var(--aira-line-strong)',
          borderRadius: 12,
          fontSize: 14.5,
          fontWeight: 500,
          color: 'var(--aira-indigo)',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          boxShadow: '0 1px 0 rgba(46,40,128,0.04), 0 1px 2px rgba(26,24,39,0.04)',
          transition: 'box-shadow 0.15s, border-color 0.15s',
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 0 rgba(46,40,128,0.04), 0 4px 16px rgba(26,24,39,0.06)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--aira-indigo)';
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 0 rgba(46,40,128,0.04), 0 1px 2px rgba(26,24,39,0.04)';
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--aira-line-strong)';
        }}
      >
        {loading ? (
          <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
        )}
        Continue with Google
      </button>

      <p style={{ marginTop: 24, fontSize: 12, color: 'var(--aira-ink-4)' }}>
        By continuing, you agree to Aira&apos;s{' '}
        <a href="/terms" style={{ color: 'var(--aira-indigo)', textDecoration: 'none' }}>Terms</a>
        {' & '}
        <a href="/privacy" style={{ color: 'var(--aira-indigo)', textDecoration: 'none' }}>Privacy Policy</a>
      </p>
    </div>
  );
}
