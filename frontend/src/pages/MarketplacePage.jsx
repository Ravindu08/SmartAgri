/* ==================================================================================
 * SmartAgri — Marketplace  (Real DB-backed via /api/marketplace/*)
 * ================================================================================== */

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import useSWR, { mutate } from 'swr';
import CustomSelect from '../components/CustomSelect';
import PayDialog from '../components/PayDialog';
import { SkeletonListingGrid, SkeletonRows } from '../components/Skeleton';
import { relativeTime } from '../utils/relativeTime';
import { request, getAuthSession, getActiveRole, setActiveRole, getUserRoles } from '../services/api';
import {
  Leaf, Tractor, Store, User, Sprout, Plus, Package, MapPin,
  ShoppingCart, Send, Check, X, MessageSquare, Package2,
  ArrowRight, CheckCircle2, History, Trash2,
} from 'lucide-react';
import '../styles/marketplace.css';
import SpotlightTour   from '../components/tour/SpotlightTour';
import HelpButton      from '../components/tour/HelpButton';

// ── constants ─────────────────────────────────────────────────────────────────
const ORDER_STATUS_FLOW = ['Pending', 'Confirmed', 'Delivered', 'Completed'];
const CROP_TYPES = ['Vegetable', 'Grain', 'Fruit', 'Spice', 'Herb', 'Legume', 'Other'];
const PRODUCT_TYPES = ['Fertilizer', 'Pesticide', 'Herbicide', 'Fungicide', 'Seed', 'Equipment', 'Other'];

