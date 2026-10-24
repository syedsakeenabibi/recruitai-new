import { useState } from "react";
import FusionNavbar from "./FusionNavbar";

const countries = [
  "Australia", "Austria", "Belgium", "Brazil", "Canada", "China",
  "Denmark", "Finland", "France", "Germany", "India", "Ireland",
  "Italy", "Japan", "Netherlands", "New Zealand", "Norway", "Poland",
  "Portugal", "Singapore", "South Africa", "South Korea", "Spain",
  "Sweden", "Switzerland", "United Arab Emirates", "United Kingdom",
  "United States"
];

const countryCodes = {
  Australia: "+61",
  Austria: "+43",
  Belgium: "+32",
  Brazil: "+55",
  Canada: "+1",
  China: "+86",
  Denmark: "+45",
  Finland: "+358",
  France: "+33",
  Germany: "+49",
  India: "+91",
  Ireland: "+353",
  Italy: "+39",
  Japan: "+81",
  Netherlands: "+31",
  "New Zealand": "+64",
  Norway: "+47",
  Poland: "+48",
  Portugal: "+351",
  Singapore: "+65",
  "South Africa": "+27",
  "South Korea": "+82",
  Spain: "+34",
  Sweden: "+46",
  Switzerland: "+41",
  "United Arab Emirates": "+971",
  "United Kingdom": "+44",
  "United States": "+1"
};

const initialForm = {
  name: "",
  email: "",
  phone: "",
  country: "",
  location: "",
  currentTitle: "",
  industry: "",
  experienceYears: "",
  skills: "",
  preferredRoles: "",
  preferredLocations: "",
  workPreference: "",
  employmentType: "",
  recruitmentConsent: false
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
  onJoinTalent
}) {
  const [form, setForm] = useState({ ...initialForm });
  const [resume, setResume] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm(current => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!resume) {
      setError("Please upload your resume/CV.");
      return;
    }

    if (
      resume.size > 5 * 1024 * 1024 ||
      !/\.(pdf|docx)$/i.test(resume.name)
    ) {
      setError("Please upload a PDF or DOCX file up to 5 MB.");
      return;
    }

    if (!form.recruitmentConsent) {
      setError("Please provide recruitment consent.");
      return;
    }

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.country) {
      setError("Please complete your name, email, country and phone number.");
      return;
    }

    const formData = new FormData();

    // Keep the existing backend field names and endpoint.
    // Removed professional and job-preference fields remain empty.
    const submittedForm = {
      ...form,
      currentTitle: "",
      industry: "",
      experienceYears: "",
      skills: "",
      preferredRoles: "",
      preferredLocations: "",
      workPreference: "",
      employmentType: ""
    };

    Object.entries(submittedForm).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    if (form.phone) {
      const fullPhone = `${countryCodes[form.country] || ""}${form.phone
        .replace(/\s+/g, "")
        .replace(/^0+/, "")}`;

      formData.set("phone", fullPhone);
    }

    formData.append("resume", resume);

    try {
      setSubmitting(true);

      const response = await fetch("/api/candidates/register", {
        method: "POST",
        body: formData
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Candidate registration failed.");
      }

      setMessage(
        "Thank you! Your profile and CV have been submitted successfully."
      );

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


        <form
          className="candidate-registration-form"
          onSubmit={handleSubmit}
        >
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
                  {countries.map(country => (
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
              Attach your latest resume so our recruitment team
              can review your experience.
            </p>

            <label className="resume-upload">
              Resume / CV <span className="required">*</span>
              <input
                id="candidate-resume"
                type="file"
                accept=".pdf,.docx"
                onChange={event =>
                  setResume(event.target.files?.[0] || null)
                }
                required
              />
              <small>PDF or DOCX only. Maximum file size: 5 MB.</small>
              {resume && (
                <small>Selected file: {resume.name}</small>
              )}
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
                I consent to my information and CV being stored
                and processed for recruitment purposes and to being
                contacted about relevant employment opportunities.
                I understand that I can request access to or deletion
                of my information as described in the Privacy Notice.
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
            Quick registration. No need to complete lengthy
            professional or job-preference forms.
          </p>
        </form>
      </div>
    </div>
  );
}

export default CandidateRegistration;