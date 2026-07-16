import fs from 'fs';
import path from 'path';

const distDir = path.join(process.cwd(), 'dist', 'assets');
const files = fs.readdirSync(distDir);
const jsFile = files.find(f => f.endsWith('.js'));

if (jsFile) {
  const content = fs.readFileSync(path.join(distDir, jsFile), 'utf-8');
  console.log("JS file length:", content.length);
  // Basic check for Supabase URL
  console.log("Contains URL?", content.includes("xpert-backend-supabase"));
} else {
  console.log("No JS file found");
}
