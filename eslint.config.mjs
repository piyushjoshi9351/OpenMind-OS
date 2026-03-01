import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

export default [
  ...nextCoreWebVitals,
  {
    files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/use-memo': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'import/no-anonymous-default-export': 'off',
      '@next/next/no-page-custom-font': 'off',
    },
  },
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'backend/.venv/**',
      'backend/.pytest_cache/**',
      'backend/__pycache__/**',
      'dist/**',
      'coverage/**',
    ],
  },
];