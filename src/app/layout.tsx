import type { Metadata } from 'next';
import { Inter, Noto_Serif_SC } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const notoSerif = Noto_Serif_SC({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: {
    default:
      '小学课本音频，小学语文音频，小学英语音频，画面音频同步 | 课本音频',
    template: '%s | 小学课本音频',
  },
  description:
    '小学课本音频同步播放，支持小学语文音频、小学英语音频。图文音频同步，跟读练习，自动记录学习进度。免费在线使用。',
  keywords: [
    '小学英语', '课文音频', '同步听力', '五年级英语',
    '英语跟读', '小学英语听力', 'PEP英语', '课文朗读',
    '在线学习', '英语教材音频',
  ],
  authors: [{ name: '课本音频' }],
  creator: '课本音频',
  publisher: '课本音频',
  metadataBase: new URL('http://localhost:3001'),
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    siteName: '课本音频',
    title: '小学课本音频，小学语文音频，小学英语音频，画面音频同步',
    description: '小学课本音频同步播放，图文音频同步，跟读练习，自动记录进度',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${notoSerif.variable}`}>
      <body className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 font-sans antialiased">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2" title="课本音频首页">
              <span className="text-2xl" aria-hidden="true">🎧</span>
              <span className="font-semibold text-gray-800">课本音频</span>
            </a>
            <span className="text-xs text-gray-400 hidden sm:inline">小学课文同步听力</span>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
