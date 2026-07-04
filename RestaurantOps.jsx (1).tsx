import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Clock, CalendarDays, Package, DollarSign, TrendingUp,
  Plus, Trash2, AlertTriangle, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');";

const C = {
  bg: '#1C1F1E',
  panel: '#242927',
  panel2: '#2C3230',
  border: '#3A413D',
  borderLight: '#454C48',
  text: '#EDEAE3',
  muted: '#9A9A92',
  amber: '#E8A33D',
  amberDim: '#8a6526',
  sage: '#6B8F71',
  rust: '#C1503F',
  teal: '#4E7C82',
};

// ---------- helpers ----------
const uid = () => Math.random().toString(36).slice(2, 10);
const todayStr = () => new Date().toISOString().slice(0, 10);

function fmtDate(d) {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
function fmtMoney(n) {
  const v = Number(n) || 0;
  return '$' + (Math.round((v + Number.EPSILON) * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function hoursBetween(start, end) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  return mins / 60;
}
function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function startOfWeek(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

async function loadKey(key) {
  try {
    const res = await window.storage.get(`resto:${key}`, true);
    if (res && res.value) return JSON.parse(res.value);
    return null;
  } catch (e) {
    return null;
  }
}
async function saveKey(key, value) {
  try {
    await window.storage.set(`resto:${key}`, JSON.stringify(value), true);
  } catch (e) {
    console.error('Storage save failed', key, e);
  }
}

// ---------- shared style bits ----------
const rowStyle = { display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: `1px solid ${C.border}`, fontSize: 13, color: C.text };
const cellStyle = { paddingRight: 8 };
const inputStyle = { background: C.panel2, border: `1px solid ${C.borderLight}`, color: C.text, borderRadius: 5, padding: '6px 8px', fontSize: 13, fontFamily: "'IBM Plex Sans', sans-serif" };
const primaryBtnStyle = { background: C.amber, color: '#20221a', border: 'none', borderRadius: 5, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif" };
const secondaryBtnStyle = { background: 'transparent', color: C.muted, border: `1px solid ${C.borderLight}`, borderRadius: 5, padding: '7px 14px', fontSize: 13, cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif" };
const addBtnStyle = { display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', color: C.amber, border: `1px dashed ${C.amberDim}`, borderRadius: 6, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif" };
const iconBtnStyle = { background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 };
const quickBtnStyle = { background: C.panel2, border: `1px solid ${C.border}`, color: C.text, padding: '10px 12px', borderRadius: 6, textAlign: 'left', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13 };

// ---------- small reusable components ----------
function Stamp({ text, tone = 'sage' }) {
  const color = tone === 'rust' ? C.rust : tone === 'amber' ? C.amber : tone === 'teal' ? C.teal : C.sage;
  return (
    <span style={{
      display: 'inline-block', border: `2px solid ${color}`, color, fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', padding: '2px 6px', borderRadius: 3,
      transform: 'rotate(-2deg)', textTransform: 'uppercase', whiteSpace: 'nowrap'
    }}>{text}</span>
  );
}
function StatCard({ label, value, sub, tone }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 18px' }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 28, fontWeight: 600, color: tone || C.text, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
function NavItem({ icon: Icon, label, active, onClick, badge }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', borderRadius: 6,
      border: 'none', cursor: 'pointer', background: active ? C.panel2 : 'transparent', color: active ? C.amber : C.muted,
      fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, fontWeight: 500, textAlign: 'left'
    }}>
      <Icon size={17} strokeWidth={2} />
      <span style={{ flex: 1 }}>{label}</span>
      {badge > 0 && <span style={{ background: C.rust, color: '#fff', fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", borderRadius: 10, padding: '1px 6px', fontWeight: 600 }}>{badge}</span>}
    </button>
  );
}
function TabHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 24, color: C.text, margin: 0 }}>{title}</h1>
      <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>{subtitle}</p>
    </div>
  );
}
function TableHeaderRow({ cols }) {
  return (
    <div style={{ display: 'flex', padding: '8px 14px', borderBottom: `1px solid ${C.border}`, background: C.panel2 }}>
      {cols.map((c, i) => (
        <div key={i} style={{ flex: i === 0 ? 1.4 : (i === cols.length - 1 ? 0.5 : 1), fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted }}>{c}</div>
      ))}
    </div>
  );
}
function DateNav({ date, setDate }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button onClick={() => setDate(addDays(date, -1))} style={iconBtnStyle}><ChevronLeft size={18} /></button>
      <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
      <button onClick={() => setDate(addDays(date, 1))} style={iconBtnStyle}><ChevronRight size={18} /></button>
      {date !== todayStr() && <button onClick={() => setDate(todayStr())} style={secondaryBtnStyle}>Today</button>}
    </div>
  );
}

// ---------- Dashboard ----------
function DashboardTab({ employees, shifts, attendance, items, batches, sales, setTab }) {
  const today = todayStr();
  const todaysShifts = shifts.filter(s => s.date === today);
  const clockedIn = attendance.filter(a => a.date === today && a.clockIn && !a.clockOut);
  const todaysSales = sales.filter(s => s.date === today).reduce((sum, s) => sum + Number(s.amount), 0);

  const stockByItem = {};
  batches.forEach(b => { stockByItem[b.itemId] = (stockByItem[b.itemId] || 0) + Number(b.qty); });
  const lowStock = items.filter(it => (stockByItem[it.id] || 0) < Number(it.parLevel));

  const in3Days = addDays(today, 3);
  const expiringSoon = batches.filter(b => b.qty > 0 && b.expiryDate && b.expiryDate <= in3Days && b.expiryDate >= today);
  const expired = batches.filter(b => b.qty > 0 && b.expiryDate && b.expiryDate < today);

  return (
    <div>
      <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 26, color: C.text, marginBottom: 4 }}>Today — {fmtDate(today)}</h1>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>Line status and what needs attention right now.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard label="On the clock" value={clockedIn.length} sub={`${todaysShifts.length} scheduled today`} />
        <StatCard label="Today's sales" value={fmtMoney(todaysSales)} tone={C.sage} />
        <StatCard label="Low stock items" value={lowStock.length} tone={lowStock.length ? C.rust : C.sage} />
        <StatCard label="Expiring in 3 days" value={expiringSoon.length} tone={expiringSoon.length ? C.amber : C.sage} />
      </div>

      {(expired.length > 0 || expiringSoon.length > 0 || lowStock.length > 0) && (
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <AlertTriangle size={16} color={C.amber} />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.amber }}>Needs attention</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {expired.map(b => {
              const it = items.find(i => i.id === b.itemId);
              return <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.text }}>
                <span>{it?.name || 'Unknown item'} — batch expired {b.expiryDate}</span>
                <Stamp text="Expired" tone="rust" />
              </div>;
            })}
            {expiringSoon.map(b => {
              const it = items.find(i => i.id === b.itemId);
              return <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.text }}>
                <span>{it?.name || 'Unknown item'} — {b.qty} {it?.unit} expires {b.expiryDate}</span>
                <Stamp text="Use first" tone="amber" />
              </div>;
            })}
            {lowStock.map(it => (
              <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.text }}>
                <span>{it.name} — {stockByItem[it.id] || 0} {it.unit} on hand (par {it.parLevel})</span>
                <Stamp text="Reorder" tone="rust" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 16, color: C.text, marginBottom: 10 }}>On shift today</div>
          {todaysShifts.length === 0 && <div style={{ color: C.muted, fontSize: 13 }}>No shifts scheduled today.</div>}
          {todaysShifts.map(s => {
            const emp = employees.find(e => e.id === s.employeeId);
            const att = attendance.find(a => a.employeeId === s.employeeId && a.date === today);
            return <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
              <span style={{ color: C.text }}>{emp?.name || 'Unknown'}</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.muted }}>{s.start}–{s.end}</span>
              {att?.clockIn && !att?.clockOut ? <Stamp text="In" tone="sage" /> : att?.clockOut ? <Stamp text="Done" tone="teal" /> : <Stamp text="Not in" tone="rust" />}
            </div>;
          })}
        </div>
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 16, color: C.text, marginBottom: 10 }}>Quick actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => setTab('attendance')} style={quickBtnStyle}>Log attendance</button>
            <button onClick={() => setTab('shifts')} style={quickBtnStyle}>Build schedule</button>
            <button onClick={() => setTab('inventory')} style={quickBtnStyle}>Receive inventory</button>
            <button onClick={() => setTab('sales')} style={quickBtnStyle}>Log today's sales</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Attendance ----------