// ── multilingual strings ───────────────────────────────────────────────────────
const M = {
  en: {
    badge: '🛒 Crop Marketplace', title: 'Buying and selling agricultural products',
    sub: 'Connect with farmers and traders. Explore fresh produce, negotiate prices, and manage your orders — all in one place.',
    headerTitle: 'AgriMarket', headerSub: 'SmartAgri · Crop Marketplace',
    landOwner: 'Land Owner', trader: 'Trader', guest: 'Guest',
    actAs: 'Acting as', loggedInRole: 'Logged in to this role.',
    demoWarning: '⚠️ You are browsing as a guest. Log in or register to buy or list products.',
    addListingTitle: 'Add a Crop Listing', addListingSub: 'List your harvest for traders to browse and purchase.',
    addProductTitle: 'Add a Product Listing', addProductSub: 'List fertilizers, pesticides, seeds or other agricultural supplies.',
    cropName: 'Crop name', productName: 'Product name', cropType: 'Crop type', productCategory: 'Category',
    quantity: 'Quantity', unit: 'Unit', pricePerUnit: 'Price / unit (Rs.)',
    location: 'Location', description: 'Description',
    imageLabel: 'Product Image (optional)', imageHint: 'Upload photo (max 2MB)',
    publishListing: 'Publish Listing', listingInProgress: 'Publishing…',
    requiredFields: 'Name, quantity and price are required.',
    listed: 'listed on the marketplace.',
    yourListing: 'Your listing', cannotBuyOwn: 'You cannot buy your own listing',
    noListingsOwner: 'No crop listings yet. Add your first listing above.',
    noListingsTrader: 'No crops listed yet. Check back soon.',
    noProductsTrader: 'No products listed yet. Add your first product above.',
    noProductsOwner: 'No agricultural products listed yet. Check back soon.',
    loadingCrops: 'Loading listings…',
    sendRequest: 'Send Purchase Request', sendBuyRequest: 'Send Buy Request',
    soldOut: 'Sold Out', sending: 'Sending…', sendRequestBtn: 'Send Request',
    requestInvalid: 'Enter a valid quantity and price.',
    estimatedTotal: 'Estimated total',
    available: 'available', soldLabel: 'Sold', reservedLabel: 'Reserved',
    ownerTabs: ['My Listings', 'Browse', 'Incoming Orders', 'History'],
    traderTabs: ['Browse', 'My Products', 'My Orders', 'History', 'Incoming Requests'],
    availableCrops: 'Crop Listings', availableProducts: 'Agricultural Products',
    loadingOrders: 'Loading orders…',
    noOrdersYet: 'No orders yet.', noHistoryYet: 'No completed orders yet.',
    buyer: 'Buyer', seller: 'Seller', qty: 'Qty', price: 'Price', total: 'Total',
    status: 'Status', orderDate: 'Date',
    markAs: 'Mark as', confirmComplete: 'Confirm Receipt',
    negotiate: 'Negotiate / Note', noNotes: 'No notes yet.',
    buyerNote: "Buyer's Note", sellerNote: "Seller's Response",
    counterOffer: 'Counter offer', addNote: 'Add Note',
    yourNote: 'Your note…', yourCounter: 'Counter price (optional)',
    saving: 'Saving…', save: 'Send',
    deleteListing: 'Delete', deleteConfirm: 'Delete this listing? This cannot be undone.',
    accept: 'Accept', reject: 'Reject', cancel: 'Cancel',
    switchRole: 'Switch Role',
    pendingStatus: 'Pending', confirmedStatus: 'Confirmed',
    deliveredStatus: 'Delivered', completedStatus: 'Completed',
    rejectedStatus: 'Rejected', cancelledStatus: 'Cancelled',
    phoneAfterConfirm: 'Contact number visible once the order is confirmed',
    payNow: 'Pay Now', paymentPaid: '✓ Paid', awaitingPayment: 'Awaiting Payment',
    downloadReceipt: 'Download Receipt',
  },
  si: {
    badge: '🛒 කෘෂි වෙළඳසැල', title: 'කෘෂි නිෂ්පාදන මිලදී ගැනීම සහ විකිණීම',
    sub: 'ගොවින් සහ වෙළෙන්දන් සමග සම්බන්ධ වන්න. නැවුම් නිෂ්පාදන විමසන්න, ඇණවුම් කළමනාකරණය කරන්න.',
    headerTitle: 'AgriMarket', headerSub: 'SmartAgri · කෘෂි වෙළඳසැල',
    landOwner: 'ඉඩම් හිමිකරු', trader: 'වෙළෙන්ද', guest: 'ආගන්තුක',
    actAs: 'ලෙස ක්‍රියා කිරීම', loggedInRole: 'මෙම භූමිකාවට ලොගින් වී ඇත.',
    demoWarning: '⚠️ ඔබ ආගන්තුකයෙකු ලෙස බ්‍රව්ස් කරයි. ලොගින් වන්න.',
    addListingTitle: 'බෝග ලැයිස්තු එක් කරන්න', addListingSub: 'ඔබගේ අස්වනු ලැයිස්තු ගොනු කරන්න.',
    addProductTitle: 'නිෂ්පාදන ලැයිස්තුව එක් කරන්න', addProductSub: 'පොහොර, කෘමිනාශක, බීජ ලැයිස්තු ගොනු කරන්න.',
    cropName: 'බෝග නම', productName: 'නිෂ්පාදන නම', cropType: 'බෝග වර්ගය', productCategory: 'කාණ්ඩය',
    quantity: 'ප්‍රමාණය', unit: 'ඒකකය', pricePerUnit: 'මිල / ඒකකය (රු.)',
    location: 'ස්ථානය', description: 'විස්තරය',
    imageLabel: 'රූපය (අවශ්‍ය නොවේ)', imageHint: 'ඡායාරූපය (උපරිම 2MB)',
    publishListing: 'ලැයිස්තු ප්‍රකාශ කරන්න', listingInProgress: 'ප්‍රකාශ කිරීම…',
    requiredFields: 'නම, ප්‍රමාණය සහ මිල අවශ්‍යයි.',
    listed: 'වෙළඳසැලේ ලැයිස්තු ගොනු කිරීය.',
    yourListing: 'ඔබේ ලැයිස්තුව', cannotBuyOwn: 'ඔබේ ලැයිස්තු මිලදී ගත නොහැක',
    noListingsOwner: 'ලැයිස්තු නොමැත. ඉහතදී ලැයිස්තු ගොනු කරන්න.',
    noListingsTrader: 'ලැයිස්තු නොමැත. පසුව නැවත බලන්න.',
    noProductsTrader: 'නිෂ්පාදන නොමැත. ඉහතදී එකතු කරන්න.',
    noProductsOwner: 'කෘෂි නිෂ්පාදන නොමැත.',
    loadingCrops: 'ලැයිස්තු ලෝඩ් වෙමින්…',
    sendRequest: 'මිලදී ගැනීමේ ඉල්ලීම', sendBuyRequest: 'මිලදී ගැනීමේ ඉල්ලීම',
    soldOut: 'විකිණී ඇත', sending: 'යවමින්…', sendRequestBtn: 'ඉල්ලීම යවන්න',
    requestInvalid: 'වලංගු ප්‍රමාණයක් සහ මිලක් ඇතුළත් කරන්න.',
    estimatedTotal: 'අනුමාන මුළු',
    available: 'ලබා ගත හැකි', soldLabel: 'විකිණී', reservedLabel: 'වෙන් කළ',
    ownerTabs: ['මගේ ලැයිස්තු', 'බ්‍රව්ස්', 'ලැබෙන ඇණවුම්', 'ඉතිහාසය'],
    traderTabs: ['බ්‍රව්ස්', 'මගේ නිෂ්පාදන', 'මගේ ඇණවුම්', 'ඉතිහාසය', 'එන ඉල්ලීම්'],
    availableCrops: 'බෝග ලැයිස්තු', availableProducts: 'කෘෂි නිෂ්පාදන',
    loadingOrders: 'ඇණවුම් ලෝඩ් වෙමින්…',
    noOrdersYet: 'ඇණවුම් නොමැත.', noHistoryYet: 'සම්පූර්ණ ඇණවුම් නොමැත.',
    buyer: 'ගැනුම්කරු', seller: 'විකුණුම්කරු', qty: 'ප්‍රමාණය',
    price: 'මිල', total: 'මුළු', status: 'තත්ත්වය', orderDate: 'දිනය',
    markAs: 'ලෙස සලකුණු කරන්න', confirmComplete: 'ලැබිය බව තහවුරු කරන්න',
    negotiate: 'සාකච්ඡාව / සටහන', noNotes: 'සටහන් නොමැත.',
    buyerNote: 'ගැනුම්කරුගේ සටහන', sellerNote: 'විකුණුම්කරුගේ ප්‍රතිචාරය',
    counterOffer: 'counter offer', addNote: 'සටහනක් එකතු කරන්න',
    yourNote: 'ඔබේ සටහන…', yourCounter: 'Counter මිල (අවශ්‍ය නොවේ)',
    saving: 'සුරකිමින්…', save: 'යවන්න',
    deleteListing: 'මකන්න', deleteConfirm: 'ලැයිස්තු මකන්නද?',
    accept: 'පිළිගන්න', reject: 'ප්‍රතික්ෂේප', cancel: 'අවලංගු',
    switchRole: 'භූමිකාව මාරු',
    pendingStatus: 'අපේක්ෂිත', confirmedStatus: 'තහවුරු',
    deliveredStatus: 'බෙදාදුන්', completedStatus: 'සම්පූර්ණ',
    rejectedStatus: 'ප්‍රතික්ෂේප', cancelledStatus: 'අවලංගු',
    phoneAfterConfirm: 'ඇණවුම තහවුරු වූ පසු ඇමතුම් අංකය පෙන්වයි',
    payNow: 'දැන් ගෙවන්න', paymentPaid: '✓ ගෙවා ඇත', awaitingPayment: 'ගෙවීම බලාපොරොත්තුවෙන්',
    downloadReceipt: 'රිසිට්පත බාගන්න',
  },
  ta: {
    badge: '🛒 விவசாய சந்தை', title: 'விவசாய பொருட்களை வாங்கவும் விற்கவும்',
    sub: 'விவசாயிகள் மற்றும் வணிகர்களுடன் இணையுங்கள். புதிய உற்பத்திகளை ஆய்வு செய்யவும்.',
    headerTitle: 'AgriMarket', headerSub: 'SmartAgri · விவசாய சந்தை',
    landOwner: 'நில உரிமையாளர்', trader: 'வணிகர்', guest: 'விருந்தினர்',
    actAs: 'நடிக்கிறீர்கள்', loggedInRole: 'இந்த பங்கில் உள்நுழைந்தீர்கள்.',
    demoWarning: '⚠️ நீங்கள் விருந்தினராக உலாவுகிறீர்கள். உள்நுழையவும்.',
    addListingTitle: 'பயிர் பட்டியலைச் சேர்க்கவும்', addListingSub: 'உங்கள் அறுவடையை பட்டியலிடவும்.',
    addProductTitle: 'தயாரிப்பு பட்டியல்', addProductSub: 'உரங்கள், பூச்சிக்கொல்லிகள் பட்டியலிடவும்.',
    cropName: 'பயிர் பெயர்', productName: 'தயாரிப்பு பெயர்', cropType: 'பயிர் வகை', productCategory: 'வகை',
    quantity: 'அளவு', unit: 'அலகு', pricePerUnit: 'விலை / அலகு (ரூ.)',
    location: 'இடம்', description: 'விவரம்',
    imageLabel: 'படம் (விருப்பமான)', imageHint: 'படம் பதிவேற்று (அதிகபட்சம் 2MB)',
    publishListing: 'பட்டியலை வெளியிடு', listingInProgress: 'வெளியிடுகிறது…',
    requiredFields: 'பெயர், அளவு மற்றும் விலை அவசியம்.',
    listed: 'சந்தையில் பட்டியலிடப்பட்டது.',
    yourListing: 'உங்கள் பட்டியல்', cannotBuyOwn: 'உங்கள் பட்டியலை வாங்க முடியாது',
    noListingsOwner: 'பட்டியல்கள் இல்லை. மேலே சேர்க்கவும்.',
    noListingsTrader: 'பட்டியல்கள் இல்லை. பிறகு சரிபார்க்கவும்.',
    noProductsTrader: 'தயாரிப்புகள் இல்லை. மேலே சேர்க்கவும்.',
    noProductsOwner: 'விவசாய தயாரிப்புகள் இல்லை.',
    loadingCrops: 'பட்டியல்கள் ஏற்றுகிறது…',
    sendRequest: 'வாங்கும் கோரிக்கை', sendBuyRequest: 'வாங்கும் கோரிக்கை',
    soldOut: 'விற்றுத் தீர்ந்தது', sending: 'அனுப்புகிறது…', sendRequestBtn: 'கோரிக்கை அனுப்பு',
    requestInvalid: 'சரியான அளவு மற்றும் விலையை உள்ளிடவும்.',
    estimatedTotal: 'மதிப்பிடப்பட்ட மொத்தம்',
    available: 'கிடைக்கிறது', soldLabel: 'விற்கப்பட்டது', reservedLabel: 'ஒதுக்கப்பட்டது',
    ownerTabs: ['என் பட்டியல்கள்', 'உலாவு', 'வரும் ஆர்டர்கள்', 'வரலாறு'],
    traderTabs: ['உலாவு', 'என் தயாரிப்புகள்', 'என் ஆர்டர்கள்', 'வரலாறு', 'வரும் கோரிக்கைகள்'],
    availableCrops: 'பயிர் பட்டியல்கள்', availableProducts: 'விவசாய தயாரிப்புகள்',
    loadingOrders: 'ஆர்டர்கள் ஏற்றுகிறது…',
    noOrdersYet: 'ஆர்டர்கள் இல்லை.', noHistoryYet: 'முடிந்த ஆர்டர்கள் இல்லை.',
    buyer: 'வாங்குபவர்', seller: 'விற்பவர்', qty: 'அளவு',
    price: 'விலை', total: 'மொத்தம்', status: 'நிலை', orderDate: 'தேதி',
    markAs: 'என்று குறி', confirmComplete: 'பெற்றதை உறுதிப்படுத்து',
    negotiate: 'பேச்சு / குறிப்பு', noNotes: 'குறிப்புகள் இல்லை.',
    buyerNote: 'வாங்குபவர் குறிப்பு', sellerNote: 'விற்பவர் பதில்',
    counterOffer: 'எதிர் விலை', addNote: 'குறிப்பு சேர்க்கவும்',
    yourNote: 'உங்கள் குறிப்பு…', yourCounter: 'எதிர் விலை (விருப்பமான)',
    saving: 'சேமிக்கிறது…', save: 'அனுப்பு',
    deleteListing: 'நீக்கு', deleteConfirm: 'பட்டியலை நீக்கவா?',
    accept: 'ஒப்பு', reject: 'நிராகரி', cancel: 'ரத்து',
    switchRole: 'பங்கை மாற்று',
    pendingStatus: 'நிலுவை', confirmedStatus: 'உறுதி',
    deliveredStatus: 'வழங்கல்', completedStatus: 'முடிந்தது',
    rejectedStatus: 'நிராகரிக்கப்பட்டது', cancelledStatus: 'ரத்தானது',
    phoneAfterConfirm: 'ஆர்டர் உறுதிசெய்யப்பட்டதும் தொடர்பு எண் தெரியும்',
    payNow: 'இப்போது செலுத்து', paymentPaid: '✓ செலுத்தப்பட்டது', awaitingPayment: 'கட்டணத்திற்காக காத்திருக்கிறது',
    downloadReceipt: 'ரசீதைப் பதிவிறக்கு',
  },
};

