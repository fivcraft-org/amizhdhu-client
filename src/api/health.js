import api from "./axios";

export const apiGetHealthLogs = (params) => {
  return api.get("/hr/health-logs", { params });
};

export const apiGetEmployeeHealthHistory = (employeeId, params) => {
  return api.get(`/hr/health-logs/employee/${employeeId}`, { params });
};

export const apiGetHealthLogSummary = (date) => {
  return api.get("/hr/health-logs/summary", { params: { date } });
};

export const apiUpdateHealthLog = (id, payload) => {
  return api.put(`/hr/health-logs/${id}`, payload);
};
