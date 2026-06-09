import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import Script from 'next/script';
import { Providers } from './providers';
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
      <body className="antialiased bg-kts-bg text-kts-text font-ui h-[100svh] w-full overflow-hidden selection:bg-kts-accent selection:text-white transition-colors duration-300">
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <div className="mx-auto w-full max-w-[430px] h-[100svh] relative bg-kts-bg shadow-2xl overflow-hidden flex flex-col">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
