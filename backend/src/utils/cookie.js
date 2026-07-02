const COOKIE_NAME = 'token';

// Parses durations like "7d", "12h", "30m", "45s" (as used by JWT_EXPIRES_IN)
// into milliseconds for the cookie's maxAge. Falls back to 7 days.
const parseDurationToMs = (value) => {
  const DAY = 24 * 60 * 60 * 1000;
  const match = /^(\d+)\s*([smhd])$/i.exec(String(value).trim());
  if (!match) return 7 * DAY;

  const amount = Number(match[1]);
  const unitMs = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: DAY };
  return amount * unitMs[match[2].toLowerCase()];
};

const baseCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
});

const setAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, {
    ...baseCookieOptions(),
    maxAge: parseDurationToMs(process.env.JWT_EXPIRES_IN || '7d'),
  });
};

const clearAuthCookie = (res) => {
  res.clearCookie(COOKIE_NAME, baseCookieOptions());
};

module.exports = { COOKIE_NAME, setAuthCookie, clearAuthCookie };
