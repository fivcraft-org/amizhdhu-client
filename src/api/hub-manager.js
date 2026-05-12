import api from "./axios";

export const createInventoryRequest = async (payload) => {
    return api.post("/hub-manager/request/create", payload);
};

export const getHubs = async () => {
    return api.get("/lookups/hubs");
};

export const getInventoryRequests = async (params) => {
    return api.get("/hub-manager/requests", { params });
};

export const getInventoryReports = async (params) => {
    return api.get("/hub-manager/reports", { params });
};

export const downloadInventoryReports = async (params) => {
    return api.get("/hub-manager/reports/download", { params, responseType: 'blob' });
};

export const updateInventoryRequest = async (id, payload) => {
    return api.patch(`/hub-manager/request/${id}`, payload);
};

export const deleteInventoryRequest = async (id) => {
    return api.delete(`/hub-manager/request/${id}`);
};

export const updateRequestStatus = async (id, payload) => {
    return api.patch(`/hub-manager/request/${id}/status`, payload);
};

export const getDashboardData = async () => {
    return api.post("/summary");
};
export const confirmPartialApproval = async (id) => {
    return api.patch(`/hub-manager/request/${id}/confirm`);
};
export const rejectPartialApproval = async (id) => {
    return api.patch(`/hub-manager/request/${id}/reject`);
};
