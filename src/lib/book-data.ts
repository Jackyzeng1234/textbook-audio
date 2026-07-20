/**
 * 课本数据 — 构建时 import JSON，零运行时 fs/fetch
 * npm run build-data 会先生成这些 JSON 文件
 */

// 这些 JSON 由 build-data 脚本生成，import 后在构建时内联到 bundle 中
import grade5EnglishAll from '@/data/generated/grade5-english-sem1-all.json';
import grade5EnglishSections from '@/data/generated/grade5-english-sem1-sections.json';

export interface UnitData {
  id: string;
  title: string;
  sections: SectionData[];
}

export interface SectionData {
  id: string;
  title: string;
  text: string;
  audioUrl?: string;
  imageUrl?: string;
  duration?: number;
}

export const ALL_BOOKS: Record<string, { units: UnitData[]; sections: SectionData[] }> = {
  'grade5-english-sem1': {
    units: grade5EnglishAll as UnitData[],
    sections: grade5EnglishSections as SectionData[],
  },
};

export function getUnitData(bookId: string, unitId: string): UnitData | undefined {
  return ALL_BOOKS[bookId]?.units.find((u) => u.id === unitId);
}

export function getUnitsForBook(bookId: string): UnitData[] {
  return ALL_BOOKS[bookId]?.units || [];
}
