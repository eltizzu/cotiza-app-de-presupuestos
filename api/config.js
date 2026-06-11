module.exports = function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  res.status(200).json({
    SUPABASE_URL: process.env.SUPABASE_URL || "",
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
    SENTRY_DSN: process.env.SENTRY_DSN || "",
    SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT || process.env.VERCEL_ENV || "production",
  });
};
