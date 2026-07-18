/**
 * 播放进度管理 — localStorage 实现
 *
 * 每个 section 独立记录播放位置，下次打开自动续播
 */

const STORAGE_KEY = 'textbook_audio_progress';

interface SectionProgress {
  sectionId: string;
  position: number;    // 播放位置（秒）
  completed: boolean;  // 是否听完
  updatedAt: number;   // 最后更新时间戳
}

interface ProgressData {
  [sectionId: string]: SectionProgress;
}

function getAll(): ProgressData {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveAll(data: ProgressData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getProgress(sectionId: string): SectionProgress | null {
  return getAll()[sectionId] || null;
}

export function saveProgress(sectionId: string, position: number, completed = false): void {
  const data = getAll();
  data[sectionId] = {
    sectionId,
    position,
    completed,
    updatedAt: Date.now(),
  };
  saveAll(data);
}

export function getUnitProgress(unitId: string, sectionIds: string[]): {
  completed: number;
  total: number;
  lastSection?: string;
  lastPosition?: number;
} {
  const data = getAll();
  const sections = sectionIds.map((id) => data[id]).filter(Boolean);
  const completed = sections.filter((s) => s.completed).length;
  const lastSection = sections.sort((a, b) => b.updatedAt - a.updatedAt)[0];
  return {
    completed,
    total: sectionIds.length,
    lastSection: lastSection?.sectionId,
    lastPosition: lastSection?.position,
  };
}
