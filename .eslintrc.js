module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'playwright'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:playwright/recommended',
    'prettier',
  ],
  rules: {
    // TypeScript-specific
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    '@typescript-eslint/naming-convention': [
      'error',
      { selector: 'interface', format: ['PascalCase'] },
      { selector: 'typeAlias', format: ['PascalCase'] },
      { selector: 'enum', format: ['PascalCase'] },
      { selector: 'enumMember', format: ['UPPER_CASE'] },
      { selector: 'class', format: ['PascalCase'] },
    ],

    // Playwright-specific
    'playwright/no-wait-for-timeout': 'error',
    'playwright/no-force-option': 'warn',
    'playwright/prefer-web-first-assertions': 'error',
    'playwright/no-conditional-in-test': 'warn',
    'playwright/no-useless-await': 'error',

    // General
    'no-console': 'warn',
    eqeqeq: ['error', 'always'],
    'prefer-const': 'error',
    'no-var': 'error',
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'allure-results/',
    'allure-report/',
    'playwright-report/',
    'test-results/',
    '*.config.js',
    '.eslintrc.js',
  ],
};
