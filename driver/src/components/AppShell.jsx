import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "0 auto",
        minHeight: "100vh",
        background: "#F7F8FA",
        position: "relative",
      }}
    >
      {/* TOP HEADER */}
      <header
        style={{
          background: "#111C30",
          padding: "12px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
          borderBottom: "0.5px solid rgba(255,255,255,0.05)",
        }}
      >
        <svg width="120" height="38" viewBox="0 0 160 60" fill="none">
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

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>
              {user?.name?.split(" ")[0]}
            </div>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>
              Driver
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "0.5px solid rgba(255,255,255,0.1)",
              borderRadius: 7,
              color: "rgba(255,255,255,0.5)",
              padding: "6px 12px",
              fontSize: 11,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all .15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.07)";
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <div style={{ paddingBottom: 72 }}>
        <Outlet />
      </div>

      {/* BOTTOM NAV */}
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 480,
          background: "#fff",
          borderTop: "0.5px solid rgba(27,43,75,0.1)",
          display: "flex",
          zIndex: 50,
        }}
      >
        {[
          { path: "/deliveries", label: "Today", icon: <TruckIcon /> },
          { path: "/history", label: "History", icon: <HistoryIcon /> },
        ].map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "10px 0",
                fontSize: 10,
                fontWeight: 600,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                gap: 4,
                color: active ? "#1B2B4B" : "#8C9CB8",
                borderTop: active
                  ? "2px solid #C8A84B"
                  : "2px solid transparent",
                transition: "all .15s",
                fontFamily: "inherit",
              }}
            >
              <span style={{ color: active ? "#1B2B4B" : "#8C9CB8" }}>
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function TruckIcon() {
  return (
    <svg
      width="20"
      height="20"
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
function HistoryIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
