import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import { useCartStore } from '../../store'
import { fmt } from '../../utils/helpers'
import CartPanel from './CartPanel'
import Receipt from './Receipt'

export default function POSTerminal() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [receipt, setReceipt] = useState(null)
  const addItem = useCartStore(s => s.addItem)
  const searchRef = useRef()

  useEffect(() => {
    loadData()
    searchRef.current?.focus()
  }, [])

  const loadData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
      ])
      setProducts(prodRes.data)
      setCategories([{ id: 'All', name: 'All', icon: '🏷️' }, ...catRes.data])
    } catch {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const filtered = products.filter(p => {
    const matchCat = activeCategory === 'All' || p.category_id === activeCategory
    const q = search.toLowerCase()
    const matchQ = !q || p.name.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q)
    return matchCat && matchQ
  })

  const handleAdd = (product) => {
    const ok = addItem(product)
    if (!ok) toast.error(product.stock === 0 ? 'Out of stock' : 'Max stock reached')
    else {
      // subtle feedback
    }
  }

  const handleCheckout = (txn) => {
    setReceipt(txn)
    loadData()
  }

  return (
    <div style={styles.shell}>
      {/* LEFT: Product Browser */}
      <div style={styles.left}>
        {/* Search */}
        <div style={styles.searchBar}>
          <div style={styles.searchWrap}>
            <i className="ti ti-barcode-off" style={styles.searchIcon} />
            <input
              ref={searchRef}
              className="input"
              style={{ paddingLeft: 36, background: 'var(--bg-elevated)' }}
              placeholder="Search products or scan barcode…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} style={styles.clearBtn}>
                <i className="ti ti-x" />
              </button>
            )}
          </div>
          <div style={styles.productCount} className="text-muted text-sm mono">{filtered.length} items</div>
        </div>

        {/* Categories */}
        <div style={styles.catRow}>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              style={{
                ...styles.catPill,
                ...(activeCategory === c.id ? styles.catPillActive : {})
              }}
            >
              <span>{c.icon}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={styles.loadingState}>
            <i className="ti ti-loader-2 spinner" style={{ fontSize: 24, color: 'var(--text-muted)' }} />
          </div>
        ) : (
          <div style={styles.grid} className="overflow-auto">
            {filtered.length === 0 ? (
              <div style={styles.emptyState}>
                <i className="ti ti-search" style={{ fontSize: 32, opacity: 0.3 }} />
                <span>No products found</span>
              </div>
            ) : filtered.map(p => (
              <ProductCard key={p.id} product={p} onAdd={handleAdd} />
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: Cart */}
      <CartPanel onCheckoutSuccess={handleCheckout} />

      {/* Receipt Modal */}
      {receipt && <Receipt txn={receipt} onClose={() => setReceipt(null)} />}
    </div>
  )
}

function ProductCard({ product, onAdd }) {
  const oos = product.stock === 0
  const low = product.stock > 0 && product.stock <= product.min_stock

  return (
    <div
      style={{ ...styles.prodCard, ...(oos ? styles.prodOOS : {}) }}
      onClick={() => !oos && onAdd(product)}
      className={oos ? '' : 'product-card-hover'}
    >
      <div style={styles.prodTop}>
        <span style={styles.prodIcon}>{product.icon}</span>
        {low && !oos && <span className="badge badge-yellow" style={{ fontSize: 10, padding: '1px 6px' }}>Low</span>}
        {oos && <span className="badge badge-red" style={{ fontSize: 10, padding: '1px 6px' }}>OOS</span>}
      </div>
      <div style={styles.prodName}>{product.name}</div>
      <div style={styles.prodMeta}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{product.barcode}</span>
      </div>
      <div style={styles.prodBottom}>
        <span style={styles.prodPrice}>{fmt(product.price)}</span>
        <span style={{ fontSize: 10, color: oos ? 'var(--red)' : low ? 'var(--yellow)' : 'var(--text-muted)' }}>
          {oos ? '0' : `${product.stock}`} {product.unit}
        </span>
      </div>
    </div>
  )
}

const styles = {
  shell: { display: 'flex', height: '100%', overflow: 'hidden' },
  left: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '12px 0 12px 12px' },
  searchBar: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, paddingRight: 12 },
  searchWrap: { flex: 1, position: 'relative' },
  searchIcon: { position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 16, pointerEvents: 'none' },
  clearBtn: { position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 },
  productCount: { whiteSpace: 'nowrap' },
  catRow: { display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, paddingRight: 12, flexShrink: 0 },
  catPill: {
    display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 99,
    border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)',
    cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', transition: 'all 0.15s',
  },
  catPillActive: { background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.4)', color: 'var(--amber)' },
  grid: {
    flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    gap: 8, paddingRight: 12, alignContent: 'start',
  },
  loadingState: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  emptyState: { gridColumn: '1/-1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-muted)', padding: 40 },
  prodCard: {
    background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10,
    padding: 10, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', gap: 4,
  },
  prodOOS: { opacity: 0.45, cursor: 'not-allowed' },
  prodTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  prodIcon: { fontSize: 22, lineHeight: 1 },
  prodName: { fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3, flex: 1 },
  prodMeta: { },
  prodBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 2 },
  prodPrice: { fontSize: 13, fontWeight: 600, color: 'var(--amber)', fontFamily: 'var(--font-display)' },
}
