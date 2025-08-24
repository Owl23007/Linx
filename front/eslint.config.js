import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import vue from "eslint-plugin-vue";
import stylistic from "@stylistic/eslint-plugin"; // 👈 引入格式化插件
import { defineConfig } from "eslint/config";

export default defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs["flat/essential"],

  // 格式化规则
  {
    files: ["**/*.{js,ts,jsx,tsx,vue}"],
    plugins: {
      "@stylistic": stylistic, 
    },
    rules: {
      // 缩进：2 个空格
      "@stylistic/indent": ["error", 2],

      // 分号：结尾必须有分号
      "@stylistic/semi": ["error", "always"],

      // 引号：使用单引号
      "@stylistic/quotes": ["error", "single"],

      // 逗号结尾：多行模式下必须有尾逗号
      "@stylistic/comma-dangle": ["error", "only-multiline"],

      // 空格：对象键值对冒号后有一个空格
      "@stylistic/key-spacing": ["error", { afterColon: true }],

      // 对象字面量大括号内侧空格
      "@stylistic/object-curly-spacing": ["error", "always"],

      // 数组中括号内侧空格
      "@stylistic/array-bracket-spacing": ["error", "never"],

      // 函数名与括号之间不能有空格
      "@stylistic/space-before-function-paren": [
        "error",
        {
          anonymous: "never",
          named: "never",
          asyncArrow: "always"
        }
      ],

      // 操作符两侧空格
      "@stylistic/space-infix-ops": "error",

      // 关键字前后空格
      "@stylistic/keyword-spacing": "error",

      // 行尾空格禁止
      "@stylistic/no-trailing-spaces": "error",

      // 文件末尾换行
      "@stylistic/eol-last": ["error", "always"],
    },
  },

  // 全局环境
  {
    files: ["**/*.{js,ts,vue}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  // Vue 文件使用 TypeScript 解析器
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vue.parser,
      parserOptions: {
        parser: tseslint.parser,
        sourceType: "module",
        ecmaVersion: "latest",
        extraFileExtensions: [".vue"],
      },
    },
  },
]);