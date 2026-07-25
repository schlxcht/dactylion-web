"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const SERVER_ADDRESS = "play.dactylion.net";
const SITE_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const MARKET_API = "https://dactylion-market-api.marcellusperrycxeh.chatgpt.site";

const news = [
  {
    date: "25 TEMMUZ 2026",
    category: "GÜNCELLEME",
    title: "SkyBlock yeniden şekilleniyor",
    text: "Daha doğal başlangıç adası, 100×100 ada sınırı ve gelişmiş ekonomi döngüsü tek pakette buluşuyor.",
    tag: "ADA SİSTEMİ",
  },
  {
    date: "25 TEMMUZ 2026",
    category: "SİSTEM",
    title: "Dactylion Çiftçi",
    text: "Tarım ve spawner üretimleri anında depolanır; filtre, sıralama ve depo yönetimi tek menüden yapılır.",
    tag: "ÇİFTÇİ",
  },
  {
    date: "25 TEMMUZ 2026",
    category: "SİSTEM",
    title: "Gelişmiş spawner yönetimi",
    text: "Yığınlama, hologram ve action bar seçenekleriyle sade, hızlı ve yönetilebilir bir üretim sistemi.",
    tag: "SPAWNER",
  },
];

type Product = {
  id: string;
  kind: "vip" | "spawner";
  name: string;
  subtitle: string;
  price: number;
  color: string;
  order: number;
};

const products: Product[] = [
  {
    id: "vip-dactylion-plus", kind: "vip", name: "DactylionVIP+", subtitle: "En üst seviye Dactylion ayrıcalıkları", price: 5000, color: "#dc2626", order: 1,
  },
  {
    id: "vip-dactylion", kind: "vip", name: "DactylionVIP", subtitle: "Kırmızı geçişli özel rütbe", price: 3500, color: "#ef4444", order: 2,
  },
  {
    id: "vip-ultra", kind: "vip", name: "UltraVIP", subtitle: "Mavi geçişli özel rütbe", price: 2000, color: "#38bdf8", order: 3,
  },
  { id: "vip-mega", kind: "vip", name: "MegaVIP", subtitle: "Mor geçişli özel rütbe", price: 1000, color: "#a855f7", order: 4 },
  { id: "vip", kind: "vip", name: "VIP", subtitle: "SkyBlock macerana güçlü başlangıç", price: 500, color: "#facc15", order: 5 },
  { id: "spawner-iron-golem", kind: "spawner", name: "Demir Golem Spawner", subtitle: "En değerli üretim spawnerı", price: 2500, color: "#cbd5e1", order: 10 },
  { id: "spawner-witch", kind: "spawner", name: "Cadı Spawner", subtitle: "Çeşitli değerli ganimetler", price: 2000, color: "#a855f7", order: 11 },
  { id: "spawner-guardian", kind: "spawner", name: "Guardian Spawner", subtitle: "Prizmarin üretiminin merkezi", price: 1750, color: "#22d3ee", order: 12 },
  { id: "spawner-spider", kind: "spawner", name: "Örümcek Spawner", subtitle: "İp ve örümcek gözü üretimi", price: 1500, color: "#64748b", order: 13 },
  { id: "spawner-blaze", kind: "spawner", name: "Blaze Spawner", subtitle: "Blaze çubuğu üretimi", price: 1250, color: "#f97316", order: 14 },
  { id: "spawner-skeleton", kind: "spawner", name: "İskelet Spawner", subtitle: "Kemik ve ok üretimi", price: 1000, color: "#d6d3d1", order: 15 },
  { id: "spawner-zombie", kind: "spawner", name: "Zombi Spawner", subtitle: "Çürük et ve nadir demir üretimi", price: 850, color: "#65a30d", order: 16 },
  { id: "spawner-nether-zombie", kind: "spawner", name: "Nether Zombisi Spawner", subtitle: "Altın külçesi üretimi", price: 700, color: "#be123c", order: 17 },
  { id: "spawner-sheep", kind: "spawner", name: "Koyun Spawner", subtitle: "Yün ve koyun eti üretimi", price: 500, color: "#f8fafc", order: 18 },
  { id: "spawner-cow", kind: "spawner", name: "İnek Spawner", subtitle: "Deri ve et üretimi", price: 500, color: "#92400e", order: 19 },
  { id: "spawner-pig", kind: "spawner", name: "Domuz Spawner", subtitle: "Domuz eti üretimi", price: 500, color: "#f9a8d4", order: 20 },
];

function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <span className={small ? "brand-mark brand-mark--small" : "brand-mark"} aria-hidden="true">
      <span>D</span>
    </span>
  );
}

