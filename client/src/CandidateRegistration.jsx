import { useState } from "react";
import FusionNavbar from "./FusionNavbar";

const countries = ["United Kingdom", "United States"];

const countryCodes = {
  "United Kingdom": "+44",
  "United States": "+1",
};

function inferCountryFromPostcode(value) {
  const postcode = value.trim().toUpperCase().replace(/\s+/g, " ");

  // US ZIP or ZIP+4. This suggests the country; it does not verify an address.
  if (/^\d{5}(?:-\d{4})?$/.test(postcode)) return "United States";

  // Common UK postcode formats, including GIR 0AA.
  if (
    /^(?:GIR\s?0AA|(?:[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}))$/.test(postcode)
  ) {
    return "United Kingdom";
  }

  return "";
}

function isValidPostcode(value, country) {
  const postcode = value.trim().toUpperCase().replace(/\s+/g, " ");

  if (country === "United States") {
    return /^\d{5}(?:-\d{4})?$/.test(postcode);
  }

  if (country === "United Kingdom") {
    return /^(?:GIR\s?0AA|(?:[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}))$/.test(postcode);
  }

  return false;
}

const initialForm = {
  name: "",
  email: "",
  phone: "",
  country: "",
  postcode: "",
  location: "",
  currentTitle: "",
  industry: "",
  experienceYears: "",
  skills: "",
  preferredRoles: "",
  preferredLocations: "",
  workPreference: "",
  employmentType: "",
  recruitmentConsent: false,
};

