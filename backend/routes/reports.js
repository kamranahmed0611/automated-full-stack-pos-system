const router = require('express').Router();
const db = require('../db/init');
const auth = require('../middleware/auth');

// Dashboard summary
router.get('/dashboard', auth(), (req, res) => {
  const today = new Date().toLocaleDateString('en-CA');

  const todaySales = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(grand_total),0) as revenue, COALESCE(SUM(tax_amt),0) as tax
    FROM transactions WHERE date(created_at)=? AND payment_status != 'void'
  `).get(today);

  const weekSales = db.prepare(`
    SELECT COALESCE(SUM(grand_total),0) as revenue, COUNT(*) as count
    FROM transactions WHERE created_at >= datetime('now','-7 days') AND payment_status != 'void'
  `).get();

  const monthSales = db.prepare(`
    SELECT COALESCE(SUM(grand_total),0) as revenue, COUNT(*) as count
    FROM transactions WHERE strftime('%Y-%m',created_at)=strftime('%Y-%m','now') AND payment_status != 'void'
  `).get();

  const lowStockCount = db.prepare('SELECT COUNT(*) as cnt FROM products WHERE stock <= min_stock AND active=1 AND stock > 0').get().cnt;
  const outOfStock = db.prepare('SELECT COUNT(*) as cnt FROM products WHERE stock = 0 AND active=1').get().cnt;
  const totalProducts = db.prepare('SELECT COUNT(*) as cnt FROM products WHERE active=1').get().cnt;

  const inventoryValue = db.prepare('SELECT COALESCE(SUM(price*stock),0) as val FROM products WHERE active=1').get().val;
  const inventoryCost = db.prepare('SELECT COALESCE(SUM(cost*stock),0) as val FROM products WHERE active=1').get().val;

  const topProducts = db.prepare(`
    SELECT p.name, p.icon, SUM(ti.qty) as units, SUM(ti.line_total) as revenue
    FROM transaction_items ti
    JOIN products p ON ti.product_id = p.id
    JOIN transactions t ON ti.transaction_id = t.id
    WHERE date(t.created_at) = ? AND t.payment_status != 'void'
    GROUP BY p.id ORDER BY revenue DESC LIMIT 5
  `).all(today);

  const dailyRevenue = db.prepare(`
    SELECT date(created_at) as date, COALESCE(SUM(grand_total),0) as revenue, COUNT(*) as txns
    FROM transactions WHERE created_at >= datetime('now','-30 days') AND payment_status != 'void'
    GROUP BY date(created_at) ORDER BY date
  `).all();

  const paymentBreakdown = db.prepare(`
    SELECT payment_method, COUNT(*) as count, COALESCE(SUM(grand_total),0) as total
    FROM transactions WHERE date(created_at)=? AND payment_status != 'void'
    GROUP BY payment_method
  `).all(today);

  const recentTxns = db.prepare(`
    SELECT t.id, t.invoice_no, t.grand_total, t.payment_method, t.payment_status, t.created_at,
           u.name as cashier, c.name as customer
    FROM transactions t
    LEFT JOIN users u ON t.cashier_id = u.id
    LEFT JOIN customers c ON t.customer_id = c.id
    ORDER BY t.created_at DESC LIMIT 8
  `).all();

  res.json({
    today: todaySales,
    week: weekSales,
    month: monthSales,
    inventory: { value: inventoryValue, cost: inventoryCost, total: totalProducts, low: lowStockCount, out: outOfStock },
    topProducts,
    dailyRevenue,
    paymentBreakdown,
    recentTxns,
  });
});

// Date range report
router.get('/range', auth(['admin', 'manager']), (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'from and to dates required' });

  const summary = db.prepare(`
    SELECT COUNT(*) as txns, COALESCE(SUM(grand_total),0) as revenue,
           COALESCE(SUM(tax_amt),0) as tax, COALESCE(SUM(discount_amt),0) as discount,
           COALESCE(AVG(grand_total),0) as avg_bill
    FROM transactions WHERE date(created_at) BETWEEN ? AND ? AND payment_status != 'void'
  `).get(from, to);

  const byDay = db.prepare(`
    SELECT date(created_at) as date, COUNT(*) as txns, SUM(grand_total) as revenue
    FROM transactions WHERE date(created_at) BETWEEN ? AND ? AND payment_status != 'void'
    GROUP BY date(created_at) ORDER BY date
  `).all(from, to);

  const topProducts = db.prepare(`
    SELECT p.name, p.icon, SUM(ti.qty) as units, SUM(ti.line_total) as revenue
    FROM transaction_items ti
    JOIN products p ON ti.product_id = p.id
    JOIN transactions t ON ti.transaction_id = t.id
    WHERE date(t.created_at) BETWEEN ? AND ? AND t.payment_status != 'void'
    GROUP BY p.id ORDER BY revenue DESC LIMIT 10
  `).all(from, to);

  const byCategory = db.prepare(`
    SELECT c.name as category, c.color, SUM(ti.line_total) as revenue, SUM(ti.qty) as units
    FROM transaction_items ti
    JOIN products p ON ti.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    JOIN transactions t ON ti.transaction_id = t.id
    WHERE date(t.created_at) BETWEEN ? AND ? AND t.payment_status != 'void'
    GROUP BY c.id ORDER BY revenue DESC
  `).all(from, to);

  res.json({ summary, byDay, topProducts, byCategory });
});

// Stock movements report
router.get('/stock-movements', auth(['admin','manager']), (req, res) => {
  const { product_id, from, to, type } = req.query;
  let q = `
    SELECT sm.*, p.name as product_name, p.barcode, u.name as created_by_name
    FROM stock_movements sm
    JOIN products p ON sm.product_id = p.id
    LEFT JOIN users u ON sm.created_by = u.id WHERE 1=1
  `;
  const params = [];
  if (product_id) { q += ' AND sm.product_id=?'; params.push(product_id); }
  if (from) { q += ' AND date(sm.created_at)>=?'; params.push(from); }
  if (to) { q += ' AND date(sm.created_at)<=?'; params.push(to); }
  if (type) { q += ' AND sm.type=?'; params.push(type); }
  q += ' ORDER BY sm.created_at DESC LIMIT 200';
  res.json(db.prepare(q).all(...params));
});

module.exports = router;
