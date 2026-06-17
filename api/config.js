module.exports = function handler(req, res) {
  if (req.method && req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  res.setHeader("Cache-Control", "no-store");

  res.status(200).json({
    SUPABASE_URL: process.env.SUPABASE_URL || "",
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
    SENTRY_DSN: process.env.SENTRY_DSN || "",
    SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT || process.env.VERCEL_ENV || "production",
  });
};
