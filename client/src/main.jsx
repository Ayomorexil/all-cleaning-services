import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const fallbackServices = [
  { id: 1, name: 'Residential Cleaning', description: 'Routine cleaning, deep cleaning, move-in/move-out cleaning.' },
  { id: 2, name: 'Commercial Cleaning', description: 'Offices, retail stores, schools, churches & more.' },
  { id: 3, name: 'Deep Cleaning', description: 'Detailed cleaning for a healthier, fresh-smelling space.' },
  { id: 4, name: 'Window Cleaning', description: 'Streak-free shine for homes & businesses.' },
  { id: 5, name: 'Carpet & Upholstery Cleaning', description: 'Remove dirt, stains & allergens.' },
  { id: 6, name: 'Fumigation Services', description: 'Effective pest control for homes, offices & facilities.' },
  { id: 7, name: 'Post-Construction Cleaning', description: 'We clean up, so you can move in.' }
];



function AdminDashboard({ token, user, onLogout }) {
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');

  async function loadBookings() {
    try {
      const r = await fetch('http://localhost:4000/api/admin/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'Unable to load bookings.');
      setBookings(data);
    } catch (e) {
      setMessage(e.message);
    }
  }

  useEffect(() => { loadBookings(); }, [token]);

  async function updateStatus(id, status) {
    try {
      const r = await fetch(`http://localhost:4000/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'Update failed.');
      setBookings(current => current.map(b => b.id === id ? { ...b, status: data.status } : b));
    } catch (e) {
      setMessage(e.message);
    }
  }

  const visible = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  return (
    <section className="admin section">
      <div className="dashboard-top">
        <div>
          <p className="eyebrow">ADMIN DASHBOARD</p>
          <h2>Booking management</h2>
          <p>Welcome, {user.name}. Review customer requests and update their status.</p>
        </div>
        <button className="button secondary" onClick={onLogout}>Log out</button>
      </div>

      <div className="admin-stats">
        <div><strong>{bookings.length}</strong><span>Total bookings</span></div>
        <div><strong>{bookings.filter(b => b.status === 'pending').length}</strong><span>Pending</span></div>
        <div><strong>{bookings.filter(b => b.status === 'confirmed').length}</strong><span>Confirmed</span></div>
        <div><strong>{bookings.filter(b => b.status === 'completed').length}</strong><span>Completed</span></div>
      </div>

      <div className="dashboard-card">
        <div className="admin-toolbar">
          <h3>Customer bookings</h3>
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        {message && <p className="booking-message">{message}</p>}
        {visible.length === 0 && <p>No bookings match this filter.</p>}
        <div className="admin-table">
          {visible.map(b => (
            <article className="admin-booking" key={b.id}>
              <div className="admin-booking-main">
                <strong>#{b.id} — {b.service_name}</strong>
                <span>{b.name} · {b.phone}</span>
                <span>{b.customer_email || 'Guest booking'}</span>
                <span>{new Date(b.booking_date).toLocaleDateString()} · {b.service_address}</span>
                {b.details && <small>{b.details}</small>}
              </div>
              <div className="admin-booking-actions">
                <span className={`status status-${b.status}`}>{b.status.replace('_', ' ')}</span>
                <select value={b.status} onChange={e => updateStatus(b.id, e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Dashboard({ token, user, onLogout }) {
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('http://localhost:4000/api/my-bookings', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => Array.isArray(data) ? setBookings(data) : setMessage(data.message || 'Unable to load bookings.'))
      .catch(() => setMessage('Unable to connect to the booking system.'));
  }, [token]);

  return (
    <section className="dashboard section">
      <div className="dashboard-top">
        <div>
          <p className="eyebrow">CUSTOMER DASHBOARD</p>
          <h2>Welcome, {user.name}</h2>
          <p>View your cleaning service requests and their current status.</p>
        </div>
        <button className="button secondary" onClick={onLogout}>Log out</button>
      </div>

      <div className="dashboard-card">
        <h3>Your bookings</h3>
        {message && <p className="booking-message">{message}</p>}
        {!message && bookings.length === 0 && <p>No bookings yet. <a href="#booking">Make your first booking →</a></p>}
        {bookings.length > 0 && (
          <div className="booking-list">
            {bookings.map(b => (
              <article className="booking-item" key={b.id}>
                <div>
                  <strong>{b.service_name}</strong>
                  <span>{new Date(b.booking_date).toLocaleDateString()}</span>
                  <span>{b.service_address}</span>
                </div>
                <span className={`status status-${b.status}`}>{b.status.replace('_', ' ')}</span>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function AuthPanel({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name:'', email:'', phone:'', password:'' });
  const [message, setMessage] = useState('');

  async function submit(e) {
    e.preventDefault();
    setMessage('Please wait...');
    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    try {
      const r = await fetch(`http://localhost:4000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'Request failed');
      onLogin(data);
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <section className="auth section">
      <div className="auth-card">
        <p className="eyebrow">{mode === 'login' ? 'CUSTOMER LOGIN' : 'CREATE ACCOUNT'}</p>
        <h2>{mode === 'login' ? 'Welcome back.' : 'Create your customer account.'}</h2>
        <form onSubmit={submit}>
          {mode === 'register' && <input required placeholder="Full name" value={form.name} onChange={e => setForm({...form,name:e.target.value})} />}
          <input required type="email" placeholder="Email address" value={form.email} onChange={e => setForm({...form,email:e.target.value})} />
          {mode === 'register' && <input required placeholder="Phone / WhatsApp" value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} />}
          <input required type="password" minLength="8" placeholder="Password (8+ characters)" value={form.password} onChange={e => setForm({...form,password:e.target.value})} />
          <button className="button primary" type="submit">{mode === 'login' ? 'Log in' : 'Create account'}</button>
        </form>
        {message && <p className="booking-message">{message}</p>}
        <button className="text-button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage(''); }}>
          {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Log in'}
        </button>
      </div>
    </section>
  );
}

function App() {
  const [services, setServices] = useState(fallbackServices);
  const [bookingMessage, setBookingMessage] = useState('');
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem('acs_session')) || null; } catch { return null; }
  });

  useEffect(() => {
    fetch('http://localhost:4000/api/services')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setServices)
      .catch(() => {});
  }, []);

  async function submitBooking(e) {
    e.preventDefault();
    setBookingMessage('Sending booking request...');
    const form = new FormData(e.currentTarget);
    const selected = services.find(s => String(s.id) === form.get('service'));
    try {
      const response = await fetch('http://localhost:4000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          phone: form.get('phone'),
          serviceId: selected?.id,
          serviceName: selected?.name,
          date: form.get('date'),
          address: form.get('address'),
          details: form.get('details')
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Booking failed');
      setBookingMessage('Booking request received. We will contact you shortly.');
      e.currentTarget.reset();
    } catch (error) {
      setBookingMessage(error.message + ' If the site is being previewed locally, make sure the backend is running.');
    }
  }

  return (
    <>
      <header className="nav">
        <a className="brand" href="#home">
          <img src="/assets/logo.jpg" alt="All Cleaning Services logo" />
        </a>
        <nav>
          <a href="#home">Home</a>
          <a href="#services">Services</a>
          <a href="#about">About</a>
          <a href="#booking">Booking</a>
          <a href="#contact">Contact</a>
          <a href="#account">{session ? 'Dashboard' : 'Customer Login'}</a>
        </nav>
        <a className="nav-cta" href="tel:+23490118423051">Call Us</a>
      </header>

      <main>
        <section id="home" className="hero">
          <div className="hero-copy">
            <p className="eyebrow">COMPLETE CLEANING & FUMIGATION SOLUTIONS</p>
            <h1>Clean spaces.<br /><span>Happy places.</span></h1>
            <p className="lead">
              Professional cleaning and fumigation services for homes, offices and facilities.
              We clean, you relax.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#booking">Book a Service</a>
              <a className="button secondary" href="https://wa.me/2349040237971" target="_blank" rel="noreferrer">WhatsApp Us</a>
            </div>
            <div className="trust-row">
              <span>✓ Trained Staff</span>
              <span>✓ On-Time Service</span>
              <span>✓ Quality Assured</span>
              <span>✓ Eco-Friendly Products</span>
            </div>
          </div>
          <div className="hero-card">
            <img src="/assets/flyer.jpg" alt="All Cleaning Services promotional flyer" />
          </div>
        </section>

        <section id="services" className="section">
          <div className="section-heading">
            <p className="eyebrow">OUR SERVICES</p>
            <h2>Professional cleaning for every space.</h2>
            <p>Choose the service that fits your home, business or facility.</p>
          </div>
          <div className="service-grid">
            {services.map((service) => (
              <article className="service-card" key={service.name}>
                <div className="service-icon">{service.icon}</div>
                <h3>{service.name}</h3>
                <p>{service.description}</p>
                <a href="#booking">Request service →</a>
              </article>
            ))}
          </div>
        </section>

        <section id="about" className="about">
          <div>
            <p className="eyebrow">WHY ALL CLEANING SERVICES</p>
            <h2>A cleaner, healthier space starts here.</h2>
            <p>
              All Cleaning Services provides professional cleaning and fumigation solutions
              with a focus on reliable service, quality results and customer peace of mind.
            </p>
            <ul>
              <li>Professional, trained service</li>
              <li>Reliable and on-time support</li>
              <li>Quality-focused cleaning</li>
              <li>Safe and effective fumigation</li>
            </ul>
          </div>
          <img src="/assets/logo.jpg" alt="All Cleaning Services" />
        </section>

        <section id="booking" className="booking section">
          <div className="section-heading">
            <p className="eyebrow">NEW BOOKING</p>
            <h2>Tell us what you need cleaned.</h2>
            <p>Send your details and we’ll use them to prepare your service request.</p>
          </div>
          <form className="booking-form" onSubmit={submitBooking}>
            <label>Full name<input name="name" required placeholder="Your name" /></label>
            <label>Phone / WhatsApp<input name="phone" required placeholder="+234..." /></label>
            <label>Service<select required defaultValue=""><option value="" disabled>Select a service</option>{services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
            <label>Preferred date<input name="date" required type="date" /></label>
            <label className="full">Service address<input name="address" required placeholder="Where should we provide the service?" /></label>
            <label className="full">Additional details<textarea name="details" rows="4" placeholder="Tell us anything we should know..."></textarea></label>
            <button className="button primary full" type="submit">Submit Booking Request</button>
            {bookingMessage && <p className="booking-message full">{bookingMessage}</p>}
          </form>
        </section>


        <section id="account">
          {session
            ? (session.user?.role === 'admin'
              ? <AdminDashboard token={session.token} user={session.user} onLogout={() => { localStorage.removeItem('acs_session'); setSession(null); }} />
              : <Dashboard token={session.token} user={session.user} onLogout={() => { localStorage.removeItem('acs_session'); setSession(null); }} />)
            : <AuthPanel onLogin={(data) => { localStorage.setItem('acs_session', JSON.stringify(data)); setSession(data); }} />}
        </section>

        <section id="contact" className="contact">
          <div>
            <p className="eyebrow">CONTACT US TODAY</p>
            <h2>For a cleaner, healthier space.</h2>
            <p><strong>Address:</strong> 8 Olowora, Mafoluku, Oshodi, Lagos State, Nigeria.</p>
            <p><strong>Call / WhatsApp:</strong> +234 901 184 23051</p>
            <p><strong>TikTok:</strong> @allcleaningservic76</p>
          </div>
          <div className="contact-actions">
            <a className="button primary" href="tel:+23490118423051">Call +234 901 184 23051</a>
            <a className="button secondary" href="https://wa.me/2349040237971" target="_blank" rel="noreferrer">Chat on WhatsApp</a>
          </div>
        </section>
      </main>

      <footer>
        <div>
          <strong>ALL CLEANING SERVICES</strong>
          <span>WE CLEAN, YOU RELAX</span>
        </div>
        <p>© {new Date().getFullYear()} All Cleaning Services. All rights reserved.</p>
      </footer>
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
