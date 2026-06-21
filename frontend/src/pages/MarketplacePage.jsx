/* =================================================================================
 * SmartAgri — Marketplace (Sprint 4)  ·  SINGLE-FILE PAGE
 * Everything for this page lives here on purpose: types, data hooks, a tiny toast
 * system, inline UI primitives (Button / Card / Badge / Input / Modal / Tabs) and
 * all panels. No external local UI files are imported, so this page is fully
 * portable inside the larger SmartAgri website.
 * Backend lives in /api/listings, /api/requests, /api/orders (Sprint 4 demo API).
 * ================================================================================= */

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useOutletContext } from 'react-router-dom';
import useSWR, { mutate } from 'swr';
import { getAuthSession, getActiveRole, setActiveRole, getUserRoles } from '../services/api';
import {
  Leaf,
  Tractor,
  Store,
  User,
  Sprout,
  Plus,
  Package,
  MapPin,
  ShoppingCart,
  Send,
  Check,
  X,
  MessageSquare,
  Inbox,
  Package2,
  ArrowRight,
  CheckCircle2,
  History,
} from 'lucide-react';
import '../styles/marketplace.css';

const ORDER_STATUS_FLOW = ['pending', 'confirmed', 'delivered', 'completed'];
const API_BASE = import.meta.env.VITE_API_URL || '';
const LOCAL_LISTINGS_KEY = 'agri-local-listings';

