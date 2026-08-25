import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import { fmt, fmtDateTime } from '../../utils/helpers'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [detailModal, setDetailModal] = useState(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/customers')
      setCustomers(data)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  const filtered = customers.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone || '').includes(search)
  )

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)' }}>Customers</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>{customers.length} registered customers</p>
        </div>
        <button onClick={() => setModal({})} className="btn btn-primary">
          <i className="ti ti-user-plus" /> Add Customer
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <i className="ti ti-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" style={{ paddingLeft: 32 }} placeholder="Search by name or phone…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{filtered.length} results</span>
      </div>

      <div style={styles.tableWrap}>
        <table className="table">
          <thead>
            <tr><th>Customer</th><th>Phone</th><th>Email</th><th>Loyalty Pts</th><th>Credit Limit</th><th>Balance</th><th>Joined</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--amber-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--amber)', fontWeight: 600, fontSize: 13 }}>
                      {c.name.charAt(0)}
                    </div>
                    <span style={{ fontWeight: 500 }}>{c.name}</span>
                  </div>
                </td>
                <td><span className="mono text-sm">{c.phone || '—'}</span></td>
                <td><span className="text-sm text-muted">{c.email || '—'}</span></td>
                <td><span className="badge badge-amber">{c.loyalty_pts} pts</span></td>
                <td><span className="mono text-sm">{fmt(c.credit_limit)}</span></td>
                <td><span className="mono text-sm" style={{ color: c.balance > 0 ? 'var(--red)' : 'var(--text-secondary)' }}>{fmt(c.balance)}</span></td>
                <td><span className="text-xs text-muted">{fmtDateTime(c.created_at)}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-sm btn-icon" title="View" onClick={async () => {
                      const { data } = await api.get(`/customers/${c.id}`)
                      setDetailModal(data)
                    }}><i className="ti ti-eye" /></button>
                    <button className="btn btn-ghost btn-sm btn-icon" title="Edit" onClick={() => setModal(c)}>
                      <i className="ti ti-edit" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <CustomerModal customer={modal} onClose={() => setModal(null)} onSave={() => { setModal(null); loadData() }} />
      )}
      {detailModal && (
        <CustomerDetail customer={detailModal} onClose={() => setDetailModal(null)} />
      )}
    </div>
  )
}

function CustomerModal({ customer, onClose, onSave }) {
  const isEdit = !!customer?.id
  const [form, setForm] = useState({
    name: customer?.name || '', phone: customer?.phone || '',
    email: customer?.email || '', address: customer?.address || '',
    credit_limit: customer?.credit_limit || 0,
  })
  const [saving, setSaving] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      if (isEdit) await api.put(`/customers/${customer.id}`, form)
      else await api.post('/customers', form)
      toast.success(isEdit ? 'Customer updated!' : 'Customer added!')
      onSave()
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed') }
    finally { setSaving(false) }
  }

  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle} className="animate-fade">
        <div style={modalHeader}>
          <h3 style={{ fontFamily: 'var(--font-display)' }}>{isEdit ? 'Edit Customer' : 'Add Customer'}</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-icon"><i className="ti ti-x" /></button>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            ['Name', 'name', 'text', 'Full name'],
            ['Phone', 'phone', 'tel', '03xx-xxxxxxx'],
            ['Email', 'email', 'email', 'email@example.com'],
            ['Address', 'address', 'text', 'Street, City'],
          ].map(([label, key, type, placeholder]) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
              <input className="input" type={type} placeholder={placeholder} value={form[key]} onChange={e => f(key, e.target.value)} />
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Credit Limit (Rs)</label>
            <input className="input" type="number" value={form.credit_limit} onChange={e => f('credit_limit', parseFloat(e.target.value) || 0)} />
          </div>
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <button onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
          <button onClick={handleSave} className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
            {saving ? <i className="ti ti-loader-2 spinner" /> : <i className="ti ti-check" />}
            {isEdit ? 'Update' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CustomerDetail({ customer, onClose }) {
  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...modalStyle, maxWidth: 480 }} className="animate-fade">
        <div style={modalHeader}>
          <h3 style={{ fontFamily: 'var(--font-display)' }}>{customer.name}</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-icon"><i className="ti ti-x" /></button>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[
              ['Phone', customer.phone || '—'],
              ['Email', customer.email || '—'],
              ['Loyalty Points', `${customer.loyalty_pts} pts`],
              ['Credit Limit', fmt(customer.credit_limit)],
            ].map(([l, v]) => (
              <div key={l} style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Recent Transactions</div>
          {customer.transactions?.length ? (
            <table className="table">
              <thead><tr><th>Invoice</th><th>Method</th><th>Amount</th><th>Date</th></tr></thead>
              <tbody>
                {customer.transactions.map(t => (
                  <tr key={t.id}>
                    <td><span className="mono text-xs text-amber">{t.invoice_no}</span></td>
                    <td>{t.payment_method}</td>
                    <td><span className="mono fw-500">{fmt(t.grand_total)}</span></td>
                    <td><span className="text-xs text-muted">{fmtDateTime(t.created_at)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>No transactions yet</p>}
        </div>
      </div>
    </div>
  )
}

const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }
const modalStyle = { background: 'var(--bg-surface)', border: '1px solid var(--border-md)', borderRadius: 16, width: '90%', maxWidth: 420, boxShadow: 'var(--shadow-lg)' }
const modalHeader = { padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }

const styles = {
  page: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 20, gap: 16 },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  tableWrap: { flex: 1, overflow: 'auto', background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)' },
}
