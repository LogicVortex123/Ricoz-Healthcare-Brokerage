import type { Metadata } from 'next';
import { Fraunces, Manrope } from 'next/font/google';
import './globals.css';
import './platform.css';

const sans = Manrope({
  subsets: ['latin'],
  variable: '--font-platform-sans',
  display: 'swap',
});

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-platform-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Ricoz — Healthcare Practice Transitions',
  description:
    'Confidential, broker-managed transitions for dental, veterinary and specialist medical practices.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className={`${sans.className} min-h-screen bg-surface text-ink`}>{children}</body>
    </html>
  );
}
