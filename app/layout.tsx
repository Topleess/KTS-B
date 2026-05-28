import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin', 'cyrillic'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: 'KTS Beauty',
  description: 'Пойми, что нужно твоей коже',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FFFAF4',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${inter.variable} ${playfair.variable} dark`} suppressHydrationWarning>
      <body className="antialiased bg-kts-bg text-kts-text font-ui h-[100dvh] w-full overflow-hidden selection:bg-kts-accent selection:text-white transition-colors duration-300">
        <div className="mx-auto w-full max-w-[430px] h-[100dvh] relative bg-kts-bg shadow-2xl overflow-y-auto overflow-x-hidden flex flex-col hide-scrollbar" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
