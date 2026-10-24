const API_ROOT = "/api/admin/recruitment";

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
  if (!response.ok) throw new Error(data?.error || "The recruitment request failed.");
  return data;
}

function jsonPost(path, payload) {
  return request(path, { method: "POST", body: JSON.stringify(payload) });
}

function jsonPatch(path, payload) {
  return request(path, { method: "PATCH", body: JSON.stringify(payload) });
}

export const recruitmentApi = {
  listLeads: () => request("/leads"),
  createLead: (payload) => jsonPost("/leads", payload),
  updateLead: (id, payload) => jsonPatch(`/leads/${encodeURIComponent(id)}`, payload),
  listRequirements: () => request("/requirements"),
  createRequirement: (payload) => jsonPost("/requirements", payload),
  updateRequirement: (id, payload) => jsonPatch(`/requirements/${encodeURIComponent(id)}`, payload),
  listAssignedJobs: () => request("/assigned-jobs"),
  matchCandidates: (id, q) => request(`/requirements/${encodeURIComponent(id)}/matches${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  searchCandidates: (q) => request(`/candidates${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  listShortlists: (requirementId) => request(`/shortlists${requirementId ? `?requirementId=${encodeURIComponent(requirementId)}` : ""}`),
  createShortlist: (payload) => jsonPost("/shortlists", payload),
  updateShortlist: (id, payload) => jsonPatch(`/shortlists/${encodeURIComponent(id)}`, payload),
  listSubmissions: () => request("/submissions"),
  createSubmission: (payload) => jsonPost("/submissions", payload),
  updateSubmission: (id, payload) => jsonPatch(`/submissions/${encodeURIComponent(id)}`, payload),
  listInterviews: () => request("/interviews"),
  createInterview: (payload) => jsonPost("/interviews", payload),
  updateInterview: (id, payload) => jsonPatch(`/interviews/${encodeURIComponent(id)}`, payload),
  listPlacements: () => request("/placements"),
  createPlacement: (payload) => jsonPost("/placements", payload),
  updatePlacement: (id, payload) => jsonPatch(`/placements/${encodeURIComponent(id)}`, payload),
  getReports: () => request("/reports"),
};
