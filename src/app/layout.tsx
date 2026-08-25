import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { PWAProvider } from '@/components/PWAProvider';

export const metadata: Metadata = {
  title: 'Budget Cat - Smart Personal Budgeting & Event Tracker',
  description: 'Production-quality offline-first personal budgeting application for monthly budgets, travel, vacations, events, emergency funds, and goals.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#6E8B74',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/cat-icon-192.png" />
      </head>
      <body className="min-h-screen bg-[#FAF6F0] text-[#3A2E2B] font-sans antialiased">
        <AuthProvider>
          <PWAProvider>
            {children}
          </PWAProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
