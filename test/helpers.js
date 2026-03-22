/**
 * Load a non-module script into the test global scope.
 * This mimics how Thunderbird loads background.scripts — each file
 * executes in a shared global context.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import vm from 'vm';

export function loadScript(relativePath) {
  const absPath = resolve(relativePath);
  const code = readFileSync(absPath, 'utf-8');
  vm.runInThisContext(code, { filename: absPath });
}
