import { useEffect, useState } from "react";
import { bdmApi } from "./bdmApi";
import JobOpportunityForm from "./JobOpportunityForm";

export default function JobOpportunitiesPage({ initialCampaignId = "", notice = "" }) {
  const [opportunities, setOpportunities] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignFilter, setCampaignFilter] = useState(initialCampaignId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [panel, setPanel] = useState("");
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [opportunityResult, campaignResult] = await Promise.all([
        bdmApi.listOpportunities(campaignFilter),
        bdmApi.listCampaigns(),
      ]);
      setOpportunities(opportunityResult.opportunities);
      setCampaigns(campaignResult.campaigns);
    } catch (loadError) {
      setError(loadError.message);
      throw loadError;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setCampaignFilter(initialCampaignId || "");
  }, [initialCampaignId]);

  useEffect(() => {
    loadData().catch(() => {});
  }, [campaignFilter]);

  function openPanel(nextPanel, opportunity = null) {
    setSelectedOpportunity(opportunity);
    setPanel(nextPanel);
    setError("");
  }

  async function saveOpportunity(payload) {
    if (panel === "edit" && selectedOpportunity) {
      await bdmApi.updateOpportunity(selectedOpportunity.id, payload);
    } else {
      await bdmApi.createOpportunity(payload);
    }
    await loadData();
    setPanel("");
  }

  async function deleteOpportunity(opportunity) {
    if (!window.confirm(`Delete opportunity "${opportunity.jobTitle}"?`)) return;
    setError("");
    try {
      await bdmApi.deleteOpportunity(opportunity.id);
      await loadData();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <section className="bdm-section">
      <div className="bdm-section-heading">
        <div>
          <h2>Job opportunities</h2>
          <p>Record and review manually sourced opportunities. Portal discovery is not enabled.</p>
        </div>
        <button className="bdm-button" onClick={() => openPanel("create")}>
          Add opportunity
        </button>
      </div>

      {notice && <p className="bdm-notice" role="status">{notice}</p>}
      {error && <p className="bdm-error" role="alert">{error}</p>}

      <div className="bdm-filter">
        <label className="bdm-field">
          Campaign
          <select value={campaignFilter} onChange={(event) => setCampaignFilter(event.target.value)}>
            <option value="">All campaigns</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="bdm-muted" role="status">Loading opportunities...</p>
      ) : opportunities.length === 0 ? (
        <div className="bdm-empty">
          <h3>No opportunities found</h3>
          <p>Add a manually sourced opportunity to keep it with your BDM work.</p>
        </div>
      ) : (
        <div className="bdm-table-wrap">
          <table className="bdm-table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Company</th>
                <th>Location</th>
                <th>Campaign</th>
                <th>Status</th>
                <th>Discovered</th>
                <th><span className="bdm-visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((opportunity) => (
                <tr key={opportunity.id}>
                  <td>
                    <strong>{opportunity.jobTitle}</strong>
                    <span className="bdm-table-subtitle">{opportunity.country} · {opportunity.source}</span>
                  </td>
                  <td>{opportunity.companyName || "—"}</td>
                  <td>{opportunity.location || "—"}</td>
                  <td>{campaigns.find((campaign) => campaign.id === opportunity.campaignId)?.name || "—"}</td>
                  <td><span className={`bdm-status bdm-status-${opportunity.status.toLowerCase()}`}>{opportunity.status.replaceAll("_", " ")}</span></td>
                  <td>{formatDate(opportunity.discoveredAt)}</td>
                  <td>
                    <div className="bdm-row-actions">
                      <button className="bdm-link-button" onClick={() => openPanel("view", opportunity)}>View</button>
                      <button className="bdm-link-button" onClick={() => openPanel("edit", opportunity)}>Edit</button>
                      <button className="bdm-link-button bdm-danger-link" onClick={() => deleteOpportunity(opportunity)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {panel && (
        <div className="bdm-panel">
          <JobOpportunityForm
            key={`${panel}-${selectedOpportunity?.id || "new"}`}
            opportunity={selectedOpportunity}
            campaigns={campaigns}
            initialCampaignId={campaignFilter}
            onSave={saveOpportunity}
            onCancel={() => setPanel("")}
            readOnly={panel === "view"}
          />
        </div>
      )}
    </section>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}
