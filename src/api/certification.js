import api from "./axios";

// Training Sessions
export const apiGetTrainingSessions = (params) => {
  return api.get("/hr/trainings", { params });
};

export const apiCreateTrainingSession = (payload) => {
  return api.post("/hr/trainings", payload);
};

export const apiDownloadTrainingReport = (id) => {
  return api.get(`/hr/trainings/${id}/report`, { responseType: 'blob' });
};

// Certifications
export const apiGetCertifications = (params) => {
  return api.get("/hr/certifications", { params });
};

export const apiCreateCertification = (payload) => {
  // Use FormData for file upload
  return api.post("/hr/certifications", payload, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const apiGetCertificationHistory = (employeeId) => {
  return api.get(`/hr/certifications/employee/${employeeId}`);
};

export const apiGetCertificationStats = () => {
  return api.get("/hr/certifications/summary");
};

export const apiGetCertifiedMachinery = () => {
  return api.get("/hr/machinery");
};
