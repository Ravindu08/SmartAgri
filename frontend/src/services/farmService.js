import axios from 'axios';
import { getAuthSession } from './api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const { token } = getAuthSession();
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

function handleError(error) {
  const message = error?.response?.data?.detail || error?.response?.data?.message || error.message || 'Request failed';
  throw new Error(message);
}

export async function getFarms() {
  try {
    const response = await api.get('/api/farms');
    return response.data;
  } catch (error) {
    handleError(error);
  }
}

export async function getFarm(id) {
  try {
    const response = await api.get(`/api/farms/${id}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
}

export async function createFarm(payload) {
  try {
    const response = await api.post('/api/farms', payload);
    return response.data;
  } catch (error) {
    handleError(error);
  }
}

export async function updateFarm(id, payload) {
  try {
    const response = await api.put(`/api/farms/${id}`, payload);
    return response.data;
  } catch (error) {
    handleError(error);
  }
}

export async function deleteFarm(id) {
  try {
    const response = await api.delete(`/api/farms/${id}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
}
