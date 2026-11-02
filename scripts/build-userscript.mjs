import { pathToFileURL } from 'node:url';
import { verifyCanonical, verifyDistribution, retireRewriteArtifact, artifactPath } from './canonical-runtime.mjs';
export { artifactPath };
export function verifyArtifact() { return verifyDistribution().report.artifactDiskSha256; }
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.argv.includes('--check')) { verifyCanonical();retireRewriteArtifact(); }
  console.log('VERIFIED EXTERNAL CANONICAL RUNTIME (no XXT bundle generated)');
  console.log(JSON.stringify(verifyDistribution().report,null,2));
}
