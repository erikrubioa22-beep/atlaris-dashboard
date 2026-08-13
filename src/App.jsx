import { useEffect, useMemo, useState } from "react";
import "./App.css";

const infrastructure = [
  { name: "atlas01", role: "Core management server", environment: "Production", status: "Healthy", address: "192.168.1.149", services: 4 },
  { name: "Future node", role: "Reserved capacity", environment: "Planned", status: "Planned", address: "—", services: 0 },
];

const atlasSnapshot = {
  hostname: "atlas01",
  ip: "192.168.1.149",
  cpu: "Live via Server Agent",
  memory: "Live via Server Agent",
  disk: "Live via Server Agent",
  security: "Session-authenticated",
};

const emailAccounts = ["notifications@atlaris.ca", "contact@atlaris.ca", "support@atlaris.ca"];

const customers = [
  {
    id: "CUS-001",
    name: "Sunshine Solution",
    tier: "Managed",
    status: "Active",
    environments: 1,
    services: 2,
    website: "https://sunshine-backend.pages.dev/",
    brandIcon: "☀",
    brandClass: "sunshine",
    description: "Primary application plus a dedicated support service managed through Atlaris customer operations.",
    sites: [
      { slug: "sunshine-solution", name: "Main application", url: "https://sunshine-backend.pages.dev/", localPath: "/opt/atlaris-customers/websites/sunshine-solution/", backupPath: "/opt/atlaris-customers/backups/sunshine-solution/" },
      { slug: "sunshine-solution-support", name: "Support", url: "https://support-sunshine-prod.pages.dev/", localPath: "/opt/atlaris-customers/websites/sunshine-solution-support/", backupPath: "/opt/atlaris-customers/backups/sunshine-solution-support/" },
    ],
  },
  {
    id: "CUS-002",
    name: "Vancouver RealEstateIQ",
    tier: "Managed",
    status: "Active",
    environments: 1,
    services: 1,
    website: "https://realt-state-housing.pages.dev/",
    brandIcon: "VR",
    brandClass: "realestate",
    description: "Vancouver RealEstateIQ managed customer environment.",
    sites: [
      { slug: "vancouver-realestateiq", name: "Main application", url: "https://realt-state-housing.pages.dev/", localPath: "/opt/atlaris-customers/websites/vancouver-realestateiq/", backupPath: "/opt/atlaris-customers/backups/vancouver-realestateiq/" },
    ],
  },
  {
    id: "CUS-003",
    name: "AIport",
    tier: "Managed",
    status: "Active",
    environments: 1,
    services: 1,
    website: "https://aiports-backend-final-02.pages.dev/",
    logo: "/customer-logos/aiport.png",
    brandIcon: "AI",
    brandClass: "aiport",
    description: "AIport managed customer environment.",
    sites: [
      { slug: "aiport", name: "Main application", url: "https://aiports-backend-final-02.pages.dev/", localPath: "/opt/atlaris-customers/websites/aiport/", backupPath: "/opt/atlaris-customers/backups/aiport/" },
    ],
  },
  {
    id: "CUS-004",
    name: "V. Regenerative",
    tier: "Managed",
    status: "Active",
    environments: 1,
    services: 1,
    website: "https://screenshot-exact-copy-23.lovable.app/",
    brandIcon: "V",
    brandClass: "regenerative",
    description: "V. Regenerative managed customer environment.",
    sites: [
      { slug: "v-regenerative", name: "Main application", url: "https://screenshot-exact-copy-23.lovable.app/", localPath: "/opt/atlaris-customers/websites/v-regenerative/", backupPath: "/opt/atlaris-customers/backups/v-regenerative/" },
    ],
  },
];

const serviceDefinitions = [
  { id: "nginx", label: "Nginx", detail: "Reverse proxy and static delivery", restartable: true },
  { id: "atlaris-server-agent", label: "Server Agent", detail: "Controlled atlas01 automation API", restartable: false },
  { id: "atlaris-openai-tunnel", label: "OpenAI Tunnel", detail: "MCP connector transport", restartable: true },
  { id: "atlaris-public-ai", label: "Public AI Backend", detail: "Preview website AI service", restartable: true },
];

