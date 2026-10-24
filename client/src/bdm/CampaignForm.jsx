import { useState } from "react";

const COUNTRIES = ["US", "UK"];
const STATUSES = ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED"];
const ARRAY_FIELDS = [
  ["roles", "Roles"],
  ["industries", "Industries"],
  ["locations", "Locations"],
  ["keywords", "Keywords"],
  ["employmentTypes", "Employment types"],
];

function listToText(value) {
  return Array.isArray(value) ? value.join(", ") : "";
}

export default function CampaignForm({
  campaign,
  onSave,
  onCancel,
  readOnly = false,
}) {
  const [form, setForm] = useState({
    name: campaign?.name || "",
    country: campaign?.country || "US",
    roles: listToText(campaign?.roles),
    industries: listToText(campaign?.industries),
    locations: listToText(campaign?.locations),
    keywords: listToText(campaign?.keywords),
    employmentTypes: listToText(campaign?.employmentTypes),
    experienceMin: campaign?.experienceMin ?? "",
    experienceMax: campaign?.experienceMax ?? "",
    priority: campaign?.priority ?? 0,
    status: campaign?.status || "DRAFT",
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

    const payload = {
      ...form,
      roles: splitList(form.roles),
      industries: splitList(form.industries),
      locations: splitList(form.locations),
      keywords: splitList(form.keywords),
      employmentTypes: splitList(form.employmentTypes),
      experienceMin:
        form.experienceMin === "" ? null : Number(form.experienceMin),
      experienceMax:
        form.experienceMax === "" ? null : Number(form.experienceMax),
      priority: Number(form.priority),
    };

    try {
      await onSave(payload);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="bdm-form" onSubmit={submit}>
      <div className="bdm-form-heading">
        <h2>{readOnly ? "Campaign details" : campaign ? "Edit campaign" : "Create campaign"}</h2>
        {campaign?.id && <span className="bdm-muted">ID: {campaign.id}</span>}
      </div>

      <label className="bdm-field">
        Campaign name
        <input
          name="name"
          value={form.name}
          onChange={updateField}
          maxLength={160}
          required
          disabled={readOnly}
        />
      </label>

      <div className="bdm-form-grid">
        <label className="bdm-field">
          Country
          <select
            name="country"
            value={form.country}
            onChange={updateField}
            disabled={readOnly}
          >
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </label>
        <label className="bdm-field">
          Status
          <select
            name="status"
            value={form.status}
            onChange={updateField}
            disabled={readOnly}
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="bdm-form-grid">
        <label className="bdm-field">
          Minimum experience (years)
          <input
            type="number"
            name="experienceMin"
            min="0"
            step="0.5"
            value={form.experienceMin}
            onChange={updateField}
            disabled={readOnly}
          />
        </label>
        <label className="bdm-field">
          Maximum experience (years)
          <input
            type="number"
            name="experienceMax"
            min="0"
            step="0.5"
            value={form.experienceMax}
            onChange={updateField}
            disabled={readOnly}
          />
        </label>
        <label className="bdm-field">
          Priority
          <input
            type="number"
            name="priority"
            min="0"
            step="1"
            value={form.priority}
            onChange={updateField}
            disabled={readOnly}
          />
        </label>
      </div>

      {ARRAY_FIELDS.map(([name, label]) => (
        <label className="bdm-field" key={name}>
          {label}
          <textarea
            name={name}
            value={form[name]}
            onChange={updateField}
            placeholder="Comma-separated values"
            rows="2"
            disabled={readOnly}
          />
        </label>
      ))}

      {error && <p className="bdm-error" role="alert">{error}</p>}
      <div className="bdm-form-actions">
        <button
          type="button"
          className="bdm-button bdm-button-secondary"
          onClick={onCancel}
        >
          {readOnly ? "Close" : "Cancel"}
        </button>
        {!readOnly && (
          <button className="bdm-button" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save campaign"}
          </button>
        )}
      </div>
    </form>
  );
}

function splitList(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}
