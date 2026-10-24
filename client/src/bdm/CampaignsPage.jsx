import { useEffect, useState } from "react";
import { bdmApi } from "./bdmApi";
import CampaignForm from "./CampaignForm";

export default function CampaignsPage({
  onFindOpportunities,
  onOpenOpportunities,
}) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [panel, setPanel] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  async function loadCampaigns() {
    setLoading(true);
    setError("");
    try {
      const result = await bdmApi.listCampaigns();
      setCampaigns(result.campaigns);
    } catch (loadError) {
      setError(loadError.message);
      throw loadError;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCampaigns().catch(() => {});
  }, []);

  function openPanel(nextPanel, campaign = null) {
    setSelectedCampaign(campaign);
    setPanel(nextPanel);
    setError("");
  }

  async function saveCampaign(payload) {
    if (panel === "edit" && selectedCampaign) {
      await bdmApi.updateCampaign(selectedCampaign.id, payload);
    } else {
      await bdmApi.createCampaign(payload);
    }
    await loadCampaigns();
    setPanel("");
  }

  async function deleteCampaign(campaign) {
    if (!window.confirm(`Delete campaign "${campaign.name}"?`)) return;
    setError("");
    try {
      await bdmApi.deleteCampaign(campaign.id);
      await loadCampaigns();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <section className="bdm-section">
      <div className="bdm-section-heading">
        <div>
          <h2>Campaigns</h2>
          <p>Organize target roles and track opportunities by campaign.</p>
        </div>
        <button className="bdm-button" onClick={() => openPanel("create")}>
          Create campaign
        </button>
      </div>

      {error && <p className="bdm-error" role="alert">{error}</p>}
      {loading ? (
        <p className="bdm-muted" role="status">Loading campaigns...</p>
      ) : campaigns.length === 0 ? (
        <div className="bdm-empty">
          <h3>No campaigns yet</h3>
          <p>Create a campaign to start organizing business development work.</p>
        </div>
      ) : (
        <div className="bdm-table-wrap">
          <table className="bdm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Country</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Updated</th>
                <th><span className="bdm-visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td>
                    <strong>{campaign.name}</strong>
                    <span className="bdm-table-subtitle">
                      {(campaign.roles || []).join(", ") || "No roles specified"}
                    </span>
                  </td>
                  <td>{campaign.country}</td>
                  <td><span className={`bdm-status bdm-status-${campaign.status.toLowerCase()}`}>{campaign.status}</span></td>
                  <td>{campaign.priority}</td>
                  <td>{formatDate(campaign.updatedAt)}</td>
                  <td>
                    <div className="bdm-row-actions">
                      <button className="bdm-link-button" onClick={() => openPanel("view", campaign)}>View</button>
                      <button className="bdm-link-button" onClick={() => openPanel("edit", campaign)}>Edit</button>
                      <button className="bdm-link-button" onClick={() => onOpenOpportunities(campaign.id)}>Opportunities</button>
                      <button className="bdm-link-button" onClick={() => onFindOpportunities(campaign.id)}>Find Hiring Opportunities</button>
                      <button className="bdm-link-button bdm-danger-link" onClick={() => deleteCampaign(campaign)}>Delete</button>
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
          <CampaignForm
            key={`${panel}-${selectedCampaign?.id || "new"}`}
            campaign={selectedCampaign}
            onSave={saveCampaign}
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
