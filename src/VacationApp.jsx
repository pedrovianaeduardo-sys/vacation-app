import { useState, useMemo, useEffect } from "react";

// ─── INITIAL DATA ────────────────────────────────────────────────────────────
const TODAY = new Date("2026-02-12");

const initialEmployees = [
  { id: 1, name: "Bruno Rita",        admission: "2022-03-15", accrualStart: "2025-03-15", accrualEnd: "2026-03-14", totalDays: 30, usedDays: 0,  soldDays: 0, expiration: "2026-09-14" },
  { id: 2, name: "Douglas Magalhães", admission: "2021-07-01", accrualStart: "2024-07-01", accrualEnd: "2025-06-30", totalDays: 30, usedDays: 10, soldDays: 0, expiration: "2026-03-01" },
  { id: 3, name: "Fabiano Silvério",  admission: "2020-01-20", accrualStart: "2025-01-20", accrualEnd: "2026-01-19", totalDays: 30, usedDays: 0,  soldDays: 0, expiration: "2026-07-19" },
  { id: 4, name: "Filipe da Costa",   admission: "2023-05-08", accrualStart: "2025-05-08", accrualEnd: "2026-05-07", totalDays: 30, usedDays: 15, soldDays: 0, expiration: "2026-11-07" },
  { id: 5, name: "João Junior",       admission: "2021-11-22", accrualStart: "2024-11-22", accrualEnd: "2025-11-21", totalDays: 30, usedDays: 0,  soldDays: 5, expiration: "2026-02-21" },
  { id: 6, name: "João Paulo",        admission: "2022-08-14", accrualStart: "2025-08-14", accrualEnd: "2026-08-13", totalDays: 30, usedDays: 20, soldDays: 0, expiration: "2027-02-13" },
  { id: 7, name: "William Oliveira",  admission: "2020-06-30", accrualStart: "2025-06-30", accrualEnd: "2026-06-29", totalDays: 30, usedDays: 5,  soldDays: 0, expiration: "2026-12-29" },
  { id: 8, name: "Victor Fonseca",    admission: "2023-09-04", accrualStart: "2025-09-04", accrualEnd: "2026-09-03", totalDays: 30, usedDays: 0,  soldDays: 0, expiration: "2027-03-03" },
];

const initialVacations = [
  { id: 1,  employeeId: 2, start: "2026-02-16", end: "2026-02-25", status: "planned",     type: "vacation", note: "Primeira parcela" },
  { id: 2,  employeeId: 5, start: "2026-02-09", end: "2026-02-19", status: "in_progress", type: "vacation", note: "Urgente – vence em breve" },
  { id: 3,  employeeId: 4, start: "2026-01-05", end: "2026-01-19", status: "completed",   type: "vacation", note: "" },
  { id: 4,  employeeId: 6, start: "2025-12-20", end: "2026-01-08", status: "completed",   type: "vacation", note: "" },
  { id: 5,  employeeId: 3, start: "2026-03-10", end: "2026-03-24", status: "planned",     type: "vacation", note: "" },
  { id: 6,  employeeId: 1, start: "2026-04-06", end: "2026-04-20", status: "planned",     type: "vacation", note: "" },
  { id: 7,  employeeId: 7, start: "2026-02-16", end: "2026-03-02", status: "planned",     type: "vacation", note: "" },
  { id: 8,  employeeId: 8, start: "2026-05-04", end: "2026-05-18", status: "planned",     type: "vacation", note: "" },
];

