/**
 * 加载课本数据 — LlamaParse Markdown + 图片 + 音频
 */
import fs from 'fs';
import path from 'path';
import type { Unit, Section } from './books';

interface UnitConfig {
  id: string;
  title: string;
  pageStart: number;
  pageEnd: number;
}

interface BookConfig {
  bookId: string;
  title: string;
  units: UnitConfig[];
}

const CONFIG_MAP: Record<string, string> = {
  'grade5-english-sem1': 'grade5-english-sem1-config.json',
};

export function loadBookData(bookId: string): { title: string; units: Unit[] } | null {
  const configFile = CONFIG_MAP[bookId] || `${bookId}-config.json`;
  const configPath = path.join(process.cwd(), 'src/data/books', configFile);
  if (!fs.existsSync(configPath)) return null;
  const config: BookConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  const units: Unit[] = config.units.map((uc) => {
    const sections: Section[] = [];

    for (let page = uc.pageStart; page <= uc.pageEnd; page++) {
      const id = `${bookId}-p${page}`;
      const mdPath = path.join(process.cwd(), 'src/data/books/llama_per_page', `page${String(page).padStart(3, '0')}.md`);
      const audioPath = `/audio/${bookId}/page${String(page).padStart(3, '0')}.mp3`;
      const imgPath = `/pages/${bookId}/page${String(page).padStart(3, '0')}.jpg`;

      const audioExists = fs.existsSync(path.join(process.cwd(), 'public', audioPath));
      const imgExists = fs.existsSync(path.join(process.cwd(), 'public', imgPath));
      let text = '';

      if (fs.existsSync(mdPath)) {
        text = fs.readFileSync(mdPath, 'utf-8');
      }

      if (text.length > 5 || audioExists) {
        sections.push({
          id,
          title: `第 ${page} 页`,
          text,
          audioUrl: audioExists ? audioPath : undefined,
          imageUrl: imgExists ? imgPath : undefined,
          duration: Math.round(text.length * 0.3),
        });
      }
    }

    return { id: uc.id, title: uc.title, sections };
  });

  return { title: config.title, units };
}
