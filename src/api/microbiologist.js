import api from "./axios";

// Delivery Notifications
export const apiGetDeliveries = (params) => api.get("/microbiologist/deliveries", { params });
export const apiGetDeliveryById = (id) => api.get(`/microbiologist/deliveries/${id}`);
export const apiUpdateDeliveryStatus = (id, status) => api.patch(`/microbiologist/deliveries/${id}/status`, { status });


// Sample Collection & Testing
export const apiCreateQualityTest = (formData) => {
    return api.post("/microbiologist/tests/submit", formData);
};


// Test Log / History
export const apiGetTestLogs = (params) => api.get("/microbiologist/test-logs", { params });
export const apiDownloadTestings = (statusOrFilters, filters) => {
    let status = "ALL";
    let queryParams = {};

    if (filters !== undefined) {
        status = statusOrFilters;
        queryParams = { ...filters };
    } else {
        queryParams = statusOrFilters && typeof statusOrFilters === 'object' ? { ...statusOrFilters } : { search: statusOrFilters };
    }

    const mappedStatus = status === 'incoming' ? 'PENDING' : 
                         status === 'inProgress' ? 'IN_PROGRESS' : 
                         status === 'approved' ? 'APPROVED' : 
                         status === 'rejected' ? 'REJECTED' : 
                         status === 'ALL' ? 'ALL' : status.toUpperCase();
                         
    return api.get("/microbiologist/tests/download", {
        params: { ...queryParams, status: mappedStatus },
        responseType: "blob",
    });
};

// Certification Upload
export const apiUploadCertification = (formData) => {
    return api.post("/microbiologist/certifications", formData);
};
export const apiGetCertifications = (params) => api.get("/microbiologist/certifications", { params });

// Support & Feedback
export const apiRaiseQuery = (data) => api.post("/microbiologist/queries", data);
export const apiGetQueries = (params) => api.get("/microbiologist/queries", { params });

// Notifications
export const apiGetNotifications = () => api.get("/microbiologist/notifications");
export const apiMarkNotificationAsRead = (id) => api.put(`/microbiologist/notifications/${id}/read`);

// Dashboard
export const apiGetDashboard = () => api.post("/dashboard/summary");

// Logistics Sync
export const apiClaimTrip = (data) => api.post("/microbiologist/tests/claim", data);
