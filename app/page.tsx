"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

const SERVER_ADDRESS = "play.dactylion.net";
const DISCORD_URL = "https://discord.gg/SwGmr6K44z";
const SITE_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const MARKET_API = "https://dactylion-market-api.marcellusperrycxeh.chatgpt.site";
const TOKEN_KEY = "dactylion-market-token";

type PageName = "home" | "credit" | "support" | "application" | "rules";
type Player = { uuid: string; name: string; credits: number };
type CreditPackage = { id: string; credits: number; priceKurus: number };
type CreditRequest = { id: string; package_id: string; credits: number; price_kurus: number; payment_reference: string; status: "pending" | "processing" | "approved" | "rejected"; created_at: number };
type SupportTicket = { id: string; category: string; subject: string; message: string; status: "open" | "closed"; created_at: number };

const packageFallback: CreditPackage[] = [
  { id: "credit-500", credits: 500, priceKurus: 5_000 },
  { id: "credit-1100", credits: 1_100, priceKurus: 10_000 },
  { id: "credit-3000", credits: 3_000, priceKurus: 25_000 },
  { id: "credit-6500", credits: 6_500, priceKurus: 50_000 },
];

const statusText: Record<CreditRequest["status"], string> = {
  pending: "İnceleme bekliyor",
  processing: "İşleniyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
};

const categoryText: Record<string, string> = {
  credit: "Kredi",
  payment: "Ödeme",
  technical: "Teknik",
  account: "Hesap",
  other: "Diğer",
};

const pageLabels: Record<PageName, string> = {
  home: "Haberler",
  credit: "Kredi Yükle",
  support: "Destek Talepleri",
  application: "Başvuru",
  rules: "Oyun Kuralları ve İşleyiş Hakkında",
};

const news = [
  { category: "DUYURU", title: "Dactylion SkyBlock hazırlanıyor", text: "Ada, ekonomi, görev ve topluluk sistemlerini tek bir dengeli ilerleyişte birleştiriyoruz.", tag: "AÇILIŞ", position: "50% 42%" },
  { category: "YENİ SİSTEM", title: "Bireysel zindanlar", text: "Üç seviye, dalga sistemi, kişiye özel oturumlar ve ayarlanabilir ödül sandıkları.", tag: "ZİNDAN", position: "70% 55%" },
  { category: "GÜNCELLEME", title: "Nether ada deneyimi", text: "SuperiorSkyblock altyapısıyla ana adaya bağlı, kontrollü Nether gelişimi.", tag: "ADA", position: "30% 56%" },
  { category: "EKONOMİ", title: "Oyun içi Site Market", text: "Kredini siteden hesabına yükle, ürünlerini güvenle yalnızca /sitemarket menüsünden al.", tag: "MARKET", position: "58% 67%" },
  { category: "GELİŞİM", title: "Minyon sistemi yenileniyor", text: "Kazıcı, balıkçı ve besleyici minyonlar için daha anlaşılır depolama ve seviye düzeni.", tag: "MİNYON", position: "42% 35%" },
  { category: "TOPLULUK", title: "Dactylion Discord açıldı", text: "Duyuruları takip et, destek al ve SkyBlock topluluğuna katıl.", tag: "DISCORD", position: "76% 38%" },
];

function money(priceKurus: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(priceKurus / 100);
}

function date(value: number) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function BrandLogo({ size = 118, className = "" }: { size?: number; className?: string }) {
  return <Image className={className} src={`${SITE_BASE_PATH}/dactylion-logo.png`} alt="Dactylion Network logosu" width={size} height={size} priority />;
}

