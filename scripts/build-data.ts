/**
 * 构建时数据生成脚本 — 将动态数据预生成为静态 JSON
 * 在 `next build` 之前运行: pnpm build-data && pnpm build
 */
import fs from 'fs';
import path from 'path';

const CONFIG_MAP: Record<string, string> = {
  'grade5-english-sem1': 'grade5-english-sem1-config.json',
};

const DATA_DIR = path.join(process.cwd(), 'src/data/books');
const OUTPUT_DIR = path.join(process.cwd(), 'public/data');

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

// 确保输出目录存在
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// 处理每本书
const allBooks: { bookId: string; title: string; units: any[] }[] = [];

for (const [bookId, configFile] of Object.entries(CONFIG_MAP)) {
  const configPath = path.join(DATA_DIR, configFile);
  if (!fs.existsSync(configPath)) continue;

  const config: BookConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const bookData = { bookId: config.bookId, title: config.title, units: [] as any[] };

  for (const uc of config.units) {
    const sections: any[] = [];

    for (let page = uc.pageStart; page <= uc.pageEnd; page++) {
      const mdPath = path.join(DATA_DIR, 'llama_per_page', `page${String(page).padStart(3, '0')}.md`);
      const audioPath = `/audio/${bookId}/page${String(page).padStart(3, '0')}.mp3`;
      const imgPath = `/pages/${bookId}/page${String(page).padStart(3, '0')}.webp`;

      const audioExists = fs.existsSync(path.join(process.cwd(), 'public', audioPath));
      let text = '';

      if (fs.existsSync(mdPath)) {
        text = fs.readFileSync(mdPath, 'utf-8');
      }

      if (text.length > 5 || audioExists) {
        sections.push({
          id: `${bookId}-p${page}`,
          title: `第 ${page} 页`,
          text,
          audioUrl: audioExists ? audioPath : undefined,
          imageUrl: imgPath,
          duration: Math.round(text.length * 0.3),
        });
      }
    }

    bookData.units.push({
      id: uc.id,
      title: uc.title,
      sections,
    });
  }

  // 生成每个单元的独立 JSON
  for (const unit of bookData.units) {
    const unitFile = path.join(OUTPUT_DIR, `${bookId}-${unit.id}.json`);
    fs.writeFileSync(unitFile, JSON.stringify(unit), 'utf-8');
    console.log(`  ✅ ${unitFile}`);
  }

  // 生成全单元列表
  const allFile = path.join(OUTPUT_DIR, `${bookId}-all.json`);
  fs.writeFileSync(allFile, JSON.stringify(bookData.units), 'utf-8');
  console.log(`  ✅ ${allFile}`);

  allBooks.push(bookData);

  // 生成全单元列表
  const sections: any[] = [];
  for (const u of bookData.units) {
    for (const s of u.sections) {
      sections.push(s);
    }
  }
  const sectionsFile = path.join(OUTPUT_DIR, `${bookId}-sections.json`);
  fs.writeFileSync(sectionsFile, JSON.stringify(sections), 'utf-8');
  console.log(`  ✅ ${sectionsFile}`);

  console.log(`  📖 ${config.title}: ${bookData.units.length} 单元, ${sections.length} 页`);
}

console.log(`\n🎉 完成: ${allBooks.length} 本书`);
