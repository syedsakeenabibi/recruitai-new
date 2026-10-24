import { useCallback, useEffect, useState } from "react";

const API = "/api/public-jobs/applications";

export default function PublicJobApplicationsAdmin() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/manage`, { credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load applications.");
      setApplications(data.applications || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id, status) {
    setBusyId(id);
    try {
      const response = await fetch(`${API}/${encodeURIComponent(id)}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Status update failed.");
      setApplications(previous => previous.map(item =>
        item.id === id ? { ...item, status } : item
      ));
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function downloadCV(application) {
    try {
      const response = await fetch(
        `${API}/${encodeURIComponent(application.id)}/resume`,
        { credentials: "include" }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Unable to download CV.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = application.resumeFileName || "candidate-cv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  const filtered = applications.filter(item =>
    [item.name, item.email, item.jobTitle, item.location]
      .some(value => String(value || "").toLowerCase().includes(search.toLowerCase()))
  );

  const field = {
    padding: "10px 12px", border: "1px solid #cbd5e1",
    borderRadius: 8, background: "#fff"
  };

  return (
    <section style={{ padding: 20, color: "#162b49" }}>
      <h2>Job Applications</h2>
      <p>Review candidates who applied through Fusion Staffing Solutions job postings.</p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <input
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="Search applicant, email or job..."
          style={{ ...field, flex: "1 1 260px" }}
        />
        <button type="button" onClick={load} style={field}>Refresh</button>
      </div>

      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
      {loading ? <p>Loading applications...</p> : (
        <div style={{ display: "grid", gap: 14 }}>
          {filtered.length === 0 && <p>No applications found.</p>}
          {filtered.map(item => (
            <article key={item.id} style={{
              border: "1px solid #dbe3ed", borderRadius: 12,
              background: "#fff", padding: 18
            }}>
              <h3 style={{ marginTop: 0 }}>{item.name}</h3>
              <p><strong>Applied for:</strong> {item.jobTitle}</p>
              <p><strong>Email:</strong> {item.email}</p>
              <p><strong>Phone:</strong> {item.phone}</p>
              <p><strong>Location:</strong> {item.location || "Not provided"}</p>
              <p><strong>Experience:</strong> {item.experience || "Not provided"}</p>
              {item.message && <p><strong>Message:</strong> {item.message}</p>}
              <p><strong>Applied:</strong> {new Date(item.createdAt).toLocaleString()}</p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button type="button" style={field} onClick={() => downloadCV(item)}>
                  Download CV
                </button>
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  Status
                  <select
                    style={field}
                    value={item.status}
                    disabled={busyId === item.id}
                    onChange={event => updateStatus(item.id, event.target.value)}
                  >
                    <option value="NEW">New</option>
                    <option value="REVIEWING">Reviewing</option>
                    <option value="SHORTLISTED">Shortlisted</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </label>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
