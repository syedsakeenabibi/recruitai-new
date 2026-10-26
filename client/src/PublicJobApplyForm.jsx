
import { useState } from "react";

const COUNTRIES = [
  { name: "United States", flag: "🇺🇸", code: "+1" },
  { name: "United Kingdom", flag: "🇬🇧", code: "+44" },
];

function normalizePhone(phone, selectedCountry) {
  const input = phone.trim();

  if (!input) return "";

  if (input.startsWith("+")) {
    const digits = input.slice(1).replace(/\D/g, "");
    return digits ? `+${digits}` : "";
  }

  const digits = input.replace(/\D/g, "");
  if (!digits) return "";

  const dialDigits = selectedCountry.code.replace(/\D/g, "");

  if (
    digits.startsWith(dialDigits) &&
    digits.length > dialDigits.length + 6
  ) {
    return `+${digits}`;
  }

  return `${selectedCountry.code}${digits}`;
}

function normalizePostcode(value) {
  return value.trim().toUpperCase().replace(/\s+/g, " ");
}

function inferCountryFromPostcode(value) {
  const postcode = normalizePostcode(value);

  if (/^\d{5}(?:-\d{4})?$/.test(postcode)) {
    return "United States";
  }

  if (
    /^(?:GIR\s?0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/.test(
      postcode.replace(/\s/g, "")
    )
  ) {
    return "United Kingdom";
  }

  return "";
}

function isValidPostcode(value, country) {
  const postcode = normalizePostcode(value);

  if (country === "United States") {
    return /^\d{5}(?:-\d{4})?$/.test(postcode);
  }

  if (country === "United Kingdom") {
    return /^(?:GIR 0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/.test(
      postcode
    );
  }

  return false;
}

export default function PublicJobApplyForm({ job }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "United States",
    postcode: "",
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

    if (name === "postcode") {
      const postcode = normalizePostcode(value);
      const detectedCountry = inferCountryFromPostcode(postcode);

      setForm((previous) => ({
        ...previous,
        postcode,
        ...(detectedCountry ? { country: detectedCountry } : {}),
      }));

      setNotice("");
      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setNotice("");
  }

  async function submit(event) {
    event.preventDefault();

    if (!form.postcode.trim()) {
      setNotice("Please enter your ZIP code or UK postcode.");
      return;
    }

    if (!isValidPostcode(form.postcode, form.country)) {
      setNotice(
        form.country === "United States"
          ? "Enter a valid US ZIP code, such as 10001 or 10001-1234."
          : "Enter a valid UK postcode, such as SW1A 1AA."
      );
      return;
    }

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

      body.set("postcode", normalizePostcode(form.postcode));
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
        <span>ZIP code / Postcode <b>*</b></span>
        <input
          name="postcode"
          type="text"
          placeholder={
            form.country === "United States"
              ? "e.g. 10001"
              : "e.g. SW1A 1AA"
          }
          autoComplete="postal-code"
          value={form.postcode}
          onChange={updateField}
          required
        />
      </label>

      <label className="quick-field">
        <span>Phone number <small>(optional)</small></span>
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

