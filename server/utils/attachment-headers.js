const path = require('path');

// Keys are `attachment.image.thumbnailsExtension`, i.e. the `sharp` output format ('jpeg'
// being stored as 'jpg'). Formats `sharp` may report that are not listed here (`svg`,
// `magick`, `raw`, ...) fall back to a download on purpose.
const MIME_TYPE_BY_IMAGE_FORMAT = {
  jpg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  tiff: 'image/tiff',
  heif: 'image/heif',
  jp2: 'image/jp2',
  jxl: 'image/jxl',
};

const PDF_MIME_TYPE = 'application/pdf';
const OPAQUE_MIME_TYPE = 'application/octet-stream';

// Types that may be rendered by the browser instead of downloaded. Every entry must be a
// format that cannot script against our origin. Never add `text/html`, `image/svg+xml` or
// `application/xhtml+xml` here
const INLINE_MIME_TYPES = new Set([...Object.values(MIME_TYPE_BY_IMAGE_FORMAT), PDF_MIME_TYPE]);

// Defense in depth: even if a type ever slips through, nothing in the response can execute or reach back into the session
const CONTENT_SECURITY_POLICY =
  "default-src 'none'; img-src 'self'; media-src 'self'; object-src 'self'; frame-ancestors 'self'";

const getImageMimeType = (image) =>
  (image && MIME_TYPE_BY_IMAGE_FORMAT[image.thumbnailsExtension]) || null;

const getMimeType = (attachment) => {
  const imageMimeType = getImageMimeType(attachment.image);

  if (imageMimeType) {
    return imageMimeType;
  }

  // `.pdf` is trusted by extension only: the type is on the inline allow list, and a file
  // that is not really a PDF just fails to render in the (sandboxed) viewer. `nosniff`
  // keeps the browser from second-guessing us and treating it as HTML
  if (path.extname(attachment.filename).toLowerCase() === '.pdf') {
    return PDF_MIME_TYPE;
  }

  return OPAQUE_MIME_TYPE;
};

// `attachment.name` is uploader-controlled, so it only ever goes out RFC 5987 encoded, which also rules out header injection
const buildContentDisposition = (attachment, mimeType) => {
  const disposition = INLINE_MIME_TYPES.has(mimeType) ? 'inline' : 'attachment';

  return `${disposition}; filename*=UTF-8''${encodeURIComponent(attachment.name)}`;
};

const buildHeaders = (attachment) => {
  const mimeType = getMimeType(attachment);

  return {
    'Content-Type': mimeType,
    'Content-Disposition': buildContentDisposition(attachment, mimeType),
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': CONTENT_SECURITY_POLICY,
  };
};

const buildThumbnailHeaders = (attachment) => ({
  // Thumbnails are re-encoded by `sharp`, but in the *input* format, so the extension the thumbnail was written with is what the bytes actually are.
  'Content-Type': getImageMimeType(attachment.image) || OPAQUE_MIME_TYPE,
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
});

module.exports = {
  MIME_TYPE_BY_IMAGE_FORMAT,
  INLINE_MIME_TYPES,
  getMimeType,
  buildHeaders,
  buildThumbnailHeaders,
};
