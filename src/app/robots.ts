import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/register', '/forgot-password'],
        disallow: [
          '/dashboard',
          '/budgets',
          '/transactions',
          '/income',
          '/bills',
          '/savings',
          '/debts',
          '/reports',
          '/settings',
          '/monthly',
          '/calendar'
        ]
      }
    ],
    sitemap: 'https://budgetcat.app/sitemap.xml'
  };
}