const MARKET_TOUR_T = {
  en: {
    guest: [
      { target: 'mp-role-pill', title: 'Welcome to the Marketplace', body: 'Browse crops and products from real farmers and traders. Log in to buy or sell.' },
      { target: 'mp-filters', title: 'Search & filter', body: 'Narrow listings by name, price range, district, or category, and sort by newest or price.' },
      { target: 'mp-listings-grid', title: 'Available listings', body: 'These are live listings you can browse right now — filter, search and check prices freely.' },
    ],
    owner: [
      { target: 'mp-role-pill', title: 'You’re browsing as Land Owner', body: 'Switch roles here anytime if your account also has Trader access.' },
      { target: 'mp-owner-tabs', title: 'Your seller tools', body: 'My Listings to sell your harvest, Browse to shop, Incoming Orders and History to track sales.' },
      { target: 'mp-add-listing-form', title: 'List your harvest', body: 'Publish a new crop listing here — set quantity, price, location, and an optional photo.' },
      { target: 'mp-my-listings-grid', title: 'Manage what you’re selling', body: 'See the status of every listing you’ve published, and delete one if it’s no longer available.' },
    ],
    trader: [
      { target: 'mp-role-pill', title: 'You’re browsing as Trader', body: 'Switch roles here anytime if your account also has Land Owner access.' },
      { target: 'mp-trader-tabs', title: 'Your buyer tools', body: 'Browse to shop, My Products to sell, Incoming Requests, My Orders and History to track everything.' },
      { target: 'mp-filters', title: 'Search & filter', body: 'Narrow listings by name, price range, district, or category, and sort by newest or price.' },
      { target: 'mp-listings-grid', title: 'Browse what’s on offer', body: 'Send a purchase request straight from any listing card.' },
    ],
    next: 'Next →', back: '← Back', skip: 'Skip tour', done: 'Got it', helpAria: 'Replay the guided tour', needHelp: 'Need Help',
  },
  si: {
    guest: [
      { target: 'mp-role-pill', title: 'වෙළඳසැලට සාදරයෙන් පිළිගනිමු', body: 'සැබෑ ගොවීන් සහ ව්‍යාපාරිකයන්ගේ බෝග සහ නිෂ්පාදන පිරික්සන්න. මිලදී ගැනීමට හෝ විකිණීමට ලොගින් වන්න.' },
      { target: 'mp-filters', title: 'සොයන්න සහ පෙරහන් කරන්න', body: 'නම, මිල පරාසය, දිස්ත්‍රික්කය, හෝ කාණ්ඩය අනුව ලැයිස්තු පටු කරන්න, අලුත්ම හෝ මිල අනුව අනුපිළිවෙළට සකසන්න.' },
      { target: 'mp-listings-grid', title: 'ලබා ගත හැකි ලැයිස්තු', body: 'මේවා ඔබට දැන් පිරික්සිය හැකි සජීවී ලැයිස්තු — නිදහසේ පෙරහන් කරන්න, සොයන්න සහ මිල පරීක්ෂා කරන්න.' },
    ],
    owner: [
      { target: 'mp-role-pill', title: 'ඔබ ඉඩම් හිමිකරු ලෙස පිරික්සමින්', body: 'ඔබේ ගිණුමට ව්‍යාපාරික ප්‍රවේශයක්ද ඇත්නම් ඕනෑම වේලාවක මෙහි භූමිකා මාරු කරන්න.' },
      { target: 'mp-owner-tabs', title: 'ඔබේ විකුණුම් මෙවලම්', body: 'අස්වැන්න විකිණීමට මගේ ලැයිස්තු, සාප්පු සවාරි සඳහා පිරික්සන්න, විකුණුම් ලුහුබැඳීමට ලැබෙන ඇණවුම් සහ ඉතිහාසය.' },
      { target: 'mp-add-listing-form', title: 'ඔබේ අස්වැන්න ලැයිස්තුගත කරන්න', body: 'මෙහි නව බෝග ලැයිස්තුවක් ප්‍රකාශ කරන්න — ප්‍රමාණය, මිල, ස්ථානය, සහ අවශ්‍ය නම් ඡායාරූපයක් සකසන්න.' },
      { target: 'mp-my-listings-grid', title: 'ඔබ විකුණන දේ කළමනාකරණය කරන්න', body: 'ඔබ ප්‍රකාශ කළ සෑම ලැයිස්තුවක්ම තත්ත්වය බලන්න, තවදුරටත් නොමැති නම් එය මකන්න.' },
    ],
    trader: [
      { target: 'mp-role-pill', title: 'ඔබ ව්‍යාපාරිකයෙකු ලෙස පිරික්සමින්', body: 'ඔබේ ගිණුමට ඉඩම් හිමිකරු ප්‍රවේශයක්ද ඇත්නම් ඕනෑම වේලාවක මෙහි භූමිකා මාරු කරන්න.' },
      { target: 'mp-trader-tabs', title: 'ඔබේ මිලදී ගැනීමේ මෙවලම්', body: 'සාප්පු සවාරි සඳහා පිරික්සන්න, විකිණීමට මගේ නිෂ්පාදන, ලැබෙන ඉල්ලීම්, මගේ ඇණවුම් සහ ඉතිහාසය.' },
      { target: 'mp-filters', title: 'සොයන්න සහ පෙරහන් කරන්න', body: 'නම, මිල පරාසය, දිස්ත්‍රික්කය, හෝ කාණ්ඩය අනුව ලැයිස්තු පටු කරන්න, අලුත්ම හෝ මිල අනුව අනුපිළිවෙළට සකසන්න.' },
      { target: 'mp-listings-grid', title: 'ලබා ඇති දේ පිරික්සන්න', body: 'ඕනෑම ලැයිස්තු කාඩ්පතකින්ම මිලදී ගැනීමේ ඉල්ලීමක් යවන්න.' },
    ],
    next: 'ඊළඟට →', back: '← ආපසු', skip: 'මඟ හරින්න', done: 'තේරුණා', helpAria: 'මාර්ගෝපදේශය නැවත ධාවනය කරන්න', needHelp: 'උදව්',
  },
  ta: {
    guest: [
      { target: 'mp-role-pill', title: 'சந்தைக்கு வரவேற்கிறோம்', body: 'உண்மையான விவசாயிகள் மற்றும் வணிகர்களின் பயிர்கள் மற்றும் பொருட்களைப் பாருங்கள். வாங்க அல்லது விற்க உள்நுழையவும்.' },
      { target: 'mp-filters', title: 'தேடு & வடிகட்டு', body: 'பெயர், விலை வரம்பு, மாவட்டம் அல்லது வகை மூலம் பட்டியல்களை குறுக்கவும், புதியது அல்லது விலை அடிப்படையில் வரிசைப்படுத்தவும்.' },
      { target: 'mp-listings-grid', title: 'கிடைக்கும் பட்டியல்கள்', body: 'இவை இப்போது நீங்கள் பார்க்கக்கூடிய நேரடி பட்டியல்கள் — சுதந்திரமாக வடிகட்டவும், தேடவும், விலைகளைச் சரிபார்க்கவும்.' },
    ],
    owner: [
      { target: 'mp-role-pill', title: 'நீங்கள் நில உரிமையாளராகப் பார்க்கிறீர்கள்', body: 'உங்கள் கணக்கிற்கு வணிகர் அணுகலும் இருந்தால் எப்போது வேண்டுமானாலும் இங்கே பாத்திரங்களை மாற்றவும்.' },
      { target: 'mp-owner-tabs', title: 'உங்கள் விற்பனை கருவிகள்', body: 'அறுவடையை விற்க எனது பட்டியல்கள், உலாவ பிரவுஸ், விற்பனையைக் கண்காணிக்க வரும் ஆர்டர்கள் மற்றும் வரலாறு.' },
      { target: 'mp-add-listing-form', title: 'உங்கள் அறுவடையை பட்டியலிடுங்கள்', body: 'இங்கே புதிய பயிர் பட்டியலை வெளியிடுங்கள் — அளவு, விலை, இடம் மற்றும் விருப்பமான புகைப்படத்தை அமைக்கவும்.' },
      { target: 'mp-my-listings-grid', title: 'நீங்கள் விற்பதை நிர்வகிக்கவும்', body: 'நீங்கள் வெளியிட்ட ஒவ்வொரு பட்டியலின் நிலையையும் பாருங்கள், இனி கிடைக்கவில்லை என்றால் அதை நீக்கவும்.' },
    ],
    trader: [
      { target: 'mp-role-pill', title: 'நீங்கள் வணிகராகப் பார்க்கிறீர்கள்', body: 'உங்கள் கணக்கிற்கு நில உரிமையாளர் அணுகலும் இருந்தால் எப்போது வேண்டுமானாலும் இங்கே பாத்திரங்களை மாற்றவும்.' },
      { target: 'mp-trader-tabs', title: 'உங்கள் வாங்குதல் கருவிகள்', body: 'உலாவ பிரவுஸ், விற்க எனது பொருட்கள், வரும் கோரிக்கைகள், எனது ஆர்டர்கள் மற்றும் வரலாறு.' },
      { target: 'mp-filters', title: 'தேடு & வடிகட்டு', body: 'பெயர், விலை வரம்பு, மாவட்டம் அல்லது வகை மூலம் பட்டியல்களை குறுக்கவும், புதியது அல்லது விலை அடிப்படையில் வரிசைப்படுத்தவும்.' },
      { target: 'mp-listings-grid', title: 'கிடைப்பவற்றைப் பாருங்கள்', body: 'எந்தவொரு பட்டியல் அட்டையிலிருந்தும் நேரடியாக வாங்குதல் கோரிக்கையை அனுப்பவும்.' },
    ],
    next: 'அடுத்து →', back: '← பின்', skip: 'தவிர்', done: 'சரி', helpAria: 'வழிகாட்டலை மீண்டும் இயக்கு', needHelp: 'உதவி',
  },
};

// ── API helpers ────────────────────────────────────────────────────────────────
const authFetcher = url => request(url);
const publicFetcher = url => fetch(`${import.meta.env.VITE_API_URL || ''}${url}`).then(async r => {
  if (!r.ok) throw new Error('Failed to load');
  return r.json();
});

