// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/image',
    '@nuxtjs/seo',
    'nuxt-auth-utils',
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    db: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '3306',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      name: process.env.DB_NAME || 'personal_web',
    },
    session: {
      password: process.env.NUXT_SESSION_PASSWORD || '',
    },
    chapiUrl: process.env.CHATERY_URI || 'http://localhost:3000',
    chapiKey: process.env.CHATERY_API_KEY || '',
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'id' },
      title: 'Fajri Gariskode — Blog, Profile & CV',
      titleTemplate: '%s',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Blog dokumentasi pembelajaran, profile, dan CV. Tempat mencatat perjalanan belajar dan berbagi pengetahuan.' },

        // Open Graph
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Fajri Gariskode' },
        { property: 'og:locale', content: 'id_ID' },

        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },

        // Theme
        { name: 'theme-color', content: '#ffffff' },
        { name: 'color-scheme', content: 'light' },

        // Additional
        { name: 'author', content: 'Fajri Gariskode' },
        { name: 'generator', content: 'Nuxt' },
        { name: 'robots', content: 'index, follow' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'alternate', type: 'application/rss+xml', title: 'RSS Feed — Fajri Gariskode', href: '/rss.xml' },
      ],
    },
  },

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    name: 'Fajri Gariskode',
    description: 'Blog dokumentasi pembelajaran, profile, dan CV. Tempat mencatat perjalanan belajar dan berbagi pengetahuan.',
    defaultLocale: 'id',
  },

  // Sitemap: exclude admin pages
  sitemap: {
    exclude: ['/admin/**', '/admin'],
  },

  // Robots: block admin crawling
  robots: {
    disallow: ['/admin'],
  },

  // OG Image defaults
  ogImage: {
    defaults: {
      width: 1200,
      height: 630,
    },
  },
})
