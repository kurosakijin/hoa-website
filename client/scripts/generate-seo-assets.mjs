import fs from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const publicDir = path.join(projectRoot, 'public');
const buildDate = new Date().toISOString().split('T')[0];

function normalizeSiteUrl() {
  const rawValue =
    process.env.VITE_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5173');

  return String(rawValue || '').trim().replace(/\/+$/, '');
}

function buildRobotsTxt(siteUrl) {
  const sitemapLine = siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : '';

  return `User-agent: *\nAllow: /\n${sitemapLine}`;
}

function buildSitemapXml(siteUrl) {
  if (!siteUrl) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>\n`;
  }

  const routes = [
    { path: '/', changefreq: 'weekly', priority: '1.0' },
    { path: '/resident-page', changefreq: 'weekly', priority: '0.9' },
    { path: '/block-and-lots', changefreq: 'weekly', priority: '0.8' },
    { path: '/find-my-resident-info', changefreq: 'weekly', priority: '0.8' },
  ];

  const urlEntries = routes
    .map(
      ({ path: routePath, changefreq, priority }) => `  <url>
    <loc>${siteUrl}${routePath}</loc>
    <lastmod>${buildDate}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>\n`;
}

async function main() {
  const siteUrl = normalizeSiteUrl();

  await fs.mkdir(publicDir, { recursive: true });
  await fs.writeFile(path.join(publicDir, 'robots.txt'), buildRobotsTxt(siteUrl), 'utf8');
  await fs.writeFile(path.join(publicDir, 'sitemap.xml'), buildSitemapXml(siteUrl), 'utf8');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
