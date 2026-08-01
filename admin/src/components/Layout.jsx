import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = [
  {
    section: "Overview",
    links: [
      { to: "/dashboard", label: "Dashboard", icon: <GridIcon /> },
      { to: "/analytics", label: "Analytics", icon: <ChartIcon /> },
    ],
  },
  {
    section: "People",
    links: [
      { to: "/drivers", label: "Drivers", icon: <TruckIcon /> },
      { to: "/dispatchers", label: "Dispatchers", icon: <UsersIcon /> },
    ],
  },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* SIDEBAR */}
      <aside
        style={{
          width: 220,
          flexShrink: 0,
          background: "#111C30",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          overflowY: "auto",
          zIndex: 50,
          borderRight: "0.5px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* LOGO */}
        <div
          style={{
            padding: "20px 16px 16px",
            borderBottom: "0.5px solid rgba(255,255,255,0.06)",
            marginBottom: 8,
          }}
        >
          <svg width="150" height="48" viewBox="0 0 160 60" fill="none">
            <rect x="4" y="8" width="44" height="44" rx="10" fill="#243558" />
            <ellipse
              cx="26"
              cy="30"
              rx="13"
              ry="8"
              stroke="#C8A84B"
              strokeWidth="2"
              fill="none"
            />
            <circle cx="26" cy="30" r="5" fill="#C8A84B" />
            <circle cx="26" cy="30" r="2.5" fill="#243558" />
            <text
              x="57"
              y="27"
              fontFamily="'Inter',system-ui,sans-serif"
              fontSize="14"
              fontWeight="700"
              fill="#ffffff"
              letterSpacing="1"
            >
              MARIO
            </text>
            <text
              x="57"
              y="43"
              fontFamily="'Inter',system-ui,sans-serif"
              fontSize="10"
              fontWeight="400"
              fill="#8C9CB8"
              letterSpacing="2.5"
            >
              LOGISTICS
            </text>
          </svg>
          <div
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.25)",
              marginTop: 6,
              letterSpacing: ".08em",
              textTransform: "uppercase",
            }}
          >
            Admin Portal
          </div>
        </div>

        {/* NAV */}
        <nav style={{ flex: 1, padding: "8px 0" }}>
          {NAV.map((group) => (
            <div key={group.section}>
              <div
                style={{
                  padding: "12px 16px 4px",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.25)",
                }}
              >
                {group.section}
              </div>
              {group.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  style={({ isActive }) => ({
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "8px 14px",
                    margin: "1px 8px",
                    borderRadius: 7,
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: "none",
                    transition: "all .15s",
                    color: isActive ? "#C8A84B" : "rgba(255,255,255,0.55)",
                    background: isActive
                      ? "rgba(200,168,75,0.12)"
                      : "transparent",
                    borderLeft: isActive
                      ? "2px solid #C8A84B"
                      : "2px solid transparent",
                  })}
                >
                  {link.icon}
                  {link.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* USER + LOGOUT */}
        <div
          style={{
            borderTop: "0.5px solid rgba(255,255,255,0.06)",
            padding: "14px 16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#243558",
                border: "1.5px solid rgba(200,168,75,0.4)",
                color: "#C8A84B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div>
              <div style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>
                {user?.name}
              </div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>
                Admin
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "7px 10px",
              borderRadius: 7,
              border: "none",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.35)",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all .15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              e.currentTarget.style.color = "rgba(255,255,255,0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.color = "rgba(255,255,255,0.35)";
            }}
          >
            <LogoutIcon /> Sign out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main
        style={{
          marginLeft: 220,
          flex: 1,
          padding: "28px 32px",
          minHeight: "100vh",
          background: "#F7F8FA",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}

function GridIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
function TruckIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="1" y="3" width="15" height="13" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
