import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: [],
  project: ['src/app/**/*.tsx'],
  ignoreDependencies: ['postcss', 'eslint', 'eslint-config-next', 'tailwindcss'],
};

export default config;