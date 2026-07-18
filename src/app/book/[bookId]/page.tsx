import { Metadata } from 'next';
import { books } from '@/lib/books';
import { loadBookData } from '@/lib/data-loader';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface Props {
  params: Promise<{ bookId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { bookId } = await params;
  const book = books.find((b) => b.id === bookId);
  if (!book) return { title: '未找到' };

  const data = loadBookData(bookId);
  const unitCount = data?.units?.length || 0;

  return {
    title: `${book.title} — ${book.grade}${book.subject}`,
    description: `${book.title}在线同步音频，共${unitCount}个单元。跟读练习、自动记录进度、图文同步播放。`,
    openGraph: {
      title: `${book.title} — 课本音频`,
      description: `${book.grade}${book.subject}同步听力，${unitCount}个单元`,
    },
    alternates: { canonical: `/book/${bookId}` },
  };
}

export default async function BookPage({ params }: Props) {
  const { bookId } = await params;
  const book = books.find((b) => b.id === bookId);
  if (!book) notFound();

  const data = loadBookData(bookId);
  const units = data?.units || [];

  return (
    <>
      {/* JSON-LD 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Book',
            name: book.title,
            educationalLevel: book.grade,
            about: { '@type': 'Thing', name: book.subject },
            numberOfPages: units.reduce((sum, u) => sum + u.sections.length, 0),
            hasPart: units.map((u, i) => ({
              '@type': 'Chapter',
              name: u.title,
              position: i + 1,
            })),
          }),
        }}
      />

      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6" aria-label="面包屑导航">
        <Link href="/" className="hover:text-gray-600">首页</Link>
        <span aria-hidden="true">/</span>
        <span className="text-gray-600">{book.title}</span>
      </nav>

      <div className="flex items-center gap-4 mb-8">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${book.color} flex items-center justify-center text-3xl shadow-lg`} aria-hidden="true">
          {book.cover}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{book.title}</h1>
          <p className="text-gray-500">{book.grade} · {book.subject} · {units.length} 个单元</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-700 mb-4">课程单元</h2>
      <div className="grid gap-3">
        {units.map((unit, idx) => (
          <Link
            key={unit.id}
            href={`/book/${bookId}/unit/${unit.id}`}
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-sm transition-all group"
            title={`${unit.title} — ${unit.sections.length} 页`}
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-semibold text-sm" aria-hidden="true">
              {idx + 1}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-800 group-hover:text-emerald-700">{unit.title}</h3>
              <p className="text-xs text-gray-400">{unit.sections.length} 页</p>
            </div>
            <svg className="w-5 h-5 text-gray-300 group-hover:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </>
  );
}
