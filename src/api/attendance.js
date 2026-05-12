import api from "./axios";

// HR / Management APIs
export const apiGetAttendanceSummary = (date) => {
  return api.get("/attendance/summary", { params: { date } });
};

export const apiGetAttendanceLogs = (params) => {
  return api.get("/hr/attendance", { params });
};

export const apiDownloadAttendanceReport = (date, filters) => {
  return api.get("/hr/attendance/download", {
    params: { ...filters, date },
    responseType: "blob"
  });
};

// Staff / Self-Service APIs (shared — accessible by all roles)
export const apiGetSelfAttendance = (params) => {
  return api.get("/attendance/my", { params });
};

export const apiGetMyAttendanceSummary = (date) => {
  return api.get("/attendance/summary", { params: { date } });
};

export const apiGetCurrentAttendance = () => {
  // TEMPORARY: Return mock successful null-status since Node backend currently lacks this route.
  return Promise.resolve({ data: { data: null } });
};

export const apiClockIn = (payload) => {
  // Remap to active Node server endpoint /employee/check-in
  return api.get("/employee/check-in");
};

export const apiClockOut = () => {
  // Remap to active Node server endpoint /employee/check-out
  return api.get("/employee/check-out");
};

export const apiToggleBreak = (status) => {
  return api.post("/attendance/toggle-break", { status });
};

export const apiAddManualAttendance = (payload) => {
  return api.post("/hr/attendance/manual", payload);
};
