// client/src/services/admin.services.js
import axiosInstance from "../utils/axiosInstance.util.js";

const handle = (res) => {
  if (!res || res.status >= 400) {
    const err = new Error(res?.data?.message || "Request failed");
    err.response = res || { data: { message: "Request failed" } };
    throw err;
  }
  return res.data;
};

// ==================== Auth ====================
export const loginAdmin = async (credentials) => {
  const response = await axiosInstance.post('/admin/auth/login', credentials);
  return handle(response);
};

// ==================== Admin CRUD ====================
export const getAllAdmins = async () => {
  const response = await axiosInstance.get('/admin/admins');
  return handle(response);
};

export const getAdminById = async (adminId) => {
  const response = await axiosInstance.get(`/admin/admins/${adminId}`);
  return handle(response);
};

export const createAdmin = async (adminData) => {
  const response = await axiosInstance.post('/admin/admins', adminData);
  return handle(response);
};

export const updateAdminKey = async (currentKey, newKey) => {
  const response = await axiosInstance.put('/admin/admins/update-key', { currentKey, newKey });
  return handle(response);
};

export const deleteAdmin = async (adminId) => {
  const response = await axiosInstance.delete(`/admin/admins/${adminId}`);
  return handle(response);
};

export const changeAdminKey = async (adminId, newAdminKey) => {
  const response = await axiosInstance.put(`/admin/admins/${adminId}/change-key`, { newAdminKey });
  return handle(response);
};

// ==================== Manager Management ====================
export const getAllManagers = async () => {
  const response = await axiosInstance.get('/admin/managers');
  return handle(response);
};

export const getManagerById = async (managerId) => {
  const response = await axiosInstance.get(`/admin/managers/${managerId}`);
  return handle(response);
};

export const approveManager = async (managerId) => {
  const response = await axiosInstance.post(`/admin/managers/${managerId}/approve`);
  return handle(response);
};

export const rejectManager = async (managerId, reason) => {
  const response = await axiosInstance.post(`/admin/managers/${managerId}/reject`, { reason });
  return handle(response);
};

export const banManager = async (managerId, reason) => {
  const response = await axiosInstance.post(`/admin/managers/${managerId}/ban`, { reason });
  return handle(response);
};

export const reinstateManager = async (managerId) => {
  const response = await axiosInstance.post(`/admin/managers/${managerId}/reinstate`);
  return handle(response);
};

// ==================== Analytics ====================
export const getPlatformAnalytics = async () => {
  const response = await axiosInstance.get('/admin/analytics');
  return handle(response);
};

