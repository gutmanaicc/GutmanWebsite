import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import ts from 'typescript';

/** Compile Vercel-style TypeScript handlers into root .self-hosted-api/*.js.
 * Their relative .js helper imports then resolve normally in Node24 ESM.
 * No TS stripping flags or extension-rewriting runtime hooks are needed.
 */
export async function buildSelfHostedApis({ root = fileURLToPath(new URL('../', import.meta.url)), outputDirectory = resolve(root, '.self-hosted-api') } = {}) {
  await mkdir(outputDirectory, { recursive: true });
  const files = (await readdir(resolve(root, 'api'))).filter(name => name.endsWith('.ts')).sort();
  for (const name of files) {
    const source = await readFile(resolve(root, 'api', name), 'utf8');
    const result = ts.transpileModule(source, { fileName: name, reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, isolatedModules: true, sourceMap: false, removeComments: false } });
    if (result.diagnostics?.some(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error)) throw new Error(`API compilation failed for ${name}.`);
    await writeFile(resolve(outputDirectory, name.replace(/\.ts$/, '.js')), result.outputText, { mode: 0o644 });
  }
  return files.map(name => name.replace(/\.ts$/, '.js'));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const files = await buildSelfHostedApis();
  console.log(`Compiled ${files.length} API modules for standalone Node24.`);
}
