import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'AC-31 Thoubal Voter List Management System',
  description: 'Constituency voter list management, family verification, polling station mapping, and field workflow platform for AC-31 Thoubal.',
  openGraph: {
    title: 'AC-31 Thoubal Voter List Management System',
    description: 'Constituency voter list management, family verification, polling station mapping, and field workflow platform for AC-31 Thoubal.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AC-31 Thoubal Voter List Management System',
    description: 'Constituency voter list management, family verification, polling station mapping, and field workflow platform for AC-31 Thoubal.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