// Per-page multilingual messages (keeps translations local to this page)
const MESSAGES = {
  en: {
    badge: '🛒 Crop Marketplace',
    title: 'Buying and selling agricultural products',
    sub: 'Connect with farmers and traders. Explore fresh produce, negotiate prices, and manage your orders all in one place.',
    headerTitle: 'AgriMarket',
    headerSub: 'SmartAgri · Crop Marketplace',
    landOwner: 'Land Owner',
    trader: 'Trader',
    yourDisplayName: 'Your display name',
    actAs: 'You are acting as',
    addListingTitle: 'Add a Crop Listing',
    addListingSub: 'List your harvest so traders can browse and send purchase requests.',
    cropName: 'Crop name',
    quantity: 'Quantity',
    unit: 'Unit',
    pricePerUnit: 'Price / unit (Rs.)',
    location: 'Location',
    description: 'Description',
    imageLabel: 'Product Image (optional)',
    imageHint: 'Upload a photo of your listing',
    publishListing: 'Publish Listing',
    listingInProgress: 'Listing...',
    requiredFields: 'Crop name, quantity and price are required.',
    listedLocally: 'listed locally (start backend on port 8001 to sync).',
    listedRemote: 'listed on the marketplace.',
    yourListing: 'Your listing',
    listedByAnother: 'Listed by another owner',
    listedByAnotherTrader: 'Listed by another trader',
    yourProduct: 'Your product',
    availableSuffix: 'available',
    loadingCrops: 'Loading available crops...',
    noListingsOwner: 'No crops listed yet. Add your first listing above.',
    noListingsTrader: 'No crops listed yet. Check back soon.',
    noProductsTrader: 'No products listed yet. Add your first product above.',
    noProductsOwner: 'No agricultural products listed yet. Check back soon.',
    sendRequest: 'Send Purchase Request',
    sendBuyRequest: 'Send Buy Request',
    soldOut: 'Sold Out',
    sendRequestBtn: 'Send Request',
    sending: 'Sending...',
    requestInvalid: 'Enter a valid quantity and price.',
    estimatedTotal: 'Estimated total',
    ownerTabs: ['My Listings','Browse Marketplace','Purchase Requests','Order Management','Transaction History'],
    traderTabs: ['Browse Marketplace','My Products','My Requests','My Orders','Transaction History'],
    availableCrops: 'Crop Listings',
    availableProducts: 'Agricultural Products',
    browseMarketplace: 'Browse Marketplace',
    addProductTitle: 'Add a Product Listing',
    addProductSub: 'List fertilizers, pesticides, seeds or other supplies for land owners to browse and buy.',
    productName: 'Product name',
    productCategory: 'Category',
    productCategories: ['Fertilizer','Pesticide','Herbicide','Fungicide','Seed','Equipment','Other'],
    negotiate: 'Negotiate',
    negotiationTypeMsg: 'Type a message or a counter price.',
    noMessagesYet: 'No messages yet. Start the discussion.',
    messagePlaceholder: 'Type a message...',
    counterPrice: 'Counter price',
    send: 'Send',
    loadingRequests: 'Loading requests...',
    requestAccepted: 'Request accepted — order created.',
    requestRejected: 'Request rejected.',
    noPurchaseRequestsOwner: 'No purchase requests yet. They will appear here when traders send them.',
    noPurchaseRequestsTrader: 'You have not sent any purchase requests yet. Browse the marketplace to send one.',
    accept: 'Accept',
    reject: 'Reject',
    loadingOrders: 'Loading orders...',
    noOrdersYet: 'No orders yet. Orders are created when a land owner accepts a purchase request.',
    noTransactionsYet: 'No transactions recorded yet.',
    loggedInRole: 'You are logged in to this role.',
    switchRole: 'Switch role',
    demoWarning: '⚠️ You are browsing as a guest. Log in or register to buy or list products.',
  },
  si: {
    badge: '🛒 කෘෂි වෙළඳපොල',
    title: 'කිසීම හා විකිණීම - කෘෂි නිෂ්පාදන',
    sub: 'ගොවින් සහ වෙළෙන්දන් සමග සම්බන්ධ වන්න. නැවුම් නිෂ්පාදන විමසන්න, මිල ගැන සාකච්ඡා කරන්න, සහ ඔබේ ඇණවුම් කළමනාකරණය කරන්න.',
    headerTitle: 'AgriMarket',
    headerSub: 'SmartAgri · කෘෂි වෙළඳපොල',
    landOwner: 'ඉඩම් හිමිකරු',
    trader: 'වෙළෙන්ද',
    yourDisplayName: 'ඔබේ පෙන්වන නම',
    actAs: 'ඔබ ක්‍රියා කරන්නේ',
    addListingTitle: 'බෝග ලැයිස්තු එක් කරන්න',
    addListingSub: 'ඔබගේ අස්වනු ලැයිස්තු ගොනු කරන්න, වෙළෙන්දන් වැඩිපුර බලන්න.',
    cropName: 'බෝග නම',
    quantity: 'ප්‍රමාණය',
    unit: 'ඒකකය',
    pricePerUnit: 'මිල / ඒකකය (රු.)',
    location: 'ස්ථානය',
    description: 'විස්තරය',
    publishListing: 'ලැයිස්තුව ප්‍රකාශ කරන්න',
    listingInProgress: 'ලැයිස්තුව...',
    requiredFields: 'බෝග නම, ප්‍රමාණය සහ මිල අවශ්‍යයි.',
    listedLocally: 'ප්‍රදේශීයව ලැයිස්තුගත විය (8001 වරායේ backend ආරම්භ කරන්න).',
    listedRemote: 'වෙළඳපොලේ ලැයිස්තුගත විය.',
    yourListing: 'ඔබගේ ලැයිස්තුව',
    listedByAnother: 'වෙනත් හිමිකරු විසින් ලැයිස්තුගත කර ඇත',
    availableSuffix: 'ලබා ගත හැක',
    loadingCrops: 'ලබා ගත හැකි බෝග ලෝඩ් වෙමින් පවතී...',
    noListingsOwner: 'තවමත් කිසිදු ලැයිස්තුවක් නොමැත. ප්‍රථම ලැයිස්තුව ඉහතදී එක් කරන්න.',
    noListingsTrader: 'තවමත් කිසිදු ලැයිස්තුවක් නොමැත. පසුව නැවත බලන්න.',
    sendRequest: 'මිලදී ගැනීමේ ඉල්ලීම යවන්න',
    soldOut: 'විකුණුම්වී ඇත',
    sendRequestBtn: 'ඉල්ලීම යවන්න',
    sending: 'යවමින්...',
    requestInvalid: 'වලංගු ප්‍රමාණයක් සහ මිලක් ඇතුළත් කරන්න.',
    estimatedTotal: 'අනුමාන මුලු එකතුව',
    imageLabel: 'නිෂ්පාදන රූපය (අවශ්‍ය නොවේ)',
    imageHint: 'ඔබේ ලැයිස්තුවේ ඡායාරූපයක් උඩුගත කරන්න',
    yourProduct: 'ඔබේ නිෂ්පාදනය',
    listedByAnotherTrader: 'වෙනත් වෙළෙන්දෙකු විසින් ලැයිස්තුගත',
    noProductsTrader: 'තවමත් නිෂ්පාදන නොමැත. ඉහතදී ප්‍රථම නිෂ්පාදනය එක් කරන්න.',
    noProductsOwner: 'කිසිදු කෘෂි නිෂ්පාදනයක් නොමැත. පසුව නැවත බලන්න.',
    sendBuyRequest: 'මිලදී ගැනීමේ ඉල්ලීම යවන්න',
    ownerTabs: ['මගේ ලැයිස්තු','වෙළඳපොල බ්‍රව්ස් කරන්න','මිලදී ගැනීම් ඉල්ලීම්','ඇණවුම් කළමනාකරණය','ගනුදෙනු ඉතිහාසය'],
    traderTabs: ['වෙළඳපොල බ්‍රව්ස් කරන්න','මගේ නිෂ්පාදන','මගේ ඉල්ලීම්','මගේ ඇණවුම්','ගනුදෙනු ඉතිහාසය'],
    availableCrops: 'බෝග ලැයිස්තු',
    availableProducts: 'කෘෂි නිෂ්පාදන',
    browseMarketplace: 'වෙළඳපොල බ්‍රව්ස් කරන්න',
    addProductTitle: 'නිෂ්පාදන ලැයිස්තුව එක් කරන්න',
    addProductSub: 'පොහොර, කෘමිනාශක, බීජ හෝ අනෙකුත් සැපයුම් ලැයිස්තු ගොනු කරන්න.',
    productName: 'නිෂ්පාදන නම',
    productCategory: 'වර්ගය',
    productCategories: ['පොහොර','කෘමිනාශක','පිළිකා නාශකය','දිලීර නාශකය','බීජ','උපකරණ','වෙනත්'],
    negotiate: 'ටර්ගෙන් සාකච්ඡා කරන්න',
    negotiationTypeMsg: 'පණිවිඩයක් හෝ counter මිලක් ටයිප් කරන්න.',
    noMessagesYet: 'තවම පණිවිඩ නැත. සාකච්ඡාව ආරම්භ කරන්න.',
    messagePlaceholder: 'පණිවිඩයක් ටයිප් කරන්න...',
    counterPrice: 'Counter මිල',
    send: 'යවන්න',
    loadingRequests: 'ඉල්ලීම් දත්ත බාගත වෙමින් පවතී...',
    requestAccepted: 'ඉල්ලීම පිළිගත්තා — ඇණවුම සාදන ලදී.',
    requestRejected: 'ඉල්ලීම ප්‍රතික්ෂේප කරන ලදී.',
    noPurchaseRequestsOwner: 'තවම මිලදී ගැනීම් ඉල්ලීම් නොමැත. වෙළෙන්දන් ඉල්ලීම් යැවූ විට මෙහි පෙන්වනු ඇත.',
    noPurchaseRequestsTrader: 'ඔබ තවම කිසිදු ඉල්ලීමක් යවා නැත. වෙළඳපොල බ්‍රව්ස් කර ඉල්ලීමක් යවන්න.',
    accept: 'ස්වීකාර කරන්න',
    reject: 'ප්‍රතික්ෂේප කරන්න',
    loadingOrders: 'ඇණවුම් දත්ත බාගත වෙමින් පවතී...',
    noOrdersYet: 'තවම ඇණවුම් නැත. ඉල්ලීමක් අනුමත කරන විට ඇණවුම් සාදනු ලැබේ.',
    noTransactionsYet: 'ගනුදෙනු තවත් නොමැත.',
    loggedInRole: 'ඔබ මෙම භූමිකාවට ලොගින් වී ඇත.',
    switchRole: 'භූමිකාව මාරු කරන්න',
    demoWarning: '⚠️ ඔබ ආගන්තුකයෙකු ලෙස බ්‍රව්ස් කරයි. මිලදී ගැනීමට හෝ ලැයිස්තු ගොනු කිරීමට ලොගින් වන්න.',
  },
  ta: {
    badge: '🛒 விவசாய சந்தை',
    title: 'கொள் & விற் - விவசாய பொருட்கள்',
    sub: 'விவசாயிகள் மற்றும் வணிகர்களுடன் இணையுங்கள். புதிய உற்பத்திகளை ஆய்வு செய்யவும், விலைகளை பேசவும், உங்கள் ஆர்டர்களை நிர்வகிக்கவும்.',
    headerTitle: 'AgriMarket',
    headerSub: 'SmartAgri · விவசாய சந்தை',
    landOwner: 'நில உரிமையாளர்',
    trader: 'கடைவர்',
    yourDisplayName: 'உங்கள் காட்சி பெயர்',
    actAs: 'நீங்கள் செயல் படுகிறீர்கள்',
    addListingTitle: 'பயிர் பட்டியலைச் சேர்க்கவும்',
    addListingSub: 'உங்கள் அறுவடை பட்டியலிடவும், வணிகர்கள் தேடலாம்.',
    cropName: 'பயிர் பெயர்',
    quantity: 'அளவு',
    unit: 'அலகு',
    pricePerUnit: 'விலை / அலகு (ரூ.)',
    location: 'இலக்கம்',
    description: 'விவரம்',
    publishListing: 'பட்டியலை வெளியிடுக',
    listingInProgress: 'பட்டியலிடுகிறது...',
    requiredFields: 'பயிர் பெயர், அளவு மற்றும் விலை அவசியமானவை.',
    listedLocally: 'உள்ளூரில் பட்டியலிடப்பட்டது (sync க்கு backend ஐ 8001 இல் தொடங்கவும்).',
    listedRemote: 'சந்தையில் பட்டியலிடப்பட்டது.',
    yourListing: 'என் பட்டியல்',
    listedByAnother: 'மற்றொரு உரிமையாளர் பதிவுசெய்தார்',
    availableSuffix: 'கிடைக்கிறது',
    loadingCrops: 'கிடைக்கக்கூடிய பயிர்கள் ஏற்றப்படுகிறது...',
    noListingsOwner: 'இன்னும் எந்த பட்டியலும் இல்லை. உங்கள் முதல் பட்டியலை மேலே சேர்க்கவும்.',
    noListingsTrader: 'இன்னும் எந்த பட்டியலும் இல்லை. மீண்டும் பிறகு சரிபார்க்கவும்.',
    sendRequest: 'வாங்கும் கோரிக்கை அனுப்பு',
    soldOut: 'விற்பனை முடிந்தது',
    sendRequestBtn: 'கோரிக்கையை அனுப்பு',
    sending: 'அனுப்புகிறது...',
    requestInvalid: 'சரியான அளவு மற்றும் விலையை உள்ளிடவும்.',
    estimatedTotal: 'கணிக்கப்பட்ட மொத்தம்',
    imageLabel: 'தயாரிப்பு படம் (விருப்பமான)',
    imageHint: 'உங்கள் பட்டியலின் புகைப்படத்தை பதிவேற்றவும்',
    yourProduct: 'உங்கள் தயாரிப்பு',
    listedByAnotherTrader: 'மற்றொரு வணிகர் பட்டியலிட்டார்',
    noProductsTrader: 'இன்னும் தயாரிப்புகள் இல்லை. மேலே முதல் தயாரிப்பை சேர்க்கவும்.',
    noProductsOwner: 'இன்னும் விவசாய தயாரிப்புகள் இல்லை. பிறகு சரிபார்க்கவும்.',
    sendBuyRequest: 'வாங்கும் கோரிக்கை அனுப்பு',
    ownerTabs: ['என் பட்டியல்கள்','சந்தையை உலாவு','வாங்கும் கோரிக்கைகள்','ஆர்டர் நிர்வாகம்','பரிவர்த்தனை வரலாறு'],
    traderTabs: ['சந்தையை உலாவு','என் தயாரிப்புகள்','என் கோரிக்கைகள்','என் ஆர்டர்கள்','பரிவர்த்தனை வரலாறு'],
    availableCrops: 'பயிர் பட்டியல்கள்',
    availableProducts: 'விவசாய தயாரிப்புகள்',
    browseMarketplace: 'சந்தையை உலாவு',
    addProductTitle: 'தயாரிப்பு பட்டியலை சேர்',
    addProductSub: 'நில உரிமையாளர்கள் வாங்க உரங்கள், பூச்சிக்கொல்லிகள், விதைகள் பட்டியலிடவும்.',
    productName: 'தயாரிப்பு பெயர்',
    productCategory: 'வகை',
    productCategories: ['உரம்','பூச்சிக்கொல்லி','களைக்கொல்லி','பூஞ்சை நாசினி','விதை','உபகரணம்','மற்றவை'],
    negotiate: 'சரிகட்டி',
    negotiationTypeMsg: 'ஒரு செய்தி அல்லது மாற்று விலையை டைப் செய்யவும்.',
    noMessagesYet: 'இன்னும் எந்த செய்தியும் இல்லை. விவாதத்தை தொடங்குங்கள்.',
    messagePlaceholder: 'ஒரு செய்தி டைப் செய்யவும்...',
    counterPrice: 'மாற்று விலை',
    send: 'அனுப்பு',
    loadingRequests: 'கோரிக்கைகள் ஏற்றப்படுகிறது...',
    requestAccepted: 'கோரிக்கை ஏற்றப்பட்டது — ஆர்டர் உருவாக்கப்பட்டது.',
    requestRejected: 'கோரிக்கை நிராகரிக்கப்பட்டது.',
    noPurchaseRequestsOwner: 'கடையில் இருந்து கோரிக்கைகள் இன்னும் இல்லை. வரும்போது இங்கே தோன்றும்.',
    noPurchaseRequestsTrader: 'நீங்கள் இன்னும் எந்த கோரிக்கையும் அனுப்பவில்லை. சந்தையை உலாவி ஒரு கோரிக்கையை அனுப்புங்கள்.',
    accept: 'ஒப்புக் கொள்ளவும்',
    reject: 'நிராகரிக்கவும்',
    loadingOrders: 'ஆர்டர்கள் ஏற்றப்படுகிறது...',
    noOrdersYet: 'இன்னும் எந்த ஆர்டர்களும் இல்லை. கோரிக்கைகள் ஏற்றுக்கொள்ளப்பட்டால் நிகழும்.',
    noTransactionsYet: 'பரிவர்த்தனைகள் பதிவு செய்யப்படவில்லை.',
    loggedInRole: 'நீங்கள் இந்த பங்கில் உள்நுழைந்திருக்கிறீர்கள்.',
    switchRole: 'பங்கை மாற்று',
    demoWarning: '⚠️ நீங்கள் விருந்தினராக உலாவுகிறீர்கள். வாங்க அல்லது பட்டியலிட உள்நுழையவும்.',
  },
};

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Server returned an invalid response. Is the backend running on port 8001?');
  }
}

