import nextPlugin from '@next/eslint-plugin-next'

export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      next: nextPlugin
    },
    rules: {
      'next/core-web-vitals': 'error'
    }
  }
]
