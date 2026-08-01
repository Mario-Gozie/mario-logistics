import { useEffect, useState } from "react";
import api from "../lib/axios";
import { io } from "socket.io-client";

export default function MyDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [showNote, setShowNote] = useState(null);
  const [note, setNote] = useState("");
  const [toast, setToast] = useState("");
  const [uploadingId, setUploadingId] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(""), 3000);
  };

  const load = () => {
    api
      .get("/driver/deliveries")
      .then((r) => setDeliveries(r.data))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();

    // connect to backend for live updates
    const token = localStorage.getItem("ml_token");
    const socket = io(
      import.meta.env.VITE_API_URL?.replace("/api", "") ||
        "http://localhost:5000",
      { auth: { token } },
    );

    // when a dispatcher assigns work or anything changes, reload the list
    socket.on("delivery:updated", () => {
      load();
    });

    return () => socket.disconnect();
  }, []);

  const updateStatus = async (delivery, newStatus) => {
    if (newStatus === "failed") {
      setShowNote(delivery);
      return;
    }
    setUpdating(delivery.id);
    try {
      await api.patch(`/deliveries/${delivery.id}/status`, {
        status: newStatus,
      });
      showToast(
        newStatus === "in_transit"
          ? "Marked as picked up!"
          : "Delivery confirmed!",
      );
      load();
    } catch {
      showToast("Failed to update status", "error");
    } finally {
      setUpdating(null);
    }
  };

  const submitFailed = async () => {
    setUpdating(showNote.id);
    try {
      await api.patch(`/deliveries/${showNote.id}/status`, {
        status: "failed",
        note,
      });
      showToast("Marked as failed");
      setShowNote(null);
      setNote("");
      load();
    } catch {
      showToast("Error", "error");
    } finally {
      setUpdating(null);
    }
  };

  const handlePhotoUpload = async (deliveryId, file) => {
    if (!file) return;
    setUploadingId(deliveryId);
    try {
      // FormData sends files as multipart/form-data — Multer reads this on backend
      const formData = new FormData();
      formData.append("photo", file);
      await api.post(`/deliveries/${deliveryId}/proof`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showToast("Photo uploaded!");
      load();
    } catch {
      showToast("Upload failed", "error");
    } finally {
      setUploadingId(null);
    }
  };

  const today = deliveries.filter((d) =>
    ["pending", "in_transit"].includes(d.status),
  );
  const done = deliveries.filter((d) =>
    ["delivered", "failed"].includes(d.status),
  );

  if (loading)
    return (
      <div className="loader">
        <div className="spinner" />
      </div>
    );

  return (
    <div className="page" style={{ animation: "fadeIn .3s ease" }}>
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 70,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 999,
            background:
              toast.type === "error" ? "var(--danger)" : "var(--navy)",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
            animation: "fadeDown .25s ease",
            whiteSpace: "nowrap",
          }}
        >
          {toast.msg}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {[
          { label: "To Do", value: today.length, color: "var(--info)" },
          {
            label: "Done Today",
            value: done.filter((d) => d.status === "delivered").length,
            color: "var(--success)",
          },
          {
            label: "Failed",
            value: done.filter((d) => d.status === "failed").length,
            color: "var(--danger)",
          },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: "var(--white)",
              border: "0.5px solid var(--border)",
              borderRadius: 10,
              padding: "10px 12px",
              animation: `fadeUp .3s ease ${i * 0.06}s both`,
            }}
          >
            <div
              style={{
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: ".07em",
                color: "var(--text-muted)",
                marginBottom: 3,
              }}
            >
              {s.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {today.length === 0 && done.length === 0 && (
        <div className="empty-state">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <p>No deliveries assigned yet.</p>
        </div>
      )}

      {today.length > 0 && (
        <>
          <div className="section-label">Active — {today.length} remaining</div>
          {today.map((d, i) => (
            <div
              key={d.id}
              className={`delivery-card priority-${d.priority}`}
              style={{ animation: `fadeUp .3s ease ${i * 0.07}s both` }}
            >
              <div className="delivery-card-head">
                <div>
                  <div className="tracking-code">{d.tracking_code}</div>
                  {d.priority === "high" && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "var(--danger)",
                        display: "block",
                      }}
                    >
                      ● HIGH PRIORITY
                    </span>
                  )}
                </div>
                <span
                  className={`pill pill-${d.status === "in_transit" ? "transit" : "pending"}`}
                >
                  {d.status === "in_transit" ? "In Transit" : "Pending"}
                </span>
              </div>
              <div className="recipient-name">{d.recipient_name}</div>
              {d.recipient_phone && (
                <a
                  href={`tel:${d.recipient_phone}`}
                  className="recipient-detail"
                  style={{
                    textDecoration: "none",
                    color: "var(--info)",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  📞 {d.recipient_phone}
                </a>
              )}
              <div className="address-row">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-muted)"
                  strokeWidth="2"
                  style={{ flexShrink: 0, marginTop: 1 }}
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <div className="address-text">{d.address}</div>
              </div>
              {d.notes && <div className="notes-row">📝 {d.notes}</div>}

              {/* Hidden file input for photo capture */}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                id={`photo-${d.id}`}
                style={{ display: "none" }}
                onChange={(e) => handlePhotoUpload(d.id, e.target.files[0])}
              />

              <div className="action-row">
                {d.status === "pending" && (
                  <button
                    className="btn btn-primary"
                    onClick={() => updateStatus(d, "in_transit")}
                    disabled={updating === d.id}
                  >
                    {updating === d.id ? (
                      <span
                        className="spinner"
                        style={{ width: 16, height: 16, borderWidth: 2 }}
                      />
                    ) : (
                      "📦 Picked Up"
                    )}
                  </button>
                )}
                {d.status === "in_transit" && (
                  <>
                    <button
                      className="btn btn-success"
                      onClick={() => updateStatus(d, "delivered")}
                      disabled={updating === d.id}
                    >
                      {updating === d.id ? (
                        <span
                          className="spinner"
                          style={{ width: 16, height: 16, borderWidth: 2 }}
                        />
                      ) : (
                        "✓ Delivered"
                      )}
                    </button>
                    <label
                      htmlFor={`photo-${d.id}`}
                      className="btn btn-outline"
                      style={{ cursor: "pointer" }}
                      title="Upload proof photo"
                    >
                      {uploadingId === d.id ? (
                        <span
                          className="spinner"
                          style={{ width: 14, height: 14, borderWidth: 2 }}
                        />
                      ) : (
                        "📷"
                      )}
                    </label>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => updateStatus(d, "failed")}
                    >
                      ✕ Failed
                    </button>
                  </>
                )}
              </div>
              {d.proof_photo_url && (
                <div style={{ marginTop: 10 }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--success)",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    ✓ Proof uploaded
                  </div>
                  <img
                    src={d.proof_photo_url}
                    alt="Proof"
                    style={{
                      width: "100%",
                      borderRadius: 8,
                      maxHeight: 120,
                      objectFit: "cover",
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {done.length > 0 && (
        <>
          <div className="section-label" style={{ marginTop: 20 }}>
            Completed today
          </div>
          {done.map((d, i) => (
            <div
              key={d.id}
              className="delivery-card"
              style={{
                opacity: 0.7,
                animation: `fadeIn .3s ease ${i * 0.04}s both`,
              }}
            >
              <div className="delivery-card-head">
                <div>
                  <div className="tracking-code">{d.tracking_code}</div>
                  <div className="recipient-name" style={{ fontSize: 13 }}>
                    {d.recipient_name}
                  </div>
                </div>
                <span className={`pill pill-${d.status}`}>
                  {d.status === "delivered" ? "Delivered" : "Failed"}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {d.address}
              </div>
            </div>
          ))}
        </>
      )}

      {showNote && (
        <div className="modal-overlay" style={{ animation: "fadeIn .2s ease" }}>
          <div className="modal" style={{ animation: "slideUp .25s ease" }}>
            <div className="modal-handle" />
            <div className="modal-title">Mark as Failed</div>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-sec)",
                marginBottom: 14,
              }}
            >
              What happened with {showNote.recipient_name}'s delivery?
            </p>
            <div className="form-group">
              <label className="form-label">Reason</label>
              <input
                className="form-input"
                placeholder="e.g. No one home..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setShowNote(null);
                  setNote("");
                }}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                className="btn"
                onClick={submitFailed}
                disabled={updating}
                style={{ flex: 1, background: "var(--danger)", color: "#fff" }}
              >
                {updating ? (
                  <span
                    className="spinner"
                    style={{ width: 16, height: 16, borderWidth: 2 }}
                  />
                ) : (
                  "Confirm Failed"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {
          "@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} @keyframes fadeDown{from{opacity:0;transform:translate(-50%,-10px)}to{opacity:1;transform:translate(-50%,0)}} @keyframes slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}"
        }
      </style>
    </div>
  );
}