const recentActivity = [
  { title: "Dashboard authentication upgraded", detail: "Session login and logout enabled", type: "security" },
  { title: "Operations layer expanded", detail: "40 controlled MCP capabilities available", type: "ops" },
  { title: "Customer backup controls enabled", detail: "Backup, refresh and restore workflows available", type: "backup" },
  { title: "Live monitoring enabled", detail: "Dashboard and service health refresh automatically every 30 seconds", type: "ops" },
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
  const response = await fetch(path, {
    cache: "no-store",
    credentials: "same-origin",
    ...options,
    headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) },
  });

  if (response.status === 401) {
    const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
    window.location.assign(`/login?next=${next}`);
    throw new Error("Session expired");
  }

  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { detail: text || `HTTP ${response.status}` }; }
  if (!response.ok) {
    const message = typeof data.detail === "string" ? data.detail : data.detail?.message || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

function App() {
  const [section, setSection] = useState("overview");
  const [selectedCustomer, setSelectedCustomer] = useState(customers[0]);
  const [healthState, setHealthState] = useState("idle");
  const [healthMessage, setHealthMessage] = useState("Automatic health monitoring is starting.");
  const [serviceState, setServiceState] = useState({});
  const [serviceLogs, setServiceLogs] = useState("");
  const [selectedLogService, setSelectedLogService] = useState("");
  const [backups, setBackups] = useState({});
  const [operation, setOperation] = useState({ busy: false, message: "Operations API ready.", tone: "neutral" });
  const [monitoringLastUpdated, setMonitoringLastUpdated] = useState(null);
  const [monitoringBusy, setMonitoringBusy] = useState(false);

  const sectionLabel = useMemo(() => {
    for (const group of navGroups) {
      const match = group.items.find((item) => item.id === section);
      if (match) return match.label;
    }
    return "Overview";
  }, [section]);

  const activeServiceCount = serviceDefinitions.filter((service) => serviceState[service.id] === "active").length;
  const checkedServiceCount = serviceDefinitions.filter((service) => Boolean(serviceState[service.id])).length;
  const allServicesHealthy = checkedServiceCount === serviceDefinitions.length && activeServiceCount === serviceDefinitions.length;

  async function withOperation(label, callback) {
    setOperation({ busy: true, message: `${label}…`, tone: "neutral" });
    try {
      const result = await callback();
      setOperation({ busy: false, message: `${label} completed successfully.`, tone: "success" });
      return result;
    } catch (error) {
      setOperation({ busy: false, message: `${label} failed: ${error.message}`, tone: "error" });
      throw error;
    }
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
    } catch (error) {
      setHealthState("error");
      setHealthMessage(`Health check failed · ${error.message}`);
      return false;
    }
  }

  async function refreshLiveMonitoring({ manual = false } = {}) {
    if (monitoringBusy) return;
    setMonitoringBusy(true);
    if (manual) setOperation({ busy: true, message: "Refreshing live monitoring…", tone: "neutral" });
    try {
      const results = await Promise.allSettled(
        serviceDefinitions.map((service) => apiFetch(`/api/ops/service/status?service=${encodeURIComponent(service.id)}`))
      );
      const nextState = {};
      results.forEach((result, index) => {
        const service = serviceDefinitions[index];
        nextState[service.id] = result.status === "fulfilled" ? (result.value.active || "unknown") : "unavailable";
      });
      setServiceState(nextState);
      await runQuickHealthCheck({ silent: true });
      setMonitoringLastUpdated(new Date());
      if (manual) setOperation({ busy: false, message: "Live monitoring refreshed.", tone: "success" });
    } catch (error) {
      if (manual) setOperation({ busy: false, message: `Live monitoring failed: ${error.message}`, tone: "error" });
    } finally {
      setMonitoringBusy(false);
    }
  }

  useEffect(() => {
    refreshLiveMonitoring();
    const timer = window.setInterval(() => refreshLiveMonitoring(), 30000);
    return () => window.clearInterval(timer);
  }, []);

  async function checkService(service) {
    const data = await withOperation(`Checking ${service}`, () => apiFetch(`/api/ops/service/status?service=${encodeURIComponent(service)}`));
    setServiceState((current) => ({ ...current, [service]: data.active || "unknown" }));
    setMonitoringLastUpdated(new Date());
  }

  async function loadLogs(service) {
    const data = await withOperation(`Loading ${service} logs`, () => apiFetch(`/api/ops/service/logs?service=${encodeURIComponent(service)}&lines=60`));
    setSelectedLogService(service);
    setServiceLogs(data.content || "No log entries returned.");
  }

  async function restartService(service) {
    if (!window.confirm(`Restart ${service}?`)) return;
    const data = await withOperation(`Restarting ${service}`, () => apiFetch("/api/ops/service/restart", { method: "POST", body: JSON.stringify({ service }) }));
    setServiceState((current) => ({ ...current, [service]: data.active || "active" }));
    setMonitoringLastUpdated(new Date());
  }

  async function loadBackups(slug, announce = true) {
    const loader = () => apiFetch(`/api/ops/customer/backups?customer=${encodeURIComponent(slug)}`);
    const data = announce ? await withOperation(`Loading ${slug} backups`, loader) : await loader();
    setBackups((current) => ({ ...current, [slug]: data.backups || [] }));
  }

  async function createBackup(slug) {
    await withOperation(`Creating ${slug} backup`, () => apiFetch(`/api/ops/customer/backup?customer=${encodeURIComponent(slug)}`, { method: "POST" }));
    await loadBackups(slug, false);
  }

  async function refreshMirror(slug) {
    if (!window.confirm(`Refresh ${slug} from its approved production URL? A pre-refresh backup will be created automatically.`)) return;
    await withOperation(`Refreshing ${slug}`, () => apiFetch(`/api/ops/customer/refresh?customer=${encodeURIComponent(slug)}`, { method: "POST" }));
    await loadBackups(slug, false);
  }

  async function restoreBackup(slug, backupName) {
    if (!window.confirm(`Restore ${slug} from ${backupName}? A safety backup of the current mirror will be created first.`)) return;
    await withOperation(`Restoring ${slug}`, () => apiFetch("/api/ops/customer/restore", { method: "POST", body: JSON.stringify({ customer: slug, backup: backupName }) }));
    await loadBackups(slug, false);
  }

  function renderOverview() {
    const serviceSummary = checkedServiceCount === 0 ? "Checking" : `${activeServiceCount}/${serviceDefinitions.length} active`;
    return <>
      <section className="hero-grid">
        <article className="hero-card infrastructure-hero" onClick={() => setSection("infrastructure")}><div className="hero-icon">▤</div><div><span className="eyebrow">Infrastructure</span><h3>Operate Atlaris systems</h3><p>Live service status, logs, approved restarts, deployment safeguards, Nginx and automation.</p></div><span className="hero-arrow">→</span></article>
        <article className="hero-card customers-hero" onClick={() => setSection("customers")}><div className="hero-icon">◎</div><div><span className="eyebrow">Customers</span><h3>Manage customer operations</h3><p>Customer mirrors, backups, refresh operations, restore history and service inventory.</p></div><span className="hero-arrow">→</span></article>
      </section>

      <section className="stats-grid">
        <StatCard label="Live services" value={serviceSummary} detail={monitoringLastUpdated ? `Updated ${monitoringLastUpdated.toLocaleTimeString()}` : "Automatic monitoring starting"} accent="LIVE" />
        <StatCard label="Managed customers" value={customers.length} detail="Active customer accounts" accent="CRM" />
        <StatCard label="Customer services" value={customers.reduce((sum, customer) => sum + customer.services, 0)} detail="Applications and support services" accent="SVC" />
        <StatCard label="MCP capabilities" value="40" detail="Controlled administration tools" accent="MCP" />
      </section>

      <section className="overview-grid">
        <article className="panel"><SectionTitle eyebrow="Infrastructure" title="Atlaris estate" description="Core systems managed by the administration platform." /><div className="estate-list">{infrastructure.map((server) => <div className="estate-row" key={server.name}><div className="server-avatar">{server.name === "atlas01" ? "01" : "+"}</div><div className="estate-copy"><strong>{server.name}</strong><span>{server.role}</span></div><div className="estate-meta"><span>{server.environment}</span><strong className={server.status === "Healthy" ? "good" : "muted"}>{server.status}</strong></div></div>)}</div></article>
        <article className="panel"><SectionTitle eyebrow="Customers" title="Customer pulse" description="Operational overview across managed accounts." /><div className="customer-pulse">{customers.map((customer) => <button key={customer.id} className="pulse-row" onClick={() => { setSelectedCustomer(customer); setSection("customers"); }}><CustomerLogo customer={customer} /><div><strong>{customer.name}</strong><span>{customer.services} service{customer.services === 1 ? "" : "s"} · {customer.tier}</span></div><span className="customer-status active">Active</span></button>)}</div></article>
      </section>

      <section className="panel activity-panel"><SectionTitle eyebrow="Operations" title="Platform improvements" description="Current dashboard and control-plane capabilities." /><div className="activity-list">{recentActivity.map((item) => <div className="activity-row" key={item.title}><span className={`activity-icon ${item.type}`}>{item.type === "security" ? "✓" : item.type === "backup" ? "↶" : "⌘"}</span><div><strong>{item.title}</strong><span>{item.detail}</span></div><span className="activity-state">Ready</span></div>)}</div></section>
    </>;
  }

  function renderInfrastructure() {
    return <>
      <SectionTitle eyebrow="Atlaris infrastructure" title="Infrastructure operations" description="Service states refresh automatically every 30 seconds. Manual status, logs and approved restart controls remain available." action={<button className="secondary-button" onClick={() => refreshLiveMonitoring({ manual: true })} disabled={monitoringBusy}>{monitoringBusy ? "Refreshing…" : "Refresh live status"}</button>} />

      <section className="stats-grid infrastructure-stats">
        <StatCard label="Host" value={atlasSnapshot.hostname} detail={atlasSnapshot.ip} accent="HOST" />
        <StatCard label="Authentication" value="Session" detail={atlasSnapshot.security} accent="AUTH" />
        <StatCard label="Live services" value={checkedServiceCount === 0 ? "Checking" : `${activeServiceCount}/${serviceDefinitions.length}`} detail={allServicesHealthy ? "All approved services active" : "Automatic monitoring enabled"} accent="LIVE" />
        <StatCard label="Dashboard" value={healthState === "healthy" ? "Healthy" : healthState === "error" ? "Check failed" : "Checking"} detail={healthMessage} accent="HTTP" />
      </section>

      <section className="panel"><div className="table-header"><div><span className="eyebrow">Runtime services</span><h3>atlas01 service control</h3></div><span className="table-note">{monitoringLastUpdated ? `Updated ${monitoringLastUpdated.toLocaleTimeString()}` : "Connecting…"}</span></div><div className="ops-service-list">{serviceDefinitions.map((service) => { const current = serviceState[service.id] || "Checking"; return <div className="ops-service-row" key={service.id}><div className="ops-service-copy"><div className="ops-service-title"><StatusDot tone={current === "active" ? "green" : "blue"} /><strong>{service.label}</strong></div><span>{service.detail}</span></div><span className={`service-state ${current === "active" ? "active" : ""}`}>{current}</span><div className="inline-actions"><button className="secondary-button" onClick={() => checkService(service.id)} disabled={operation.busy}>Status</button><button className="secondary-button" onClick={() => loadLogs(service.id)} disabled={operation.busy}>Logs</button>{service.restartable && <button className="danger-button" onClick={() => restartService(service.id)} disabled={operation.busy}>Restart</button>}</div></div>; })}</div></section>

      <section className="two-column-grid"><article className="panel"><SectionTitle eyebrow="Journal" title={selectedLogService ? `${selectedLogService} logs` : "Service logs"} description="Recent journal output from approved services only." /><pre className="log-viewer">{serviceLogs || "Select Logs on a service to load recent journal entries."}</pre></article><article className="panel"><SectionTitle eyebrow="Safety" title="Operational boundaries" /><div className="safety-list">{["Session-authenticated dashboard", "Server Agent API key remains server-side", "Approved service allowlist", "Server Agent self-restart blocked", "Customer refresh URLs hard-coded", "Restores create safety backups first", "Nginx validation before deployment"].map((item) => <div key={item}><span>✓</span>{item}</div>)}</div></article></section>
    </>;
  }

  function renderCustomers() {
    return <>
      <SectionTitle eyebrow="Customer operations" title="Customer administration" description="Manage customer mirrors and protected backups without exposing arbitrary server access." />
      <section className="customer-layout"><article className="panel customer-directory"><div className="directory-header"><span>Customer directory</span><strong>{customers.length}</strong></div><div className="directory-list">{customers.map((customer) => <button key={customer.id} className={`directory-item ${selectedCustomer.id === customer.id ? "selected" : ""}`} onClick={() => setSelectedCustomer(customer)}><CustomerLogo customer={customer} /><div><strong>{customer.name}</strong><span>{customer.id} · {customer.services} service{customer.services === 1 ? "" : "s"}</span></div><StatusDot /></button>)}</div></article>

      <article className="panel customer-detail"><div className="customer-detail-head"><div className="customer-identity"><CustomerLogo customer={selectedCustomer} large /><div><span className="eyebrow">{selectedCustomer.id}</span><h3>{selectedCustomer.name}</h3><p>{selectedCustomer.description}</p></div></div><span className="customer-status active">Active</span></div>
      <div className="customer-metrics"><div><strong>{selectedCustomer.environments}</strong><span>Environments</span></div><div><strong>{selectedCustomer.services}</strong><span>Services</span></div><div><strong>{selectedCustomer.sites.length}</strong><span>Managed mirrors</span></div><div><strong>{selectedCustomer.sites.reduce((total, site) => total + (backups[site.slug]?.length || 0), 0)}</strong><span>Loaded backups</span></div></div>

      <div className="customer-detail-grid wide">{selectedCustomer.sites.map((site) => <div className="subpanel site-ops-card" key={site.slug}><div className="site-ops-head"><div><span className="eyebrow">{site.name}</span><h4>{site.slug}</h4></div><a href={site.url} target="_blank" rel="noreferrer">Open ↗</a></div><div className="path-block"><span>Mirror</span><code>{site.localPath}</code></div><div className="path-block"><span>Backups</span><code>{site.backupPath}</code></div><div className="inline-actions site-actions"><button className="primary-button" onClick={() => createBackup(site.slug)} disabled={operation.busy}>Create backup</button><button className="secondary-button" onClick={() => loadBackups(site.slug)} disabled={operation.busy}>View backups</button><button className="danger-button" onClick={() => refreshMirror(site.slug)} disabled={operation.busy}>Refresh mirror</button></div>{backups[site.slug] && <div className="backup-list">{backups[site.slug].length === 0 ? <div className="empty-state">No timestamped backups found.</div> : backups[site.slug].slice(0, 8).map((backup) => <div className="backup-row" key={backup.name}><div><strong>{backup.name}</strong><span>{Math.max(1, Math.round(backup.bytes / 1024))} KB · {new Date(backup.modified).toLocaleString()}</span></div><button className="secondary-button" onClick={() => restoreBackup(site.slug, backup.name)} disabled={operation.busy}>Restore</button></div>)}</div>}</div>)}</div>
      <div className={`operation-banner ${operation.tone}`}>{operation.busy ? "Working · " : ""}{operation.message}</div></article></section>
    </>;
  }

  function renderEmailAccounts() {
    return <><SectionTitle eyebrow="Administration" title="Email Accounts" description="Atlaris-managed mailboxes used for notifications, customer contact and support." /><section className="panel"><div className="service-list">{emailAccounts.map((email) => <div className="service-line" key={email}><span><StatusDot />{email}</span><strong>Active</strong></div>)}</div></section></>;
  }

  function renderMonitoring() {
    return <>
      <SectionTitle eyebrow="Monitoring" title="Operational monitoring" description="Automatic 30-second service polling plus dashboard health visibility." action={<button className="primary-button" onClick={() => refreshLiveMonitoring({ manual: true })} disabled={monitoringBusy}>{monitoringBusy ? "Refreshing…" : "Refresh now"}</button>} />
      <section className="stats-grid"><StatCard label="Services checked" value={`${checkedServiceCount}/${serviceDefinitions.length}`} detail="Approved runtime services" accent="CHECK" /><StatCard label="Services active" value={activeServiceCount} detail={allServicesHealthy ? "All services healthy" : "Review inactive services"} accent="LIVE" /><StatCard label="Dashboard health" value={healthState === "healthy" ? "Healthy" : healthState === "error" ? "Failed" : "Checking"} detail={healthMessage} accent="HTTP" /><StatCard label="Refresh interval" value="30 sec" detail={monitoringLastUpdated ? `Last update ${monitoringLastUpdated.toLocaleTimeString()}` : "Initial update pending"} accent="AUTO" /></section>
      <section className="overview-grid"><article className="panel"><SectionTitle eyebrow="Runtime" title="Live service summary" /><div className="service-list">{serviceDefinitions.map((service) => <div className="service-line" key={service.id}><span><StatusDot tone={serviceState[service.id] === "active" ? "green" : "blue"} />{service.label}</span><strong>{serviceState[service.id] || "Checking"}</strong></div>)}</div></article><article className="panel"><SectionTitle eyebrow="Dashboard" title="Health endpoint" /><div className={`quick-health-result ${healthState === "healthy" ? "healthy" : healthState === "error" ? "error" : ""}`}>{healthMessage}</div><button className="secondary-button monitor-button" onClick={() => setSection("infrastructure")}>Open service controls</button></article></section>
    </>;
  }

  function renderPlaceholder() { return <section className="panel placeholder-page"><div className="placeholder-icon">⌘</div><span className="eyebrow">Module foundation</span><h2>{sectionLabel}</h2><p>This module is reserved for a future controlled Atlaris capability.</p><button className="secondary-button" onClick={() => setSection("overview")}>Return to overview</button></section>; }

  return <div className="app-shell"><aside className="sidebar"><div className="brand-block"><div className="brand-mark">A</div><div><div className="brand-name">Atlaris</div><div className="brand-caption">Administration Platform</div></div></div><div className="nav-scroll">{navGroups.map((group) => <div className="nav-group" key={group.label}><div className="sidebar-section-label">{group.label}</div><nav className="nav-list" aria-label={group.label}>{group.items.map((item) => <button key={item.id} className={`nav-link ${section === item.id ? "active" : ""}`} onClick={() => setSection(item.id)}><span>{item.icon}</span>{item.label}</button>)}</nav></div>)}</div><div className="sidebar-health"><div className="health-line"><span><StatusDot tone={allServicesHealthy ? "green" : "blue"} />Atlaris platform</span><strong>{allServicesHealthy ? "Online" : checkedServiceCount ? `${activeServiceCount}/${serviceDefinitions.length}` : "Checking"}</strong></div><div className="health-line muted"><span>Environment</span><strong>Production</strong></div><div className="health-line muted"><span>MCP tools</span><strong>40</strong></div></div></aside>

  <main className="main-content"><header className="topbar"><div><span className="eyebrow">Atlaris Technologies · Administration</span><h1>{section === "overview" ? "Administration overview" : sectionLabel}</h1><p>Secure infrastructure and customer operations from one control plane.</p></div><div className="top-actions"><span className="live-pill"><StatusDot tone={allServicesHealthy ? "green" : "blue"} />{allServicesHealthy ? "Live monitoring healthy" : "Live monitoring active"}</span><div className="user-chip" title="Atlaris administrator">AR</div><a className="secondary-button logout-button" href="/logout">Logout</a></div></header>

  {section === "overview" && renderOverview()}
  {section === "infrastructure" && renderInfrastructure()}
  {section === "monitoring" && renderMonitoring()}
  {section === "customers" && renderCustomers()}
  {section === "email-accounts" && renderEmailAccounts()}
  {!["overview", "infrastructure", "monitoring", "customers", "email-accounts"].includes(section) && renderPlaceholder()}

  <footer className="footer-note"><span>Atlaris Administration Platform</span><span>Session authenticated · live monitoring · controlled operations · protected customer backups</span></footer></main></div>;
}

export default App;
