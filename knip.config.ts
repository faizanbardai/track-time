import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  entry: ['src/app/**/*.{ts,tsx}'],
  project: ['src/**/*.{js,jsx,ts,tsx}', 'src/**/*.css'],
  ignoreDependencies: [
    'postcss',
    'eslint-config-next',
    'eslint-config-prettier',
    'eslint-plugin-prettier',
  ],
}

export default config
