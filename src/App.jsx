import { useEffect, useMemo, useState } from "react";
import "./App.css";
import NativeAutomation from "./NativeAutomation.jsx";
import NativeSettings from "./NativeSettings.jsx";

const infrastructure = [
  { name: "atlas01", role: "Core management server", environment: "Production", status: "Healthy", address: "192.168.1.149", services: 4 },
  { name: "Future node", role: "Reserved capacity", environment: "Planned", status: "Planned", address: "—", services: 0 },
];

const atlasSnapshot = { hostname: "atlas01", ip: "192.168.1.149", security: "Session-authenticated" };
const emailAccounts = ["notifications@atlaris.ca", "contact@atlaris.ca", "support@atlaris.ca"];

const BUILTIN_CUSTOMERS = [
  { id: "CUS-001", name: "Sunshine Solution", tier: "Managed", status: "Active", environments: 1, services: 2, brandIcon: "☀", brandClass: "sunshine", description: "Primary application plus a dedicated support service managed through Atlaris customer operations.", sites: [
    { slug: "sunshine-solution", name: "Main application", url: "https://sunshine-backend.pages.dev/", localPath: "/opt/atlaris-customers/websites/sunshine-solution/", backupPath: "/opt/atlaris-customers/backups/sunshine-solution/" },
    { slug: "sunshine-solution-support", name: "Support", url: "https://support-sunshine-prod.pages.dev/", localPath: "/opt/atlaris-customers/websites/sunshine-solution-support/", backupPath: "/opt/atlaris-customers/backups/sunshine-solution-support/" },
  ]},
  { id: "CUS-002", name: "Vancouver RealEstateIQ", tier: "Managed", status: "Active", environments: 1, services: 1, brandIcon: "VR", brandClass: "realestate", description: "Vancouver RealEstateIQ managed customer environment.", sites: [
    { slug: "vancouver-realestateiq", name: "Main application", url: "https://realt-state-housing.pages.dev/", localPath: "/opt/atlaris-customers/websites/vancouver-realestateiq/", backupPath: "/opt/atlaris-customers/backups/vancouver-realestateiq/" },
  ]},
  { id: "CUS-003", name: "AIport", tier: "Managed", status: "Active", environments: 1, services: 1, logo: "/customer-logos/aiport.png", brandIcon: "AI", brandClass: "aiport", description: "AIport managed customer environment.", sites: [
    { slug: "aiport", name: "Main application", url: "https://aiports-backend-final-02.pages.dev/", localPath: "/opt/atlaris-customers/websites/aiport/", backupPath: "/opt/atlaris-customers/backups/aiport/" },
  ]},
  { id: "CUS-004", name: "V. Regenerative", tier: "Managed", status: "Active", environments: 1, services: 1, brandIcon: "V", brandClass: "regenerative", description: "V. Regenerative managed customer environment.", sites: [
    { slug: "v-regenerative", name: "Main application", url: "https://screenshot-exact-copy-23.lovable.app/", localPath: "/opt/atlaris-customers/websites/v-regenerative/", backupPath: "/opt/atlaris-customers/backups/v-regenerative/" },
  ]},
  { id: "CUS-005", name: "Atlaris Travel AI", tier: "Demo", status: "Active", environments: 1, services: 1, brandIcon: "TR", brandClass: "realestate", description: "AI-powered travel planning demo with trip recommendations, flights, hotels, itineraries and budget intelligence.", sites: [
    { slug: "atlaris-travel-ai", name: "Travel AI Demo", url: "http://travel.atlaris.ca/", localPath: "/opt/atlaris-customers/websites/atlaris-travel-ai/", backupPath: "/opt/atlaris-customers/backups/atlaris-travel-ai/" },
  ]},
];

const BUILTIN_SLUGS = new Set(BUILTIN_CUSTOMERS.flatMap((customer) => customer.sites.map((site) => site.slug)));
const SPECIAL_CUSTOMER_SLUGS = new Set(["rrt"]);

const serviceDefinitions = [
  { id: "nginx", label: "Nginx", detail: "Reverse proxy and static delivery", restartable: true },
  { id: "atlaris-server-agent", label: "Server Agent", detail: "Controlled atlas01 automation API", restartable: false },
  { id: "atlaris-openai-tunnel", label: "OpenAI Tunnel", detail: "MCP connector transport", restartable: true },
  { id: "atlaris-public-ai", label: "Public AI Backend", detail: "Preview website AI service", restartable: true },
];

const recentActivity = [
  { title: "Dashboard authentication upgraded", detail: "Session login and logout enabled", type: "security" },
  { title: "Operations layer expanded", detail: "Controlled MCP capabilities available", type: "ops" },
  { title: "Customer backup controls enabled", detail: "Backup, refresh and restore workflows available", type: "backup" },
  { title: "24/7 monitoring enabled", detail: "Customer checks persist server-side in SQLite with outage, warning and recovery events", type: "ops" },
  { title: "Zero Touch customer registry enabled", detail: "New managed customers are discovered from control-plane metadata without source edits", type: "ops" },
];

