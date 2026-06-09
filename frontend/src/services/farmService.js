import { request } from './api';

export function getFarms() {
  return request('/api/farms');
}

export function getFarm(id) {
  return request(`/api/farms/${id}`);
}

export function createFarm(payload) {
  return request('/api/farms', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateFarm(id, payload) {
  return request(`/api/farms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteFarm(id) {
  return request(`/api/farms/${id}`, {
    method: 'DELETE',
  });
}
