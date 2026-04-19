import React, { createContext, useContext, useState, useEffect } from 'react';
import TodayView from './TodayView.jsx';
import CalendarView from './CalendarView.jsx';
import StaffView from './StaffView.jsx';
import ReportsView from './ReportsView.jsx';

// ─── Role definitions ────────────────────────────────────────────────────────
export const ROLES = [
  { id: 'maid',     label: 'Cleaning Maid',   icon: '🧹', color: '#AF52DE' },
  { id: 'nanny',    label: 'Nanny',            icon: '👶', color: '#FF2D55' },
  { id: 'cook',     label: 'Cook',             icon: '👩‍🍳', color: '#FF9500' },
  { id: 'driver',   label: 'Driver',           icon: '🚗', color: '#007AFF' },
  { id: 'milkman',  label: 'Milk Delivery',    icon: '🥛', color: '#34C759' },
  { id: 'gardener', label: 'Gardener',         icon: '🌿', color: '#30B0C7' },
  { id: 'security', label: 'Security Guard',   icon: '🔐', color: '#636366' },
  { id: 'other',    label: 'Other',            icon: '👤', color: '#8E8E93' },
];

export const STATUS_CONFIG = {
  present:  { label: 'Present',  color: '#34C759', bg: 'rgba(52,199,89,0.12)'  },
  leave:    { label: 'Leave',    color: '#FF9500', bg: 'rgba(255,149,0,0.12)'  },
  'no-show':{ label: 'No-Show',  color: '#FF3B30', bg: 'rgba(255,59,48,0.12)'  },
  'off-day':{ label: 'Off Day',  color: '#8E8E93', bg: 'rgba(142,142,147,0.12)'},
  holiday:  { label: 'Holiday',  color: '#007AFF', bg: 'rgba(0,122,255,0.12)'  },
};

// ─── Storage helpers ─────────────────────────────────────────────────────────
const KEYS = { STAFF: 'hsa_staff_v1', ATTENDANCE: 'hsa_att_v1' };

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function persist(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
export function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

// ─── Context ─────────────────────────────────────────────────────────────────
const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

function Provider({ children }) {
  const [staff,      setStaff]      = useState(() => load(KEYS.STAFF, []));
  const [attendance, setAttendance] = useState(() => load(KEYS.ATTENDANCE, {}));

  useEffect(() => persist(KEYS.STAFF,      staff),      [staff]);
  useEffect(() => persist(KEYS.ATTENDANCE, attendance), [attendance]);

  const addStaff    = data => { const m = { ...data, id: uid() }; setStaff(p => [...p, m]); return m; };
  const updateStaff = (id, data) => setStaff(p => p.map(s => s.id === id ? { ...s, ...data } : s));
  const deleteStaff = id => setStaff(p => p.filter(s => s.id !== id));

  const getAtt = (staffId, date) => attendance[`${staffId}__${date}`] ?? null;

  const setAtt = (staffId, date, data) =>
    setAttendance(p => ({ ...p, [`${staffId}__${date}`]: { staffId, date, ...data } }));

  const clearAtt = (staffId, date) =>
    setAttendance(p => { const n = { ...p }; delete n[`${staffId}__${date}`]; return n; });

  const getMonthAtts = (staffId, year, month) => {
    const monthPrefix = `${year}-${String(month).padStart(2,'0')}`;
    return Object.values(attendance).filter(a => a && a.staffId === staffId && a.date?.startsWith(monthPrefix));
  };

  const getAllAttsForMonth = (year, month) => {
    const prefix = `${year}-${String(month).padStart(2,'0')}`;
    return Object.values(attendance).filter(a => a?.date?.startsWith(prefix));
  };

  return (
    <Ctx.Provider value={{ staff, addStaff, updateStaff, deleteStaff, attendance, getAtt, setAtt, clearAtt, getMonthAtts, getAllAttsForMonth }}>
      {children}
    </Ctx.Provider>
  );
}

// ─── Tab Bar icons (SVG) ─────────────────────────────────────────────────────
const IcoToday = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IcoCal = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IcoStaff = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IcoReport = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

const TABS = [
  { id: 'today',    label: 'Today',    Icon: IcoToday  },
  { id: 'calendar', label: 'Calendar', Icon: IcoCal    },
  { id: 'staff',    label: 'Staff',    Icon: IcoStaff  },
  { id: 'reports',  label: 'Reports',  Icon: IcoReport },
];

function TabBar({ active, onChange }) {
  return (
    <nav className="tab-bar">
      {TABS.map(({ id, label, Icon }) => (
        <button key={id} className={`tab-item ${active === id ? 'active' : ''}`} onClick={() => onChange(id)}>
          <Icon />
          <span className="tab-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState('today');
  return (
    <Provider>
      <div className="app">
        <div className="content">
          {tab === 'today'    && <TodayView    />}
          {tab === 'calendar' && <CalendarView />}
          {tab === 'staff'    && <StaffView    />}
          {tab === 'reports'  && <ReportsView  />}
        </div>
        <TabBar active={tab} onChange={setTab} />
      </div>
    </Provider>
  );
}