const navGroups = [
  { label: "Workspace", items: [{ id: "overview", label: "Overview", icon: "◫" }] },
  { label: "Infrastructure", items: [{ id: "infrastructure", label: "Infrastructure", icon: "▤" }, { id: "monitoring", label: "Monitoring", icon: "⌁" }] },
  { label: "Customers", items: [{ id: "customers", label: "Customer Directory", icon: "◎" }, { id: "customer-services", label: "Customer Services", icon: "◇" }] },
  { label: "Administration", items: [{ id: "email-accounts", label: "Email Accounts", icon: "✉" }, { id: "automation", label: "Automation", icon: "⌘" }, { id: "settings", label: "Settings", icon: "⚙" }] },
];

function StatusDot({ tone = "green" }) { return <span className={`status-dot ${tone}`} />; }
function StatCard({ label, value, detail, accent }) { return <article className="stat-card"><div className="stat-card-top"><span>{label}</span><span className="stat-accent">{accent}</span></div><strong>{value}</strong><p>{detail}</p></article>; }
function SectionTitle({ eyebrow, title, description, action }) { return <div className="section-title"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>; }

function CustomerLogo({ customer, large = false }) {
  return <div className={`customer-monogram customer-logo ${large ? "large" : ""} ${customer.brandClass || ""}`}>
    {customer.logo ? <img src={customer.logo} alt={`${customer.name} logo`} onError={(event) => { event.currentTarget.style.display = "none"; event.currentTarget.nextElementSibling.style.display = "grid"; }} /> : null}
    <span className="customer-logo-fallback" style={{ display: customer.logo ? "none" : "grid" }}>{customer.brandIcon || customer.name.slice(0, 2).toUpperCase()}</span>
  </div>;
}

async function apiFetch(path, options = {}) {
  const response = await fetch(path, { cache: "no-store", credentials: "same-origin", ...options, headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) } });
  if (response.status === 401) {
    const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
    window.location.assign(`/login?next=${next}`);
    throw new Error("Session expired");
  }
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { detail: text || `HTTP ${response.status}` }; }
  if (!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : data.detail?.message || `HTTP ${response.status}`);
  return data;
}

