'use client';

import Link from 'next/link';
import type { Book } from '@/lib/books';

interface Props {
  book: Book;
  progress?: { completed: number; total: number };
}

export function BookCard({ book, progress }: Props) {
  const pct = progress ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <Link
      href={`/book/${book.id}`}
      className="group relative overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
    >
      {/* 顶部色条 */}
      <div className={`h-2 bg-gradient-to-r ${book.color}`} />

      <div className="p-6">
        <div className="text-4xl mb-3">{book.cover}</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{book.title}</h3>
        <p className="text-sm text-gray-500">
          {book.grade} · {book.subject}
        </p>

        {/* 进度条 */}
        {progress && progress.total > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>学习进度</span>
              <span>{progress.completed}/{progress.total}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${book.color} rounded-full transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
