import { useState } from "react";
import FindJobsPage from "./FindJobsPage";
import CandidateRegistration from "./CandidateRegistration";
import FusionHome from "./FusionHome";
import AboutPage from "./AboutPage";
import TermsPage from "./TermsPage";
import FusionNavbar from "./FusionNavbar";
import CandidatesPage from "./CandidatesPage";
import EmployersPage from "./EmployersPage";
import ServicesPage from "./ServicesPage";
import IndustriesPage from "./IndustriesPage";
import ContactPage from "./ContactPage";
import "./App.css";


function App() {
  const [page, setPage] = useState("home");
  const [jd, setJd] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [job, setJob] = useState(null);
  const [searched, setSearched] = useState(0);
  const [relevant, setRelevant] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState([]);
  const [outreachDrafts, setOutreachDrafts] = useState([]);
const [generatingOutreach, setGeneratingOutreach] = useState(false);
const [editingDraft, setEditingDraft] = useState(null);

  async function findCandidates() {
    if (jd.trim().length < 20) {
      setError("Please paste a complete job description.");
      return;
    }

    setLoading(true);
    setError("");
    setCandidates([]);
    setJob(null);
    setSelected([]);

    try {
      const response = await fetch("http://localhost:4000/api/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jd }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Candidate matching failed.");
      }

      setJob(data.aiExtractedJob);
      setSearched(data.totalCandidatesSearched);
      setRelevant(data.totalRelevantCandidates);
      setCandidates(data.candidates);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleCandidate(id) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((candidateId) => candidateId !== id)
        : [...current, id]
    );
  }
async function generateOutreach() {
  if (selected.length === 0) {
    setError("Please select at least one candidate.");
    return;
  }

  setGeneratingOutreach(true);
  setError("");

  try {
    const selectedCandidates = candidates.filter((candidate) =>
      selected.includes(candidate.id)
    );

    const drafts = [];

    for (const candidate of selectedCandidates) {
      const response = await fetch(
        "http://localhost:4000/api/generate-outreach",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jd,
            candidate,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate outreach.");
      }

      drafts.push(data);
    }

    setOutreachDrafts(drafts);
  } catch (err) {
    setError(err.message);
  } finally {
    setGeneratingOutreach(false);
  }
}
function startEditing(draft) {
  setEditingDraft({
    ...draft,
  });
}

function cancelEditing() {
  setEditingDraft(null);
}

function saveEditedDraft() {
  setOutreachDrafts((currentDrafts) =>
    currentDrafts.map((draft) =>
      draft.candidateId === editingDraft.candidateId
        ? {
            ...draft,
            subject: editingDraft.subject,
            body: editingDraft.body,
          }
        : draft
    )
  );

  setEditingDraft(null);
}
if (page === "home") {
  return (
    <FusionHome
  onHome={() => setPage("home")}
  onJobs={() => setPage("jobs")}
  onCandidates={() => setPage("candidates")}
  onEmployers={() => setPage("employers")}
  onServices={() => setPage("services")}
  onIndustries={() => setPage("industries")}
  onAbout={() => setPage("about")}
  onTerms={() => setPage("terms")}
  onContact={() => setPage("contact")}
  onJoinTalent={() => setPage("candidate")}
  onOpenRecruitAI={() => setPage("recruiter")}
/>
  );
}   
if (page === "candidates") {
  return (
    <CandidatesPage
      onHome={() => setPage("home")}
      onJobs={() => setPage("jobs")}
      onCandidates={() => setPage("candidates")}
      onEmployers={() => setPage("employers")}
      onServices={() => setPage("services")}
      onIndustries={() => setPage("industries")}
      onAbout={() => setPage("about")}
      onContact={() => setPage("contact")}
      onJoinTalent={() => setPage("candidate")}
    />
  );
}
if (page === "employers") {
  return (
    <EmployersPage
      onHome={() => setPage("home")}
      onJobs={() => setPage("jobs")}
      onCandidates={() => setPage("candidates")}
      onEmployers={() => setPage("employers")}
      onServices={() => setPage("services")}
      onIndustries={() => setPage("industries")}
      onAbout={() => setPage("about")}
      onContact={() => setPage("contact")}
      onJoinTalent={() => setPage("candidate")}
    />
  );
}
if (page === "about") {
  return (
    <AboutPage
      onHome={() => setPage("home")}
      onJobs={() => setPage("jobs")}
      onCandidates={() => setPage("candidates")}
      onEmployers={() => setPage("employers")}
      onServices={() => setPage("services")}
      onIndustries={() => setPage("industries")}
      onAbout={() => setPage("about")}
      onTerms={() => setPage("terms")}
      onContact={() => setPage("contact")}
      onJoinTalent={() => setPage("candidate")}
    />
  );
}

