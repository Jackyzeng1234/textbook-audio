'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AudioPlayer } from '@/components/audio-player';

interface Section {
  id: string;
  title: string;
  text: string;
  audioUrl?: string;
  imageUrl?: string;
  duration?: number;
}

interface UnitData {
  id: string;
  title: string;
  sections: Section[];
}

export default function UnitPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.bookId as string;
  const unitId = params.unitId as string;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [unitData, setUnitData] = useState<UnitData | null>(null);
  const [allUnitIds, setAllUnitIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const unitIdRef = useRef(unitId);

  useEffect(() => { unitIdRef.current = unitId; }, [unitId]);

  useEffect(() => {
    setLoading(true);
    setError('');
    setCurrentIdx(0);

    // 从静态 JSON 加载（兼容本地开发和 Cloudflare Pages）
    Promise.all([
      fetch(`/data/${bookId}-all.json`).then((r) => r.json()),
      fetch(`/data/${bookId}-${unitId}.json`).then((r) => r.json()),
    ])
      .then(([allUnits, currentUnit]: [UnitData[], UnitData]) => {
        setAllUnitIds(allUnits.map((u) => u.id));
        setUnitData(currentUnit);
        // 找第一个未完成的 section
        try {
          const progress = JSON.parse(localStorage.getItem('textbook_audio_progress') || '{}');
          const savedIdx = currentUnit.sections?.findIndex((s) => !progress[s.id]?.completed);
          if (savedIdx >= 0) setCurrentIdx(savedIdx);
        } catch {}
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [bookId, unitId]);

  const goToNextUnit = useCallback(() => {
    const currentIdx = allUnitIds.indexOf(unitIdRef.current);
    if (currentIdx >= 0 && currentIdx < allUnitIds.length - 1) {
      const nextId = allUnitIds[currentIdx + 1];
      router.push(`/book/${bookId}/unit/${nextId}`);
    }
  }, [allUnitIds, bookId, router]);

  const goPrev = useCallback(() => {
    setCurrentIdx((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    const sections = unitData?.sections || [];
    const nextIdx = currentIdx + 1;
    if (nextIdx >= sections.length) {
      goToNextUnit();
    } else {
      setCurrentIdx(nextIdx);
    }
  }, [unitData, currentIdx, goToNextUnit]);

  const sections = unitData?.sections || [];
  const current = sections[currentIdx];
  const isLastInUnit = currentIdx >= sections.length - 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !unitData || sections.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">{error || '暂无数据'}</p>
        <Link href={`/book/${bookId}`} className="text-emerald-500 text-sm mt-2 inline-block">返回</Link>
      </div>
    );
  }

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
            <button
              key={section.id}
              onClick={() => setCurrentIdx(idx)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                idx === currentIdx
                  ? 'bg-emerald-500 text-white shadow-md'
                  : completed
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
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
          hasNext={!isLastInUnit}
          nextLabel={isLastInUnit ? '下一个单元' : undefined}
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