export default function Home() {
  const [page, setPage] = useState<PageName>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginCode, setLoginCode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [token, setToken] = useState(() => typeof window === "undefined" ? "" : window.sessionStorage.getItem(TOKEN_KEY) ?? "");
  const [player, setPlayer] = useState<Player | null>(null);
  const [packages, setPackages] = useState<CreditPackage[]>(packageFallback);
  const [selectedPackage, setSelectedPackage] = useState(packageFallback[1].id);
  const [paymentReference, setPaymentReference] = useState("");
  const [creditRequests, setCreditRequests] = useState<CreditRequest[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [supportFormOpen, setSupportFormOpen] = useState(false);
  const [supportCategory, setSupportCategory] = useState("technical");
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [application, setApplication] = useState({ department: "Rehber", name: "", age: "", gameName: "", discord: "", experience: "", weeklyHours: "", about: "" });
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const selected = useMemo(() => packages.find((entry) => entry.id === selectedPackage) ?? packages[0], [packages, selectedPackage]);
  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 6000);
  }, []);

  const authorizedFetch = useCallback(async (path: string, init?: RequestInit) => {
    if (!token) throw new Error("Önce oyuncu hesabına giriş yap.");
    const response = await fetch(`${MARKET_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error ?? "İşlem tamamlanamadı.");
    return data;
  }, [token]);

  const refreshPortal = useCallback(async () => {
    if (!token) return;
    try {
      const [me, requests, tickets] = await Promise.all([
        authorizedFetch("/api/me"),
        authorizedFetch("/api/credit-requests"),
        authorizedFetch("/api/support"),
      ]);
      setPlayer(me.player);
      setCreditRequests(requests.requests ?? []);
      setSupportTickets(tickets.tickets ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Oturum yenilenemedi.";
      if (message.toLocaleLowerCase("tr-TR").includes("oturum")) {
        window.sessionStorage.removeItem(TOKEN_KEY);
        setToken("");
        setPlayer(null);
      } else {
        showToast(message);
      }
    }
  }, [authorizedFetch, showToast, token]);

  useEffect(() => {
    const syncPage = () => {
      const value = window.location.hash.replace("#", "") as PageName;
      if (["home", "credit", "support", "application", "rules"].includes(value)) setPage(value);
    };
    syncPage();
    window.addEventListener("hashchange", syncPage);
    return () => window.removeEventListener("hashchange", syncPage);
  }, []);

  useEffect(() => {
    fetch(`${MARKET_API}/api/credit-packages`)
      .then(async (response) => { if (!response.ok) throw new Error(); return response.json(); })
      .then((data) => { if (Array.isArray(data.packages) && data.packages.length) setPackages(data.packages); })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!token) return;
    const timeout = window.setTimeout(() => void refreshPortal(), 0);
    return () => window.clearTimeout(timeout);
  }, [refreshPortal, token]);

  function navigate(nextPage: PageName) {
    setPage(nextPage);
    setMenuOpen(false);
    window.history.pushState(null, "", `#${nextPage}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
      window.sessionStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setPlayer(data.player);
      setLoginOpen(false);
      setLoginCode("");
      showToast(`Hoş geldin ${data.player.name}.`);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Giriş yapılamadı.");
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    if (token) void fetch(`${MARKET_API}/api/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    window.sessionStorage.removeItem(TOKEN_KEY);
    setToken("");
    setPlayer(null);
    setCreditRequests([]);
    setSupportTickets([]);
  }

  async function submitCreditRequest(event: FormEvent) {
    event.preventDefault();
    if (!token) { setLoginOpen(true); return; }
    setBusy(true);
    try {
      await authorizedFetch("/api/credit-requests", { method: "POST", body: JSON.stringify({ packageId: selectedPackage, paymentReference }) });
      setPaymentReference("");
      showToast("Kredi yükleme talebin alındı. Ödeme doğrulandıktan sonra oyun hesabına işlenecek.");
      await refreshPortal();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Kredi talebi oluşturulamadı.");
    } finally {
      setBusy(false);
    }
  }

  async function submitSupport(event: FormEvent) {
    event.preventDefault();
    if (!token) { setLoginOpen(true); return; }
    setBusy(true);
    try {
      await authorizedFetch("/api/support", { method: "POST", body: JSON.stringify({ category: supportCategory, subject: supportSubject, message: supportMessage }) });
      setSupportSubject("");
      setSupportMessage("");
      setSupportFormOpen(false);
      showToast("Destek talebin açıldı.");
      await refreshPortal();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Destek talebi açılamadı.");
    } finally {
      setBusy(false);
    }
  }

  async function submitApplication(event: FormEvent) {
    event.preventDefault();
    if (!token) { setLoginOpen(true); return; }
    const message = [
      `Bölüm: ${application.department}`,
      `Ad soyad: ${application.name}`,
      `Yaş: ${application.age}`,
      `Oyun adı: ${application.gameName}`,
      `Discord: ${application.discord}`,
      `Haftalık süre: ${application.weeklyHours}`,
      `Deneyim: ${application.experience}`,
      `Kendisi hakkında: ${application.about}`,
    ].join("\n").slice(0, 1000);
    setBusy(true);
    try {
      await authorizedFetch("/api/support", { method: "POST", body: JSON.stringify({ category: "other", subject: `${application.department} başvurusu`, message }) });
      showToast("Başvurun inceleme sırasına alındı.");
      setApplication({ department: "Rehber", name: "", age: "", gameName: "", discord: "", experience: "", weeklyHours: "", about: "" });
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Başvuru gönderilemedi.");
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
      showToast(`Sunucu adresi: ${SERVER_ADDRESS}`);
    }
  }

  return (
    <main>
      <section className="portal-hero">
        <Image className="hero-background" src={`${SITE_BASE_PATH}/og.png`} alt="Dactylion SkyBlock dünyası" fill priority sizes="100vw" />
        <div className="hero-overlay" />
        <header className="top-navigation">
          <button className="mobile-menu" type="button" aria-label="Menüyü aç" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}><span /><span /><span /></button>
          <nav className={menuOpen ? "nav-links nav-links--open" : "nav-links"} aria-label="Ana menü">
            <button className={page === "home" ? "active" : ""} onClick={() => navigate("home")} type="button">⌂ <span>Anasayfa</span></button>
            <button className={page === "credit" ? "active" : ""} onClick={() => navigate("credit")} type="button">◆ <span>Kredi Yükle</span></button>
            <button className={page === "support" ? "active" : ""} onClick={() => navigate("support")} type="button">▣ <span>Destek</span></button>
            <button className={page === "application" ? "active" : ""} onClick={() => navigate("application")} type="button">✎ <span>Başvuru</span></button>
            <button className={page === "rules" ? "active" : ""} onClick={() => navigate("rules")} type="button">⚑ <span>Kurallar</span></button>
          </nav>
        </header>
        <button className="hero-online" type="button" onClick={copyAddress}><b>{copied ? "IP kopyalandı" : "Sunucuya bağlan"}</b><small>{SERVER_ADDRESS}</small></button>
        <button className="hero-account" type="button" onClick={() => player ? logout() : setLoginOpen(true)}><span className="mini-avatar">▦</span><b>{player?.name ?? "Oyuncu Girişi"}</b></button>
      </section>

      <section className="server-summary" aria-label="Sunucu bilgileri">
        <button type="button" onClick={copyAddress}><span className="summary-icon">⌁</span><span><b>{copied ? "Adres kopyalandı" : "Dactylion'a katıl"}</b><small>{SERVER_ADDRESS}</small></span></button>
        <div className="floating-logo"><BrandLogo size={132} /></div>
        <a href={DISCORD_URL} target="_blank" rel="noreferrer"><span className="summary-icon">◉</span><span><b>Discord</b><small>TOPLULUĞA KATIL</small></span></a>
      </section>

      <div className="page-shell">
        <div className="breadcrumb"><span>⌂</span><i>›</i><b>{pageLabels[page]}</b></div>

        {page === "home" && (
          <div className="home-layout">
            <aside className="side-column">
              <section className="sidebar-section">
                <div className="small-heading"><h2>En Çok Kredi Yükleyen</h2><span>Bu ay</span></div>
                <div className="top-credit-card"><BrandLogo size={70} /><div><small>DACTYLION OYUNCUSU</small><b>{player?.name ?? "Oyuncu girişi yap"}</b><strong>{player ? `${player.credits.toLocaleString("tr-TR")} Kredi` : "Bakiyeni görüntüle"}</strong></div></div>
              </section>
              <section className="sidebar-section">
                <div className="small-heading"><h2>Son Kredi Talepleri</h2></div>
                <div className="mini-list">
                  {player && creditRequests.length ? creditRequests.slice(0, 4).map((entry) => <div key={entry.id}><span className="pixel-head">D</span><p><b>{player.name}</b><small>{date(entry.created_at)}</small></p><strong>+{entry.credits}</strong></div>) : <div className="list-empty"><span className="pixel-head">?</span><p><b>Canlı hesap verisi</b><small>Oyuncu girişi gereklidir</small></p></div>}
                </div>
              </section>
              <section className="sidebar-section">
                <div className="small-heading"><h2>Oyun İçi Market</h2></div>
                <div className="mini-list"><div><span className="pixel-head">/</span><p><b>/sitemarket</b><small>VIP, kasa, spawner ve dahası</small></p><strong>OYUNDA</strong></div><div><span className="pixel-head">K</span><p><b>Ortak kredi hesabı</b><small>Site ve oyun bakiyesi eşleşir</small></p></div></div>
              </section>
              <a className="discord-card" href={DISCORD_URL} target="_blank" rel="noreferrer"><span>◉</span><div><small>DACTYLION NETWORK</small><b>Discord sunucumuza katıl</b><p>Duyuru, destek ve topluluk kanalları.</p></div><i>→</i></a>
            </aside>

            <section className="news-column">
              <div className="content-heading"><div><small>DACTYLION NETWORK</small><h1>Haberler ve duyurular</h1></div><button type="button" onClick={copyAddress}>{copied ? "IP KOPYALANDI" : "SUNUCUYA KATIL"}</button></div>
              <div className="news-grid">
                {news.map((item, index) => <article className="news-card" key={item.title}><div className="news-image"><Image src={`${SITE_BASE_PATH}/og.png`} alt="" fill sizes="(max-width: 760px) 100vw, 30vw" style={{ objectPosition: item.position }} /><span>{item.tag}</span><b>0{index + 1}</b></div><div className="news-body"><small>{item.category}</small><h2>{item.title}</h2><p>{item.text}</p><button type="button" onClick={() => index === 3 ? navigate("credit") : index === 5 ? window.open(DISCORD_URL, "_blank", "noopener,noreferrer") : showToast("Duyurunun ayrıntıları açılışa yaklaştıkça yayınlanacak.")}>Devamını Oku <span>→</span></button></div></article>)}
              </div>
              <div className="pagination"><button className="active" type="button">1</button><button type="button" disabled>2</button><button type="button" disabled>→</button></div>
            </section>
          </div>
        )}

        {page === "credit" && (
          <section className="inner-page credit-page">
            <div className="page-title"><div><small>OYUNCU PORTALI</small><h1>Kredi Yükle</h1><p>Site yalnızca kredi yükleme talebi alır. Ürün satın alma işlemleri oyun içinde <b>/sitemarket</b> menüsünden yapılır.</p></div>{player ? <div className="balance-box"><small>MEVCUT BAKİYE</small><b>{player.credits.toLocaleString("tr-TR")}</b><span>Kredi</span></div> : <button className="red-button" type="button" onClick={() => setLoginOpen(true)}>OYUNCU GİRİŞİ</button>}</div>
            <div className="credit-layout">
              <form className="white-card credit-form" onSubmit={submitCreditRequest}>
                <div className="notice-bar">Kredi talebi göndermeden önce oyunda <b>/sitekod</b> komutuyla hesabını doğrula.</div>
                <h2>Kredi paketi seç</h2>
                <div className="package-grid">{packages.map((entry) => <button className={selectedPackage === entry.id ? "package active" : "package"} type="button" key={entry.id} onClick={() => setSelectedPackage(entry.id)}><span>{entry.credits.toLocaleString("tr-TR")}</span><small>KREDİ</small><b>{money(entry.priceKurus)}</b></button>)}</div>
                <label><span>Ödeme / işlem referansı</span><input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} minLength={6} maxLength={80} placeholder="Dekont veya işlem referansını yaz" required /></label>
                <p className="field-help">Kart numarası, şifre veya kişisel ödeme bilgisi yazma. Personel yalnızca ödeme referansını doğrular.</p>
                <button className="red-button submit-button" type="submit" disabled={busy}>{player ? `${selected?.credits.toLocaleString("tr-TR") ?? ""} KREDİ TALEBİ GÖNDER` : "ÖNCE OYUNCU GİRİŞİ YAP"}</button>
              </form>
              <aside className="white-card history-card"><h2>Kredi Geçmişi</h2>{!player ? <div className="empty-panel"><BrandLogo size={62} /><b>Hesabınla giriş yap</b><p>Oyunda /sitekod yazarak aldığın kodu kullan.</p></div> : creditRequests.length === 0 ? <div className="empty-panel"><span className="large-symbol">◆</span><b>Henüz talep yok</b><p>İlk kredi yükleme talebin burada görünecek.</p></div> : <div className="history-list">{creditRequests.map((entry) => <article key={entry.id}><div><b>+{entry.credits.toLocaleString("tr-TR")} Kredi</b><small>{date(entry.created_at)}</small></div><span data-status={entry.status}>{statusText[entry.status]}</span></article>)}</div>}</aside>
            </div>
          </section>
        )}

        {page === "support" && (
          <section className="inner-page support-page">
            <div className="page-title"><div><small>DACTYLION DESTEK</small><h1>Destek Talepleri</h1><p>Teknik, hesap, ödeme veya kredi sorunlarını güvenli biçimde personel ekibine ilet.</p></div><button className="red-button" type="button" onClick={() => player ? setSupportFormOpen((value) => !value) : setLoginOpen(true)}>+ DESTEK AÇ</button></div>
            {supportFormOpen && <form className="white-card support-form" onSubmit={submitSupport}><div className="form-grid"><label><span>Kategori</span><select value={supportCategory} onChange={(event) => setSupportCategory(event.target.value)}><option value="technical">Teknik sorun</option><option value="account">Hesap</option><option value="credit">Kredi</option><option value="payment">Ödeme</option><option value="other">Diğer</option></select></label><label><span>Konu</span><input value={supportSubject} onChange={(event) => setSupportSubject(event.target.value)} minLength={5} maxLength={80} placeholder="Sorunu kısaca anlat" required /></label></div><label><span>Açıklama</span><textarea value={supportMessage} onChange={(event) => setSupportMessage(event.target.value)} minLength={10} maxLength={1000} rows={6} placeholder="Yaşadığın sorunu ve varsa hata mesajını ayrıntılı yaz" required /></label><div className="form-actions"><button type="button" onClick={() => setSupportFormOpen(false)}>VAZGEÇ</button><button className="red-button" type="submit" disabled={busy}>TALEBİ GÖNDER</button></div></form>}
            <div className="ticket-table white-card"><div className="table-row table-head"><span>#</span><span>BAŞLIK</span><span>KATEGORİ</span><span>SON GÜNCELLEME</span><span>DURUM</span></div>{!player ? <div className="table-empty"><BrandLogo size={62} /><b>Destek kayıtlarını görmek için giriş yap</b><button type="button" onClick={() => setLoginOpen(true)}>OYUNCU GİRİŞİ</button></div> : supportTickets.length === 0 ? <div className="table-empty"><span className="large-symbol">▣</span><b>Henüz destek talebin yok</b><p>Yeni bir kayıt açtığında burada görünecek.</p></div> : supportTickets.map((ticket, index) => <div className="table-row" key={ticket.id}><span>#{String(index + 1).padStart(4, "0")}</span><b>{ticket.subject}</b><span>{categoryText[ticket.category] ?? "Diğer"}</span><span>{date(ticket.created_at)}</span><strong data-status={ticket.status}>{ticket.status === "open" ? "Açık" : "Kapalı"}</strong></div>)}</div>
          </section>
        )}

        {page === "application" && (
          <section className="inner-page application-page">
            <div className="application-notice"><b>Ekip Arkadaşı!</b><p>Başvurular deneyimden önce güven, iletişim ve topluluk uyumuna göre değerlendirilir. Yanlış bilgi veren veya yetki talep eden başvurular değerlendirmeye alınmaz.</p></div>
            <form className="white-card application-form" onSubmit={submitApplication}>
              <label><span>Başvuru yapmak istediğin bölüm</span><select value={application.department} onChange={(event) => setApplication({ ...application, department: event.target.value })}><option>Rehber</option><option>Destek Ekibi</option><option>Moderatör</option><option>İçerik Ekibi</option><option>Mimar</option></select></label>
              <label><span>Ad Soyad</span><input value={application.name} onChange={(event) => setApplication({ ...application, name: event.target.value })} minLength={3} maxLength={60} required /></label>
              <label><span>Yaş</span><input value={application.age} onChange={(event) => setApplication({ ...application, age: event.target.value.replace(/\D/g, "").slice(0, 2) })} inputMode="numeric" required /></label>
              <label><span>Oyun içi ismin</span><input value={application.gameName} onChange={(event) => setApplication({ ...application, gameName: event.target.value })} minLength={3} maxLength={16} required /></label>
              <label><span>Discord kullanıcı adın</span><input value={application.discord} onChange={(event) => setApplication({ ...application, discord: event.target.value })} minLength={2} maxLength={40} required /></label>
              <label><span>Haftalık ayırabileceğin süre</span><input value={application.weeklyHours} onChange={(event) => setApplication({ ...application, weeklyHours: event.target.value })} maxLength={60} placeholder="Örnek: Hafta içi her gün 2 saat" required /></label>
              <label><span>Daha önceki ekip deneyimin</span><textarea value={application.experience} onChange={(event) => setApplication({ ...application, experience: event.target.value })} rows={4} maxLength={300} required /></label>
              <label><span>Kendinden ve neden Dactylion&apos;da görev almak istediğinden bahset</span><textarea value={application.about} onChange={(event) => setApplication({ ...application, about: event.target.value })} rows={5} minLength={30} maxLength={400} required /></label>
              <div className="application-consent"><span>✓</span><p>Başvuruyu göndererek verdiğim bilgilerin personel değerlendirmesi için kullanılmasını kabul ediyorum.</p></div>
              <button className="red-button submit-button" type="submit" disabled={busy}>{player ? "BAŞVURUYU GÖNDER" : "ÖNCE OYUNCU GİRİŞİ YAP"}</button>
            </form>
          </section>
        )}

        {page === "rules" && (
          <article className="inner-page rules-page">
            <h1>Oyun Kuralları ve İşleyiş Hakkında</h1>
            <div className="rules-banner"><Image src={`${SITE_BASE_PATH}/og.png`} alt="Dactylion kuralları" fill sizes="100vw" /><div className="rules-banner-cover" /><BrandLogo size={92} /><div><span>DACTYLION NETWORK</span><b>KURALLAR</b><small>GÜVENLİ · ADİL · SAYGILI</small></div></div>
            <p className="rules-intro">Dactylion&apos;da herkes için güvenli, adil ve huzurlu bir oyun ortamı hedeflenir. Sunucuya giriş yapan her oyuncu aşağıdaki kuralları kabul etmiş sayılır.</p>
            <div className="rules-grid">
              <section><span>01</span><div><h2>Saygılı iletişim</h2><p>Hakaret, tehdit, nefret söylemi, taciz, kişisel bilgi paylaşımı ve sohbeti bilerek bozmak yasaktır.</p></div></section>
              <section><span>02</span><div><h2>Hile ve açık kullanımı</h2><p>Haksız avantaj sağlayan istemciler, otomasyonlar, makrolar, bug kullanımı ve bunları gizlemek yasaktır. Bulduğun açığı personele bildir.</p></div></section>
              <section><span>03</span><div><h2>Ekonomi güvenliği</h2><p>Gerçek para karşılığı oyuncular arası satış, dolandırıcılık, izinsiz hesap paylaşımı ve ekonomi açıklarından yararlanmak yasaktır.</p></div></section>
              <section><span>04</span><div><h2>Ada ve yapı güvenliği</h2><p>Sunucuyu zorlayan makineler, kasıtlı gecikme düzenekleri ve diğer oyuncuların alanlarına zarar veren yapılar kaldırtılabilir.</p></div></section>
              <section><span>05</span><div><h2>Hesap sorumluluğu</h2><p>Şifreni ve tek kullanımlık site kodunu kimseyle paylaşma. Hesabında yapılan işlemlerden hesap sahibi sorumludur.</p></div></section>
              <section><span>06</span><div><h2>Personel kararları</h2><p>Yaptırımlar kanıt ve kayıtlar incelenerek uygulanır. İtirazlar yalnızca destek sistemi üzerinden, saygılı biçimde yapılır.</p></div></section>
            </div>
            <div className="rules-note"><b>Kuralların amacı ceza vermek değil, topluluğu korumaktır.</b><p>Açık olmayan bir durumla karşılaşırsan işlem yapmadan önce destek talebi aç.</p><button className="red-button" type="button" onClick={() => navigate("support")}>DESTEK AÇ</button></div>
          </article>
        )}
      </div>

      <section className="recent-strip"><div className="recent-label"><small>TOPLULUK</small><b>Son Kayıtlar</b></div>{[player?.name ?? "Yeni oyuncu", "SkyVillager", "Ada Ustası", "Yeni oyuncu", "Dactylion üyesi"].map((name, index) => <div className="recent-user" key={`${name}-${index}`}><span className={`pixel-avatar avatar-${index + 1}`}>{name.charAt(0).toLocaleUpperCase("tr-TR")}</span><p><b>{name}</b><small>{index === 0 ? "şimdi" : `${index + 2} dakika önce`}</small></p></div>)}</section>

      <footer>
        <div className="footer-shell"><section className="footer-about"><BrandLogo size={86} /><div><b>DACTYLION NETWORK</b><p>Topluluk odaklı, uzun vadeli ilerleyiş sunan modern Türk SkyBlock deneyimi.</p></div></section><section><h2>Kurumsal</h2><button type="button" onClick={() => navigate("rules")}>Kurallar</button><button type="button" onClick={() => navigate("application")}>Başvuru</button><button type="button" onClick={() => navigate("support")}>Destek</button></section><section><h2>Oyuncu</h2><button type="button" onClick={() => navigate("credit")}>Kredi Yükle</button><span>Ürünler: /sitemarket</span><button type="button" onClick={copyAddress}>Sunucu IP</button></section><section className="footer-community"><h2>Topluluğa Katıl</h2><a href={DISCORD_URL} target="_blank" rel="noreferrer">Discord <span>→</span></a><p>Duyurular, destek ve etkinlikler tek yerde.</p></section><BrandLogo size={132} className="footer-watermark" /></div>
        <div className="footer-trust"><span>GÜVENLİ KREDİ TALEBİ</span><span>PERSONEL ONAYI</span><span>OYUN İÇİ TESLİMAT</span><span>7/24 KAYITLI DESTEK</span></div>
        <div className="footer-bottom"><span>© 2026 Dactylion Network. Tüm hakları saklıdır.</span><span>Mojang veya Microsoft ile bağlantılı değildir.</span></div>
      </footer>

      {loginOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setLoginOpen(false); }}><section className="login-modal" role="dialog" aria-modal="true" aria-labelledby="login-title"><button className="modal-close" type="button" onClick={() => setLoginOpen(false)}>×</button><BrandLogo size={82} /><small>GÜVENLİ OYUNCU GİRİŞİ</small><h2 id="login-title">Dactylion hesabınla giriş yap</h2><p>Sunucuda <b>/sitekod</b> yaz. Sana verilen tek kullanımlık 6 haneli kodu aşağıya gir.</p><input value={loginCode} onChange={(event) => setLoginCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" maxLength={6} onKeyDown={(event) => { if (event.key === "Enter") void login(); }} autoFocus />{loginError && <span className="form-error">{loginError}</span>}<button className="red-button" type="button" onClick={() => void login()} disabled={busy}>GİRİŞ YAP</button><em>Kod kısa süre geçerlidir ve yalnızca bir kez kullanılabilir.</em></section></div>}
      {toast && <button className="toast" type="button" onClick={() => setToast("")}>{toast}</button>}
    </main>
  );
}
