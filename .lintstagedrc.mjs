import path from 'node:path';

const buildEslintCommand = (filenames) =>
  `eslint --fix ${filenames.map((f) => `"${path.relative(process.cwd(), f)}"`).join(' ')}`;

// Direct `prettier --write <127 files>` exceeds the Windows cmd.exe 8191-char
// limit during large commits — the wrapper re-invokes prettier in chunks.
export default {
  '*.{js,jsx,ts,tsx}': [buildEslintCommand, 'node scripts/prettier-staged.mjs'],
  '*.{json,md,css,mjs,cjs}': ['node scripts/prettier-staged.mjs'],
};