const initialLogs = [
  { id: 1, ts: "2026-02-01 09:12", action: "CRIADO",   empName: "Douglas Magalhães", desc: "Férias planejadas 16/02 – 25/02" },
  { id: 2, ts: "2026-02-05 14:30", action: "CRIADO",   empName: "João Junior",       desc: "Férias em andamento 09/02 – 19/02 (urgente)" },
  { id: 3, ts: "2026-02-10 10:05", action: "ALERTA",   empName: "João Junior",       desc: "Férias vencem em 09 dias – ação necessária" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const parseDate = (s) => new Date(s + "T00:00:00");
const fmt = (d) => {
  const dt = typeof d === "string" ? parseDate(d) : d;
  return dt.toLocaleDateString("pt-BR");
};
const diffDays = (a, b) => Math.round((parseDate(b) - parseDate(a)) / 86400000) + 1;
const daysUntil = (dateStr) => Math.round((parseDate(dateStr) - TODAY) / 86400000);
const isoToday = () => TODAY.toISOString().split("T")[0];

function getStatus(emp) {
  const d = daysUntil(emp.expiration);
  if (d <= 0)  return "expired";
  if (d <= 30) return "critical";
  if (d <= 60) return "warning";
  return "ok";
}

function statusLabel(s) {
  return { expired: "Vencida", critical: "Crítico", warning: "Atenção", ok: "OK" }[s];
}

function vacationDays(vac) { return diffDays(vac.start, vac.end); }

const COLORS = {
  planned:     "#2563EB",
  in_progress: "#16A34A",
  completed:   "#6B7280",
  conflict:    "#DC2626",
  expiring:    "#D97706",
};

function initials(name) {
  return name.split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase();
}

function avatarColor(id) {
  const palette = ["#2563EB","#7C3AED","#0891B2","#059669","#D97706","#DC2626","#C026D3","#EA580C"];
  return palette[id % palette.length];
}

function detectConflicts(vacations) {
  const conflicts = new Set();
  const active = vacations.filter(v => v.status !== "completed");
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i], b = active[j];
      if (a.employeeId !== b.employeeId && parseDate(a.start) <= parseDate(b.end) && parseDate(b.start) <= parseDate(a.end)) {
        conflicts.add(a.id);
        conflicts.add(b.id);
      }
    }
  }
  return conflicts;
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [employees, setEmployees]   = useState(initialEmployees);
  const [vacations, setVacations]   = useState(initialVacations);
  const [logs, setLogs]             = useState(initialLogs);
  const [view, setView]             = useState("dashboard");
  const [calMonth, setCalMonth]     = useState({ year: 2026, month: 2 });
  const [modal, setModal]           = useState(null); // {type, data?}
  const [toast, setToast]           = useState(null);

  const conflicts = useMemo(() => detectConflicts(vacations), [vacations]);

  function addLog(action, empName, desc) {
    const now = new Date();
    const ts = `${now.toLocaleDateString("pt-BR")} ${now.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}`;
    setLogs(l => [{ id: Date.now(), ts, action, empName, desc }, ...l]);
  }

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }

  function saveEmployee(emp) {
    if (emp.id) {
      setEmployees(es => es.map(e => e.id === emp.id ? emp : e));
      addLog("EDITADO", emp.name, "Dados do colaborador atualizados");
    } else {
      const newEmp = { ...emp, id: Date.now() };
      setEmployees(es => [...es, newEmp]);
      addLog("CRIADO", emp.name, "Colaborador cadastrado no sistema");
    }
    showToast(emp.id ? "Colaborador atualizado!" : "Colaborador criado!");
    setModal(null);
  }

  function removeEmployee(id) {
    const emp = employees.find(e => e.id === id);
    setEmployees(es => es.filter(e => e.id !== id));
    setVacations(vs => vs.filter(v => v.employeeId !== id));
    addLog("REMOVIDO", emp.name, "Colaborador excluído do sistema");
    showToast("Colaborador removido.", "warn");
    setModal(null);
  }

  function saveVacation(vac) {
    const emp = employees.find(e => e.id === vac.employeeId);
    const days = diffDays(vac.start, vac.end);
    if (vac.id) {
      setVacations(vs => vs.map(v => v.id === vac.id ? vac : v));
      addLog("EDITADO", emp?.name ?? "—", `Férias ajustadas: ${fmt(vac.start)} – ${fmt(vac.end)} (${days} dias)`);
    } else {
      const newV = { ...vac, id: Date.now() };
      setVacations(vs => [...vs, newV]);
      addLog("CRIADO", emp?.name ?? "—", `Férias registradas: ${fmt(vac.start)} – ${fmt(vac.end)} (${days} dias)`);
      // update employee used days
      if (vac.status === "completed") {
        setEmployees(es => es.map(e => e.id === vac.employeeId ? { ...e, usedDays: e.usedDays + (vac.type === "sold" ? 0 : days), soldDays: e.soldDays + (vac.type === "sold" ? days : 0) } : e));
      }
    }
    showToast(vac.id ? "Férias atualizadas!" : "Férias registradas!");
    setModal(null);
  }

  function removeVacation(id) {
    const vac = vacations.find(v => v.id === id);
    const emp = employees.find(e => e.id === vac?.employeeId);
    setVacations(vs => vs.filter(v => v.id !== id));
    addLog("REMOVIDO", emp?.name ?? "—", `Férias excluídas: ${fmt(vac.start)} – ${fmt(vac.end)}`);
    showToast("Férias removidas.", "warn");
    setModal(null);
  }

  const alerts = useMemo(() => {
    return employees.map(emp => {
      const st = getStatus(emp);
      const d  = daysUntil(emp.expiration);
      const remaining = emp.totalDays - emp.usedDays - emp.soldDays;
      return { emp, st, daysLeft: d, remaining };
    }).filter(a => a.st !== "ok").sort((a,b) => a.daysLeft - b.daysLeft);
  }, [employees]);

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", display: "flex", height: "100vh", background: "#F0F2F5", color: "#1A1D23", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      {/* SIDEBAR */}
      <Sidebar view={view} setView={setView} alerts={alerts} />

      {/* MAIN */}
      <main style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        <TopBar view={view} />

        <div style={{ flex: 1, padding: "24px 28px", overflow: "auto" }}>
          {view === "dashboard"  && <Dashboard employees={employees} vacations={vacations} alerts={alerts} conflicts={conflicts} setView={setView} setModal={setModal} />}
          {view === "employees" && <Employees employees={employees} vacations={vacations} conflicts={conflicts} setModal={setModal} />}
          {view === "calendar"  && <CalendarView employees={employees} vacations={vacations} conflicts={conflicts} calMonth={calMonth} setCalMonth={setCalMonth} setModal={setModal} />}
          {view === "logs"      && <LogsView logs={logs} />}
        </div>
      </main>

      {/* MODALS */}
      {modal?.type === "employee"        && <EmployeeModal data={modal.data} onSave={saveEmployee} onRemove={removeEmployee} onClose={() => setModal(null)} />}
      {modal?.type === "vacation"        && <VacationModal data={modal.data} employees={employees} vacations={vacations} conflicts={conflicts} onSave={saveVacation} onRemove={removeVacation} onClose={() => setModal(null)} />}
      {modal?.type === "vacationDetail"  && <VacationDetailModal data={modal.data} employees={employees} conflicts={conflicts} onEdit={(v) => setModal({ type:"vacation", data:v })} onRemove={removeVacation} onClose={() => setModal(null)} />}

      {/* TOAST */}
      {toast && (
        <div style={{ position:"fixed", bottom:28, right:28, background: toast.type === "warn" ? "#92400E" : "#065F46", color:"#fff", padding:"12px 20px", borderRadius:10, fontWeight:600, fontSize:14, boxShadow:"0 8px 24px rgba(0,0,0,.25)", zIndex:9999, animation:"slideIn .25s ease" }}>
          {toast.type === "warn" ? "⚠️" : "✓"} {toast.msg}
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
        @keyframes slideIn { from { transform: translateY(20px); opacity:0 } to { transform: none; opacity:1 } }
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        button { cursor: pointer; border: none; font-family: inherit; }
        input, select, textarea { font-family: inherit; }
      `}</style>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ view, setView, alerts }) {
  const nav = [
    { id: "dashboard", icon: "⊞", label: "Dashboard" },
    { id: "employees", icon: "👥", label: "Colaboradores" },
    { id: "calendar",  icon: "📅", label: "Calendário" },
    { id: "logs",      icon: "📋", label: "Histórico" },
  ];
  return (
    <aside style={{ width: 220, background: "#111827", display: "flex", flexDirection: "column", padding: "0 0 24px" }}>
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid #1F2937" }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: "#F9FAFB", letterSpacing: "-0.5px" }}>FÉRIAS</div>
        <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2, letterSpacing: "1px", textTransform: "uppercase" }}>Gestão de Equipe</div>
      </div>
      <nav style={{ flex: 1, padding: "12px 12px" }}>
        {nav.map(n => (
          <button key={n.id} onClick={() => setView(n.id)} style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"10px 12px", borderRadius:8, marginBottom:4, background: view===n.id ? "#1D4ED8" : "transparent", color: view===n.id ? "#fff" : "#9CA3AF", fontWeight: view===n.id ? 600 : 400, fontSize:14, transition:"all .15s" }}>
            <span style={{ fontSize:16 }}>{n.icon}</span> {n.label}
            {n.id === "dashboard" && alerts.length > 0 && <span style={{ marginLeft:"auto", background:"#DC2626", color:"#fff", borderRadius:99, fontSize:11, fontWeight:700, padding:"1px 7px" }}>{alerts.length}</span>}
          </button>
        ))}
      </nav>
      <div style={{ padding:"16px 20px", borderTop:"1px solid #1F2937" }}>
        <div style={{ fontSize:11, color:"#4B5563", letterSpacing:"0.5px" }}>HOJE</div>
        <div style={{ fontSize:13, color:"#D1D5DB", fontWeight:500, marginTop:2 }}>12 fev 2026</div>
      </div>
    </aside>
  );
}

// ─── TOP BAR ──────────────────────────────────────────────────────────────────
function TopBar({ view }) {
  const titles = { dashboard:"Dashboard", employees:"Colaboradores", calendar:"Calendário", logs:"Histórico de Alterações" };
  return (
    <div style={{ background:"#fff", borderBottom:"1px solid #E5E7EB", padding:"16px 28px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
      <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:"#111827", letterSpacing:"-0.5px" }}>{titles[view]}</h1>
      <div style={{ fontSize:12, color:"#6B7280", background:"#F3F4F6", padding:"4px 12px", borderRadius:99 }}>Sistema de Gestão de Férias v2.0</div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ employees, vacations, alerts, conflicts, setView, setModal }) {
  const activeVacs = vacations.filter(v => v.status === "in_progress");
  const plannedVacs = vacations.filter(v => v.status === "planned");
  const totalRemaining = employees.reduce((s,e) => s + Math.max(0, e.totalDays - e.usedDays - e.soldDays), 0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {/* KPI CARDS */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
        <KpiCard label="Colaboradores"    value={employees.length}    icon="👥" color="#2563EB" sub="ativos no sistema" />
        <KpiCard label="Em Férias Agora"  value={activeVacs.length}   icon="🏖️" color="#16A34A" sub="em andamento" />
        <KpiCard label="Férias Planejadas" value={plannedVacs.length} icon="📅" color="#7C3AED" sub="agendadas" />
        <KpiCard label="Alertas Ativos"   value={alerts.length}       icon="⚠️" color="#DC2626" sub="precisam atenção" />
      </div>

      {/* ALERTS + UPCOMING */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        {/* Alerts */}
        <Card title="⚠️ Alertas de Vencimento" action={{ label:"Ver tudo", fn: () => setView("employees") }}>
          {alerts.length === 0
            ? <Empty msg="Nenhum alerta no momento 🎉" />
            : alerts.map(({ emp, st, daysLeft, remaining }) => (
              <div key={emp.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid #F3F4F6" }}>
                <Avatar name={emp.name} id={emp.id} size={36} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:13, color:"#111827" }}>{emp.name}</div>
                  <div style={{ fontSize:11, color:"#6B7280" }}>{remaining} dias restantes · vence {fmt(emp.expiration)}</div>
                </div>
                <Badge st={st} label={daysLeft <= 0 ? "VENCIDA" : daysLeft <= 30 ? `${daysLeft}d` : `${daysLeft}d`} />
              </div>
            ))}
        </Card>

        {/* Next vacations */}
        <Card title="📅 Próximas Férias" action={{ label:"Ver calendário", fn: () => setView("calendar") }}>
          {[...vacations].filter(v => v.status !== "completed")
            .sort((a,b) => parseDate(a.start) - parseDate(b.start))
            .slice(0,5)
            .map(v => {
              const emp = employees.find(e => e.id === v.employeeId);
              const isConf = conflicts.has(v.id);
              return (
                <div key={v.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid #F3F4F6", cursor:"pointer" }} onClick={() => setModal({ type:"vacationDetail", data:v })}>
                  <Avatar name={emp?.name ?? "?"} id={v.employeeId} size={36} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:13, color:"#111827" }}>{emp?.name ?? "—"}</div>
                    <div style={{ fontSize:11, color:"#6B7280" }}>{fmt(v.start)} – {fmt(v.end)} · {vacationDays(v)} dias</div>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    {isConf && <span style={{ fontSize:10, background:"#FEE2E2", color:"#B91C1C", padding:"2px 7px", borderRadius:99, fontWeight:600 }}>CONFLITO</span>}
                    <StatusDot st={v.status} />
                  </div>
                </div>
              );
            })}
        </Card>
      </div>

      {/* TEAM OVERVIEW */}
      <Card title="📊 Visão Geral da Equipe">
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginTop:4 }}>
          {employees.map(emp => {
            const remaining = Math.max(0, emp.totalDays - emp.usedDays - emp.soldDays);
            const pct = Math.round((emp.usedDays / emp.totalDays) * 100);
            const st  = getStatus(emp);
            return (
              <div key={emp.id} style={{ background:"#F9FAFB", borderRadius:10, padding:14, border:"1px solid #E5E7EB" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                  <Avatar name={emp.name} id={emp.id} size={30} />
                  <div style={{ fontSize:12, fontWeight:600, color:"#374151", lineHeight:1.3 }}>{emp.name.split(" ")[0]}</div>
                  {st !== "ok" && <Badge st={st} label="" size="sm" />}
                </div>
                <div style={{ fontSize:11, color:"#6B7280", marginBottom:4 }}>{remaining} dias restantes</div>
                <div style={{ background:"#E5E7EB", borderRadius:99, height:5, overflow:"hidden" }}>
                  <div style={{ width:`${pct}%`, height:"100%", background: st === "critical" || st === "expired" ? "#DC2626" : st === "warning" ? "#D97706" : "#2563EB", borderRadius:99, transition:"width .5s" }} />
                </div>
                <div style={{ fontSize:10, color:"#9CA3AF", marginTop:3 }}>{pct}% utilizado</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─── EMPLOYEES VIEW ───────────────────────────────────────────────────────────
function Employees({ employees, vacations, conflicts, setModal }) {
  const [search, setSearch] = useState("");

  const filtered = employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", gap:12, alignItems:"center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar colaborador..." style={{ flex:1, maxWidth:340, padding:"9px 14px", borderRadius:8, border:"1px solid #D1D5DB", fontSize:14, outline:"none", background:"#fff" }} />
        <button onClick={() => setModal({ type:"employee", data:null })} style={{ background:"#1D4ED8", color:"#fff", padding:"9px 18px", borderRadius:8, fontSize:14, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
          + Novo Colaborador
        </button>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {filtered.map(emp => <EmployeeRow key={emp.id} emp={emp} vacations={vacations} conflicts={conflicts} setModal={setModal} />)}
      </div>
    </div>
  );
}

function EmployeeRow({ emp, vacations, conflicts, setModal }) {
  const st        = getStatus(emp);
  const remaining = Math.max(0, emp.totalDays - emp.usedDays - emp.soldDays);
  const daysLeft  = daysUntil(emp.expiration);
  const empVacs   = vacations.filter(v => v.employeeId === emp.id && v.status !== "completed");
  const hasConf   = empVacs.some(v => conflicts.has(v.id));

  return (
    <div style={{ background:"#fff", borderRadius:12, border:`1.5px solid ${st !== "ok" ? (st === "critical" || st === "expired" ? "#FCA5A5" : "#FDE68A") : "#E5E7EB"}`, padding:"16px 20px", display:"flex", alignItems:"center", gap:16 }}>
      <Avatar name={emp.name} id={emp.id} size={44} />
      <div style={{ flex:2 }}>
        <div style={{ fontWeight:700, fontSize:15, color:"#111827", display:"flex", alignItems:"center", gap:8 }}>
          {emp.name}
          {hasConf && <span style={{ fontSize:10, background:"#FEE2E2", color:"#B91C1C", padding:"2px 8px", borderRadius:99, fontWeight:600 }}>CONFLITO</span>}
        </div>
        <div style={{ fontSize:12, color:"#6B7280", marginTop:2 }}>Admissão: {fmt(emp.admission)} · Período: {fmt(emp.accrualStart)} – {fmt(emp.accrualEnd)}</div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20, flex:2 }}>
        <Stat label="Total" value={`${emp.totalDays}d`} />
        <Stat label="Usados" value={`${emp.usedDays}d`} />
        <Stat label="Restantes" value={`${remaining}d`} highlight={remaining > 0} />
      </div>
      <div style={{ flex:1, textAlign:"right" }}>
        <div style={{ fontSize:11, color:"#6B7280", marginBottom:4 }}>Vence em</div>
        <div style={{ fontWeight:700, fontSize:13, color: st === "critical" || st === "expired" ? "#DC2626" : st === "warning" ? "#D97706" : "#111827" }}>
          {daysLeft <= 0 ? "VENCIDA" : `${daysLeft} dias`}
        </div>
        <div style={{ fontSize:10, color:"#9CA3AF" }}>{fmt(emp.expiration)}</div>
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <Badge st={st} label={statusLabel(st)} />
        <button onClick={() => setModal({ type:"vacation", data:{ employeeId:emp.id } })} style={{ background:"#EFF6FF", color:"#1D4ED8", padding:"6px 12px", borderRadius:8, fontSize:12, fontWeight:600 }}>+ Férias</button>
        <button onClick={() => setModal({ type:"employee", data:emp })} style={{ background:"#F3F4F6", color:"#374151", padding:"6px 12px", borderRadius:8, fontSize:12, fontWeight:600 }}>Editar</button>
      </div>
    </div>
  );
}

// ─── CALENDAR VIEW ────────────────────────────────────────────────────────────
function CalendarView({ employees, vacations, conflicts, calMonth, setCalMonth, setModal }) {
  const { year, month } = calMonth;
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay    = new Date(year, month - 1, 1).getDay();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function getVacsForDay(day) {
    const iso = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return vacations.filter(v => v.status !== "completed" && iso >= v.start && iso <= v.end);
  }

  const monthNames = ["","Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* Legend + Nav */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", gap:16 }}>
          {[["planned","Planejadas"],["in_progress","Em Andamento"],["conflict","Conflito"]].map(([k,l]) => (
            <div key={k} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#6B7280" }}>
              <div style={{ width:12, height:12, borderRadius:3, background:COLORS[k] }} /> {l}
            </div>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={() => setCalMonth(m => { let nm = m.month - 1, ny = m.year; if (nm < 1){ nm=12; ny--; } return {year:ny,month:nm}; })} style={{ background:"#F3F4F6", borderRadius:8, padding:"6px 12px", fontSize:16, color:"#374151" }}>‹</button>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16, minWidth:160, textAlign:"center" }}>{monthNames[month]} {year}</span>
          <button onClick={() => setCalMonth(m => { let nm = m.month + 1, ny = m.year; if (nm > 12){ nm=1; ny++; } return {year:ny,month:nm}; })} style={{ background:"#F3F4F6", borderRadius:8, padding:"6px 12px", fontSize:16, color:"#374151" }}>›</button>
          <button onClick={() => setModal({ type:"vacation", data:null })} style={{ background:"#1D4ED8", color:"#fff", padding:"7px 16px", borderRadius:8, fontSize:13, fontWeight:600 }}>+ Registrar Férias</button>
        </div>
      </div>

      {/* Grid */}
      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #E5E7EB", overflow:"hidden" }}>
        {/* Weekday header */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", background:"#F9FAFB", borderBottom:"1px solid #E5E7EB" }}>
          {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map(d => (
            <div key={d} style={{ padding:"10px", textAlign:"center", fontSize:11, fontWeight:700, color:"#6B7280", letterSpacing:"0.5px" }}>{d}</div>
          ))}
        </div>
        {/* Days */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} style={{ minHeight:90, borderBottom:"1px solid #F3F4F6", borderRight:"1px solid #F3F4F6", background:"#FAFAFA" }} />;
            const isToday = day === TODAY.getDate() && month === TODAY.getMonth()+1 && year === TODAY.getFullYear();
            const dayvacs = getVacsForDay(day);
            return (
              <div key={day} style={{ minHeight:90, padding:"6px", borderBottom:"1px solid #F3F4F6", borderRight:"1px solid #F3F4F6", cursor: dayvacs.length ? "pointer" : "default" }}>
                <div style={{ width:26, height:26, borderRadius:99, background: isToday ? "#1D4ED8" : "transparent", color: isToday ? "#fff" : "#374151", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight: isToday ? 700 : 400, marginBottom:4 }}>{day}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                  {dayvacs.slice(0,3).map(v => {
                    const emp = employees.find(e => e.id === v.employeeId);
                    const isConf = conflicts.has(v.id);
                    const bg = isConf ? COLORS.conflict : COLORS[v.status];
                    return (
                      <div key={v.id} onClick={() => { }} style={{ background: bg + "22", border:`1px solid ${bg}`, color: bg, borderRadius:4, padding:"1px 5px", fontSize:10, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", cursor:"pointer" }}
                        onClick={() => { const d2 = vacations.find(x => x.id === v.id); /* pass */ }}>
                        {emp?.name.split(" ")[0] ?? "—"}
                      </div>
                    );
                  })}
                  {dayvacs.length > 3 && <div style={{ fontSize:10, color:"#9CA3AF" }}>+{dayvacs.length-3} mais</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* List of month vacations */}
      <Card title={`Férias em ${monthNames[month]}`}>
        {vacations.filter(v => {
          const sm = `${year}-${String(month).padStart(2,"0")}`;
          return v.start.startsWith(sm) || v.end.startsWith(sm);
        }).length === 0
          ? <Empty msg="Nenhuma férias neste mês." />
          : vacations.filter(v => {
              const sm = `${year}-${String(month).padStart(2,"0")}`;
              return v.start.startsWith(sm) || v.end.startsWith(sm);
            }).map(v => {
              const emp = employees.find(e => e.id === v.employeeId);
              const isConf = conflicts.has(v.id);
              return (
                <div key={v.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid #F3F4F6", cursor:"pointer" }} onClick={() => setModal({ type:"vacationDetail", data:v })}>
                  <Avatar name={emp?.name ?? "?"} id={v.employeeId} size={36} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:13 }}>{emp?.name}</div>
                    <div style={{ fontSize:11, color:"#6B7280" }}>{fmt(v.start)} – {fmt(v.end)} · {vacationDays(v)} dias {v.type === "sold" ? "(venda)" : ""}</div>
                  </div>
                  {isConf && <span style={{ fontSize:10, background:"#FEE2E2", color:"#B91C1C", padding:"2px 8px", borderRadius:99, fontWeight:600 }}>CONFLITO</span>}
                  <StatusDot st={v.status} />
                  {v.note && <span style={{ fontSize:11, color:"#6B7280", maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>📝 {v.note}</span>}
                </div>
              );
            })}
      </Card>
    </div>
  );
}

// ─── LOGS VIEW ────────────────────────────────────────────────────────────────
function LogsView({ logs }) {
  const colorMap = { CRIADO:"#16A34A", EDITADO:"#2563EB", REMOVIDO:"#DC2626", ALERTA:"#D97706" };
  return (
    <div>
      <Card title="📋 Histórico Completo de Alterações">
        {logs.length === 0
          ? <Empty msg="Nenhuma alteração registrada." />
          : logs.map(log => (
            <div key={log.id} style={{ display:"flex", gap:14, padding:"12px 0", borderBottom:"1px solid #F3F4F6", alignItems:"flex-start" }}>
              <span style={{ fontSize:10, fontWeight:700, background: colorMap[log.action]+"22", color: colorMap[log.action], padding:"3px 8px", borderRadius:99, minWidth:66, textAlign:"center", marginTop:1 }}>{log.action}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{log.empName}</div>
                <div style={{ fontSize:12, color:"#6B7280", marginTop:2 }}>{log.desc}</div>
              </div>
              <div style={{ fontSize:11, color:"#9CA3AF", whiteSpace:"nowrap" }}>{log.ts}</div>
            </div>
          ))}
      </Card>
    </div>
  );
}

// ─── MODALS ───────────────────────────────────────────────────────────────────
function EmployeeModal({ data, onSave, onRemove, onClose }) {
  const isEdit = !!data?.id;
  const [form, setForm] = useState(data || {
    name:"", admission:"", accrualStart:"", accrualEnd:"", totalDays:30, usedDays:0, soldDays:0, expiration:""
  });
  const upd = (k,v) => setForm(f => ({...f, [k]:v}));

  return (
    <Overlay onClose={onClose}>
      <ModalBox title={isEdit ? "Editar Colaborador" : "Novo Colaborador"} onClose={onClose}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <Field label="Nome completo"><input value={form.name} onChange={e => upd("name",e.target.value)} style={inp} /></Field>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Field label="Data de admissão"><input type="date" value={form.admission} onChange={e => upd("admission",e.target.value)} style={inp} /></Field>
            <Field label="Vencimento das férias"><input type="date" value={form.expiration} onChange={e => upd("expiration",e.target.value)} style={inp} /></Field>
            <Field label="Início período aquisitivo"><input type="date" value={form.accrualStart} onChange={e => upd("accrualStart",e.target.value)} style={inp} /></Field>
            <Field label="Fim período aquisitivo"><input type="date" value={form.accrualEnd} onChange={e => upd("accrualEnd",e.target.value)} style={inp} /></Field>
            <Field label="Total de dias"><input type="number" value={form.totalDays} onChange={e => upd("totalDays",+e.target.value)} style={inp} /></Field>
            <Field label="Dias usados"><input type="number" value={form.usedDays} onChange={e => upd("usedDays",+e.target.value)} style={inp} /></Field>
            <Field label="Dias vendidos"><input type="number" value={form.soldDays} onChange={e => upd("soldDays",+e.target.value)} style={inp} /></Field>
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"space-between", marginTop:8 }}>
            {isEdit && <button onClick={() => { if(window.confirm("Remover colaborador?")) onRemove(data.id); }} style={{ background:"#FEE2E2", color:"#B91C1C", padding:"9px 16px", borderRadius:8, fontWeight:600, fontSize:13 }}>Remover</button>}
            <div style={{ display:"flex", gap:10, marginLeft:"auto" }}>
              <button onClick={onClose} style={{ background:"#F3F4F6", color:"#374151", padding:"9px 16px", borderRadius:8, fontWeight:600, fontSize:13 }}>Cancelar</button>
              <button onClick={() => onSave(form)} style={{ background:"#1D4ED8", color:"#fff", padding:"9px 20px", borderRadius:8, fontWeight:600, fontSize:13 }}>Salvar</button>
            </div>
          </div>
        </div>
      </ModalBox>
    </Overlay>
  );
}

function VacationModal({ data, employees, vacations, conflicts, onSave, onRemove, onClose }) {
  const isEdit = !!data?.id;
  const [form, setForm] = useState(data || { employeeId:"", start:"", end:"", status:"planned", type:"vacation", note:"" });
  const [conflictWarn, setConflictWarn] = useState(false);
  const upd = (k,v) => setForm(f => ({...f,[k]:v}));

  const days = (form.start && form.end && form.end >= form.start) ? diffDays(form.start, form.end) : 0;

  function checkAndSave() {
    if (!form.employeeId || !form.start || !form.end) return;
    // detect conflict
    const overlapping = vacations.filter(v => v.id !== form.id && v.employeeId !== +form.employeeId && v.status !== "completed" && form.start <= v.end && v.start <= form.end);
    if (overlapping.length > 0 && !conflictWarn) {
      setConflictWarn(true);
      return;
    }
    onSave({ ...form, employeeId: +form.employeeId });
  }

  const conflictingEmps = conflictWarn ? vacations.filter(v => v.id !== form.id && v.employeeId !== +form.employeeId && v.status !== "completed" && form.start <= v.end && v.start <= form.end).map(v => employees.find(e => e.id === v.employeeId)?.name).filter(Boolean) : [];

  return (
    <Overlay onClose={onClose}>
      <ModalBox title={isEdit ? "Editar Férias" : "Registrar Férias"} onClose={onClose}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <Field label="Colaborador">
            <select value={form.employeeId} onChange={e => upd("employeeId",e.target.value)} style={inp}>
              <option value="">Selecione...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </Field>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Field label="Data início"><input type="date" value={form.start} onChange={e => upd("start",e.target.value)} style={inp} /></Field>
            <Field label="Data fim"><input type="date" value={form.end} onChange={e => upd("end",e.target.value)} style={inp} /></Field>
          </div>
          {days > 0 && <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#1D4ED8", fontWeight:600 }}>📅 Total: {days} dias corridos</div>}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Field label="Status">
              <select value={form.status} onChange={e => upd("status",e.target.value)} style={inp}>
                <option value="planned">Planejada</option>
                <option value="in_progress">Em Andamento</option>
                <option value="completed">Concluída</option>
              </select>
            </Field>
            <Field label="Tipo">
              <select value={form.type} onChange={e => upd("type",e.target.value)} style={inp}>
                <option value="vacation">Férias</option>
                <option value="sold">Venda de Férias</option>
              </select>
            </Field>
          </div>
          <Field label="Observação (opcional)"><input value={form.note} onChange={e => upd("note",e.target.value)} style={inp} placeholder="Ex: primeira parcela, urgente..." /></Field>

          {conflictWarn && (
            <div style={{ background:"#FEF2F2", border:"1px solid #FCA5A5", borderRadius:8, padding:"12px 14px" }}>
              <div style={{ fontWeight:700, color:"#B91C1C", fontSize:13, marginBottom:4 }}>⚠️ Conflito Detectado</div>
              <div style={{ fontSize:12, color:"#7F1D1D" }}>As seguintes pessoas já têm férias neste período: <strong>{conflictingEmps.join(", ")}</strong>. Deseja confirmar mesmo assim?</div>
            </div>
          )}

          <div style={{ display:"flex", gap:10, justifyContent:"space-between", marginTop:4 }}>
            {isEdit && <button onClick={() => { if(window.confirm("Remover estas férias?")) onRemove(data.id); }} style={{ background:"#FEE2E2", color:"#B91C1C", padding:"9px 16px", borderRadius:8, fontWeight:600, fontSize:13 }}>Remover</button>}
            <div style={{ display:"flex", gap:10, marginLeft:"auto" }}>
              <button onClick={onClose} style={{ background:"#F3F4F6", color:"#374151", padding:"9px 16px", borderRadius:8, fontWeight:600, fontSize:13 }}>Cancelar</button>
              <button onClick={checkAndSave} style={{ background: conflictWarn ? "#DC2626" : "#1D4ED8", color:"#fff", padding:"9px 20px", borderRadius:8, fontWeight:600, fontSize:13 }}>
                {conflictWarn ? "Confirmar mesmo assim" : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      </ModalBox>
    </Overlay>
  );
}

function VacationDetailModal({ data, employees, conflicts, onEdit, onRemove, onClose }) {
  const emp = employees.find(e => e.id === data.employeeId);
  const isConf = conflicts.has(data.id);
  const days = vacationDays(data);
  const statusLabels = { planned:"Planejada", in_progress:"Em Andamento", completed:"Concluída" };
  return (
    <Overlay onClose={onClose}>
      <ModalBox title="Detalhes das Férias" onClose={onClose}>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <Avatar name={emp?.name ?? "?"} id={data.employeeId} size={48} />
            <div>
              <div style={{ fontWeight:700, fontSize:16 }}>{emp?.name}</div>
              <div style={{ fontSize:12, color:"#6B7280" }}>Admissão: {fmt(emp?.admission ?? "—")}</div>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{ background:"#F9FAFB", borderRadius:10, padding:12 }}><div style={{ fontSize:11, color:"#6B7280" }}>Início</div><div style={{ fontWeight:700, fontSize:15, marginTop:2 }}>{fmt(data.start)}</div></div>
            <div style={{ background:"#F9FAFB", borderRadius:10, padding:12 }}><div style={{ fontSize:11, color:"#6B7280" }}>Fim</div><div style={{ fontWeight:700, fontSize:15, marginTop:2 }}>{fmt(data.end)}</div></div>
            <div style={{ background:"#F9FAFB", borderRadius:10, padding:12 }}><div style={{ fontSize:11, color:"#6B7280" }}>Dias</div><div style={{ fontWeight:700, fontSize:15, marginTop:2 }}>{days} dias</div></div>
            <div style={{ background:"#F9FAFB", borderRadius:10, padding:12 }}><div style={{ fontSize:11, color:"#6B7280" }}>Status</div><div style={{ fontWeight:700, fontSize:15, marginTop:2 }}>{statusLabels[data.status]}</div></div>
          </div>
          {data.type === "sold" && <div style={{ background:"#FEF9C3", border:"1px solid #FDE047", borderRadius:8, padding:"8px 12px", fontSize:13, color:"#713F12" }}>💰 Venda de férias</div>}
          {isConf && <div style={{ background:"#FEF2F2", border:"1px solid #FCA5A5", borderRadius:8, padding:"8px 12px", fontSize:13, color:"#B91C1C" }}>⚠️ Este período tem conflito com outro colaborador.</div>}
          {data.note && <div style={{ fontSize:13, color:"#6B7280" }}>📝 {data.note}</div>}
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:4 }}>
            <button onClick={() => onRemove(data.id)} style={{ background:"#FEE2E2", color:"#B91C1C", padding:"9px 16px", borderRadius:8, fontWeight:600, fontSize:13 }}>Remover</button>
            <button onClick={() => onEdit(data)} style={{ background:"#1D4ED8", color:"#fff", padding:"9px 20px", borderRadius:8, fontWeight:600, fontSize:13 }}>Editar</button>
          </div>
        </div>
      </ModalBox>
    </Overlay>
  );
}

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────
function Card({ title, children, action }) {
  return (
    <div style={{ background:"#fff", borderRadius:14, border:"1px solid #E5E7EB", padding:"18px 20px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, color:"#111827" }}>{title}</div>
        {action && <button onClick={action.fn} style={{ background:"none", color:"#2563EB", fontSize:12, fontWeight:600, textDecoration:"underline" }}>{action.label}</button>}
      </div>
      {children}
    </div>
  );
}

function KpiCard({ label, value, icon, color, sub }) {
  return (
    <div style={{ background:"#fff", borderRadius:14, border:`1.5px solid ${color}22`, padding:"18px 20px", display:"flex", alignItems:"center", gap:14 }}>
      <div style={{ background: color + "18", borderRadius:12, width:48, height:48, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{icon}</div>
      <div>
        <div style={{ fontSize:28, fontFamily:"'Syne',sans-serif", fontWeight:800, color:"#111827", lineHeight:1 }}>{value}</div>
        <div style={{ fontSize:12, fontWeight:600, color:"#374151", marginTop:2 }}>{label}</div>
        <div style={{ fontSize:11, color:"#9CA3AF" }}>{sub}</div>
      </div>
    </div>
  );
}

function Avatar({ name, id, size }) {
  return (
    <div style={{ width:size, height:size, borderRadius:99, background: avatarColor(id), display:"flex", alignItems:"center", justifyContent:"center", fontSize: size * 0.37, fontWeight:700, color:"#fff", flexShrink:0 }}>
      {initials(name)}
    </div>
  );
}

function Badge({ st, label, size }) {
  const colors = { ok:"#16A34A", warning:"#D97706", critical:"#DC2626", expired:"#B91C1C" };
  const bg     = { ok:"#F0FDF4", warning:"#FFFBEB", critical:"#FEF2F2", expired:"#FEF2F2" };
  return (
    <span style={{ background:bg[st], color:colors[st], fontWeight:700, fontSize: size === "sm" ? 9 : 11, padding: size === "sm" ? "1px 5px" : "3px 9px", borderRadius:99, whiteSpace:"nowrap" }}>
      {label || statusLabel(st)}
    </span>
  );
}

function StatusDot({ st }) {
  const c = { planned:"#2563EB", in_progress:"#16A34A", completed:"#6B7280" };
  const l = { planned:"Planejada", in_progress:"Em andamento", completed:"Concluída" };
  return <span style={{ fontSize:10, background:c[st]+"22", color:c[st], padding:"2px 8px", borderRadius:99, fontWeight:600 }}>{l[st]}</span>;
}

function Stat({ label, value, highlight }) {
  return (
    <div>
      <div style={{ fontSize:10, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.5px" }}>{label}</div>
      <div style={{ fontWeight:700, fontSize:15, color: highlight ? "#16A34A" : "#111827", marginTop:1 }}>{value}</div>
    </div>
  );
}

function Field({ label, children }) {
  return <div><label style={{ fontSize:11, fontWeight:600, color:"#6B7280", textTransform:"uppercase", letterSpacing:"0.5px", display:"block", marginBottom:5 }}>{label}</label>{children}</div>;
}

function Empty({ msg }) {
  return <div style={{ textAlign:"center", padding:"24px 0", fontSize:13, color:"#9CA3AF" }}>{msg}</div>;
}

function Overlay({ onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", animation:"fadeIn .2s" }} onClick={e => { if(e.target === e.currentTarget) onClose(); }}>
      {children}
    </div>
  );
}

function ModalBox({ title, onClose, children }) {
  return (
    <div style={{ background:"#fff", borderRadius:16, padding:28, width:"100%", maxWidth:520, maxHeight:"90vh", overflow:"auto", boxShadow:"0 24px 64px rgba(0,0,0,.2)", animation:"slideIn .25s" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:18, color:"#111827" }}>{title}</div>
        <button onClick={onClose} style={{ background:"#F3F4F6", borderRadius:8, padding:"4px 10px", fontSize:16, color:"#374151" }}>✕</button>
      </div>
      {children}
    </div>
  );
}

const inp = { width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #E5E7EB", fontSize:13, outline:"none", background:"#FAFAFA", color:"#111827", appearance:"none" };
