import fs from 'fs';
import path from 'path';

// 构建时预生成所有单元页面
export async function generateStaticParams() {
  const dataDir = path.join(process.cwd(), 'src/data/books');
  const configs = fs.readdirSync(dataDir).filter((f) => f.endsWith('-config.json'));

  const params: { bookId: string; unitId: string }[] = [];

  for (const configFile of configs) {
    const bookId = configFile.replace('-config.json', '');
    const config = JSON.parse(fs.readFileSync(path.join(dataDir, configFile), 'utf-8'));

    for (const unit of config.units || []) {
      params.push({ bookId, unitId: unit.id });
    }
  }

  return params;
}

export default function UnitLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
