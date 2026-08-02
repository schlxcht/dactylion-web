"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

const SERVER_ADDRESS = "play.dactylion.net";
const SITE_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const MARKET_API = "https://dactylion-market-api.marcellusperrycxeh.chatgpt.site";
const TOKEN_KEY = "dactylion-market-token";

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
const statusText: Record<CreditRequest["status"], string> = { pending: "İnceleme bekliyor", processing: "İşleniyor", approved: "Onaylandı", rejected: "Reddedildi" };
const categoryText: Record<string, string> = { credit: "Kredi", payment: "Ödeme", technical: "Teknik", account: "Hesap", other: "Diğer" };

function BrandMark({ small = false }: { small?: boolean }) {
  return <span className={small ? "brand-mark brand-mark--small" : "brand-mark"} aria-hidden="true"><span>D</span></span>;
}
function money(priceKurus: number) { return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(priceKurus / 100); }
function date(value: number) { return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(value); }

export default function Home() {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
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
  const [supportCategory, setSupportCategory] = useState("technical");
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const selected = useMemo(() => packages.find((entry) => entry.id === selectedPackage) ?? packages[0], [packages, selectedPackage]);
  const showToast = useCallback((message: string) => { setToast(message); window.setTimeout(() => setToast(""), 6000); }, []);
  const authorizedFetch = useCallback(async (path: string, init?: RequestInit) => {
    if (!token) throw new Error("Önce oyuncu hesabına giriş yap.");
    const response = await fetch(`${MARKET_API}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error ?? "İşlem tamamlanamadı.");
    return data;
  }, [token]);
  const refreshPortal = useCallback(async () => {
    if (!token) return;
    try {
      const [me, requests, tickets] = await Promise.all([authorizedFetch("/api/me"), authorizedFetch("/api/credit-requests"), authorizedFetch("/api/support")]);
      setPlayer(me.player); setCreditRequests(requests.requests ?? []); setSupportTickets(tickets.tickets ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Oturum yenilenemedi.";
      if (message.includes("Oturum")) { window.sessionStorage.removeItem(TOKEN_KEY); setToken(""); setPlayer(null); }
      else showToast(message);
    }
  }, [authorizedFetch, showToast, token]);

  useEffect(() => {
    fetch(`${MARKET_API}/api/credit-packages`).then(async (response) => { if (!response.ok) throw new Error(); return response.json(); }).then((data) => { if (Array.isArray(data.packages) && data.packages.length) setPackages(data.packages); }).catch(() => undefined);
  }, []);
  useEffect(() => {
    if (!token) return;
    const timeout = window.setTimeout(() => void refreshPortal(), 0);
    return () => window.clearTimeout(timeout);
  }, [refreshPortal, token]);

  async function login() {
    const code = loginCode.replace(/\D/g, "").slice(0, 6);
    if (code.length !== 6) { setLoginError("Oyunda /sitekod yazarak aldığın 6 haneli kodu gir."); return; }
    setBusy(true); setLoginError("");
    try {
      const response = await fetch(`${MARKET_API}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Giriş yapılamadı.");
      window.sessionStorage.setItem(TOKEN_KEY, data.token); setToken(data.token); setPlayer(data.player); setLoginOpen(false); setLoginCode(""); showToast(`Hoş geldin ${data.player.name}.`);
    } catch (error) { setLoginError(error instanceof Error ? error.message : "Giriş yapılamadı."); }
    finally { setBusy(false); }
  }
  async function logout() {
    if (token) void fetch(`${MARKET_API}/api/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    window.sessionStorage.removeItem(TOKEN_KEY); setToken(""); setPlayer(null); setCreditRequests([]); setSupportTickets([]);
  }
  async function submitCreditRequest(event: FormEvent) {
    event.preventDefault(); if (!token) return setLoginOpen(true); setBusy(true);
    try { await authorizedFetch("/api/credit-requests", { method: "POST", body: JSON.stringify({ packageId: selectedPackage, paymentReference }) }); setPaymentReference(""); showToast("Kredi yükleme talebin alındı. Ödeme kontrolünden sonra bakiyene işlenecek."); await refreshPortal(); }
    catch (error) { showToast(error instanceof Error ? error.message : "Kredi talebi oluşturulamadı."); }
    finally { setBusy(false); }
  }
  async function submitSupport(event: FormEvent) {
    event.preventDefault(); if (!token) return setLoginOpen(true); setBusy(true);
    try { await authorizedFetch("/api/support", { method: "POST", body: JSON.stringify({ category: supportCategory, subject: supportSubject, message: supportMessage }) }); setSupportSubject(""); setSupportMessage(""); showToast("Destek talebin açıldı."); await refreshPortal(); }
    catch (error) { showToast(error instanceof Error ? error.message : "Destek talebi açılamadı."); }
    finally { setBusy(false); }
  }
  async function copyAddress() {
    try { await navigator.clipboard.writeText(SERVER_ADDRESS); setCopied(true); window.setTimeout(() => setCopied(false), 2200); }
    catch { showToast(`Sunucu adresi: ${SERVER_ADDRESS}`); }
  }

  return <main>
    <header className="site-header">
      <a className="header-brand" href="#anasayfa" aria-label="Dactylion ana sayfa"><BrandMark small /><span><b>DACTYLION</b><small>SKYBLOCK</small></span></a>
      <button className="menu-toggle" type="button" aria-label="Menüyü aç veya kapat" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span /><span /><span /></button>
      <nav className={menuOpen ? "main-nav main-nav--open" : "main-nav"} aria-label="Ana menü"><a className="active" href="#anasayfa">Anasayfa</a><a href="#kredi">Kredi Yükle</a><a href="#destek">Destek</a><a href="#kurallar">Kurallar</a></nav>
      <button className="account-button" type="button" onClick={() => player ? void logout() : setLoginOpen(true)}><span className="account-dot" />{player ? `${player.name} · ${player.credits.toLocaleString("tr-TR")} Kredi` : "Oyuncu Girişi"}</button>
    </header>

    <section className="hero" id="anasayfa" aria-labelledby="hero-title">
      <Image className="hero-art" src={`${SITE_BASE_PATH}/og.png`} alt="" fill priority sizes="100vw" /><div className="hero-shade" /><div className="hero-grid" />
      <div className="hero-content"><span className="hero-kicker"><i /> TÜRKİYE&apos;NİN YENİ SKYBLOCK DENEYİMİ</span><h1 id="hero-title">Adanı kur.<br /><em>Ekonomini büyüt.</em></h1><p>Dactylion&apos;da her blok bir başlangıçtır. Adanı geliştir, üretimini otomatikleştir ve zirveye çık.</p><div className="hero-actions"><button className="primary-button" type="button" onClick={copyAddress}>{copied ? "IP KOPYALANDI" : "HEMEN OYNA"}<span>↗</span></button><a className="text-button" href="#kredi">KREDİ PORTALI <span>↓</span></a></div><div className="hero-stats"><div><b>1.21+</b><span>SÜRÜM</span></div><div><b>7/24</b><span>AKTİF</span></div><div><b>TR</b><span>TOPLULUK</span></div></div></div>
    </section>

    <section className="quick-strip" aria-label="Sunucu bağlantıları">
      <button className="quick-card" type="button" onClick={copyAddress}><span className="quick-icon">⌁</span><span><small>SUNUCU ADRESİ</small><b>{SERVER_ADDRESS}</b></span><span className="quick-action">{copied ? "KOPYALANDI" : "KOPYALA"}</span></button>
      <div className="center-emblem"><BrandMark /></div>
      <a className="quick-card quick-card--right" href="#kredi"><span className="quick-icon">◆</span><span><small>GÜVENLİ OYUNCU PORTALI</small><b>Kredi ve destek işlemleri</b></span><span className="quick-action">AÇ</span></a>
    </section>

    <section className="portal-intro" id="kredi">
      <div className="section-heading"><span className="section-index">01</span><div><p>OYUNCU PORTALI</p><h2>Kredini yükle.<br /><em>Oyunda harca.</em></h2></div><p className="section-copy">Web sitesinde ürün satışı bulunmaz. Kredi onaylandıktan sonra sunucuda <b>/sitemarket</b> yazarak alışveriş yapabilirsin.</p></div>
      <div className="portal-flow"><article><span>01</span><b>OYUNDA GİRİŞ KODU AL</b><p><code>/sitekod</code> yaz ve tek kullanımlık kodla siteye giriş yap.</p></article><article><span>02</span><b>KREDİ TALEBİ OLUŞTUR</b><p>Paketini ve ödeme referansını gönder; personel ödemeyi kontrol etsin.</p></article><article><span>03</span><b>OYUNDA HARCAMA YAP</b><p>Onaylanan bakiye aynı hesaba gelir. Ürünleri yalnızca <code>/sitemarket</code> üzerinden al.</p></article></div>
    </section>

    <section className="store-section credit-section">
      <div className="store-intro"><span className="red-label">MERKEZİ KREDİ HESABI</span><h2>Tek bakiye.<br /><em>Güvenli teslimat.</em></h2><p className="store-copy">Site ve oyun aynı kredi hesabını kullanır. Site sadece kredi yükleme talebi alır; hiçbir ürün web üzerinden satılmaz.</p><div className="security-note"><span>◆</span> ÜRÜNLER YALNIZCA OYUN İÇİNDE · /SITEMARKET</div><div className="store-account">{player ? <><small>GİRİŞ YAPILDI</small><b>{player.name}</b><strong>{player.credits.toLocaleString("tr-TR")} Kredi</strong><button type="button" onClick={() => void logout()}>ÇIKIŞ YAP</button></> : <><small>OYUNCU HESABI</small><b>Oyunda /sitekod yaz</b><button type="button" onClick={() => setLoginOpen(true)}>KODLA GİRİŞ YAP</button></>}</div></div>
      <div className="portal-panel"><div className="panel-heading"><span>KREDİ YÜKLEME</span><h3>Paketini seç</h3><p>Her oyuncunun aynı anda yalnızca bir bekleyen talebi olabilir.</p></div><form onSubmit={submitCreditRequest}><div className="credit-package-grid">{packages.map((entry) => <button className={selectedPackage === entry.id ? "credit-package active" : "credit-package"} type="button" key={entry.id} onClick={() => setSelectedPackage(entry.id)}><small>DACTYLION KREDİ</small><b>{entry.credits.toLocaleString("tr-TR")}</b><span>{money(entry.priceKurus)}</span></button>)}</div><label className="portal-field"><span>Ödeme / işlem referansı</span><input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} minLength={6} maxLength={80} placeholder="Dekont veya işlem referansını yaz" required /><small>Personel yalnızca eşleşen ve doğrulanmış ödemeleri onaylar. Ödeme bilgilerini veya kart şifreni yazma.</small></label><button className="primary-button portal-submit" type="submit" disabled={busy}>{player ? `${selected?.credits.toLocaleString("tr-TR") ?? ""} KREDİ TALEBİ GÖNDER` : "ÖNCE OYUNCU GİRİŞİ YAP"}</button></form>
        {player && <div className="request-history"><div className="history-title"><b>Son kredi taleplerin</b><button type="button" onClick={() => void refreshPortal()}>YENİLE</button></div>{creditRequests.length === 0 ? <p className="empty-state">Henüz kredi yükleme talebin yok.</p> : creditRequests.map((entry) => <article key={entry.id}><div><b>{entry.credits.toLocaleString("tr-TR")} Kredi</b><span>{money(entry.price_kurus)} · {date(entry.created_at)}</span></div><strong data-status={entry.status}>{statusText[entry.status]}</strong></article>)}</div>}
      </div>
    </section>

    <section className="support-section" id="destek">
      <div className="section-heading section-heading--compact"><span className="section-index">02</span><div><p>OYUNCU DESTEĞİ</p><h2>Yardıma mı<br /><em>ihtiyacın var?</em></h2></div><p className="section-copy">Hesap, kredi, ödeme veya teknik sorun için kayıt aç. Talebin oyuncu kimliğinle eşleştirilir.</p></div>
      <div className="support-grid"><form className="portal-panel support-form" onSubmit={submitSupport}><label className="portal-field"><span>Kategori</span><select value={supportCategory} onChange={(event) => setSupportCategory(event.target.value)}><option value="technical">Teknik sorun</option><option value="account">Hesap</option><option value="credit">Kredi</option><option value="payment">Ödeme</option><option value="other">Diğer</option></select></label><label className="portal-field"><span>Konu</span><input value={supportSubject} onChange={(event) => setSupportSubject(event.target.value)} minLength={5} maxLength={80} placeholder="Sorunu kısaca anlat" required /></label><label className="portal-field"><span>Açıklama</span><textarea value={supportMessage} onChange={(event) => setSupportMessage(event.target.value)} minLength={10} maxLength={1000} rows={7} placeholder="Yaşadığın sorunu, hata mesajını ve gerekli ayrıntıları yaz" required /></label><button className="primary-button portal-submit" type="submit" disabled={busy}>{player ? "DESTEK TALEBİ AÇ" : "ÖNCE OYUNCU GİRİŞİ YAP"}</button></form>
        <div className="portal-panel ticket-history"><div className="history-title"><b>Destek kayıtların</b>{player && <button type="button" onClick={() => void refreshPortal()}>YENİLE</button>}</div>{!player ? <div className="locked-state"><BrandMark small /><b>Oyuncu girişi gerekli</b><p>Oyunda <code>/sitekod</code> yazıp hesabınla giriş yap.</p><button type="button" onClick={() => setLoginOpen(true)}>GİRİŞ YAP</button></div> : supportTickets.length === 0 ? <p className="empty-state">Henüz destek kaydın yok.</p> : supportTickets.map((ticket) => <article className="ticket-row" key={ticket.id}><div><span>{categoryText[ticket.category] ?? "Diğer"} · {date(ticket.created_at)}</span><b>{ticket.subject}</b><p>{ticket.message}</p></div><strong data-status={ticket.status}>{ticket.status === "open" ? "Açık" : "Kapalı"}</strong></article>)}</div>
      </div>
    </section>

    <section className="community-section"><div><span className="red-label">OYUN İÇİ MARKET</span><h2>Ürünleri sunucuda seç.</h2><p>VIP, spawner, anahtar ve diğer içerikler web sitesinde listelenmez. Sunucuda <b>/sitemarket</b> komutunu kullan.</p></div><button className="primary-button" type="button" onClick={copyAddress}>{copied ? "IP KOPYALANDI" : "SUNUCU IP'SİNİ KOPYALA"}<span>↗</span></button></section>

    <footer id="kurallar"><div className="footer-main"><a className="header-brand" href="#anasayfa"><BrandMark small /><span><b>DACTYLION</b><small>NETWORK</small></span></a><p>Yeni nesil, topluluk odaklı SkyBlock deneyimi.</p><div className="footer-links"><div><b>PORTAL</b><a href="#kredi">Kredi yükle</a><a href="#destek">Destek</a></div><div><b>GÜVENLİK</b><button type="button" onClick={() => setNoticeOpen(true)}>Kurallar ve gizlilik</button><span>Şifreni asla paylaşma</span></div></div></div><div className="footer-bottom"><span>© 2026 Dactylion Network. Tüm hakları saklıdır.</span><span>Mojang veya Microsoft ile bağlantılı değildir.</span></div></footer>

    {noticeOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setNoticeOpen(false)}><section className="notice-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" type="button" aria-label="Pencereyi kapat" onClick={() => setNoticeOpen(false)}>×</button><span className="red-label">GÜVENLİK</span><h2>Hesabını koru.</h2><p>Dactylion personeli Minecraft veya ödeme şifreni istemez. Siteye yalnızca oyundaki <b>/sitekod</b> ile giriş yap. Ürünleri yalnızca sunucudaki <b>/sitemarket</b> menüsünden satın al.</p><button className="primary-button" type="button" onClick={() => setNoticeOpen(false)}>ANLADIM</button></section></div>}
    {loginOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setLoginOpen(false)}><section className="notice-modal login-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" type="button" aria-label="Pencereyi kapat" onClick={() => setLoginOpen(false)}>×</button><span className="red-label">GÜVENLİ OYUNCU GİRİŞİ</span><h2>Oyunda /sitekod yaz.</h2><p>Sunucunun verdiği tek kullanımlık 6 haneli kodu gir. Minecraft şifreni hiçbir zaman istemeyiz.</p><input aria-label="6 haneli giriş kodu" inputMode="numeric" maxLength={6} value={loginCode} onChange={(event) => setLoginCode(event.target.value.replace(/\D/g, "").slice(0, 6))} onKeyDown={(event) => { if (event.key === "Enter") void login(); }} placeholder="000000" autoFocus />{loginError && <span className="form-error">{loginError}</span>}<button className="primary-button" type="button" disabled={busy} onClick={() => void login()}>{busy ? "BAĞLANIYOR..." : "HESABIMA GİR"}</button></section></div>}
    {toast && <button className="market-toast" type="button" onClick={() => setToast("")}>{toast}</button>}
  </main>;
}