export default function Home() {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginCode, setLoginCode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [token, setToken] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [credits, setCredits] = useState(0);
  const [activeStore, setActiveStore] = useState<"vip" | "spawner">("vip");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const closeMenu = () => setMenuOpen(false);
    window.addEventListener("hashchange", closeMenu);
    return () => window.removeEventListener("hashchange", closeMenu);
  }, []);

  useEffect(() => {
    const saved = window.sessionStorage.getItem("dactylion-market-token");
    if (!saved) return;
    fetch(`${MARKET_API}/api/me`, {
      headers: { Authorization: `Bearer ${saved}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => {
        setToken(saved);
        setPlayerName(data.player.name);
        setCredits(data.player.credits);
      })
      .catch(() => window.sessionStorage.removeItem("dactylion-market-token"));
  }, []);

  async function login() {
    const code = loginCode.replace(/\D/g, "").slice(0, 6);
    if (code.length !== 6) {
      setLoginError("Oyunda /sitekod yazarak aldığın 6 haneli kodu gir.");
      return;
    }
    setBusy(true);
    setLoginError("");
    try {
      const response = await fetch(`${MARKET_API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Giriş yapılamadı.");
      window.sessionStorage.setItem("dactylion-market-token", data.token);
      setToken(data.token);
      setPlayerName(data.player.name);
      setCredits(data.player.credits);
      setLoginOpen(false);
      setLoginCode("");
      setToast(`Hoş geldin ${data.player.name}.`);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Giriş yapılamadı.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    if (token) {
      void fetch(`${MARKET_API}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    window.sessionStorage.removeItem("dactylion-market-token");
    setToken("");
    setPlayerName("");
    setCredits(0);
  }

  async function purchase() {
    if (!selectedProduct || !token) return;
    setBusy(true);
    try {
      const response = await fetch(`${MARKET_API}/api/purchase`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId: selectedProduct.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Satın alım tamamlanamadı.");
      setCredits(data.credits);
      setSelectedProduct(null);
      setToast(`${data.order.itemName} oyun hesabına teslimat sırasına alındı.`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Satın alım tamamlanamadı.");
    } finally {
      setBusy(false);
    }
  }

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(SERVER_ADDRESS);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main>
      <header className="site-header">
        <a className="header-brand" href="#anasayfa" aria-label="Dactylion ana sayfa">
          <BrandMark small />
          <span>
            <b>DACTYLION</b>
            <small>SKYBLOCK</small>
          </span>
        </a>

        <button
          className="menu-toggle"
          type="button"
          aria-label="Menüyü aç veya kapat"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={menuOpen ? "main-nav main-nav--open" : "main-nav"} aria-label="Ana menü">
          <a className="active" href="#anasayfa">Anasayfa</a>
          <a href="#magaza">Mağaza</a>
          <a href="#magaza">VIP & Spawner</a>
          <a href="#destek">Destek</a>
          <a href="#basvuru">Başvuru</a>
          <a href="#kurallar">Kurallar</a>
        </nav>
        <button className="account-button" type="button" onClick={() => token ? void logout() : setLoginOpen(true)}>
          <span className="account-dot" />
          {token ? `${playerName} · ${credits} Kredi` : "Oyuncu Girişi"}
        </button>
      </header>

      <section className="hero" id="anasayfa" aria-labelledby="hero-title">
        <Image
          className="hero-art"
          src={`${SITE_BASE_PATH}/og.png`}
          alt=""
          fill
          priority
          sizes="100vw"
        />
        <div className="hero-shade" />
        <div className="hero-grid" />
        <div className="hero-content">
          <span className="hero-kicker"><i /> TÜRKİYE&apos;NİN YENİ SKYBLOCK DENEYİMİ</span>
          <h1 id="hero-title">Adanı kur.<br /><em>Ekonomini büyüt.</em></h1>
          <p>
            Dactylion&apos;da her blok bir başlangıçtır. Kendi adanı geliştir,
            üretimini otomatikleştir ve sezonun zirvesine çık.
          </p>
          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={copyAddress}>
              {copied ? "IP KOPYALANDI" : "HEMEN OYNA"}
              <span>↗</span>
            </button>
            <a className="text-button" href="#sistemler">SİSTEMLERİ KEŞFET <span>↓</span></a>
          </div>
          <div className="hero-stats">
            <div><b>1.21+</b><span>SÜRÜM</span></div>
            <div><b>7/24</b><span>AKTİF</span></div>
            <div><b>TR</b><span>TOPLULUK</span></div>
          </div>
        </div>
      </section>

      <section className="quick-strip" aria-label="Sunucu bağlantıları">
        <button className="quick-card" type="button" onClick={copyAddress}>
          <span className="quick-icon">⌁</span>
          <span><small>SUNUCU ADRESİ</small><b>{SERVER_ADDRESS}</b></span>
          <span className="quick-action">{copied ? "KOPYALANDI" : "KOPYALA"}</span>
        </button>
        <div className="center-emblem">
          <BrandMark />
        </div>
        <button className="quick-card quick-card--right" type="button" onClick={() => setNoticeOpen(true)}>
          <span className="quick-icon">◉</span>
          <span><small>TOPLULUĞA KATIL</small><b>Discord yakında</b></span>
          <span className="quick-action">BİLGİ</span>
        </button>
      </section>

      <section className="intro-section" id="sistemler">
        <div className="section-heading">
          <span className="section-index">01</span>
          <div>
            <p>DACTYLION DENEYİMİ</p>
            <h2>SkyBlock&apos;un bildiğin kurallarını <em>yeniden yaz.</em></h2>
          </div>
          <p className="section-copy">
            Gereksiz karmaşadan uzak, rekabetçi ekonomiye ve uzun soluklu gelişime
            odaklanan bir ada deneyimi.
          </p>
        </div>
        <div className="feature-grid">
          <article className="feature-card feature-card--large">
            <span className="feature-number">01</span>
            <div className="pixel-island" aria-hidden="true">
              <span className="island-top" />
              <span className="island-body" />
              <span className="island-tree" />
            </div>
            <div className="feature-card-content">
              <span className="red-label">ADA GELİŞİMİ</span>
              <h3>Küçük bir adadan<br />büyük bir imparatorluğa.</h3>
              <p>Doğal başlangıç adası, yükseltilebilir sınırlar ve dengeli ilerleme.</p>
            </div>
          </article>
          <article className="feature-card">
            <span className="feature-number">02</span>
            <span className="feature-glyph">⌘</span>
            <span className="red-label">OTOMASYON</span>
            <h3>Akıllı Çiftçi</h3>
            <p>Ürünlerini görünmeden topla, filtrele ve tek menüden yönet.</p>
          </article>
          <article className="feature-card feature-card--dark">
            <span className="feature-number">03</span>
            <span className="feature-glyph">✦</span>
            <span className="red-label">EKONOMİ</span>
            <h3>Canlı piyasa</h3>
            <p>Üret, ticaret yap ve ada ekonomini sürdürülebilir biçimde büyüt.</p>
          </article>
        </div>
      </section>

      <section className="news-section" id="haberler">
        <div className="section-heading section-heading--compact">
          <span className="section-index">02</span>
          <div>
            <p>SUNUCUDAN HABERLER</p>
            <h2>Son <em>gelişmeler.</em></h2>
          </div>
          <a href="#haberler">TÜM HABERLER <span>→</span></a>
        </div>
        <div className="news-grid">
          {news.map((item, index) => (
            <article className="news-card" key={item.title}>
              <div className={`news-visual news-visual--${index + 1}`}>
                <span>{item.tag}</span>
                <b>{index === 0 ? "100×100" : index === 1 ? "7/24" : "64×"}</b>
              </div>
              <div className="news-content">
                <span className="news-meta">{item.category} · {item.date}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <span className="read-more">DETAYLAR YAKINDA →</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="store-section" id="magaza">
        <div className="store-intro">
          <span className="section-index">03</span>
          <p>DACTYLION MAĞAZA</p>
          <h2>Macera sana ait.<br /><em>Tarzını sen seç.</em></h2>
          <p className="store-copy">
            VIP rütbeni veya spawnerını krediyle seç. Satın aldığın içerik,
            Minecraft sunucusuna bağlandığında hesabına otomatik teslim edilir.
          </p>
          <div className="security-note"><span>◆</span> KREDİ SATILMAZ · YALNIZCA SUNUCU YETKİLİSİ TANIMLAR</div>
          <div className="store-account">
            {token ? (
              <><small>GİRİŞ YAPILDI</small><b>{playerName}</b><strong>{credits.toLocaleString("tr-TR")} Kredi</strong></>
            ) : (
              <><small>OYUNCU HESABI</small><b>Oyunda /sitekod yaz</b><button type="button" onClick={() => setLoginOpen(true)}>KODLA GİRİŞ YAP</button></>
            )}
          </div>
        </div>
        <div className="store-catalog" id="kredi">
          <div className="store-tabs">
            <button className={activeStore === "vip" ? "active" : ""} type="button" data-store-tab="vip" onClick={() => setActiveStore("vip")}>VIP RÜTBELERİ</button>
            <button className={activeStore === "spawner" ? "active" : ""} type="button" data-store-tab="spawner" onClick={() => setActiveStore("spawner")}>SPAWNERLAR</button>
          </div>
          <div className="product-grid market-grid">
            {products.map((product) => (
              <article className={`product-card market-product${product.kind !== activeStore ? " market-product--hidden" : ""}`} data-kind={product.kind} data-item-id={product.id} data-item-name={product.name} data-item-price={product.price} key={product.id}>
                <span className="product-icon" style={{ background: `linear-gradient(145deg, ${product.color}, #360606)` }}>
                  {product.kind === "vip" ? "V" : "S"}
                </span>
                <span className="product-eyebrow">{product.kind === "vip" ? "RÜTBE" : "SPAWNER"}</span>
                <h3>{product.name}</h3>
                <p>{product.subtitle}</p>
                <div className="product-footer">
                  <b>{product.price.toLocaleString("tr-TR")} Kredi</b>
                  <button type="button" onClick={() => token ? setSelectedProduct(product) : setLoginOpen(true)}>
                    {token && credits < product.price ? "YETERSİZ KREDİ" : "SATIN AL →"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="community-section" id="destek">
        <div>
          <span className="red-label">TOPLULUĞUN PARÇASI OL</span>
          <h2>Adanda yalnız değilsin.</h2>
          <p>Duyurular, destek ve etkinlikler için topluluk bağlantıları yakında burada.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => setNoticeOpen(true)}>
          DISCORD YAKINDA <span>↗</span>
        </button>
      </section>

      <footer>
        <div className="footer-main">
          <a className="header-brand" href="#anasayfa">
            <BrandMark small />
            <span><b>DACTYLION</b><small>NETWORK</small></span>
          </a>
          <p>Yeni nesil, topluluk odaklı SkyBlock deneyimi.</p>
          <div className="footer-links">
            <div id="basvuru"><b>TOPLULUK</b><button onClick={() => setNoticeOpen(true)}>Başvurular</button><button onClick={() => setNoticeOpen(true)}>Destek</button></div>
            <div id="kurallar"><b>YASAL</b><button onClick={() => setNoticeOpen(true)}>Kurallar</button><button onClick={() => setNoticeOpen(true)}>Gizlilik</button></div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Dactylion Network. Tüm hakları saklıdır.</span>
          <span>Mojang veya Microsoft ile bağlantılı değildir.</span>
        </div>
      </footer>

      {noticeOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setNoticeOpen(false)}>
          <section
            className="notice-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notice-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="modal-close" type="button" aria-label="Pencereyi kapat" onClick={() => setNoticeOpen(false)}>×</button>
            <BrandMark small />
            <span className="red-label">HAZIRLIK AŞAMASINDA</span>
            <h2 id="notice-title">Bu bölüm yakında açılacak.</h2>
            <p>
              Kredi yükleme, oyuncu girişi ve oyun içi teslimat güvenli bir sunucu
              bağlantısı tamamlanmadan etkinleştirilmeyecek.
            </p>
            <button className="primary-button" type="button" onClick={() => setNoticeOpen(false)}>ANLADIM</button>
          </section>
        </div>
      )}

      {loginOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setLoginOpen(false)}>
          <section className="notice-modal login-modal" role="dialog" aria-modal="true" aria-labelledby="login-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" aria-label="Pencereyi kapat" onClick={() => setLoginOpen(false)}>×</button>
            <span className="red-label">GÜVENLİ OYUNCU GİRİŞİ</span>
            <h2 id="login-title">Oyunda /sitekod yaz.</h2>
            <p>Sunucunun verdiği tek kullanımlık 6 haneli kodu aşağıya gir. Minecraft şifreni hiçbir zaman istemeyiz.</p>
            <input aria-label="6 haneli giriş kodu" inputMode="numeric" maxLength={6} placeholder="000000" value={loginCode} onChange={(event) => setLoginCode(event.target.value.replace(/\D/g, "").slice(0, 6))} />
            {loginError && <span className="form-error">{loginError}</span>}
            <button className="primary-button" type="button" disabled={busy} onClick={() => void login()}>{busy ? "BAĞLANIYOR..." : "HESABIMA GİR"}</button>
          </section>
        </div>
      )}

      {selectedProduct && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelectedProduct(null)}>
          <section className="notice-modal purchase-modal" role="dialog" aria-modal="true" aria-labelledby="purchase-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" aria-label="Pencereyi kapat" onClick={() => setSelectedProduct(null)}>×</button>
            <span className="red-label">SATIN ALIM ONAYI</span>
            <h2 id="purchase-title">{selectedProduct.name}</h2>
            <p><b>{selectedProduct.price.toLocaleString("tr-TR")} kredi</b> bakiyenden düşülecek ve ürün <b>{playerName}</b> hesabına teslim edilecek.</p>
            <button className="primary-button" type="button" disabled={busy || credits < selectedProduct.price} onClick={() => void purchase()}>
              {busy ? "İŞLENİYOR..." : credits < selectedProduct.price ? "YETERSİZ KREDİ" : "SATIN ALMAYI ONAYLA"}
            </button>
          </section>
        </div>
      )}

      {toast && <button className="market-toast" type="button" onClick={() => setToast("")}>{toast}</button>}
    </main>
  );
}
