import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
export default defineConfig({ site:'https://dejoski.github.io', base:'/central-florida-well-pros', integrations:[sitemap()], trailingSlash:'always' });
