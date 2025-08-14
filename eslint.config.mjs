import next from '@next/eslint-plugin-next'
import tsParser from '@typescript-eslint/parser'

export default [
  {
    ignores: ['.next/**']
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } }
    },
    plugins: {
      '@next/next': next
    },
    rules: {
      ...next.configs['core-web-vitals'].rules
    }
  }
]
