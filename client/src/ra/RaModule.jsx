import { useEffect, useMemo, useState } from "react";
import { bdmApi } from "../bdm/bdmApi";
import RaDiscoveryPage from "./RaDiscoveryPage";
import { raApi } from "./raApi";
import "./ra.css";

export default function RaModule({ onBack, initialCampaignId = "" }) {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState(initialCampaignId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState("discovery");
  const [sources, setSources] = useState(null);

  useEffect(() => {
    async function loadCampaigns() {
      try {
        setLoading(true);
        const result = await bdmApi.listCampaigns();
        setCampaigns(result.campaigns || []);

        if (initialCampaignId) {
  setSelectedCampaignId(initialCampaignId);
} else {
  setSelectedCampaignId("");
}

      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }

    loadCampaigns().catch(() => {});
  }, [initialCampaignId]);

  useEffect(() => {
    if (page !== "sources") return;
    raApi.listSources()
      .then((result) => setSources(result.sources || []))
      .catch((loadError) => {
        setError(loadError.message);
        setSources([]);
      });
  }, [page]);

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.id === selectedCampaignId) || null,
    [campaigns, selectedCampaignId]
  );

  return (
    <section className="ra" aria-label="Research associate module">
      <header className="ra-header">
        <div>
          <span className="ra-eyebrow">FUSION STAFFING SOLUTIONS</span>
          <h1>{page === "sources" ? "Research Sources" : page === "opportunities" ? "RA Opportunities" : "Research / RA"}</h1>
        </div>
        {onBack && (
          <button className="ra-button ra-button-secondary" onClick={onBack}>
            Back to dashboard
          </button>
        )}
      </header>

      {loading ? (
        <p className="ra-muted">Loading campaigns...</p>
      ) : error ? (
        <p className="ra-error">{error}</p>
      ) : (
        <>
          <nav className="ra-tabs" aria-label="Research associate sections">
            <button className={page === "discovery" ? "is-active" : ""} onClick={() => setPage("discovery")}>Discovery</button>
            <button className={page === "opportunities" ? "is-active" : ""} onClick={() => setPage("opportunities")}>Opportunities</button>
            <button className={page === "sources" ? "is-active" : ""} onClick={() => setPage("sources")}>Sources</button>
          </nav>
          {page === "sources" ? (
            <div className="ra-panel ra-sources-panel">
              {error && <p className="ra-error" role="alert">{error}</p>}
              <div>
                <h2>Discovery sources</h2>
                <p>Public ATS adapters are queried on demand. A live connection is reported only after an actual provider response in Discovery.</p>
              </div>
              {sources === null ? <p className="ra-muted">Loading source access information...</p> : (
                <div className="ra-catalogue" aria-label="Job source access">
                  {sources.map((source) => (
                    <article className="ra-catalogue-item" key={source.provider}>
                      <strong>{source.provider.replace(/_/g, " ")}</strong>
                      <span className={source.access === "LIVE API" ? "ra-source-live" : "ra-source-error"}>{source.access}</span>
                      {source.access === "LIVE API" && <span>{source.boardCount} configured public board{source.boardCount === 1 ? "" : "s"}; connection checked during discovery</span>}
                      {source.access === "AUTHORIZATION REQUIRED" && <span>Official credentials or permission are required before integration.</span>}
                      {source.access === "MANUAL LINK" && <span>Import an original public vacancy URL under Opportunities.</span>}
                    </article>
                  ))}
                </div>
              )}
              <p className="ra-muted">Restricted portals and social platforms are not scraped. Their links or feeds require authorization.</p>
            </div>
          ) : (
            <div className="ra-page-content">
              <div className="ra-campaign-picker">
                <label>
                  <span>Campaign</span>
                  <select
                    value={selectedCampaign?.id || ""}
                    onChange={(event) => setSelectedCampaignId(event.target.value)}
                  >
                    <option value="">Select a campaign</option>
                    {campaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <RaDiscoveryPage
                key={selectedCampaignId || "no-campaign"}
                campaigns={campaigns}
                campaign={selectedCampaign}
                initialCampaignId={selectedCampaignId}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}
