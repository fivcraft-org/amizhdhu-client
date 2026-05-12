import api from "./axios";

// Hiring & Candidates
export const apiGetCandidates = (params) => {
  return api.get("/hr/candidates", { params });
};

export const apiCreateCandidate = (payload) => {
  return api.post("/hr/candidates", payload);
};

export const apiConvertToEmployee = (candidateId, payload) => {
  return api.post(`/hr/candidates/${candidateId}/convert`, payload);
};

export const apiUpdateCandidateStatus = (id, payload) => {
  return api.patch(`/hr/candidates/${id}/status`, payload);
};

export const apiAddInterviewRound = (candidateId, payload) => {
  return api.post(`/hr/candidates/${candidateId}/interviews`, payload);
};

export const apiGetHiringRequirements = () => {
  return api.get("/hr/hiring-requirements");
};

export const apiGetExits = (params) => {
  return api.get("/hr/terminations", { params });
};

export const apiInitiateTermination = (payload) => {
  return api.post("/hr/terminations", payload);
};

export const apiUpdateExitStatus = (id, payload) => {
  return api.patch(`/hr/terminations/${id}/status`, payload);
};

// Hiring Requests (New Backend Structure)
export const apiGetHiringRequests = (params) => {
  return api.get("/hiring-requests", { params });
};

export const apiCreateHiringRequest = (payload) => {
  return api.post("/hiring-requests", payload);
};

export const apiUpdateHiringRequest = (id, payload) => {
  return api.put(`/hiring-requests/${id}`, payload);
};

export const apiDeleteHiringRequest = (id) => {
  return api.delete(`/hiring-requests/${id}`);
};

export const apiUpdateHiringRequestStatus = (id, payload) => {
  return api.patch(`/hiring-requests/${id}/status`, payload);
};

export const apiPublishHiringRequest = (id) => {
  return api.patch(`/hiring-requests/${id}/publish`);
};

export const apiGetStaffMovementStats = () => {
  return api.get("/hr/staff-movement/stats");
};
