import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { LanguageProvider } from '@/lib/context/LanguageContext';
import { LocationProvider } from '@/lib/context/LocationContext';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

export const metadata: Metadata = {
  title: 'Unified AgriForecasting — Market Intelligence Platform',
  description: 'Agricultural market price forecasting and decision-support platform for Indian mandis.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="h-full antialiased">
        <LanguageProvider>
          <LocationProvider>
            <AppShell>{children}</AppShell>
          </LocationProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
