import React, { useState } from 'react';
import { useApp, ROLES, STATUS_CONFIG } from './App.jsx';

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

export function fmtDateLong(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
}

export function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

export function getRoleInfo(roleId) {
  return ROLES.find(r => r.id === roleId) || ROLES[ROLES.length - 1];
}

// ─── Attendance bottom sheet ──────────────────────────────────────────────────
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

  const save = () => {
    if (!status) return;
    onSave({ status, checkInTime: status === 'present' ? time : null, notes: notes.trim() });
    onClose();
  };

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />

        <div className="sheet-header">
          <div className="staff-avatar" style={{ background: role.color + '20', color: role.color }}>
            {role.icon}
          </div>
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
              style={status === opt.id
                ? { borderColor: opt.color, background: opt.color + '18' }
                : {}}
              onClick={() => setStatus(opt.id)}
            >
              <span className="status-option-icon" style={{ color: opt.color }}>{opt.icon}</span>
              <span
                className="status-option-label"
                style={status === opt.id ? { color: opt.color } : {}}
              >
                {opt.label}
              </span>
            </button>
          ))}
        </div>

        {status === 'present' && (
          <div className="form-group">
            <label className="form-label">Check-in Time</label>
            <input
              type="time"
              className="form-input"
              value={time}
              onChange={e => setTime(e.target.value)}
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Notes / Feedback</label>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder="e.g. Cleaned bathrooms well · Requested advance ₹500 · Called in late"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <div className="sheet-actions">
          {record && (
            <button className="btn-danger" onClick={() => { onSave(null); onClose(); }}>
              Clear
            </button>
          )}
          <button className="btn-primary" disabled={!status} onClick={save}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Staff card for today ─────────────────────────────────────────────────────
function StaffCard({ member, record, onTap }) {
  const role   = getRoleInfo(member.role);
  const cfg    = record ? STATUS_CONFIG[record.status] : null;

  return (
    <div className="staff-card" onClick={onTap}>
      <div className="staff-avatar" style={{ background: role.color + '20', color: role.color }}>
        {role.icon}
      </div>

      <div className="staff-card-info">
        <div className="staff-card-name">
          {member.name}
          {record?.notes ? <span className="note-dot" /> : null}
        </div>
        <div className="staff-card-role">{role.label}</div>
        {record?.notes && (
          <div className="staff-card-notes">{record.notes}</div>
        )}
      </div>

      <div className="staff-card-status">
        {cfg ? (
          <>
            <span className="status-badge" style={{ background: cfg.bg, color: cfg.color }}>
              {cfg.label}
            </span>
            {record.checkInTime && (
              <span className="check-time">{fmtTime(record.checkInTime)}</span>
            )}
          </>
        ) : (
          <span className="status-badge unmarked">Mark</span>
        )}
        <svg className="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </div>
  );
}

// ─── Today view ───────────────────────────────────────────────────────────────
export default function TodayView() {
  const { staff, getAtt, setAtt, clearAtt } = useApp();
  const [selected, setSelected] = useState(null);
  const date = todayStr();

  const presentCount = staff.filter(s => getAtt(s.id, date)?.status === 'present').length;
  const markedCount  = staff.filter(s => getAtt(s.id, date)).length;

  return (
    <div className="view">
      <div className="view-header">
        <h1 className="view-title">Today</h1>
        <p className="view-date">{fmtDateLong(date)}</p>
        {staff.length > 0 && (
          <p className="view-summary">
            {presentCount} present · {markedCount} of {staff.length} marked
          </p>
        )}
      </div>

      <div className="card-list">
        {staff.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏠</div>
            <div className="empty-title">No staff added yet</div>
            <div className="empty-desc">Tap the Staff tab to add your household help and start tracking attendance</div>
          </div>
        ) : (
          staff.map(m => (
            <StaffCard
              key={m.id}
              member={m}
              record={getAtt(m.id, date)}
              onTap={() => setSelected(m)}
            />
          ))
        )}
      </div>

      {selected && (
        <AttendanceSheet
          member={selected}
          date={date}
          record={getAtt(selected.id, date)}
          onClose={() => setSelected(null)}
          onSave={data => data ? setAtt(selected.id, date, data) : clearAtt(selected.id, date)}
        />
      )}
    </div>
  );
}
