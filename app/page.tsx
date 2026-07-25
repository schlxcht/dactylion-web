"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const SERVER_ADDRESS = "play.dactylion.net";

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

const products = [
  {
    icon: "V",
    eyebrow: "RÜTBE",
    title: "VIP Paketleri",
    text: "Özel renkler, kozmetik ayrıcalıklar ve dengeli oyun avantajları.",
    price: "Yakında",
  },
  {
    icon: "K",
    eyebrow: "KREDİ",
    title: "Kredi Paketleri",
    text: "Güvenli ödeme altyapısı tamamlandığında hesabına otomatik tanımlanacak.",
    price: "Yakında",
  },
  {
    icon: "A",
    eyebrow: "ANAHTAR",
    title: "Kasa Anahtarları",
    text: "Sezonluk ödüller ve sunucu ekonomisine uygun içerikler.",
    price: "Yakında",
  },
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

  useEffect(() => {
    const closeMenu = () => setMenuOpen(false);
    window.addEventListener("hashchange", closeMenu);
    return () => window.removeEventListener("hashchange", closeMenu);
  }, []);

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
          <a href="#kredi">Kredi Yükle</a>
          <a href="#destek">Destek</a>
          <a href="#basvuru">Başvuru</a>
          <a href="#kurallar">Kurallar</a>
        </nav>
        <button className="account-button" type="button" onClick={() => setNoticeOpen(true)}>
          <span className="account-dot" />
          Oyuncu Girişi
        </button>
      </header>

      <section className="hero" id="anasayfa" aria-labelledby="hero-title">
        <Image
          className="hero-art"
          src="/og.png"
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
            Mağaza arayüzü hazır. Güvenli ödeme ve oyun içi teslimat bağlantısı
            tamamlandıktan sonra satışa açılacak.
          </p>
          <div className="security-note"><span>◆</span> ÖDEME SİSTEMİ ŞU AN KAPALI</div>
        </div>
        <div className="product-grid" id="kredi">
          {products.map((product) => (
            <article className="product-card" key={product.title}>
              <span className="product-icon">{product.icon}</span>
              <span className="product-eyebrow">{product.eyebrow}</span>
              <h3>{product.title}</h3>
              <p>{product.text}</p>
              <div className="product-footer">
                <b>{product.price}</b>
                <button type="button" onClick={() => setNoticeOpen(true)}>İNCELE →</button>
              </div>
            </article>
          ))}
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
    </main>
  );
}
