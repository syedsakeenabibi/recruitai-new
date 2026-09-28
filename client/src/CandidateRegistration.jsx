import { useState } from "react";
import FusionNavbar from "./FusionNavbar";
const countries = [
  "Australia",
  "Austria",
  "Belgium",
  "Brazil",
  "Canada",
  "China",
  "Denmark",
  "Finland",
  "France",
  "Germany",
  "India",
  "Ireland",
  "Italy",
  "Japan",
  "Netherlands",
  "New Zealand",
  "Norway",
  "Poland",
  "Portugal",
  "Singapore",
  "South Africa",
  "South Korea",
  "Spain",
  "Sweden",
  "Switzerland",
  "United Arab Emirates",
  "United Kingdom",
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
  "United States": "+1",
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
  const [form, setForm] = useState({
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
    recruitmentConsent: false,
  });

  const [resume, setResume] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!resume) {
      setError("Please upload your resume/CV.");
      return;
    }

    if (!form.recruitmentConsent) {
      setError("Please provide recruitment consent.");
      return;
    }

    const formData = new FormData();

    Object.entries(form).forEach(([key, value]) => {
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

      const response = await fetch(
        "https://recruitai-api-0s8o.onrender.com/api/candidates/register",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed.");
      }

      setMessage(
        "Thank you. Your profile has been added to our talent network."
      );

      setForm({
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
        recruitmentConsent: false,
      });

      setResume(null);

      const fileInput = document.getElementById("candidate-resume");
      if (fileInput) fileInput.value = "";
    } catch (err) {
      setError(err.message);
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

          <h1>Join Our US & UK Talent Network</h1>

          <p>
            Create your candidate profile and upload your resume to be
            considered for relevant current and future employment
            opportunities.
          </p>
        </div>

        <form
          className="candidate-registration-form"
          onSubmit={handleSubmit}
        >
          
          <div className="registration-section">
  <div className="section-title">
    <span className="section-number">01</span>
    
    <div>
      <h2>Personal Information</h2>
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
        placeholder="e.g. James Wilson"
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
        placeholder="james@example.com"
        required
      />
    </label>

    <label>
      Country 
      <select
        name="country"
        value={form.country}
        onChange={handleChange}
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
      {form.country ? countryCodes[form.country] : "—"}
    </span>

    <input
      type="tel"
      name="phone"
      value={form.phone}
      onChange={handleChange}
      placeholder="Phone number"
      required
    />
  </div>
</label>

    <label className="full-width-field">
      City / State / Region
      <input
        type="text"
        name="location"
        value={form.location}
        onChange={handleChange}
        placeholder="e.g. London, England"
      />
    </label>
  </div>
</div>
          <div className="registration-section">
            <h2>Professional Information</h2>

            <div className="form-grid">
              <label>
                Current Job Title 
                <input
                  type="text"
                  name="currentTitle"
                  value={form.currentTitle}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Industry
                <input
                  type="text"
                  name="industry"
                  value={form.industry}
                  onChange={handleChange}
                  placeholder="e.g. Technology, Healthcare, Finance"
                />
              </label>

              <label>
                Years of Experience
                <input
                  type="number"
                  name="experienceYears"
                  value={form.experienceYears}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                />
              </label>
            </div>

            <label className="full-field">
              Key Skills
              <input
                type="text"
                name="skills"
                value={form.skills}
                onChange={handleChange}
                placeholder="Python, React, AWS, Project Management..."
              />
              <small>Separate skills with commas.</small>
            </label>
          </div>

          <div className="registration-section">
            <h2>Job Preferences</h2>

            <div className="form-grid">
              <label>
                Preferred Roles
                <input
                  type="text"
                  name="preferredRoles"
                  value={form.preferredRoles}
                  onChange={handleChange}
                  placeholder="Software Engineer, Backend Developer"
                />
              </label>

              <label>
                Preferred Locations
                <input
                  type="text"
                  name="preferredLocations"
                  value={form.preferredLocations}
                  onChange={handleChange}
                  placeholder="London, New York, Remote"
                />
              </label>

              <label>
                Work Preference
                <select
                  name="workPreference"
                  value={form.workPreference}
                  onChange={handleChange}
                >
                  <option value="">Select preference</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </label>

              <label>
                Employment Preference
                <select
                  name="employmentType"
                  value={form.employmentType}
                  onChange={handleChange}
                >
                  <option value="">Select type</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Either">Either</option>
                </select>
              </label>
            </div>
          </div>

          <div className="registration-section">
            <h2>Resume / CV</h2>

            <label className="resume-upload">
              Upload Resume *
              <input
                id="candidate-resume"
                type="file"
                accept=".pdf,.docx"
                onChange={(e) =>
                  setResume(e.target.files?.[0] || null)
                }
                required
              />

              <small>
                PDF or DOCX only. Maximum file size: 5 MB.
              </small>
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
                I consent to my information and resume being stored and
                processed for recruitment purposes and to being contacted
                about relevant employment opportunities. I understand that
                I can request access to or deletion of my information as
                described in the Privacy Notice.
              </span>
            </label>
          </div>

          {error && <div className="error">{error}</div>}

          {message && (
            <div className="registration-success">
              ✓ {message}
            </div>
          )}

          <button
            type="submit"
            className="registration-submit"
            disabled={submitting}
          >
            {submitting
              ? "Submitting Profile..."
              : "Join Talent Network"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CandidateRegistration;