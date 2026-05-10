import { redirect } from 'next/navigation';

// Auth is Google-only — redirect signup to login
export default function SignupPage() {
  redirect('/login');
}
