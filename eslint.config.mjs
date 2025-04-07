import tsEslint from 'typescript-eslint'
import eslintPluginVue from 'eslint-plugin-vue'
import vueEslintParser from 'vue-eslint-parser'
import stylistic from '@stylistic/eslint-plugin'
import js from '@eslint/js'
import globals from 'globals'

// https://eslint.vuejs.org/user-guide/#example-configuration-with-typescript-eslint-and-prettier
export default tsEslint.config([
  { ignores: ['src/renderer/vendor', 'build/**/*', 'dist/**/*', 'scripts/**/*', '_*/**/*'] },
  {
    name: 'Ray',

    extends: [
      js.configs.recommended,
      ...tsEslint.configs.recommended,
      ...eslintPluginVue.configs['flat/recommended'],
    ],

    plugins: {
      '@stylistic': stylistic,
    },

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
      parser: vueEslintParser,
      parserOptions: {
        parser: tsEslint.parser,
      },
    },

    rules: {
      eqeqeq: 'error',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-empty-function': 0,
      '@stylistic/semi': ['error', 'never'],
      '@stylistic/space-before-function-paren': ['error', {
        anonymous: 'always',
        named: 'never',
        asyncArrow: 'always',
      }],
      '@typescript-eslint/no-empty-function': 0,
      '@typescript-eslint/no-unused-vars': ['error', { caughtErrors: 'none' }],
      'vue/max-attributes-per-line': ['error', { singleline: 6 }],
      'vue/singleline-html-element-content-newline': 0,
    },
  }
])
