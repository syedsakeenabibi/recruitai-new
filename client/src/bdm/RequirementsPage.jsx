import { useEffect, useState } from "react";
import { recruitmentApi } from "../recruitment/recruitmentApi";

export default function RequirementsPage() {
  const [requirements, setRequirements] = useState([]);
  const [leads, setLeads] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [assignments, setAssignments] = useState({});

  async function load() {
    const [requirementsResult, leadsResult] = await Promise.all([
      recruitmentApi.listRequirements(),
      recruitmentApi.listLeads(),
    ]);
    setError("");
    setRequirements(requirementsResult.requirements || []);
    setLeads(leadsResult.leads || []);
  }

  useEffect(() => {
    load().catch((loadError) => setError(loadError.message));
  }, []);

  async function createRequirement(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setError("");
    const form = new FormData(formElement);
    const payload = Object.fromEntries(form.entries());
    payload.skills = payload.skills.split(",").map((skill) => skill.trim()).filter(Boolean);
    for (const field of ["experienceMin", "experienceMax", "salaryMin", "salaryMax", "openings", "priority"]) {
      payload[field] = payload[field] === "" ? null : Number(payload[field]);
    }
    if (!payload.companyLeadId) payload.companyLeadId = null;
    for (const field of ["companyName", "jobDescription", "education", "country", "location", "employmentType", "currency", "workMode", "noticePeriodPreference", "bdmOwner", "assignedRecruiter"]) {
      if (!payload[field]) payload[field] = null;
    }
    try {
      await recruitmentApi.createRequirement(payload);
      formElement.reset();
      setFormOpen(false);
      await load();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmRequirement(requirement) {
    setError("");
    try {
      await recruitmentApi.updateRequirement(requirement.id, { status: "CONFIRMED" });
      await load();
    } catch (confirmError) {
      setError(confirmError.message);
    }
  }

  async function assignRequirement(requirement) {
    const assignedRecruiter = String(assignments[requirement.id] || "").trim();
    if (!assignedRecruiter) {
      setError("Enter the assigned recruiter's name or account identifier.");
      return;
    }
    setError("");
    try {
      await recruitmentApi.updateRequirement(requirement.id, { assignedRecruiter, status: "ASSIGNED" });
      await load();
    } catch (assignError) {
      setError(assignError.message);
    }
  }

  return (
    <section className="rw-panel">
      <div className="rw-heading"><div><h2>Client Requirements</h2><p>Draft requirements remain out of recruiter workflow until confirmed.</p></div>
        <button className="rw-primary" onClick={() => { setError(""); setFormOpen(!formOpen); }}>{formOpen ? "Close form" : "Add requirement"}</button>
      </div>
      {error && <p className="rw-error" role="alert">{error}</p>}
      {formOpen && <form className="rw-form" onSubmit={createRequirement}>
        <label>Company lead<select name="companyLeadId" defaultValue=""><option value="">No linked lead</option>{leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.companyName || "Unnamed company"}</option>)}</select></label>
        <label>Company name<input name="companyName" /></label>
        <label>Job title<input name="jobTitle" required /></label>
        <label>Job description<textarea name="jobDescription" rows="3" /></label>
        <label>Education preference<input name="education" /></label>
        <label>Required skills (comma separated)<input name="skills" /></label>
        <label>Country<input name="country" /></label>
        <label>Location<input name="location" /></label>
        <label>Employment type<input name="employmentType" /></label>
        <label>Experience minimum<input name="experienceMin" type="number" min="0" step="0.5" /></label>
        <label>Experience maximum<input name="experienceMax" type="number" min="0" step="0.5" /></label>
        <label>Salary minimum<input name="salaryMin" type="number" min="0" /></label>
        <label>Salary maximum<input name="salaryMax" type="number" min="0" /></label>
        <label>Currency<input name="currency" maxLength="8" /></label>
        <label>Openings<input name="openings" type="number" min="1" defaultValue="1" /></label>
        <label>Work mode<input name="workMode" /></label>
        <label>Notice period preference<input name="noticePeriodPreference" /></label>
        <label>BDM owner<input name="bdmOwner" /></label>
        <label>Assigned recruiter<input name="assignedRecruiter" /></label>
        <label>Priority<input name="priority" type="number" min="0" step="1" defaultValue="0" /></label>
        <button className="rw-primary" disabled={busy}>{busy ? "Saving..." : "Save as draft"}</button>
      </form>}
      {!requirements.length ? <div className="rw-empty">No client requirements recorded.</div> : (
        <div className="rw-record-list">
          {requirements.map((item) => <article className="rw-record" key={item.id}>
            <div className="rw-record-title"><div><h3>{item.jobTitle}</h3><p>{item.companyName || "Company not specified"}{item.location ? ` · ${item.location}` : ""}</p></div><span className="rw-badge">{item.status}</span></div>
            <div className="rw-meta"><span>{item.country || "Country not specified"}</span><span>{item.openings} opening(s)</span><span>{(item.skills || []).join(", ") || "No skills specified"}</span></div>
            {item.status === "DRAFT" && <button className="rw-secondary" onClick={() => confirmRequirement(item)}>Confirm requirement</button>}
            {item.status === "CONFIRMED" && <div className="rw-inline-form"><label>Assign recruiter<input value={assignments[item.id] ?? item.assignedRecruiter ?? ""} onChange={(event) => setAssignments((current) => ({ ...current, [item.id]: event.target.value }))} /></label><button className="rw-secondary" onClick={() => assignRequirement(item)}>Assign job</button></div>}
          </article>)}
        </div>
      )}
    </section>
  );
}
