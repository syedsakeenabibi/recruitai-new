import { useState } from "react";
import { raApi } from "./raApi";

const emptyForm = {
  sourceUrl: "",
  companyName: "",
  companyWebsite: "",
  jobTitle: "",
  country: "",
  location: "",
  employmentType: "",
  description: "",
  skills: "",
  postedAt: "",
};

export default function ManualUrlImport({ campaignId, campaign, onImported, initialValues = {} }) {
  const [form, setForm] = useState({ ...emptyForm, ...initialValues });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        campaignId: campaignId || undefined,
        sourceUrl: form.sourceUrl,
        companyName: form.companyName || undefined,
        companyWebsite: form.companyWebsite || undefined,
        jobTitle: form.jobTitle,
        country: form.country || campaign?.country || undefined,
        location: form.location || undefined,
        employmentType: form.employmentType || undefined,
        description: form.description || undefined,
        skills: form.skills
          ? form.skills
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
        postedAt: form.postedAt || undefined,
      };

      const result = await raApi.importUrl(payload);
      setMessage(
        result.duplicate
          ? "An equivalent opportunity already exists and was reused."
          : "Manual URL import saved to JobOpportunity."
      );
      setForm(emptyForm);
      if (onImported) onImported();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="ra-panel ra-form" onSubmit={handleSubmit}>
      <div className="ra-form-header">
        <div>
          <h3>Manual public URL import</h3>
          <p>Import a verified public company career URL. This does not crawl restricted sites or fabricate missing details.</p>
        </div>
      </div>

      <div className="ra-form-grid">
        <label>
          <span>Public job URL</span>
          <input name="sourceUrl" type="url" value={form.sourceUrl} onChange={updateField} required />
        </label>

        <label>
          <span>Company name</span>
          <input name="companyName" value={form.companyName} onChange={updateField} />
        </label>

        <label>
          <span>Company website</span>
          <input name="companyWebsite" type="url" value={form.companyWebsite} onChange={updateField} />
        </label>

        <label>
          <span>Job title</span>
          <input name="jobTitle" value={form.jobTitle} onChange={updateField} required />
        </label>

        <label>
          <span>Country</span>
          <select name="country" value={form.country} onChange={updateField}>
            <option value="">Use campaign country / select country</option>
            <option value="US">US</option>
            <option value="UK">UK</option>
          </select>
        </label>

        <label>
          <span>Location</span>
          <input name="location" value={form.location} onChange={updateField} />
        </label>

        <label>
          <span>Employment type</span>
          <input name="employmentType" value={form.employmentType} onChange={updateField} />
        </label>

        <label className="ra-full-width">
          <span>Skills</span>
          <input name="skills" value={form.skills} onChange={updateField} placeholder="Comma-separated skills" />
        </label>

        <label className="ra-full-width">
          <span>Opportunity description</span>
          <textarea name="description" value={form.description} onChange={updateField} rows="5" />
        </label>

        <label>
          <span>Posted date</span>
          <input name="postedAt" type="date" value={form.postedAt} onChange={updateField} />
        </label>
      </div>

      <div className="ra-actions">
        <button type="submit" className="ra-button" disabled={saving}>
          {saving ? "Saving..." : "Import public URL"}
        </button>
      </div>

      {message && <p className="ra-success">{message}</p>}
      {error && <p className="ra-error">{error}</p>}
    </form>
  );
}
