import React, { useState } from 'react';
import { useApp, ROLES, uid } from './App.jsx';
import { getRoleInfo } from './TodayView.jsx';

const WEEKDAYS_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const WEEKDAYS_SHORT = ['S','M','T','W','T','F','S'];

// ─── Add / Edit staff modal ───────────────────────────────────────────────────
function StaffModal({ member, onClose, onSave, onDelete }) {
  const editing = !!member;
  const [name,      setName]      = useState(member?.name        || '');
  const [role,      setRole]      = useState(member?.role        || 'maid');
  const [phone,     setPhone]     = useState(member?.phone       || '');
  const [salary,    setSalary]    = useState(member?.salary      || '');
  const [weeklyOff, setWeeklyOff] = useState(member?.weeklyOff  || []);

  const toggleDay = d => setWeeklyOff(prev =>
    prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
  );

  const save = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      role,
      phone: phone.trim(),
      salary: salary ? Number(salary) : 0,
      weeklyOff,
    });
    onClose();
  };

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title" style={{ marginBottom: 24 }}>
          {editing ? 'Edit Staff' : 'Add Staff'}
        </div>

        <div className="form-group">
          <label className="form-label">Name</label>
          <input
            className="form-input" type="text"
            placeholder="e.g. Sunita, Meera, Raju"
            value={name} onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Role</label>
          <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
            {ROLES.map(r => (
              <option key={r.id} value={r.id}>{r.icon} {r.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Phone (optional)</label>
          <input
            className="form-input" type="tel"
            placeholder="e.g. 9876543210"
            value={phone} onChange={e => setPhone(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Monthly Salary ₹ (optional)</label>
          <input
            className="form-input" type="number"
            placeholder="e.g. 4000"
            value={salary} onChange={e => setSalary(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Weekly Off Days</label>
          <div className="weekday-chips">
            {WEEKDAYS_SHORT.map((d, i) => (
              <button
                key={i}
                className={`weekday-chip ${weeklyOff.includes(i) ? 'active' : ''}`}
                onClick={() => toggleDay(i)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="sheet-actions">
          {editing && (
            <button
              className="btn-danger"
              onClick={() => { if (window.confirm(`Remove ${member.name}?`)) { onDelete(member.id); onClose(); } }}
            >
              Remove
            </button>
          )}
          <button className="btn-primary" disabled={!name.trim()} onClick={save}>
            {editing ? 'Save Changes' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Staff detail card (expanded view) ───────────────────────────────────────
function StaffDetailSheet({ member, onClose, onEdit }) {
  const role = getRoleInfo(member.role);
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />

        <div className="sheet-header" style={{ marginBottom: 20 }}>
          <div
            className="staff-avatar"
            style={{ background: role.color + '20', color: role.color, width: 60, height: 60, borderRadius: 18, fontSize: 28 }}
          >
            {role.icon}
          </div>
          <div>
            <div className="sheet-title">{member.name}</div>
            <div className="sheet-subtitle">{role.label}</div>
          </div>
        </div>

        {member.phone ? (
          <div className="form-group">
            <div className="form-label">Phone</div>
            <a href={`tel:${member.phone}`} style={{ fontSize:16, color:'var(--blue)', textDecoration:'none', fontWeight:500 }}>
              {member.phone}
            </a>
          </div>
        ) : null}

        {member.salary > 0 && (
          <div className="form-group">
            <div className="form-label">Monthly Salary</div>
            <div style={{ fontSize:20, fontWeight:700, color:'var(--label)' }}>₹{member.salary.toLocaleString('en-IN')}</div>
          </div>
        )}

        {member.weeklyOff?.length > 0 && (
          <div className="form-group">
            <div className="form-label">Weekly Off</div>
            <div style={{ fontSize:15, color:'var(--label2)', fontWeight:500 }}>
              {member.weeklyOff.map(d => WEEKDAYS_FULL[d]).join(', ')}
            </div>
          </div>
        )}

        <div className="sheet-actions">
          <button className="btn-secondary" onClick={onClose}>Close</button>
          <button className="btn-primary" onClick={onEdit}>Edit</button>
        </div>
      </div>
    </div>
  );
}

// ─── Staff list view ──────────────────────────────────────────────────────────
export default function StaffView() {
  const { staff, addStaff, updateStaff, deleteStaff } = useApp();
  const [showAdd,    setShowAdd]    = useState(false);
  const [viewMember, setViewMember] = useState(null);
  const [editMember, setEditMember] = useState(null);

  const grouped = ROLES.reduce((acc, r) => {
    const members = staff.filter(s => s.role === r.id);
    if (members.length) acc.push({ role: r, members });
    return acc;
  }, []);

  return (
    <div className="view">
      <div className="view-header">
        <h1 className="view-title">Staff</h1>
        {staff.length > 0 && (
          <p className="view-summary">{staff.length} {staff.length === 1 ? 'person' : 'people'}</p>
        )}
      </div>

      {staff.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <div className="empty-title">Add your household staff</div>
          <div className="empty-desc">Tap the + button to add your maid, nanny, driver, and other household help</div>
        </div>
      ) : (
        grouped.map(({ role, members }) => (
          <div key={role.id}>
            <div className="section-header">{role.label}</div>
            <div className="card-list" style={{ paddingTop: 0 }}>
              {members.map(m => (
                <div key={m.id} className="staff-list-card" onClick={() => setViewMember(m)}>
                  <div className="staff-avatar" style={{ background: role.color + '20', color: role.color }}>
                    {role.icon}
                  </div>
                  <div className="staff-meta">
                    <div className="staff-meta-name">{m.name}</div>
                    <div className="staff-meta-detail">
                      {m.salary > 0 ? `₹${m.salary.toLocaleString('en-IN')}/mo` : role.label}
                      {m.phone ? ` · ${m.phone}` : ''}
                    </div>
                  </div>
                  <svg style={{ width:18, height:18, color:'var(--label4)', flexShrink:0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* FAB */}
      <button className="fab" onClick={() => setShowAdd(true)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      {showAdd && (
        <StaffModal
          onClose={() => setShowAdd(false)}
          onSave={data => addStaff(data)}
        />
      )}

      {viewMember && !editMember && (
        <StaffDetailSheet
          member={viewMember}
          onClose={() => setViewMember(null)}
          onEdit={() => { setEditMember(viewMember); setViewMember(null); }}
        />
      )}

      {editMember && (
        <StaffModal
          member={editMember}
          onClose={() => setEditMember(null)}
          onSave={data => updateStaff(editMember.id, data)}
          onDelete={id => deleteStaff(id)}
        />
      )}
    </div>
  );
}
