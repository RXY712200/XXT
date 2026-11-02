import { execFileSync } from 'node:child_process';
import { Script } from 'node:vm';
import { resolve } from 'node:path';
import { root, verifyDistribution } from './canonical-runtime.mjs';
const result=verifyDistribution();
for(const file of ['src/entry.js','scripts/canonical-runtime.mjs','scripts/build-userscript.mjs','scripts/check.mjs','tests/canonical-runtime.test.js'])
  execFileSync(process.execPath,['--check',resolve(root,file)]);
new Script(result.source.toString(),{filename:'pinned-v3-source.js'});
new Script(result.artifact.toString(),{filename:'pinned-v3-installable.user.js'});
console.log('PASS active tooling and unchanged canonical source/installable syntax, metadata, hashes, build integrity and retired XXT entry');
