import { request } from './api';

export function getMarketplaceListings() {
  return request('/api/marketplace/listings');
}

export function getMyMarketplaceListings() {
  return request('/api/marketplace/listings/me');
}

export function createMarketplaceListing(payload) {
  return request('/api/marketplace/listings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateMarketplaceListing(listingId, payload) {
  return request(`/api/marketplace/listings/${listingId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteMarketplaceListing(listingId) {
  return request(`/api/marketplace/listings/${listingId}`, {
    method: 'DELETE',
  });
}

export function createMarketplaceOrder(payload) {
  return request('/api/marketplace/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getMarketplaceOrders() {
  return request('/api/marketplace/orders');
}

export function updateMarketplaceOrderStatus(orderId, payload) {
  return request(`/api/marketplace/orders/${orderId}/status`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function sendMarketplaceNegotiation(orderId, payload) {
  return request(`/api/marketplace/orders/${orderId}/negotiation`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getMarketplaceHistory() {
  return request('/api/marketplace/history');
}
