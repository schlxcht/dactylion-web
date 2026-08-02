import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

/*
 * Statik Next.js çıktısını tek klasörde taşımak için yardımcı araç.
 * React betiklerini korur; böylece kredi ve destek formları çalışmaya devam eder.
 * Eski site-mağaza satın alma betiği özellikle kaldırılmıştır.
 */
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const outDir = join(root, "out");
const publishDir = join(root, "publish");
const html = await readFile(join(outDir, "index.html"), "utf8");

await mkdir(publishDir, { recursive: true });
await cp(outDir, publishDir, { recursive: true, force: true });
await writeFile(join(publishDir, "404.html"), html, "utf8");

console.log(`Static player portal copied to ${publishDir}`);
