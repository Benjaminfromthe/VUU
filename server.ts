import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// Obtain correct folder references securely
const __filename = typeof __dirname !== "undefined" ? "" : fileURLToPath(import.meta.url);
const __dirname_resolved = typeof __dirname !== "undefined" ? __dirname : path.dirname(__filename);

const app = express();
const PORT = 3000;

// Set up server-side static page serving to be 100% resilient
app.use(express.static(__dirname_resolved)); 
app.use(express.static(process.cwd()));
app.use(express.static(path.join(process.cwd(), "dist")));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Static server running on http://localhost:${PORT}`);
});
