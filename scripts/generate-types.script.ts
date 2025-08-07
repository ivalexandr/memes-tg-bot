import { Project } from 'ts-morph';
import path from 'path';
import fs from 'fs';

const baseDir = path.resolve('src');
const outputFile = path.join(baseDir, 'types.ts');

const project = new Project({
  tsConfigFilePath: path.join(baseDir, '..', 'tsconfig.json'),
});

const sourceFiles = project.getSourceFiles(`${baseDir}/**/*.ts`);

const symbols = new Set<string>();

for (const sourceFile of sourceFiles) {
  const classes = sourceFile.getClasses();

  for (const cls of classes) {
    const decorators = cls.getDecorators();
    const hasInjectable = decorators.some((d) => d.getName() === 'injectable');
    if (hasInjectable) {
      const name = cls.getName();
      if (name) {
        symbols.add(name);
      }
    }
  }
}

const content =
  `// ⚠️ THIS FILE IS AUTO-GENERATED. DO NOT EDIT BY HAND.\n` +
  `export const TYPES = {\n` +
  Array.from(symbols)
    .sort()
    .map((name) => `  ${name}: Symbol.for('${name}'),`)
    .join('\n') +
  `\n} as const;\n`;

fs.writeFileSync(outputFile, content, 'utf-8');
console.log(`✅ TYPES written to ${outputFile}`);
