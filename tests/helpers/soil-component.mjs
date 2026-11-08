import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import * as soil from '../../lib/vegetable-soil.ts';

const require = createRequire(import.meta.url);
const styles = new Proxy({}, { get: (_, key) => key === '__esModule' ? false : `soil-${String(key)}` });
const source = readFileSync(new URL('../../components/VegetableSoilGuidance.tsx', import.meta.url), 'utf8');
const code = ts.transpileModule(source, {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
const exports = {};
vm.runInNewContext(code, { exports, require: name => ({
  '@/lib/vegetable-soil': soil,
  './VegetableSoilGuidance.module.css': styles,
}[name] || require(name)) });

export const SoilGuidance = exports.default;
export const soilComponentSource = source;
