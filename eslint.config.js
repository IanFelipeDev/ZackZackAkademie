import js from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const SAME_FEATURE = { feature: '{{ from.element.captured.feature }}' };

const featureLayer = (layer) => ({
  type: `feature-${layer}`,
  pattern: `src/features/*/${layer}`,
  capture: ['feature'],
});

/**
 * Dependency rule from docs/ARCHITECTURE.md §4.2 and §5. Each feature's index.ts is left unclassified on purpose:
 * it is the feature's public API, so importing it from another feature is allowed while its layers are not.
 */
const layerPolicies = [
  {
    from: { element: { type: 'feature-domain' } },
    allow: {
      to: [
        { element: { type: 'feature-domain', captured: SAME_FEATURE } },
        { element: { type: 'shared-domain' } },
      ],
    },
  },
  {
    from: { element: { type: 'feature-application' } },
    allow: {
      to: [
        {
          element: {
            types: { anyOf: ['feature-domain', 'feature-application'] },
            captured: SAME_FEATURE,
          },
        },
        { element: { type: 'shared-domain' } },
      ],
    },
  },
  {
    from: { element: { type: 'feature-infrastructure' } },
    allow: {
      to: [
        {
          element: {
            types: { anyOf: ['feature-domain', 'feature-application', 'feature-infrastructure'] },
            captured: SAME_FEATURE,
          },
        },
        { element: { types: { anyOf: ['shared-domain', 'shared-infrastructure'] } } },
      ],
    },
  },
  {
    from: { element: { type: 'feature-presentation' } },
    allow: {
      to: [
        {
          element: {
            types: { anyOf: ['feature-domain', 'feature-application', 'feature-presentation'] },
            captured: SAME_FEATURE,
          },
        },
        { element: { types: { anyOf: ['shared-domain', 'shared-ui', 'app-context'] } } },
      ],
    },
  },
  {
    from: { element: { type: 'shared-infrastructure' } },
    allow: { to: { element: { types: { anyOf: ['shared-domain', 'shared-infrastructure'] } } } },
  },
  {
    from: { element: { type: 'shared-ui' } },
    allow: { to: { element: { types: { anyOf: ['shared-domain', 'shared-ui'] } } } },
  },
  {
    from: { element: { type: 'shared-domain' } },
    allow: { to: { element: { type: 'shared-domain' } } },
  },
  {
    from: { element: { types: { anyOf: ['app', 'app-context'] } } },
    allow: { to: { element: { type: '*' } } },
  },
];

export default tseslint.config(
  {
    ignores: [
      'dist',
      'coverage',
      'playwright-report',
      'test-results',
      'supabase/.temp',
      // Deno entry points (Deno globals, npm: specifiers) are checked by the Supabase deploy, not by this toolchain.
      'supabase/functions/**/index.ts',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // react-hook-form's handleSubmit returns a promise by design.
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: { alwaysTryTypes: true } },
      'boundaries/elements': [
        featureLayer('domain'),
        featureLayer('application'),
        featureLayer('infrastructure'),
        featureLayer('presentation'),
        { type: 'shared-domain', pattern: 'src/shared/domain' },
        { type: 'shared-infrastructure', pattern: 'src/shared/infrastructure' },
        { type: 'shared-ui', pattern: 'src/shared/ui' },
        { type: 'app-context', pattern: 'src/app/context' },
        { type: 'app', pattern: 'src/app' },
      ],
    },
    rules: {
      'boundaries/dependencies': ['error', { default: 'disallow', policies: layerPolicies }],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@supabase/*'],
              message: 'Only infrastructure code may talk to Supabase (ARCHITECTURE §4.2).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/infrastructure/**/*.{ts,tsx}', 'src/app/container.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    // Inner layers stay framework-free and never reach into other features, not even their public API.
    files: [
      'src/features/*/domain/**/*.ts',
      'src/features/*/application/**/*.ts',
      'src/shared/domain/**/*.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@supabase/*'], message: 'Only infrastructure code may talk to Supabase.' },
            {
              group: ['react', 'react-*', '@tanstack/*'],
              message: 'Domain and application layers are framework-free.',
            },
            {
              group: ['@/features/*', '@/app/*'],
              message: 'Inner layers may only import their own feature and shared/.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  {
    files: ['*.config.{js,ts}', 'eslint.config.js'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },
  prettier,
);
