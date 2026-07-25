import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const outDir = join(root, "out");
const publishDir = join(root, "publish");
const cssDir = join(outDir, "_next", "static", "chunks");

const htmlSource = await readFile(join(outDir, "index.html"), "utf8");
const cssFilename = (await import("node:fs/promises"))
  .readdir(cssDir)
  .then((files) => files.find((file) => file.endsWith(".css")));
const css = await readFile(join(cssDir, await cssFilename), "utf8");

const interactionScript = `
<script>
(() => {
  const menu = document.querySelector('.main-nav');
  const toggle = document.querySelector('.menu-toggle');
  toggle?.addEventListener('click', () => {
    const open = menu?.classList.toggle('main-nav--open');
    toggle.setAttribute('aria-expanded', String(Boolean(open)));
  });
  document.querySelectorAll('.main-nav a').forEach(link =>
    link.addEventListener('click', () => menu?.classList.remove('main-nav--open'))
  );

  const address = 'play.dactylion.net';
  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      document.querySelectorAll('.quick-action').forEach(el => {
        if (el.textContent?.includes('KOPYALA')) {
          const old = el.textContent;
          el.textContent = 'KOPYALANDI';
          setTimeout(() => el.textContent = old, 2200);
        }
      });
    } catch {}
  };
  document.querySelector('.hero .primary-button')?.addEventListener('click', copyAddress);
  document.querySelector('.quick-card:not(.quick-card--right)')?.addEventListener('click', copyAddress);

  const showNotice = () => {
    if (document.querySelector('.modal-backdrop')) return;
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = '<section class="notice-modal" role="dialog" aria-modal="true" aria-labelledby="notice-title"><button class="modal-close" type="button" aria-label="Pencereyi kapat">×</button><span class="brand-mark brand-mark--small" aria-hidden="true"><span>D</span></span><span class="red-label">HAZIRLIK AŞAMASINDA</span><h2 id="notice-title">Bu bölüm yakında açılacak.</h2><p>Kredi yükleme, oyuncu girişi ve oyun içi teslimat güvenli bir sunucu bağlantısı tamamlanmadan etkinleştirilmeyecek.</p><button class="primary-button modal-ok" type="button">ANLADIM</button></section>';
    const close = () => backdrop.remove();
    backdrop.addEventListener('click', event => {
      if (event.target === backdrop) close();
    });
    backdrop.querySelector('.modal-close')?.addEventListener('click', close);
    backdrop.querySelector('.modal-ok')?.addEventListener('click', close);
    document.body.append(backdrop);
  };

  [
    '.account-button',
    '.quick-card--right',
    '.product-footer button',
    '.community-section .primary-button',
    '.footer-links button'
  ].forEach(selector =>
    document.querySelectorAll(selector).forEach(button => button.addEventListener('click', showNotice))
  );
})();
</script>`;

let standalone = htmlSource
  .replace(/<link[^>]+rel="preload"[^>]*\/?>/g, "")
  .replace(/<link[^>]+rel="stylesheet"[^>]*\/?>/g, "")
  .replace(/<script[\s\S]*?<\/script>/g, "")
  .replaceAll('src="/dactylion-web/og.png"', 'src="og.png"')
  .replace("</head>", `<style>${css}</style></head>`)
  .replace("</body>", `${interactionScript}</body>`);

await mkdir(publishDir, { recursive: true });
await writeFile(join(publishDir, "index.html"), standalone, "utf8");
await writeFile(join(publishDir, "404.html"), standalone, "utf8");
await cp(join(root, "public", "og.png"), join(publishDir, "og.png"));

console.log(`Standalone site created at ${publishDir}`);
