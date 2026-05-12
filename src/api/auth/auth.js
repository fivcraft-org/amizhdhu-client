import api from "../axios";

export const login = async (payload) => {
  return api.post("/auth/login", payload);
};

export const forgotPin = async (payload) => {
  return api.post("/auth/forgot-pin/send-code", payload);
};

export const resendOtp = async (payload) => {
  return api.post("/auth/resend-otp", payload);
};

export const verifyOtp = async (payload) => {
  return api.post("/auth/verify-otp", payload);
};

export const verifyForgotPinCode = async (payload) => {
  return api.post("/auth/forgot-pin/verify-code", payload);
};

export const createPin = async (payload) => {
  return api.post("/auth/create-pin", payload);
};

export const resetPin = async (payload) => {
  return api.post("/auth/reset-pin", payload);
};

export const validateIdentifier = async (payload) => {
  return api.post("/auth/validate-identifier", payload);
}

export const logoutApi = async () => {
  return api.post("/auth/logout", {}, { withCredentials: true });
};

export const authProfile = () => api.get("/auth/profile");

export const updatePinApi = (payload) => api.post("/auth/update-pin", payload);

export const updateProfile = (payload) => api.post("auth/update-profile", payload);

export const requestPinReset = (payload) => api.post("/auth/request-pin-reset", payload);
