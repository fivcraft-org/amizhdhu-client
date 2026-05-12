import api from './axios';

const BASE = '/lookups';

export const lookupsApi = {
  getRoles: () => api.get(`${BASE}/roles`),
  getDesignations: (roleId) => api.get(`${BASE}/designations`, { params: { role_id: roleId } }),
  getCollectionCenters: () => api.get(`${BASE}/collection-centers`),
  getHubs: () => api.get(`${BASE}/hubs`),
};
