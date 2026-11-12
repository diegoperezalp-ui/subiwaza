// MongoDB's Node driver needs a Node.js server target at production runtime.
process.env.NITRO_PRESET = "node_server";
const { build } = await import("vite");
await build({ mode: process.argv.includes("--dev") ? "development" : "production" });
