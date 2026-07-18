import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'http://localhost:3001';
  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ];

  // 从配置加载所有课本和单元
  const dataDir = path.join(process.cwd(), 'src/data/books');
  if (fs.existsSync(dataDir)) {
    const configs = fs.readdirSync(dataDir).filter((f) => f.endsWith('-config.json'));
    for (const configFile of configs) {
      const bookId = configFile.replace('-config.json', '');
      const config = JSON.parse(fs.readFileSync(path.join(dataDir, configFile), 'utf-8'));

      // 课本页
      entries.push({
        url: `${baseUrl}/book/${bookId}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      });

      // 单元页
      for (const unit of config.units || []) {
        entries.push({
          url: `${baseUrl}/book/${bookId}/unit/${unit.id}`,
          lastModified: new Date(),
          changeFrequency: 'monthly',
          priority: 0.8,
        });
      }
    }
  }

  return entries;
}
