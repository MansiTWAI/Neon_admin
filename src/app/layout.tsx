import { NEON_FONTS_STYLESHEET } from '@neon-adda/shared';
import type { Metadata } from 'next';
import { Inter, Sora } from 'next/font/google';
import './globals.css';

const sora = Sora({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-sora' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: { default: 'Admin | Neon Adda', template: '%s | Neon Adda Admin' },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${sora.variable} ${inter.variable}`}>
      <head>
        {/* Order and quotation previews draw the customer's lettering in its neon typeface. */}
        <link rel="stylesheet" href={NEON_FONTS_STYLESHEET} />
      </head>
      <body>{children}</body>
    </html>
  );
}
