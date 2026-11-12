// Run the local server on the same Node target used by production so MongoDB
// can use the Node.js networking APIs during development.
process.env.NITRO_PRESET = "node_server";
const { createServer } = await import("vite");
const server = await createServer({ server: { host: "0.0.0.0" } });
await server.listen();
server.printUrls();