if (page === "terms") {
  return (
    <TermsPage
      onHome={() => setPage("home")}
      onJobs={() => setPage("jobs")}
      onCandidates={() => setPage("candidates")}
      onEmployers={() => setPage("employers")}
      onServices={() => setPage("services")}
      onIndustries={() => setPage("industries")}
      onAbout={() => setPage("about")}
      onTerms={() => setPage("terms")}
      onContact={() => setPage("contact")}
      onJoinTalent={() => setPage("candidate")}
    />
  );
}


if (page === "candidate") {
  return (
    <CandidateRegistration
      onBack={() => setPage("home")}
      onHome={() => setPage("home")}
      onJobs={() => setPage("jobs")}
      onCandidates={() => setPage("candidates")}
      onEmployers={() => setPage("employers")}
      onServices={() => setPage("services")}
      onIndustries={() => setPage("industries")}
      onAbout={() => setPage("about")}
      onContact={() => setPage("contact")}
      onJoinTalent={() => setPage("candidate")}
    />
  );
}
if (page === "jobs") {
  return (
    <FindJobsPage
      onHome={() => setPage("home")}
      onJobs={() => setPage("jobs")}
      onCandidates={() => setPage("candidates")}
      onEmployers={() => setPage("employers")}
      onServices={() => setPage("services")}
      onIndustries={() => setPage("industries")}
      onAbout={() => setPage("about")}
onTerms={() => setPage("terms")}
onContact={() => setPage("contact")}
      onJoinTalent={() => setPage("candidate")}
    />
  );
}
if (page === "services") {
  return (
    <ServicesPage
      onHome={() => setPage("home")}
      onJobs={() => setPage("jobs")}
      onCandidates={() => setPage("candidates")}
      onEmployers={() => setPage("employers")}
      onServices={() => setPage("services")}
      onIndustries={() => setPage("industries")}
      onAbout={() => setPage("about")}
      onContact={() => setPage("contact")}
      onJoinTalent={() => setPage("candidate")}
    />
  );
}
if (page === "industries") {
  return (
    <IndustriesPage
      onHome={() => setPage("home")}
      onJobs={() => setPage("jobs")}
      onCandidates={() => setPage("candidates")}
      onEmployers={() => setPage("employers")}
      onServices={() => setPage("services")}
      onIndustries={() => setPage("industries")}
      onAbout={() => setPage("about")}
      onContact={() => setPage("contact")}
      onJoinTalent={() => setPage("candidate")}
    />
  );
}
if (page === "contact") {
  return (
    <ContactPage
      onHome={() => setPage("home")}
      onJobs={() => setPage("jobs")}
      onCandidates={() => setPage("candidates")}
      onEmployers={() => setPage("employers")}
      onServices={() => setPage("services")}
      onIndustries={() => setPage("industries")}
      onAbout={() => setPage("about")}
      onContact={() => setPage("contact")}
      onJoinTalent={() => setPage("candidate")}
    />
  );
}
if (page !== "recruiter") {
  return (
    <div style={{ padding: "60px", textAlign: "center" }}>
      <h2>Page coming soon</h2>
    <p>This Fusion Staffing Solutions page is currently being prepared.</p>

      <button
        onClick={() => setPage("home")}
        style={{
          marginTop: "20px",
          padding: "12px 22px",
          cursor: "pointer",
        }}
      >
        ← Back to Home
      </button>
    </div>
  );
}
if (page === "jobs") {
  return (
    <FindJobsPage
      onHome={() => setPage("home")}
      onJobs={() => setPage("jobs")}
      onCandidates={() => setPage("candidates")}
      onEmployers={() => setPage("employers")}
      onServices={() => setPage("services")}
      onIndustries={() => setPage("industries")}
      onAbout={() => setPage("about")}
      onContact={() => setPage("contact")}
      onJoinTalent={() => setPage("candidate")}
    />
  );
}

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>RecruitAI</h1>
          <p>AI Candidate Matching</p>
        </div>

        <div className="database-status">
          <span className="status-dot"></span>
          Candidate Database
        </div>
   <button
  className="talent-network-button"
  onClick={() => setPage("home")}
