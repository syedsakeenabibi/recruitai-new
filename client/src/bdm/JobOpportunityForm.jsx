import { useState } from "react";

const COUNTRIES = ["US", "UK"];
const STATUSES = ["NEW", "REVIEWED", "LEAD_CREATED", "IGNORED"];

function listToText(value) {
  return Array.isArray(value) ? value.join(", ") : "";
}

function toLocalDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function JobOpportunityForm({
  opportunity,
  campaigns,
  initialCampaignId = "",
  onSave,
  onCancel,
  readOnly = false,
}) {
  const [form, setForm] = useState({
    campaignId: opportunity?.campaignId || initialCampaignId || "",
    externalId: opportunity?.externalId || "",
    sourceUrl: opportunity?.sourceUrl || "",
    companyName: opportunity?.companyName || "",
    companyWebsite: opportunity?.companyWebsite || "",
    jobTitle: opportunity?.jobTitle || "",
    country: opportunity?.country || "US",
    location: opportunity?.location || "",
    description: opportunity?.description || "",
    skills: listToText(opportunity?.skills),
    employmentType: opportunity?.employmentType || "",
    postedAt: toLocalDateTime(opportunity?.postedAt),
    discoveredAt: toLocalDateTime(opportunity?.discoveredAt),
    status: opportunity?.status || "NEW",
    rawData: opportunity?.rawData ? JSON.stringify(opportunity.rawData, null, 2) : "{}",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      let rawData;
      try {
        rawData = JSON.parse(form.rawData || "{}");
      } catch {
        throw new Error("Raw data must contain valid JSON.");
      }
      if (!rawData || Array.isArray(rawData) || typeof rawData !== "object") {
        throw new Error("Raw data must be a JSON object.");
      }

      await onSave({
        campaignId: form.campaignId || null,
        source: "MANUAL",
        externalId: form.externalId.trim() || null,
        sourceUrl: form.sourceUrl.trim() || null,
        companyName: form.companyName.trim() || null,
        companyWebsite: form.companyWebsite.trim() || null,
        jobTitle: form.jobTitle.trim(),
        country: form.country,
        location: form.location.trim() || null,
        description: form.description.trim() || null,
        skills: form.skills.split(",").map((item) => item.trim()).filter(Boolean),
        employmentType: form.employmentType.trim() || null,
        postedAt: form.postedAt ? new Date(form.postedAt).toISOString() : null,
        discoveredAt: form.discoveredAt ? new Date(form.discoveredAt).toISOString() : undefined,
        status: form.status,
        rawData,
      });
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="bdm-form" onSubmit={submit}>
      <div className="bdm-form-heading">
        <h2>{readOnly ? "Opportunity details" : opportunity ? "Edit opportunity" : "Add opportunity"}</h2>
        <span className="bdm-muted">Source: MANUAL</span>
      </div>

      <label className="bdm-field">
        Job title
        <input name="jobTitle" value={form.jobTitle} onChange={updateField} maxLength={200} required disabled={readOnly} />
      </label>

      <div className="bdm-form-grid">
        <label className="bdm-field">
          Campaign
          <select name="campaignId" value={form.campaignId} onChange={updateField} disabled={readOnly}>
            <option value="">No campaign</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
            ))}
          </select>
        </label>
        <label className="bdm-field">
          Country
          <select name="country" value={form.country} onChange={updateField} disabled={readOnly}>
            {COUNTRIES.map((country) => <option key={country} value={country}>{country}</option>)}
          </select>
        </label>
        <label className="bdm-field">
          Status
          <select name="status" value={form.status} onChange={updateField} disabled={readOnly}>
            {STATUSES.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
          </select>
        </label>
        <label className="bdm-field">
          Employment type
          <input name="employmentType" value={form.employmentType} onChange={updateField} maxLength={80} disabled={readOnly} />
        </label>
        <label className="bdm-field">
          Company
          <input name="companyName" value={form.companyName} onChange={updateField} maxLength={200} disabled={readOnly} />
        </label>
        <label className="bdm-field">
          Company website
          <input type="url" name="companyWebsite" value={form.companyWebsite} onChange={updateField} maxLength={2048} disabled={readOnly} />
        </label>
        <label className="bdm-field">
          Location
          <input name="location" value={form.location} onChange={updateField} maxLength={200} disabled={readOnly} />
        </label>
        <label className="bdm-field">
          External ID
          <input name="externalId" value={form.externalId} onChange={updateField} maxLength={200} disabled={readOnly} />
        </label>
        <label className="bdm-field">
          Source URL
          <input type="url" name="sourceUrl" value={form.sourceUrl} onChange={updateField} maxLength={2048} disabled={readOnly} />
        </label>
        <label className="bdm-field">
          Posted at
          <input type="datetime-local" name="postedAt" value={form.postedAt} onChange={updateField} disabled={readOnly} />
        </label>
        <label className="bdm-field">
          Discovered at
          <input type="datetime-local" name="discoveredAt" value={form.discoveredAt} onChange={updateField} disabled={readOnly} />
        </label>
      </div>

      <label className="bdm-field">
        Skills
        <textarea name="skills" value={form.skills} onChange={updateField} placeholder="Comma-separated skills" rows="2" disabled={readOnly} />
      </label>
      <label className="bdm-field">
        Description
        <textarea name="description" value={form.description} onChange={updateField} rows="5" disabled={readOnly} />
      </label>
      <label className="bdm-field">
        Raw data (JSON object)
        <textarea className="bdm-code-input" name="rawData" value={form.rawData} onChange={updateField} rows="5" spellCheck="false" disabled={readOnly} />
      </label>

      {error && <p className="bdm-error" role="alert">{error}</p>}
      <div className="bdm-form-actions">
        <button type="button" className="bdm-button bdm-button-secondary" onClick={onCancel}>
          {readOnly ? "Close" : "Cancel"}
        </button>
        {!readOnly && (
          <button className="bdm-button" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save opportunity"}
          </button>
        )}
      </div>
    </form>
  );
}
