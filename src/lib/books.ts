/**
 * 课本数据模型 — 支持多年级多学科扩展
 *
 * 新增课本只需在此添加配置 + 放入 OCR JSON 和音频文件即可
 */

export interface Section {
  id: string;
  title: string;
  text: string;
  audioUrl?: string;
  imageUrl?: string;
  duration?: number;
}

export interface Unit {
  id: string;
  title: string;
  sections: Section[];
}

export interface Book {
  id: string;
  title: string;
  grade: string;
  semester: '上' | '下';
  subject: string;
  cover: string;
  color: string; // 卡片背景色
  units: Unit[];
}

// ── 课本配置 ──────────────────────────────────────

export const books: Book[] = [
  {
    id: 'grade5-english-sem1',
    title: '五年级英语上册',
    grade: '五年级',
    semester: '上',
    subject: '英语',
    cover: '📗',
    color: 'from-emerald-400 to-teal-500',
    units: [], // 从 OCR JSON 动态加载
  },
  // 扩展示例（后续添加）：
  // {
  //   id: 'grade5-chinese-sem1',
  //   title: '五年级语文上册',
  //   grade: '五年级',
  //   semester: '上',
  //   subject: '语文',
  //   cover: '📕',
  //   color: 'from-rose-400 to-pink-500',
  //   units: [],
  // },
];

// ── 分类 ──────────────────────────────────────────

export interface Category {
  label: string;
  books: Book[];
}

export function getCategories(): Category[] {
  const map = new Map<string, Book[]>();
  for (const book of books) {
    const key = `${book.grade}${book.semester}学期`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(book);
  }
  return Array.from(map.entries()).map(([label, books]) => ({ label, books }));
}
