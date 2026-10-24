import { useEffect, useState } from "react";
import { bdmApi } from "./bdmApi";
import { recruitmentApi } from "../recruitment/recruitmentApi";

const LEAD_STATUSES = [
  "TARGET", "CONTACTED", "RESPONDED", "INTERESTED",
  "REQUIREMENT_CONFIRMED", "HANDED_TO_RECRUITER", "CLOSED", "LOST",
];
const OUTREACH_NOTES_PREFIX = "[FUSION OUTREACH V1]\n";

export default function CompanyLeadsPage() {
  const [leads, setLeads] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [drafts, setDrafts] = useState({});
  const [verifiedContacts, setVerifiedContacts] = useState({});
  const [adminEmail, setAdminEmail] = useState("");

  async function load() {
    try {
      const [leadResult, opportunityResult, campaignResult, identityResponse] = await Promise.all([
        recruitmentApi.listLeads(),
        bdmApi.listOpportunities(),
        bdmApi.listCampaigns(),
        fetch("/api/admin/me", { credentials: "include" }),
      ]);
      const identity = await identityResponse.json();
      if (!identityResponse.ok) throw new Error(identity.error || "Unable to verify the current admin session.");
      setError("");
      setLeads(leadResult.leads || []);
      setOpportunities(opportunityResult.opportunities || []);
      setCampaigns(campaignResult.campaigns || []);
      setAdminEmail(identity.admin?.email || "");
      setDrafts(Object.fromEntries((leadResult.leads || []).map((lead) => [
        lead.id,
        parseLeadNotes(lead.notes).outreach,
      ]).filter(([, outreach]) => outreach)));
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => {
    load().catch((loadError) => setError(loadError.message));
  }, []);

  async function createLead(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setError("");
    setNotice("");
    const form = new FormData(formElement);
    const payload = Object.fromEntries(form.entries());
    for (const key of Object.keys(payload)) if (!payload[key]) payload[key] = null;
    if (!payload.companyName && !payload.opportunityId && !payload.sourceUrl) {
      setError("Provide a company name, source URL, or link an existing opportunity.");
      return;
    }
    setBusy(true);
    try {
      await recruitmentApi.createLead(payload);
      formElement.reset();
      setFormOpen(false);
      setNotice("Company lead saved.");
      await load();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(lead, status) {
    setError("");
    try {
      await recruitmentApi.updateLead(lead.id, { status });
      await load();
    } catch (updateError) {
      setError(updateError.message);
    }
  }

  function startDraft(lead) {
    const current = drafts[lead.id] || parseLeadNotes(lead.notes).outreach;
    if (current) {
      setDrafts((previous) => ({ ...previous, [lead.id]: current }));
      return;
    }
    const companyName = lead.companyName || "your organization";
    const role = lead.hiringSignal || lead.opportunityJobTitle || "your advertised opening";
    setDrafts((previous) => ({
      ...previous,
      [lead.id]: {
        subject: `Staffing support for ${role}`,
        body: [
          "Hello Hiring Team,",
          "",
          `I noticed the publicly advertised ${role} opening at ${companyName}. Fusion Staffing Solutions supports employers with recruitment across IT and non-IT roles.`,
          "",
          "If you are open to discussing external staffing support for this vacancy, please let us know the appropriate process and any supplier requirements. A public posting alone does not tell us whether external submissions are accepted.",
          lead.sourceUrl ? `\nPublic job posting: ${lead.sourceUrl}` : "",
          "",
          "Regards,",
          "Fusion Staffing Solutions",
        ].filter(Boolean).join("\n"),
        events: [],
      },
    }));
  }

  function updateDraft(leadId, field, value) {
    setDrafts((previous) => ({
      ...previous,
      [leadId]: { ...previous[leadId], [field]: value },
    }));
  }

  async function saveDraft(lead) {
    const draft = drafts[lead.id];
    if (!draft?.subject?.trim() || !draft?.body?.trim()) {
      setError("Add both a subject and message before saving the outreach draft.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const parsed = parseLeadNotes(lead.notes);
      const priorApproval = draft.events?.filter((event) => event.type === "HUMAN_APPROVED").at(-1);
      const approvalIsCurrent = priorApproval
        && priorApproval.subject === draft.subject
        && priorApproval.body === draft.body
        && priorApproval.recipient === lead.contactEmail;
      const outreach = {
        ...draft,
        status: approvalIsCurrent ? "APPROVED" : "DRAFT",
        events: [...(draft.events || []), {
          type: "DRAFT_SAVED",
          at: new Date().toISOString(),
          actor: adminEmail || "Authenticated admin",
        }],
      };
      await recruitmentApi.updateLead(lead.id, {
        notes: encodeLeadNotes(parsed.userNotes, outreach),
      });
      setDrafts((previous) => ({ ...previous, [lead.id]: outreach }));
      setNotice("Outreach draft saved. No email was sent.");
      await load();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  async function approveDraft(lead) {
    const draft = drafts[lead.id];
    if (!draft?.subject?.trim() || !draft?.body?.trim()) {
      setError("Save a complete draft before approving it.");
      return;
    }
    if (!lead.contactEmail || !lead.contactSource || !verifiedContacts[lead.id]) {
      setError("Before approval, record a sourced business email and confirm that you verified the contact and lawful basis.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const parsed = parseLeadNotes(lead.notes);
      const approval = {
        type: "HUMAN_APPROVED",
        at: new Date().toISOString(),
        actor: adminEmail || "Authenticated admin",
        recipient: lead.contactEmail,
        contactSource: lead.contactSource,
        humanVerifiedAndLawfulBasisConfirmed: true,
        subject: draft.subject,
        body: draft.body,
      };
      const outreach = {
        ...draft,
        status: "APPROVED",
        events: [...(draft.events || []), approval],
      };
      await recruitmentApi.updateLead(lead.id, {
        notes: encodeLeadNotes(parsed.userNotes, outreach),
      });
      setDrafts((previous) => ({ ...previous, [lead.id]: outreach }));
      setNotice("Human approval recorded. Email sending is not connected; nothing was sent.");
      await load();
    } catch (approvalError) {
      setError(approvalError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rw-panel">
      <div className="rw-heading">
        <div><h2>Company Leads</h2><p>Track hiring companies and BDM follow-up. Unknown contact details stay blank.</p></div>
        <button className="rw-primary" onClick={() => { setError(""); setFormOpen(!formOpen); }}>{formOpen ? "Close form" : "Add company lead"}</button>
      </div>
      {error && <p className="rw-error" role="alert">{error}</p>}
      {notice && <p className="rw-notice" role="status">{notice}</p>}
      {formOpen && (
        <form className="rw-form" onSubmit={createLead}>
          <label>Existing opportunity
            <select name="opportunityId" defaultValue="">
              <option value="">No linked opportunity</option>
              {opportunities.map((item) => <option key={item.id} value={item.id}>{item.companyName || "Unknown company"} — {item.jobTitle}</option>)}
            </select>
          </label>
          <label>Campaign<select name="campaignId" defaultValue=""><option value="">No campaign</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select></label>
          <label>Company name<input name="companyName" /></label>
          <label>Company website<input name="companyWebsite" type="url" /></label>
          <label>Country<input name="country" /></label>
          <label>Location<input name="location" /></label>
          <label>Industry<input name="industry" /></label>
          <label>Lead source<input name="source" /></label>
          <label>Source URL<input name="sourceUrl" type="url" /></label>
          <label>Hiring signal<input name="hiringSignal" /></label>
          <label>Contact name<input name="contactName" /></label>
          <label>Contact title<input name="contactTitle" /></label>
          <label>Contact email<input name="contactEmail" type="email" /></label>
          <label>Contact LinkedIn URL<input name="contactLinkedInUrl" type="url" /></label>
          <label>Contact source<input name="contactSource" /></label>
          <label>Notes<textarea name="notes" rows="3" /></label>
          <button className="rw-primary" disabled={busy}>{busy ? "Saving..." : "Save lead"}</button>
        </form>
      )}
      {!leads.length ? <div className="rw-empty">No company leads yet. Create a lead from a real opportunity or enter verified company information.</div> : (
        <div className="rw-record-list">
          {leads.map((lead) => {
            const draft = drafts[lead.id];
            const latestApproval = draft?.events?.filter((event) => event.type === "HUMAN_APPROVED").at(-1);
            const approval = latestApproval
              && latestApproval.subject === draft.subject
              && latestApproval.body === draft.body
              && latestApproval.recipient === lead.contactEmail
              ? latestApproval
              : null;
            const verifiedRecipient = approval?.recipient === lead.contactEmail;
            return (
              <article className="rw-record" key={lead.id}>
                <div className="rw-record-title"><div><h3>{lead.companyName || "Company not specified"}</h3><p>{lead.opportunityJobTitle || lead.industry || "Hiring lead"}</p></div>
                  <select aria-label={`Status for ${lead.companyName || "lead"}`} value={lead.status} onChange={(event) => changeStatus(lead, event.target.value)}>
                    {LEAD_STATUSES.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </div>
                <div className="rw-meta"><span>{lead.country || "Country unknown"}</span><span>{lead.location || "Location unknown"}</span><span>{lead.contactName || "No contact recorded"}</span><span>{verifiedRecipient ? lead.contactEmail : "Contact not verified"}</span></div>
                {lead.sourceUrl && <a href={lead.sourceUrl} target="_blank" rel="noreferrer">Open source</a>}
                <div className="rw-outreach">
                  <h4>Employer outreach</h4>
                  {!draft && <button type="button" className="rw-secondary" onClick={() => startDraft(lead)}>Create email draft</button>}
                  {draft && (
                    <>
                      <label>Subject<input value={draft.subject || ""} onChange={(event) => updateDraft(lead.id, "subject", event.target.value)} /></label>
                      <label>Draft message<textarea rows="7" value={draft.body || ""} onChange={(event) => updateDraft(lead.id, "body", event.target.value)} /></label>
                      <p>{lead.contactEmail && lead.contactSource ? `Proposed recipient: ${lead.contactEmail}` : "Contact not verified. Find a lawful, sourced business contact before approval."}</p>
                      <label className="rw-outreach-consent">
                        <input type="checkbox" checked={Boolean(verifiedContacts[lead.id])} onChange={(event) => setVerifiedContacts((previous) => ({ ...previous, [lead.id]: event.target.checked }))} />
                        I verified this business contact and confirmed a lawful basis for this outreach.
                      </label>
                      {approval && <p role="status">Human approval recorded on {new Date(approval.at).toLocaleString()} by {approval.actor}. No email was sent.</p>}
                      <div className="rw-outreach-actions">
                        <button type="button" className="rw-secondary" disabled={busy} onClick={() => saveDraft(lead)}>Save draft</button>
                        <button type="button" className="rw-secondary" disabled={busy || !lead.contactEmail || !lead.contactSource || !verifiedContacts[lead.id] || Boolean(approval)} onClick={() => approveDraft(lead)}>Approve draft</button>
                      </div>
                      <p className="rw-muted">Email sending is not connected. Approval records human review only; no message is sent.</p>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function parseLeadNotes(value) {
  const notes = typeof value === "string" ? value : "";
  if (!notes.startsWith(OUTREACH_NOTES_PREFIX)) {
    return { userNotes: notes, outreach: null };
  }
  try {
    const parsed = JSON.parse(notes.slice(OUTREACH_NOTES_PREFIX.length));
    return {
      userNotes: typeof parsed.userNotes === "string" ? parsed.userNotes : "",
      outreach: parsed.outreach && typeof parsed.outreach === "object" ? parsed.outreach : null,
    };
  } catch {
    return { userNotes: notes, outreach: null };
  }
}

function encodeLeadNotes(userNotes, outreach) {
  return `${OUTREACH_NOTES_PREFIX}${JSON.stringify({
    userNotes: userNotes || "",
    outreach,
  })}`;
}
