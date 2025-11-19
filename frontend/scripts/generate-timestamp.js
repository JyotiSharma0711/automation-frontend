import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream } from 'fs';

(async () => {
  const sitemap = new SitemapStream({ hostname: 'https://workbench.ondc.tech' });

  // Add your main routes:
  const routes = [
    '/',
    '/login',
    '/dashboard',
    '/flows',
    '/documentation',
    '/playground'
  ];

  routes.forEach(route => sitemap.write({ url: route, changefreq: 'daily' }));
  sitemap.end();

  const data = await streamToPromise(sitemap);

  createWriteStream('./public/sitemap.xml').write(data.toString());
})();
