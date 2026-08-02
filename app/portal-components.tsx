"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

export type StaffRole = "player" | "guide" | "moderator" | "admin" | "founder";

export type Permissions = {
  profileSelf: boolean;
  supportSelf: boolean;
  creditSelf: boolean;
  supportRead: boolean;
  supportReply: boolean;
  supportManage: boolean;
  playerRead: boolean;
  playerManage: boolean;
  creditManage: boolean;
  auditRead: boolean;
};

export type Player = {
  uuid: string;
  name: string;
  credits: number;
  staffRole: StaffRole;
  islandLevel: string;
  balanceKurus: number;
  authRegistered: boolean;
  registeredAt: number | null;
  lastSeenAt: number | null;
  profileSyncedAt: number | null;
  permissions: Permissions;
};

export type CreditRequest = {
  id: string;
  uuid?: string;
  player_name?: string;
  package_id?: string;
  credits: number;
  price_kurus: number;
  payment_reference?: string;
  status: "pending" | "processing" | "approved" | "rejected";
  created_at: number;
  updated_at?: number;
};

export type SupportTicket = {
  id: string;
  uuid?: string;
  player_name?: string;
  category: string;
  subject: string;
  message: string;
  status: "open" | "closed";
  assigned_to?: string | null;
  created_at: number;
  updated_at?: number;
};

type Order = {
  id: string;
  item_name: string;
  price: number;
  status: string;
  created_at: number;
};

type AuthorizedFetch = (path: string, init?: RequestInit) => Promise<Record<string, unknown>>;

const roleNames: Record<StaffRole, string> = {
  player: "Oyuncu",
  guide: "Rehber",
  moderator: "Moderatör",
  admin: "Yönetici",
  founder: "Kurucu",
};

const categoryNames: Record<string, string> = {
  credit: "Kredi",
  payment: "Ödeme",
  technical: "Teknik",
  account: "Hesap",
  other: "Diğer",
};

function date(value?: number | null) {
  if (!value) return "Henüz kayıt yok";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function money(kurus: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(kurus / 100);
}

function number(value: string | number) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(parsed) : "0";
}

