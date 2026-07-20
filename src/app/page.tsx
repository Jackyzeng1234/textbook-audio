'use client';

import { useState, useEffect } from 'react';
import { books } from '@/lib/books';

interface BookStats {
  unitCount: number;
  totalSections: number;
}

export default function HomePage() {
  const [stats, setStats] = useState<Record<string, BookStats>>({});

  useEffect(() => {
    // 从静态 JSON 加载（Cloudflare Pages 兼容，不依赖 fs）
    Promise.all(
      books.map(async (book) => {
        try {
          const resp = await fetch(`/data/${book.id}-all.json`);
          const units = await resp.json();
          let totalSections = 0;
          for (const u of units) totalSections += u.sections?.length || 0;
          return [book.id, { unitCount: units.length, totalSections }] as const;
        } catch {
          return [book.id, { unitCount: 0, totalSections: 0 }] as const;
        }
      })
    ).then((results) => {
      setStats(Object.fromEntries(results));
    });
  }, []);

  return (
    <div>
      <div className="text-center mb-12">
        <div className="text-5xl mb-4">🎧</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">课本音频</h1>
        <p className="text-gray-500">小学课文同步听力 · 跟读练习 · 记录进度</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {books.map((book) => {
          const s = stats[book.id] || { unitCount: '...', totalSections: '...' } as any;
          return (
            <a key={book.id} href={`/book/${book.id}`}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
              <div className={`h-2 bg-gradient-to-r ${book.color}`} />
              <div className="p-6">
                <div className="text-4xl mb-3">{book.cover}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{book.title}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {book.grade} · {book.subject} · {s.unitCount} 个单元
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>{s.totalSections} 段音频</span>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      <div className="mt-8 p-8 border-2 border-dashed border-gray-200 rounded-2xl text-center">
        <div className="text-3xl mb-2">📚</div>
        <p className="text-gray-400 text-sm">更多年级和学科即将上线</p>
      </div>
    </div>
  );
}
