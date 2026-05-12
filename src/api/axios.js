import axios from "axios";
import { navigationService } from "../hooks/useNavigationService";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

/* ------------------------------------------
   REQUEST INTERCEPTOR
   Attach Bearer token for Laravel Sanctum
------------------------------------------- */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ------------------------------------------
   RESPONSE INTERCEPTOR WITH REFRESH LOGIC
------------------------------------------- */
let isRefreshing = false;
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;

    if (error?.response && error?.response?.data) {
      const data = error.response.data;
      
      if (data && typeof data === "object" && typeof data.message === "string") {
        if (
          data.message.includes("SQLSTATE") ||
          data.message.includes("connection refused") ||
          data.message.includes("SQL:")
        ) {
          data.message = "The database connection is currently unavailable. Please contact the administrator.";
          data.error_code = "DATABASE_CONNECTION_ERROR";
        }
      } 
      else if (typeof data === "string") {
        if (
          data.includes("SQLSTATE") ||
          data.includes("connection refused") ||
          data.includes("SQL:")
        ) {
          error.response.data = {
            message: "The database connection is currently unavailable. Please contact the administrator.",
            error_code: "DATABASE_CONNECTION_ERROR"
          };
        }
      }
    }

    if (!error?.response) {
      return Promise.reject(error);
    }

    const skipUrls = [
      "/auth/login",
      "/auth/logout",
      "/auth/refresh-token",
      "/auth/forgot-pin/send-code",
      "/auth/resend-otp",
      "/auth/verify-otp",
      "/auth/reset-pin",
      "/farmer/verify-user",
      "/farmer/register",
      "/auth/validate-identifier"
    ];

    if (originalRequest?.url && skipUrls.some((u) => originalRequest.url.includes(u))) {
      return Promise.reject(error);
    }

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        try {
          await refreshPromise;
          return api(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      isRefreshing = true;
      const refreshToken = localStorage.getItem("refreshToken");
      
      refreshPromise = api.post("/auth/refresh-token", {
        refresh_token: refreshToken, // fallback for legacy
        refreshToken: refreshToken   // for Node backend
      });

      try {
        const res = await refreshPromise;
        const responseData = res?.data?.data || {};
        
        const access_token = responseData.accessToken || responseData.tokens?.access_token;
        const new_refresh_token = responseData.refreshToken || responseData.tokens?.refresh_token;

        if (access_token) localStorage.setItem("accessToken", access_token);
        if (new_refresh_token) localStorage.setItem("refreshToken", new_refresh_token);

        isRefreshing = false;
        refreshPromise = null;
        
        return api(originalRequest);
      } catch (refreshErr) {
        isRefreshing = false;
        refreshPromise = null;

        if (refreshErr?.response?.status === 401 || refreshErr?.response?.status === 403) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            navigationService("/");
        }
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
