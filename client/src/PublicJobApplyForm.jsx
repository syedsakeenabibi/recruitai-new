
import { useState } from "react";

const COUNTRIES = [
  { name: "United States", flag: "🇺🇸", code: "+1" },
  { name: "India", flag: "🇮🇳", code: "+91" },
  { name: "United Kingdom", flag: "🇬🇧", code: "+44" },
  { name: "Canada", flag: "🇨🇦", code: "+1" },
  { name: "Australia", flag: "🇦🇺", code: "+61" },
  { name: "United Arab Emirates", flag: "🇦🇪", code: "+971" },
  { name: "Saudi Arabia", flag: "🇸🇦", code: "+966" },
  { name: "Singapore", flag: "🇸🇬", code: "+65" },
  { name: "Germany", flag: "🇩🇪", code: "+49" },
  { name: "France", flag: "🇫🇷", code: "+33" },
  { name: "Ireland", flag: "🇮🇪", code: "+353" },
  { name: "Netherlands", flag: "🇳🇱", code: "+31" },
  { name: "New Zealand", flag: "🇳🇿", code: "+64" },
  { name: "South Africa", flag: "🇿🇦", code: "+27" },
  { name: "Pakistan", flag: "🇵🇰", code: "+92" },
  { name: "Bangladesh", flag: "🇧🇩", code: "+880" },
  { name: "Philippines", flag: "🇵🇭", code: "+63" },
  { name: "Nigeria", flag: "🇳🇬", code: "+234" },
  { name: "China", flag: "🇨🇳", code: "+86" },
  { name: "Japan", flag: "🇯🇵", code: "+81" },
  { name: "Brazil", flag: "🇧🇷", code: "+55" },
  { name: "Mexico", flag: "🇲🇽", code: "+52" },
  { name: "Spain", flag: "🇪🇸", code: "+34" },
  { name: "Italy", flag: "🇮🇹", code: "+39" },
  { name: "Switzerland", flag: "🇨🇭", code: "+41" },
  { name: "Malaysia", flag: "🇲🇾", code: "+60" },
  { name: "Indonesia", flag: "🇮🇩", code: "+62" },
  { name: "Sri Lanka", flag: "🇱🇰", code: "+94" },
  { name: "Nepal", flag: "🇳🇵", code: "+977" },
  { name: "Kenya", flag: "🇰🇪", code: "+254" },
];

function normalizePhone(phone, selectedCountry) {
  const input = phone.trim();

  if (!input) return "";

  // An explicitly international number takes precedence over the dropdown.
  if (input.startsWith("+")) {
    const digits = input.slice(1).replace(/\D/g, "");
    return digits ? `+${digits}` : "";
  }

  const digits = input.replace(/\D/g, "");
  if (!digits) return "";

  const dialCode = selectedCountry?.code || "";
  const dialDigits = dialCode.replace(/\D/g, "");

  // Avoid duplicating the selected code when it was pasted without "+".
  if (
    dialDigits &&
    digits.startsWith(dialDigits) &&
    digits.length > dialDigits.length + 6
  ) {
    return `+${digits}`;
  }

  // A national-format number is interpreted using the selected country.
  return dialCode ? `${dialCode}${digits}` : digits;
}

export default function PublicJobApplyForm({ job }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "United States",
    location: "",
    experience: "",
    message: "",
  });

  const [resume, setResume] = useState(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const selectedCountry =
    COUNTRIES.find((country) => country.name === form.country) ||
    COUNTRIES[0];

  function updateField(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function submit(event) {
    event.preventDefault();

    if (!resume) {
      setNotice("Please upload your resume.");
      return;
    }

    if (!consent) {
      setNotice("Please agree to the privacy notice before submitting.");
      return;
    }

    if (
      resume.size > 5 * 1024 * 1024 ||
      !/\.(pdf|docx)$/i.test(resume.name)
    ) {
      setNotice("Only PDF or DOCX files up to 5 MB are allowed.");
      return;
    }

    setBusy(true);
    setNotice("");

    try {
      const body = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        body.append(key, value);
      });

      // Submit a normalized international phone number.
      body.set("phone", normalizePhone(form.phone, selectedCountry));
      body.set("country", selectedCountry.name);

      body.append("resume", resume);
      body.append("consent", "true");

      const response = await fetch(
        `/api/public-jobs/${encodeURIComponent(job.id)}/apply`,
        { method: "POST", body }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || "Application failed. Please try again."
        );
      }

      setSubmitted(true);
      setNotice(
        "Application submitted successfully. Our recruitment team will review your resume."
      );
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <div className="application-success" role="status">
        <span aria-hidden="true">✓</span>
        <h2>Application submitted!</h2>
        <p>{notice}</p>
      </div>
    );
  }

  return (
    <form className="quick-apply-form" onSubmit={submit}>
      <header className="quick-apply-header">
        <div className="quick-apply-icon" aria-hidden="true">
          ▤
        </div>
        <div>
          <h2>Quick Apply</h2>
          <p>
            {job.title}
            {job.location ? ` · ${job.location}` : ""}
            {job.employmentType ? ` · ${job.employmentType}` : ""}
            {job.workplaceType ? ` · ${job.workplaceType}` : ""}
          </p>
        </div>
      </header>

      <label className="quick-field">
        <span>Full name <b>*</b></span>
        <input
          name="name"
          type="text"
          placeholder="Your full name"
          autoComplete="name"
          value={form.name}
          onChange={updateField}
          required
        />
      </label>

      <label className="quick-field">
        <span>Email address <b>*</b></span>
        <input
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={form.email}
          onChange={updateField}
          required
        />
      </label>

      <label className="quick-field">
        <span>Country / Region <b>*</b></span>
        <select
          name="country"
          value={form.country}
          onChange={updateField}
          autoComplete="country-name"
          required
        >
          {COUNTRIES.map((country) => (
            <option key={country.name} value={country.name}>
              {country.flag} {country.name} ({country.code})
            </option>
          ))}
        </select>
      </label>

      <label className="quick-field">
        <span>
          Phone number <small>(optional)</small>
        </span>
        <div className="phone-input-row">
          <span className="phone-dial-code" aria-label="Selected dialing code">
            {selectedCountry.code}
          </span>
          <input
            name="phone"
            type="tel"
            placeholder="Enter phone number"
            autoComplete="tel-national"
            value={form.phone}
            onChange={updateField}
          />
        </div>
        <small>
          Include + and the country code when pasting an international number.
        </small>
      </label>

      <label className="quick-field">
        <span>Upload your resume <b>*</b></span>
        <div className="resume-upload-box">
          <div className="resume-upload-icon" aria-hidden="true">
            ⇧
          </div>
          <strong>
            {resume ? resume.name : "Choose a file or drag and drop"}
          </strong>
          <p>PDF or DOCX · Max 5 MB</p>
          <input
            id="resume-file"
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            required
            onChange={(event) => {
              setResume(event.target.files?.[0] || null);
              setNotice("");
            }}
          />
        </div>
      </label>

      <label className="quick-consent">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          required
        />
        <span>
          I agree to share my application information with Fusion Staffing
          Solutions and have read the{" "}
          <a href="/privacy" target="_blank" rel="noreferrer">
            privacy notice
          </a>
          .
        </span>
      </label>

      {notice && (
        <p className="quick-form-notice" role="alert">
          {notice}
        </p>
      )}

      <button
        className="quick-submit-button"
        type="submit"
        disabled={busy}
      >
        {busy ? "Submitting..." : "Submit Application"}
        {!busy && <span aria-hidden="true">→</span>}
      </button>
    </form>
  );
}