function CandidateRegistration({
  onBack,
  onHome,
  onJobs,
  onCandidates,
  onEmployers,
  onServices,
  onIndustries,
  onAbout,
  onContact,
  onJoinTalent,
}) {
  const [form, setForm] = useState({ ...initialForm });
  const [resume, setResume] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => {
      const next = {
        ...current,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "postcode") {
        const inferredCountry = inferCountryFromPostcode(value);
        if (inferredCountry) next.country = inferredCountry;
      }

      return next;
    });
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!countries.includes(form.country)) {
      setError("Please select United States or United Kingdom.");
      return;
    }

    if (!isValidPostcode(form.postcode, form.country)) {
      setError(
        form.country === "United Kingdom"
          ? "Enter a valid UK postcode, for example SW1A 1AA."
          : "Enter a valid US ZIP code, for example 10001 or 10001-1234."
      );
      return;
    }

    if (!resume) {
      setError("Please upload your resume/CV.");
      return;
    }

    if (resume.size > 5 * 1024 * 1024 || !/\.(pdf|docx)$/i.test(resume.name)) {
      setError("Please upload a PDF or DOCX file up to 5 MB.");
      return;
    }

    if (!form.recruitmentConsent) {
      setError("Please provide recruitment consent.");
      return;
    }

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.country
    ) {
      setError("Please complete your name, email, country and phone number.");
      return;
    }

    const formData = new FormData();
    const submittedForm = {
      ...form,
      currentTitle: "",
      industry: "",
      experienceYears: "",
      skills: "",
      preferredRoles: "",
      preferredLocations: "",
      workPreference: "",
      employmentType: "",
    };

    Object.entries(submittedForm).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    const rawPhone = form.phone.trim();
    const fullPhone = rawPhone.startsWith("+")
      ? `+${rawPhone.slice(1).replace(/\D/g, "")}`
      : `${countryCodes[form.country]}${rawPhone.replace(/\D/g, "").replace(/^0+/, "")}`;
    formData.set("phone", fullPhone);
    formData.set("country", form.country);
    formData.set("postcode", form.postcode.trim().toUpperCase());
    formData.append("resume", resume);

    try {
      setSubmitting(true);
      const response = await fetch("/api/candidates/register", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Candidate registration failed.");
      }

      setMessage("Thank you! Your profile and CV have been submitted successfully.");
      setForm({ ...initialForm });
      setResume(null);
      const fileInput = document.getElementById("candidate-resume");
      if (fileInput) fileInput.value = "";
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="registration-page">
      <FusionNavbar
        onHome={onHome}
        onJobs={onJobs}
        onCandidates={onCandidates}
        onEmployers={onEmployers}
        onServices={onServices}
        onIndustries={onIndustries}
        onAbout={onAbout}
        onContact={onContact}
        onJoinTalent={onJoinTalent}
      />

      <div className="registration-container">
        <div className="registration-heading">
          <span className="eyebrow">FUSION TALENT NETWORK</span>
          <h1>
            Your Next Opportunity
            <span className="registration-heading-accent">
              May Be Just Around the Corner
            </span>
          </h1>
          <p>
            Upload your CV to join the Fusion Talent Network. We'll keep your
            profile in mind for suitable future opportunities and contact you
            when a relevant role becomes available.
          </p>
          <div className="talent-benefits">
            <div className="talent-benefit">
              <span className="talent-benefit-icon">▣</span>
              <span>
                <strong>Future opportunities</strong>
                <small>Be considered for suitable roles</small>
              </span>
            </div>
            <div className="talent-benefit">
              <span className="talent-benefit-icon">✦</span>
              <span>
                <strong>Relevant opportunities</strong>
                <small>Based on your skills and experience</small>
              </span>
            </div>
            <div className="talent-benefit">
              <span className="talent-benefit-icon">✉</span>
              <span>
                <strong>Stay connected</strong>
                <small>Hear from our recruitment team</small>
              </span>
            </div>
          </div>
        </div>

        <form className="candidate-registration-form" onSubmit={handleSubmit}>
          <div className="registration-section">
            <div className="section-title">
              <span className="section-number">01</span>
              <div>
                <h2>Your Contact Details</h2>
                <p>Tell us how recruiters can reach you.</p>
              </div>
            </div>

            <div className="form-grid">
              <label>
                Full Name <span className="required">*</span>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  autoComplete="name"
                  required
                />
              </label>

              <label>
                Email Address <span className="required">*</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </label>

              <label>
                Country <span className="required">*</span>
                <select
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  autoComplete="country-name"
                  required
                >
                  <option value="">Select your country</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Phone Number <span className="required">*</span>
                <div className="phone-input">
                  <span className="country-code">
                    {form.country ? countryCodes[form.country] : "+"}
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Phone number"
                    autoComplete="tel-national"
                    required
                  />
                </div>
              </label>

              <label>
                ZIP Code / Postcode <span className="required">*</span>
                <input
                  type="text"
                  name="postcode"
                  value={form.postcode}
                  onChange={handleChange}
                  placeholder={
                    form.country === "United Kingdom" ? "e.g. SW1A 1AA" : "e.g. 10001"
                  }
                  autoComplete="postal-code"
                  required
                />
              </label>

              <label className="full-width-field">
                City / State / Region (Optional)
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. London, England"
                  autoComplete="address-level2"
                />
              </label>
            </div>
          </div>

          <div className="registration-section">
            <h2>Upload Your CV</h2>
            <p>
              Attach your latest resume so our recruitment team can review your
              experience.
            </p>
            <label className="resume-upload">
              Resume / CV <span className="required">*</span>
              <input
                id="candidate-resume"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => setResume(event.target.files?.[0] || null)}
                required
              />
              <small>PDF or DOCX only. Maximum file size: 5 MB.</small>
              {resume && <small>Selected file: {resume.name}</small>}
            </label>
          </div>

          <div className="consent-box">
            <label>
              <input
                type="checkbox"
                name="recruitmentConsent"
                checked={form.recruitmentConsent}
                onChange={handleChange}
                required
              />
              <span>
                I consent to my information and CV being stored and processed for
                recruitment purposes and to being contacted about relevant
                employment opportunities. I understand that I can request access
                to or deletion of my information as described in the Privacy
                Notice.
              </span>
            </label>
          </div>

          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          {message && (
            <div className="registration-success" role="status">
              ✓ {message}
            </div>
          )}

          <button
            type="submit"
            className="registration-submit"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit CV"}
          </button>
          <p className="registration-note">
            Quick registration. No need to complete lengthy professional or
            job-preference forms.
          </p>
        </form>
      </div>
    </div>
  );
}

export default CandidateRegistration;
