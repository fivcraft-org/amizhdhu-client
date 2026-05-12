import api from "./axios";

export const getSuperAdminDashboard = () => {
    return api.post("/dashboard/summary");
};

export const apiGetAllUsers = (params) => {
    return api.get("/super-admin/users", { params });
};

export const apiGetRewards = (params) => {
    return api.get("/super-admin/rewards", { params });
};

export const apiUpdateRewardStatus = (id, payload) => {
    return api.patch(`/super-admin/rewards/${id}/status`, payload);
};

export const apiGetComplianceRecords = (params) => {
    return api.get("/super-admin/compliance", { params });
};

export const apiUploadComplianceRecord = (payload) => {
    return api.post("/super-admin/compliance", payload, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

export const apiGetPaymentApprovals = (params) => {
    return api.get("/super-admin/payments", { params });
};

export const apiCountersignPayment = (id, payload) => {
    return api.patch(`/super-admin/payments/${id}/countersign`, payload);
};

export const apiGetSystemSettings = (group) => {
    return api.get("/super-admin/settings", { params: { group } });
};

export const apiUpdateSystemSetting = (payload) => {
    return api.post("/super-admin/settings/update", payload);
};

export const apiGetLeaderboards = () => {
    return api.get("/super-admin/leaderboards");
};

export const apiGetGrowthAnalytics = () => {
    return api.get("/super-admin/analytics");
};

export const apiDownloadMasterReport = (reportType, params) => {
    return api.get(`/super-admin/reports/download/${reportType}`, { params, responseType: 'blob' });
};

export const apiGetPinResetRequests = () => {
    return api.get("/super-admin/pin-reset-requests");
};

export const apiApprovePinReset = (id, payload) => {
    return api.post(`/super-admin/pin-reset-requests/${id}/approve`, payload);
};

export const apiRejectPinReset = (id, payload) => {
    return api.post(`/super-admin/pin-reset-requests/${id}/reject`, payload);
};

