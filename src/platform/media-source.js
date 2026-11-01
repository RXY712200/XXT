/** A source declaration is identity evidence, not proof that decoding will succeed. */
function url(value, base) {
  if (!value?.trim()) return null;
  try {
    const parsed = new URL(value, base);
    return ['https:', 'http:', 'blob:'].includes(parsed.protocol) ||
      parsed.protocol === 'data:' && /^data:(audio|video)\//i.test(value) ? parsed.href : null;
  } catch { return null; }
}

export function captureMediaSource(media) {
  const attribute = media.getAttribute('src');
  const children = [...media.children].filter(node => node.tagName === 'SOURCE').map(node =>
    Object.freeze({ node, src: node.getAttribute('src'), type: node.getAttribute('type'), media: node.getAttribute('media') }));
  const declarations = attribute?.trim() ? [url(attribute, media.baseURI)] : children.map(item => url(item.src, media.baseURI));
  const rawCurrent = media.currentSrc || '', current = url(rawCurrent, media.baseURI);
  const urls = [...new Set(declarations)];
  const declared = declarations.length > 0;
  const object = media.srcObject || null;
  const usable = !object && !(rawCurrent && !current) &&
    (declared ? urls.length === 1 && Boolean(urls[0]) && (!current || current === urls[0]) : Boolean(current));
  return Object.freeze({ attribute, base: media.baseURI, children: Object.freeze(children),
    selected: current, object, identity: usable ? (declared ? urls[0] : current) : null, usable });
}

/** Permit only initial selection of the same declared URL, never a different source. */
export function matchesMediaSource(expected, media) {
  const fresh = captureMediaSource(media);
  return fresh.attribute === expected.attribute && fresh.base === expected.base && fresh.object === expected.object &&
    fresh.children.length === expected.children.length && fresh.children.every((item, i) => {
      const old = expected.children[i];
      return item.node === old.node && item.src === old.src && item.type === old.type && item.media === old.media;
    }) && fresh.identity === expected.identity && fresh.usable === expected.usable &&
    (expected.selected ? fresh.selected === expected.selected : !fresh.selected || fresh.selected === expected.identity);
}