export function ProfilePage({
  player,
  creditRequests,
  supportTickets,
  orders,
  onNavigate,
  onLogout,
}: {
  player: Player | null;
  creditRequests: CreditRequest[];
  supportTickets: SupportTicket[];
  orders: Order[];
  onNavigate: (page: "credit" | "support" | "staff") => void;
  onLogout: () => void;
}) {
  if (!player) {
    return <section className="white-card portal-login-required"><span>▦</span><h1>Profil için giriş yap</h1><p>Oyunda AuthMe ile oluşturduğun kullanıcı adı ve şifreyi kullan.</p></section>;
  }

  const openTickets = supportTickets.filter((ticket) => ticket.status === "open").length;
  return (
    <section className="profile-layout">
      <aside className="profile-sidebar white-card">
        <div className="minecraft-avatar" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://mc-heads.net/avatar/${encodeURIComponent(player.name)}/112`} alt="" />
        </div>
        <small>DACTYLION OYUNCUSU</small>
        <h1>{player.name}</h1>
        <span className={`role-badge role-${player.staffRole}`}>{roleNames[player.staffRole]}</span>
        <nav aria-label="Profil menüsü">
          <b>HESABIM</b>
          <button className="active" type="button">▦ Profil</button>
          <button type="button" onClick={() => onNavigate("support")}>▣ Destek Talepleri</button>
          <button type="button" onClick={() => onNavigate("credit")}>◆ Kredi Geçmişi</button>
          {player.permissions.supportRead && <button type="button" onClick={() => onNavigate("staff")}>⚙ Personel Paneli</button>}
          <b>GÜVENLİK</b>
          <button type="button" onClick={onLogout}>↪ Güvenli Çıkış</button>
        </nav>
      </aside>

      <div className="profile-content">
        <div className="profile-title"><div><small>OYUNCU PORTALI</small><h1>Hesap detayları</h1><p>Bu bilgiler Minecraft sunucusundan güvenli biçimde eşitlenir.</p></div><span>AuthMe bağlı</span></div>
        <div className="profile-stat-grid">
          <article><small>KREDİ BAKİYESİ</small><b>{player.credits.toLocaleString("tr-TR")}</b><span>Kredi</span></article>
          <article><small>OYUN BAKİYESİ</small><b>{money(player.balanceKurus)}</b><span>Vault</span></article>
          <article><small>ADA SEVİYESİ</small><b>{number(player.islandLevel)}</b><span>SuperiorSkyblock2</span></article>
          <article><small>AÇIK DESTEK</small><b>{openTickets}</b><span>{supportTickets.length} toplam kayıt</span></article>
        </div>

        <section className="white-card account-details">
          <div className="panel-heading"><div><small>KİMLİK VE GÜVENLİK</small><h2>Detaylar</h2></div><span className={`role-badge role-${player.staffRole}`}>{roleNames[player.staffRole]}</span></div>
          <dl>
            <div><dt>Minecraft kullanıcı adı</dt><dd>{player.name}</dd></div>
            <div><dt>Site rolü</dt><dd>{roleNames[player.staffRole]}</dd></div>
            <div><dt>AuthMe kaydı</dt><dd>{player.authRegistered ? "Doğrulandı" : "Eşitleme bekliyor"}</dd></div>
            <div><dt>Kayıt tarihi</dt><dd>{date(player.registeredAt)}</dd></div>
            <div><dt>Son görülme</dt><dd>{date(player.lastSeenAt)}</dd></div>
            <div><dt>Son profil eşitlemesi</dt><dd>{date(player.profileSyncedAt)}</dd></div>
          </dl>
          <p className="security-note">Şifren site veritabanında tutulmaz. Giriş doğrulaması doğrudan Minecraft sunucusundaki AuthMe tarafından yapılır.</p>
        </section>

        <div className="profile-tables">
          <section className="white-card compact-panel"><div className="panel-heading"><div><small>SON HAREKETLER</small><h2>Kredi talepleri</h2></div><button type="button" onClick={() => onNavigate("credit")}>TÜMÜ →</button></div>{creditRequests.length ? creditRequests.slice(0, 5).map((entry) => <div className="compact-row" key={entry.id}><span>+{entry.credits.toLocaleString("tr-TR")}</span><p><b>{money(entry.price_kurus)}</b><small>{date(entry.created_at)}</small></p><i data-status={entry.status}>{entry.status === "approved" ? "Onaylandı" : entry.status === "rejected" ? "Reddedildi" : "Bekliyor"}</i></div>) : <div className="compact-empty">Henüz kredi talebin yok.</div>}</section>
          <section className="white-card compact-panel"><div className="panel-heading"><div><small>OYUN İÇİ MARKET</small><h2>Siparişler</h2></div><span>/sitemarket</span></div>{orders.length ? orders.slice(0, 5).map((entry) => <div className="compact-row" key={entry.id}><span>◆</span><p><b>{entry.item_name}</b><small>{date(entry.created_at)}</small></p><i>{entry.price.toLocaleString("tr-TR")} Kredi</i></div>) : <div className="compact-empty">Henüz oyun içi siparişin yok.</div>}</section>
        </div>
      </div>
    </section>
  );
}

type StaffOverview = {
  role: StaffRole;
  permissions: Permissions;
  counts: { tickets: number; openTickets: number; players: number | null; pendingCredits: number | null };
};

type StaffPlayer = {
  uuid: string;
  name: string;
  credits: number;
  staff_role: StaffRole;
  island_level: string;
  balance_kurus: number;
  site_locked: number;
  lock_reason: string;
  last_seen_at: number | null;
};

