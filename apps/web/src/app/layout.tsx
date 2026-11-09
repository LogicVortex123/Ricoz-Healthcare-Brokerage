import type { Metadata } from 'next';
import { Fraunces, Source_Sans_3 } from 'next/font/google';
import { AuthProvider } from '@/features/auth/auth-provider';
import { ToastProvider } from '@/components/ui/toast';
import './globals.css';

const source = Source_Sans_3({ subsets: ['latin'], variable: '--font-source', display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'PracticeBridge', template: '%s · PracticeBridge' },
  description: 'A brokerage workspace for buying, selling, and transitioning dental, veterinary, and specialist medical practices.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${source.variable} ${fraunces.variable} font-sans text-ink antialiased`}>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">
          Skip to content
        </a>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