function AttendanceTab({ employees, updateEmployees, shifts, attendance, updateAttendance }) {
  const [date, setDate] = useState(todayStr());
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [newEmp, setNewEmp] = useState({ name: '', role: '', hourlyRate: '' });

  function addEmployee() {
    if (!newEmp.name.trim()) return;
    updateEmployees([...employees, { id: uid(), name: newEmp.name.trim(), role: newEmp.role.trim() || 'Team member', hourlyRate: Number(newEmp.hourlyRate) || 0 }]);
    setNewEmp({ name: '', role: '', hourlyRate: '' });
    setShowAddEmp(false);
  }
  function removeEmployee(id) { updateEmployees(employees.filter(e => e.id !== id)); }
  function getRecord(empId) { return attendance.find(a => a.employeeId === empId && a.date === date); }
  function setClockIn(empId, time) {
    const existing = getRecord(empId);
    if (existing) updateAttendance(attendance.map(a => a.id === existing.id ? { ...a, clockIn: time } : a));
    else updateAttendance([...attendance, { id: uid(), employeeId: empId, date, clockIn: time, clockOut: '' }]);
  }
  function setClockOut(empId, time) {
    const existing = getRecord(empId);
    if (existing) updateAttendance(attendance.map(a => a.id === existing.id ? { ...a, clockOut: time } : a));
    else updateAttendance([...attendance, { id: uid(), employeeId: empId, date, clockIn: '', clockOut: time }]);
  }
  function statusFor(empId) {
    const rec = getRecord(empId);
    const sched = shifts.find(s => s.employeeId === empId && s.date === date);
    if (!rec || !rec.clockIn) return sched ? { text: 'Not clocked in', tone: 'rust' } : { text: 'Unscheduled', tone: 'teal' };
    if (sched) {
      const [sh, sm] = sched.start.split(':').map(Number);
      const [ch, cm] = rec.clockIn.split(':').map(Number);
      const diff = (ch * 60 + cm) - (sh * 60 + sm);
      return diff > 5 ? { text: 'Late', tone: 'rust' } : { text: 'On time', tone: 'sage' };
    }
    return { text: 'Clocked in', tone: 'sage' };
  }

  return (
    <div>
      <TabHeader title="Attendance" subtitle="Clock times and lateness, by day." />
      <div style={{ marginBottom: 16 }}><DateNav date={date} setDate={setDate} /></div>
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <TableHeaderRow cols={['Name', 'Role', 'Scheduled', 'Clock in', 'Clock out', 'Status', '']} />
        {employees.length === 0 && <div style={{ padding: 16, color: C.muted, fontSize: 13 }}>No team members yet — add one below.</div>}
        {employees.map(emp => {
          const rec = getRecord(emp.id);
          const sched = shifts.find(s => s.employeeId === emp.id && s.date === date);
          const st = statusFor(emp.id);
          return (
            <div key={emp.id} style={rowStyle}>
              <div style={{ ...cellStyle, flex: 1.4 }}>{emp.name}</div>
              <div style={{ ...cellStyle, flex: 1, color: C.muted }}>{emp.role}</div>
              <div style={{ ...cellStyle, flex: 1, fontFamily: "'IBM Plex Mono', monospace", color: C.muted }}>{sched ? `${sched.start}–${sched.end}` : '—'}</div>
              <div style={{ ...cellStyle, flex: 1 }}><input type="time" value={rec?.clockIn || ''} onChange={e => setClockIn(emp.id, e.target.value)} style={inputStyle} /></div>
              <div style={{ ...cellStyle, flex: 1 }}><input type="time" value={rec?.clockOut || ''} onChange={e => setClockOut(emp.id, e.target.value)} style={inputStyle} /></div>
              <div style={{ ...cellStyle, flex: 1 }}><Stamp text={st.text} tone={st.tone} /></div>
              <div style={{ ...cellStyle, flex: 0.5 }}><button onClick={() => removeEmployee(emp.id)} style={iconBtnStyle}><Trash2 size={14} /></button></div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 16 }}>
        {!showAddEmp ? (
          <button onClick={() => setShowAddEmp(true)} style={addBtnStyle}><Plus size={14} /> Add team member</button>
        ) : (
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input placeholder="Name" value={newEmp.name} onChange={e => setNewEmp({ ...newEmp, name: e.target.value })} style={inputStyle} />
            <input placeholder="Role (e.g. Line cook)" value={newEmp.role} onChange={e => setNewEmp({ ...newEmp, role: e.target.value })} style={inputStyle} />
            <input placeholder="Hourly rate" type="number" value={newEmp.hourlyRate} onChange={e => setNewEmp({ ...newEmp, hourlyRate: e.target.value })} style={{ ...inputStyle, width: 110 }} />
            <button onClick={addEmployee} style={primaryBtnStyle}>Save</button>
            <button onClick={() => setShowAddEmp(false)} style={secondaryBtnStyle}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Shifts ----------
function ShiftsTab({ employees, shifts, updateShifts }) {
  const [weekStart, setWeekStart] = useState(startOfWeek(todayStr()));
  const [form, setForm] = useState({ employeeId: '', date: todayStr(), start: '09:00', end: '17:00' });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function addShift() {
    if (!form.employeeId) return;
    updateShifts([...shifts, { id: uid(), ...form }]);
  }
  function removeShift(id) { updateShifts(shifts.filter(s => s.id !== id)); }

  return (
    <div>
      <TabHeader title="Shift schedule" subtitle="Weekly line-up by day." />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        <button onClick={() => setWeekStart(addDays(weekStart, -7))} style={iconBtnStyle}><ChevronLeft size={18} /></button>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.muted, fontSize: 13 }}>{fmtDate(weekStart)} – {fmtDate(addDays(weekStart, 6))}</span>
        <button onClick={() => setWeekStart(addDays(weekStart, 7))} style={iconBtnStyle}><ChevronRight size={18} /></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10, marginBottom: 20 }}>
        {days.map(d => {
          const dayShifts = shifts.filter(s => s.date === d);
          return (
            <div key={d} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, minHeight: 120 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: d === todayStr() ? C.amber : C.muted, marginBottom: 8, textTransform: 'uppercase' }}>{fmtDate(d)}</div>
              {dayShifts.length === 0 && <div style={{ fontSize: 11, color: C.muted }}>—</div>}
              {dayShifts.map(s => {
                const emp = employees.find(e => e.id === s.employeeId);
                return (
                  <div key={s.id} style={{ background: C.panel2, borderLeft: `3px solid ${C.sage}`, borderRadius: 4, padding: '5px 7px', marginBottom: 6, fontSize: 12 }}>
                    <div style={{ color: C.text, fontWeight: 500 }}>{emp?.name || 'Unknown'}</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.muted, fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
                      <span>{s.start}–{s.end}</span>
                      <span onClick={() => removeShift(s.id)} style={{ cursor: 'pointer', color: C.rust }}>✕</span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} style={inputStyle}>
          <option value="">Team member…</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} />
        <input type="time" value={form.start} onChange={e => setForm({ ...form, start: e.target.value })} style={inputStyle} />
        <span style={{ color: C.muted }}>to</span>
        <input type="time" value={form.end} onChange={e => setForm({ ...form, end: e.target.value })} style={inputStyle} />
        <button onClick={addShift} style={primaryBtnStyle}><Plus size={14} /> Add shift</button>
      </div>
    </div>
  );
}

// ---------- Inventory / FIFO ----------
function InventoryTab({ items, updateItems, batches, updateBatches, usage, updateUsage }) {
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', unit: 'lb', parLevel: '', category: 'Produce' });
  const [receiveForm, setReceiveForm] = useState({ itemId: '', qty: '', unitCost: '', receivedDate: todayStr(), expiryDate: '' });
  const [useForm, setUseForm] = useState({ itemId: '', qty: '' });

  function addItem() {
    if (!newItem.name.trim()) return;
    updateItems([...items, { id: uid(), name: newItem.name.trim(), unit: newItem.unit, parLevel: Number(newItem.parLevel) || 0, category: newItem.category }]);
    setNewItem({ name: '', unit: 'lb', parLevel: '', category: 'Produce' });
    setShowAddItem(false);
  }
  function removeItem(id) {
    updateItems(items.filter(i => i.id !== id));
    updateBatches(batches.filter(b => b.itemId !== id));
  }
  function receiveBatch() {
    if (!receiveForm.itemId || !receiveForm.qty) return;
    updateBatches([...batches, {
      id: uid(), itemId: receiveForm.itemId, qty: Number(receiveForm.qty), originalQty: Number(receiveForm.qty),
      unitCost: Number(receiveForm.unitCost) || 0, receivedDate: receiveForm.receivedDate, expiryDate: receiveForm.expiryDate || ''
    }]);
    setReceiveForm({ itemId: '', qty: '', unitCost: '', receivedDate: todayStr(), expiryDate: '' });
  }
  function useStock() {
    const need = Number(useForm.qty);
    if (!useForm.itemId || !need) return;
    let remaining = need;
    let cost = 0;
    const itemBatches = batches.filter(b => b.itemId === useForm.itemId && b.qty > 0)
      .sort((a, b) => (a.receivedDate || '').localeCompare(b.receivedDate || ''));
    const updated = [...batches];
    for (const b of itemBatches) {
      if (remaining <= 0) break;
      const idx = updated.findIndex(x => x.id === b.id);
      const take = Math.min(b.qty, remaining);
      cost += take * b.unitCost;
      updated[idx] = { ...updated[idx], qty: updated[idx].qty - take };
      remaining -= take;
    }
    updateBatches(updated);
    updateUsage([...usage, { id: uid(), itemId: useForm.itemId, qty: need - remaining, cost, date: todayStr() }]);
    setUseForm({ itemId: '', qty: '' });
  }

  const stockByItem = {};
  batches.forEach(b => { stockByItem[b.itemId] = (stockByItem[b.itemId] || 0) + b.qty; });
  const today = todayStr();

  return (
    <div>
      <TabHeader title="Inventory — FIFO" subtitle="Oldest stock gets used first. Track batches, not just totals." />
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
        <TableHeaderRow cols={['Item', 'Category', 'On hand', 'Par', 'Status', '']} />
        {items.length === 0 && <div style={{ padding: 16, color: C.muted, fontSize: 13 }}>No items yet — add one below.</div>}
        {items.map(it => {
          const onHand = stockByItem[it.id] || 0;
          const low = onHand < it.parLevel;
          const itBatches = batches.filter(b => b.itemId === it.id && b.qty > 0).sort((a, b) => (a.expiryDate || '9999').localeCompare(b.expiryDate || '9999'));
          const nextExpiry = itBatches[0]?.expiryDate;
          const expiringSoon = nextExpiry && nextExpiry <= addDays(today, 3);
          return (
            <div key={it.id} style={rowStyle}>
              <div style={{ ...cellStyle, flex: 1.4 }}>{it.name}</div>
              <div style={{ ...cellStyle, flex: 1, color: C.muted }}>{it.category}</div>
              <div style={{ ...cellStyle, flex: 1, fontFamily: "'IBM Plex Mono', monospace" }}>{onHand} {it.unit}</div>
              <div style={{ ...cellStyle, flex: 1, fontFamily: "'IBM Plex Mono', monospace", color: C.muted }}>{it.parLevel} {it.unit}</div>
              <div style={{ ...cellStyle, flex: 1, display: 'flex', gap: 6 }}>
                {low && <Stamp text="Reorder" tone="rust" />}
                {expiringSoon && <Stamp text={`Exp ${nextExpiry}`} tone="amber" />}
                {!low && !expiringSoon && <Stamp text="Stocked" tone="sage" />}
              </div>
              <div style={{ ...cellStyle, flex: 0.5 }}><button onClick={() => removeItem(it.id)} style={iconBtnStyle}><Trash2 size={14} /></button></div>
            </div>
          );
        })}
      </div>
      {!showAddItem ? (
        <button onClick={() => setShowAddItem(true)} style={{ ...addBtnStyle, marginBottom: 20 }}><Plus size={14} /> Add item</button>
      ) : (
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          <input placeholder="Item name" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} style={inputStyle} />
          <select value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} style={inputStyle}>
            {['Produce', 'Meat & Seafood', 'Dairy', 'Dry Goods', 'Beverage', 'Other'].map(c => <option key={c}>{c}</option>)}
          </select>
          <input placeholder="Unit (lb, oz, ea…)" value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })} style={{ ...inputStyle, width: 90 }} />
          <input placeholder="Par level" type="number" value={newItem.parLevel} onChange={e => setNewItem({ ...newItem, parLevel: e.target.value })} style={{ ...inputStyle, width: 90 }} />
          <button onClick={addItem} style={primaryBtnStyle}>Save</button>
          <button onClick={() => setShowAddItem(false)} style={secondaryBtnStyle}>Cancel</button>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14 }}>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 15, color: C.text, marginBottom: 10 }}>Receive stock</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <select value={receiveForm.itemId} onChange={e => setReceiveForm({ ...receiveForm, itemId: e.target.value })} style={inputStyle}>
              <option value="">Item…</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <input placeholder="Qty" type="number" value={receiveForm.qty} onChange={e => setReceiveForm({ ...receiveForm, qty: e.target.value })} style={inputStyle} />
              <input placeholder="Unit cost" type="number" value={receiveForm.unitCost} onChange={e => setReceiveForm({ ...receiveForm, unitCost: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="date" value={receiveForm.receivedDate} onChange={e => setReceiveForm({ ...receiveForm, receivedDate: e.target.value })} style={inputStyle} />
              <input type="date" value={receiveForm.expiryDate} onChange={e => setReceiveForm({ ...receiveForm, expiryDate: e.target.value })} style={inputStyle} />
            </div>
            <button onClick={receiveBatch} style={primaryBtnStyle}><Plus size={14} /> Log delivery</button>
          </div>
        </div>
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14 }}>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 15, color: C.text, marginBottom: 10 }}>Use stock (FIFO)</div>
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>Pulls from the oldest batch first and logs the cost for P&L.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <select value={useForm.itemId} onChange={e => setUseForm({ ...useForm, itemId: e.target.value })} style={inputStyle}>
              <option value="">Item…</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name} ({stockByItem[i.id] || 0} {i.unit} on hand)</option>)}
            </select>
            <input placeholder="Qty used" type="number" value={useForm.qty} onChange={e => setUseForm({ ...useForm, qty: e.target.value })} style={inputStyle} />
            <button onClick={useStock} style={primaryBtnStyle}>Log usage</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Sales ----------
