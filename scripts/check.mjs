import { execFileSync } from 'node:child_process';
import { Script } from 'node:vm';
import { resolve } from 'node:path';
import { root } from './canonical-runtime.mjs';
import {verifyTransplant} from './transplant-audit.mjs';
import {createArtifact,verifyArtifact} from './build-userscript.mjs';
const result=verifyTransplant();
for(const file of ['src/entry.js','scripts/canonical-runtime.mjs','scripts/build-userscript.mjs','scripts/transplant-audit.mjs','scripts/check.mjs','tests/transplanted-runtime.test.js','tests/helpers/transplant-page.js'])
  execFileSync(process.execPath,['--check',resolve(root,file)]);
new Script(result.entry,{filename:'XXT-entry.js'});
new Script(createArtifact(),{filename:'XXT.user.js'});verifyArtifact();
console.log('PASS active syntax/imports, transplant/provenance integrity, one entry, original permission boundaries and exact XXT installable');
