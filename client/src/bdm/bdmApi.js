const API_ROOT = "/api/admin/bdm";

async function request(path, options = {}) {
  const response = await fetch(`${API_ROOT}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const data = response.status === 204 ? null : await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "The BDM request failed.");
  }

  return data;
}

export const bdmApi = {
  listCampaigns: () => request("/campaigns"),
  getCampaign: (id) => request(`/campaigns/${encodeURIComponent(id)}`),
  createCampaign: (campaign) =>
    request("/campaigns", {
      method: "POST",
      body: JSON.stringify(campaign),
    }),
  updateCampaign: (id, campaign) =>
    request(`/campaigns/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(campaign),
    }),
  deleteCampaign: (id) =>
    request(`/campaigns/${encodeURIComponent(id)}`, { method: "DELETE" }),
  listOpportunities: (campaignId) => {
    const query = campaignId
      ? `?campaignId=${encodeURIComponent(campaignId)}`
      : "";
    return request(`/opportunities${query}`);
  },
  getOpportunity: (id) =>
    request(`/opportunities/${encodeURIComponent(id)}`),
  createOpportunity: (opportunity) =>
    request("/opportunities", {
      method: "POST",
      body: JSON.stringify(opportunity),
    }),
  updateOpportunity: (id, opportunity) =>
    request(`/opportunities/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(opportunity),
    }),
  deleteOpportunity: (id) =>
    request(`/opportunities/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};
