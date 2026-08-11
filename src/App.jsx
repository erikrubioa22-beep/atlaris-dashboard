import { useMemo, useState } from "react";
import "./App.css";

const infrastructure = [
  { name: "atlas01", role: "Core management server", environment: "Production", status: "Healthy", address: "192.168.1.149", services: 4 },
  { name: "Future node", role: "Reserved capacity", environment: "Planned", status: "Planned", address: "—", services: 0 },
];

const atlasSnapshot = {
  hostname: "atlas01",
  ip: "192.168.1.149",
  cpu: "0.0%",
  memory: "2.7% used",
  memoryDetail: "30.4 GiB available / 31.3 GiB total",
  fs: "13% used",
  fsDetail: "82 GiB available / 98 GiB root filesystem",
  uptime: "22h 44m",
  load: "0.01 / 0.00 / 0.00",
};

const emailAccounts = [
  "notifications@atlaris.ca",
  "contact@atlaris.ca",
  "support@atlaris.ca",
];

const customers = [
  { id: "CUS-001", name: "V. Regenerative Gardening", tier: "Managed", status: "Active", environments: 1, services: 1, deployments: 0, lastActivity: "New customer", description: "V. Regenerative Gardening helps homeowners across the Sunshine Coast create healthier, lower-maintenance outdoor spaces through native planting, organic care, and regenerative design." },
  { id: "CUS-004", name: "Demo Customer", tier: "Evaluation", status: "Onboarding", environments: 1, services: 2, deployments: 1, lastActivity: "2 days ago" },
  { id: "CUS-005", name: "Sunshine Solution", tier: "Managed", status: "Active", environments: 1, services: 0, deployments: 0, lastActivity: "New customer" },
  { id: "CUS-006", name: "AIport", tier: "Managed", status: "Active", environments: 1, services: 0, deployments: 0, lastActivity: "New customer" },
  { id: "CUS-007", name: "Vancouver RealEstateIQ", tier: "Managed", status: "Active", environments: 1, services: 0, deployments: 0, lastActivity: "New customer" },
];

const recentActivity = [
  { time: "03:14", title: "Dashboard deployed", detail: "Release 20260811T031420Z-76e25faff13c", type: "deploy" },
  { time: "03:04", title: "Operations dashboard committed", detail: "Commit 76e25fa", type: "git" },
  { time: "02:45", title: "Dashboard deployed", detail: "Release 20260811T024545Z-a4ddd8fdf305", type: "deploy" },
  { time: "01:53", title: "Rollback validated", detail: "Release 001 restored successfully", type: "rollback" },
];

const navGroups = [
  { label: "Workspace", items: [{ id: "overview", label: "Overview", icon: "◫" }] },
  { label: "Infrastructure", items: [{ id: "infrastructure", label: "Infrastructure", icon: "▤" }, { id: "deployments", label: "Deployments", icon: "⇧" }, { id: "monitoring", label: "Monitoring", icon: "⌁" }] },
  { label: "Customers", items: [{ id: "customers", label: "Customer Directory", icon: "◎" }, { id: "customer-services", label: "Customer Services", icon: "◇" }] },
  { label: "Administration", items: [{ id: "email-accounts", label: "Email Accounts", icon: "✉" }, { id: "automation", label: "Automation", icon: "⌘" }, { id: "access", label: "Users & Access", icon: "♙" }, { id: "audit", label: "Audit Log", icon: "≋" }, { id: "settings", label: "Settings", icon: "⚙" }] },
];

function StatusDot({ tone = "green" }) { return <span className={`status-dot ${tone}`} />; }
function StatCard({ label, value, detail, accent }) { return <article className="stat-card"><div className="stat-card-top"><span>{label}</span><span className="stat-accent">{accent}</span></div><strong>{value}</strong><p>{detail}</p></article>; }
function SectionTitle({ eyebrow, title, description, action }) { return <div className="section-title"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>; }

