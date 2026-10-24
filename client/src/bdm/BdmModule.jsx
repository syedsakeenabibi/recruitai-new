import { useState } from "react";
import CampaignsPage from "./CampaignsPage";
import JobOpportunitiesPage from "./JobOpportunitiesPage";
import CompanyLeadsPage from "./CompanyLeadsPage";
import RequirementsPage from "./RequirementsPage";
import RaModule from "../ra/RaModule";
import "./bdm.css";

export default function BdmModule({ onBack }) {
  const [page, setPage] = useState("campaigns");
  const [campaignFilter, setCampaignFilter] = useState("");
  const [notice, setNotice] = useState("");

  function openOpportunities(campaignId, isFutureSearch = false) {
    setCampaignFilter(campaignId || "");
    setNotice(
      isFutureSearch
        ? "Hiring-opportunity discovery is now handled by Research / RA."
        : ""
    );
    setPage(isFutureSearch ? "ra" : "opportunities");
  }

  return (
    <section className="bdm" aria-label="Business development module">
      <header className="bdm-header">
        <div>
          <span className="bdm-eyebrow">FUSION STAFFING SOLUTIONS</span>
          <h1>Business Development</h1>
        </div>
        {onBack && (
          <button className="bdm-button bdm-button-secondary" onClick={onBack}>
            Back to dashboard
          </button>
        )}
      </header>

      <nav className="bdm-tabs" aria-label="BDM sections">
        <button
          className={page === "campaigns" ? "is-active" : ""}
          onClick={() => setPage("campaigns")}
        >
          Campaigns
        </button>
        <button
          className={page === "opportunities" ? "is-active" : ""}
          onClick={() => {
            setCampaignFilter("");
            setNotice("");
            setPage("opportunities");
          }}
        >
          Job opportunities
        </button>
        <button className={page === "leads" ? "is-active" : ""} onClick={() => setPage("leads")}>
          Company leads
        </button>
        <button className={page === "requirements" ? "is-active" : ""} onClick={() => setPage("requirements")}>
          Requirements
        </button>
        <button
          className={page === "ra" ? "is-active" : ""}
          onClick={() => {
            setNotice("");
            setPage("ra");
          }}
        >
          Research / RA
        </button>
      </nav>

      {page === "campaigns" ? (
        <CampaignsPage
          onFindOpportunities={(campaignId) =>
            openOpportunities(campaignId, true)
          }
          onOpenOpportunities={(campaignId) =>
            openOpportunities(campaignId)
          }
        />
      ) : page === "ra" ? (
        <RaModule
          initialCampaignId={campaignFilter}
          onBack={() => setPage("campaigns")}
        />
      ) : page === "leads" ? (
        <CompanyLeadsPage />
      ) : page === "requirements" ? (
        <RequirementsPage />
      ) : (
        <JobOpportunitiesPage
          initialCampaignId={campaignFilter}
          notice={notice}
        />
      )}
    </section>
  );
}
