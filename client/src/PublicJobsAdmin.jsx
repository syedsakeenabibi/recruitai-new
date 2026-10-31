import React, { useEffect, useState } from "react";

const emptyJob = {
  title: "", companyName: "Fusion Staffing Solutions",
  category: "IT", industry: "", country: "", location: "",
  employmentType: "Full-Time", workplaceType: "On-site",
  salary: "", description: "", responsibilities: "",
  requirements: "", benefits: ""
};

const fields = [
  ["title", "Job Title *"],
  ["companyName", "Company Name"],
  ["category", "Category *"],
  ["industry", "Industry"],
  ["country", "Country"],
  ["location", "Location *"],
  ["employmentType", "Employment Type"],
  ["workplaceType", "Work Mode"],
  ["salary", "Salary / Pay Range"]
];

export default function PublicJobsAdmin() {
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({ ...emptyJob });
  const [activeView, setActiveView] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [pastedProfile, setPastedProfile] = useState("");

  async function request(url, options = {}) {
    const response = await fetch(url, {
      credentials: "include",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  async function loadJobs() {
    try {
      const data = await request("/api/public-jobs/manage");
      setJobs(data.jobs || []);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => { loadJobs(); }, []);

  function resetForm() {
    setForm({ ...emptyJob });
    setEditingId(null);
    setPastedProfile("");
  }

 
function parsePastedProfile() {
  const raw = pastedProfile
    .trim()
    .replace(/\*\*/g, "")
    .replace(/\\\s*$/gm, "");

  if (!raw) {
    setMessage("Paste a job profile first.");
    return;
  }

  const lines = raw.split(/\r?\n/).map(line => line.trim());

  const normalize = value =>
    value.replace(/^#+\s*/, "").replace(/:$/, "").trim().toLowerCase();

  const sectionNames = {
    description: ["job description", "description"],
    responsibilities: [
      "responsibilities",
      "key responsibilities",
      "duties",
      "what you will do"
    ],
    requirements: [
      "requirements / qualifications",
      "requirements and qualifications",
      "requirements",
      "qualifications",
      "skills",
      "what you bring"
    ],
    benefits: ["benefits", "benefits and perks", "perks"],
    application: [
      "how to apply",
      "application instructions",
      "application process",
      "apply now"
    ]
  };

  const metadataNames = [
    "job title", "title",
    "company name", "company",
    "category", "industry", "country",
    "location", "job location",
    "employment type",
    "work mode", "workplace type",
    "salary / pay range", "salary/pay range",
    "salary", "pay range", "compensation", "pay"
  ];

  const allSectionNames = Object.values(sectionNames).flat();

  function getHeading(line) {
    const cleaned = normalize(line);
    return allSectionNames.find(name => cleaned === name) || "";
  }

  function getValue(names) {
    const wanted = names.map(name => name.toLowerCase());
    for (const line of lines) {
      const match = line.match(/^([^:]+):\s*(.*)$/);
      if (match && wanted.includes(match[1].trim().toLowerCase())) {
        return match[2].trim();
      }
    }
    return "";
  }

  function getSection(names) {
  const start = lines.findIndex(
    line => names.includes(getHeading(line))
  );

  if (start === -1) return "";

  const result = [];

  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    const heading = getHeading(line);

    // Stop at every recognized section heading.
    if (heading) break;

    // Stop at metadata fields such as Salary or Location.
    const metadataMatch = line.match(/^([^:]+):\s*(.*)$/);
    if (
      metadataMatch &&
      metadataNames.includes(metadataMatch[1].trim().toLowerCase())
    ) {
      break;
    }

    // Ignore blank lines and Markdown separators.
    if (!line.trim() || /^[-*_]{3,}$/.test(line.trim())) {
      continue;
    }

    // Remove bullet symbols without changing the actual text.
    result.push(line.replace(/^\s*(?:[-*•✓]|\d+[.)])\s*/, ""));
  }

  return result.join("\n").trim();
}

  const title = getValue(["Job Title", "Title"]);
  const companyName = getValue(["Company Name", "Company"]);
  const categoryInput = getValue(["Category"]);
  const industry = getValue(["Industry"]);
  const country = getValue(["Country"]);
  const location = getValue(["Location", "Job Location"]);
  const salary = getValue([
    "Salary / Pay Range",
    "Salary/Pay Range",
    "Salary",
    "Pay Range",
    "Compensation",
    "Pay"
  ]);
  const employmentType = getValue(["Employment Type"]);
  const workplaceType = getValue(["Work Mode", "Workplace Type"]);

  const description = getSection(sectionNames.description);
  const responsibilities = getSection(sectionNames.responsibilities);
  const requirements = getSection(sectionNames.requirements);
  const benefits = getSection(sectionNames.benefits);
  const application = getSection(sectionNames.application);

  const categoryText = [
    title,
    industry,
    description,
    responsibilities,
    requirements
  ].join(" ").toLowerCase();

  const category = categoryInput
    ? (/^non[\s-]?it$/i.test(categoryInput) ? "Non-IT" : "IT")
    : (
        /machin|manufactur|warehouse|construction|nurse|clinical|technician|production|operator|logistics|sales|accountant|\bhr\b|chemist/.test(categoryText)
          ? "Non-IT"
          : "IT"
      );

const normalizedIndustry = industry.trim().toLowerCase();

const detectedIndustry = industry.trim()
  ? industry.trim()
  : /construction|painter|drywall|plaster|bricklayer|mason|roofer|concrete|steel fixer|scaffolder|carpenter|plumber|pipefitter/.test(
      (title + " " + description + " " + responsibilities).toLowerCase()
    )
    ? "Construction"
    : /fabricator|manufactur|machin|production|operator/.test(
        (title + " " + description + " " + responsibilities).toLowerCase()
      )
      ? "Manufacturing"
      : /chemist|chemical/.test(
          (title + " " + description).toLowerCase()
        )
        ? "Chemicals"
        : "";

  // Keep application instructions in Job Description because
  // the form does not have a separate How to Apply field.
  const finalDescription = [
    description,
    application ? `How to Apply:\n${application}` : ""
  ].filter(Boolean).join("\n\n");

  if (!title || !location || !finalDescription) {
    setMessage(
      "Please include Job Title, Location, and Job Description before parsing."
    );
    return;
  }

  setForm(current => ({
    ...current,
    title,
    companyName: companyName || current.companyName || "Fusion Staffing Solutions",
    category,
    industry: detectedIndustry,
    country,
    location,
    salary,
    employmentType: employmentType || current.employmentType,
    workplaceType: workplaceType || current.workplaceType,
    description: finalDescription,
    responsibilities,
    requirements,
    benefits
  }));

  setMessage(
    "Profile parsed successfully. Review all fields before saving or publishing."
  );
}


async function savePastedAndPublish() {
  const raw = pastedProfile.trim();

  if (!raw) {
    setMessage("Paste the complete job profile first.");
    return;
  }

  const getValue = (...labels) => {
    for (const label of labels) {
      const match = raw.match(
        new RegExp("^\\s*" + label +
          "\\s*:\\s*(.+)$", "im")
      );
      if (match) return match[1].trim();
    }
    return "";
  };

  const getSection = (labels) => {
    const lines = raw.split(/\r?\n/);
    const start = lines.findIndex(line =>
      new RegExp("^\\s*(?:" + labels.join("|") +
        ")\\s*:?\\s*$", "i").test(line.trim())
    );

    if (start < 0) return "";

    const result = [];
    for (let i = start + 1; i < lines.length; i++) {
      if (/^\s*(Job Title|Company Name|Category|Industry|Country|Location|Employment Type|Work Mode|Salary|Job Description|Responsibilities|Requirements(?:\s*\/\s*Qualifications)?|Benefits)\s*:/i.test(lines[i])) break;
      if (/^\s*(Job Description|Responsibilities|Requirements(?:\s*\/\s*Qualifications)?|Benefits)\s*:?\s*$/i.test(lines[i])) break;
      result.push(lines[i].replace(/^\s*[-•*]\s*/, ""));
    }
    return result.join("\n").trim();
  };

  const job = {
    title: getValue("Job Title", "Title"),
    companyName: getValue("Company Name", "Company") || "Fusion Staffing Solutions",
    category: getValue("Category") || "Non-IT",
    industry: getValue("Industry"),
    country: getValue("Country"),
    location: getValue("Location", "Job Location"),
    employmentType: getValue("Employment Type") || "Full-Time",
    workplaceType: getValue("Work Mode", "Workplace Type") || "On-site",
    salary: getValue("Salary / Pay Range", "Salary", "Pay Range"),
    description: getSection(["Job Description"]) ||
      getValue("Job Description"),
    responsibilities: getSection(["Responsibilities"]),
    requirements: getSection(["Requirements / Qualifications", "Requirements", "Qualifications"]),
    benefits: getSection(["Benefits"])
  };

  if (!job.title || !job.location || !job.description) {
    setMessage("Include Job Title, actual Location, and Job Description in your pasted profile.");
    return;
  }

  setBusy(true);
  setMessage("");

  try {
    const result = await request("/api/public-jobs", {
      method: "POST",
      body: JSON.stringify(job)
    });

    const id = result.job?.id;
    if (!id) throw new Error("Job was saved, but its ID was not returned.");

    await request(`/api/public-jobs/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "PUBLISHED" })
    });

    setPastedProfile("");
    await loadJobs();
    setMessage("Job published successfully.");
  } catch (error) {
    setMessage(error.message);
  } finally {
    setBusy(false);
  }
}
async function saveJob(event) {
  event.preventDefault();

  const status = event.nativeEvent.submitter?.value || "DRAFT";

  if (!form.title.trim() || !form.location.trim() ||
      !form.description.trim()) {
    setMessage("Please fill in Job Title, Location, and Job Description.");
    return;
  }

  setBusy(true);
  setMessage("");

  try {
    const url = editingId
      ? `/api/public-jobs/${editingId}`
      : "/api/public-jobs";

    await request(url, {
      method: editingId ? "PUT" : "POST",
      body: JSON.stringify({
        ...form,
        status
      })
    });

    resetForm();

    // Reload saved jobs from the backend/database.
    await loadJobs();

    setMessage(
      status === "PUBLISHED"
        ? "Job published successfully."
        : "Job saved as draft successfully."
    );
  } catch (error) {
    setMessage(`Unable to save job: ${error.message}`);
  } finally {
    setBusy(false);
  }
}

  async function changeStatus(id, status) {
    if (!window.confirm(`Change this job to ${status}?`)) return;
    setBusy(true);
    try {
      await request(`/api/public-jobs/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      await loadJobs();
      setMessage(`Job status changed to ${status}.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteJob(id) {
    if (!window.confirm("Permanently delete this job?")) return;
    setBusy(true);
    try {
      await request(`/api/public-jobs/${id}`, { method: "DELETE" });
      await loadJobs();
      setMessage("Job deleted.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  const inputStyle = {
    width: "100%", padding: "12px", borderRadius: 10,
    border: "1px solid #d7dfe8", boxSizing: "border-box"
  };

  const buttonStyle = {
    border: 0, borderRadius: 8, padding: "9px 13px",
    cursor: "pointer", background: "#173d68", color: "#fff"
  };

 return (
  <div
    style={{
      padding: 24,
      maxWidth: 1400,
      margin: "auto",
      display: "grid",
      gridTemplateColumns: "220px minmax(0, 1fr)",
      gap: 24,
      alignItems: "start",
      minHeight: "80vh",
      color: "#17365d",
    }}
  >
    <aside
      style={{
        background: "#17365d",
        color: "#fff",
        borderRadius: 14,
        padding: 16,
        position: "sticky",
        top: 20,
      }}
    >
      <h3 style={{ margin: "4px 0 24px" }}>Job Management</h3>

      <button
        type="button"
        onClick={() => {
          resetForm();
          setMessage("");
          setActiveView("create");
        }}
        style={{
          display: "block",
          width: "100%",
          padding: 12,
          marginBottom: 10,
          border: 0,
          borderRadius: 8,
          textAlign: "left",
          cursor: "pointer",
          background: activeView === "create" ? "#fff" : "#254a73",
          color: activeView === "create" ? "#17365d" : "#fff",
          fontWeight: 600,
        }}
      >
        ＋ Create Job
      </button>

      <button
        type="button"
        onClick={async () => {
          setActiveView("all");
          setMessage("");
          await loadJobs();
        }}
        style={{
          display: "block",
          width: "100%",
          padding: 12,
          border: 0,
          borderRadius: 8,
          textAlign: "left",
          cursor: "pointer",
          background: activeView === "all" ? "#fff" : "#254a73",
          color: activeView === "all" ? "#17365d" : "#fff",
          fontWeight: 600,
        }}
      >
        ▤ Manage Jobs ({jobs.length})
      </button>
    </aside>

<main style={{ minWidth: 0, width: "100%" }}>
  {activeView === "create" && (
  <>
    <h1>Manage Jobs</h1>
      <p>Create and manage vacancies published on Fusion Staffing Solutions.</p>
      {message && <p role="status">{message}</p>}

      <section style={{ background: "#f8fafc", padding: 18, borderRadius: 14, border: "1px solid #e2e8f0", marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>Paste a Job Profile</h2>
        <p>Paste the full job description. We will fill the fields we can detect; review everything before saving.</p>
        <textarea rows={7} value={pastedProfile} onChange={e => setPastedProfile(e.target.value)}
          placeholder={"Job Title: CNC Machinist\\nLocation: New York, NY\\nCompany: Example Company\\nJob Description: ...\\nResponsibilities\\n- ...\\nRequirements\\n- ..."}
          style={{
  ...inputStyle,
  color: "#172033",
  WebkitTextFillColor: "#172033",
  backgroundColor: "#ffffff",
  caretColor: "#172033",
  opacity: 1,
  fontFamily: "Arial, sans-serif",
  fontSize: "15px",
  lineHeight: 1.6,
}}
/>

    <button
  type="button"
  style={{ ...buttonStyle, marginTop: 10 }}
  onClick={parsePastedProfile}
>
  Parse Profile into Form
</button>

{/* ADD THE NEW BUTTON HERE */}
<button
  type="button"
  style={{ ...buttonStyle, marginTop: 10, marginLeft: 10 }}
  disabled={busy}
  onClick={savePastedAndPublish}
>
  {busy ? "Publishing..." : "Save & Publish Job"}
</button>

</section>
 <form onSubmit={saveJob} style={{
        background: "#fff", padding: 22, borderRadius: 16,
        border: "1px solid #e2e8f0", marginBottom: 28
      }}>
        <h2>{editingId ? "Edit Job" : "Add New Job"}</h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16
        }}>
          {fields.map(([key, label]) => (
            <label key={key} style={{ display: "grid", gap: 6 }}>
              <strong>{label}</strong>
              {key === "category" || key === "employmentType" || key === "workplaceType" ? (
                <select style={inputStyle} value={form[key] || ""}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}>
                  {(key === "category"
                    ? ["IT", "Non-IT"]
                    : key === "employmentType"
                    ? ["Full-Time", "Part-Time", "Contract", "Contract-to-Hire", "Internship"]
                    : ["On-site", "Remote", "Hybrid"]
                  ).map(option => <option key={option}>{option}</option>)}
                </select>
              ) : (
                <input style={inputStyle} value={form[key] || ""}
                  required={["title", "location"].includes(key)}
                  onChange={e => setForm({ ...form, [key]: e.target.value })} />
              )}
            </label>
          ))}
        </div>

        {[
          ["description", "Job Description *"],
          ["responsibilities", "Responsibilities"],
          ["requirements", "Requirements / Qualifications"],
          ["benefits", "Benefits"]
        ].map(([key, label]) => (
          <label key={key} style={{ display: "grid", gap: 6, marginTop: 16 }}>
            <strong>{label}</strong>
            <textarea rows={key === "description" ? 5 : 3}
              style={inputStyle} value={form[key] || ""}
              required={key === "description"}
              onChange={e => setForm({ ...form, [key]: e.target.value })} />
          </label>
        ))}

       <div
  style={{
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 20
  }}
>
  <button
    type="submit"
    value="DRAFT"
    style={buttonStyle}
    disabled={busy}
  >
    {busy ? "Saving..." : "Save as Draft"}
  </button>

  <button
    type="submit"
    value="PUBLISHED"
    style={{
      ...buttonStyle,
      background: "#f15b3d"
    }}
    disabled={busy}
  >
    {busy ? "Saving..." : "Save & Publish Job"}
  </button>

  {editingId && (
    <button
      type="button"
      style={{
        ...buttonStyle,
        background: "#64748b"
      }}
      disabled={busy}
      onClick={resetForm}
    >
      Cancel Edit
    </button>
  )}
</div>
      </form>
        </>
)}
     {activeView === "all" && (
  <section style={{ marginTop: 24 }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
        marginBottom: 20
      }}
    >
      <div>
        <h2 style={{ margin: 0 }}>All Jobs ({jobs.length})</h2>
        <p style={{ color: "#64748b", marginTop: 6 }}>
          View and manage your saved vacancies.
        </p>
      </div>

      <button
        type="button"
        style={{ ...buttonStyle, background: "#f15b3d" }}
        onClick={() => {
          resetForm();
          setActiveView("create");
          setMessage("");
        }}
      >
        + Add New Job
      </button>
    </div>

    <div style={{ display: "grid", gap: 14 }}>
      {jobs.map(job => (
        <article
          key={job.id}
          style={{
            background: "#fff",
            padding: 20,
            borderRadius: 14,
            border: "1px solid #e2e8f0"
          }}
        >
          <h3 style={{ margin: "0 0 8px" }}>{job.title}</h3>

          <p style={{ color: "#64748b" }}>
            {job.companyName} · {job.location} · {job.category}
            {job.industry ? ` · ${job.industry}` : ""}
          </p>

          <p>
            <strong>Status:</strong> {job.status}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button
              type="button"
              style={buttonStyle}
              disabled={busy}
              onClick={() => {
                setEditingId(job.id);
                setForm(
                  Object.fromEntries(
                    Object.keys(emptyJob).map(key => [
                      key,
                      job[key] ?? emptyJob[key]
                    ])
                  )
                );
                setActiveView("create");
                setMessage("");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Edit
            </button>

            {job.status !== "PUBLISHED" && (
              <button
                type="button"
                style={buttonStyle}
                disabled={busy}
                onClick={() => changeStatus(job.id, "PUBLISHED")}
              >
                Publish
              </button>
            )}

            {job.status === "PUBLISHED" && (
              <button
                type="button"
                style={buttonStyle}
                disabled={busy}
                onClick={() => changeStatus(job.id, "CLOSED")}
              >
                Close
              </button>
            )}

            {job.status !== "DRAFT" && (
              <button
                type="button"
                style={buttonStyle}
                disabled={busy}
                onClick={() => changeStatus(job.id, "DRAFT")}
              >
                Draft
              </button>
            )}

            <button
              type="button"
              style={{ ...buttonStyle, background: "#b42318" }}
              disabled={busy}
              onClick={() => deleteJob(job.id)}
            >
              Delete
            </button>

            {job.status === "PUBLISHED" && (
              <button
                type="button"
                style={buttonStyle}
                onClick={() => {
                  const slug = String(job.title || "job")
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "");

                  navigator.clipboard.writeText(
                    `${window.location.origin}/jobs/${job.id}-${slug}`
                  );

                  setMessage("Job link copied.");
                }}
              >
                Copy Job Link
              </button>
            )}
          </div>
        </article>
      ))}

      {jobs.length === 0 && (
        <p>No saved jobs yet. Select Add New Job to create one.</p>
      )}
    </div>
  </section>
)}
    </main>
  </div>
  );
}