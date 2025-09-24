import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import reactCompiler from "eslint-plugin-react-compiler";
import tseslint from "typescript-eslint";
import { globalIgnores } from "eslint/config";
import configPrettier from "eslint-config-prettier/flat";
import unicorn from "eslint-plugin-unicorn";

export default tseslint.config([
    globalIgnores(["dist"]),
    //Base rules
    {
        files: ["**/*.{js,jsx,ts,tsx}", "../whos_that_server/**/*.{js,jsx,ts,tsx}"],
        extends: [
            js.configs.recommended,
            tseslint.configs.strictTypeChecked,
            tseslint.configs.stylisticTypeChecked,
            unicorn.configs.all,
            configPrettier,
        ],
        rules: {
            "unicorn/filename-case": "off",
            "unicorn/prevent-abbreviations": "off",
            "unicorn/no-array-for-each": "off",
            "@typescript-eslint/consistent-indexed-object-style": ["error", "index-signature"],
        },
        languageOptions: {
            ecmaVersion: 2020,
            parserOptions: {
                project: ["./tsconfig.app.json", "./tsconfig.node.json"],
            },
        },
    },
    //Frontend-specific rules
    {
        files: ["**/*.{jsx,tsx}"],
        extends: [
            pluginReact.configs.flat.recommended,
            pluginReact.configs.flat["jsx-runtime"],
            reactHooks.configs["recommended-latest"],
            reactCompiler.configs.recommended,
            reactRefresh.configs.vite,
        ],
        languageOptions: {
            globals: globals.browser,
        },
        settings: {
            react: {
                version: "detect",
                runtime: "automatic",
            },
        },
    },
    //Backend-specific rules
    {
        files: ["../whos_that_server/**/*.{js,ts}"],
        languageOptions: {
            globals: globals.node,
        },
    },
]);
