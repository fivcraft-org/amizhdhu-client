import axiosInstance from "./axios";

export const notificationApi = {
  // TEMPORARY: Mocked to prevent 404 floods as backend doesn't implement root notification routes yet
  getNotifications: (params) => Promise.resolve({ data: { data: [], pagination: { total: 0 } } }),
  getUnreadCount: () => Promise.resolve({ data: { data: { count: 0 } } }),
  markAsRead: (id) => Promise.resolve({ data: { success: true } }),
  markAllAsRead: () => Promise.resolve({ data: { success: true } }),
};
