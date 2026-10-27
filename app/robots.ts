import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/dashboard/',
          '/settings/',
          '/reset-password/',
          '/protected-example/',
        ],
      },
      {
        userAgent: ['Googlebot', 'Bingbot', 'Bravebot', 'Applebot', 'DuckDuckBot'],
        allow: '/',
      },
    ],
    sitemap: 'https://www.roopixo.com/sitemap.xml',
    host: 'https://www.roopixo.com',
  };
}
