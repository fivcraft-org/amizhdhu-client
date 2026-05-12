import api from "../api/axios";

export const apiGetEmployees = ({ status, search, page, limit }) => {
  const statusPath = status ? status.toLowerCase() : "all";

  return api.post(`employee/${statusPath}`, {
    search: search || undefined,
    page,
    limit,
  });
};

export const apiCreateEmployee = (payload) =>
  api.post("employee/create", payload);

export const apiGenerateEmployeeId = (params) =>
  api.get("employee/generate-id", { params });

export const apiUpdateEmployee = (id, payload) =>
  api.put(`employee/update/${id}`, payload);

export const apiGetRoles = () =>
  api.get(`employee/roles`);

export const apiGetDesignationsByRole = (roleId) =>
  api.get("employee/designation", {
    params: { role: roleId }
  });

export const apiGetEmployeeCounts = () =>
  api.get("employee/count");

export const apiActiveInactivateEmployee = (id) =>
  api.put(`employee/active-inactive/${id}`);

export const apiPermanentDeleteEmployee = (id) =>
  api.delete(`employee/delete/${id}`);

export const apiDeleteEmployee = (id) =>
  api.delete(`employee/soft-delete/${id}`);

export const apiRestoreEmployee = (id) =>
  api.put(`employee/restore/${id}`);
  
export const apiResendEmail = (id) =>
  api.get(`employee/resent-email/${id}`);

export const apiDownloadEmployees = (status, filters) => {
  return api.get(`employee/download/${status}`, {
    params: filters,
    responseType: "blob",          
  });
};

export const apiApproveEmployee = (id) =>
  api.put(`employee/approve/${id}`);

export const apiGetCollectionCenters = () =>
  api.get("employee/collection-centers");

