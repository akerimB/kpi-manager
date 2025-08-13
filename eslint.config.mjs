import next from '@next/eslint-plugin-next'

export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      next
    },
    rules: {
      'next/core-web-vitals': 'warn'
    }
  }
]
