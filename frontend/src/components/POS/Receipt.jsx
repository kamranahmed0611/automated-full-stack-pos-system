import { fmt, fmtDateTime, paymentLabel } from '../../utils/helpers'

export default function Receipt({ txn, onClose }) {
  const handlePrint = () => window.print()

  return (
    <div style={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal} className="animate-fade">
        <div style={styles.header}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Receipt</span>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-icon">
            <i className="ti ti-x" />
          </button>
        </div>

        {/* Receipt Paper */}
        <div style={styles.paper} id="receipt-print">
          <div style={styles.storeName}>{txn.store?.store_name || 'SuperMart'}</div>
          <div style={styles.storeSub}>{txn.store?.store_address}</div>
          <div style={styles.storeSub}>{txn.store?.store_phone}</div>
          <div style={styles.divider} />
          <div style={styles.metaRow}><span>Invoice</span><span style={{ fontFamily: 'var(--font-mono)' }}>{txn.invoice_no}</span></div>
          <div style={styles.metaRow}><span>Date</span><span>{fmtDateTime(txn.created_at)}</span></div>
          <div style={styles.metaRow}><span>Cashier</span><span>{txn.cashier_name}</span></div>
          {txn.customer_name && <div style={styles.metaRow}><span>Customer</span><span>{txn.customer_name}</span></div>}
          <div style={styles.divider} />

          {/* Items */}
          <div style={styles.itemsHeader}>
            <span style={{ flex: 1 }}>Item</span>
            <span style={{ width: 40, textAlign: 'center' }}>Qty</span>
            <span style={{ width: 80, textAlign: 'right' }}>Amount</span>
          </div>
          {txn.items?.map((item, i) => (
            <div key={i} style={styles.itemRow}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{item.icon} {item.product_name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {fmt(item.price)} × {item.qty}
                </div>
              </div>
              <div style={{ width: 40, textAlign: 'center', fontSize: 12 }}>{item.qty}</div>
              <div style={{ width: 80, textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{fmt(item.line_total)}</div>
            </div>
          ))}

          <div style={styles.divider} />
          <TotLine label="Subtotal" value={fmt(txn.subtotal)} />
          {txn.discount_amt > 0 && <TotLine label="Discount" value={`- ${fmt(txn.discount_amt)}`} green />}
          {txn.tax_amt > 0 && <TotLine label="Tax (GST)" value={fmt(txn.tax_amt)} />}
          <div style={styles.grandLine}>
            <span>TOTAL</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{fmt(txn.grand_total)}</span>
          </div>
          <div style={styles.divider} />
          <TotLine label="Payment" value={paymentLabel[txn.payment_method] || txn.payment_method} />
          <div style={styles.divider} />
          <div style={styles.footer}>{txn.store?.receipt_footer || 'Thank you for shopping!'}</div>
          <div style={{ ...styles.footer, marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 10 }}>
            *** {txn.invoice_no} ***
          </div>
        </div>

        <div style={styles.actions}>
          <button onClick={handlePrint} className="btn btn-ghost" style={{ flex: 1 }}>
            <i className="ti ti-printer" /> Print
          </button>
          <button onClick={onClose} className="btn btn-primary" style={{ flex: 1 }}>
            <i className="ti ti-plus" /> New Sale
          </button>
        </div>
      </div>
    </div>
  )
}

function TotLine({ label, value, green }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 12, color: green ? 'var(--green)' : 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{value}</span>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  modal: {
    background: 'var(--bg-surface)', border: '1px solid var(--border-md)',
    borderRadius: 16, width: 340, maxHeight: '90vh', display: 'flex',
    flexDirection: 'column', boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
  },
  header: {
    padding: '14px 16px', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  paper: {
    flex: 1, overflowY: 'auto', padding: '16px 20px',
    background: 'var(--bg-elevated)',
  },
  storeName: { textAlign: 'center', fontSize: 16, fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 2 },
  storeSub: { textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 },
  divider: { borderTop: '1px dashed var(--border-md)', margin: '10px 0' },
  metaRow: { display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3, color: 'var(--text-secondary)' },
  itemsHeader: {
    display: 'flex', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
  },
  itemRow: { display: 'flex', alignItems: 'flex-start', marginBottom: 6, gap: 4 },
  grandLine: {
    display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-display)',
    fontWeight: 700, fontSize: 15, marginTop: 6, paddingTop: 6,
    borderTop: '1px solid var(--border-md)', color: 'var(--amber)',
  },
  footer: { textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 },
  actions: { padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 },
}
