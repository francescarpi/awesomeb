// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'AwesomeB',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/francescarpi/awesomeb' }],
      favicon: '/public/favicon.png',
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        es: { label: 'Español', lang: 'es' },
        ca: { label: 'Català', lang: 'ca' },
      },
      customCss: [
        './src/styles/custom.css',
      ],
      sidebar: [
        {
          label: 'Start here',
          translations: { 'ca': 'Comença aquí', 'es': 'Empieza aquí' },
          items: [{ label: 'Overview', translations: { 'ca': 'Visió general', 'es': 'Visión general' }, slug: 'overview' }]
        }
      ],
    }),
  ],
});
