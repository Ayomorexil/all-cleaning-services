import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const app = express();
const port = process.env.PORT || 4000;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

const clientDist = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientDist));

const asyncRoute = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

function tokenFor(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Authentication required.' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session.' });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });
  next();
}

app.get('/api/health', asyncRoute(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true });
}));

app.get('/api/services', asyncRoute(async (_req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, description FROM services WHERE active = TRUE ORDER BY id'
  );
  res.json(rows);
}));

app.post('/api/auth/register', asyncRoute(async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password || password.length < 8) {
    return res.status(400).json({ message: 'Name, email, phone and an 8+ character password are required.' });
  }
  const hash = await bcrypt.hash(password, 12);
  try {
    const { rows } = await pool.query(
      'INSERT INTO users (name,email,phone,password_hash) VALUES ($1,$2,$3,$4) RETURNING id,name,email,phone,role',
      [name.trim(), email.trim().toLowerCase(), phone.trim(), hash]
    );
    const user = rows[0];
    res.status(201).json({ user, token: tokenFor(user) });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ message: 'That email is already registered.' });
    throw e;
  }
}));

app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await pool.query(
    'SELECT id,name,email,phone,password_hash,role FROM users WHERE email=$1',
    [String(email || '').trim().toLowerCase()]
  );
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password || '', user.password_hash))) {
    return res.status(401).json({ message: 'Incorrect email or password.' });
  }
  delete user.password_hash;
  res.json({ user, token: tokenFor(user) });
}));

app.get('/api/me', auth, asyncRoute(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id,name,email,phone,role,created_at FROM users WHERE id=$1',
    [req.user.id]
  );
  res.json(rows[0] || null);
}));

app.post('/api/bookings', asyncRoute(async (req, res) => {
  const { name, phone, serviceId, serviceName, date, address, details } = req.body;
  if (!name || !phone || !date || !address || (!serviceId && !serviceName)) {
    return res.status(400).json({ message: 'Name, phone, service, date and address are required.' });
  }
  let service = serviceName || '';
  if (serviceId) {
    const { rows } = await pool.query('SELECT name FROM services WHERE id=$1 AND active=TRUE', [serviceId]);
    if (!rows[0]) return res.status(400).json({ message: 'Selected service was not found.' });
    service = rows[0].name;
  }
  const { rows } = await pool.query(
    `INSERT INTO bookings
      (user_id,name,phone,service_id,service_name,booking_date,service_address,details)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING id,name,phone,service_name,booking_date,service_address,details,status,created_at`,
    [req.user?.id || null, name.trim(), phone.trim(), serviceId || null, service, date, address.trim(), details || '']
  );
  res.status(201).json(rows[0]);
}));

app.get('/api/my-bookings', auth, asyncRoute(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id,service_name,booking_date,service_address,details,status,created_at
     FROM bookings WHERE user_id=$1 ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
}));

app.get('/api/admin/bookings', auth, adminOnly, asyncRoute(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT b.*, u.email AS customer_email
     FROM bookings b LEFT JOIN users u ON u.id=b.user_id
     ORDER BY b.created_at DESC`
  );
  res.json(rows);
}));

app.patch('/api/admin/bookings/:id', auth, adminOnly, asyncRoute(async (req, res) => {
  const allowed = ['pending','confirmed','in_progress','completed','cancelled'];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: 'Invalid status.' });
  const { rows } = await pool.query(
    'UPDATE bookings SET status=$1 WHERE id=$2 RETURNING *',
    [req.body.status, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ message: 'Booking not found.' });
  res.json(rows[0]);
}));

app.post('/api/admin/create', asyncRoute(async (_req, res) => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return res.status(400).json({ message: 'Set ADMIN_EMAIL and ADMIN_PASSWORD first.' });
  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO users (name,email,phone,password_hash,role)
     VALUES ('Administrator',$1,'', $2,'admin')
     ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash, role='admin'`,
    [email.toLowerCase(), hash]
  );
  res.json({ message: 'Admin account created or updated.' });
}));

// React fallback for production routes.
app.get('*', (_req, res, next) => {
  const index = path.join(clientDist, 'index.html');
  res.sendFile(index, (err) => err ? next() : undefined);
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error. Please try again.' });
});

app.listen(port, () => console.log(`All Cleaning Services API running on http://localhost:${port}`));
