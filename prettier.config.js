// ============================================================================
// 🎨 PITCHCONNECT PRETTIER CONFIGURATION
// ============================================================================
// Code formatting consistency across the entire codebase
// Integrates with: Tailwind CSS, TypeScript, React, Prisma
// ============================================================================

/** @type {import("prettier").Config} */
const config = {
  // ==========================================================================
  // 📏 SPACING & INDENTATION
  // ==========================================================================

  // Use spaces instead of tabs for indentation
  useTabs: false,

  // Number of spaces per indentation level
  tabWidth: 2,

  // Print width - line length before wrapping
  // 100 is a good balance for modern wide screens while maintaining readability
  printWidth: 100,

  // ==========================================================================
  // 🔤 QUOTES & STRINGS
  // ==========================================================================

  // Use single quotes instead of double quotes
  singleQuote: true,

  // Use single quotes in JSX (consistent with JS)
  jsxSingleQuote: false,

  // Change when properties in objects are quoted
  // "as-needed" - only add quotes around object properties where required
  quoteProps: 'as-needed',

  // ==========================================================================
  // 📝 PUNCTUATION & SYNTAX
  // ==========================================================================

  // Add semicolons at the end of statements
  semi: true,

  // Print trailing commas wherever possible (ES5+)
  // "all" - trailing commas in function parameters, arguments, etc.
  // Helps with cleaner git diffs
  trailingComma: 'all',

  // Print spaces between brackets in object literals
  // { foo: bar } instead of {foo: bar}
  bracketSpacing: true,

  // Put the > of a multi-line JSX element at the end of the last line
  // instead of being alone on the next line
  bracketSameLine: false,

  // Include parentheses around a sole arrow function parameter
  // "always" - (x) => x instead of x => x
  arrowParens: 'always',

  // ==========================================================================
  // 📄 FILE HANDLING
  // ==========================================================================

  // Line endings - use LF (Unix style) for cross-platform consistency
  endOfLine: 'lf',

  // Preserve line breaks in HTML/JSX (useful for complex layouts)
  htmlWhitespaceSensitivity: 'css',

  // Wrap prose (markdown) at print width
  proseWrap: 'preserve',

  // Indent code inside <script> and <style> tags in Vue/HTML files
  vueIndentScriptAndStyle: false,

  // Whether to format embedded code (like CSS in styled-components)
  embeddedLanguageFormatting: 'auto',

  // Enforce single attribute per line in HTML, Vue and JSX
  // Makes diffs cleaner and improves readability
  singleAttributePerLine: false,

  // ==========================================================================
  // 🔌 PLUGINS
  // ==========================================================================

  plugins: [
    // Tailwind CSS class sorting plugin
    // Automatically sorts Tailwind classes in a consistent order
    // Must be loaded LAST as per Tailwind documentation
    'prettier-plugin-tailwindcss',
  ],

  // ==========================================================================
  // 🎨 TAILWIND CSS PLUGIN CONFIGURATION
  // ==========================================================================

  // Path to Tailwind config file (auto-detected if not specified)
  // tailwindConfig: './tailwind.config.ts',

  // Custom attributes to sort (in addition to 'class' and 'className')
  tailwindAttributes: ['class', 'className', 'cn', 'clsx', 'cva', 'tw'],

  // Functions whose arguments should be sorted as Tailwind classes
  tailwindFunctions: ['cn', 'clsx', 'cva', 'twMerge', 'twJoin'],

  // ==========================================================================
  // 📁 FILE-SPECIFIC OVERRIDES
  // ==========================================================================

  overrides: [
    // JSON files - smaller indent for compact display
    {
      files: ['*.json', '.prettierrc', '.eslintrc'],
      options: {
        tabWidth: 2,
        trailingComma: 'none',
      },
    },

    // Package.json - specific formatting
    {
      files: 'package.json',
      options: {
        tabWidth: 2,
        trailingComma: 'none',
      },
    },

    // Markdown files - wrap prose for better readability
    {
      files: ['*.md', '*.mdx'],
      options: {
        proseWrap: 'always',
        printWidth: 80,
      },
    },

    // YAML files (GitHub Actions, Docker Compose, etc.)
    {
      files: ['*.yml', '*.yaml'],
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },

    // Prisma schema files
    {
      files: '*.prisma',
      options: {
        tabWidth: 2,
      },
    },

    // CSS/SCSS files
    {
      files: ['*.css', '*.scss', '*.sass'],
      options: {
        singleQuote: false,
        tabWidth: 2,
      },
    },

    // HTML files
    {
      files: ['*.html'],
      options: {
        printWidth: 120,
        htmlWhitespaceSensitivity: 'ignore',
      },
    },

    // TypeScript declaration files
    {
      files: ['*.d.ts'],
      options: {
        // Keep declarations readable
        printWidth: 120,
      },
    },

    // Test files - slightly wider for test descriptions
    {
      files: ['*.test.ts', '*.test.tsx', '*.spec.ts', '*.spec.tsx'],
      options: {
        printWidth: 100,
      },
    },

    // Config files in root
    {
      files: [
        '*.config.js',
        '*.config.ts',
        '*.config.mjs',
        '*.config.cjs',
        'tailwind.config.*',
        'next.config.*',
        'vitest.config.*',
        'playwright.config.*',
      ],
      options: {
        printWidth: 100,
      },
    },
  ],
};

export default config;