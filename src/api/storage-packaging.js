import api from "./axios";

// GET /storage-packaging/storage-overview
export const apiGetStorageOverview = async () => {
    return api.get("/storage-packaging/storage-overview");
};

// GET /storage-packaging/ready-batches
export const apiGetReadyBatches = async () => {
    return api.get("/storage-packaging/ready-batches");
};

// POST /storage-packaging/allocate
export const apiAllocateStorage = async (data) => {
    return api.post("/storage-packaging/allocate", data);
};

// POST /storage-packaging/move-to-packaging
export const apiMoveToPackaging = async (data) => {
    return api.post("/storage-packaging/move-to-packaging", data);
};

// POST /storage-packaging/start-packaging
export const apiStartPackaging = async (data) => {
    return api.post("/storage-packaging/packaging/start", data);
};

// POST /storage-packaging/generate-sub-batches
export const apiGenerateSubBatches = async (data) => {
    return api.post("/storage-packaging/sub-batches", data);
};

// POST /storage-packaging/complete-packaging
export const apiCompletePackaging = async (data) => {
    const logId = data.packagingId || data.id;
    return api.put(`/storage-packaging/packaging/${logId}/complete`, data);
};

// POST /storage-packaging/upload-certification
export const apiUploadCertification = async (formData) => {
    return api.post("/storage-packaging/upload-certification", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
};

// GET /storage-packaging/reports
export const apiGetStorageReports = async (params) => {
    return api.get("/storage-packaging/reports", { params });
};

// GET /storage-packaging/download-reports
export const apiDownloadStorageReports = async (statusOrFilters, filters) => {
    let queryParams = {};
    if (filters !== undefined) {
        queryParams = { ...filters, activeTab: statusOrFilters };
    } else {
        queryParams = statusOrFilters && typeof statusOrFilters === 'object' ? { ...statusOrFilters } : { search: statusOrFilters };
    }

    return api.get("/storage-packaging/download-reports", {
        params: queryParams,
        responseType: "blob",
    });
};
// GET /storage-packaging/hub-requests
export const getHubRequests = async (params) => {
    return api.get("/storage-packaging/hub-requests", { params });
};

// PATCH /storage-packaging/hub-request/:id/review
export const reviewHubRequest = async (id, data) => {
    return api.patch(`/storage-packaging/hub-request/${id}/review`, data);
};
