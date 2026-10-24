import { useCallback, useEffect, useMemo, useState } from "react";
import FusionNavbar from "./FusionNavbar";
import "./FusionWebsite.css";

const JOBS_PER_PAGE = 4;

function formatPostedDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString();
}

export default function FindJobsPage({
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
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [country, setCountry] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [locationQuery, setLocationQuery] = useState("");
  const [industry, setIndustry] = useState("ALL");
  const [employmentType, setEmploymentType] = useState("ALL");
  const [workplaceType, setWorkplaceType] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshedAt, setRefreshedAt] = useState(null);
  const [notice, setNotice] = useState("");

  const loadJobs = useCallback(async (refresh = false) => {
    setJobsLoading(true);
    setJobsError("");
    try {
      const response = await fetch("/api/public-jobs");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load current vacancies.");
      setJobs((Array.isArray(data.jobs) ? data.jobs : []).map(job => ({
    ...job,
    jobTitle: job.title,
    postedAt: job.publishedAt,
    sourceUrl: "/jobs/" + encodeURIComponent(job.id),
    sourceProvider: "Fusion Staffing Solutions"
  })));
      setRefreshedAt(data.refreshedAt || null);
      setNotice(data.notice || "");
      setCurrentPage(1);
    } catch (error) {
      setJobsError(error.message || "Unable to load current vacancies.");
    } finally {
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const filteredJobs = useMemo(() => {
    const search = keyword.trim().toLowerCase();
    return jobs.filter((job) => {
      if (country !== "ALL" && job.country !== country) return false;
      const jobCategory = String(job.category || "").toUpperCase();
      if (category === "IT" && jobCategory !== "IT" && jobCategory !== "BOTH") return false;
      if (category === "NON-IT" && jobCategory !== "NON-IT" && jobCategory !== "BOTH") return false;
      if (locationQuery && !String(job.location || "").toLowerCase().includes(locationQuery.toLowerCase())) return false;
      if (industry !== "ALL" && job.industry !== industry) return false;
      if (employmentType !== "ALL" && job.employmentType !== employmentType) return false;
      if (workplaceType !== "ALL" && job.workplaceType !== workplaceType) return false;
      if (!search) return true;

      return [
        job.jobTitle,
        job.companyName,
        job.location,
        job.description,
        job.industry,
        job.employmentType,
        job.workplaceType,
        job.country,
        job.category,
        job.salary,
      ].some((value) => String(value || "").toLowerCase().includes(search));
    });
  }, [jobs, keyword, country, category, locationQuery, industry, employmentType, workplaceType]);
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / JOBS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const displayedJobs = filteredJobs.slice(
    (safeCurrentPage - 1) * JOBS_PER_PAGE,
    safeCurrentPage * JOBS_PER_PAGE
  );

  useEffect(() => {
    if (currentPage !== safeCurrentPage) setCurrentPage(safeCurrentPage);
  }, [currentPage, safeCurrentPage]);

  const changeKeyword = (value) => {
    setKeyword(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setKeyword("");
    setCurrentPage(1);
    setCountry("ALL");
    setCategory("ALL");
    setLocationQuery("");
    setIndustry("ALL");
    setEmploymentType("ALL");
    setWorkplaceType("ALL");
  };

  return (
    <div className="sakevra-site">
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

      <main>
        {/* HERO */}
        <section className="about-page-hero">
          <div className="about-page-copy">
            <span className="section-eyebrow">CAREER OPPORTUNITIES</span>
            <h1>Find Your Next <em>Opportunity</em></h1>

            <p>
              Explore IT and Non-IT career opportunities across the United States and United Kingdom. Discover opportunities in technology, healthcare, manufacturing, construction, logistics and more.
            </p>

            <div className="sakevra-hero-actions">
              <button
                type="button"
                className="sakevra-primary"
                onClick={onJoinTalent}
              >
                Upload Your CV <span>→</span>
              </button>

              <button
                type="button"
                className="sakevra-secondary"
                onClick={onCandidates}
              >
                Candidate Network <span>↗</span>
              </button>
            </div>
          </div>

          <div className="about-page-image">
            <img
              src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=85"
              alt="Professionals exploring career opportunities"
            />
          </div>
        </section>

        {/* SEARCHABLE LIVE VACANCIES */}
        <section className="about-story">
          <div>
            <span className="section-eyebrow">
              CURRENT VACANCIES
            </span>

            <h2>
              Search open roles
            </h2>
          </div>

          <div className="about-story-copy job-search-copy">
            <p>Search genuine US and UK vacancies currently available in our listings.</p>
          </div>

          <div className="public-jobs">
            <div className="public-jobs-filters" style={{ marginBottom: 22 }}>
              <label style={{ gridColumn: "1 / -1" }}>
                Search jobs
                <input
                  type="search"
                  value={keyword}
                  onChange={(event) => changeKeyword(event.target.value)}
                  placeholder="Search by job title, location, company, industry, or keyword..."
                  aria-label="Search vacancies by title, location, company, industry, or keyword"
                />
              </label>
            </div>
            {notice && <p className="public-jobs-notice">{notice}</p>}

            {jobsLoading ? (
              <p className="public-jobs-message" role="status">Loading current vacancies…</p>
            ) : jobsError ? (
              <p className="public-jobs-message public-jobs-error" role="alert">{jobsError}</p>
            ) : filteredJobs.length === 0 ? (
              <p className="public-jobs-message" role="status">
                {jobs.length === 0
                  ? "There are no current vacancies to display."
                  : "No vacancies match these filters. Try changing your search."}
              </p>
            ) : (
              <>
                <p className="public-jobs-count" role="status">
                  Showing {filteredJobs.length ? (safeCurrentPage - 1) * JOBS_PER_PAGE + 1 : 0}–{Math.min(safeCurrentPage * JOBS_PER_PAGE, filteredJobs.length)} of {filteredJobs.length} {filteredJobs.length === 1 ? "vacancy" : "vacancies"}
                  {refreshedAt && ` · Updated ${formatPostedDate(refreshedAt)}`}
                </p>
                <div className="public-jobs-grid">
                  {displayedJobs.map((job, index) => (
                    <article
                      className="public-job-card"
                      key={job.id || index}
                    >
                      <div className="public-job-card-heading">
                        <div>
                          <h3>{job.jobTitle}</h3>
                          <p className="public-job-company">{job.companyName || "Company not specified"}</p>
                        </div>
                        <span className="public-job-category">
                          {job.category === "Both" ? "IT & Non-IT" : job.category || "Category unavailable"}
                        </span>
                      </div>
                      <dl className="public-job-details">
                        <div><dt>Location</dt><dd>{job.location || (job.country === "US" ? "United States" : "United Kingdom")}</dd></div>
                        <div><dt>Country</dt><dd>{job.country || "Not specified"}</dd></div>
                        {job.workplaceType && <div><dt>Workplace</dt><dd>{job.workplaceType === "ON_SITE" ? "On-site" : job.workplaceType}</dd></div>}
                        {job.employmentType && <div><dt>Employment</dt><dd>{job.employmentType}</dd></div>}
                        {job.salary && <div><dt>Salary</dt><dd>{job.salary}</dd></div>}
                        {job.industry && <div><dt>Industry</dt><dd>{job.industry}</dd></div>}
                        {formatPostedDate(job.postedAt) && <div><dt>Posted</dt><dd>{formatPostedDate(job.postedAt)}</dd></div>}
                      </dl>
                      {job.description && <p className="public-job-description">{job.description}</p>}
                      <div className="public-job-actions">
                        {job.sourceUrl && (
                          <a href={job.sourceUrl}>
                            View Job Details
                          </a>
                        )}
                        <a className="sakevra-primary" href={`/jobs/${encodeURIComponent(job.id)}#apply`}>
                          Apply Now <span>→</span>
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
                {totalPages > 1 && (
                  <nav
                    className="public-jobs-load-more"
                    aria-label="Job results pagination"
                    style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 8 }}
                  >
                    <button
                      type="button"
                      className="sakevra-secondary"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={safeCurrentPage === 1}
                      aria-label="Previous page of jobs"
                    >Previous</button>
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                      <button
                        type="button"
                        key={page}
                        className={page === safeCurrentPage ? "sakevra-primary" : "sakevra-secondary"}
                        onClick={() => setCurrentPage(page)}
                        aria-current={page === safeCurrentPage ? "page" : undefined}
                        aria-label={`Page ${page}`}
                      >{page}</button>
                    ))}
                    <button
                      type="button"
                      className="sakevra-secondary"
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      disabled={safeCurrentPage === totalPages}
                      aria-label="Next page of jobs"
                    >Next</button>
                  </nav>
                )}
              </>
            )}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="about-final-cta">
          <span>JOIN THE Fusion Staffing Solutions</span>

          <h2>Ready for your next opportunity?</h2>

          <p>
            Share your professional profile and CV so you can be
            considered for relevant opportunities.
          </p>

          <button
            type="button"
            onClick={onJoinTalent}
          >
            Upload Your CV →
          </button>
        </section>
      </main>
    </div>
  );
}
