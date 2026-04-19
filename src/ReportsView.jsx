import React, { useState, useMemo } from 'react';
import { useApp, STATUS_CONFIG } from './App.jsx';
import { getRoleInfo, fmtDateLong, fmtTime } from './TodayView.jsx';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }

function dateStr(y, m, d) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function fmtDateShort(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' });
}

// ─── Per-staff report card ────────────────────────────────────────────────────
function StaffReportCard({ member, year, month }) {
  const { getAtt } = useApp();
  const role = getRoleInfo(member.role);
  const days = daysInMonth(year, month);
  const [expanded, setExpanded] = useState(false);

  const records = useMemo(() => {
    const out = [];
    for (let d = 1; d <= days; d++) {
      const ds  = dateStr(year, month, d);
      const rec = getAtt(member.id, ds);
      if (rec) out.push({ date: ds, ...rec });
    }
    return out;
  }, [member.id, year, month, days]);

  const present  = records.filter(r => r.status === 'present').length;
  const leave    = records.filter(r => r.status === 'leave').length;
  const noShow   = records.filter(r => r.status === 'no-show').length;
  const offDay   = records.filter(r => r.status === 'off-day').length;
  const workDays = days - offDay;
  const pct      = workDays > 0 ? Math.round((present / workDays) * 100) : 0;
  const notes    = records.filter(r => r.notes);

  const salaryDue = member.salary > 0
    ? Math.round((member.salary / workDays) * present)
    : null;

  return (
    <div className="report-staff-card">
      <div className="report-staff-header" onClick={() => setExpanded(e => !e)} style={{ cursor:'pointer' }}>
        <div className="staff-avatar" style={{ background: role.color + '20', color: role.color }}>
          {role.icon}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:17, color:'var(--label)' }}>{member.name}</div>
          <div style={{ fontSize:13, color:'var(--label3)', marginTop:2 }}>{role.label}</div>
        </div>
        <svg
          style={{ width:18, height:18, color:'var(--label3)', transform: expanded ? 'rotate(90deg)' : 'none', transition:'transform 0.2s' }}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        >
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>

      {/* Stats row */}
      <div className="report-stats">
        {[
          { key:'present', label:`${present} Present`, color:'#34C759' },
          { key:'leave',   label:`${leave} Leave`,     color:'#FF9500' },
          { key:'no-show', label:`${noShow} No-Show`,  color:'#FF3B30' },
        ].map(({ key, label, color }) => (
          <div key={key} className="report-stat" style={{ background: color + '18', color }}>
            {label}
          </div>
        ))}
      </div>

      {/* Attendance bar */}
      <div style={{ marginTop:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
          <span style={{ fontSize:13, color:'var(--label3)', fontWeight:500 }}>Attendance</span>
          <span style={{ fontSize:13, fontWeight:700, color: pct >= 80 ? '#34C759' : pct >= 60 ? '#FF9500' : '#FF3B30' }}>
            {pct}%
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width:`${pct}%`, background: pct >= 80 ? '#34C759' : pct >= 60 ? '#FF9500' : '#FF3B30' }}
          />
        </div>
      </div>

      {/* Salary estimate */}
      {salaryDue !== null && (
        <div className="salary-row">
          <span>Salary due ({present}/{workDays} days)</span>
          <strong>₹{salaryDue.toLocaleString('en-IN')}</strong>
        </div>
      )}

      {/* Expanded: day-by-day notes */}
      {expanded && notes.length > 0 && (
        <div className="report-notes">
          <div style={{ fontSize:13, fontWeight:600, color:'var(--label3)', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:4 }}>
            Notes
          </div>
          {notes.map(r => (
            <div key={r.date} className="report-note-item">
              <div>{r.notes}</div>
              <div className="report-note-date">
                {fmtDateShort(r.date)}
                {r.status === 'present' && r.checkInTime ? ` · ${fmtTime(r.checkInTime)}` : ''}
                {' · '}
                <span style={{ color: STATUS_CONFIG[r.status]?.color }}>{STATUS_CONFIG[r.status]?.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expanded: full log */}
      {expanded && records.length > 0 && (
        <div className="report-notes">
          <div style={{ fontSize:13, fontWeight:600, color:'var(--label3)', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:4, marginTop: notes.length ? 8 : 0 }}>
            Full Log
          </div>
          {records.map(r => {
            const cfg = STATUS_CONFIG[r.status];
            return (
              <div key={r.date} className="report-note-item" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <span style={{ color:'var(--label2)' }}>{fmtDateShort(r.date)}</span>
                  {r.checkInTime && <span style={{ color:'var(--label3)', fontSize:12, marginLeft:6 }}>{fmtTime(r.checkInTime)}</span>}
                </div>
                <span className="status-badge" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {expanded && records.length === 0 && (
        <div style={{ marginTop:12, fontSize:14, color:'var(--label3)', textAlign:'center' }}>
          No records for this month
        </div>
      )}
    </div>
  );
}

// ─── Summary banner ───────────────────────────────────────────────────────────
function SummaryBanner({ staff, year, month }) {
  const { getAtt } = useApp();
  const days = daysInMonth(year, month);

  let totalPresent = 0, totalLeave = 0, totalNoShow = 0;
  staff.forEach(m => {
    for (let d = 1; d <= days; d++) {
      const rec = getAtt(m.id, dateStr(year, month, d));
      if (rec?.status === 'present')  totalPresent++;
      if (rec?.status === 'leave')    totalLeave++;
      if (rec?.status === 'no-show')  totalNoShow++;
    }
  });

  return (
    <div className="report-summary-grid">
      {[
        { val: totalPresent, label: 'Total\nPresent',  color: '#34C759' },
        { val: totalLeave,   label: 'Total\nLeave',    color: '#FF9500' },
        { val: totalNoShow,  label: 'Total\nNo-Shows', color: '#FF3B30' },
        { val: staff.length, label: 'Total\nStaff',    color: '#007AFF' },
      ].map(({ val, label, color }) => (
        <div key={label} className="summary-card">
          <div className="summary-number" style={{ color }}>{val}</div>
          <div className="summary-label" style={{ whiteSpace:'pre-line' }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Reports view ─────────────────────────────────────────────────────────────
export default function ReportsView() {
  const { staff } = useApp();
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const prevMonth = () => { if (month === 0) { setYear(y=>y-1); setMonth(11); } else setMonth(m=>m-1); };
  const nextMonth = () => { if (month === 11) { setYear(y=>y+1); setMonth(0); } else setMonth(m=>m+1); };

  return (
    <div className="view">
      <div className="view-header">
        <h1 className="view-title">Reports</h1>
      </div>

      {/* Month navigator */}
      <div className="month-selector-row">
        <button className="month-nav" onClick={prevMonth}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="month-label">{MONTHS[month]} {year}</span>
        <button className="month-nav" onClick={nextMonth}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      {staff.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-title">No data yet</div>
          <div className="empty-desc">Add staff and mark attendance to see monthly reports here</div>
        </div>
      ) : (
        <>
          <SummaryBanner staff={staff} year={year} month={month} />

          <div className="section-header">Individual Reports</div>
          <div className="card-list" style={{ paddingTop: 0 }}>
            {staff.map(m => (
              <StaffReportCard key={m.id} member={m} year={year} month={month} />
            ))}
          </div>

          <div style={{ height: 20 }} />
        </>
      )}
    </div>
  );
}
