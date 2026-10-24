const API_ROOT = "/api/admin/ra";

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
    throw new Error(data?.error || "The RA request failed.");
  }

  return data;
}

export const raApi = {
  listSources: () => request("/sources"),
  discover: (payload) =>
    request("/discover", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  discoverLive: (payload) =>
    request("/discover-live", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  searchUrl: (payload) =>
    request("/search-url", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  saveLive: (payload) =>
    request("/save-live", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  findHiringContacts: (opportunityId) =>
    request(`/opportunities/${encodeURIComponent(opportunityId)}/find-contacts`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  listOpportunities: (campaignId) => {
    const query = campaignId ? `?campaignId=${encodeURIComponent(campaignId)}` : "";
    return request(`/opportunities${query}`);
  },
  importUrl: (payload) =>
    request("/import-url", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
