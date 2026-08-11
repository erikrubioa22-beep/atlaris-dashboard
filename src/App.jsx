import "./App.css";

const releases = [
  {
    name: "20260811T024545Z-a4ddd8fdf305",
    state: "Current",
    meta: "Deployed 02:45 UTC",
  },
  {
    name: "20260811T015506Z-a4ddd8fdf305",
    state: "Keep",
    meta: "Previous release",
  },
  {
    name: "20260811T015030Z-a4ddd8fdf305",
    state: "Keep",
    meta: "Validated release",
  },
  {
    name: "001",
    state: "Protected",
    meta: "Bootstrap rollback point",
  },
];

const activity = [
  {
    time: "02:45",
    title: "Dashboard deployed",
    detail: "Release 20260811T024545Z-a4ddd8fdf305",
    type: "deploy",
  },
  {
    time: "01:55",
    title: "Dashboard deployed",
    detail: "Release 20260811T015506Z-a4ddd8fdf305",
    type: "deploy",
  },
  {
    time: "01:53",
    title: "Rollback validated",
    detail: "Restored release 001 successfully",
    type: "rollback",
  },
  {
    time: "01:50",
    title: "First automated deployment",
    detail: "Release pipeline completed successfully",
    type: "deploy",
  },
];

function StatusDot({ tone = "green" }) {
  return <span className={`status-dot ${tone}`} />;
}

function MetricCard({ label, value, detail, progress, accent }) {
  return (
    <article className="metric-card">
      <div className="metric-topline">
        <span>{label}</span>
        <span className="metric-spark">{accent}</span>
      </div>
      <strong>{value}</strong>
      <p>{detail}</p>
      <div className="meter">
        <span style={{ width: `${progress}%` }} />
      </div>
    </article>
  );
}

function ServiceRow({ name, detail, value, tone = "green" }) {
  return (
    <div className="service-row">
      <div>
        <div className="service-name">
          <StatusDot tone={tone} />
          {name}
        </div>
        <span>{detail}</span>
      </div>
      <strong>{value}</strong>
    </div>
  );
}

