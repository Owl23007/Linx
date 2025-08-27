import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import vue from 'eslint-plugin-vue';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  // 全局忽略配置
  {
    ignores: ['public/**/*', 'dist/**/*', 'node_modules/**/*'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/essential'],

  // 格式化规则
  {
    files: ['**/*.{js,ts,jsx,tsx,vue}'],
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      // 缩进：2 个空格
      '@stylistic/indent': ['error', 2],

      // 分号：结尾必须有分号
      '@stylistic/semi': ['error', 'always'],

      // 引号：使用单引号
      '@stylistic/quotes': ['error', 'single'],

      // 逗号结尾：多行模式下必须有尾逗号
      '@stylistic/comma-dangle': ['error', 'only-multiline'],

      // 空格：对象键值对冒号后有一个空格
      '@stylistic/key-spacing': ['error', { afterColon: true }],

      // 对象字面量大括号内侧空格
      '@stylistic/object-curly-spacing': ['error', 'always'],

      // 数组中括号内侧空格
      '@stylistic/array-bracket-spacing': ['error', 'never'],

      // 函数名与括号之间不能有空格
      '@stylistic/space-before-function-paren': [
        'error',
        {
          anonymous: 'never',
          named: 'never',
          asyncArrow: 'always'
        }
      ],

      // 操作符两侧空格
      '@stylistic/space-infix-ops': 'error',

      // 关键字前后空格
      '@stylistic/keyword-spacing': 'error',

      // 行尾空格禁止
      '@stylistic/no-trailing-spaces': 'error',

      // 文件末尾换行
      '@stylistic/eol-last': ['error', 'always'],

      // 删除多余连续空行
      '@stylistic/no-multiple-empty-lines': [
        'error',
        {
          max: 1, // 最多允许 1 个连续空行
          maxEOF: 0, // 文件末尾不允许空行
          maxBOF: 0  // 文件开头不允许空行
        }
      ],

      // 限制块语句前后的空行
      '@stylistic/padding-line-between-statements': [
        'error',
        // 导入语句后需要空行
        { blankLine: 'always', prev: 'import', next: '*' },
        { blankLine: 'any', prev: 'import', next: 'import' },
        // return 语句前需要空行
        { blankLine: 'always', prev: '*', next: 'return' },
        // 函数声明前后需要空行
        { blankLine: 'always', prev: '*', next: 'function' },
        { blankLine: 'always', prev: 'function', next: '*' },
        // 类声明前后需要空行
        { blankLine: 'always', prev: '*', next: 'class' },
        { blankLine: 'always', prev: 'class', next: '*' }
      ],
    },
  },

  // 全局环境
  {
    files: ['**/*.{js,ts,vue}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'warn',
      'no-debugger': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // CommonJS 文件 (如 Electron 主进程)
  {
    files: ['**/*.cjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      sourceType: 'commonjs',
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off',
    },
  },

  // Vue 文件使用 TypeScript 解析器
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vue.parser,
      parserOptions: {
        parser: tseslint.parser,
        sourceType: 'module',
        ecmaVersion: 'latest',
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
]);
