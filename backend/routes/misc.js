const catRouter = require('express').Router();
const custRouter = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/init');
const auth = require('../middleware/auth');

// ── CATEGORIES ──
catRouter.get('/', auth(), (req, res) => {
  res.json(db.prepare('SELECT * FROM categories ORDER BY name').all());
});

catRouter.post('/', auth(['admin','manager']), (req, res) => {
  const { name, color, icon } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const existing = db.prepare('SELECT id FROM categories WHERE name = ?').get(name);
  if (existing) return res.status(400).json({ error: 'Category name already exists' });

  const id = uuidv4();
  db.prepare('INSERT INTO categories (id,name,color,icon) VALUES (?,?,?,?)').run(id, name, color||'#185FA5', icon||'📦');
  res.status(201).json({ id });
});

catRouter.put('/:id', auth(['admin','manager']), (req, res) => {
  const { name, color, icon } = req.body;
  if (name) {
    const existing = db.prepare('SELECT id FROM categories WHERE name = ? AND id != ?').get(name, req.params.id);
    if (existing) return res.status(400).json({ error: 'Category name already exists' });
  }
  db.prepare('UPDATE categories SET name=?,color=?,icon=? WHERE id=?').run(name, color, icon, req.params.id);
  res.json({ success: true });
});

catRouter.delete('/:id', auth(['admin']), (req, res) => {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM products WHERE category_id=?').get(req.params.id).cnt;
  if (count > 0) return res.status(400).json({ error: 'Cannot delete category: it is assigned to existing products' });
  db.prepare('DELETE FROM categories WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ── CUSTOMERS ──
custRouter.get('/', auth(), (req, res) => {
  const { search } = req.query;
  let q = 'SELECT * FROM customers WHERE 1=1';
  const p = [];
  if (search) { q += ' AND (name LIKE ? OR phone LIKE ?)'; p.push(`%${search}%`, `%${search}%`); }
  q += ' ORDER BY name';
  res.json(db.prepare(q).all(...p));
});

custRouter.get('/:id', auth(), (req, res) => {
  const c = db.prepare('SELECT * FROM customers WHERE id=?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  const txns = db.prepare('SELECT id,invoice_no,grand_total,payment_method,created_at FROM transactions WHERE customer_id=? ORDER BY created_at DESC LIMIT 10').all(req.params.id);
  res.json({ ...c, transactions: txns });
});

custRouter.post('/', auth(), (req, res) => {
  const { name, phone, email, address, credit_limit } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const id = uuidv4();
  db.prepare('INSERT INTO customers (id,name,phone,email,address,credit_limit) VALUES (?,?,?,?,?,?)').run(id, name, phone||null, email||null, address||null, credit_limit||0);
  res.status(201).json({ id });
});

custRouter.put('/:id', auth(), (req, res) => {
  const { name, phone, email, address, credit_limit } = req.body;
  db.prepare('UPDATE customers SET name=?,phone=?,email=?,address=?,credit_limit=? WHERE id=?')
    .run(name, phone, email, address, credit_limit, req.params.id);
  res.json({ success: true });
});

// Users management
const userRouter = require('express').Router();
const bcrypt = require('bcryptjs');

userRouter.get('/', auth(['admin']), (req, res) => {
  res.json(db.prepare('SELECT id,name,email,role,active,created_at FROM users ORDER BY name').all());
});

userRouter.post('/', auth(['admin']), (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(400).json({ error: 'User email already registered' });

  const id = uuidv4();
  const hashed = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (id,name,email,password,role) VALUES (?,?,?,?,?)').run(id, name, email, hashed, role||'cashier');
  res.status(201).json({ id });
});

userRouter.put('/:id', auth(['admin']), (req, res) => {
  const { name, role, active } = req.body;
  db.prepare('UPDATE users SET name=?,role=?,active=? WHERE id=?').run(name, role, active??1, req.params.id);
  res.json({ success: true });
});

// Settings
const settingsRouter = require('express').Router();
settingsRouter.get('/', auth(), (req, res) => {
  const rows = db.prepare('SELECT key,value FROM settings').all();
  res.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
});
settingsRouter.put('/', auth(['admin']), (req, res) => {
  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)');
  const update = db.transaction((data) => { Object.entries(data).forEach(([k,v]) => upsert.run(k, v)); });
  update(req.body);
  res.json({ success: true });
});

module.exports = { catRouter, custRouter, userRouter, settingsRouter };
