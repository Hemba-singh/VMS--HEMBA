import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AC-31 Thoubal Voter List Management System',
  description:
    'Constituency voter list management, family verification, polling station mapping, and field workflow platform for AC-31 Thoubal.',
  openGraph: {
    title: 'AC-31 Thoubal Voter List Management System',
    description:
      'Constituency voter list management, family verification, polling station mapping, and field workflow platform for AC-31 Thoubal.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AC-31 Thoubal Voter List Management System',
    description:
      'Constituency voter list management, family verification, polling station mapping, and field workflow platform for AC-31 Thoubal.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