async function apiPost(path, body, method = 'POST') {
  return request(path, { method, body: JSON.stringify(body) });
}

async function exportReceiptPDF(order) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const price = order.agreed_price ?? order.counter_offer_price ?? order.proposed_price ?? 0;
  const total = order.requested_quantity * price;

  doc.setFontSize(20); doc.setTextColor(26, 122, 74);
  doc.text('SmartAgri — Payment Receipt', 14, 18);
  doc.setFontSize(12); doc.setTextColor(60, 60, 60);
  doc.text(`Order: ${order.listing_name}`, 14, 28);
  doc.text(`Seller: ${order.seller_name}`, 14, 35);
  doc.text(`Buyer: ${order.buyer_name}`, 14, 42);
  doc.text(`Paid on: ${order.paid_at ? new Date(order.paid_at).toLocaleDateString() : '—'}`, 14, 49);

  doc.setDrawColor(200); doc.line(14, 55, pageW - 14, 55);

  let y = 65;
  doc.setFontSize(10); doc.setTextColor(100);
  doc.text('Item', 14, y); doc.text('Qty', 110, y); doc.text('Unit Price', 140, y); doc.text('Total', 175, y);
  y += 4; doc.line(14, y, pageW - 14, y); y += 8;

  doc.setTextColor(40); doc.setFontSize(11);
  doc.text(order.listing_name || '—', 14, y);
  doc.text(String(order.requested_quantity), 110, y);
  doc.text(`Rs. ${Number(price).toLocaleString()}`, 140, y);
  doc.text(`Rs. ${Number(total).toLocaleString()}`, 175, y);

  y += 14; doc.line(14, y, pageW - 14, y); y += 8;
  doc.setFontSize(13); doc.setTextColor(26, 122, 74);
  doc.text(`Total Paid: Rs. ${Number(total).toLocaleString()}`, 14, y);

  doc.save(`receipt-${(order.listing_name || 'order').replace(/\s+/g, '_')}-${order.id?.slice(-6) || ''}.pdf`);
}

function refreshListings() {
  mutate(key => typeof key === 'string' && key.startsWith('/api/marketplace/listings'));
}
function refreshOrders() {
  mutate('/api/marketplace/orders');
}

// ── Toast (self-contained) ─────────────────────────────────────────────────────
let toastSeq = 0, toastState = [];
const toastSubs = new Set();
function emitToasts() { toastState = [...toastState]; toastSubs.forEach(fn => fn()); }
function pushToast(type, message) {
  const id = ++toastSeq;
  toastState = [...toastState, { id, type, message }];
  emitToasts();
  setTimeout(() => { toastState = toastState.filter(t => t.id !== id); emitToasts(); }, 3200);
}
const toast = { success: m => pushToast('success', m), error: m => pushToast('error', m) };

function Toaster() {
  const toasts = useSyncExternalStore(
    cb => { toastSubs.add(cb); return () => toastSubs.delete(cb); },
    () => toastState, () => toastState,
  );
  return (
    <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
          borderRadius: 8, fontSize: 14, fontWeight: 500, boxShadow: '0 4px 16px rgba(0,0,0,.15)',
          background: t.type === 'success' ? '#16a34a' : '#dc2626', color: '#fff',
        }}>
          {t.type === 'success' ? <CheckCircle2 size={16} /> : <X size={16} />}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ── Inline UI primitives ───────────────────────────────────────────────────────
function Btn({ variant = 'primary', size = 'md', disabled, children, className = '', ...rest }) {
  const base = 'inline-flex items-center gap-1.5 rounded-md font-medium transition-colors disabled:opacity-50';
  const v = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input bg-background text-foreground hover:bg-accent',
    danger: 'bg-destructive text-white hover:bg-destructive/90',
    ghost: 'text-muted-foreground hover:text-foreground hover:bg-accent',
  };
  const s = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-sm' };
  return <button disabled={disabled} className={`${base} ${v[variant]} ${s[size]} ${className}`} {...rest}>{children}</button>;
}

function Card({ className = '', children, ...rest }) {
  return <div className={`rounded-xl border bg-card shadow-sm ${className}`} {...rest}>{children}</div>;
}

function Badge({ color = 'default', children }) {
  const colors = {
    default: 'bg-secondary text-secondary-foreground',
    green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    muted: 'bg-muted text-muted-foreground',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[color] || colors.default}`}>
      {children}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

function Input({ className = '', ...rest }) {
  return (
    <input
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${className}`}
      {...rest}
    />
  );
}

function Textarea({ className = '', ...rest }) {
  return (
    <textarea
      className={`flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${className}`}
      {...rest}
    />
  );
}

function Select({ options, className = '', value, onChange, ...rest }) {
  return (
    <CustomSelect
      className={className}
      value={value}
      onChange={onChange}
      {...rest}
    >
      {options.map(o => typeof o === 'string'
        ? <option key={o} value={o}>{o}</option>
        : <option key={o.value} value={o.value}>{o.label}</option>
      )}
    </CustomSelect>
  );
}

