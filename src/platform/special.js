// Evidence: pinned reference's published structural recognition. Never execution.
export function recognizeSpecial(owner, metadata = {}) {
  if (!owner.isConnected || owner.tagName !== 'IFRAME') return null;
  let doc, route; try { doc = owner.contentDocument; route = new URL(doc.URL); } catch { return null; }
  const book = route.protocol === 'https:' && /(^|\.)chaoxing\.com$/.test(route.hostname) && /^\/readsvr\/book\/mooc(?:\/|$)/.test(route.pathname);
  const module = metadata.module || metadata.type, matches = [];
  if (book && doc.querySelector('#reader .readerPager') && doc.querySelector('#pagejump')) {
    const seconds = Number(route.searchParams.get('timing')); if (Number.isSafeInteger(seconds) && seconds > 0 && seconds <= 86400) matches.push('timed-reader');
  } else if (book && module === 'insertbook' && doc.querySelector('#ReadWeb')) matches.push('book-knowledge-map');
  if (doc.querySelector('.swiper-container .swiper-slide') && doc.querySelector('audio')) matches.push('audio-slides');
  if (doc.querySelector('#hyperlink')) matches.push('hyperlink');
  if (module === 'insertflash') matches.push('legacy-multimedia');
  return matches.length === 1 ? Object.freeze({ kind: matches[0], executable: false, reason: `recognition-only-${matches[0]}` }) : null;
}
