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
  const API = 'https://dactylion-market-api.marcellusperrycxeh.chatgpt.site';
  const TOKEN_KEY = 'dactylion-market-token';
  let token = sessionStorage.getItem(TOKEN_KEY) || '';
  let player = null;
  let selected = null;

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

  const closeModal = () => document.querySelector('.modal-backdrop')?.remove();
  const mountModal = html => {
    closeModal();
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = html;
    backdrop.addEventListener('click', event => {
      if (event.target === backdrop) closeModal();
    });
    backdrop.querySelector('.modal-close')?.addEventListener('click', closeModal);
    document.body.append(backdrop);
    return backdrop;
  };

  const toast = message => {
    document.querySelector('.market-toast')?.remove();
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'market-toast';
    el.textContent = message;
    el.addEventListener('click', () => el.remove());
    document.body.append(el);
    setTimeout(() => el.remove(), 6000);
  };

  const updateAccount = () => {
    const button = document.querySelector('.account-button');
    const account = document.querySelector('.store-account');
    if (!button || !account) return;
    if (player) {
      button.innerHTML = '<span class="account-dot"></span>' + player.name + ' · ' + Number(player.credits).toLocaleString('tr-TR') + ' Kredi';
      account.innerHTML = '<small>GİRİŞ YAPILDI</small><b>' + player.name + '</b><strong>' + Number(player.credits).toLocaleString('tr-TR') + ' Kredi</strong><button type="button" data-market-logout>ÇIKIŞ YAP</button>';
      account.querySelector('[data-market-logout]')?.addEventListener('click', logout);
    } else {
      button.innerHTML = '<span class="account-dot"></span>Oyuncu Girişi';
      account.innerHTML = '<small>OYUNCU HESABI</small><b>Oyunda /sitekod yaz</b><button type="button" data-market-login>KODLA GİRİŞ YAP</button>';
      account.querySelector('[data-market-login]')?.addEventListener('click', showLogin);
    }
  };

  const login = async (code, modal) => {
    const error = modal.querySelector('.form-error');
    const submit = modal.querySelector('.primary-button');
    error.textContent = '';
    if (!/^\\d{6}$/.test(code)) {
      error.textContent = 'Oyunda /sitekod yazarak aldığın 6 haneli kodu gir.';
      return;
    }
    submit.disabled = true;
    submit.textContent = 'BAĞLANIYOR...';
    try {
      const response = await fetch(API + '/api/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({code})
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Giriş yapılamadı.');
      token = data.token;
      player = data.player;
      sessionStorage.setItem(TOKEN_KEY, token);
      closeModal();
      updateAccount();
      toast('Hoş geldin ' + player.name + '.');
    } catch (reason) {
      error.textContent = reason.message || 'Giriş yapılamadı.';
      submit.disabled = false;
      submit.textContent = 'HESABIMA GİR';
    }
  };

  function showLogin() {
    const modal = mountModal('<section class="notice-modal login-modal" role="dialog" aria-modal="true"><button class="modal-close" type="button" aria-label="Pencereyi kapat">×</button><span class="red-label">GÜVENLİ OYUNCU GİRİŞİ</span><h2>Oyunda /sitekod yaz.</h2><p>Sunucunun verdiği tek kullanımlık 6 haneli kodu aşağıya gir. Minecraft şifreni hiçbir zaman istemeyiz.</p><input aria-label="6 haneli giriş kodu" inputmode="numeric" maxlength="6" placeholder="000000"><span class="form-error"></span><button class="primary-button" type="button">HESABIMA GİR</button></section>');
    const input = modal.querySelector('input');
    input.focus();
    input.addEventListener('input', () => input.value = input.value.replace(/\\D/g, '').slice(0, 6));
    modal.querySelector('.primary-button')?.addEventListener('click', () => login(input.value, modal));
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') login(input.value, modal);
    });
  }

  async function logout() {
    if (token) fetch(API + '/api/auth/logout', {method: 'POST', headers: {Authorization: 'Bearer ' + token}}).catch(() => {});
    token = '';
    player = null;
    sessionStorage.removeItem(TOKEN_KEY);
    updateAccount();
  }

  const buy = async modal => {
    const button = modal.querySelector('.primary-button');
    button.disabled = true;
    button.textContent = 'İŞLENİYOR...';
    try {
      const response = await fetch(API + '/api/purchase', {
        method: 'POST',
        headers: {Authorization: 'Bearer ' + token, 'Content-Type': 'application/json'},
        body: JSON.stringify({itemId: selected.id})
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Satın alım tamamlanamadı.');
      player.credits = data.credits;
      closeModal();
      updateAccount();
      toast(data.order.itemName + ' oyun hesabına teslimat sırasına alındı.');
    } catch (reason) {
      closeModal();
      toast(reason.message || 'Satın alım tamamlanamadı.');
    }
  };

  const showPurchase = card => {
    if (!player) return showLogin();
    selected = {
      id: card.dataset.itemId,
      name: card.dataset.itemName,
      price: Number(card.dataset.itemPrice)
    };
    const enough = player.credits >= selected.price;
    const modal = mountModal('<section class="notice-modal purchase-modal" role="dialog" aria-modal="true"><button class="modal-close" type="button" aria-label="Pencereyi kapat">×</button><span class="red-label">SATIN ALIM ONAYI</span><h2>' + selected.name + '</h2><p><b>' + selected.price.toLocaleString('tr-TR') + ' kredi</b> bakiyenden düşülecek ve ürün <b>' + player.name + '</b> hesabına teslim edilecek.</p><button class="primary-button" type="button"' + (enough ? '' : ' disabled') + '>' + (enough ? 'SATIN ALMAYI ONAYLA' : 'YETERSİZ KREDİ') + '</button></section>');
    if (enough) modal.querySelector('.primary-button')?.addEventListener('click', () => buy(modal));
  };

  document.querySelectorAll('[data-store-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-store-tab]').forEach(item => item.classList.toggle('active', item === tab));
      document.querySelectorAll('.market-product').forEach(card =>
        card.classList.toggle('market-product--hidden', card.dataset.kind !== tab.dataset.storeTab)
      );
    });
  });
  document.querySelectorAll('.market-product').forEach(card =>
    card.querySelector('.product-footer button')?.addEventListener('click', () => showPurchase(card))
  );
  document.querySelector('.account-button')?.addEventListener('click', () => player ? logout() : showLogin());
  document.querySelector('.store-account button')?.addEventListener('click', showLogin);

  const showNotice = () => {
    const modal = mountModal('<section class="notice-modal" role="dialog" aria-modal="true"><button class="modal-close" type="button" aria-label="Pencereyi kapat">×</button><span class="brand-mark brand-mark--small" aria-hidden="true"><span>D</span></span><span class="red-label">HAZIRLIK AŞAMASINDA</span><h2>Bu bölüm yakında açılacak.</h2><p>Topluluk bağlantıları ve başvuru bölümleri hazırlandığında burada yayınlanacak.</p><button class="primary-button modal-ok" type="button">ANLADIM</button></section>');
    modal.querySelector('.modal-ok')?.addEventListener('click', closeModal);
  };
  ['.quick-card--right', '.community-section .primary-button', '.footer-links button'].forEach(selector =>
    document.querySelectorAll(selector).forEach(button => button.addEventListener('click', showNotice))
  );

  if (token) {
    fetch(API + '/api/me', {headers: {Authorization: 'Bearer ' + token}})
      .then(async response => {
        if (!response.ok) throw new Error();
        const data = await response.json();
        player = data.player;
        updateAccount();
      })
      .catch(() => {
        token = '';
        sessionStorage.removeItem(TOKEN_KEY);
        updateAccount();
      });
  } else {
    updateAccount();
  }
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