function extractError(data, fallback = 'Request failed') {
  if (data?.error) return data.error;
  if (typeof data?.detail === 'string') return data.detail;
  if (data?.detail?.error) return data.detail.error;
  if (Array.isArray(data?.detail)) return data.detail.map((d) => d.msg || d).join(', ');
  return fallback;
}

function getLocalListings() {
  try {
    const raw = localStorage.getItem(LOCAL_LISTINGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalListing(listing) {
  const existing = getLocalListings();
  localStorage.setItem(LOCAL_LISTINGS_KEY, JSON.stringify([...existing, listing]));
}

function mergeListings(apiListings, localListings) {
  const merged = [...apiListings];
  for (const listing of localListings) {
    if (!merged.some((l) => l.id === listing.id)) merged.push(listing);
  }
  return merged;
}

function buildLocalListing(payload) {
  return {
    id: crypto.randomUUID(),
    cropName: payload.cropName,
    quantity: payload.quantity,
    unit: payload.unit,
    pricePerUnit: payload.pricePerUnit,
    ownerName: payload.ownerName,
    location: payload.location || '',
    description: payload.description || '',
    image: payload.image || '',
    listing_type: payload.listing_type || 'crop',
    ownerRole: payload.ownerRole || 'owner',
    status: 'available',
    createdAt: Date.now(),
  };
}

/* ------------------------------------------------------------------ *
 * Data layer (SWR + fetch helpers)
 * ------------------------------------------------------------------ */
async function fetcher(url) {
  const res = await fetch(url);
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractError(data));
  return data;
}

function useListings() {
  const { data, isLoading } = useSWR(apiUrl('/api/listings'), fetcher, { refreshInterval: 4000 });
  const apiListings = data?.listings ?? [];
  const localListings = getLocalListings();
  return { listings: mergeListings(apiListings, localListings), isLoading };
}
function useRequests() {
  const { data, isLoading } = useSWR(apiUrl('/api/requests'), fetcher, { refreshInterval: 4000 });
  return { requests: data?.requests ?? [], isLoading };
}
function useOrders() {
  const { data, isLoading } = useSWR(apiUrl('/api/orders'), fetcher, { refreshInterval: 4000 });
  return { orders: data?.orders ?? [], isLoading };
}
async function post(url, body, method = 'POST') {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractError(data));
  return data;
}

async function createListing(payload) {
  try {
    const data = await post(apiUrl('/api/listings'), payload);
    if (data.listing) {
      mutate(
        apiUrl('/api/listings'),
        (current) => ({
          listings: mergeListings([...(current?.listings ?? []), data.listing], getLocalListings()),
        }),
        { revalidate: true },
      );
    }
    return data;
  } catch (err) {
    const isOffline =
      err.name === 'TypeError' ||
      /failed to fetch|network|invalid response|backend/i.test(err.message);
    if (!isOffline) throw err;

    const listing = buildLocalListing(payload);
    saveLocalListing(listing);
    mutate(
      apiUrl('/api/listings'),
      (current) => ({
        listings: mergeListings(current?.listings ?? [], getLocalListings()),
      }),
      { revalidate: false },
    );
    return { listing, offline: true };
  }
}

const api = {
  createListing,
  createRequest: (b) => post(apiUrl('/api/requests'), b),
  resolveRequest: (id, action) => post(apiUrl(`/api/requests/${id}`), { action }, 'PATCH'),
  sendMessage: (id, b) => post(apiUrl(`/api/requests/${id}/messages`), b),
  updateOrder: (id, status) => post(apiUrl(`/api/orders/${id}`), { status }, 'PATCH'),
};
function refreshAll() {
  mutate(apiUrl('/api/listings'));
  mutate(apiUrl('/api/requests'));
  mutate(apiUrl('/api/orders'));
}

/* ------------------------------------------------------------------ *
 * Tiny toast system (self-contained, no external dep)
 * ------------------------------------------------------------------ */
let toastSeq = 0;
let toastState = [];
const toastSubs = new Set();
function emitToasts() {
  toastState = [...toastState];
  toastSubs.forEach((fn) => fn());
}
function pushToast(type, message) {
  const id = ++toastSeq;
  toastState = [...toastState, { id, type, message }];
  emitToasts();
  setTimeout(() => {
    toastState = toastState.filter((t) => t.id !== id);
    emitToasts();
  }, 3200);
}
const toast = {
  success: (m) => pushToast('success', m),
  error: (m) => pushToast('error', m),
};
function Toaster() {
  const toasts = useSyncExternalStore(
    (cb) => {
      toastSubs.add(cb);
      return () => toastSubs.delete(cb);
    },
    () => toastState,
    () => toastState,
  );
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium shadow-md ${
            t.type === 'success'
              ? 'border-success/40 bg-success text-success-foreground'
              : 'border-destructive/40 bg-destructive text-white'
          }`}
        >
          {t.type === 'success' ? <CheckCircle2 className="size-4" /> : <X className="size-4" />}
          {t.message}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Inline UI primitives (Button / Card / Badge / Input / Label / Modal)
 * ------------------------------------------------------------------ */
function Button({ variant = 'primary', size = 'default', className = '', ...props }) {
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
    destructive: 'bg-destructive text-white hover:bg-destructive/90',
  };
  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-8 px-3 text-sm',
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}

function Card({ className = '', ...props }) {
  return <div className={`rounded-xl border bg-card text-card-foreground shadow-sm ${className}`} {...props} />;
}

function Badge({ tone = 'primary', className = '', ...props }) {
  const tones = {
    primary: 'border-transparent bg-primary text-primary-foreground',
    muted: 'border-transparent bg-secondary text-secondary-foreground',
    destructive: 'border-transparent bg-destructive text-white',
    outline: 'border',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tones[tone]} ${className}`}
      {...props}
    />
  );
}

