import { useEffect, useState } from "react";
import api from "../lib/axios";

const EMPTY_FORM = { name: "", email: "", phone: "", password: "" };

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDriver, setEditDriver] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const load = () => {
    setLoading(true);
    api
      .get("/admin/drivers")
      .then((r) => setDrivers(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const openCreate = () => {
    setEditDriver(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  };

  const openEdit = (driver) => {
    setEditDriver(driver);
    setForm({
      name: driver.name,
      email: driver.email,
      phone: driver.phone || "",
      password: "",
    });
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editDriver) {
        // PUT /api/admin/drivers/:id — update
        const payload = {
          name: form.name,
          email: form.email,
          phone: form.phone,
        };
        if (form.password) payload.password = form.password;
        await api.patch(`/admin/drivers/${editDriver.id}`, payload);
        showToast("Driver updated successfully");
      } else {
        // POST /api/admin/drivers — create new driver
        await api.post("/admin/drivers", { ...form, role: "driver" });
        showToast("Driver created successfully");
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (driver) => {
    try {
      await api.put(`/admin/drivers/${driver.id}`, {
        is_active: !driver.is_active,
      });
      showToast(`Driver ${driver.is_active ? "deactivated" : "activated"}`);
      load();
    } catch {
      showToast("Failed to update driver");
    }
  };

  const handleDelete = async (driver) => {
    if (
      !confirm(
        `Permanently delete ${driver.name}? Their delivery history will be kept.`,
      )
    )
      return;
    try {
      await api.delete(`/admin/drivers/${driver.id}`);
      showToast("Driver removed");
      load();
    } catch {
      showToast("Could not delete driver");
    }
  };

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 24,
            zIndex: 999,
            background: "var(--navy)",
            color: "#fff",
            padding: "10px 18px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            animation: "slideIn .25s ease",
          }}
        >
          {toast}
        </div>
      )}

      <div className="topbar">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Drivers</h1>
          <p>Manage driver accounts and track performance</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <PlusIcon /> Add Driver
        </button>
      </div>

      {loading ? (
        <div className="loader">
          <div className="spinner" />
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Driver</th>
                <th>Phone</th>
                <th>Deliveries</th>
                <th>Success Rate</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <TruckIcon />
                      <p>
                        No drivers yet. Add your first driver to get started.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {drivers.map((d, i) => (
                <tr
                  key={d.id}
                  style={{ animation: `fadeIn .25s ease ${i * 0.04}s both` }}
                >
                  <td>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        className="avatar"
                        style={{
                          width: 32,
                          height: 32,
                          fontSize: 12,
                          flexShrink: 0,
                        }}
                      >
                        {d.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--navy)" }}>
                          {d.name}
                        </div>
                        <div
                          style={{ fontSize: 11, color: "var(--text-muted)" }}
                        >
                          {d.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "var(--text-sec)" }}>{d.phone || "—"}</td>
                  <td>{d.delivery_count ?? 0}</td>
                  <td style={{ color: "var(--success)", fontWeight: 600 }}>
                    {d.success_rate ?? 0}%
                  </td>
                  <td>
                    <span
                      className={`pill ${d.is_active ? "pill-active" : "pill-inactive"}`}
                    >
                      {d.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => openEdit(d)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => toggleActive(d)}
                      >
                        {d.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(d)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div
          className="modal-overlay"
          style={{ animation: "fadeIn .2s ease" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="modal" style={{ animation: "slideUp .25s ease" }}>
            <div className="modal-header">
              <h3>{editDriver ? "Edit Driver" : "Add New Driver"}</h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Jari Korhonen"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="jari@mariologistics.fi"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  className="form-input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+358 40 123 4567"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  {editDriver
                    ? "New Password (leave blank to keep current)"
                    : "Password"}
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required={!editDriver}
                  placeholder="••••••••"
                />
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: "flex-end",
                  marginTop: 20,
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <span
                      className="spinner"
                      style={{ width: 14, height: 14, borderWidth: 2 }}
                    />
                  ) : editDriver ? (
                    "Save Changes"
                  ) : (
                    "Create Driver"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
      `}</style>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function TruckIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="1" y="3" width="15" height="13" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}
