import type { Metadata, Viewport } from 'next';
import { Fraunces } from 'next/font/google';
import './globals.css';

// Fraunces só no nome "Lartiê" (design-system/README.md).
const fraunces = Fraunces({ subsets: ['latin'], weight: ['600'], variable: '--fonte-marca', display: 'swap' });

export const metadata: Metadata = {
  title: 'Lartiê · casamento e casa nova',
  description: 'Lista de presentes feita com o Lartiê.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#9A5A50' },
    { media: '(prefers-color-scheme: dark)', color: '#1C1513' },
  ],
};

export default function Raiz({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={fraunces.variable}>
      <body>{children}</body>
    </html>
  );
}
