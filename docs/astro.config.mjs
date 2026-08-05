// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://awesomeb.app',
  integrations: [
    starlight({
      title: 'AwesomeB',
      logo: {
        src: './src/assets/logo.png'
      },
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
      head: [
        {
          tag: 'script',
          attrs: {
            src: 'https://www.googletagmanager.com/gtag/js?id=G-NM14L4ZQSH',
            async: true,
          },
        },
        {
          tag: 'script',
          content: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){ dataLayer.push(arguments); }
        gtag('js', new Date());
        gtag('config', 'G-NM14L4ZQSH');
      `,
        },
      ],
      sidebar: [
        {
          label: 'Start here',
          translations: { 'ca': 'Comença aquí', 'es': 'Empieza aquí' },
          items: [
            { label: 'Overview', translations: { 'ca': 'Visió general', 'es': 'Visión general' }, slug: 'overview' },
            { label: 'About me', translations: { 'ca': 'Sobre mi', 'es': 'Sobre mi' }, slug: 'aboutme' },
            { label: 'Install', translations: { 'ca': 'Instal·lar', 'es': 'Instalar' }, slug: 'install' },
            { label: 'First steps', translations: { 'ca': 'Primeres passes', 'es': 'Primeros pasos' }, slug: 'firststeps' },
          ]
        },
        {
          label: 'Configuration',
          translations: { 'ca': 'Configuració', 'es': 'Configuración' },
          items: [
            { label: 'General', translations: { 'ca': 'General', 'es': 'General' }, slug: 'config/general' },
            { label: 'Profiles', translations: { 'ca': 'Perfils', 'es': 'Perfils' }, slug: 'config/profiles' },
            { label: 'Themes', translations: { 'ca': 'Temes', 'es': 'Temas' }, slug: 'config/themes' },
            { label: 'Permissions', translations: { 'ca': 'Permisos', 'es': 'Permisos' }, slug: 'config/permissions' },
            { label: 'Shortcuts', translations: { 'ca': 'Dreceres', 'es': 'Atajos' }, slug: 'config/shortcuts' },
          ]
        },
        { label: 'Commands', translations: { 'ca': 'Comandes', 'es': 'Comandos' }, slug: 'commands' },
        {
          label: 'Tabs',
          translations: { 'ca': 'Pestanyes', 'es': 'Pestaña' },
          items: [
            { label: 'New', translations: { 'ca': 'Nova', 'es': 'Nueva' }, slug: 'tabs/new' },
            { label: 'Close', translations: { 'ca': 'Tancar', 'es': 'Cerrar' }, slug: 'tabs/close' },
            { label: 'Reopen', translations: { 'ca': 'Reobrir', 'es': 'Reabrir' }, slug: 'tabs/closed' },
            { label: 'Navigate', translations: { 'ca': 'Navegar', 'es': 'Navegar' }, slug: 'tabs/navigate' },
            { label: 'Rename', translations: { 'ca': 'Renombrar', 'es': 'Renombrar' }, slug: 'tabs/rename' },
            { label: 'Copy URL', translations: { 'ca': 'Copiar la URL', 'es': 'Copiar la URL' }, slug: 'tabs/copy-url' },
            { label: 'Edit URL', translations: { 'ca': 'Editar la URL', 'es': 'Editar la URL' }, slug: 'tabs/edit-url' },
            { label: 'Move', translations: { 'ca': 'Moure', 'es': 'Mover' }, slug: 'tabs/move' },
          ]
        },
      ]
    }),
  ],
});