function App() {
  const [section, setSection] = useState("overview");
  const [selectedCustomer, setSelectedCustomer] = useState(customers[0]);
  const [healthState, setHealthState] = useState("idle");
  const [healthMessage, setHealthMessage] = useState("Run a quick browser-to-server check for atlas01.");
  const sectionLabel = useMemo(() => { for (const group of navGroups) { const match = group.items.find((item) => item.id === section); if (match) return match.label; } return "Overview"; }, [section]);

  async function runQuickHealthCheck() {
    setHealthState("checking");
    setHealthMessage("Checking atlas01 dashboard endpoint…");
    const started = performance.now();
    try {
      const response = await fetch(`/?health=${Date.now()}`, { method: "HEAD", cache: "no-store" });
      const elapsed = Math.max(1, Math.round(performance.now() - started));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setHealthState("healthy");
      setHealthMessage(`atlas01 is reachable · HTTP ${response.status} · ${elapsed} ms · system snapshot below`);
    } catch (error) {
      setHealthState("error");
      setHealthMessage(`Health check failed · ${error.message || "server unreachable"}`);
    }
  }

  function renderOverview() {
    return <>
      <section className="hero-grid"><article className="hero-card infrastructure-hero" onClick={() => setSection("infrastructure")}><div className="hero-icon">▤</div><div><span className="eyebrow">Infrastructure</span><h3>Operate Atlaris systems</h3><p>Servers, services, deployments, monitoring, releases, tunnels, agents, and automation.</p></div><span className="hero-arrow">→</span></article><article className="hero-card customers-hero" onClick={() => setSection("customers")}><div className="hero-icon">◎</div><div><span className="eyebrow">Customers</span><h3>Manage customer operations</h3><p>Accounts, assigned infrastructure, services, environments, deployments, and activity.</p></div><span className="hero-arrow">→</span></article></section>
      <section className="stats-grid"><StatCard label="Infrastructure health" value="Healthy" detail="atlas01 online · agent + tunnel ready" accent="CORE" /><StatCard label="Managed customers" value={customers.length} detail="4 active · 1 onboarding" accent="CRM" /><StatCard label="Production releases" value="5" detail="Current release protected by rollback" accent="CD" /><StatCard label="MCP capabilities" value="21" detail="Controlled administration tools" accent="MCP" /></section>
      <section className="overview-grid"><article className="panel"><SectionTitle eyebrow="Infrastructure" title="Atlaris estate" description="Core systems currently managed by the administration platform." /><div className="estate-list">{infrastructure.map((server) => <div className="estate-row" key={server.name}><div className="server-avatar">{server.name === "atlas01" ? "01" : "+"}</div><div className="estate-copy"><strong>{server.name}</strong><span>{server.role}</span></div><div className="estate-meta"><span>{server.environment}</span><strong className={server.status === "Healthy" ? "good" : "muted"}>{server.status}</strong></div></div>)}</div></article><article className="panel"><SectionTitle eyebrow="Customers" title="Customer pulse" description="Operational status across managed customer accounts." /><div className="customer-pulse">{customers.map((customer) => <button key={customer.id} className="pulse-row" onClick={() => { setSelectedCustomer(customer); setSection("customers"); }}><div className="customer-monogram">{customer.name.slice(0, 2).toUpperCase()}</div><div><strong>{customer.name}</strong><span>{customer.tier}</span></div><span className={`customer-status ${customer.status.toLowerCase()}`}>{customer.status}</span></button>)}</div></article></section>
      <section className="panel activity-panel"><SectionTitle eyebrow="Operations" title="Recent platform activity" description="Infrastructure and deployment events from the current Atlaris environment." /><div className="activity-list">{recentActivity.map((item) => <div className="activity-row" key={`${item.time}-${item.title}`}><span className={`activity-icon ${item.type}`}>{item.type === "rollback" ? "↶" : item.type === "git" ? "⌘" : "↑"}</span><div><strong>{item.title}</strong><span>{item.detail}</span></div><time>{item.time} UTC</time></div>)}</div></section>
    </>;
  }

  function renderInfrastructure() {
    return <><SectionTitle eyebrow="Atlaris infrastructure" title="Infrastructure administration" description="Internal systems owned and operated by Atlaris Technologies. Customer-assigned assets will reference these records rather than duplicate them." action={<button className="primary-button">Add server</button>} />
      <section className="stats-grid infrastructure-stats"><StatCard label="Servers" value="1" detail="1 production · 0 degraded" accent="HOST" /><StatCard label="Services" value="4" detail="Nginx · Agent · Tunnel · Git" accent="SVC" /><StatCard label="CPU" value="0.0%" detail="atlas01 snapshot" accent="CPU" /><StatCard label="Disk" value="12.6%" detail="81.1 GiB free" accent="SSD" /></section>
      <section className="panel"><div className="table-header"><div><span className="eyebrow">Servers</span><h3>Managed infrastructure</h3></div><span className="table-note">Production inventory</span></div><div className="data-table"><div className="data-row data-head"><span>Server</span><span>Environment</span><span>Address</span><span>Services</span><span>Status</span></div>{infrastructure.map((server) => <div className="data-row" key={server.name}><span><strong>{server.name}</strong><small>{server.role}</small></span><span>{server.environment}</span><span className="mono">{server.address}</span><span>{server.services}</span><span><b className={server.status === "Healthy" ? "status-badge healthy" : "status-badge planned"}>{server.status}</b></span></div>)}</div></section>
      <section className="two-column-grid"><article className="panel"><SectionTitle eyebrow="atlas01" title="Runtime services" /><div className="service-list">{["Nginx 1.24", "Atlaris Server Agent", "OpenAI Tunnel", "Dashboard Git Repository"].map((service) => <div className="service-line" key={service}><span><StatusDot />{service}</span><strong>Healthy</strong></div>)}</div><div className="quick-health"><div className="quick-health-copy"><strong>Quick Health Check</strong><span>Verify reachability and review atlas01 system health.</span></div><button className="primary-button health-check-button" disabled={healthState === "checking"} onClick={runQuickHealthCheck}>{healthState === "checking" ? "Checking…" : "Run Check"}</button></div><div className={`quick-health-result ${healthState === "healthy" ? "healthy" : healthState === "error" ? "error" : ""}`}>{healthMessage}</div><div className="customer-metrics"><div><strong>{atlasSnapshot.ip}</strong><span>IP address</span></div><div><strong>{atlasSnapshot.cpu}</strong><span>CPU utilization</span></div><div><strong>{atlasSnapshot.memory}</strong><span>Memory · {atlasSnapshot.memoryDetail}</span></div><div><strong>{atlasSnapshot.fs}</strong><span>Root FS · {atlasSnapshot.fsDetail}</span></div><div><strong>{atlasSnapshot.uptime}</strong><span>Uptime</span></div><div><strong>{atlasSnapshot.load}</strong><span>Load average · 1 / 5 / 15 min</span></div></div></article><article className="panel"><SectionTitle eyebrow="Deployment" title="Safety controls" /><div className="safety-list">{["Clean Git working tree", "Fast-forward only update", "Production build validation", "Atomic release switch", "Nginx configuration test", "HTTP post-deploy health check", "Rollback target retained"].map((item) => <div key={item}><span>✓</span>{item}</div>)}</div></article></section>
    </>;
  }

  function renderCustomers() {
    const description = selectedCustomer.description || "Customer profile ready for infrastructure, services, deployments, domains, activity, and operational notes.";
    return <><SectionTitle eyebrow="Customer operations" title="Customer administration" description="Manage customer accounts and map each customer to its environments, services, infrastructure, deployments, domains, and operational history." action={<button className="primary-button">Add customer</button>} /><section className="customer-layout"><article className="panel customer-directory"><div className="directory-header"><span>Customer directory</span><strong>{customers.length}</strong></div><div className="directory-list">{customers.map((customer) => <button key={customer.id} className={`directory-item ${selectedCustomer.id === customer.id ? "selected" : ""}`} onClick={() => setSelectedCustomer(customer)}><div className="customer-monogram">{customer.name.slice(0, 2).toUpperCase()}</div><div><strong>{customer.name}</strong><span>{customer.id} · {customer.tier}</span></div><StatusDot tone={customer.status === "Onboarding" ? "blue" : "green"} /></button>)}</div></article><article className="panel customer-detail"><div className="customer-detail-head"><div className="customer-identity"><div className="customer-monogram large">{selectedCustomer.name.slice(0, 2).toUpperCase()}</div><div><span className="eyebrow">{selectedCustomer.id}</span><h3>{selectedCustomer.name}</h3><p>{selectedCustomer.tier} customer</p></div></div><span className={`customer-status ${selectedCustomer.status.toLowerCase()}`}>{selectedCustomer.status}</span></div><div className="customer-metrics"><div><strong>{selectedCustomer.environments}</strong><span>Environments</span></div><div><strong>{selectedCustomer.services}</strong><span>Services</span></div><div><strong>{selectedCustomer.deployments}</strong><span>Deployments</span></div><div><strong>{selectedCustomer.lastActivity}</strong><span>Last activity</span></div></div><div className="customer-tabs"><span className="active">Overview</span><span>Infrastructure</span><span>Services</span><span>Deployments</span><span>Domains</span><span>Activity</span><span>Notes</span></div><div className="customer-detail-grid"><div className="subpanel"><span className="eyebrow">Customer profile</span><h4>{selectedCustomer.name}</h4><p>{description}</p><div className="placeholder-map"><StatusDot />Customer operations profile</div></div><div className="subpanel"><span className="eyebrow">Operations</span><h4>Service portfolio</h4><p>Track hosting, applications, domains, backups, monitoring, and managed services from the customer record.</p><div className="mini-service-tags"><span>Hosting</span><span>Monitoring</span><span>Deployments</span></div></div></div></article></section></>;
  }

  function renderEmailAccounts() {
    return <><SectionTitle eyebrow="Administration" title="Email Accounts" description="Atlaris-managed email accounts used for notifications, customer contact, support, and administration." /><section className="panel"><div className="table-header"><div><span className="eyebrow">Atlaris.ca</span><h3>Managed mailboxes</h3></div><span className="table-note">{emailAccounts.length} accounts</span></div><div className="service-list">{emailAccounts.map((email) => <div className="service-line" key={email}><span><StatusDot />{email}</span><strong>Active</strong></div>)}</div></section></>;
  }

  function renderPlaceholder() { return <section className="panel placeholder-page"><div className="placeholder-icon">⌘</div><span className="eyebrow">Module foundation</span><h2>{sectionLabel}</h2><p>This administration module is reserved in the new Atlaris information architecture. We will connect it to its backend model and permissions as the platform expands.</p><button className="secondary-button" onClick={() => setSection("overview")}>Return to overview</button></section>; }

  return <div className="app-shell"><aside className="sidebar"><div className="brand-block"><div className="brand-mark">A</div><div><div className="brand-name">Atlaris</div><div className="brand-caption">Administration Platform</div></div></div><div className="nav-scroll">{navGroups.map((group) => <div className="nav-group" key={group.label}><div className="sidebar-section-label">{group.label}</div><nav className="nav-list">{group.items.map((item) => <button key={item.id} className={`nav-link ${section === item.id ? "active" : ""}`} onClick={() => setSection(item.id)}><span>{item.icon}</span>{item.label}</button>)}</nav></div>)}</div><div className="sidebar-health"><div className="health-line"><span><StatusDot />Atlaris platform</span><strong>Online</strong></div><div className="health-line muted"><span>Environment</span><strong>Production</strong></div><div className="health-line muted"><span>MCP tools</span><strong>21</strong></div></div></aside><main className="main-content"><header className="topbar"><div><span className="eyebrow">Atlaris Technologies · Administration</span><h1>{section === "overview" ? "Administration overview" : sectionLabel}</h1><p>One platform for Atlaris infrastructure operations and customer administration.</p></div><div className="top-actions"><span className="live-pill"><StatusDot />Production healthy</span><div className="user-chip">AR</div></div></header>{section === "overview" && renderOverview()}{section === "infrastructure" && renderInfrastructure()}{section === "customers" && renderCustomers()}{section === "email-accounts" && renderEmailAccounts()}{!["overview", "infrastructure", "customers", "email-accounts"].includes(section) && renderPlaceholder()}<footer className="footer-note"><span>Atlaris Administration Platform</span><span>Infrastructure and customer operations remain logically separated while sharing a common control plane.</span></footer></main></div>;
}

export default App;