function Input({ className = '', ...props }) {
  return (
    <input
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
function Label({ className = '', ...props }) {
  return <label className={`text-sm font-medium leading-none ${className}`} {...props} />;
}

function Modal({ open, onClose, title, description, children }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 grid w-full max-w-lg gap-4 rounded-xl border bg-card p-6 shadow-lg"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="grid gap-1">
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Create Listing form (Land Owner)
 * ------------------------------------------------------------------ */
function ImageUpload({ value, onChange, m }) {
  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
  }
  return (
    <div className="grid gap-2">
      <Label>{m.imageLabel || 'Product Image (optional)'}</Label>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative">
            <img src={value} alt="preview" className="h-16 w-16 rounded-lg object-cover border border-input" />
            <button type="button" onClick={() => onChange('')} className="absolute -top-1.5 -right-1.5 rounded-full bg-destructive text-white text-xs w-4 h-4 flex items-center justify-center">×</button>
          </div>
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-input text-muted-foreground text-2xl">📷</div>
        )}
        <label className="cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent transition-colors">
          {m.imageHint || 'Upload photo'}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      </div>
    </div>
  );
}

function CreateListingForm({ ownerName, m }) {
  const [cropName, setCropName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!cropName || !quantity || !pricePerUnit) {
      toast.error(m.requiredFields);
      return;
    }
    setSubmitting(true);
    try {
      const result = await api.createListing({
        cropName,
        quantity: Number(quantity),
        unit,
        pricePerUnit: Number(pricePerUnit),
        ownerName,
        location,
        description,
        image,
        listing_type: 'crop',
        ownerRole: 'owner',
      });
      if (result.offline) {
        toast.success(`"${cropName}" ${m.listedLocally}`);
      } else {
        toast.success(`"${cropName}" ${m.listedRemote}`);
      }
      setCropName(''); setQuantity(''); setPricePerUnit('');
      setLocation(''); setDescription(''); setImage('');
      refreshAll();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="border-primary/20">
      <div className="flex flex-col gap-1.5 p-6 pb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Sprout className="size-5 text-primary" />
          {m.addListingTitle}
        </h2>
        <p className="text-sm text-muted-foreground">{m.addListingSub}</p>
      </div>
      <div className="p-6 pt-0">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="cropName">{m.cropName}</Label>
            <Input id="cropName" placeholder="e.g. Basmati Rice" value={cropName} onChange={(e) => setCropName(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="quantity">{m.quantity}</Label>
              <Input id="quantity" type="number" min="1" placeholder="500" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit">{m.unit}</Label>
              <select id="unit" value={unit} onChange={(e) => setUnit(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="kg">kg</option>
                <option value="ton">ton</option>
                <option value="quintal">quintal</option>
                <option value="crate">crate</option>
                <option value="bag">bag</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">{m.pricePerUnit}</Label>
              <Input id="price" type="number" min="0" step="1" placeholder="350" value={pricePerUnit} onChange={(e) => setPricePerUnit(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="location">{m.location}</Label>
            <Input id="location" placeholder="e.g. Anuradhapura" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">{m.description}</Label>
            <Textarea id="description" placeholder="Quality, harvest date, grade, etc." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <ImageUpload value={image} onChange={setImage} m={m} />
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            <Plus className="size-4" />
            {submitting ? m.listingInProgress : m.publishListing}
          </Button>
        </form>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 * Create Product form (Trader — sells fertilizers, seeds, supplies)
 * ------------------------------------------------------------------ */
function CreateProductForm({ traderName, m }) {
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const categories = m.productCategories || ['Fertilizer','Pesticide','Herbicide','Fungicide','Seed','Equipment','Other'];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!productName || !quantity || !pricePerUnit) {
      toast.error(m.requiredFields);
      return;
    }
    setSubmitting(true);
    const displayName = category ? `${productName} (${category})` : productName;
    try {
      const result = await api.createListing({
        cropName: displayName,
        quantity: Number(quantity),
        unit,
        pricePerUnit: Number(pricePerUnit),
        ownerName: traderName,
        location,
        description,
        image,
        listing_type: 'product',
        ownerRole: 'trader',
      });
      if (result.offline) {
        toast.success(`"${productName}" ${m.listedLocally}`);
      } else {
        toast.success(`"${productName}" ${m.listedRemote}`);
      }
      setProductName(''); setCategory(''); setQuantity('');
      setPricePerUnit(''); setLocation(''); setDescription(''); setImage('');
      refreshAll();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="border-primary/20">
      <div className="flex flex-col gap-1.5 p-6 pb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Store className="size-5 text-primary" />
          {m.addProductTitle || 'Add a Product Listing'}
        </h2>
        <p className="text-sm text-muted-foreground">{m.addProductSub || 'List fertilizers, pesticides, seeds or other supplies.'}</p>
      </div>
      <div className="p-6 pt-0">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>{m.productName || 'Product name'}</Label>
              <Input placeholder="e.g. NPK Fertilizer 20-20-20" value={productName} onChange={(e) => setProductName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{m.productCategory || 'Category'}</Label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">-- Select category --</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>{m.quantity}</Label>
              <Input type="number" min="1" placeholder="100" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{m.unit}</Label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="kg">kg</option>
                <option value="L">L (litre)</option>
                <option value="bag">bag</option>
                <option value="bottle">bottle</option>
                <option value="box">box</option>
                <option value="unit">unit</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label>{m.pricePerUnit}</Label>
              <Input type="number" min="0" step="1" placeholder="2500" value={pricePerUnit} onChange={(e) => setPricePerUnit(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>{m.location}</Label>
            <Input placeholder="e.g. Colombo" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>{m.description}</Label>
            <Textarea placeholder="Brand, specifications, usage instructions..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <ImageUpload value={image} onChange={setImage} m={m} />
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            <Plus className="size-4" />
            {submitting ? m.listingInProgress : (m.publishListing || 'Publish Product')}
          </Button>
        </form>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 * Purchase Request dialog (Trader)
 * ------------------------------------------------------------------ */
function RequestDialog({ listing, buyerName, traderName, m, listingType = 'crop' }) {
  const effectiveBuyerName = buyerName || traderName || '';
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(String(Math.min(listing.quantity, 50)));
  const [offeredPrice, setOfferedPrice] = useState(String(listing.pricePerUnit));
  const [submitting, setSubmitting] = useState(false);
  const total = (Number(quantity) || 0) * (Number(offeredPrice) || 0);
  const btnLabel = listingType === 'product' ? (m.sendBuyRequest || 'Send Buy Request') : m.sendRequest;

  async function submit() {
    if (!Number(quantity) || !Number(offeredPrice)) {
      toast.error(m.requestInvalid);
      return;
    }
    if (Number(quantity) > listing.quantity) {
      toast.error(`Only ${listing.quantity} ${listing.unit} available.`);
      return;
    }
    setSubmitting(true);
    try {
      const result = await api.createRequest({ listingId: listing.id, traderName: effectiveBuyerName, quantity: Number(quantity), offeredPrice: Number(offeredPrice) });

      const reqEndpoint = apiUrl('/api/requests');
      if (!(result && (result.request || result.requests))) {
        const localReq = {
          id: crypto.randomUUID(),
          listingId: listing.id,
          traderName: effectiveBuyerName,
          ownerName: listing.ownerName,
          quantity: Number(quantity),
          offeredPrice: Number(offeredPrice),
          status: 'pending',
          messages: [],
          createdAt: Date.now(),
        };
        mutate(reqEndpoint, (current) => ({ requests: [localReq, ...(current?.requests || [])] }), { revalidate: true });
      } else {
        mutate(reqEndpoint);
      }

      toast.success(btnLabel);
      setOpen(false);
      refreshAll();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button className="w-full" disabled={listing.status === 'sold'} onClick={() => setOpen(true)}>
        <ShoppingCart className="size-4" />
        {listing.status === 'sold' ? m.soldOut : btnLabel}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`${btnLabel} — ${listing.cropName}`}
        description={`Listed by ${listing.ownerName} at Rs. ${Number(listing.pricePerUnit).toLocaleString()}/${listing.unit}. Propose your quantity and price.`}
      >
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="req-qty">{m.quantity} ({listing.unit})</Label>
            <Input id="req-qty" type="number" min="1" max={listing.quantity} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              {listing.quantity} {listing.unit} available
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="req-price">{m.pricePerUnit} / {listing.unit}</Label>
            <Input id="req-price" type="number" min="0" step="0.01" value={offeredPrice} onChange={(e) => setOfferedPrice(e.target.value)} />
          </div>
          <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
            <span className="text-muted-foreground">{m.estimatedTotal}</span>
            <span className="font-semibold">Rs. {total.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={submit} disabled={submitting}>
            <Send className="size-4" />
            {submitting ? m.sending : m.sendRequestBtn}
          </Button>
        </div>
      </Modal>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Listings grid (both roles)
 * ------------------------------------------------------------------ */
function ListingsGrid({ role, currentName, m, listingType = 'crop' }) {
  const { listings, isLoading } = useListings();

  const filtered = listings.filter(l => (l.listing_type || 'crop') === listingType);

  if (isLoading) return <p className="text-sm text-muted-foreground">{m.loadingCrops}</p>;
  if (filtered.length === 0) {
    const emptyMsg = listingType === 'product'
      ? (role === 'trader' ? m.noProductsTrader : m.noProductsOwner)
      : (role === 'owner' ? m.noListingsOwner : m.noListingsTrader);
    return (
      <Card>
        <div className="py-10 text-center text-sm text-muted-foreground">{emptyMsg}</div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map((l) => {
        const isOwn = l.ownerName === currentName;
        // Crop listings: traders can buy; product listings: land owners can buy
        const canBuy = listingType === 'crop' ? role === 'trader' : role === 'owner';
        const ownLabel = listingType === 'product' ? (m.yourProduct || 'Your product') : (m.yourListing || 'Your listing');
        const otherLabel = listingType === 'product' ? (m.listedByAnotherTrader || 'Listed by another trader') : (m.listedByAnother || 'Listed by another owner');

        return (
          <Card key={l.id} className="flex flex-col overflow-hidden">
            {l.image && (
              <div className="h-40 w-full overflow-hidden">
                <img src={l.image} alt={l.cropName} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="p-6 pb-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-balance">{l.cropName}</h3>
                <Badge tone={l.status === 'available' ? 'primary' : 'muted'}>{l.status}</Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Package className="size-3.5" />
                  {l.quantity} {l.unit}
                </span>
                {l.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {l.location}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 px-6 pb-3">
              <div className="mb-2 text-2xl font-bold text-primary">
                Rs. {Number(l.pricePerUnit).toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground">/{l.unit}</span>
              </div>
              {l.description && <p className="line-clamp-2 text-sm text-muted-foreground">{l.description}</p>}
              <p className="mt-2 text-xs text-muted-foreground">Seller: {l.ownerName}</p>
            </div>
            <div className="p-6 pt-0">
              {canBuy && !isOwn ? (
                <RequestDialog listing={l} buyerName={currentName} m={m} listingType={listingType} />
              ) : (
                <p className="w-full text-center text-xs text-muted-foreground">
                  {isOwn ? ownLabel : otherLabel}
                </p>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Negotiation dialog (both roles)
 * ------------------------------------------------------------------ */
function NegotiationDialog({ request, role, currentName, m }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [price, setPrice] = useState('');
  const [sending, setSending] = useState(false);

  async function send() {
    if (!text && !price) {
      toast.error(m.negotiationTypeMsg || 'Type a message or a counter price.');
      return;
    }
    setSending(true);
    try {
      await api.sendMessage(request.id, {
        sender: role,
        senderName: currentName,
        text,
        offeredPrice: price ? Number(price) : undefined,
      });
      setText('');
      setPrice('');
      refreshAll();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <MessageSquare className="size-4" />
        {m.negotiate || 'Negotiate'}
        {request.messages.length > 0 && (
          <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{request.messages.length}</span>
        )}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Price Negotiation — ${request.cropName}`}
        description={`Current working offer: Rs. ${Number(request.offeredPrice).toLocaleString()}/${request.unit} for ${request.quantity} ${request.unit}`}
      >
        <div className="flex max-h-64 flex-col gap-2 overflow-y-auto rounded-md bg-muted/50 p-3">
          {request.messages.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">{m.noMessagesYet || 'No messages yet. Start the discussion.'}</p>}
          {request.messages.map((msg) => {
            const mine = msg.sender === role;
            return (
              <div key={msg.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${mine ? 'bg-primary text-primary-foreground' : 'border bg-card'}`}>
                  {msg.text && <p>{msg.text}</p>}
                  {msg.offeredPrice != null && (
                    <p className="mt-1 font-semibold">
                      Counter offer: Rs. {Number(msg.offeredPrice).toLocaleString()}/{request.unit}
                    </p>
                  )}
                </div>
                <span className="mt-0.5 text-[10px] text-muted-foreground">
                  {msg.senderName} · {msg.sender === 'owner' ? 'Land Owner' : 'Trader'}
                </span>
              </div>
            );
          })}
        </div>
        <div className="grid gap-2">
          <Input placeholder={m.messagePlaceholder || 'Type a message...'} value={text} onChange={(e) => setText(e.target.value)} />
          <div className="flex gap-2">
            <Input type="number" step="0.01" placeholder={`${m.counterPrice || 'Counter price'} /${request.unit}`} value={price} onChange={(e) => setPrice(e.target.value)} />
            <Button onClick={send} disabled={sending}>
              <Send className="size-4" />
              {m.send || 'Send'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Requests panel (both roles)
 * ------------------------------------------------------------------ */
const requestTone = { pending: 'muted', accepted: 'primary', rejected: 'destructive' };

function RequestsPanel({ role, currentName, m }) {
  const { requests, isLoading } = useRequests();
  const [busy, setBusy] = useState(null);
  const visible = requests.filter((r) => (role === 'owner' ? r.ownerName === currentName : r.traderName === currentName));

  async function resolve(id, action) {
    setBusy(id);
    try {
      await api.resolveRequest(id, action);
      toast.success(action === 'accept' ? (m.requestAccepted || 'Request accepted — order created.') : (m.requestRejected || 'Request rejected.'));
      refreshAll();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">{m.loadingRequests || 'Loading requests...'}</p>;
  if (visible.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
          <Inbox className="size-6" />
          {role === 'owner'
            ? (m.noPurchaseRequestsOwner || 'No purchase requests yet. They will appear here when traders send them.')
            : (m.noPurchaseRequestsTrader || 'You have not sent any purchase requests yet. Browse the marketplace to send one.')}
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {visible.map((r) => (
        <Card key={r.id}>
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid gap-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{r.cropName}</span>
                <Badge tone={requestTone[r.status]}>{r.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {r.quantity} {r.unit} @ Rs. {Number(r.offeredPrice).toLocaleString()} ={' '}
                <span className="font-medium text-foreground">Rs. {(r.quantity * r.offeredPrice).toLocaleString()}</span>
              </p>
              <p className="text-xs text-muted-foreground">{role === 'owner' ? `From trader: ${r.traderName}` : `To owner: ${r.ownerName}`}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <NegotiationDialog request={r} role={role} currentName={currentName} m={m} />
              {role === 'owner' && r.status === 'pending' && (
                <>
                  <Button size="sm" onClick={() => resolve(r.id, 'accept')} disabled={busy === r.id}>
                    <Check className="size-4" />
                    {m.accept || 'Accept'}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => resolve(r.id, 'reject')} disabled={busy === r.id}>
                    <X className="size-4" />
                    {m.reject || 'Reject'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Orders panel (status management)
 * ------------------------------------------------------------------ */
const orderStatusColor = {
  pending: 'bg-warning/15 text-warning border-warning/40',
  confirmed: 'bg-info/15 text-info border-info/40',
  delivered: 'bg-harvest/15 text-harvest border-harvest/40',
  completed: 'bg-success/15 text-success border-success/40',
};

function StatusTracker({ status }) {
  const currentIndex = ORDER_STATUS_FLOW.indexOf(status);
  return (
    <div className="flex items-center gap-1">
      {ORDER_STATUS_FLOW.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <span
            className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
              i <= currentIndex ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            {i < currentIndex ? <CheckCircle2 className="size-3" /> : i + 1}
          </span>
          {i < ORDER_STATUS_FLOW.length - 1 && <span className={`h-0.5 w-4 ${i < currentIndex ? 'bg-primary' : 'bg-muted'}`} />}
        </div>
      ))}
    </div>
  );
}

function OrdersPanel({ role, currentName, m }) {
  const { orders, isLoading } = useOrders();
  const [busy, setBusy] = useState(null);
  const visible = orders.filter((o) => (role === 'owner' ? o.ownerName === currentName : o.traderName === currentName));

  async function advance(id, status) {
    setBusy(id);
    try {
      await api.updateOrder(id, status);
      toast.success(`Order marked as ${status}.`);
      refreshAll();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">{m.loadingOrders || 'Loading orders...'}</p>;
  if (visible.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
          <Package2 className="size-6" />
          {m.noOrdersYet || 'No orders yet. Orders are created when a land owner accepts a purchase request.'}
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {visible.map((o) => {
        const idx = ORDER_STATUS_FLOW.indexOf(o.status);
        const next = ORDER_STATUS_FLOW[idx + 1];
        return (
          <Card key={o.id}>
            <div className="flex flex-col gap-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="grid gap-1">
                  <span className="font-semibold">{o.cropName}</span>
                  <p className="text-sm text-muted-foreground">
                    {o.quantity} {o.unit} @ Rs. {Number(o.pricePerUnit).toLocaleString()} ={' '}
                    <span className="font-medium text-foreground">Rs. {Number(o.total).toLocaleString()}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {role === 'owner' ? `Buyer: ${o.traderName}` : `Seller: ${o.ownerName}`} · Order {o.id.slice(0, 8)}
                  </p>
                </div>
                <Badge tone="outline" className={orderStatusColor[o.status]}>
                  {o.status}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <StatusTracker status={o.status} />
                {role === 'owner' && next ? (
                  <Button size="sm" onClick={() => advance(o.id, next)} disabled={busy === o.id}>
                    Mark as {next}
                    <ArrowRight className="size-4" />
                  </Button>
                ) : o.status === 'completed' ? (
                  <span className="flex items-center gap-1 text-sm font-medium text-primary">
                    <CheckCircle2 className="size-4" />
                    Completed
                  </span>
                ) : role === 'trader' ? (
                  <span className="text-xs text-muted-foreground">Awaiting owner update</span>
                ) : null}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Transaction history (both roles)
 * ------------------------------------------------------------------ */
function formatDate(ts) {
  return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function TransactionsPanel({ role, currentName, m }) {
  const { orders } = useOrders();
  const visible = orders.filter((o) => (role === 'owner' ? o.ownerName === currentName : o.traderName === currentName));
  const totalValue = visible.reduce((sum, o) => sum + o.total, 0);
  const completed = visible.filter((o) => o.status === 'completed').length;

  if (visible.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
          <History className="size-6" />
          {m.noTransactionsYet || 'No transactions recorded yet.'}
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <div className="py-4 text-center">
            <p className="text-2xl font-bold">{visible.length}</p>
            <p className="text-xs text-muted-foreground">Total Orders</p>
          </div>
        </Card>
        <Card>
          <div className="py-4 text-center">
            <p className="text-2xl font-bold text-primary">{completed}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
        </Card>
        <Card>
          <div className="py-4 text-center">
            <p className="text-2xl font-bold">Rs. {totalValue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Total Value</p>
          </div>
        </Card>
      </div>
      <Card>
        <div className="divide-y">
          {visible.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-3 p-4">
              <div className="grid gap-0.5">
                <span className="font-medium">{o.cropName}</span>
                <span className="text-xs text-muted-foreground">
                  {role === 'owner' ? o.traderName : o.ownerName} · {formatDate(o.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {o.quantity} {o.unit}
                </span>
                <span className="font-semibold">Rs. {Number(o.total).toLocaleString()}</span>
                <Badge tone={o.status === 'completed' ? 'primary' : 'muted'}>{o.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Lightweight Tabs (state-driven)
 * ------------------------------------------------------------------ */
function Tabs({ tabs, value, onChange }) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-muted p-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            value === t.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

export default function MarketplacePage() {
  const outlet = useOutletContext() || {};
  const lang = outlet?.lang || 'en';
  const m = MESSAGES[lang] || MESSAGES.en;
  const { user } = getAuthSession();

  // Force re-render when user switches role in this page
  const [roleVersion, setRoleVersion] = useState(0);
  const sessionRole = getActiveRole();
  const authRole = sessionRole === 'Land Owner' ? 'owner' : sessionRole === 'Trader' ? 'trader' : null;
  const isAuthenticated = !!user;
  const userRoles = getUserRoles();
  const isDualRole = userRoles.includes('Land Owner') && userRoles.includes('Trader');

  function switchToRole(targetRole) {
    setActiveRole(targetRole);
    setRoleVersion(v => v + 1);
  }

  const [ownerTab, setOwnerTab] = useState('listings');
  const [traderTab, setTraderTab] = useState('browse');

  const role = authRole || 'owner';
  const currentName = user?.full_name || 'Guest';

  return (
    <div className="marketplace-sprint min-h-screen bg-background">
      <Toaster />

      {/* ── Hero banner ─────────────────────────────────────────────────── */}
      <div className="marketplace-hero">
        <div className="marketplace-hero-inner">
          <div className="marketplace-hero-badge">{m.badge}</div>
          <h1 className="marketplace-hero-title">{m.title}</h1>
          <p className="marketplace-hero-sub">{m.sub}</p>
        </div>
      </div>
      <div className="marketplace-hero-wave" />

      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Leaf className="size-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">{m.headerTitle}</h1>
              <p className="text-xs text-muted-foreground">{m.headerSub} {isAuthenticated && `· ${sessionRole ?? user?.role}`}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {isAuthenticated ? (
              <div className="flex rounded-lg border bg-muted p-1" title={isDualRole ? m.switchRole : ''}>
                <button
                  disabled={!isDualRole}
                  onClick={() => isDualRole && role !== 'owner' ? switchToRole('Land Owner') : undefined}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    role === 'owner'
                      ? 'bg-primary text-primary-foreground'
                      : isDualRole
                        ? 'text-muted-foreground hover:text-foreground cursor-pointer'
                        : 'text-muted-foreground cursor-default'
                  }`}
                >
                  <Tractor className="size-4" />
                  {m.landOwner}
                </button>
                <button
                  disabled={!isDualRole}
                  onClick={() => isDualRole && role !== 'trader' ? switchToRole('Trader') : undefined}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    role === 'trader'
                      ? 'bg-primary text-primary-foreground'
                      : isDualRole
                        ? 'text-muted-foreground hover:text-foreground cursor-pointer'
                        : 'text-muted-foreground cursor-default'
                  }`}
                >
                  <Store className="size-4" />
                  {m.trader}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-500 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <User className="size-4" />
                Guest
              </div>
            )}

            {isAuthenticated && (
              <div className="flex items-center gap-2 text-sm">
                {user?.profile_image ? (
                  <img src={user.profile_image} alt={currentName} className="size-8 rounded-full object-cover ring-2 ring-primary/30" />
                ) : (
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold ring-2 ring-primary/30">
                    {currentName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-medium text-foreground">{currentName}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {!isAuthenticated ? (
          <div className="mb-5 rounded-lg border border-amber-400 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-500/60 dark:bg-amber-950/40 dark:text-amber-300">
            {m.demoWarning}
          </div>
        ) : (
          <div className="mb-5 rounded-lg border bg-accent/40 px-4 py-3 text-sm text-accent-foreground">
            {m.actAs} <span className="font-semibold">{currentName}</span> ({role === 'owner' ? m.landOwner : m.trader}).{' '}
            {m.loggedInRole}
          </div>
        )}

        {role === 'owner' ? (
          <div className="grid gap-5">
            <Tabs
              value={ownerTab}
              onChange={setOwnerTab}
              tabs={[
                { value: 'listings', label: m.ownerTabs[0] },
                { value: 'browse', label: m.ownerTabs[1] },
                { value: 'requests', label: m.ownerTabs[2] },
                { value: 'orders', label: m.ownerTabs[3] },
                { value: 'history', label: m.ownerTabs[4] },
              ]}
            />
            {ownerTab === 'listings' && (
              <div className="grid gap-6">
                <CreateListingForm ownerName={currentName} m={m} />
                <div className="grid gap-3">
                  <h2 className="text-sm font-semibold text-muted-foreground">{m.availableCrops}</h2>
                  <ListingsGrid role={role} currentName={currentName} m={m} listingType="crop" />
                </div>
              </div>
            )}
            {ownerTab === 'browse' && (
              <div className="grid gap-8">
                <div className="grid gap-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{m.availableCrops}</h2>
                  <ListingsGrid role={role} currentName={currentName} m={m} listingType="crop" />
                </div>
                <div className="grid gap-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{m.availableProducts}</h2>
                  <ListingsGrid role={role} currentName={currentName} m={m} listingType="product" />
                </div>
              </div>
            )}
            {ownerTab === 'requests' && <RequestsPanel role={role} currentName={currentName} m={m} />}
            {ownerTab === 'orders' && <OrdersPanel role={role} currentName={currentName} m={m} />}
            {ownerTab === 'history' && <TransactionsPanel role={role} currentName={currentName} m={m} />}
          </div>
        ) : (
          <div className="grid gap-5">
            <Tabs
              value={traderTab}
              onChange={setTraderTab}
              tabs={[
                { value: 'browse', label: m.traderTabs[0] },
                { value: 'my-products', label: m.traderTabs[1] },
                { value: 'requests', label: m.traderTabs[2] },
                { value: 'orders', label: m.traderTabs[3] },
                { value: 'history', label: m.traderTabs[4] },
              ]}
            />
            {traderTab === 'browse' && (
              <div className="grid gap-8">
                <div className="grid gap-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{m.availableCrops}</h2>
                  <ListingsGrid role={role} currentName={currentName} m={m} listingType="crop" />
                </div>
                <div className="grid gap-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{m.availableProducts}</h2>
                  <ListingsGrid role={role} currentName={currentName} m={m} listingType="product" />
                </div>
              </div>
            )}
            {traderTab === 'my-products' && (
              <div className="grid gap-6">
                <CreateProductForm traderName={currentName} m={m} />
                <div className="grid gap-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{m.availableProducts}</h2>
                  <ListingsGrid role={role} currentName={currentName} m={m} listingType="product" />
                </div>
              </div>
            )}
            {traderTab === 'requests' && <RequestsPanel role={role} currentName={currentName} m={m} />}
            {traderTab === 'orders' && <OrdersPanel role={role} currentName={currentName} m={m} />}
            {traderTab === 'history' && <TransactionsPanel role={role} currentName={currentName} m={m} />}
          </div>
        )}
      </div>
    </div>
  );
}
