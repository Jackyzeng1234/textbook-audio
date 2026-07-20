'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AudioPlayer } from '@/components/audio-player';
import { getUnitData, getUnitsForBook, type SectionData } from '@/lib/book-data';

export default function UnitPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.bookId as string;
  const unitId = params.unitId as string;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [unitData, setUnitData] = useState<{ id: string; title: string; sections: SectionData[] } | null>(null);
  const [allUnits, setAllUnits] = useState<{ id: string }[]>([]);
  const unitIdRef = useRef(unitId);

  useEffect(() => { unitIdRef.current = unitId; }, [unitId]);

  // 数据在构建时内联，无需 fetch
  useEffect(() => {
    const all = getUnitsForBook(bookId);
    setAllUnits(all.map((u) => ({ id: u.id })));
    const current = getUnitData(bookId, unitId);
    if (current) {
      setUnitData(current);
      try {
        const progress = JSON.parse(localStorage.getItem('textbook_audio_progress') || '{}');
        const savedIdx = current.sections.findIndex((s) => !progress[s.id]?.completed);
        if (savedIdx >= 0) setCurrentIdx(savedIdx);
      } catch {}
    }
  }, [bookId, unitId]);

  const goToNextUnit = useCallback(() => {
    const idx = allUnits.findIndex((u) => u.id === unitIdRef.current);
    if (idx >= 0 && idx < allUnits.length - 1) {
      router.push(`/book/${bookId}/unit/${allUnits[idx + 1].id}`);
    }
  }, [allUnits, bookId, router]);

  const goPrev = useCallback(() => setCurrentIdx((i) => Math.max(0, i - 1)), []);

  const goNext = useCallback(() => {
    const sections = unitData?.sections || [];
    if (currentIdx + 1 >= sections.length) {
      goToNextUnit();
    } else {
      setCurrentIdx((i) => i + 1);
    }
  }, [unitData, currentIdx, goToNextUnit]);

  if (!unitData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const sections = unitData.sections;
  const current = sections[currentIdx];

  return (
    <div>
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-gray-600">首页</Link>
        <span>/</span>
        <Link href={`/book/${bookId}`} className="hover:text-gray-600">课本</Link>
        <span>/</span>
        <span className="text-gray-600">{unitData.title}</span>
      </nav>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 flex-wrap">
        {sections.map((section, idx) => {
          let completed = false;
          try {
            const progress = JSON.parse(localStorage.getItem('textbook_audio_progress') || '{}');
            completed = progress[section.id]?.completed;
          } catch {}
          return (
            <button key={section.id} onClick={() => setCurrentIdx(idx)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                idx === currentIdx
                  ? 'bg-emerald-500 text-white shadow-md'
                  : completed
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}>
              {completed ? '✓ ' : ''}{section.title}
            </button>
          );
        })}
      </div>

      {current && (
        <AudioPlayer
          key={current.id}
          sectionId={current.id}
          title={`${unitData.title} · ${current.title}`}
          text={current.text}
          audioUrl={current.audioUrl}
          imageUrl={current.imageUrl}
          autoPlay={true}
          hasPrev={currentIdx > 0}
          hasNext={currentIdx < sections.length - 1}
          nextLabel={currentIdx >= sections.length - 1 ? '下一个单元' : undefined}
          onPrev={goPrev}
          onNext={goNext}
        />
      )}

      <div className="mt-6 text-center">
        <Link href={`/book/${bookId}`} className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回单元列表
        </Link>
      </div>
    </div>
  );
}
