import { useEffect } from 'react';
import { useLocation } from 'react-router';

const SITE = 'SmartAgri';
const HOME_TITLE = 'SmartAgri — Intelligent Farming for Sri Lanka';

// Longest prefix wins, so '/landowner/farms/add' is matched before '/landowner/farms'.
const TITLES = [
  ['/login', 'Log In'],
  ['/register', 'Register'],
  ['/verify-code', 'Verify Email'],
  ['/forgot-password', 'Forgot Password'],
  ['/reset-password', 'Reset Password'],
  ['/role-select', 'Choose Your Role'],
  ['/marketplace', 'Marketplace'],
  ['/crop-recommendation', 'Crop Recommendation'],
  ['/crop-guidance', 'Crop Guidance'],
  ['/wx', 'Weather'],
  ['/yield-price', 'Yield & Price'],
  ['/about', 'About'],
  ['/contact', 'Contact'],
  ['/landowner/dashboard', 'Dashboard'],
  ['/landowner/farms/add', 'Add Farm'],
  ['/landowner/farms/edit', 'Edit Farm'],
  ['/landowner/farms', 'My Farms'],
  ['/landowner/crops/add', 'Add Crop'],
  ['/landowner/crops', 'My Crops'],
  ['/landowner/cultivations', 'My Cultivations'],
  ['/landowner/settings', 'Settings'],
  ['/landowner/help', 'Help & Support'],
  ['/trader/dashboard', 'Trader Dashboard'],
  ['/trader/requests', 'My Requests'],
  ['/trader/orders', 'My Orders'],
  ['/trader/history', 'Transaction History'],
  ['/trader/settings', 'Settings'],
  ['/trader/help', 'Help & Support'],
  ['/admin/dashboard', 'Admin Dashboard'],
  ['/admin/users/create', 'Add User'],
  ['/admin/users/import', 'Import Users'],
  ['/admin/users', 'Users'],
  ['/admin/marketplace', 'Marketplace Oversight'],
  ['/admin/farms/import', 'Import Farms'],
  ['/admin/farms', 'Farms'],
  ['/admin/activity', 'Activity Log'],
  ['/admin/feedback', 'Feedback'],
  ['/admin/reports', 'Reports'],
  ['/admin/harvest-forecast', 'Harvest Forecast'],
].sort((a, b) => b[0].length - a[0].length);

export function titleFor(pathname) {
  if (pathname === '/') return HOME_TITLE;
  const match = TITLES.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return match ? `${match[1]} · ${SITE}` : HOME_TITLE;
}

/** Gives each page its own browser-tab title, so tabs, history and bookmarks can be told apart. */
export default function PageTitle() {
  const { pathname } = useLocation();
  useEffect(() => { document.title = titleFor(pathname); }, [pathname]);
  return null;
}
