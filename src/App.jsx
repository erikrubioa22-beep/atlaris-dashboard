import "./App.css";

function StatCard({ label, value, detail }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-detail">{detail}</div>
    </div>
  );
}

function App() {
  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">A</div>

          <div>
            <div className="brand-title">Atlaris</div>
            <div className="brand-subtitle">Technologies</div>
          </div>
        </div>

        <nav className="nav">
          <button className="nav-item active">Overview</button>
          <button className="nav-item">Servers</button>
          <button className="nav-item">Deployments</button>
          <button className="nav-item">Logs</button>
          <button className="nav-item">Automation</button>
          <button className="nav-item">Settings</button>
        </nav>

        <div className="sidebar-footer">
          <span className="online-dot"></span>
          atlas01 online
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="eyebrow">Infrastructure</div>
            <h1>Dashboard Overview</h1>
          </div>

          <div className="topbar-actions">
            <span className="environment-badge">Production</span>
            <button className="deploy-button">Deploy</button>
          </div>
        </header>

        <section className="stats-grid">
          <StatCard
            label="CPU Usage"
            value="2%"
            detail="atlas01"
          />

          <StatCard
            label="Memory"
            value="2.3%"
            detail="737 MiB of 31 GiB"
          />

          <StatCard
            label="Disk"
            value="12%"
            detail="12 GB of 98 GB"
          />

          <StatCard
            label="Uptime"
            value="13h"
            detail="System healthy"
          />
        </section>

        <section className="content-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-label">Server</div>
                <h2>atlas01</h2>
              </div>

              <span className="healthy-badge">Healthy</span>
            </div>

            <div className="server-details">
              <div>
                <span>Operating System</span>
                <strong>Ubuntu 24.04.4 LTS</strong>
              </div>

              <div>
                <span>Web Server</span>
                <strong>Nginx 1.24</strong>
              </div>

              <div>
                <span>Server Agent</span>
                <strong>Online</strong>
              </div>

              <div>
                <span>Agent Endpoint</span>
                <strong>127.0.0.1:8765</strong>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-label">Services</div>
                <h2>Service Status</h2>
              </div>
            </div>

            <div className="service-list">
              <div className="service-row">
                <span>Nginx</span>
                <span className="service-running">
                  <i></i>
                  Running
                </span>
              </div>

              <div className="service-row">
                <span>Atlaris Agent</span>
                <span className="service-running">
                  <i></i>
                  Running
                </span>
              </div>

              <div className="service-row">
                <span>SSH</span>
                <span className="service-running">
                  <i></i>
                  Running
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="panel deployments-panel">
          <div className="panel-header">
            <div>
              <div className="panel-label">Deployments</div>
              <h2>Recent Activity</h2>
            </div>

            <button className="secondary-button">
              View all
            </button>
          </div>

          <div className="empty-state">
            <div className="empty-icon">↑</div>
            <h3>No deployments yet</h3>
            <p>
              Your first deployment will appear here.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
