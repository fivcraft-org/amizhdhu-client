import api from "./axios";

export const getData = async (params) => {
  return api.get("/incoming-milk", { params });
};


