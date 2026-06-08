import { request } from './api';

export function getCrops() {
  return request('/api/crops');
}

export function getCrop(cropId) {
  return request(`/api/crops/${cropId}`);
}

export function getCropsByFarm(farmId) {
  return request(`/api/farms/${farmId}/crops`);
}

export function createCrop(payload) {
  return request('/api/crops', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateCrop(cropId, payload) {
  return request(`/api/crops/${cropId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteCrop(cropId) {
  return request(`/api/crops/${cropId}`, {
    method: 'DELETE',
  });
}