function Modal({ open, onClose, title, desc, children }) {
  useEffect(() => {
    if (!open) return;
    const h = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-xl border bg-card p-6 shadow-xl grid gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {desc && <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Tabs({ tabs, value, onChange }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg bg-muted p-1">
      {tabs.map(t => (
        <button key={t.value} onClick={() => onChange(t.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${value === t.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Status helpers ─────────────────────────────────────────────────────────────
function statusColor(s) {
  return { Pending: 'amber', Confirmed: 'blue', Delivered: 'purple', Completed: 'green', Rejected: 'red', Cancelled: 'muted' }[s] || 'default';
}
function statusLabel(s, m) {
  return { Pending: m.pendingStatus, Confirmed: m.confirmedStatus, Delivered: m.deliveredStatus, Completed: m.completedStatus, Rejected: m.rejectedStatus, Cancelled: m.cancelledStatus }[s] || s;
}
function listingStatusColor(s) {
  return { Active: 'green', Reserved: 'amber', Sold: 'muted', Archived: 'muted' }[s] || 'default';
}
// Category chip colour — greens for crops, warmer/cooler tones for supply types
function categoryColor(cropType) {
  const t = (cropType || '').toLowerCase();
  if (t.includes('veget') || t.includes('fruit')) return 'green';
  if (t.includes('grain')) return 'amber';
  if (t.includes('fertil')) return 'blue';
  if (t.includes('seed')) return 'purple';
  if (t.includes('pestic') || t.includes('fungic') || t.includes('herbic')) return 'red';
  return 'default';
}

// ── Image upload helper ────────────────────────────────────────────────────────
function ImageUpload({ value, onChange, m }) {
  function handle(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2 MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => onChange(ev.target.result);
    reader.readAsDataURL(file);
  }
  return (
    <Field label={m.imageLabel}>
      <div className="flex items-center gap-3">
        {value
          ? <div className="relative">
              <img src={value} alt="preview" className="h-16 w-16 rounded-lg object-cover border border-input" />
              <button type="button" onClick={() => onChange('')} className="absolute -top-1.5 -right-1.5 rounded-full bg-destructive text-white text-xs w-5 h-5 flex items-center justify-center">×</button>
            </div>
          : <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-input text-muted-foreground text-2xl">📷</div>
        }
        <label className="cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent transition-colors">
          {m.imageHint}
          <input type="file" accept="image/*" className="hidden" onChange={handle} />
        </label>
      </div>
    </Field>
  );
}

// ── StatusTracker ──────────────────────────────────────────────────────────────
// Timestamp for each step, in ORDER_STATUS_FLOW order — created_at always
// exists (step 1 = order placed); the rest are only set once that step happens.
function stepDate(order, i) {
  const field = [order.created_at, order.accepted_at, order.delivered_at, order.completed_at][i];
  return field ? new Date(field).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : null;
}

function StatusTracker({ order }) {
  const idx = ORDER_STATUS_FLOW.indexOf(order.status);
  return (
    <div className="flex items-start gap-1">
      {ORDER_STATUS_FLOW.map((s, i) => (
        <div key={s} className="flex items-start gap-1">
          <div className="flex flex-col items-center" style={{ width: '36px' }}>
            <span className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${i <= idx ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {i < idx ? <CheckCircle2 size={10} /> : i + 1}
            </span>
            <span className="text-[10px] text-muted-foreground mt-1 whitespace-nowrap">
              {i <= idx ? (stepDate(order, i) || ' ') : ' '}
            </span>
          </div>
          {i < ORDER_STATUS_FLOW.length - 1 && <span className={`h-0.5 w-4 mt-2.5 ${i < idx ? 'bg-primary' : 'bg-muted'}`} />}
        </div>
      ))}
    </div>
  );
}

// ── Create Listing Form (any authenticated user) ───────────────────────────────
function CreateListingForm({ listingType = 'crop', m }) {
  const [name, setName] = useState('');
  const [type, setType] = useState(listingType === 'crop' ? CROP_TYPES[0] : PRODUCT_TYPES[0]);
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('kg');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [desc, setDesc] = useState('');
  const [image, setImage] = useState('');
  const [busy, setBusy] = useState(false);
  const types = listingType === 'crop' ? CROP_TYPES : PRODUCT_TYPES;

  async function submit(e) {
    e.preventDefault();
    if (!name || !qty || !price) { toast.error(m.requiredFields); return; }
    setBusy(true);
    try {
      await apiPost('/api/marketplace/listings', {
        crop_name: name, crop_type: type, quantity: Number(qty), unit,
        price_per_unit: Number(price), location, description: desc, image,
        listing_type: listingType,
      });
      toast.success(`"${name}" ${m.listed}`);
      setName(''); setQty(''); setPrice(''); setLocation(''); setDesc(''); setImage('');
      refreshListings();
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  }

  const title = listingType === 'crop' ? m.addListingTitle : m.addProductTitle;
  const sub   = listingType === 'crop' ? m.addListingSub   : m.addProductSub;
  const icon  = listingType === 'crop' ? <Sprout size={18} className="text-primary" /> : <Store size={18} className="text-primary" />;

  return (
    <Card>
      <div className="p-6 pb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">{icon}{title}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{sub}</p>
      </div>
      <div className="p-6 pt-0">
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={listingType === 'crop' ? m.cropName : (m.productName || 'Product name')}>
              <Input placeholder={listingType === 'crop' ? 'e.g. Fresh Tomatoes' : 'e.g. NPK Fertilizer'} value={name} onChange={e => setName(e.target.value)} />
            </Field>
            <Field label={listingType === 'crop' ? m.cropType : m.productCategory}>
              <Select options={types} value={type} onChange={e => setType(e.target.value)} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={m.quantity}>
              <Input type="number" min="0.01" step="0.01" placeholder="500" value={qty} onChange={e => setQty(e.target.value)} />
            </Field>
            <Field label={m.unit}>
              <Select value={unit} onChange={e => setUnit(e.target.value)}
                options={listingType === 'crop'
                  ? ['kg','ton','quintal','crate','bag']
                  : ['kg','L','bag','bottle','box','packet','unit']} />
            </Field>
            <Field label={m.pricePerUnit}>
              <Input type="number" min="0.01" step="0.01" placeholder="350" value={price} onChange={e => setPrice(e.target.value)} />
            </Field>
          </div>
          <Field label={m.location}>
            <Input placeholder="e.g. Anuradhapura" value={location} onChange={e => setLocation(e.target.value)} />
          </Field>
          <Field label={m.description}>
            <Textarea placeholder="Quality, harvest date, grade…" value={desc} onChange={e => setDesc(e.target.value)} rows={2} />
          </Field>
          <ImageUpload value={image} onChange={setImage} m={m} />
          <div>
            <Btn type="submit" disabled={busy}>
              <Plus size={16} />
              {busy ? m.listingInProgress : m.publishListing}
            </Btn>
          </div>
        </form>
      </div>
    </Card>
  );
}

// ── Order dialog (buyer places order) ─────────────────────────────────────────
function OrderDialog({ listing, currentUserId, m }) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(String(Math.min(listing.quantity, 50)));
  const [proposedPrice, setProposedPrice] = useState(String(listing.price_per_unit));
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const total = (Number(qty) || 0) * (Number(proposedPrice) || 0);
  const isActive = listing.status === 'Active';
  const btnLabel = listing.listing_type === 'product' ? m.sendBuyRequest : m.sendRequest;

  async function submit() {
    if (!Number(qty) || !Number(proposedPrice)) { toast.error(m.requestInvalid); return; }
    if (Number(qty) > listing.quantity) { toast.error(`Only ${listing.quantity} ${listing.unit} available`); return; }
    setBusy(true);
    try {
      const newOrder = await apiPost('/api/marketplace/orders', {
        listing_id: listing.id,
        requested_quantity: Number(qty),
        proposed_price: Number(proposedPrice),
        buyer_note: note || undefined,
      });
      toast.success(btnLabel + ' sent!');
      setOpen(false);
      mutate('/api/marketplace/orders', (prev) => [newOrder, ...(prev || [])], { revalidate: false });
      refreshListings();
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  }

  if (listing.owner_id === currentUserId) {
    return <p className="text-xs text-muted-foreground text-center w-full">{m.yourListing}</p>;
  }

  return (
    <>
      <Btn className="w-full" disabled={!isActive} onClick={() => setOpen(true)}>
        <ShoppingCart size={16} />
        {!isActive ? (listing.status === 'Sold' ? m.soldOut : listing.status) : btnLabel}
      </Btn>
      <Modal open={open} onClose={() => setOpen(false)}
        title={btnLabel + ' — ' + listing.crop_name}
        desc={`Listed by ${listing.owner_name} · Rs. ${Number(listing.price_per_unit).toLocaleString()}/${listing.unit}`}>
        <div className="grid gap-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`${m.quantity} (${listing.unit})`}>
              <Input type="number" min="0.01" max={listing.quantity} value={qty} onChange={e => setQty(e.target.value)} />
              <p className="text-xs text-muted-foreground">{listing.quantity} {listing.unit} {m.available}</p>
            </Field>
            <Field label={`${m.pricePerUnit} / ${listing.unit}`}>
              <Input type="number" min="0.01" step="0.01" value={proposedPrice} onChange={e => setProposedPrice(e.target.value)} />
            </Field>
          </div>
          <Field label={m.buyerNote + ' (optional)'}>
            <Textarea placeholder={m.yourNote} value={note} onChange={e => setNote(e.target.value)} rows={2} />
          </Field>
          <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
            <span className="text-muted-foreground">{m.estimatedTotal}</span>
            <span className="font-semibold">Rs. {total.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex justify-end">
          <Btn onClick={submit} disabled={busy}>
            <Send size={16} />
            {busy ? m.sending : m.sendRequestBtn}
          </Btn>
        </div>
      </Modal>
    </>
  );
}

// ── Delete listing dialog ──────────────────────────────────────────────────────
function DeleteDialog({ listingId, cropName, m }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  async function confirm() {
    setBusy(true);
    try {
      await request(`/api/marketplace/listings/${listingId}`, { method: 'DELETE' });
      toast.success(`"${cropName}" deleted.`);
      setOpen(false);
      refreshListings();
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  }
  return (
    <>
      <Btn variant="danger" size="sm" onClick={() => setOpen(true)}><Trash2 size={14} /></Btn>
      <Modal open={open} onClose={() => setOpen(false)} title={m.deleteListing} desc={m.deleteConfirm}>
        <div className="flex justify-end gap-2">
          <Btn variant="outline" onClick={() => setOpen(false)}>{m.cancel}</Btn>
          <Btn variant="danger" onClick={confirm} disabled={busy}>{busy ? '…' : m.deleteListing}</Btn>
        </div>
      </Modal>
    </>
  );
}

// ── Listing card ───────────────────────────────────────────────────────────────
// ── Seller reviews popover ───────────────────────────────────────────────────
function SellerReviewsButton({ userId, rating, count }) {
  const [open, setOpen] = useState(false);
  const [reviews, setReviews] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!open || reviews !== null) return;
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/ratings/users/${userId}/reviews`)
      .then(r => { if (!r.ok) throw new Error('Failed to load reviews'); return r.json(); })
      .then(setReviews)
      .catch(e => setErr(e.message));
  }, [open, userId, reviews]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ color: 'var(--amber, #f59e0b)', fontWeight: 600, background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
      >
        {' '}⭐ {rating} ({count})
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Seller Reviews" desc={`${rating} ★ average from ${count} rating${count === 1 ? '' : 's'}`}>
        <div className="grid gap-3" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
          {err && <p className="text-sm text-red-600">{err}</p>}
          {reviews === null && !err && <p className="text-sm text-muted-foreground">Loading…</p>}
          {reviews?.length === 0 && <p className="text-sm text-muted-foreground">No written reviews yet.</p>}
          {reviews?.map(r => (
            <div key={r.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">{r.rater_name}</span>
                <span style={{ color: 'var(--amber, #f59e0b)', fontSize: '15px', fontWeight: 600 }}>{'⭐'.repeat(r.score)}</span>
              </div>
              {r.comment && <p className="text-sm text-muted-foreground mt-1">{r.comment}</p>}
              <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}

function ListingCard({ listing, currentUserId, isAuthenticated, m, showDelete = false }) {
  const isOwn = listing.owner_id === currentUserId;

  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      {listing.image && (
        <div className="h-40 w-full overflow-hidden">
          <img src={listing.image} alt={listing.crop_name} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
        </div>
      )}
      <div className="p-5 pb-3 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-foreground text-balance break-words">{listing.crop_name}</h3>
          <Badge color={listingStatusColor(listing.status)}>{listing.status}</Badge>
        </div>
        {listing.crop_type && (
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge color={categoryColor(listing.crop_type)}>{listing.crop_type}</Badge>
            {listing.listing_type === 'product' && (
              <span className="text-xs text-muted-foreground">Agricultural Product</span>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1"><Package size={12} />{listing.quantity} {listing.unit}</span>
          {listing.location && <span className="flex items-center gap-1"><MapPin size={12} />{listing.location}</span>}
        </div>
        {listing.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{listing.description}</p>}
        <div className="text-2xl font-bold text-primary mb-1">
          Rs. {Number(listing.price_per_unit).toLocaleString()}
          <span className="text-sm font-normal text-muted-foreground">/{listing.unit}</span>
        </div>
        <p className="text-xs text-muted-foreground mb-1">
          Seller: {listing.owner_name}
          {listing.seller_rating != null && (
            <SellerReviewsButton userId={listing.owner_id} rating={listing.seller_rating} count={listing.seller_rating_count} />
          )}
        </p>
        {listing.owner_phone && (
          <p className="text-xs text-muted-foreground mb-3" style={{ color: 'var(--green-primary)' }}>📞 {listing.owner_phone}</p>
        )}

        <div className="mt-auto flex gap-2">
          {showDelete && isOwn
            ? <DeleteDialog listingId={listing.id} cropName={listing.crop_name} m={m} />
            : null
          }
          {isAuthenticated && !isOwn
            ? <OrderDialog listing={listing} currentUserId={currentUserId} m={m} />
            : isOwn
              ? null
              : <p className="text-xs text-muted-foreground">{m.demoWarning.replace('⚠️ ', '')}</p>
          }
        </div>
      </div>
    </Card>
  );
}

// ── Listings grid ──────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest first' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating',     label: 'Seller rating' },
];

function ListingsGrid({ listingType, currentUserId, isAuthenticated, m, showDelete = false }) {
  const [filters, setFilters] = useState({ search: '', min_price: '', max_price: '', district: '', category: '' });
  const [sortBy, setSortBy] = useState('newest');
  const categoryOptions = listingType === 'crop' ? CROP_TYPES : PRODUCT_TYPES;

  const swrKey = useMemo(() => {
    const p = new URLSearchParams();
    if (filters.search)    p.set('search', filters.search);
    if (filters.min_price) p.set('min_price', filters.min_price);
    if (filters.max_price) p.set('max_price', filters.max_price);
    if (filters.district)  p.set('district', filters.district);
    if (filters.category)  p.set('crop_type', filters.category);
    const q = p.toString();
    return `/api/marketplace/listings${q ? `?${q}` : ''}`;
  }, [filters]);

  const { data, isLoading } = useSWR(swrKey, publicFetcher);
  const listings = (data || [])
    .filter(l => (l.listing_type || 'crop') === listingType)
    .sort((a, b) => {
      if (sortBy === 'price_asc')  return a.price_per_unit - b.price_per_unit;
      if (sortBy === 'price_desc') return b.price_per_unit - a.price_per_unit;
      if (sortBy === 'rating')     return (b.seller_rating || 0) - (a.seller_rating || 0);
      return new Date(b.created_at) - new Date(a.created_at);
    });

  return (
    <>
      {/* Filter bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', alignItems: 'center' }} data-tour={listingType === 'crop' ? 'mp-filters' : undefined}>
        <input
          type="text"
          placeholder="Search by name…"
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          style={{ flex: '1 1 160px', padding: '7px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: '15px' }}
        />
        <input
          type="number"
          placeholder="Min price (Rs.)"
          value={filters.min_price}
          onChange={e => setFilters(f => ({ ...f, min_price: e.target.value }))}
          style={{ flex: '1 1 120px', padding: '7px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: '15px' }}
        />
        <input
          type="number"
          placeholder="Max price (Rs.)"
          value={filters.max_price}
          onChange={e => setFilters(f => ({ ...f, max_price: e.target.value }))}
          style={{ flex: '1 1 120px', padding: '7px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: '15px' }}
        />
        <input
          type="text"
          placeholder="District…"
          value={filters.district}
          onChange={e => setFilters(f => ({ ...f, district: e.target.value }))}
          style={{ flex: '1 1 120px', padding: '7px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: '15px' }}
        />
        <Select
          style={{ flex: '1 1 150px' }}
          value={filters.category}
          onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
          options={[{ value: '', label: 'All categories' }, ...categoryOptions]}
        />
        <Select
          style={{ flex: '1 1 170px' }}
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          options={SORT_OPTIONS}
        />
        {(filters.search || filters.min_price || filters.max_price || filters.district || filters.category) && (
          <button
            type="button"
            onClick={() => setFilters({ search: '', min_price: '', max_price: '', district: '', category: '' })}
            style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--muted)', cursor: 'pointer', fontSize: '15px' }}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {isLoading
        ? <SkeletonListingGrid count={6} />
        : listings.length === 0
          ? <Card><div className="py-12 text-center text-sm text-muted-foreground">
              {listingType === 'crop' ? (showDelete ? m.noListingsOwner : m.noListingsTrader) : (showDelete ? m.noProductsTrader : m.noProductsOwner)}
            </div></Card>
          : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map(l => (
                <ListingCard key={l.id} listing={l} currentUserId={currentUserId} isAuthenticated={isAuthenticated} m={m} showDelete={showDelete} />
              ))}
            </div>
      }
    </>
  );
}

// ── My Listings grid (seller's own listings) ───────────────────────────────────
function MyListingsGrid({ listingType, currentUserId, m }) {
  const { data, isLoading } = useSWR('/api/marketplace/listings/me', authFetcher);
  const listings = (data || []).filter(l => (l.listing_type || 'crop') === listingType);

  if (isLoading) return <SkeletonListingGrid count={3} />;
  if (listings.length === 0) {
    return <Card><div className="py-12 text-center text-sm text-muted-foreground">{listingType === 'crop' ? m.noListingsOwner : m.noProductsTrader}</div></Card>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map(l => (
        <Card key={l.id} className="flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          {l.image && <div className="h-36 w-full overflow-hidden"><img src={l.image} alt={l.crop_name} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" /></div>}
          <div className="p-4 flex flex-col flex-1">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-foreground">{l.crop_name}</h3>
              <Badge color={listingStatusColor(l.status)}>{l.status}</Badge>
            </div>
            {l.crop_type && (
              <div className="mb-1">
                <Badge color={categoryColor(l.crop_type)}>{l.crop_type}</Badge>
              </div>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mb-2">
              <span>{l.quantity} {l.unit}</span>
              {l.location && <span className="flex items-center gap-1"><MapPin size={10} />{l.location}</span>}
            </div>
            <div className="text-xl font-bold text-primary mb-1">Rs. {Number(l.price_per_unit).toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/{l.unit}</span></div>
            <div className="mt-auto pt-2 flex justify-end">
              <DeleteDialog listingId={l.id} cropName={l.crop_name} m={m} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ── Negotiation dialog ─────────────────────────────────────────────────────────
function NegotiationDialog({ order, isSeller, currentUserId, m }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [counter, setCounter] = useState('');
  const [busy, setBusy] = useState(false);
  const [thread, setThread] = useState(null);
  const [threadErr, setThreadErr] = useState('');

  async function loadThread() {
    try {
      const rows = await request(`/api/marketplace/orders/${order.id}/negotiation`);
      setThread(rows);
    } catch (err) { setThreadErr(err.message); }
  }

  useEffect(() => { if (open) loadThread(); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  async function send() {
    if (!note) { toast.error('Type a note first'); return; }
    setBusy(true);
    try {
      await apiPost(`/api/marketplace/orders/${order.id}/negotiation`, {
        message: note,
        proposed_price: counter ? Number(counter) : undefined,
      });
      toast.success('Note sent.');
      setNote(''); setCounter('');
      await loadThread();
      refreshOrders();
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  }

  return (
    <>
      <Btn variant="outline" size="sm" onClick={() => setOpen(true)}>
        <MessageSquare size={14} />
        {m.negotiate}
      </Btn>
      <Modal open={open} onClose={() => setOpen(false)} title={m.negotiate}
        desc={`${order.listing_name} · ${order.requested_quantity} ${order.unit ?? 'units'} @ Rs. ${Number(order.proposed_price || 0).toLocaleString()}`}>
        <div className="grid gap-3">
          <div className="grid gap-2" style={{ maxHeight: '45vh', overflowY: 'auto' }}>
            {threadErr && <p className="text-sm text-red-600">{threadErr}</p>}
            {thread === null && !threadErr && <p className="text-sm text-muted-foreground">Loading…</p>}
            {thread?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">{m.noNotes}</p>
            )}
            {thread?.map(msg => {
              const mine = msg.sender_id === currentUserId;
              return (
                <div key={msg.id} className="rounded-md border bg-muted/50 p-3" style={{ marginLeft: mine ? '20%' : 0, marginRight: mine ? 0 : '20%' }}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-muted-foreground">{msg.sender_name}</p>
                    <p className="text-xs text-muted-foreground">{relativeTime(msg.created_at)}</p>
                  </div>
                  <p className="text-sm mt-1">{msg.message}</p>
                  {msg.proposed_price && (
                    <p className="text-xs mt-1 text-primary font-medium">Offer: Rs. {Number(msg.proposed_price).toLocaleString()}</p>
                  )}
                </div>
              );
            })}
          </div>
          {order.status === 'Pending' || order.status === 'Confirmed' ? (
            <div className="grid gap-2 border-t pt-3">
              <p className="text-xs font-semibold text-muted-foreground">{m.addNote}</p>
              <Textarea placeholder={m.yourNote} value={note} onChange={e => setNote(e.target.value)} rows={2} />
              {isSeller && (
                <Input type="number" min="0.01" step="0.01" placeholder={m.yourCounter} value={counter} onChange={e => setCounter(e.target.value)} />
              )}
              <Btn onClick={send} disabled={busy} size="sm">
                <Send size={14} />
                {busy ? m.saving : m.save}
              </Btn>
            </div>
          ) : null}
        </div>
      </Modal>
    </>
  );
}

// ── Order card ─────────────────────────────────────────────────────────────────
function RatingModal({ order, onClose }) {
  const [score, setScore]   = useState(0);
  const [hovered, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy]     = useState(false);
  const [done, setDone]     = useState(false);

  const submit = async () => {
    if (!score) { toast.error('Please select a star rating'); return; }
    setBusy(true);
    try {
      await request(`/api/ratings/orders/${order.id}`, { method: 'POST', body: JSON.stringify({ score, comment: comment.trim() || undefined }) });
      setDone(true);
      setTimeout(() => onClose(true), 1200);
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={onClose}>
      <div style={{ background: 'var(--card)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '400px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        {done ? (
          <div style={{ textAlign: 'center', fontSize: '32px' }}>⭐ Thanks for rating!</div>
        ) : (
          <>
            <h3 style={{ margin: '0 0 8px', color: 'var(--text)', fontSize: '18px' }}>Rate your experience</h3>
            <p style={{ margin: '0 0 16px', color: 'var(--muted)', fontSize: '15px' }}>{order.listing_name} · Seller: {order.seller_name}</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} type="button" onClick={() => setScore(s)} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
                  style={{ fontSize: '28px', background: 'none', border: 'none', cursor: 'pointer', transform: (hovered || score) >= s ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.1s', filter: (hovered || score) >= s ? 'none' : 'grayscale(1)' }}>
                  ⭐
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              placeholder="Leave a comment (optional)…"
              value={comment}
              onChange={e => setComment(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: '15px', resize: 'vertical', marginBottom: '12px', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '15px' }}>Cancel</button>
              <button type="button" onClick={submit} disabled={busy || !score} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--green-primary)', color: '#fff', cursor: 'pointer', fontSize: '15px', fontWeight: 600, opacity: (!score || busy) ? 0.6 : 1 }}>
                {busy ? 'Submitting…' : 'Submit Rating'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, currentUserId, m, showHistory = false }) {
  const isSeller = order.seller_id === currentUserId;
  const isBuyer  = order.buyer_id  === currentUserId;
  const isPaid   = order.payment_status === 'Paid';
  const [busy, setBusy] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [rated, setRated] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  // Briefly ring-flash the status badge when the status actually changes
  const [statusFlash, setStatusFlash] = useState(false);
  const prevStatusRef = useRef(order.status);
  useEffect(() => {
    if (prevStatusRef.current !== order.status) {
      setStatusFlash(true);
      prevStatusRef.current = order.status;
      const id = setTimeout(() => setStatusFlash(false), 1000);
      return () => clearTimeout(id);
    }
  }, [order.status]);

  async function updateStatus(newStatus) {
    setBusy(true);
    try {
      await apiPost(`/api/marketplace/orders/${order.id}/status`, { status: newStatus }, 'PUT');
      toast.success(`Order marked as ${newStatus}`);
      refreshOrders();
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  }

  const idx  = ORDER_STATUS_FLOW.indexOf(order.status);
  const next = ORDER_STATUS_FLOW[idx + 1];

  const effectivePrice = order.agreed_price ?? order.counter_offer_price ?? order.proposed_price ?? 0;
  const totalVal = order.requested_quantity * effectivePrice;

  return (
    <Card>
      <div className="p-4 grid gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground break-words">{order.listing_name}</span>
              <span className={statusFlash ? 'status-flash' : undefined}>
                <Badge color={statusColor(order.status)}>{statusLabel(order.status, m)}</Badge>
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {order.requested_quantity} units · Rs. {Number(effectivePrice).toLocaleString()} ea. ={' '}
              <span className="font-medium text-foreground">Rs. {totalVal.toLocaleString()}</span>
            </p>
            {(order.status === 'Confirmed' || order.status === 'Delivered' || order.status === 'Completed') && (
              <p className="text-xs mt-0.5" style={{ color: isPaid ? 'var(--green-primary)' : 'var(--amber, #b45309)' }}>
                {isPaid ? m.paymentPaid : `⏳ ${m.awaitingPayment}`}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              {isSeller ? `${m.buyer}: ${order.buyer_name}` : `${m.seller}: ${order.seller_name}`}
              {' · '}{new Date(order.created_at).toLocaleDateString()}
            </p>
            {isSeller && (order.buyer_phone
              ? <p className="text-xs mt-0.5" style={{ color: 'var(--green-primary)' }}>📞 {order.buyer_phone}</p>
              : order.status === 'Pending' && <p className="text-xs mt-0.5 text-muted-foreground">🔒 {m.phoneAfterConfirm}</p>
            )}
            {isBuyer && (order.seller_phone
              ? <p className="text-xs mt-0.5" style={{ color: 'var(--green-primary)' }}>📞 {order.seller_phone}</p>
              : order.status === 'Pending' && <p className="text-xs mt-0.5 text-muted-foreground">🔒 {m.phoneAfterConfirm}</p>
            )}
          </div>
        </div>

        {!showHistory && ORDER_STATUS_FLOW.includes(order.status) && (
          <StatusTracker order={order} />
        )}

        <div className="flex flex-wrap gap-2">
          <NegotiationDialog order={order} isSeller={isSeller} currentUserId={currentUserId} m={m} />

          {/* Seller actions */}
          {isSeller && order.status === 'Pending' && (
            <>
              <Btn size="sm" onClick={() => updateStatus('Confirmed')} disabled={busy}>
                <Check size={14} />{m.accept}
              </Btn>
              <Btn size="sm" variant="danger" onClick={() => updateStatus('Rejected')} disabled={busy}>
                <X size={14} />{m.reject}
              </Btn>
            </>
          )}
          {isSeller && order.status === 'Confirmed' && (
            <Btn size="sm" onClick={() => updateStatus('Delivered')} disabled={busy || !isPaid} title={!isPaid ? m.awaitingPayment : undefined}>
              <ArrowRight size={14} />{m.markAs} Delivered
            </Btn>
          )}

          {/* Buyer pays after the seller confirms — required before the seller can mark it Delivered */}
          {isBuyer && order.status === 'Confirmed' && !isPaid && (
            <Btn size="sm" onClick={() => setPayOpen(true)} disabled={busy}>
              💳 {m.payNow}
            </Btn>
          )}

          {/* Buyer confirms receipt */}
          {isBuyer && order.status === 'Delivered' && (
            <Btn size="sm" onClick={() => updateStatus('Completed')} disabled={busy}>
              <CheckCircle2 size={14} />{m.confirmComplete}
            </Btn>
          )}

          {/* Buyer can cancel before delivery (stock is restored automatically) */}
          {isBuyer && (order.status === 'Pending' || order.status === 'Confirmed') && (
            <Btn size="sm" variant="danger" onClick={() => updateStatus('Cancelled')} disabled={busy}>
              <X size={14} />{m.cancel}
            </Btn>
          )}

          {/* Buyer rates completed order */}
          {isBuyer && order.status === 'Completed' && !rated && (
            <Btn size="sm" variant="outline" onClick={() => setRatingOpen(true)}>
              ⭐ Rate Seller
            </Btn>
          )}

          {/* Either party can download a receipt once paid */}
          {isPaid && (
            <Btn size="sm" variant="outline" onClick={() => exportReceiptPDF(order)}>
              🧾 {m.downloadReceipt}
            </Btn>
          )}
        </div>
      </div>
      {ratingOpen && <RatingModal order={order} onClose={(wasSuccess) => { setRatingOpen(false); if (wasSuccess) setRated(true); }} />}
      {payOpen && (
        <PayDialog
          order={order}
          onClose={() => setPayOpen(false)}
          onSuccess={() => { setPayOpen(false); toast.success(m.paymentPaid); refreshOrders(); }}
        />
      )}
    </Card>
  );
}

// ── Orders panel ───────────────────────────────────────────────────────────────
function OrdersPanel({ currentUserId, m, historyMode = false, filterRole }) {
  const { data, isLoading } = useSWR('/api/marketplace/orders', authFetcher);
  let allOrders = data || [];

  // 'seller' → incoming requests on my listings; 'buyer' → my purchases
  if (filterRole === 'seller') allOrders = allOrders.filter(o => o.seller_id === currentUserId);
  if (filterRole === 'buyer')  allOrders = allOrders.filter(o => o.buyer_id === currentUserId);

  const active = allOrders.filter(o => ['Pending', 'Confirmed', 'Delivered'].includes(o.status));
  const history = allOrders.filter(o => ['Completed', 'Rejected', 'Cancelled'].includes(o.status));
  const orders = historyMode ? history : active;

  if (isLoading) return <SkeletonRows count={3} />;
  if (orders.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
          {historyMode ? <History size={24} /> : <Package2 size={24} />}
          {historyMode ? m.noHistoryYet : m.noOrdersYet}
        </div>
      </Card>
    );
  }

  // History: summary stats
  if (historyMode) {
    const completed = orders.filter(o => o.status === 'Completed');
    const totalVal  = completed.reduce((s, o) => s + o.requested_quantity * (o.agreed_price ?? o.proposed_price ?? 0), 0);
    return (
      <div className="grid gap-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Orders', val: orders.length },
            { label: 'Completed', val: completed.length },
            { label: 'Total Value', val: `Rs. ${totalVal.toLocaleString()}` },
          ].map(c => (
            <Card key={c.label}>
              <div className="py-4 text-center">
                <p className="text-2xl font-bold text-foreground">{c.val}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.label}</p>
              </div>
            </Card>
          ))}
        </div>
        <div className="grid gap-3">
          {orders.map(o => <OrderCard key={o.id} order={o} currentUserId={currentUserId} m={m} showHistory />)}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {orders.map(o => <OrderCard key={o.id} order={o} currentUserId={currentUserId} m={m} />)}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function MarketplacePage() {
  const outlet = useOutletContext() || {};
  const lang = outlet?.lang || 'en';
  const m = M[lang] || M.en;

  const { user } = getAuthSession();
  const isAuthenticated = !!user;
  const sessionRole = getActiveRole();
  const role = sessionRole === 'Land Owner' ? 'owner' : sessionRole === 'Trader' ? 'trader' : 'guest';
  const userRoles = getUserRoles();
  const isDual = userRoles.includes('Land Owner') && userRoles.includes('Trader');

  const [roleVersion, setRoleVersion] = useState(0);
  function switchToRole(r) { setActiveRole(r); setRoleVersion(v => v + 1); }

  const [ownerTab, setOwnerTab] = useState('my-listings');
  const [traderTab, setTraderTab] = useState('browse');

  const currentUserId = user?.id ?? null;

  const marketTourT = MARKET_TOUR_T[lang] || MARKET_TOUR_T.en;
  const marketTourSteps = marketTourT[role] || marketTourT.guest;
  const [tourOpen, setTourOpen] = useState(false);

  return (
    <div className="marketplace-sprint min-h-screen bg-background">
      <Toaster />

      {/* Hero */}
      <div className="marketplace-hero">
        <div className="marketplace-hero-inner">
          <div className="marketplace-hero-badge">{m.badge}</div>
          <h1 className="marketplace-hero-title">{m.title}</h1>
          <p className="marketplace-hero-sub">{m.sub}</p>
        </div>
      </div>
      <div className="marketplace-hero-wave" />

      {/* Header bar */}
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Leaf size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-tight text-foreground">{m.headerTitle}</h2>
              <p className="text-xs text-muted-foreground">
                {m.headerSub}
                {isAuthenticated && ` · ${sessionRole ?? user?.role}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {isAuthenticated ? (
              <div className="flex rounded-lg border bg-muted p-1" data-tour="mp-role-pill">
                <button
                  onClick={() => isDual && role !== 'owner' ? switchToRole('Land Owner') : undefined}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${role === 'owner' ? 'bg-primary text-primary-foreground' : isDual ? 'text-muted-foreground hover:text-foreground cursor-pointer' : 'text-muted-foreground cursor-default'}`}>
                  <Tractor size={15} />{m.landOwner}
                </button>
                <button
                  onClick={() => isDual && role !== 'trader' ? switchToRole('Trader') : undefined}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${role === 'trader' ? 'bg-primary text-primary-foreground' : isDual ? 'text-muted-foreground hover:text-foreground cursor-pointer' : 'text-muted-foreground cursor-default'}`}>
                  <Store size={15} />{m.trader}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-lg border bg-muted px-3 py-1.5 text-sm text-muted-foreground" data-tour="mp-role-pill">
                <User size={15} />{m.guest}
              </div>
            )}

            {isAuthenticated && (
              <div className="flex items-center gap-2 text-sm">
                {user?.profile_image
                  ? <img src={user.profile_image} alt={user.full_name} className="size-8 rounded-full object-cover ring-2 ring-primary/30" />
                  : <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold ring-2 ring-primary/30">{(user?.full_name || 'U').charAt(0).toUpperCase()}</div>
                }
                <span className="font-medium text-foreground">{user?.full_name}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-[1320px] px-4 py-6">

        {/* Role context banner */}
        {!isAuthenticated ? (
          <div className="mb-5 rounded-lg border border-amber-400 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-500/60 dark:bg-amber-950/40 dark:text-amber-300">
            {m.demoWarning}
            {' '}<Link to="/login" className="underline font-semibold ml-1">Login</Link>
            {' '}<span className="mx-1">·</span>
            <Link to="/register" className="underline font-semibold">Register</Link>
          </div>
        ) : (
          <div className="mb-5 rounded-lg border bg-accent/40 px-4 py-3 text-sm text-accent-foreground">
            {m.actAs} <strong>{user?.full_name}</strong> ({role === 'owner' ? m.landOwner : m.trader}).{' '}
            {m.loggedInRole}
          </div>
        )}

        {/* Guest view — browse only */}
        {!isAuthenticated && (
          <div className="grid gap-8">
            <div className="grid gap-3" data-tour="mp-listings-grid">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{m.availableCrops}</h2>
              <ListingsGrid listingType="crop" currentUserId={null} isAuthenticated={false} m={m} />
            </div>
            <div className="grid gap-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{m.availableProducts}</h2>
              <ListingsGrid listingType="product" currentUserId={null} isAuthenticated={false} m={m} />
            </div>
          </div>
        )}

        {/* Land Owner view */}
        {isAuthenticated && role === 'owner' && (
          <div className="grid gap-5">
            <div data-tour="mp-owner-tabs">
            <Tabs value={ownerTab} onChange={setOwnerTab} tabs={[
              { value: 'my-listings', label: m.ownerTabs[0] },
              { value: 'browse',      label: m.ownerTabs[1] },
              { value: 'orders',      label: m.ownerTabs[2] },
              { value: 'history',     label: m.ownerTabs[3] },
            ]} />
            </div>

            {ownerTab === 'my-listings' && (
              <div className="grid gap-6">
                <div data-tour="mp-add-listing-form"><CreateListingForm listingType="crop" m={m} /></div>
                <div className="grid gap-3" data-tour="mp-my-listings-grid">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{m.availableCrops}</h2>
                  <MyListingsGrid listingType="crop" currentUserId={currentUserId} m={m} />
                </div>
              </div>
            )}
            {ownerTab === 'browse' && (
              <div className="grid gap-8">
                <div className="grid gap-3" data-tour="mp-listings-grid">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{m.availableCrops}</h2>
                  <ListingsGrid listingType="crop" currentUserId={currentUserId} isAuthenticated m={m} />
                </div>
                <div className="grid gap-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{m.availableProducts}</h2>
                  <ListingsGrid listingType="product" currentUserId={currentUserId} isAuthenticated m={m} />
                </div>
              </div>
            )}
            {ownerTab === 'orders'  && <OrdersPanel currentUserId={currentUserId} m={m} filterRole="seller" />}
            {ownerTab === 'history' && <OrdersPanel currentUserId={currentUserId} m={m} historyMode />}
          </div>
        )}

        {/* Trader view */}
        {isAuthenticated && role === 'trader' && (
          <div className="grid gap-5">
            <div data-tour="mp-trader-tabs">
            <Tabs value={traderTab} onChange={setTraderTab} tabs={[
              { value: 'browse',       label: m.traderTabs[0] },
              { value: 'my-products',  label: m.traderTabs[1] },
              { value: 'incoming',     label: m.traderTabs[4] || 'Incoming Requests' },
              { value: 'orders',       label: m.traderTabs[2] },
              { value: 'history',      label: m.traderTabs[3] },
            ]} />
            </div>

            {traderTab === 'browse' && (
              <div className="grid gap-8">
                <div className="grid gap-3" data-tour="mp-listings-grid">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{m.availableCrops}</h2>
                  <ListingsGrid listingType="crop" currentUserId={currentUserId} isAuthenticated m={m} />
                </div>
                <div className="grid gap-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{m.availableProducts}</h2>
                  <ListingsGrid listingType="product" currentUserId={currentUserId} isAuthenticated m={m} />
                </div>
              </div>
            )}
            {traderTab === 'my-products' && (
              <div className="grid gap-6">
                <CreateListingForm listingType="product" m={m} />
                <div className="grid gap-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{m.availableProducts}</h2>
                  <MyListingsGrid listingType="product" currentUserId={currentUserId} m={m} />
                </div>
              </div>
            )}
            {traderTab === 'incoming' && <OrdersPanel currentUserId={currentUserId} m={m} filterRole="seller" />}
            {traderTab === 'orders'   && <OrdersPanel currentUserId={currentUserId} m={m} filterRole="buyer" />}
            {traderTab === 'history'  && <OrdersPanel currentUserId={currentUserId} m={m} historyMode />}
          </div>
        )}
      </div>

      <HelpButton label={marketTourT.needHelp} ariaLabel={marketTourT.helpAria} onClick={() => setTourOpen(true)} />
      <SpotlightTour
        steps={marketTourSteps}
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        labels={{ next: marketTourT.next, back: marketTourT.back, skip: marketTourT.skip, done: marketTourT.done }}
      />
    </div>
  );
}
