/**@type { import("drizzle-kit").Config} */
export default({
  schema: "./utils/schema.js",
  dialect: "postgresql",
  dbCredentials: {
    url:'postgresql://neondb_owner:npg_9nFJRSTOV5ak@ep-cold-dream-ad0kctj5-pooler.c-2.us-east-1.aws.neon.tech/intervuAI?sslmode=require&channel_binding=require',
  }
});