// lib/api.ts
import axios from "axios";
import config from "@/config";

export const api = axios.create({
  baseURL: config.API_BASE_URL,
});

// Attach the token on every request
api.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.set("Authorization", `Bearer ${token}`);
  return req;
});
