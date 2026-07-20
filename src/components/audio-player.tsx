'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { getProgress, saveProgress } from '@/lib/storage';

interface Props {
  sectionId: string;
  title: string;
  text: string;
  audioUrl?: string;
  imageUrl?: string;
  autoPlay?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  nextLabel?: string;
}

export function AudioPlayer({
  sectionId, title, text, audioUrl, imageUrl, autoPlay,
  onPrev, onNext, hasPrev, hasNext, nextLabel,
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [resumed, setResumed] = useState(false);
  const progressSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // 切换 section 时重置，autoPlay 时自动播放
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setPlaying(false);
    setResumed(false);

    if (!audioUrl) return;

    // 恢复上次进度
    const progress = getProgress(sectionId);
    if (progress?.position && !progress.completed) {
      setResumed(true);
    }

    // 自动播放
    if (autoPlay && audioRef.current) {
      const audio = audioRef.current;
      const doPlay = () => {
        if (progress?.position && !progress.completed) {
          audio.currentTime = progress.position;
        }
        audio.play().then(() => {
          setPlaying(true);
          startProgressSave();
        }).catch(() => {});
      };

      if (audio.readyState >= 1) {
        doPlay();
      } else {
        audio.addEventListener('loadedmetadata', doPlay, { once: true });
      }
    }

    return () => {
      if (progressSaveTimer.current) clearInterval(progressSaveTimer.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
      }
    };
  }, [sectionId]);

  // 恢复上次播放位置
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const progress = getProgress(sectionId);
    if (progress && progress.position > 0 && !progress.completed) {
      const handler = () => {
        audio.currentTime = progress.position;
        setResumed(true);
        audio.removeEventListener('loadedmetadata', handler);
      };
      audio.addEventListener('loadedmetadata', handler);
    }
  }, [sectionId]);

  // 定期保存进度
  const startProgressSave = useCallback(() => {
    if (progressSaveTimer.current) clearInterval(progressSaveTimer.current);
    progressSaveTimer.current = setInterval(() => {
      if (audioRef.current) {
        saveProgress(sectionId, audioRef.current.currentTime);
      }
    }, 3000);
  }, [sectionId]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  }, []);

  // 播放结束 → 自动下一首
  const handleEnded = useCallback(() => {
    setPlaying(false);
    if (audioRef.current) {
      saveProgress(sectionId, audioRef.current.duration, true);
    }
    if (progressSaveTimer.current) clearInterval(progressSaveTimer.current);
    // 自动跳到下一首
    if (onNext && hasNext) {
      setTimeout(() => onNext(), 500);
    }
  }, [sectionId, onNext, hasNext]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      if (progressSaveTimer.current) clearInterval(progressSaveTimer.current);
      setPlaying(false);
    } else {
      try {
        await audio.play();
        startProgressSave();
        setPlaying(true);
      } catch (e: unknown) {
        // AbortError: 切换页面时正常现象，忽略
        if (e instanceof Error && e.name !== 'AbortError') {
          console.warn('Play failed:', e);
        }
      }
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = t;
      setCurrentTime(t);
    }
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.duration, audioRef.current.currentTime + seconds));
    }
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPlay={() => { setPlaying(true); startProgressSave(); }}
        onPause={() => { setPlaying(false); if (progressSaveTimer.current) clearInterval(progressSaveTimer.current); }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        preload="metadata"
      />

      {/* 标题栏 */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
          {resumed && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              续播
            </span>
          )}
          {duration > 0 && (
            <span className="text-xs text-gray-400">{formatTime(duration)}</span>
          )}
        </div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      </div>

      {/* 进度条 */}
      <div className="px-6">
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={seek}
          className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:shadow-md"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* 课本图片 */}
      {imageUrl && (
        <div className="px-6 pb-4">
          <div className="bg-gray-100 rounded-xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={title}
              className="w-full object-contain max-h-[60vh]"
              loading="lazy"
            />
          </div>
        </div>
      )}

      {/* 控制按钮 */}
      <div className="px-6 py-4 flex items-center justify-center gap-4">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-20 transition-colors"
          title="上一页"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
          </svg>
        </button>

        <button onClick={() => skip(-10)}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="后退 10 秒">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
          </svg>
        </button>

        <button onClick={togglePlay}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500
            text-white flex items-center justify-center shadow-lg hover:shadow-xl
            transform hover:scale-105 transition-all active:scale-95" title="播放 / 暂停">
          {playing ? (
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          ) : (
            <svg className="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>

        <button onClick={() => skip(10)}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="快进 10 秒">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
          </svg>
        </button>

        <button
          onClick={onNext}
          disabled={!onNext}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-20 transition-colors"
          title={hasNext ? (nextLabel || '下一页') : '下一个单元'}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
          </svg>
        </button>
      </div>

      {/* 课文文字 */}
      <div className="px-6 pb-6">
        <details className="group">
          <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-500 transition-colors">
            查看课文文字
          </summary>
          <div className="mt-3 p-4 bg-gray-50 rounded-xl text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
            {text || '暂无文字内容'}
          </div>
        </details>
      </div>
    </div>
  );
}