>
 ← Fusion Staffing Solutions
</button>
      </header>
      <main className="main">
        <section className="search-panel">
          <div className="section-heading">
            <div>
              <h2>Find Candidates</h2>
              <p>
                Paste any client job description. AI will understand the
                requirements and rank relevant candidates.
              </p>
            </div>
          </div>

          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the client's complete job description here..."
          />

          <button
            className="search-button"
            onClick={findCandidates}
            disabled={loading}
          >
            {loading ? "AI is matching candidates..." : "Find Candidates"}
          </button>

          {error && <div className="error">{error}</div>}
        </section>

        {job && (
          <section className="job-summary">
            <div className="summary-title">
              <div>
                <span className="eyebrow">AI UNDERSTOOD THE JOB</span>
                <h2>{job.jobTitle || "Job Requirements"}</h2>
              </div>

              <div className="result-count">
                <strong>{relevant}</strong>
                <span>relevant candidates</span>
              </div>
            </div>

            <div className="job-details">
              {job.minimumExperience !== null && (
                <div>
                  <span>Experience</span>
                  <strong>{job.minimumExperience}+ years</strong>
                </div>
              )}

              {job.location && (
                <div>
                  <span>Location</span>
                  <strong>{job.location}</strong>
                </div>
              )}

              {job.education && (
                <div>
                  <span>Education</span>
                  <strong>{job.education}</strong>
                </div>
              )}

              <div>
                <span>Database searched</span>
                <strong>{searched} candidates</strong>
              </div>
            </div>

            {job.requiredSkills?.length > 0 && (
              <div className="skills-row">
                <span>Required skills</span>

                <div className="skill-tags">
                  {job.requiredSkills.map((skill) => (
                    <span className="skill-tag" key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {candidates.length > 0 && (
          <section className="results">
            <div className="results-header">
              <div>
                <h2>Matched Candidates</h2>
                <p>Highest JD match shown first</p>
              </div>

             <div className="outreach-actions">
  <div className="selected-count">
    {selected.length} selected
  </div>

  <button
    className="outreach-button"
    onClick={generateOutreach}
    disabled={selected.length === 0 || generatingOutreach}
  >
    {generatingOutreach
      ? "Generating..."
      : `Generate Outreach (${selected.length})`}
  </button>
</div>
            </div>

            <div className="candidate-list">
              {candidates.map((candidate) => (
                <article
                  className={`candidate-card ${
                    selected.includes(candidate.id) ? "selected" : ""
                  }`}
                  key={candidate.id}
                >
                  <div className="candidate-select">
                    <input
                      type="checkbox"
                      checked={selected.includes(candidate.id)}
                      onChange={() => toggleCandidate(candidate.id)}
                    />
                  </div>

                  <div className="candidate-info">
                    <h3>{candidate.name}</h3>

                    <p className="candidate-title">
                      {candidate.currentTitle || "Title unavailable"}
                      {candidate.currentCompany
                        ? ` • ${candidate.currentCompany}`
                        : ""}
                    </p>

                    <div className="candidate-meta">
                      <span>
                        {candidate.experienceYears ?? "—"} years experience
                      </span>
                      <span>
                        {candidate.location || candidate.country || "Location unavailable"}
                      </span>
                    </div>

                    <div className="candidate-skills">
                      {candidate.skills?.slice(0, 8).map((skill) => (
                        <span key={skill}>{skill}</span>
                      ))}
                    </div>

                    {candidate.matchReasons?.length > 0 && (
                      <div className="match-reasons">
                        {candidate.matchReasons.map((reason, index) => (
                          <span key={index}>✓ {reason}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="match-score">
                    <strong>{candidate.matchPercentage}%</strong>
                    <span>JD Match</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
        {outreachDrafts.length > 0 && (
  <section className="outreach-preview">
    <div className="outreach-preview-header">
      <div>
        <span className="eyebrow">AI GENERATED OUTREACH</span>
        <h2>Email Preview</h2>
        <p>Review the email before sending it to the candidate.</p>
      </div>

      <span className="draft-count">
        {outreachDrafts.length} Draft
        {outreachDrafts.length > 1 ? "s" : ""}
      </span>
    </div>

    <div className="outreach-draft-list">
      {outreachDrafts.map((draft) => (
        <div className="outreach-draft-card" key={draft.candidateId}>
          <div className="draft-candidate">
            <div className="candidate-avatar">
              {draft.candidateName?.charAt(0)?.toUpperCase()}
            </div>

            <div>
              <strong>{draft.candidateName}</strong>
              <span>{draft.candidateEmail}</span>
            </div>

            <span className="draft-status">DRAFT</span>
          </div>

          <div className="email-field">
            <label>To</label>
            <div>{draft.candidateEmail}</div>
          </div>

          {editingDraft?.candidateId === draft.candidateId ? (
  <>
    <div className="email-field">
      <label>Subject</label>
      <input
        className="email-subject-input"
        value={editingDraft.subject}
        onChange={(e) =>
          setEditingDraft({
            ...editingDraft,
            subject: e.target.value,
          })
        }
      />
    </div>

    <div className="email-field email-body">
      <label>Message</label>
      <textarea
        className="email-message-input"
        value={editingDraft.body}
        onChange={(e) =>
          setEditingDraft({
            ...editingDraft,
            body: e.target.value,
          })
        }
        rows={12}
      />
    </div>
  </>
) : (
  <>
    <div className="email-field">
      <label>Subject</label>
      <div>{draft.subject}</div>
    </div>

    <div className="email-field email-body">
      <label>Message</label>
      <div className="email-message">
        {draft.body}
      </div>
    </div>
  </>
)}

          <div className="draft-buttons">
            <button
              className="secondary-button"
              onClick={() =>
                setOutreachDrafts((current) =>
                  current.filter(
                    (item) => item.candidateId !== draft.candidateId
                  )
                )
              }
            >
              Discard
            </button>
            {editingDraft?.candidateId === draft.candidateId ? (
  <>
    <button
      className="secondary-button"
      onClick={cancelEditing}
    >
      Cancel
    </button>

    <button
      className="secondary-button"
      onClick={saveEditedDraft}
    >
      Save Changes
    </button>
  </>
) : (
  <button
    className="secondary-button"
    onClick={() => startEditing(draft)}
  >
    ✏️ Edit
  </button>
)}
<button
  className="send-button"
  onClick={async () => {
    try {
      const response = await fetch("http://localhost:4000/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: draft.candidateEmail,
          subject: draft.subject,
          body: draft.body,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Email failed");
      }

      alert("✅ Email sent successfully!");
    } catch (error) {
      alert("❌ " + error.message);
    }
  }}
>
  Send Email
</button>
          </div>
        </div>
      ))}
    </div>
  </section>
)}
      </main>
    </div>
  );
}

export default App;