function App() {
  const [section, setSection] = useState("overview");
  const [customers, setCustomers] = useState(BUILTIN_CUSTOMERS);
  const [selectedCustomer, setSelectedCustomer] = useState(BUILTIN_CUSTOMERS[0]);
  const [registryState, setRegistryState] = useState({ loaded: false, message: "Loading customer registry…" });
  const [healthState, setHealthState] = useState("idle");
  const [healthMessage, setHealthMessage] = useState("Automatic health monitoring is starting.");
  const [serviceState, setServiceState] = useState({});
  const [serviceLogs, setServiceLogs] = useState("");
  const [selectedLogService, setSelectedLogService] = useState("");
  const [backups, setBackups] = useState({});
  const [operation, setOperation] = useState({ busy: false, message: "Operations API ready.", tone: "neutral" });
  const [monitoringLastUpdated, setMonitoringLastUpdated] = useState(null);
  const [monitoringBusy, setMonitoringBusy] = useState(false);
  const [customerMonitor, setCustomerMonitor] = useState({});
  const [monitorHistory, setMonitorHistory] = useState({});
  const [monitorAlerts, setMonitorAlerts] = useState([]);
  const [monitorSummary, setMonitorSummary] = useState({ targets: 0, healthy: 0, warnings: 0, critical: 0, latest: [] });
  const [customerMonitorUpdated, setCustomerMonitorUpdated] = useState(null);
  const [customerMonitorBusy, setCustomerMonitorBusy] = useState(false);

  const allCustomerSites = useMemo(() => customers.flatMap((customer) => customer.sites.map((site) => ({ ...site, customerId: customer.id, customerName: customer.name }))), [customers]);
  const customerSiteKey = useMemo(() => allCustomerSites.map((site) => site.slug).sort().join("|"), [allCustomerSites]);

  const sectionLabel = useMemo(() => {
    for (const group of navGroups) { const match = group.items.find((item) => item.id === section); if (match) return match.label; }
    return "Overview";
  }, [section]);

  const activeServiceCount = serviceDefinitions.filter((service) => serviceState[service.id] === "active").length;
  const checkedServiceCount = serviceDefinitions.filter((service) => Boolean(serviceState[service.id])).length;
  const allServicesHealthy = checkedServiceCount === serviceDefinitions.length && activeServiceCount === serviceDefinitions.length;
  const monitoredCustomerCount = allCustomerSites.filter((site) => Boolean(customerMonitor[site.slug])).length;
  const healthyCustomerCount = allCustomerSites.filter((site) => customerMonitor[site.slug]?.reachable).length;
  const activeAlerts = (monitorSummary.warnings || 0) + (monitorSummary.critical || 0);
  const totalHistorySamples = Object.values(monitorHistory).reduce((total, list) => total + list.length, 0);

  async function loadCustomerRegistry() {
    try {
      const [registry, current] = await Promise.all([apiFetch("/api/ops/customers"), apiFetch("/api/monitor/current")]);
      const targets = Object.fromEntries((current.targets || []).map((target) => [target.slug, target]));
      const dynamic = [];
      for (const row of registry.customers || []) {
        if (!row.slug || BUILTIN_SLUGS.has(row.slug) || SPECIAL_CUSTOMER_SLUGS.has(row.slug)) continue;
        let meta = null;
        try {
          const file = await apiFetch(`/api/ops/customer/file-read?customer=${encodeURIComponent(row.slug)}&path=dashboard.json`);
          meta = JSON.parse(file.content);
        } catch { /* older customer mirrors may not have dashboard metadata yet */ }
        const target = targets[row.slug] || null;
        const name = meta?.customer?.name || target?.display_name || row.slug.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
        const serviceName = meta?.service?.name || target?.service_name || "Main application";
        const domain = meta?.service?.domain || target?.domain || null;
        const url = meta?.service?.url || target?.url || (domain ? `https://${domain}` : null);
        dynamic.push({
          id: `ZT-${row.slug}`,
          name,
          tier: meta?.customer?.tier || "Managed",
          status: meta?.customer?.status || "Active",
          environments: 1,
          services: 1,
          brandIcon: name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "ZT",
          brandClass: "dynamic",
          description: meta?.customer?.industry ? `${meta.customer.industry} customer provisioned through Atlaris Zero Touch.` : "Managed customer provisioned through Atlaris Zero Touch.",
          registryMeta: meta,
          sites: [{
            slug: row.slug,
            name: serviceName,
            url,
            localPath: meta?.paths?.source || row.path || `/opt/atlaris-customers/websites/${row.slug}/`,
            backupPath: meta?.paths?.backups || `/opt/atlaris-customers/backups/${row.slug}/`,
          }],
        });
      }
      const merged = [...BUILTIN_CUSTOMERS, ...dynamic.sort((a, b) => a.name.localeCompare(b.name))];
      setCustomers(merged);
      setSelectedCustomer((currentCustomer) => merged.find((customer) => customer.id === currentCustomer?.id) || merged[0]);
      setRegistryState({ loaded: true, message: `${merged.length} managed customers loaded` });
    } catch (error) {
      setRegistryState({ loaded: false, message: `Customer registry unavailable: ${error.message}` });
    }
  }

  async function withOperation(label, callback) {
    setOperation({ busy: true, message: `${label}…`, tone: "neutral" });
    try { const result = await callback(); setOperation({ busy: false, message: `${label} completed successfully.`, tone: "success" }); return result; }
    catch (error) { setOperation({ busy: false, message: `${label} failed: ${error.message}`, tone: "error" }); throw error; }
  }

  async function runQuickHealthCheck({ silent = false } = {}) {
    if (!silent) setHealthState("checking");
    const started = performance.now();
    try {
      const response = await fetch(`/health?ts=${Date.now()}`, { cache: "no-store" });
      const elapsed = Math.max(1, Math.round(performance.now() - started));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = (await response.text()).trim();
      setHealthState("healthy");
      setHealthMessage(`Dashboard ${text || "healthy"} · ${elapsed} ms`);
      return true;
    } catch (error) { setHealthState("error"); setHealthMessage(`Health check failed · ${error.message}`); return false; }
  }

  async function refreshLiveMonitoring({ manual = false } = {}) {
    if (monitoringBusy) return;
    setMonitoringBusy(true);
    if (manual) setOperation({ busy: true, message: "Refreshing infrastructure view…", tone: "neutral" });
    try {
      const results = await Promise.allSettled(serviceDefinitions.map((service) => apiFetch(`/api/ops/service/status?service=${encodeURIComponent(service.id)}`)));
      const nextState = {};
      results.forEach((result, index) => { const service = serviceDefinitions[index]; nextState[service.id] = result.status === "fulfilled" ? (result.value.active || "unknown") : "unavailable"; });
      setServiceState(nextState);
      await runQuickHealthCheck({ silent: true });
      setMonitoringLastUpdated(new Date());
      if (manual) setOperation({ busy: false, message: "Infrastructure view refreshed.", tone: "success" });
    } catch (error) { if (manual) setOperation({ busy: false, message: `Infrastructure refresh failed: ${error.message}`, tone: "error" }); }
    finally { setMonitoringBusy(false); }
  }

  function monitorTone(item) {
    if (!item) return "pending";
    if (!item.reachable) return "critical";
    if ((item.tls?.days_remaining != null && item.tls.days_remaining < 21) || (item.response_ms || 0) > 2500) return "warning";
    return "healthy";
  }

  async function refreshCustomerMonitoring({ manual = false } = {}) {
    if (customerMonitorBusy || allCustomerSites.length === 0) return;
    setCustomerMonitorBusy(true);
    if (manual) setOperation({ busy: true, message: "Refreshing 24/7 monitoring data…", tone: "neutral" });
    try {
      const [currentData, eventsData, ...historyResponses] = await Promise.all([
        apiFetch("/api/monitor/current"),
        apiFetch("/api/monitor/events?limit=100"),
        ...allCustomerSites.map((site) => apiFetch(`/api/monitor/history?customer=${encodeURIComponent(site.slug)}&limit=240`)),
      ]);
      const allowed = new Set(allCustomerSites.map((site) => site.slug));
      const nextMonitor = {};
      for (const target of currentData.targets || []) {
        if (!allowed.has(target.slug)) continue;
        nextMonitor[target.slug] = { ...target, tls: { expires_at: target.tls_expires_at ?? null, days_remaining: target.tls_days_remaining ?? null } };
      }
      setCustomerMonitor(nextMonitor);
      const monitorItems = Object.values(nextMonitor);
      setMonitorSummary({
        targets: allCustomerSites.length,
        healthy: monitorItems.filter((item) => monitorTone(item) === "healthy").length,
        warnings: monitorItems.filter((item) => monitorTone(item) === "warning").length,
        critical: monitorItems.filter((item) => monitorTone(item) === "critical").length,
        latest: monitorItems,
      });
      const nextHistory = {};
      historyResponses.forEach((data, index) => {
        const slug = allCustomerSites[index].slug;
        nextHistory[slug] = (data.history || []).map((row) => ({ checkedAt: row.checked_at, reachable: Boolean(row.reachable), httpStatus: row.http_status, responseMs: row.response_ms, tlsDays: row.tls_days_remaining }));
      });
      setMonitorHistory(nextHistory);
      const siteBySlug = Object.fromEntries(allCustomerSites.map((site) => [site.slug, site]));
      setMonitorAlerts((eventsData.events || []).filter((event) => Boolean(siteBySlug[event.slug])).map((event) => {
        const site = siteBySlug[event.slug];
        return { id: event.id, slug: event.slug, severity: event.severity, eventType: event.event_type, message: event.message, createdAt: event.created_at, customerName: site.customerName, serviceName: site.name };
      }));
      setCustomerMonitorUpdated(new Date());
      if (manual) setOperation({ busy: false, message: "24/7 monitoring data refreshed.", tone: "success" });
    } catch (error) {
      if (manual) setOperation({ busy: false, message: `Monitoring refresh failed: ${error.message}`, tone: "error" });
    } finally { setCustomerMonitorBusy(false); }
  }

  useEffect(() => {
    loadCustomerRegistry();
    const registryTimer = window.setInterval(loadCustomerRegistry, 60000);
    return () => window.clearInterval(registryTimer);
  }, []);

  useEffect(() => {
    refreshLiveMonitoring();
    const serviceTimer = window.setInterval(() => refreshLiveMonitoring(), 30000);
    return () => window.clearInterval(serviceTimer);
  }, []);

  useEffect(() => {
    refreshCustomerMonitoring();
    const customerTimer = window.setInterval(() => refreshCustomerMonitoring(), 60000);
    return () => window.clearInterval(customerTimer);
  }, [customerSiteKey]);

  async function checkService(service) { const data = await withOperation(`Checking ${service}`, () => apiFetch(`/api/ops/service/status?service=${encodeURIComponent(service)}`)); setServiceState((current) => ({ ...current, [service]: data.active || "unknown" })); setMonitoringLastUpdated(new Date()); }
  async function loadLogs(service) { const data = await withOperation(`Loading ${service} logs`, () => apiFetch(`/api/ops/service/logs?service=${encodeURIComponent(service)}&lines=60`)); setSelectedLogService(service); setServiceLogs(data.content || "No log entries returned."); }
  async function restartService(service) { if (!window.confirm(`Restart ${service}?`)) return; const data = await withOperation(`Restarting ${service}`, () => apiFetch("/api/ops/service/restart", { method: "POST", body: JSON.stringify({ service }) })); setServiceState((current) => ({ ...current, [service]: data.active || "active" })); setMonitoringLastUpdated(new Date()); }
  async function loadBackups(slug, announce = true) { const loader = () => apiFetch(`/api/ops/customer/backups?customer=${encodeURIComponent(slug)}`); const data = announce ? await withOperation(`Loading ${slug} backups`, loader) : await loader(); setBackups((current) => ({ ...current, [slug]: data.backups || [] })); }
  async function createBackup(slug) { await withOperation(`Creating ${slug} backup`, () => apiFetch(`/api/ops/customer/backup?customer=${encodeURIComponent(slug)}`, { method: "POST" })); await loadBackups(slug, false); }
  async function refreshMirror(slug) { if (!window.confirm(`Refresh ${slug} from its approved production URL? A pre-refresh backup will be created automatically.`)) return; await withOperation(`Refreshing ${slug}`, () => apiFetch(`/api/ops/customer/refresh?customer=${encodeURIComponent(slug)}`, { method: "POST" })); await loadBackups(slug, false); }
  async function restoreBackup(slug, backupName) { if (!window.confirm(`Restore ${slug} from ${backupName}? A safety backup of the current mirror will be created first.`)) return; await withOperation(`Restoring ${slug}`, () => apiFetch("/api/ops/customer/restore", { method: "POST", body: JSON.stringify({ customer: slug, backup: backupName }) })); await loadBackups(slug, false); }

  function historySummary(slug) {
    const history = monitorHistory[slug] || [];
    if (!history.length) return { availability: "—", avgLatency: "—", samples: 0 };
    const reachable = history.filter((item) => item.reachable).length;
    const latencies = history.map((item) => item.responseMs).filter((value) => Number.isFinite(value));
    const average = latencies.length ? Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length) : null;
    return { availability: `${((reachable / history.length) * 100).toFixed(1)}%`, avgLatency: average == null ? "—" : `${average} ms`, samples: history.length };
  }

  function LatencyBars({ slug }) {
    const history = (monitorHistory[slug] || []).slice(-24);
    if (!history.length) return <div className="history-empty">Waiting for server history samples…</div>;
    const max = Math.max(500, ...history.map((item) => item.responseMs || 0));
    return <div className="latency-bars" aria-label={`Recent latency history for ${slug}`}>{history.map((item, index) => <span key={`${item.checkedAt}-${index}`} className={item.reachable ? "" : "down"} style={{ height: `${Math.max(8, Math.round(((item.responseMs || max) / max) * 100))}%` }} title={`${item.reachable ? `${item.responseMs ?? "—"} ms` : "Unavailable"} · ${new Date(item.checkedAt).toLocaleTimeString()}`} />)}</div>;
  }

  function renderOverview() {
    const serviceSummary = checkedServiceCount === 0 ? "Checking" : `${activeServiceCount}/${serviceDefinitions.length} active`;
    const customerSummary = monitoredCustomerCount === 0 ? "Checking" : `${healthyCustomerCount}/${allCustomerSites.length} online`;
    return <>
      <section className="hero-grid">
        <article className="hero-card infrastructure-hero" onClick={() => setSection("infrastructure")}><div className="hero-icon">▤</div><div><span className="eyebrow">Infrastructure</span><h3>Operate Atlaris systems</h3><p>Live service status, logs, approved restarts, deployment safeguards, Nginx and automation.</p></div><span className="hero-arrow">→</span></article>
        <article className="hero-card customers-hero" onClick={() => setSection("customer-services")}><div className="hero-icon">◎</div><div><span className="eyebrow">Customers</span><h3>24/7 customer monitoring</h3><p>Registry-driven customer health, server-side history, outage events, response time, TLS, backups and recovery.</p></div><span className="hero-arrow">→</span></article>
      </section>
      <section className="stats-grid"><StatCard label="Live services" value={serviceSummary} detail={monitoringLastUpdated ? `Updated ${monitoringLastUpdated.toLocaleTimeString()}` : "Automatic monitoring starting"} accent="LIVE" /><StatCard label="Customer sites" value={customerSummary} detail={`${monitorSummary.warnings || 0} warnings · ${monitorSummary.critical || 0} critical`} accent="WEB" /><StatCard label="Managed customers" value={customers.length} detail={registryState.message} accent="REG" /><StatCard label="Active alerts" value={activeAlerts} detail={`${monitorAlerts.length} persistent events loaded`} accent="ALERT" /></section>
      <section className="overview-grid"><article className="panel"><SectionTitle eyebrow="Infrastructure" title="Atlaris estate" description="Core systems managed by the administration platform." /><div className="estate-list">{infrastructure.map((server) => <div className="estate-row" key={server.name}><div className="server-avatar">{server.name === "atlas01" ? "01" : "+"}</div><div className="estate-copy"><strong>{server.name}</strong><span>{server.role}</span></div><div className="estate-meta"><span>{server.environment}</span><strong className={server.status === "Healthy" ? "good" : "muted"}>{server.status}</strong></div></div>)}</div></article><article className="panel"><SectionTitle eyebrow="Customers" title="Customer pulse" description="Unified registry state from built-in and Zero Touch managed customers." /><div className="customer-pulse">{customers.map((customer) => { const siteItems = customer.sites.map((site) => customerMonitor[site.slug]); const online = siteItems.filter((item) => item?.reachable).length; const checked = siteItems.filter(Boolean).length; const healthy = checked === customer.sites.length && online === customer.sites.length; return <button key={customer.id} className="pulse-row" onClick={() => { setSelectedCustomer(customer); setSection("customers"); }}><CustomerLogo customer={customer} /><div><strong>{customer.name}</strong><span>{checked ? `${online}/${customer.sites.length} endpoints online` : customer.registryMeta?.monitoring?.requested === false ? "Monitoring disabled" : "Loading server state"}</span></div><span className={`customer-status ${healthy ? "active" : "onboarding"}`}>{healthy ? "Healthy" : checked ? "Review" : "Provisioned"}</span></button>; })}</div></article></section>
      <section className="panel activity-panel"><SectionTitle eyebrow="Operations" title="Platform improvements" description="Current Dashboard and control-plane capabilities." /><div className="activity-list">{recentActivity.map((item) => <div className="activity-row" key={item.title}><span className={`activity-icon ${item.type}`}>{item.type === "security" ? "✓" : item.type === "backup" ? "↶" : "⌘"}</span><div><strong>{item.title}</strong><span>{item.detail}</span></div><span className="activity-state">Ready</span></div>)}</div></section>
    </>;
  }

  function renderInfrastructure() {
    return <><SectionTitle eyebrow="Atlaris infrastructure" title="Infrastructure operations" description="Service states refresh automatically every 30 seconds. Manual status, logs and approved restart controls remain available." action={<button className="secondary-button" onClick={() => refreshLiveMonitoring({ manual: true })} disabled={monitoringBusy}>{monitoringBusy ? "Refreshing…" : "Refresh live status"}</button>} /><section className="stats-grid infrastructure-stats"><StatCard label="Host" value={atlasSnapshot.hostname} detail={atlasSnapshot.ip} accent="HOST" /><StatCard label="Authentication" value="Session" detail={atlasSnapshot.security} accent="AUTH" /><StatCard label="Live services" value={checkedServiceCount === 0 ? "Checking" : `${activeServiceCount}/${serviceDefinitions.length}`} detail={allServicesHealthy ? "All approved services active" : "Automatic monitoring enabled"} accent="LIVE" /><StatCard label="Dashboard" value={healthState === "healthy" ? "Healthy" : healthState === "error" ? "Check failed" : "Checking"} detail={healthMessage} accent="HTTP" /></section><section className="panel"><div className="table-header"><div><span className="eyebrow">Runtime services</span><h3>atlas01 service control</h3></div><span className="table-note">{monitoringLastUpdated ? `Updated ${monitoringLastUpdated.toLocaleTimeString()}` : "Connecting…"}</span></div><div className="ops-service-list">{serviceDefinitions.map((service) => { const current = serviceState[service.id] || "Checking"; return <div className="ops-service-row" key={service.id}><div className="ops-service-copy"><div className="ops-service-title"><StatusDot tone={current === "active" ? "green" : "blue"} /><strong>{service.label}</strong></div><span>{service.detail}</span></div><span className={`service-state ${current === "active" ? "active" : ""}`}>{current}</span><div className="inline-actions"><button className="secondary-button" onClick={() => checkService(service.id)} disabled={operation.busy}>Status</button><button className="secondary-button" onClick={() => loadLogs(service.id)} disabled={operation.busy}>Logs</button>{service.restartable && <button className="danger-button" onClick={() => restartService(service.id)} disabled={operation.busy}>Restart</button>}</div></div>; })}</div></section><section className="two-column-grid"><article className="panel"><SectionTitle eyebrow="Journal" title={selectedLogService ? `${selectedLogService} logs` : "Service logs"} description="Recent journal output from approved services only." /><pre className="log-viewer">{serviceLogs || "Select Logs on a service to load recent journal entries."}</pre></article><article className="panel"><SectionTitle eyebrow="Safety" title="Operational boundaries" /><div className="safety-list">{["Session-authenticated dashboard", "Server Agent API key remains server-side", "Approved service allowlist", "Server Agent self-restart blocked", "Customer refresh URLs hard-coded", "Restores create safety backups first", "Nginx validation before deployment"].map((item) => <div key={item}><span>✓</span>{item}</div>)}</div></article></section></>;
  }

  function renderCustomers() {
    return <><SectionTitle eyebrow="Customer operations" title="Customer administration" description="One registry now drives customer directory, services, monitoring and Zero Touch discovery." action={<button className="secondary-button" onClick={loadCustomerRegistry}>Refresh registry</button>} /><section className="customer-layout"><article className="panel customer-directory"><div className="directory-header"><span>Customer directory</span><strong>{customers.length}</strong></div><div className="directory-list">{customers.map((customer) => <button key={customer.id} className={`directory-item ${selectedCustomer.id === customer.id ? "selected" : ""}`} onClick={() => setSelectedCustomer(customer)}><CustomerLogo customer={customer} /><div><strong>{customer.name}</strong><span>{customer.id.startsWith("ZT-") ? "ZERO TOUCH" : customer.id} · {customer.services} service{customer.services === 1 ? "" : "s"}</span></div><StatusDot tone={customer.sites.some((site) => customerMonitor[site.slug]?.reachable) ? "green" : "blue"} /></button>)}</div></article><article className="panel customer-detail"><div className="customer-detail-head"><div className="customer-identity"><CustomerLogo customer={selectedCustomer} large /><div><span className="eyebrow">{selectedCustomer.id.startsWith("ZT-") ? "ZERO TOUCH CUSTOMER" : selectedCustomer.id}</span><h3>{selectedCustomer.name}</h3><p>{selectedCustomer.description}</p></div></div><span className="customer-status active">{selectedCustomer.status || "Active"}</span></div><div className="customer-metrics"><div><strong>{selectedCustomer.environments}</strong><span>Environments</span></div><div><strong>{selectedCustomer.services}</strong><span>Services</span></div><div><strong>{selectedCustomer.sites.filter((site) => customerMonitor[site.slug]?.reachable).length}/{selectedCustomer.sites.length}</strong><span>Endpoints online</span></div><div><strong>{selectedCustomer.id.startsWith("ZT-") ? "Zero Touch" : selectedCustomer.tier}</strong><span>Management</span></div></div><div className="customer-detail-grid wide">{selectedCustomer.sites.map((site) => { const monitor = customerMonitor[site.slug]; const tone = monitorTone(monitor); const summary = historySummary(site.slug); return <div className="subpanel site-ops-card" key={site.slug}><div className="site-ops-head"><div><span className="eyebrow">{site.name}</span><h4>{site.slug}</h4></div>{site.url && <a href={site.url} target="_blank" rel="noreferrer">Open ↗</a>}</div><div className={`site-monitor-strip ${tone}`}><div><span>Status</span><strong>{monitor ? (monitor.reachable ? "Online" : "Unavailable") : selectedCustomer.registryMeta?.monitoring?.requested ? "Pending" : "Provisioned"}</strong></div><div><span>HTTP</span><strong>{monitor?.http_status ?? "—"}</strong></div><div><span>Latency</span><strong>{monitor?.response_ms != null ? `${monitor.response_ms} ms` : "—"}</strong></div><div><span>TLS</span><strong>{monitor?.tls?.days_remaining != null ? `${monitor.tls.days_remaining} days` : "—"}</strong></div></div><div className="history-summary"><span>Server history: {summary.samples} samples</span><span>Availability: {summary.availability}</span><span>Avg latency: {summary.avgLatency}</span></div><LatencyBars slug={site.slug} />{monitor?.error && <div className="monitor-error">{monitor.error}</div>}<div className="path-block"><span>Mirror</span><code>{site.localPath}</code></div><div className="path-block"><span>Backups</span><code>{site.backupPath}</code></div><div className="inline-actions site-actions"><button className="primary-button" onClick={() => createBackup(site.slug)} disabled={operation.busy}>Create backup</button><button className="secondary-button" onClick={() => loadBackups(site.slug)} disabled={operation.busy}>View backups</button><button className="secondary-button" onClick={() => refreshCustomerMonitoring({ manual: true })} disabled={customerMonitorBusy}>Refresh view</button>{!selectedCustomer.id.startsWith("ZT-") && <button className="danger-button" onClick={() => refreshMirror(site.slug)} disabled={operation.busy}>Refresh mirror</button>}</div>{backups[site.slug] && <div className="backup-list">{backups[site.slug].length === 0 ? <div className="empty-state">No timestamped backups found.</div> : backups[site.slug].slice(0, 8).map((backup) => <div className="backup-row" key={backup.name}><div><strong>{backup.name}</strong><span>{Math.max(1, Math.round(backup.bytes / 1024))} KB · {new Date(backup.modified).toLocaleString()}</span></div><button className="secondary-button" onClick={() => restoreBackup(site.slug, backup.name)} disabled={operation.busy}>Restore</button></div>)}</div>}</div>; })}</div><div className={`operation-banner ${operation.tone}`}>{operation.busy ? "Working · " : ""}{operation.message}</div></article></section></>;
  }

  function renderCustomerServices() {
    return <><SectionTitle eyebrow="Customer monitoring" title="Customer service health" description="Unified registry-driven 24/7 server monitoring with persistent history." action={<button className="primary-button" onClick={() => refreshCustomerMonitoring({ manual: true })} disabled={customerMonitorBusy}>{customerMonitorBusy ? "Refreshing…" : "Refresh monitoring data"}</button>} /><section className="stats-grid"><StatCard label="Endpoints monitored" value={`${monitoredCustomerCount}/${allCustomerSites.length}`} detail="Registry-managed customer services" accent="WEB" /><StatCard label="Endpoints healthy" value={healthyCustomerCount} detail={`${monitorSummary.warnings || 0} warning · ${monitorSummary.critical || 0} critical`} accent="UP" /><StatCard label="Active alerts" value={activeAlerts} detail={`${monitorAlerts.length} historical events loaded`} accent="ALERT" /><StatCard label="History" value={`${totalHistorySamples} samples`} detail="Server-side SQLite · persistent retention" accent="HIST" /></section><section className="panel"><div className="customer-monitor-table"><div className="customer-monitor-row customer-monitor-head"><span>Customer / service</span><span>Status</span><span>HTTP</span><span>Latency</span><span>TLS</span><span>Availability</span></div>{allCustomerSites.map((site) => { const item = customerMonitor[site.slug]; const tone = monitorTone(item); const summary = historySummary(site.slug); return <div className={`customer-monitor-row ${tone}`} key={site.slug}><div><strong>{site.customerName}</strong><small>{site.name} · {site.slug}</small></div><span className={`monitor-badge ${tone}`}>{item ? (item.reachable ? "Online" : "Unavailable") : "Pending"}</span><span>{item?.http_status ?? "—"}</span><span>{item?.response_ms != null ? `${item.response_ms} ms` : "—"}</span><span>{item?.tls?.days_remaining != null ? `${item.tls.days_remaining} days` : "—"}</span><span>{summary.availability}</span></div>; })}</div></section><section className="two-column-grid"><article className="panel"><SectionTitle eyebrow="Alert center" title="Monitoring events" description="Persistent outage, warning and recovery events recorded by atlas01." /><div className="alert-list">{monitorAlerts.length ? monitorAlerts.slice(0, 12).map((alert) => <div className={`alert-row ${alert.severity}`} key={alert.id}><div><strong>{alert.customerName} · {alert.serviceName}</strong><span>{alert.message}</span></div><div><b>{alert.severity}</b><time>{new Date(alert.createdAt).toLocaleString()}</time></div></div>) : <div className="empty-state">No monitoring events recorded for registry-managed customers.</div>}</div></article><article className="panel"><SectionTitle eyebrow="History" title="Recent latency" description="Last 24 server-side samples per registry endpoint." /><div className="history-site-list">{allCustomerSites.map((site) => <div className="history-site" key={site.slug}><div><strong>{site.customerName}</strong><span>{site.name} · {historySummary(site.slug).avgLatency} average</span></div><LatencyBars slug={site.slug} /></div>)}</div></article></section></>;
  }

  function renderEmailAccounts() { return <><SectionTitle eyebrow="Administration" title="Email Accounts" description="Atlaris-managed mailboxes used for notifications, customer contact and support." /><section className="panel"><div className="service-list">{emailAccounts.map((email) => <div className="service-line" key={email}><span><StatusDot />{email}</span><strong>Active</strong></div>)}</div></section></>; }

  function renderMonitoring() {
    return <><SectionTitle eyebrow="Monitoring" title="Operational monitoring" description="Infrastructure status plus registry-driven 24/7 customer history and events." action={<button className="primary-button" onClick={() => { refreshLiveMonitoring({ manual: true }); refreshCustomerMonitoring(); }} disabled={monitoringBusy || customerMonitorBusy}>Refresh view</button>} /><section className="stats-grid"><StatCard label="Infrastructure services" value={`${activeServiceCount}/${serviceDefinitions.length}`} detail="Approved runtime services active" accent="LIVE" /><StatCard label="Customer endpoints" value={`${healthyCustomerCount}/${allCustomerSites.length}`} detail="Latest registry-managed monitor state" accent="WEB" /><StatCard label="Active alerts" value={activeAlerts} detail={`${monitorSummary.warnings || 0} warning · ${monitorSummary.critical || 0} critical`} accent="ALERT" /><StatCard label="History samples" value={totalHistorySamples} detail="SQLite on atlas01" accent="HIST" /></section><section className="overview-grid"><article className="panel"><SectionTitle eyebrow="Runtime" title="Live service summary" /><div className="service-list">{serviceDefinitions.map((service) => <div className="service-line" key={service.id}><span><StatusDot tone={serviceState[service.id] === "active" ? "green" : "blue"} />{service.label}</span><strong>{serviceState[service.id] || "Checking"}</strong></div>)}</div></article><article className="panel"><SectionTitle eyebrow="Customers" title="24/7 customer summary" /><div className="service-list">{allCustomerSites.map((site) => <div className="service-line" key={site.slug}><span><StatusDot tone={customerMonitor[site.slug]?.reachable ? "green" : "blue"} />{site.customerName} · {site.name}</span><strong>{customerMonitor[site.slug]?.reachable ? `${customerMonitor[site.slug].response_ms} ms` : customerMonitor[site.slug] ? "Review" : "Pending"}</strong></div>)}</div><button className="secondary-button monitor-button" onClick={() => setSection("customer-services")}>Open customer monitoring</button></article></section></>;
  }

  function renderPlaceholder() { return <section className="panel placeholder-page"><div className="placeholder-icon">⌘</div><span className="eyebrow">Module foundation</span><h2>{sectionLabel}</h2><p>This module is reserved for a future controlled Atlaris capability.</p><button className="secondary-button" onClick={() => setSection("overview")}>Return to overview</button></section>; }

  const nativeSection = ["overview", "infrastructure", "monitoring", "customers", "customer-services", "email-accounts", "automation", "settings"].includes(section);

  return <div className="app-shell"><aside className="sidebar"><div className="brand-block"><div className="brand-mark">A</div><div><div className="brand-name">Atlaris</div><div className="brand-caption">Administration Platform</div></div></div><div className="nav-scroll">{navGroups.map((group) => <div className="nav-group" key={group.label}><div className="sidebar-section-label">{group.label}</div><nav className="nav-list" aria-label={group.label}>{group.items.map((item) => <button key={item.id} className={`nav-link ${section === item.id ? "active" : ""}`} onClick={() => setSection(item.id)}><span>{item.icon}</span>{item.label}</button>)}</nav></div>)}</div><div className="sidebar-health"><div className="health-line"><span><StatusDot tone={allServicesHealthy ? "green" : "blue"} />Atlaris platform</span><strong>{allServicesHealthy ? "Online" : checkedServiceCount ? `${activeServiceCount}/${serviceDefinitions.length}` : "Checking"}</strong></div><div className="health-line"><span><StatusDot tone={(monitorSummary.critical || 0) === 0 ? "green" : "blue"} />Customer sites</span><strong>{allCustomerSites.length ? `${healthyCustomerCount}/${allCustomerSites.length}` : "Checking"}</strong></div><div className="health-line muted"><span>Customer registry</span><strong>{customers.length}</strong></div><div className="health-line muted"><span>Active alerts</span><strong>{activeAlerts}</strong></div></div></aside><main className="main-content"><header className="topbar"><div><span className="eyebrow">Atlaris Technologies · Administration</span><h1>{section === "overview" ? "Administration overview" : sectionLabel}</h1><p>Secure infrastructure and customer operations from one control plane.</p></div><div className="top-actions"><span className="live-pill"><StatusDot tone={activeAlerts === 0 && allServicesHealthy ? "green" : "blue"} />{activeAlerts ? `${activeAlerts} active alert${activeAlerts === 1 ? "" : "s"}` : "24/7 monitoring healthy"}</span><div className="user-chip" title="Atlaris administrator">AR</div><a className="secondary-button logout-button" href="/logout">Logout</a></div></header>{section === "overview" && renderOverview()}{section === "infrastructure" && renderInfrastructure()}{section === "monitoring" && renderMonitoring()}{section === "customers" && renderCustomers()}{section === "customer-services" && renderCustomerServices()}{section === "email-accounts" && renderEmailAccounts()}{section === "automation" && <NativeAutomation />}{section === "settings" && <NativeSettings />}{!nativeSection && renderPlaceholder()}<footer className="footer-note"><span>Atlaris Administration Platform</span><span>Session authenticated · unified customer registry · 24/7 monitoring · controlled recovery</span></footer></main></div>;
}

export default App;