function SalesTab({ sales, updateSales }) {
  const [date, setDate] = useState(todayStr());
  const [form, setForm] = useState({ category: 'Food', amount: '' });
  const categories = ['Food', 'Beverage', 'Alcohol', 'Other'];

  function addSale() {
    if (!form.amount) return;
    updateSales([...sales, { id: uid(), date, category: form.category, amount: Number(form.amount) }]);
    setForm({ category: 'Food', amount: '' });
  }
  function removeSale(id) { updateSales(sales.filter(s => s.id !== id)); }

  const daySales = sales.filter(s => s.date === date);
  const dayTotal = daySales.reduce((sum, s) => sum + s.amount, 0);
  const last7 = Array.from({ length: 7 }, (_, i) => addDays(date, -6 + i));
  const chartData = last7.map(d => ({ day: d.slice(5), total: sales.filter(s => s.date === d).reduce((sum, s) => sum + s.amount, 0) }));

  return (
    <div>
      <TabHeader title="Sales" subtitle="Daily sales by category." />
      <DateNav date={date} setDate={setDate} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16, marginBottom: 20 }}>
        <StatCard label={`Total — ${fmtDate(date)}`} value={fmtMoney(dayTotal)} tone={C.sage} />
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <input placeholder="Amount" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={inputStyle} />
          <button onClick={addSale} style={primaryBtnStyle}><Plus size={14} /> Log sale</button>
        </div>
      </div>
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginBottom: 20, height: 220 }}>
        <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 14, color: C.text, marginBottom: 10 }}>Last 7 days</div>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={chartData}>
            <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: C.muted, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }} axisLine={{ stroke: C.border }} tickLine={false} />
            <YAxis tick={{ fill: C.muted, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: C.panel2, border: `1px solid ${C.border}`, fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12 }} labelStyle={{ color: C.text }} formatter={(v) => fmtMoney(v)} />
            <Bar dataKey="total" fill={C.amber} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <TableHeaderRow cols={['Category', 'Amount', '']} />
        {daySales.length === 0 && <div style={{ padding: 16, color: C.muted, fontSize: 13 }}>No sales logged for this day yet.</div>}
        {daySales.map(s => (
          <div key={s.id} style={rowStyle}>
            <div style={{ ...cellStyle, flex: 1 }}>{s.category}</div>
            <div style={{ ...cellStyle, flex: 1, fontFamily: "'IBM Plex Mono', monospace" }}>{fmtMoney(s.amount)}</div>
            <div style={{ ...cellStyle, flex: 0.3 }}><button onClick={() => removeSale(s.id)} style={iconBtnStyle}><Trash2 size={14} /></button></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- P&L ----------
function PnLTab({ employees, attendance, sales, usage, expenses, updateExpenses }) {
  const [period, setPeriod] = useState('week');
  const [expForm, setExpForm] = useState({ label: '', amount: '' });
  const today = todayStr();
  let start;
  if (period === 'today') start = today;
  else if (period === 'week') start = startOfWeek(today);
  else start = today.slice(0, 8) + '01';

  const inRange = (d) => d >= start && d <= today;
  const revenue = sales.filter(s => inRange(s.date)).reduce((sum, s) => sum + s.amount, 0);
  const cogs = usage.filter(u => inRange(u.date)).reduce((sum, u) => sum + u.cost, 0);
  const laborRecords = attendance.filter(a => inRange(a.date) && a.clockIn && a.clockOut);
  const labor = laborRecords.reduce((sum, a) => {
    const emp = employees.find(e => e.id === a.employeeId);
    return sum + hoursBetween(a.clockIn, a.clockOut) * (emp?.hourlyRate || 0);
  }, 0);
  const otherExp = expenses.filter(e => inRange(e.date)).reduce((sum, e) => sum + e.amount, 0);
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - labor - otherExp;
  const foodPct = revenue ? (cogs / revenue * 100) : 0;
  const laborPct = revenue ? (labor / revenue * 100) : 0;

  function addExpense() {
    if (!expForm.amount) return;
    updateExpenses([...expenses, { id: uid(), label: expForm.label || 'Expense', amount: Number(expForm.amount), date: today }]);
    setExpForm({ label: '', amount: '' });
  }

  const lineItems = [
    ['Revenue', revenue],
    ['Food cost', -cogs],
    ['Gross profit', grossProfit],
    ['Labor', -labor],
    ['Other expenses', -otherExp],
    ['Net profit', netProfit],
  ];

  return (
    <div>
      <TabHeader title="Food P&L" subtitle="Revenue, food cost, labor, and what's left." />
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['today', 'week', 'month'].map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={p === period ? primaryBtnStyle : secondaryBtnStyle}>
            {p === 'today' ? 'Today' : p === 'week' ? 'This week' : 'This month'}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard label="Revenue" value={fmtMoney(revenue)} tone={C.sage} />
        <StatCard label="Food cost (COGS)" value={fmtMoney(cogs)} sub={`${foodPct.toFixed(1)}% of revenue`} tone={foodPct > 32 ? C.rust : C.text} />
        <StatCard label="Labor" value={fmtMoney(labor)} sub={`${laborPct.toFixed(1)}% of revenue`} tone={laborPct > 30 ? C.rust : C.text} />
        <StatCard label="Other expenses" value={fmtMoney(otherExp)} />
        <StatCard label="Net profit" value={fmtMoney(netProfit)} tone={netProfit >= 0 ? C.sage : C.rust} />
      </div>
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 15, color: C.text, marginBottom: 10 }}>Line items</div>
        {lineItems.map(([label, val], i) => {
          const bold = label === 'Gross profit' || label === 'Net profit';
          return (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < lineItems.length - 1 ? `1px solid ${C.border}` : 'none' }}>
              <span style={{ color: bold ? C.text : C.muted, fontSize: 13, fontWeight: bold ? 600 : 400 }}>{label}</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: bold ? 600 : 400, color: val < 0 ? C.rust : C.text }}>{val < 0 ? '−' : ''}{fmtMoney(Math.abs(val))}</span>
            </div>
          );
        })}
      </div>
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: C.muted }}>Add expense (rent, utilities, etc.)</span>
        <input placeholder="Label" value={expForm.label} onChange={e => setExpForm({ ...expForm, label: e.target.value })} style={inputStyle} />
        <input placeholder="Amount" type="number" value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: e.target.value })} style={inputStyle} />
        <button onClick={addExpense} style={primaryBtnStyle}><Plus size={14} /> Add</button>
      </div>
    </div>
  );
}

