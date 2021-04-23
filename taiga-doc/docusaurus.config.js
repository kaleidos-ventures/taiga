/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'Taiga Doc',
  tagline: 'Taiga Technical Documentation',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'kaleidos-ventures', // Usually your GitHub org/user name.
  projectName: 'taiga', // Usually your repo name.
  url: 'https://kaleidos-ventures.github.io/', // github pages url
  baseUrl: '/', // docs public url
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
  },
  themeConfig: {
    navbar: {
      title: 'Taiga',
      logo: {
        alt: 'Taiga Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'doc',
          docId: 'getting-started',
          position: 'left',
          label: 'Docs',
        },
        {to: '/blog', label: 'Changelog', position: 'left'},
        {to: 'api', label: 'API', position: 'left'},
        {
          type: 'localeDropdown',
          position: 'right',
        },
        {
          href: 'https://github.com/kaleidos-ventures/taiga',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://tree.taiga.io/project/taiga/issues',
          label: 'Taiga',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Docs',
              to: '/docs/getting-started',
            },
            {
              label: 'Resources',
              href: 'https://resources.taiga.io/',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Twitter',
              href: 'https://twitter.com/taigaio',
            },
            {
              label: 'Taiga issues',
              href: 'https://tree.taiga.io/project/taiga/issues',
            },
            {
              label: 'Google groups',
              href: 'https://groups.google.com/g/taigaio',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/kaleidos-ventures/taiga',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Kaleidos Ventures SL.`,
    },
  },
  presets: [
    [
      'redocusaurus',
      {
        specs: [{
          routePath: '/api/',
          specUrl: './openapi.json',
        }],
      }
    ],
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl:
            'https://github.com/kaleidos-ventures/taiga/taiga-doc/edit/master/website/',
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          editUrl:
            'https://github.com/kaleidos-ventures/taiga/taiga-doc/edit/master/website/blog/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
  plugins: [
    [
      require.resolve("@easyops-cn/docusaurus-search-local"),
      {
        hashed: true,
      },
    ],
  ],
};
