import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../lib/axios";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      if (data.user.role !== "driver") {
        setError("This app is for drivers only.");
        return;
      }
      login(data.token, data.user);
      navigate("/deliveries");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111C30",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          marginBottom: 28,
          textAlign: "center",
          animation: "fadeDown .4s ease",
        }}
      >
        <svg width="200" height="72" viewBox="0 0 160 60" fill="none">
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
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "32px 28px 28px",
          width: "100%",
          maxWidth: 380,
          animation: "fadeUp .4s ease",
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#1B2B4B",
              marginBottom: 4,
            }}
          >
            Driver sign in
          </h1>
          <p style={{ fontSize: 13, color: "#8C9CB8", margin: 0 }}>
            See your deliveries for today
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "#FDECEA",
              color: "#C0392B",
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 16,
              animation: "shake .3s ease",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: "#4A5568",
                marginBottom: 5,
                textTransform: "uppercase",
                letterSpacing: ".05em",
              }}
            >
              Email
            </label>
            <input
              type="email"
              placeholder="you@mariologistics.fi"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
              style={{
                width: "100%",
                padding: "11px 14px",
                border: "0.5px solid rgba(27,43,75,0.2)",
                borderRadius: 8,
                fontSize: 14,
                fontFamily: "inherit",
                color: "#1B2B4B",
                outline: "none",
                transition: "border-color .15s, box-shadow .15s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#1B2B4B";
                e.target.style.boxShadow = "0 0 0 3px rgba(27,43,75,0.08)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(27,43,75,0.2)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div style={{ marginBottom: 22 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: "#4A5568",
                marginBottom: 5,
                textTransform: "uppercase",
                letterSpacing: ".05em",
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="current-password"
                style={{
                  width: "100%",
                  padding: "11px 50px 11px 14px",
                  border: "0.5px solid rgba(27,43,75,0.2)",
                  borderRadius: 8,
                  fontSize: 14,
                  fontFamily: "inherit",
                  color: "#1B2B4B",
                  outline: "none",
                  transition: "border-color .15s, box-shadow .15s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#1B2B4B";
                  e.target.style.boxShadow = "0 0 0 3px rgba(27,43,75,0.08)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(27,43,75,0.2)";
                  e.target.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#8C9CB8",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  padding: 0,
                }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px 16px",
              background: loading ? "#8C9CB8" : "#1B2B4B",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background .15s, transform .1s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
            onMouseDown={(e) => {
              if (!loading) e.currentTarget.style.transform = "scale(.98)";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: 16,
                    height: 16,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin .7s linear infinite",
                  }}
                />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>
      </div>

      <p
        style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 24 }}
      >
        Mario Logistics © 2026
      </p>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
      `}</style>
    </div>
  );
}
