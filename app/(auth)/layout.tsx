import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Auth',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#EEEDFB] via-white to-[#D5D3F6] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-[#534AB7] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-2xl font-bold text-[#534AB7]">Aira</span>
          </Link>
          <p className="mt-2 text-sm text-zinc-500">Your Board Exam Buddy</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl border border-zinc-100 p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
