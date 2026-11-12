// Keep local builds runnable with Node.js, but emit Vercel's native functions
// and static output when CI builds the app on Vercel.
if (process.env.VERCEL === "1") {
  process.env.NITRO_PRESET = "vercel";
} else {
  process.env.NITRO_PRESET ??= "node_server";
}
const { build } = await import("vite");
await build({ mode: process.argv.includes("--dev") ? "development" : "production" });
