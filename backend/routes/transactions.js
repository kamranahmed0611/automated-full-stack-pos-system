const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/init');
const auth = require('../middleware/auth');

function genInvoice() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth()+1).padStart(2,'0');
  const d = String(now.getDate()).padStart(2,'0');
  const prefix = `INV-${y}${m}${d}-`;
  const row = db.prepare("SELECT invoice_no FROM transactions WHERE invoice_no LIKE ? ORDER BY invoice_no DESC LIMIT 1").get(`${prefix}%`);
  let seq = 1;
  if (row && row.invoice_no) {
    const parts = row.invoice_no.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }
  return `${prefix}${String(seq).padStart(4,'0')}`;
}

// CREATE transaction (checkout)
router.post('/', auth(), (req, res) => {
  const { customer_id, items, discount_val, discount_type, tax_rate, payment_method, notes } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'Cart is empty' });

  if (payment_method === 'credit' && !customer_id) {
    return res.status(400).json({ error: 'Customer is required for credit transactions' });
  }

  const txnId = uuidv4();
  const invoice_no = genInvoice();

  // Calculate totals
  let subtotal = 0;
  const enriched = [];
  for (const item of items) {
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(item.product_id);
    if (!product) return res.status(400).json({ error: `Product not found: ${item.product_id}` });
    if (product.stock < item.qty) return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
    const line_total = product.price * item.qty;
    subtotal += line_total;
    enriched.push({ ...item, price: product.price, tax_rate: product.tax_rate, line_total, product_name: product.name });
  }

  const dv = parseFloat(discount_val) || 0;
  const discount_amt = discount_type === 'flat' ? Math.min(dv, subtotal) : (subtotal * dv / 100);
  const taxable = subtotal - discount_amt;
  const tax_amt = taxable * (parseFloat(tax_rate)||0) / 100;
  const grand_total = taxable + tax_amt;

  if (payment_method === 'credit' && customer_id) {
    const cust = db.prepare('SELECT credit_limit, balance FROM customers WHERE id = ?').get(customer_id);
    if (!cust) return res.status(400).json({ error: 'Customer not found' });
    if (cust.credit_limit > 0 && (cust.balance + grand_total) > cust.credit_limit) {
      return res.status(400).json({ error: `Credit limit exceeded. Current balance: ${cust.balance.toFixed(2)}, Limit: ${cust.credit_limit}` });
    }
  }

  const doCheckout = db.transaction(() => {
    db.prepare(`
      INSERT INTO transactions (id,invoice_no,customer_id,cashier_id,subtotal,discount_amt,discount_type,discount_val,tax_amt,grand_total,payment_method,notes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(txnId, invoice_no, customer_id||null, req.user.id, subtotal, discount_amt, discount_type||'percent', dv, tax_amt, grand_total, payment_method||'cash', notes||null);

    const insertItem = db.prepare(`
      INSERT INTO transaction_items (id,transaction_id,product_id,product_name,price,qty,tax_rate,line_total)
      VALUES (?,?,?,?,?,?,?,?)
    `);
    const updateStock = db.prepare("UPDATE products SET stock=stock-?,updated_at=datetime('now') WHERE id=?");
    const insertMove = db.prepare('INSERT INTO stock_movements (id,product_id,type,qty,ref_id,note,created_by) VALUES (?,?,?,?,?,?,?)');

    for (const item of enriched) {
      insertItem.run(uuidv4(), txnId, item.product_id, item.product_name, item.price, item.qty, item.tax_rate, item.line_total);
      updateStock.run(item.qty, item.product_id);
      insertMove.run(uuidv4(), item.product_id, 'sale', item.qty, txnId, 'Sale', req.user.id);
    }

    if (customer_id) {
      const ptsToAdd = Math.floor(grand_total / 100);
      db.prepare('UPDATE customers SET loyalty_pts = loyalty_pts + ? WHERE id = ?').run(ptsToAdd, customer_id);
      if (payment_method === 'credit') {
        db.prepare('UPDATE customers SET balance = balance + ? WHERE id = ?').run(grand_total, customer_id);
      }
    }
  });

  doCheckout();
  res.status(201).json({ id: txnId, invoice_no, grand_total });
});

// GET all transactions
router.get('/', auth(), (req, res) => {
  const { date, customer_id, limit = 50, offset = 0, method } = req.query;
  let q = `
    SELECT t.*, u.name as cashier_name, c.name as customer_name
    FROM transactions t
    LEFT JOIN users u ON t.cashier_id = u.id
    LEFT JOIN customers c ON t.customer_id = c.id
    WHERE 1=1
  `;
  const p = [];
  if (date) { q += ' AND date(t.created_at) = ?'; p.push(date); }
  if (customer_id) { q += ' AND t.customer_id = ?'; p.push(customer_id); }
  if (method) { q += ' AND t.payment_method = ?'; p.push(method); }
  q += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
  p.push(parseInt(limit), parseInt(offset));
  res.json(db.prepare(q).all(...p));
});

// GET single transaction with items
router.get('/:id', auth(), (req, res) => {
  const txn = db.prepare(`
    SELECT t.*, u.name as cashier_name, c.name as customer_name, c.phone as customer_phone
    FROM transactions t
    LEFT JOIN users u ON t.cashier_id = u.id
    LEFT JOIN customers c ON t.customer_id = c.id
    WHERE t.id = ?
  `).get(req.params.id);
  if (!txn) return res.status(404).json({ error: 'Transaction not found' });

  const items = db.prepare(`
    SELECT ti.*, p.icon FROM transaction_items ti
    LEFT JOIN products p ON ti.product_id = p.id
    WHERE ti.transaction_id = ?
  `).all(req.params.id);

  const settings = db.prepare('SELECT key,value FROM settings').all();
  const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));

  res.json({ ...txn, items, store: settingsMap });
});

// VOID transaction
router.delete('/:id', auth(['admin']), (req, res) => {
  const txn = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  if (!txn) return res.status(404).json({ error: 'Transaction not found' });
  if (txn.payment_status === 'void') return res.status(400).json({ error: 'Transaction is already voided' });

  const doVoid = db.transaction(() => {
    const items = db.prepare('SELECT * FROM transaction_items WHERE transaction_id = ?').all(req.params.id);
    const restoreStock = db.prepare("UPDATE products SET stock=stock+?,updated_at=datetime('now') WHERE id=?");
    const insertMove = db.prepare('INSERT INTO stock_movements (id,product_id,type,qty,ref_id,note,created_by) VALUES (?,?,?,?,?,?,?)');
    for (const item of items) {
      restoreStock.run(item.qty, item.product_id);
      insertMove.run(uuidv4(), item.product_id, 'void', item.qty, txn.id, 'Void transaction', req.user.id);
    }
    db.prepare("UPDATE transactions SET payment_status='void' WHERE id=?").run(req.params.id);

    if (txn.customer_id) {
      const ptsToDeduct = Math.floor(txn.grand_total / 100);
      db.prepare('UPDATE customers SET loyalty_pts = MAX(0, loyalty_pts - ?) WHERE id = ?').run(ptsToDeduct, txn.customer_id);
      if (txn.payment_method === 'credit') {
        db.prepare('UPDATE customers SET balance = MAX(0, balance - ?) WHERE id = ?').run(txn.grand_total, txn.customer_id);
      }
    }
  });

  doVoid();
  res.json({ success: true });
});

module.exports = router;
