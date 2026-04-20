import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import security from 'eslint-plugin-security'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { security },
    rules: {
      ...security.configs.recommended.rules,
      // Too noisy with dynamic object access patterns (Zustand stores, etc.)
      'security/detect-object-injection': 'off',
    },
  },
  {
    // Downgrade React 19 strict rules to warnings for gradual migration
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
    },
  },
  {
    // @tanstack/react-table 8.x calls factory functions inline
    // (getCoreRowModel: getCoreRowModel()) which the React 19 compiler
    // can't optimize through. The library API is documented this way;
    // a fix requires a react-table version that exposes pre-built models
    // or memoizes the factory result. Suppress the rule for table files
    // until that lands.
    files: [
      'components/notes-table/**/*.tsx',
      'components/fixture-data-viewer.tsx',
    ],
    rules: {
      'react-hooks/incompatible-library': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])

export default eslintConfig
