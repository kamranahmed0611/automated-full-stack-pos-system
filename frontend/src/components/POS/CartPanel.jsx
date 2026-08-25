import { useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import { useCartStore } from '../../store'
import { fmt } from '../../utils/helpers'

const PAY_METHODS = [
  { id: 'cash',      icon: 'ti-cash',         label: 'Cash' },
  { id: 'card',      icon: 'ti-credit-card',  label: 'Card' },
  { id: 'jazzcash',  icon: 'ti-brand-mastercard', label: 'Jazz' },
  { id: 'easypaisa', icon: 'ti-device-mobile', label: 'Easy' },
  { id: 'credit',    icon: 'ti-clock',        label: 'Credit' },
]

export default function CartPanel({ onCheckoutSuccess }) {
  const {
    items, customer, discountVal, discountType, taxRate, paymentMethod, notes,
    setQty, removeItem, clearCart, setCustomer, setDiscount, setTaxRate, setPaymentMethod, setNotes,
    totals,
  } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [custSearch, setCustSearch] = useState('')
  const [customers, setCustomers] = useState([])
  const [showCustDrop, setShowCustDrop] = useState(false)

  const searchCustomers = async (q) => {
    setCustSearch(q)
    if (q.length < 2) { setCustomers([]); setShowCustDrop(false); return }
    const { data } = await api.get(`/customers?search=${q}`)
    setCustomers(data)
    setShowCustDrop(true)
  }

  const handleCheckout = async () => {
    if (!items.length) return
    setLoading(true)
    try {
      const payload = {
        customer_id: customer?.id || null,
        items: items.map(i => ({ product_id: i.id, qty: i.qty })),
        discount_val: discountVal,
        discount_type: discountType,
        tax_rate: taxRate,
        payment_method: paymentMethod,
        notes,
      }
      const { data } = await api.post('/transactions', payload)
      const fullTxn = await api.get(`/transactions/${data.id}`)
      clearCart()
      setCustSearch('')
      onCheckoutSuccess(fullTxn.data)
      toast.success(`Invoice ${data.invoice_no} created!`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  const { subtotal, discAmt, taxAmt, grand, itemCount } = totals

  return (
    <div style={styles.panel}>
      {/* Header */}
      <div style={styles.header}>
        <div className="flex items-center gap-8">
          <i className="ti ti-shopping-cart" style={{ color: 'var(--amber)' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Cart</span>
          {itemCount > 0 && (
            <span style={styles.badge}>{itemCount}</span>
          )}
        </div>
        {items.length > 0 && (
          <button onClick={clearCart} className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', borderColor: 'transparent' }}>
            <i className="ti ti-trash" /> Clear
          </button>
        )}
      </div>

      {/* Cart Items */}
      <div style={styles.items}>
        {items.length === 0 ? (
          <div style={styles.empty}>
            <i className="ti ti-shopping-cart-off" style={{ fontSize: 36, opacity: 0.2 }} />
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Cart is empty</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Click products to add</span>
          </div>
        ) : items.map(item => (
          <div key={item.id} style={styles.item}>
            <div style={styles.itemLeft}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <div>
                <div style={styles.itemName}>{item.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmt(item.price)} × {item.qty}</div>
              </div>
            </div>
            <div style={styles.itemRight}>
              <div style={styles.qtyRow}>
                <button style={styles.qtyBtn} onClick={() => setQty(item.id, item.qty - 1)}>
                  <i className="ti ti-minus" style={{ fontSize: 11 }} />
                </button>
                <span style={styles.qtyNum}>{item.qty}</span>
                <button style={styles.qtyBtn} onClick={() => setQty(item.id, item.qty + 1)}
                  disabled={item.qty >= item.stock}>
                  <i className="ti ti-plus" style={{ fontSize: 11 }} />
                </button>
              </div>
              <div style={styles.lineTotal}>{fmt(item.price * item.qty)}</div>
              <button style={styles.removeBtn} onClick={() => removeItem(item.id)}>
                <i className="ti ti-x" style={{ fontSize: 12 }} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Customer */}
      <div style={styles.section}>
        <div style={{ position: 'relative' }}>
          <i className="ti ti-user" style={styles.secIcon} />
          <input
            className="input"
            style={{ paddingLeft: 30, fontSize: 12 }}
            placeholder="Customer name or phone…"
            value={customer ? `${customer.name} (${customer.phone || 'no phone'})` : custSearch}
            onChange={e => { setCustomer(null); searchCustomers(e.target.value) }}
          />
          {customer && (
            <button style={styles.clearCustBtn} onClick={() => { setCustomer(null); setCustSearch('') }}>
              <i className="ti ti-x" />
            </button>
          )}
          {showCustDrop && customers.length > 0 && (
            <div style={styles.dropdown}>
              {customers.map(c => (
                <div key={c.id} style={styles.dropItem} onClick={() => { setCustomer(c); setCustSearch(''); setShowCustDrop(false) }}>
                  <span style={{ fontWeight: 500 }}>{c.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{c.phone}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Discount & Tax */}
      <div style={{ ...styles.section, display: 'flex', gap: 8 }}>
        <div style={{ display: 'flex', gap: 4, flex: 1 }}>
          <input
            className="input"
            type="number"
            style={{ width: 60, fontSize: 12, textAlign: 'right', flexShrink: 0, paddingLeft: 8, paddingRight: 4 }}
            value={discountVal}
            onChange={e => setDiscount(parseFloat(e.target.value)||0, discountType)}
            min="0"
          />
          <select className="input" style={{ fontSize: 12, padding: '8px 6px' }}
            value={discountType} onChange={e => setDiscount(discountVal, e.target.value)}>
            <option value="percent">% Disc</option>
            <option value="flat">Rs Disc</option>
          </select>
        </div>
        <select className="input" style={{ fontSize: 12, padding: '8px 6px', width: 100, flexShrink: 0 }}
          value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value))}>
          <option value={0}>No Tax</option>
          <option value={5}>GST 5%</option>
          <option value={17}>GST 17%</option>
        </select>
      </div>

      {/* Totals */}
      <div style={styles.totals}>
        <TotRow label="Subtotal" value={fmt(subtotal)} />
        {discAmt > 0 && <TotRow label={`Discount (${discountType === 'percent' ? discountVal+'%' : 'flat'})`} value={`- ${fmt(discAmt)}`} green />}
        {taxAmt > 0 && <TotRow label={`Tax (${taxRate}%)`} value={fmt(taxAmt)} />}
        <div style={styles.grandRow}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16 }}>Total</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--amber)' }}>{fmt(grand)}</span>
        </div>
      </div>

      {/* Payment Methods */}
      <div style={styles.section}>
        <div style={styles.payRow}>
          {PAY_METHODS.map(m => (
            <button key={m.id} onClick={() => setPaymentMethod(m.id)}
              style={{ ...styles.payBtn, ...(paymentMethod === m.id ? styles.payBtnActive : {}) }}>
              <i className={`ti ${m.icon}`} style={{ fontSize: 15 }} />
              <span style={{ fontSize: 10 }}>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Checkout Button */}
      <div style={{ padding: '0 12px 12px' }}>
        <button
          className="btn btn-primary btn-lg w-full"
          disabled={items.length === 0 || loading}
          onClick={handleCheckout}
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em', fontSize: 14 }}
        >
          {loading
            ? <><i className="ti ti-loader-2 spinner" /> Processing…</>
            : <><i className="ti ti-check" /> Charge {fmt(grand)}</>
          }
        </button>
      </div>
    </div>
  )
}

function TotRow({ label, value, green }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 12, color: green ? 'var(--green)' : 'var(--text-secondary)' }}>{value}</span>
    </div>
  )
}

const styles = {
  panel: {
    width: 320, flexShrink: 0, background: 'var(--bg-surface)',
    borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    padding: '12px 14px', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  badge: {
    background: 'var(--amber)', color: '#0e0f11', borderRadius: 99,
    fontSize: 11, fontWeight: 700, padding: '1px 7px', fontFamily: 'var(--font-mono)',
  },
  items: { flex: 1, overflowY: 'auto', padding: '4px 0' },
  empty: {
    height: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  item: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 14px', borderBottom: '1px solid var(--border)', gap: 8,
  },
  itemLeft: { display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  itemName: { fontSize: 12, fontWeight: 500, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  itemRight: { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 },
  qtyRow: { display: 'flex', alignItems: 'center', gap: 4 },
  qtyBtn: {
    width: 22, height: 22, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-secondary)',
  },
  qtyNum: { fontSize: 12, fontWeight: 500, minWidth: 18, textAlign: 'center', fontFamily: 'var(--font-mono)' },
  lineTotal: { fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', minWidth: 64, textAlign: 'right', fontFamily: 'var(--font-mono)' },
  removeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, display: 'flex', alignItems: 'center' },
  section: { padding: '8px 12px', borderTop: '1px solid var(--border)' },
  secIcon: { position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14, pointerEvents: 'none' },
  clearCustBtn: { position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 },
  dropdown: {
    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
    background: 'var(--bg-elevated)', border: '1px solid var(--border-md)',
    borderRadius: 8, marginTop: 4, overflow: 'hidden', boxShadow: 'var(--shadow-md)',
  },
  dropItem: {
    padding: '8px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
    fontSize: 12, transition: 'background 0.1s',
  },
  totals: { padding: '10px 14px', borderTop: '1px solid var(--border)' },
  grandRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
    borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8,
  },
  payRow: { display: 'flex', gap: 6 },
  payBtn: {
    flex: 1, padding: '6px 2px', borderRadius: 8, border: '1px solid var(--border)',
    background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    fontFamily: 'var(--font-body)', transition: 'all 0.15s',
  },
  payBtnActive: {
    background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.4)',
    color: 'var(--amber)',
  },
}