export function StaffPanel({ player, api, notify }: { player: Player | null; api: AuthorizedFetch; notify: (message: string) => void }) {
  const [overview, setOverview] = useState<StaffOverview | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [players, setPlayers] = useState<StaffPlayer[]>([]);
  const [creditRequests, setCreditRequests] = useState<CreditRequest[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<string>("");
  const [reply, setReply] = useState("");
  const [search, setSearch] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [lockReason, setLockReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!player?.permissions.supportRead) return;
    try {
      const [overviewData, ticketData, playerData, creditData] = await Promise.all([
        api("/api/staff/overview"),
        api("/api/staff/tickets?status=open"),
        player.permissions.playerRead ? api(`/api/staff/players${search ? `?q=${encodeURIComponent(search)}` : ""}`) : Promise.resolve({ players: [] }),
        player.permissions.creditManage ? api("/api/staff/credit-requests") : Promise.resolve({ requests: [] }),
      ]);
      setOverview(overviewData as unknown as StaffOverview);
      setTickets((ticketData.tickets ?? []) as SupportTicket[]);
      setPlayers((playerData.players ?? []) as StaffPlayer[]);
      setCreditRequests((creditData.requests ?? []) as CreditRequest[]);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Personel paneli yüklenemedi.");
    }
  }, [api, notify, player, search]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const activeTicket = useMemo(() => tickets.find((ticket) => ticket.id === selectedTicket) ?? tickets[0], [selectedTicket, tickets]);
  const activePlayer = useMemo(() => players.find((entry) => entry.uuid === selectedPlayer) ?? players[0], [players, selectedPlayer]);

  async function submitReply(event: FormEvent) {
    event.preventDefault();
    if (!activeTicket || reply.trim().length < 2) return;
    setBusy(true);
    try {
      await api(`/api/staff/tickets/${activeTicket.id}/reply`, { method: "POST", body: JSON.stringify({ message: reply }) });
      setReply("");
      notify("Destek yanıtı gönderildi.");
      await load();
    } catch (error) { notify(error instanceof Error ? error.message : "Yanıt gönderilemedi."); }
    finally { setBusy(false); }
  }

  async function changeTicketStatus(status: "open" | "closed") {
    if (!activeTicket) return;
    setBusy(true);
    try {
      await api(`/api/staff/tickets/${activeTicket.id}/status`, { method: "POST", body: JSON.stringify({ status }) });
      notify(status === "closed" ? "Destek talebi kapatıldı." : "Destek talebi yeniden açıldı.");
      setSelectedTicket("");
      await load();
    } catch (error) { notify(error instanceof Error ? error.message : "Talep güncellenemedi."); }
    finally { setBusy(false); }
  }

  async function adjustCredit(event: FormEvent) {
    event.preventDefault();
    if (!activePlayer) return;
    setBusy(true);
    try {
      await api(`/api/staff/players/${activePlayer.uuid}/credit`, { method: "POST", body: JSON.stringify({ amount: Number(creditAmount), reason: creditReason }) });
      setCreditAmount(""); setCreditReason("");
      notify(`${activePlayer.name} hesabının kredisi güncellendi.`);
      await load();
    } catch (error) { notify(error instanceof Error ? error.message : "Kredi güncellenemedi."); }
    finally { setBusy(false); }
  }

  async function setLocked(locked: boolean) {
    if (!activePlayer) return;
    setBusy(true);
    try {
      await api(`/api/staff/players/${activePlayer.uuid}/lock`, { method: "POST", body: JSON.stringify({ locked, reason: lockReason }) });
      setLockReason("");
      notify(locked ? "Site hesabı kilitlendi ve oturumları kapatıldı." : "Site hesabının kilidi açıldı.");
      await load();
    } catch (error) { notify(error instanceof Error ? error.message : "Hesap güncellenemedi."); }
    finally { setBusy(false); }
  }

  async function reviewCredit(id: string, action: "approve" | "reject") {
    setBusy(true);
    try {
      await api(`/api/staff/credit-requests/${id}/${action}`, { method: "POST", body: "{}" });
      notify(action === "approve" ? "Kredi talebi onaylandı." : "Kredi talebi reddedildi.");
      await load();
    } catch (error) { notify(error instanceof Error ? error.message : "Talep işlenemedi."); }
    finally { setBusy(false); }
  }

  if (!player?.permissions.supportRead) return <section className="white-card portal-login-required"><span>⚑</span><h1>Personel yetkisi gerekli</h1><p>Bu panel yalnızca LuckPerms üzerinden yetkilendirilen personele açıktır.</p></section>;

  return (
    <section className="staff-page">
      <div className="profile-title"><div><small>DACTYLION YÖNETİM</small><h1>Personel paneli</h1><p>Yetkiler oyun içindeki LuckPerms personel rolünden otomatik alınır.</p></div><span className={`role-badge role-${player.staffRole}`}>{roleNames[player.staffRole]}</span></div>
      <div className="staff-stat-grid"><article><small>AÇIK DESTEK</small><b>{overview?.counts.openTickets ?? 0}</b></article><article><small>TOPLAM DESTEK</small><b>{overview?.counts.tickets ?? 0}</b></article>{player.permissions.playerRead && <article><small>OYUNCU HESABI</small><b>{overview?.counts.players ?? 0}</b></article>}{player.permissions.creditManage && <article><small>KREDİ ONAYI</small><b>{overview?.counts.pendingCredits ?? 0}</b></article>}</div>

      <section className="staff-workspace white-card">
        <div className="staff-list"><div className="panel-heading"><div><small>DESTEK KUYRUĞU</small><h2>Açık talepler</h2></div><button type="button" onClick={() => void load()}>YENİLE</button></div>{tickets.length ? tickets.map((ticket) => <button className={activeTicket?.id === ticket.id ? "active" : ""} type="button" key={ticket.id} onClick={() => setSelectedTicket(ticket.id)}><span>#{ticket.id.slice(0, 8)}</span><b>{ticket.subject}</b><small>{ticket.player_name} · {categoryNames[ticket.category] ?? "Diğer"}</small></button>) : <div className="compact-empty">Açık destek talebi yok.</div>}</div>
        <div className="staff-detail">{activeTicket ? <><small>#{activeTicket.id.slice(0, 8)} · {categoryNames[activeTicket.category] ?? "Diğer"}</small><h2>{activeTicket.subject}</h2><p>{activeTicket.message}</p><em>{activeTicket.player_name} · {date(activeTicket.created_at)}</em><form onSubmit={submitReply}><textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={4} minLength={2} maxLength={1000} placeholder="Oyuncuya yanıt yaz..." required /><div><button type="submit" className="red-button" disabled={busy}>YANITLA</button>{player.permissions.supportManage && <button type="button" onClick={() => void changeTicketStatus("closed")} disabled={busy}>TALEBİ KAPAT</button>}</div></form></> : <div className="compact-empty">İncelenecek talep seç.</div>}</div>
      </section>

      {player.permissions.playerRead && <section className="player-manager white-card"><div className="panel-heading"><div><small>HESAP YÖNETİMİ</small><h2>Oyuncular</h2></div><form onSubmit={(event) => { event.preventDefault(); void load(); }}><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Oyuncu ara" /><button type="submit">ARA</button></form></div><div className="manager-layout"><div className="manager-players">{players.map((entry) => <button type="button" className={activePlayer?.uuid === entry.uuid ? "active" : ""} key={entry.uuid} onClick={() => setSelectedPlayer(entry.uuid)}><b>{entry.name}</b><span>{entry.credits.toLocaleString("tr-TR")} Kredi</span><i data-status={entry.site_locked ? "closed" : "open"}>{entry.site_locked ? "Kilitli" : "Aktif"}</i></button>)}</div>{activePlayer && <div className="manager-detail"><h3>{activePlayer.name}</h3><dl><div><dt>Kredi</dt><dd>{activePlayer.credits.toLocaleString("tr-TR")}</dd></div><div><dt>Ada seviyesi</dt><dd>{number(activePlayer.island_level)}</dd></div><div><dt>Oyun bakiyesi</dt><dd>{money(activePlayer.balance_kurus)}</dd></div><div><dt>Son görülme</dt><dd>{date(activePlayer.last_seen_at)}</dd></div></dl>{player.permissions.playerManage && <><form onSubmit={adjustCredit}><label><span>Kredi değişimi</span><input value={creditAmount} onChange={(event) => setCreditAmount(event.target.value.replace(/[^0-9-]/g, ""))} placeholder="Örnek: 500 veya -100" required /></label><label><span>İşlem gerekçesi</span><input value={creditReason} onChange={(event) => setCreditReason(event.target.value)} minLength={4} maxLength={200} required /></label><button className="red-button" type="submit" disabled={busy}>KREDİYİ GÜNCELLE</button></form><label><span>Hesap kilidi gerekçesi</span><input value={lockReason} onChange={(event) => setLockReason(event.target.value)} minLength={4} maxLength={200} placeholder="Yalnızca kilitlerken zorunlu" /></label><div className="manager-actions"><button type="button" onClick={() => void setLocked(!Boolean(activePlayer.site_locked))} disabled={busy}>{activePlayer.site_locked ? "KİLİDİ AÇ" : "HESABI KİLİTLE"}</button><button type="button" onClick={() => void api(`/api/staff/players/${activePlayer.uuid}/sessions/revoke`, { method: "POST", body: "{}" }).then(() => notify("Oyuncunun site oturumları kapatıldı.")).catch((error: Error) => notify(error.message))}>OTURUMLARI KAPAT</button></div></>}</div>}</div></section>}

      {player.permissions.creditManage && <section className="white-card credit-review"><div className="panel-heading"><div><small>ÖDEME KONTROLÜ</small><h2>Kredi talepleri</h2></div><span>Yalnızca doğrulanmış ödemeyi onayla</span></div>{creditRequests.filter((entry) => entry.status === "pending").length ? creditRequests.filter((entry) => entry.status === "pending").map((entry) => <div className="review-row" key={entry.id}><p><b>{entry.player_name}</b><small>{entry.payment_reference} · {date(entry.created_at)}</small></p><strong>{entry.credits.toLocaleString("tr-TR")} Kredi</strong><span>{money(entry.price_kurus)}</span><div><button type="button" onClick={() => void reviewCredit(entry.id, "reject")} disabled={busy}>REDDET</button><button className="red-button" type="button" onClick={() => void reviewCredit(entry.id, "approve")} disabled={busy}>ONAYLA</button></div></div>) : <div className="compact-empty">Bekleyen kredi talebi yok.</div>}</section>}
    </section>
  );
}
