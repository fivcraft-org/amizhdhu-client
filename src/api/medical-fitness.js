import api from "./axios";

export const apiGetMedicalFitnessLogs = (params) => {
  return api.get("/hr/medical-fitness", { params });
};

export const apiUploadMedicalFitness = (payload) => {
  return api.post("/hr/medical-fitness", payload, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const apiGetMedicalFitnessSummary = () => {
  return api.get("/hr/medical-fitness/summary");
};