// ---------- App ----------
export default function App() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dashboard');
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [items, setItems] = useState([]);
  const [batches, setBatches] = useState([]);
  const [usage, setUsage] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    (async () => {
      const [e, sh, at, it, ba, us, sa, ex] = await Promise.all([
        loadKey('employees'), loadKey('shifts'), loadKey('attendance'),
        loadKey('items'), loadKey('batches'), loadKey('usage'),
        loadKey('sales'), loadKey('expenses')
      ]);
      setEmployees(e || []);
      setShifts(sh || []);
      setAttendance(at || []);
      setItems(it || []);
      setBatches(ba || []);
      setUsage(us || []);
      setSales(sa || []);
      setExpenses(ex || []);
      setLoading(false);
    })();
  }, []);

  function updateEmployees(next) { setEmployees(next); saveKey('employees', next); }
  function updateShifts(next) { setShifts(next); saveKey('shifts', next); }
  function updateAttendance(next) { setAttendance(next); saveKey('attendance', next); }
  function updateItems(next) { setItems(next); saveKey('items', next); }
  function updateBatches(next) { setBatches(next); saveKey('batches', next); }
  function updateUsage(next) { setUsage(next); saveKey('usage', next); }
  function updateSales(next) { setSales(next); saveKey('sales', next); }
  function updateExpenses(next) { setExpenses(next); saveKey('expenses', next); }

  if (loading) {
    return <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontFamily: "'IBM Plex Mono', monospace" }}>Loading the line…</div>;
  }

  const today = todayStr();
  const stockByItem = {};
  batches.forEach(b => { stockByItem[b.itemId] = (stockByItem[b.itemId] || 0) + b.qty; });
  const lowStockCount = items.filter(it => (stockByItem[it.id] || 0) < it.parLevel).length;
  const expiringCount = batches.filter(b => b.qty > 0 && b.expiryDate && b.expiryDate <= addDays(today, 3)).length;

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'attendance', label: 'Attendance', icon: Clock },
    { key: 'shifts', label: 'Shifts', icon: CalendarDays },
    { key: 'inventory', label: 'Inventory', icon: Package, badge: lowStockCount + expiringCount },
    { key: 'sales', label: 'Sales', icon: DollarSign },
    { key: 'pnl', label: 'Food P&L', icon: TrendingUp },
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexWrap: 'wrap', fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <style>{`
        ${FONT_IMPORT}
        * { box-sizing: border-box; }
        input::placeholder { color: ${C.muted}; }
        input[type="date"], input[type="time"] { color-scheme: dark; }
        button:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid ${C.amber}; outline-offset: 1px; }
      `}</style>
      <div style={{ width: 220, background: C.panel, borderRight: `1px solid ${C.border}`, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px 20px' }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: C.amber, transform: 'rotate(45deg)' }} />
          <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 17, color: C.text, letterSpacing: '0.02em' }}>THE LINE</span>
        </div>
        {navItems.map(n => (
          <NavItem key={n.key} icon={n.icon} label={n.label} active={tab === n.key} onClick={() => setTab(n.key)} badge={n.badge} />
        ))}
        <div style={{ marginTop: 'auto', padding: 10, fontSize: 11, color: C.muted, fontFamily: "'IBM Plex Mono', monospace" }}>
          Synced • shared with team
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 300, padding: '28px 32px', overflowY: 'auto' }}>
        {tab === 'dashboard' && <DashboardTab employees={employees} shifts={shifts} attendance={attendance} items={items} batches={batches} sales={sales} setTab={setTab} />}
        {tab === 'attendance' && <AttendanceTab employees={employees} updateEmployees={updateEmployees} shifts={shifts} attendance={attendance} updateAttendance={updateAttendance} />}
        {tab === 'shifts' && <ShiftsTab employees={employees} shifts={shifts} updateShifts={updateShifts} />}
        {tab === 'inventory' && <InventoryTab items={items} updateItems={updateItems} batches={batches} updateBatches={updateBatches} usage={usage} updateUsage={updateUsage} />}
        {tab === 'sales' && <SalesTab sales={sales} updateSales={updateSales} />}
        {tab === 'pnl' && <PnLTab employees={employees} attendance={attendance} sales={sales} usage={usage} expenses={expenses} updateExpenses={updateExpenses} />}
      </div>
    </div>
  );
}