function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">A</div>
          <div>
            <div className="brand-name">Atlaris</div>
            <div className="brand-caption">Operations Console</div>
          </div>
        </div>

        <div className="sidebar-section-label">Workspace</div>
        <nav className="nav-list">
          <button className="nav-link active"><span>◫</span>Overview</button>
          <button className="nav-link"><span>▤</span>Infrastructure</button>
          <button className="nav-link"><span>⇧</span>Deployments</button>
          <button className="nav-link"><span>⌘</span>Automation</button>
          <button className="nav-link"><span>≋</span>Logs</button>
        </nav>

        <div className="sidebar-section-label lower">System</div>
        <nav className="nav-list">
          <button className="nav-link"><span>⚙</span>Settings</button>
          <button className="nav-link"><span>?</span>Runbook</button>
        </nav>

        <div className="sidebar-health">
          <div className="health-line">
            <span><StatusDot />atlas01</span>
            <strong>Online</strong>
          </div>
          <div className="health-line muted">
            <span>MCP tools</span>
            <strong>19</strong>
          </div>
          <div className="health-line muted">
            <span>Environment</span>
            <strong>Production</strong>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="eyebrow">Atlaris Technologies · Production</div>
            <h1>Infrastructure command center</h1>
            <p>Operational snapshot for atlas01, deployments, MCP tooling, and release safety.</p>
          </div>
          <div className="top-actions">
            <span className="live-pill"><StatusDot />All systems nominal</span>
            <button className="primary-button">Deploy ready</button>
          </div>
        </header>

        <section className="metrics-grid">
          <MetricCard label="CPU usage" value="0.0%" detail="atlas01 · healthy" progress={4} accent="CPU" />
          <MetricCard label="Memory" value="2.6%" detail="30.4 GiB available" progress={3} accent="RAM" />
          <MetricCard label="Disk" value="12.6%" detail="81.1 GiB free" progress={13} accent="SSD" />
          <MetricCard label="MCP tools" value="19" detail="v3 plugin connected" progress={100} accent="MCP" />
        </section>

        <section className="upper-grid">
          <article className="panel server-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">Server health</span>
                <h2>atlas01</h2>
              </div>
              <span className="success-chip"><StatusDot />Healthy</span>
            </div>

            <div className="server-hero">
              <div className="server-orb">01</div>
              <div>
                <strong>Ubuntu 24.04.4 LTS</strong>
                <span>192.168.1.149 · x86_64</span>
              </div>
            </div>

            <div className="server-grid">
              <div><span>Web server</span><strong>Nginx 1.24</strong></div>
              <div><span>Agent</span><strong>Healthy</strong></div>
              <div><span>Agent endpoint</span><strong>127.0.0.1:8765</strong></div>
              <div><span>Tunnel</span><strong>Ready</strong></div>
            </div>
          </article>

          <article className="panel services-panel">
            <div className="panel-heading compact">
              <div>
                <span className="panel-kicker">Runtime</span>
                <h2>Service status</h2>
              </div>
            </div>
            <div className="service-list">
              <ServiceRow name="Nginx" detail="Configuration validated" value="Running" />
              <ServiceRow name="Server Agent" detail="Controlled operations API" value="Healthy" />
              <ServiceRow name="OpenAI Tunnel" detail="MCP transport · stdio" value="Ready" />
              <ServiceRow name="Git repository" detail="main · clean working tree" value="Synced" />
            </div>
          </article>
        </section>

        <section className="middle-grid">
          <article className="panel release-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">Release management</span>
                <h2>Active deployment</h2>
              </div>
              <span className="release-count">4 releases</span>
            </div>

            <div className="current-release">
              <div>
                <span>Current release</span>
                <strong>20260811T024545Z-a4ddd8fdf305</strong>
              </div>
              <span className="current-tag">CURRENT</span>
            </div>

            <div className="release-list">
              {releases.map((release) => (
                <div className="release-row" key={release.name}>
                  <div>
                    <strong>{release.name}</strong>
                    <span>{release.meta}</span>
                  </div>
                  <span className={`release-state ${release.state.toLowerCase()}`}>{release.state}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="panel pipeline-panel">
            <div className="panel-heading compact">
              <div>
                <span className="panel-kicker">Deployment pipeline</span>
                <h2>Safety gates</h2>
              </div>
            </div>
            <div className="pipeline-list">
              {[
                ["1", "Git fetch", "origin/main"],
                ["2", "Clean tree", "preflight"],
                ["3", "npm ci", "dependencies"],
                ["4", "Vite build", "production"],
                ["5", "Atomic release", "symlink switch"],
                ["6", "Nginx + HTTP", "validation"],
              ].map(([n, title, detail]) => (
                <div className="pipeline-row" key={n}>
                  <span className="pipeline-number">{n}</span>
                  <div><strong>{title}</strong><span>{detail}</span></div>
                  <span className="check">✓</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="bottom-grid">
          <article className="panel activity-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">Activity</span>
                <h2>Deployment timeline</h2>
              </div>
              <span className="snapshot-note">Snapshot · Aug 11, 2026</span>
            </div>
            <div className="timeline">
              {activity.map((item) => (
                <div className="timeline-item" key={`${item.time}-${item.title}`}>
                  <span className={`timeline-icon ${item.type}`}>{item.type === "rollback" ? "↶" : "↑"}</span>
                  <div className="timeline-copy">
                    <div><strong>{item.title}</strong><time>{item.time} UTC</time></div>
                    <span>{item.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="panel governance-panel">
            <div className="panel-heading compact">
              <div>
                <span className="panel-kicker">Governance</span>
                <h2>Release policy</h2>
              </div>
            </div>
            <div className="policy-card">
              <div className="policy-icon">◎</div>
              <div>
                <strong>Cleanup preview is active</strong>
                <span>No deletion candidates. Release 001 stays protected.</span>
              </div>
            </div>
            <div className="policy-stats">
              <div><strong>5</strong><span>Recent releases retained</span></div>
              <div><strong>0</strong><span>Cleanup candidates</span></div>
              <div><strong>1</strong><span>Protected bootstrap</span></div>
            </div>
            <div className="guardrail">Destructive cleanup remains disabled until explicitly enabled.</div>
          </article>
        </section>

        <footer className="footer-note">
          <span>Atlaris Operations Console</span>
          <span>Snapshot data captured from atlas01 before build · live actions remain controlled through MCP.</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
