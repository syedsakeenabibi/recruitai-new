import { useCallback, useEffect, useMemo, useState } from "react";
import { raApi } from "./raApi";

const PAGE_SIZE = 12;

function value(job, key) {
  return job?.rawData?.[key] ?? "";
}

function employerKey(job) {
  return String(job.companyName || "Unknown employer").trim().toLowerCase();
}

function dateLabel(date) {
  if (!date) return "Date unavailable";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? "Date unavailable"
    : parsed.toLocaleDateString();
}

function cleanDescription(input) {
  return String(input || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function EmployerContacts({ contacts = [], loading, error }) {
  if (loading) return <p className="ra-muted">Loading employer contacts...</p>;
  if (error) return <p className="ra-error">{error}</p>;

  if (!contacts.length) {
    return (
      <div className="employer-contact-empty">
        <strong>No contacts extracted yet</strong>
        <span>Click Find hiring contacts to search with Hunter and Apify.</span>
      </div>
    );
  }

  return (
    <div className="employer-contact-list">
      {contacts.map((contact, index) => {
        const source = String(contact.sourceProvider || "UNKNOWN").toUpperCase();
        const verification = String(contact.verificationStatus || "UNVERIFIED").toUpperCase();
        const details = contact.emailVerification || {};
        const verificationScore = details.score ?? contact.confidence;

        const checks = [
          ["MX records", details.mxRecords],
          ["SMTP server", details.smtpServer],
          ["SMTP check", details.smtpCheck],
          ["Accept-all domain", details.acceptAll],
          ["Disposable email", details.disposable],
          ["Webmail provider", details.webmail],
          ["Gibberish check", details.gibberish],
          ["Regex check", details.regexp],
          ["Blocked", details.block],
          ["Verification result", details.result],
          ["Last verified", details.verification]
        ].filter(([, value]) => value !== null && value !== undefined && value !== "");

        return (
          <article className="employer-contact-card" key={contact.id || contact.email || `${source}-${index}`}>
            <div className="employer-contact-avatar">
              {(contact.contactName || contact.email || "?").trim().charAt(0).toUpperCase()}
            </div>

            <div className="employer-contact-main">
              <strong>{contact.contactName || "Name not provided"}</strong>
              <span>{contact.contactTitle || "Title not provided"}</span>

              <div className="employer-contact-links">
                {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
                {contact.phone && <a href={`tel:${contact.phone}`}>{contact.phone}</a>}
                {contact.professionalProfileUrl && (
                  <a href={contact.professionalProfileUrl} target="_blank" rel="noreferrer">
                    LinkedIn / Profile â†—
                  </a>
                )}
              </div>

              {!contact.email && (
                <small className="employer-contact-no-email">Business email not available</small>
              )}

              {source !== "APIFY_CONTACT_INFO" && contact.emailVerification?.reason && (
                <small className="employer-contact-no-email">
                  Verification note: {contact.emailVerification.reason}
                </small>
              )}

              {source !== "APIFY_CONTACT_INFO" && checks.length > 0 && (
                <details className="employer-verification-details">
                  <summary>View email verification details</summary>
                  <dl>
                    {checks.map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                  {details.checkedAt && (
                    <small>Checked: {new Date(details.checkedAt).toLocaleString()}</small>
                  )}
                </details>
              )}
            </div>

            <div className="employer-contact-badges">
              <span className={`employer-contact-source ${source.toLowerCase()}`}>
                {source === "APIFY_CONTACT_INFO" ? "APIFY" : source}
              </span>
              {source !== "APIFY_CONTACT_INFO" && (
                <>
                  <span className={`employer-verification ${verification.toLowerCase()}`}>
                    {verification.replace(/_/g, " ")}
                  </span>
                  {verificationScore != null && Number.isFinite(Number(verificationScore)) && (
                    <small className="employer-verification-score">
                      Hunter score: {Number(verificationScore)}
                    </small>
                  )}
                </>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
export default function SavedJobResearchPage() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [savedDate, setSavedDate] = useState("");
  const [source, setSource] = useState("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedEmployer, setExpandedEmployer] = useState("");
  const [contactState, setContactState] = useState({});
  const [discovering, setDiscovering] = useState("");

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await raApi.listOpportunities();
      setJobs(Array.isArray(result.opportunities) ? result.opportunities : []);
    } catch (err) {
      setError(err.message || "Could not load saved jobs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return jobs.filter((job) => {
      const raw = job.rawData || {};
      const searchable = [
        job.jobTitle, job.companyName, job.location, job.country,
        job.description, job.sourceUrl, raw.sourceProvider,
        raw.category, raw.industry, raw.salaryText, raw.salary
      ].filter(Boolean).join(" ").toLowerCase();

      if (query && !searchable.includes(query)) return false;

      if (savedDate) {
        const jobDate = job.discoveredAt
          ? new Date(job.discoveredAt).toISOString().slice(0, 10)
          : "";
        if (jobDate !== savedDate) return false;
      }

      if (country !== "ALL" && String(job.country || "").toUpperCase() !== country) return false;
      if (status !== "ALL" && String(job.status || "").toUpperCase() !== status) return false;
      if (source !== "ALL" && String(raw.sourceProvider || job.source || "").toUpperCase() !== source) return false;
      if (category !== "ALL" && String(raw.category || "").toUpperCase() !== category) return false;

      return true;
    });
  }, [jobs, search, country, category, status, savedDate, source]);

  const employers = useMemo(() => {
    const grouped = new Map();

    filteredJobs.forEach((job) => {
      const key = employerKey(job);
      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          name: job.companyName || "Unknown employer",
          jobs: [],
          latestDate: job.discoveredAt || null
        });
      }
      const employer = grouped.get(key);
      employer.jobs.push(job);
      if (job.discoveredAt && (!employer.latestDate || new Date(job.discoveredAt) > new Date(employer.latestDate))) {
        employer.latestDate = job.discoveredAt;
      }
    });

    return [...grouped.values()].sort((a, b) =>
      new Date(b.latestDate || 0) - new Date(a.latestDate || 0)
    );
  }, [filteredJobs]);

  const totalPages = Math.max(1, Math.ceil(employers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleEmployers = employers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const savedContactCount = useMemo(
    () => Object.values(contactState).reduce((total, item) => total + (item.contacts?.length || 0), 0),
    [contactState]
  );

  function changeFilter(setter, nextValue) {
    setter(nextValue);
    setPage(1);
  }

  async function loadContacts(opportunityId, employerKeyValue) {
    setContactState((current) => ({
      ...current,
      [employerKeyValue]: { ...(current[employerKeyValue] || {}), loading: true, error: "" }
    }));

    try {
      const result = await raApi.listEmployerContacts(opportunityId);
      setContactState((current) => ({
        ...current,
        [employerKeyValue]: {
          ...(current[employerKeyValue] || {}),
          contacts: result.contacts || [],
          loading: false,
          loaded: true,
          error: ""
        }
      }));
    } catch (err) {
      setContactState((current) => ({
        ...current,
        [employerKeyValue]: {
          ...(current[employerKeyValue] || {}),
          loading: false,
          error: err.message || "Could not load contacts."
        }
      }));
    }
  }

  async function toggleEmployer(employer) {
    if (expandedEmployer === employer.key) {
      setExpandedEmployer("");
      return;
    }

    setExpandedEmployer(employer.key);
    const firstJob = employer.jobs[0];
    const existing = contactState[employer.key];

    if (!existing?.loaded && firstJob?.id) {
      await loadContacts(firstJob.id, employer.key);
    }
  }

  async function discoverContacts(employer) {
    const firstJob = employer.jobs[0];
    if (!firstJob?.id) return;

    const approved = window.confirm(
      `Discover business contacts for ${employer.name}?\n\nThis verifies the saved vacancy and may use paid Apify credits if the vacancy qualifies. Continue?`
    );
    if (!approved) return;

    setDiscovering(employer.key);
    setContactState((current) => ({
      ...current,
      [employer.key]: { ...(current[employer.key] || {}), loading: true, error: "" }
    }));

    try {
      const result = await raApi.findHiringContacts(firstJob.id);
      setContactState((current) => ({
        ...current,
        [employer.key]: {
          contacts: result.contacts || [],
          loading: false,
          loaded: true,
          error: "",
          discoveryResult: result
        }
      }));
    } catch (err) {
      setContactState((current) => ({
        ...current,
        [employer.key]: {
          ...(current[employer.key] || {}),
          loading: false,
          error: err.message || "Contact discovery failed."
        }
      }));
    } finally {
      setDiscovering("");
    }
  }

  const uniqueCountries = [...new Set(jobs.map((job) => String(job.country || "").toUpperCase()).filter(Boolean))];
  const uniqueSources = [...new Set(jobs.map((job) => String(value(job, "sourceProvider") || job.source || "").toUpperCase()).filter(Boolean))];

  return (
    <section className="ra-panel saved-research-panel employer-crm">
      <header className="saved-research-header">
        <div>
          <span className="ra-eyebrow">FUSION STAFFING SOLUTIONS Â· RESEARCH CRM</span>
          <h2>Employer Research</h2>
          <p className="ra-muted">Manage saved vacancies, research employers and build a relevant hiring-contact directory.</p>
        </div>
        <button type="button" className="ra-button ra-button-secondary" onClick={loadJobs} disabled={loading}>
          {loading ? "Refreshing..." : "â†» Refresh data"}
        </button>
      </header>

      <div className="employer-crm-metrics">
        <article><span>Saved vacancies</span><strong>{jobs.length}</strong><small>All saved research jobs</small></article>
        <article><span>Unique employers</span><strong>{new Set(jobs.map(employerKey)).size}</strong><small>Companies in your library</small></article>
        <article><span>Matching employers</span><strong>{employers.length}</strong><small>After current filters</small></article>
        <article><span>Loaded contacts</span><strong>{savedContactCount}</strong><small>Contacts currently displayed</small></article>
      </div>

      <div className="employer-crm-toolbar">
        <div className="employer-crm-search">
          <span>âŒ•</span>
          <input
            type="search"
            value={search}
            onChange={(event) => changeFilter(setSearch, event.target.value)}
            placeholder="Search employer, job title, location, salary or source..."
          />
        </div>
        <label>Saved date
          <input type="date" value={savedDate} onChange={(event) => changeFilter(setSavedDate, event.target.value)} />
        </label>
        <label>Country
          <select value={country} onChange={(event) => changeFilter(setCountry, event.target.value)}>
            <option value="ALL">All countries</option>
            {uniqueCountries.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label>Category
          <select value={category} onChange={(event) => changeFilter(setCategory, event.target.value)}>
            <option value="ALL">All categories</option>
            <option value="IT">IT</option>
            <option value="NON-IT">Non-IT</option>
            <option value="BOTH">Both</option>
          </select>
        </label>
        <label>ATS source
          <select value={source} onChange={(event) => changeFilter(setSource, event.target.value)}>
            <option value="ALL">All sources</option>
            {uniqueSources.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label>Status
          <select value={status} onChange={(event) => changeFilter(setStatus, event.target.value)}>
            <option value="ALL">All statuses</option>
            <option value="NEW">New</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="LEAD_CREATED">Lead created</option>
            <option value="IGNORED">Ignored</option>
          </select>
        </label>
      </div>

      <div className="employer-crm-list-heading">
        <div><h3>Employers</h3><span>{employers.length} companies Â· {filteredJobs.length} matching vacancies</span></div>
        <span className="employer-crm-page-size">Showing {visibleEmployers.length} per page</span>
      </div>

      {error && <p className="ra-error" role="alert">{error}</p>}

      {loading ? (
        <div className="employer-crm-empty">Loading your saved employer research...</div>
      ) : visibleEmployers.length === 0 ? (
        <div className="employer-crm-empty">
          <strong>No matching employers found</strong>
          <span>Change your filters or run a job discovery search.</span>
        </div>
      ) : (
        <div className="employer-crm-list">
          {visibleEmployers.map((employer) => {
            const isExpanded = expandedEmployer === employer.key;
            const state = contactState[employer.key] || {};
            const contactCount = state.contacts?.length || 0;

            return (
              <article className={`employer-crm-card ${isExpanded ? "is-expanded" : ""}`} key={employer.key}>
                <button type="button" className="employer-crm-card-head" onClick={() => toggleEmployer(employer)} aria-expanded={isExpanded}>
                  <span className="employer-crm-logo">{employer.name.charAt(0).toUpperCase()}</span>
                  <span className="employer-crm-identity">
                    <strong>{employer.name}</strong>
                    <small>{employer.jobs.length} saved {employer.jobs.length === 1 ? "vacancy" : "vacancies"} Â· Latest saved {dateLabel(employer.latestDate)}</small>
                  </span>
                  <span className="employer-crm-contact-count">{state.loaded ? `${contactCount} contacts` : "View contacts"}</span>
                  <span className="employer-crm-chevron">{isExpanded ? "âˆ’" : "+"}</span>
                </button>

                {isExpanded && (
                  <div className="employer-crm-details">
                    <div className="employer-crm-section-title">
                      <div><h4>Saved vacancies</h4><span>{employer.jobs.length} linked job records</span></div>
                      <button type="button" className="ra-button" onClick={() => discoverContacts(employer)} disabled={discovering === employer.key || state.loading}>
                        {discovering === employer.key ? "Discovering..." : "Find hiring contacts"}
                      </button>
                    </div>

                    {state.discoveryResult?.message && <p className="ra-status-card">{state.discoveryResult.message}</p>}

                    <div className="employer-vacancy-list">
                      {employer.jobs.map((job) => (
                        <div className="employer-vacancy" key={job.id}>
                          <div>
                            <strong>{job.jobTitle || "Untitled vacancy"}</strong>
                            <span>{job.location || "Location not provided"} Â· {job.country || "Country unknown"}</span>
                            <small>{value(job, "sourceProvider") || job.source || "Source unknown"} Â· Saved {dateLabel(job.discoveredAt)}</small>
                          </div>
                          <div className="employer-vacancy-right">
                            <span>{job.status || "NEW"}</span>
                            {job.sourceUrl && <a href={job.sourceUrl} target="_blank" rel="noreferrer">View job â†—</a>}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="employer-crm-section-title employer-contacts-heading">
                      <div><h4>Employer contact directory</h4><span>Saved business contacts linked to the representative vacancy</span></div>
                      <button type="button" className="ra-button ra-button-secondary" onClick={() => loadContacts(employer.jobs[0]?.id, employer.key)} disabled={state.loading}>
                        Refresh contacts
                      </button>
                    </div>
                    <EmployerContacts contacts={state.contacts || []} loading={state.loading} error={state.error} />
                    {state.discoveryResult?.providerStatus && (
                      <p className="employer-provider-status">
                        Hunter: {state.discoveryResult.providerStatus.hunter || "Not reported"} Â·
                        Apify: {state.discoveryResult.providerStatus.apify || "Not reported"}
                      </p>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <footer className="saved-research-pagination">
        <span>Page {safePage} of {totalPages} Â· {employers.length} employers</span>
        <div>
          <button type="button" className="ra-button ra-button-secondary" disabled={safePage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
          <button type="button" className="ra-button ra-button-secondary" disabled={safePage >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</button>
        </div>
      </footer>
    </section>
  );
}


