import React, { useState } from 'react';
import { useApp, STATUS_CONFIG } from './App.jsx';
import { fmtDateLong, fmtTime, getRoleInfo, nowTime } from './TodayView.jsx';

const WEEKDAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const MONTHS   = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function firstWeekday(y, m) { return new Date(y, m, 1).getDay(); }

function dateStr(y, m, d) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

// ─── Attendance sheet (reusable, also used in calendar day taps) ──────────────
const STATUS_OPTS = [
  { id: 'present',  label: 'Present',  icon: '✓', color: '#34C759' },
  { id: 'leave',    label: 'Leave',    icon: '○', color: '#FF9500' },
  { id: 'no-show',  label: 'No-Show',  icon: '✕', color: '#FF3B30' },
  { id: 'off-day',  label: 'Off Day',  icon: '—', color: '#8E8E93' },
  { id: 'holiday',  label: 'Holiday',  icon: '★', color: '#007AFF' },
];

function AttendanceSheet({ member, date, record, onClose, onSave }) {
  const role = getRoleInfo(member.role);
  const [status, setStatus]  = useState(record?.status || '');
  const [time,   setTime]    = useState(record?.checkInTime || nowTime());
  const [notes,  setNotes]   = useState(record?.notes || '');

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div className="staff-avatar" style={{ background: role.color + '20', color: role.color }}>{role.icon}</div>
          <div>
            <div className="sheet-title">{member.name}</div>
            <div className="sheet-subtitle">{fmtDateLong(date)}</div>
          </div>
        </div>

        <div className="status-options">
          {STATUS_OPTS.map(opt => (
            <button
              key={opt.id}
              className={`status-option ${status === opt.id ? 'selected' : ''}`}
              style={status === opt.id ? { borderColor: opt.color, background: opt.color + '18' } : {}}
              onClick={() => setStatus(opt.id)}
            >
              <span className="status-option-icon" style={{ color: opt.color }}>{opt.icon}</span>
              <span className="status-option-label" style={status === opt.id ? { color: opt.color } : {}}>{opt.label}</span>
            </button>
          ))}
        </div>

        {status === 'present' && (
          <div className="form-group">
            <label className="form-label">Check-in Time</label>
            <input type="time" className="form-input" value={time} onChange={e => setTime(e.target.value)} />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Notes / Feedback</label>
          <textarea
            className="form-textarea" rows={3}
            placeholder="Add notes for this day…"
            value={notes} onChange={e => setNotes(e.target.value)}
          />
        </div>

        <div className="sheet-actions">
          {record && <button className="btn-danger" onClick={() => { onSave(null); onClose(); }}>Clear</button>}
          <button
            className="btn-primary" disabled={!status}
            onClick={() => { if (status) { onSave({ status, checkInTime: status === 'present' ? time : null, notes: notes.trim() }); onClose(); } }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Day detail sheet ─────────────────────────────────────────────────────────
function DaySheet({ date, staff, getAtt, setAtt, clearAtt, onClose }) {
  const [editing, setEditing] = useState(null);

  if (editing) {
    const member = staff.find(s => s.id === editing);
    return (
      <AttendanceSheet
        member={member}
        date={date}
        record={getAtt(editing, date)}
        onClose={() => setEditing(null)}
        onSave={data => data ? setAtt(editing, date, data) : clearAtt(editing, date)}
      />
    );
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="day-detail-header">{fmtDateLong(date)}</div>
        {staff.map(m => {
          const rec = getAtt(m.id, date);
          const role = getRoleInfo(m.role);
          const cfg  = rec ? STATUS_CONFIG[rec.status] : null;
          return (
            <div key={m.id} className="staff-card" style={{ marginBottom: 8 }} onClick={() => setEditing(m.id)}>
              <div className="staff-avatar" style={{ background: role.color + '20', color: role.color }}>{role.icon}</div>
              <div className="staff-card-info">
                <div className="staff-card-name">{m.name}</div>
                {rec?.notes && <div className="staff-card-notes">{rec.notes}</div>}
              </div>
              <div className="staff-card-status">
                {cfg
                  ? <span className="status-badge" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                  : <span className="status-badge unmarked">Mark</span>}
                {rec?.checkInTime && <span className="check-time">{fmtTime(rec.checkInTime)}</span>}
                <svg className="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Calendar view ────────────────────────────────────────────────────────────
export default function CalendarView() {
  const { staff, getAtt, setAtt, clearAtt, attendance } = useApp();
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedStaffId, setSelectedStaffId] = useState(staff[0]?.id || null);
  const [selectedDate,    setSelectedDate]    = useState(null);

  const todayY = now.getFullYear(), todayM = now.getMonth(), todayD = now.getDate();

  const prevMonth = () => {
    if (month === 0) { setYear(y => y-1); setMonth(11); }
    else setMonth(m => m-1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y+1); setMonth(0); }
    else setMonth(m => m+1);
  };

  const days   = daysInMonth(year, month);
  const offset = firstWeekday(year, month);
  const selectedMember = staff.find(s => s.id === selectedStaffId);

  const getStatusForDay = (d) => {
    if (!selectedStaffId) return null;
    const rec = getAtt(selectedStaffId, dateStr(year, month, d));
    return rec?.status || null;
  };

  return (
    <div className="view">
      <div className="view-header">
        <h1 className="view-title">Calendar</h1>
      </div>

      {/* Staff chips */}
      <div className="staff-picker-row">
        {staff.map(m => {
          const role = getRoleInfo(m.role);
          return (
            <button
              key={m.id}
              className={`staff-chip ${selectedStaffId === m.id ? 'active' : ''}`}
              onClick={() => setSelectedStaffId(m.id)}
            >
              <span>{role.icon}</span>
              <span>{m.name}</span>
            </button>
          );
        })}
        {staff.length === 0 && (
          <div style={{ padding:'8px 4px', color:'var(--label3)', fontSize:14 }}>
            Add staff to view calendar
          </div>
        )}
      </div>

      {/* Month navigator */}
      <div className="calendar-picker">
        <button className="month-nav" onClick={prevMonth}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span className="month-label">{MONTHS[month]} {year}</span>
        <button className="month-nav" onClick={nextMonth}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      {/* Grid */}
      <div className="cal-grid">
        <div className="cal-weekdays">
          {WEEKDAYS.map(d => <div key={d} className="cal-weekday">{d}</div>)}
        </div>
        <div className="cal-days">
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`e${i}`} className="cal-day empty" />
          ))}
          {Array.from({ length: days }).map((_, i) => {
            const d   = i + 1;
            const ds  = dateStr(year, month, d);
            const st  = getStatusForDay(d);
            const cfg = st ? STATUS_CONFIG[st] : null;
            const isToday = d === todayD && month === todayM && year === todayY;

            return (
              <button key={d} className={`cal-day ${isToday ? 'today' : ''}`} onClick={() => setSelectedDate(ds)}>
                <div className="cal-day-num">{d}</div>
                {cfg && <div className="cal-day-dot" style={{ background: cfg.color }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ padding:'16px 20px', display:'flex', gap:12, flexWrap:'wrap' }}>
        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
          <div key={k} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--label3)' }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:v.color }} />
            {v.label}
          </div>
        ))}
      </div>

      {selectedDate && selectedMember && (
        <DaySheet
          date={selectedDate}
          staff={[selectedMember]}
          getAtt={getAtt}
          setAtt={setAtt}
          clearAtt={clearAtt}
          onClose={() => setSelectedDate(null)}
        />
      )}

      {selectedDate && !selectedMember && staff.length > 0 && (
        <DaySheet
          date={selectedDate}
          staff={staff}
          getAtt={getAtt}
          setAtt={setAtt}
          clearAtt={clearAtt}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
