import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Casly',
  description: 'Where humans and AI build together',
  icons: {
    icon: '/favicon.ico',
  },
  verification: {
    google: 'vSk5g7bEYDb6BmjSfNPSVWD-dHsnXCJ2EMWro3cukmI',
  },
  openGraph: {
    title: 'Casly',
    description: 'Where humans and AI build together',
    url: 'https://casly.me',
    siteName: 'Casly',
    images: [
      {
        url: 'https://casly.me/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
