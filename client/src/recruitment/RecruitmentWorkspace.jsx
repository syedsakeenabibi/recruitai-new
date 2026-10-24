import { useEffect, useState } from "react";
import { recruitmentApi } from "./recruitmentApi";
import "./recruitment.css";

const NAVIGATION = [
  ["assigned-jobs", "Assigned Jobs"],
  ["matching", "Candidate Matching"],
  ["shortlists", "Shortlists"],
  ["submissions", "Submissions"],
  ["interviews", "Interviews"],
  ["placements", "Offers / Placements"],
  ["reports", "Reports"],
  ["settings", "Settings"],
];
const ACTIVE_STATUSES = ["CONFIRMED", "ASSIGNED", "SOURCING", "SUBMITTED", "INTERVIEW", "OFFER"];

export default function RecruitmentWorkspace({ onBack, initialPage = "assigned-jobs" }) {
  const [page, setPage] = useState(initialPage);
  const [requirements, setRequirements] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [records, setRecords] = useState([]);
  const [reports, setReports] = useState(null);
  const [selectedRequirementId, setSelectedRequirementId] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadBase() {
    const [requirementResult, candidateResult] = await Promise.all([
      recruitmentApi.listRequirements(),
      recruitmentApi.searchCandidates(),
    ]);
    setRequirements(requirementResult.requirements || []);
    setCandidates(candidateResult.candidates || []);
  }

  async function loadPage(currentPage = page) {
    try {
      if (currentPage === "assigned-jobs") {
        const result = await recruitmentApi.listAssignedJobs();
        setRecords(result.requirements || []);
      } else if (currentPage === "matching") {
        await loadBase();
        setRecords([]);
      } else if (currentPage === "shortlists") {
        const result = await recruitmentApi.listShortlists();
        setRecords(result.shortlists || []);
      } else if (currentPage === "submissions") {
        const result = await recruitmentApi.listSubmissions();
        setRecords(result.submissions || []);
        await loadBase();
      } else if (currentPage === "interviews") {
        const result = await recruitmentApi.listInterviews();
        setRecords(result.interviews || []);
        await loadBase();
      } else if (currentPage === "placements") {
        const result = await recruitmentApi.listPlacements();
        setRecords(result.placements || []);
        await loadBase();
      } else if (currentPage === "reports") {
        setReports(await recruitmentApi.getReports());
      }
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => {
    loadPage(page).catch((loadError) => setError(loadError.message));
  }, [page]);

  useEffect(() => {
    setPage(initialPage);
  }, [initialPage]);

  async function runMatching(event) {
    event.preventDefault();
    if (!selectedRequirementId) return;
    setBusy(true);
    setError("");
    try {
      const result = await recruitmentApi.matchCandidates(selectedRequirementId, search);
      setRequirements((current) => current.some((item) => item.id === result.requirement.id)
        ? current.map((item) => item.id === result.requirement.id ? result.requirement : item)
        : [...current, result.requirement]);
      setRecords(result.candidates || []);
    } catch (matchError) {
      setError(matchError.message);
    } finally {
      setBusy(false);
    }
  }

  async function addToShortlist(candidateId) {
    setError("");
    setNotice("");
    try {
      await recruitmentApi.createShortlist({ requirementId: selectedRequirementId, candidateId });
      setNotice("Candidate added to shortlist.");
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  async function createRecord(event, kind) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    if (!payload.requirementId) {
      setError("Select a confirmed requirement.");
      return;
    }
    if (kind === "interview" && !payload.scheduledAt) payload.scheduledAt = null;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (kind === "submission") await recruitmentApi.createSubmission(payload);
      if (kind === "interview") await recruitmentApi.createInterview(payload);
      if (kind === "placement") await recruitmentApi.createPlacement(payload);
      form.reset();
      setNotice("Record saved.");
      await loadPage(page);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  async function updateRecord(kind, record, patch) {
    setError("");
    try {
      if (kind === "shortlist") await recruitmentApi.updateShortlist(record.id, patch);
      if (kind === "submission") await recruitmentApi.updateSubmission(record.id, patch);
      if (kind === "interview") await recruitmentApi.updateInterview(record.id, patch);
      if (kind === "placement") await recruitmentApi.updatePlacement(record.id, patch);
      await loadPage(page);
    } catch (updateError) {
      setError(updateError.message);
    }
  }

  const activeRequirements = requirements.filter((item) => ACTIVE_STATUSES.includes(item.status));
  const currentTitle = NAVIGATION.find(([key]) => key === page)?.[1] || "Recruitment";

  return (
    <section className="rw">
      <header className="rw-header">
        <div><span className="rw-eyebrow">FUSION STAFFING SOLUTIONS</span><h2>{currentTitle}</h2></div>
        {onBack && <button className="rw-secondary" onClick={onBack}>Back to dashboard</button>}
      </header>
      <nav className="rw-tabs" aria-label="Recruitment sections">
        {NAVIGATION.map(([key, label]) =>         <button key={key} className={page === key ? "active" : ""} onClick={() => { setError(""); setNotice(""); setPage(key); }}>{label}</button>)}
      </nav>
      {error && <p className="rw-error" role="alert">{error}</p>}
      {notice && <p className="rw-notice" role="status">{notice}</p>}

      {page === "assigned-jobs" && <RecordList
        title="Confirmed client requirements"
        empty="No confirmed or assigned jobs yet. Confirm a draft requirement in Business Development to make it available here."
        records={records}
        render={(item) => <><h3>{item.jobTitle}</h3><p>{item.companyName || "Company not specified"} · {item.location || item.country || "Location not specified"}</p><p>Status: {item.status} · Openings: {item.openings}</p><p>Recruiter: {item.assignedRecruiter || "Not assigned"}</p><label>Requirement stage<select value={item.status} onChange={(event) => recruitmentApi.updateRequirement(item.id, { status: event.target.value }).then(() => loadPage(page)).catch((updateError) => setError(updateError.message))}>{["CONFIRMED", "ASSIGNED", "SOURCING", "SUBMITTED", "INTERVIEW", "OFFER", "PLACED", "CLOSED", "CANCELLED"].map((status) => <option key={status}>{status}</option>)}</select></label></>}
      />}

      {page === "matching" && <section className="rw-panel">
        <div className="rw-heading"><div><h3>Match real candidate records</h3><p>Scores are advisory; candidates are never automatically rejected.</p></div></div>
        <form className="rw-inline-form" onSubmit={runMatching}>
          <label>Confirmed requirement<select value={selectedRequirementId} onChange={(event) => setSelectedRequirementId(event.target.value)} required>
            <option value="">Select requirement</option>{activeRequirements.map((item) => <option key={item.id} value={item.id}>{item.jobTitle} — {item.companyName || "Company unspecified"}</option>)}
          </select></label>
          <label>Search candidates<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Skills, role, location..." /></label>
          <button className="rw-primary" disabled={busy || !selectedRequirementId}>{busy ? "Matching..." : "Find and rank candidates"}</button>
        </form>
        {!activeRequirements.length && <div className="rw-empty">There are no confirmed requirements available for matching.</div>}
        <RecordList records={records} empty="Run a search to rank candidates from the existing candidate database." render={(candidate) => <>
          <div className="rw-record-title"><div><h3>{candidate.name}</h3><p>{candidate.currentTitle || "Title not recorded"} · {candidate.location || candidate.country || "Location not recorded"}</p></div><span className="rw-badge">Match {candidate.matchScore}%</span></div>
          <div className="rw-meta"><span>{candidate.experienceYears == null ? "Experience not recorded" : `${candidate.experienceYears} years experience`}</span><span>{candidate.email || "No email"}</span><span>{candidate.source}</span></div>
          {candidate.resumeFileName && <a href={`/api/admin/candidates/${encodeURIComponent(candidate.id)}/resume`} target="_blank" rel="noreferrer">View CV: {candidate.resumeFileName}</a>}
          <p><strong>Matched skills:</strong> {candidate.matchedSkills.join(", ") || "No requirement skills matched"}</p>
          <p><strong>Missing requirements:</strong> {candidate.missingRequirements.join(", ") || "None identified"}</p>
          <p><strong>Fit checks:</strong> Education {candidate.educationFit} · Notice {candidate.noticePeriodFit} · Salary {candidate.salaryFit}</p>
          <p>{candidate.reason}</p>
          <button className="rw-secondary" disabled={!selectedRequirementId} onClick={() => addToShortlist(candidate.id)}>Add to shortlist</button>
        </>} />
      </section>}

      {page === "shortlists" && <RecordList
        title="Shortlisted candidates"
        empty="No candidates have been shortlisted."
        records={records}
        render={(item) => <><h3>{item.candidateName}</h3><p>{item.jobTitle} · {item.currentTitle || "Title not recorded"}</p><div className="rw-meta"><span>{item.email || "No email"}</span><span>Recruiter status: {item.status}</span></div><label>Outreach status<select value={item.outreachStatus} onChange={(event) => updateRecord("shortlist", item, { outreachStatus: event.target.value })}>{["NOT_CONTACTED", "CONTACTED", "RESPONDED", "INTERESTED", "DECLINED"].map((status) => <option key={status}>{status}</option>)}</select></label></>}
      />}

      {page === "submissions" && <section className="rw-panel">
        <RecordForm title="Create candidate submission" busy={busy} candidates={candidates} requirements={activeRequirements} onSubmit={(event) => createRecord(event, "submission")} fields={["status", "notes"]} />
        <RecordList records={records} empty="No candidate submissions." render={(item) => <><h3>{item.candidateName} — {item.jobTitle}</h3><p>{item.companyName || "Company unspecified"} · {item.status}</p>{item.submittedAt && <p>Submitted {new Date(item.submittedAt).toLocaleString()}</p>}<textarea aria-label="Client feedback" defaultValue={item.clientFeedback || ""} placeholder="Client feedback" onBlur={(event) => event.target.value !== (item.clientFeedback || "") && updateRecord("submission", item, { clientFeedback: event.target.value })} /><select value={item.status} onChange={(event) => updateRecord("submission", item, { status: event.target.value })}>{["DRAFT", "APPROVED", "SUBMITTED", "SHORTLISTED", "REJECTED", "INTERVIEW", "OFFER", "PLACED"].map((status) => <option key={status}>{status}</option>)}</select></>} />
      </section>}

      {page === "interviews" && <section className="rw-panel">
        <RecordForm title="Schedule an interview" busy={busy} candidates={candidates} requirements={activeRequirements} onSubmit={(event) => createRecord(event, "interview")} fields={["round", "scheduledAt", "timezone", "mode", "meetingLocation"]} />
        <RecordList records={records} empty="No interviews recorded." render={(item) => <><h3>{item.candidateName} — {item.jobTitle}</h3><p>{item.companyName || "Company unspecified"} · {item.round || "Round not specified"}</p><p>{item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : "Time not scheduled"} {item.timezone || ""} · {item.mode || "Mode not specified"} · {item.status}</p><select value={item.status} onChange={(event) => updateRecord("interview", item, { status: event.target.value })}>{["SCHEDULED", "COMPLETED", "RESCHEDULED", "CANCELLED", "PASSED", "REJECTED"].map((status) => <option key={status}>{status}</option>)}</select><textarea aria-label="Candidate interview feedback" defaultValue={item.candidateFeedback || ""} placeholder="Candidate feedback" onBlur={(event) => event.target.value !== (item.candidateFeedback || "") && updateRecord("interview", item, { candidateFeedback: event.target.value })} /><textarea aria-label="Client interview feedback" defaultValue={item.clientFeedback || ""} placeholder="Client feedback" onBlur={(event) => event.target.value !== (item.clientFeedback || "") && updateRecord("interview", item, { clientFeedback: event.target.value })} /></>} />
      </section>}

      {page === "placements" && <section className="rw-panel">
        <RecordForm title="Record offer or placement" busy={busy} candidates={candidates} requirements={activeRequirements} onSubmit={(event) => createRecord(event, "placement")} fields={["offeredSalary", "currency", "offerDate", "expectedJoiningDate", "actualJoiningDate", "status", "notes"]} />
        <RecordList records={records} empty="No offers or placements recorded." render={(item) => <><h3>{item.candidateName} — {item.jobTitle}</h3><p>{item.companyName || "Company unspecified"} · {item.status}</p><p>{item.offeredSalary == null ? "Salary not recorded" : `${item.offeredSalary} ${item.currency || ""}`}</p><p>Expected joining: {item.expectedJoiningDate ? new Date(item.expectedJoiningDate).toLocaleDateString() : "Not recorded"} · Actual: {item.actualJoiningDate ? new Date(item.actualJoiningDate).toLocaleDateString() : "Not recorded"}</p><select value={item.status} onChange={(event) => updateRecord("placement", item, { status: event.target.value })}>{["OFFER_PENDING", "OFFERED", "ACCEPTED", "DECLINED", "JOINED", "NO_SHOW", "PLACED"].map((status) => <option key={status}>{status}</option>)}</select></>} />
      </section>}

      {page === "reports" && <section className="rw-panel"><h3>Live recruitment reports</h3><p>Counts are queried from database records; no sample figures are displayed.</p>{reports ? <div className="rw-report-grid"><ReportCard label="Candidates" value={reports.candidateCount} />{Object.entries({ "Requirements": reports.requirements, "Company leads": reports.leads, "Submissions": reports.submissions, "Interviews": reports.interviews, "Offers / placements": reports.placements }).map(([label, values]) => <ReportCard key={label} label={label} value={Object.values(values).reduce((sum, value) => sum + Number(value), 0)} detail={Object.entries(values).map(([status, count]) => `${status}: ${count}`).join(" · ")} />)}</div> : <div className="rw-empty">Loading live report data...</div>}</section>}

      {page === "settings" && <section className="rw-panel"><h3>Role authorization foundation</h3><p>Current session authentication remains unchanged. Role authorization helpers are prepared but not activated on existing routes.</p><p>Before enforcement, assign and verify ADMIN, MANAGER, BDM, RA, and RECRUITER roles for current users, then test route access with one account per role. Until then, authenticated admin sessions retain existing access.</p><div className="rw-empty">No settings or user-role changes were made.</div></section>}
    </section>
  );
}

function RecordList({ title, empty, records = [], render }) {
  return <section className="rw-panel">
    {title && <div className="rw-heading"><div><h3>{title}</h3></div></div>}
    {!records.length ? <div className="rw-empty">{empty}</div> : <div className="rw-record-list">{records.map((record) => <article className="rw-record" key={record.id}>{render(record)}</article>)}</div>}
  </section>;
}

function RecordForm({ title, busy, candidates, requirements, onSubmit, fields }) {
  return <form className="rw-form" onSubmit={onSubmit}>
    <h3>{title}</h3>
    <label>Requirement<select name="requirementId" required defaultValue=""><option value="">Select confirmed requirement</option>{requirements.map((item) => <option key={item.id} value={item.id}>{item.jobTitle} — {item.companyName || "Company unspecified"}</option>)}</select></label>
    <label>Candidate<select name="candidateId" required defaultValue=""><option value="">Select existing candidate</option>{candidates.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.currentTitle || "Role not recorded"}</option>)}</select></label>
    {fields.map((field) => <label key={field}>{field.replace(/([A-Z])/g, " $1")}{field === "status"
      ? <select name={field} defaultValue=""><option value="">Use default status</option>{(STATUS_OPTIONS[kindForFields(fields)] || []).map((status) => <option key={status}>{status}</option>)}</select>
      : <input name={field} type={field.toLowerCase().includes("date") ? "datetime-local" : field === "offeredSalary" ? "number" : "text"} min={field === "offeredSalary" ? "0" : undefined} />}</label>)}
    <button className="rw-primary" disabled={busy}>{busy ? "Saving..." : "Save record"}</button>
  </form>;
}

const STATUS_OPTIONS = {
  "status-submission": ["DRAFT", "APPROVED", "SUBMITTED", "SHORTLISTED", "REJECTED", "INTERVIEW", "OFFER", "PLACED"],
  "status-interview": ["SCHEDULED", "COMPLETED", "RESCHEDULED", "CANCELLED", "PASSED", "REJECTED"],
  "status-placement": ["OFFER_PENDING", "OFFERED", "ACCEPTED", "DECLINED", "JOINED", "NO_SHOW", "PLACED"],
};

function kindForFields(fields) {
  if (fields.includes("round")) return "status-interview";
  if (fields.includes("offeredSalary")) return "status-placement";
  return "status-submission";
}

function ReportCard({ label, value, detail }) {
  return <article className="rw-report-card"><span>{label}</span><strong>{value}</strong>{detail && <small>{detail || "No records"}</small>}</article>;
}
