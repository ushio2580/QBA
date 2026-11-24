const DEVELOPMENT_SESSION_SECRET = 'development-only-qba-session-secret-change-me';
const KNOWN_PLACEHOLDER_SECRETS = new Set([
  DEVELOPMENT_SESSION_SECRET,
  'replace-with-a-long-random-secret'
]);

export function resolveSessionSecret(env = process.env) {
  const configured = typeof env.SESSION_SECRET === 'string' ? env.SESSION_SECRET : '';
  const normalized = configured.trim();

  if (env.NODE_ENV === 'production') {
    const isKnownPlaceholder = KNOWN_PLACEHOLDER_SECRETS.has(normalized.toLowerCase());
    if (!normalized || configured.length < 32 || isKnownPlaceholder) {
      throw new Error('Production requires SESSION_SECRET to be set to a non-placeholder value of at least 32 characters.');
    }
    // Keep the configured value byte-for-byte unchanged so existing sessions remain valid.
    return configured;
  }

  return normalized ? configured : DEVELOPMENT_SESSION_SECRET;
}
