import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { motion } from "motion/react";
import "./styles.css";

const fallbackServices = [
  {
    id: 1,
    name: "Residential Cleaning",
    description: "Routine cleaning, deep cleaning, move-in/move-out cleaning.",
  },
  {
    id: 2,
    name: "Commercial Cleaning",
    description: "Offices, retail stores, schools, churches & more.",
  },
  {
    id: 3,
    name: "Deep Cleaning",
    description: "Detailed cleaning for a healthier, fresh-smelling space.",
  },
  {
    id: 4,
    name: "Window Cleaning",
    description: "Streak-free shine for homes & businesses.",
  },
  {
    id: 5,
    name: "Carpet & Upholstery Cleaning",
    description: "Remove dirt, stains & allergens.",
  },
  {
    id: 6,
    name: "Fumigation Services",
    description: "Effective pest control for homes, offices & facilities.",
  },
  {
    id: 7,
    name: "Post-Construction Cleaning",
    description: "We clean up, so you can move in.",
  },
];

/* -------------------------------------------------------
   REUSABLE SCROLL REVEAL
------------------------------------------------------- */

function Reveal({ children, className = "", delay = 0, y = 35 }) {
  return (
    <motion.div
      className={className}
      initial={{
        opacity: 0,
        y,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.15,
      }}
      transition={{
        duration: 0.65,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------
   ADMIN DASHBOARD
------------------------------------------------------- */

function AdminDashboard({ token, user, onLogout }) {
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");

  async function loadBookings() {
    try {
      const r = await fetch("http://localhost:4000/api/admin/bookings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await r.json();

      if (!r.ok) {
        throw new Error(data.message || "Unable to load bookings.");
      }

      setBookings(data);
    } catch (e) {
      setMessage(e.message);
    }
  }

  useEffect(() => {
    loadBookings();
  }, [token]);

  async function updateStatus(id, status) {
    try {
      const r = await fetch(`http://localhost:4000/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await r.json();

      if (!r.ok) {
        throw new Error(data.message || "Update failed.");
      }

      setBookings((current) =>
        current.map((b) => (b.id === id ? { ...b, status: data.status } : b)),
      );
    } catch (e) {
      setMessage(e.message);
    }
  }

  const visible =
    filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <section className="admin section">
      <Reveal>
        <div className="dashboard-top">
          <div>
            <p className="eyebrow">ADMIN DASHBOARD</p>
            <h2>Booking management</h2>
            <p>
              Welcome, {user.name}. Review customer requests and update their
              status.
            </p>
          </div>

          <button className="button secondary" onClick={onLogout}>
            Log out
          </button>
        </div>
      </Reveal>

      <div className="admin-stats">
        <Reveal delay={0}>
          <div>
            <strong>{bookings.length}</strong>
            <span>Total bookings</span>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div>
            <strong>
              {bookings.filter((b) => b.status === "pending").length}
            </strong>
            <span>Pending</span>
          </div>
        </Reveal>

        <Reveal delay={0.16}>
          <div>
            <strong>
              {bookings.filter((b) => b.status === "confirmed").length}
            </strong>
            <span>Confirmed</span>
          </div>
        </Reveal>

        <Reveal delay={0.24}>
          <div>
            <strong>
              {bookings.filter((b) => b.status === "completed").length}
            </strong>
            <span>Completed</span>
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.15}>
        <div className="dashboard-card">
          <div className="admin-toolbar">
            <h3>Customer bookings</h3>

            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
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
            {visible.map((b, index) => (
              <motion.article
                className="admin-booking"
                key={b.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.05,
                }}
              >
                <div className="admin-booking-main">
                  <strong>
                    #{b.id} — {b.service_name}
                  </strong>

                  <span>
                    {b.name} · {b.phone}
                  </span>

                  <span>{b.customer_email || "Guest booking"}</span>

                  <span>
                    {new Date(b.booking_date).toLocaleDateString()} ·{" "}
                    {b.service_address}
                  </span>

                  {b.details && <small>{b.details}</small>}
                </div>

                <div className="admin-booking-actions">
                  <span className={`status status-${b.status}`}>
                    {b.status.replace("_", " ")}
                  </span>

                  <select
                    value={b.status}
                    onChange={(e) => updateStatus(b.id, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* -------------------------------------------------------
   CUSTOMER DASHBOARD
------------------------------------------------------- */

function Dashboard({ token, user, onLogout }) {
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:4000/api/my-bookings", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => r.json())
      .then((data) =>
        Array.isArray(data)
          ? setBookings(data)
          : setMessage(data.message || "Unable to load bookings."),
      )
      .catch(() => setMessage("Unable to connect to the booking system."));
  }, [token]);

  return (
    <section className="dashboard section">
      <Reveal>
        <div className="dashboard-top">
          <div>
            <p className="eyebrow">CUSTOMER DASHBOARD</p>
            <h2>Welcome, {user.name}</h2>
            <p>View your cleaning service requests and their current status.</p>
          </div>

          <button className="button secondary" onClick={onLogout}>
            Log out
          </button>
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="dashboard-card">
          <h3>Your bookings</h3>

          {message && <p className="booking-message">{message}</p>}

          {!message && bookings.length === 0 && (
            <p>
              No bookings yet. <a href="#booking">Make your first booking →</a>
            </p>
          )}

          {bookings.length > 0 && (
            <div className="booking-list">
              {bookings.map((b, index) => (
                <motion.article
                  className="booking-item"
                  key={b.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.06,
                  }}
                >
                  <div>
                    <strong>{b.service_name}</strong>

                    <span>{new Date(b.booking_date).toLocaleDateString()}</span>

                    <span>{b.service_address}</span>
                  </div>

                  <span className={`status status-${b.status}`}>
                    {b.status.replace("_", " ")}
                  </span>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </Reveal>
    </section>
  );
}

/* -------------------------------------------------------
   LOGIN / REGISTER
------------------------------------------------------- */

function AuthPanel({ onLogin }) {
  const [mode, setMode] = useState("login");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  async function submit(e) {
    e.preventDefault();
    setMessage("Please wait...");

    const endpoint =
      mode === "login" ? "/api/auth/login" : "/api/auth/register";

    try {
      const r = await fetch(`http://localhost:4000${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await r.json();

      if (!r.ok) {
        throw new Error(data.message || "Request failed");
      }

      onLogin(data);
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <section className="auth section">
      <Reveal>
        <div className="auth-card">
          <p className="eyebrow">
            {mode === "login" ? "CUSTOMER LOGIN" : "CREATE ACCOUNT"}
          </p>

          <h2>
            {mode === "login"
              ? "Welcome back."
              : "Create your customer account."}
          </h2>

          <form onSubmit={submit}>
            {mode === "register" && (
              <input
                required
                placeholder="Full name"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
              />
            )}

            <input
              required
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                })
              }
            />

            {mode === "register" && (
              <input
                required
                placeholder="Phone / WhatsApp"
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value,
                  })
                }
              />
            )}

            <input
              required
              type="password"
              minLength="8"
              placeholder="Password (8+ characters)"
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value,
                })
              }
            />

            <motion.button
              className="button primary"
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {mode === "login" ? "Log in" : "Create account"}
            </motion.button>
          </form>

          {message && <p className="booking-message">{message}</p>}

          <button
            className="text-button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setMessage("");
            }}
          >
            {mode === "login"
              ? "Need an account? Register"
              : "Already have an account? Log in"}
          </button>
        </div>
      </Reveal>
    </section>
  );
}

/* -------------------------------------------------------
   BEFORE / AFTER
------------------------------------------------------- */

const beforeAfterItems = [
  {
    id: 1,
    title: "Deep Cleaning",
    description: "Kitchen cleaning and restoration.",
    before: "/assets/before-kitchen.jpg",
    after: "/assets/after-kitchen.jpg",
  },
  {
    id: 2,
    title: "Office Cleaning",
    description: "Professional workspace cleaning.",
    before: "/assets/before-office.jpg",
    after: "/assets/after-office.jpg",
  },
  {
    id: 3,
    title: "Residential Cleaning",
    description: "Fresh, clean results for your home.",
    before: "/assets/before-home.jpg",
    after: "/assets/after-home.jpg",
  },

  {
    id: 4,
    title: "Post-Construction Cleaning",
    description: "From construction dust to a clean finished space.",
    before: "/assets/before-construction.jpg",
    after: "/assets/after-construction.jpg",
  },
];

function BeforeAfter() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState(50);

  const item = beforeAfterItems[activeIndex];

  function handlePosition(e) {
    setPosition(Number(e.target.value));
  }

  return (
    <section id="before-after" className="before-after section">
      <Reveal className="section-heading">
        <p className="eyebrow">OUR RESULTS</p>

        <h2>See the difference we make.</h2>

        <p>
          Compare the space before and after our professional cleaning service.
        </p>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="before-after-wrapper">
          <div className="before-after-card">
            <div className="before-after-image">
              {/* AFTER IMAGE */}
              <img
                src={item.after}
                alt={`${item.title} after cleaning`}
                className="after-image"
              />

              {/* BEFORE IMAGE */}
              <div
                className="before-image-container"
                style={{
                  width: `${position}%`,
                }}
              >
                <img
                  src={item.before}
                  alt={`${item.title} before cleaning`}
                  className="before-image"
                />
              </div>

              {/* LABELS */}
              <span className="before-label">BEFORE</span>
              <span className="after-label">AFTER</span>

              {/* SLIDER LINE */}
              <div
                className="slider-line"
                style={{
                  left: `${position}%`,
                }}
              >
                <div className="slider-handle">↔</div>
              </div>

              {/* RANGE CONTROL */}
              <input
                className="before-after-range"
                type="range"
                min="0"
                max="100"
                value={position}
                onChange={handlePosition}
                aria-label="Compare before and after"
              />
            </div>

            <div className="before-after-info">
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>

              <div className="before-after-counter">
                {activeIndex + 1} / {beforeAfterItems.length}
              </div>
            </div>
          </div>

          {/* PROJECT SELECTOR */}
          <div className="before-after-projects">
            {beforeAfterItems.map((project, index) => (
              <button
                key={project.id}
                type="button"
                className={`before-after-project ${
                  activeIndex === index ? "active" : ""
                }`}
                onClick={() => {
                  setActiveIndex(index);
                  setPosition(50);
                }}
              >
                <span>{project.title}</span>
                <small>{project.description}</small>
              </button>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
/* -------------------------------------------------------
   REVIEWS
------------------------------------------------------- */

const defaultReviews = [
  {
    id: 1,
    name: "Hilux Hotel and Apartment Service",
    rating: 5,
    review:
      "The team did an excellent job. Everything was properly cleaned and the service was professional from start to finish.",
  },
  {
    id: 2,
    name: "Godwin Luis ",
    rating: 5,
    review:
      "Very reliable and punctual. The quality of the cleaning was excellent and the team was easy to work with.",
  },
  {
    id: 3,
    name: "Delcelsi Nursery and School",
    rating: 5,
    review:
      "I was impressed with the results. My School environment looked fresh, clean and completely different after the service.",
  },
];

function Reviews() {
  const [reviews, setReviews] = useState(() => {
    try {
      const savedReviews = localStorage.getItem("acs_reviews");

      return savedReviews ? JSON.parse(savedReviews) : defaultReviews;
    } catch {
      return defaultReviews;
    }
  });

  const [form, setForm] = useState({
    name: "",
    rating: 5,
    review: "",
  });

  const [message, setMessage] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    const name = form.name.trim();
    const reviewText = form.review.trim();

    if (!name || !reviewText) {
      setMessage("Please enter your name and review.");
      return;
    }

    if (reviewText.length < 10) {
      setMessage("Please write a little more about your experience.");
      return;
    }

    const newReview = {
      id: Date.now(),
      name,
      rating: Number(form.rating),
      review: reviewText,
    };

    const updatedReviews = [newReview, ...reviews];

    setReviews(updatedReviews);

    try {
      localStorage.setItem("acs_reviews", JSON.stringify(updatedReviews));
    } catch {
      // Continue even if localStorage is unavailable.
    }

    setForm({
      name: "",
      rating: 5,
      review: "",
    });

    setMessage("Thank you for sharing your review!");
  }

  return (
    <section id="reviews" className="reviews section">
      <Reveal className="section-heading">
        <p className="eyebrow">CUSTOMER REVIEWS</p>

        <h2>What our customers say.</h2>

        <p>
          We are committed to providing reliable service and quality cleaning
          results for every customer.
        </p>
      </Reveal>

      {/* REVIEW CARDS */}
      <div className="reviews-grid">
        {reviews.map((review, index) => (
          <motion.article
            className="review-card"
            key={review.id}
            initial={{
              opacity: 0,
              y: 35,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.15,
            }}
            transition={{
              duration: 0.55,
              delay: index * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={{
              y: -8,
            }}
          >
            <div
              className="review-stars"
              aria-label={`${review.rating} out of 5 stars`}
            >
              {"★".repeat(review.rating)}
            </div>

            <p className="review-text">"{review.review}"</p>

            <div className="review-author">
              <div className="review-avatar">
                {review.name.charAt(0).toUpperCase()}
              </div>

              <div>
                <strong>{review.name}</strong>
                <span>Customer feedback</span>
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      {/* CUSTOMER REVIEW FORM */}
      <Reveal delay={0.15}>
        <div className="review-form-card">
          <div className="section-heading">
            <p className="eyebrow">SHARE YOUR EXPERIENCE</p>

            <h3>Leave us a review.</h3>

            <p>Tell us about your experience with All Cleaning Services.</p>
          </div>

          <form className="review-form" onSubmit={handleSubmit}>
            <label>
              Your name
              <input
                type="text"
                required
                placeholder="Your name"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
              />
            </label>

            <label>
              Rating
              <select
                value={form.rating}
                onChange={(e) =>
                  setForm({
                    ...form,
                    rating: Number(e.target.value),
                  })
                }
              >
                <option value="5">★★★★★ — Excellent</option>
                <option value="4">★★★★☆ — Very good</option>
                <option value="3">★★★☆☆ — Good</option>
                <option value="2">★★☆☆☆ — Fair</option>
                <option value="1">★☆☆☆☆ — Poor</option>
              </select>
            </label>

            <label className="full">
              Your review
              <textarea
                required
                rows="5"
                placeholder="Tell us about your cleaning experience..."
                value={form.review}
                onChange={(e) =>
                  setForm({
                    ...form,
                    review: e.target.value,
                  })
                }
              />
            </label>

            <motion.button
              className="button primary full"
              type="submit"
              whileHover={{
                scale: 1.015,
                y: -2,
              }}
              whileTap={{
                scale: 0.98,
              }}
            >
              Submit Review
            </motion.button>

            {message && (
              <motion.p
                className="booking-message full"
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
              >
                {message}
              </motion.p>
            )}
          </form>
        </div>
      </Reveal>

      {/* WHATSAPP REVIEW OPTION */}
      <Reveal delay={0.2}>
        <div className="reviews-cta">
          <p>Prefer to send your feedback directly?</p>

          <a
            href="https://wa.me/2349040237971"
            target="_blank"
            rel="noreferrer"
            className="button secondary"
          >
            Send Review on WhatsApp
          </a>
        </div>
      </Reveal>
    </section>
  );
}
/* -------------------------------------------------------
   MAIN APP
------------------------------------------------------- */

function App() {
  const [services, setServices] = useState(fallbackServices);

  const [bookingMessage, setBookingMessage] = useState("");

  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("acs_session")) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    fetch("http://localhost:4000/api/services")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setServices)
      .catch(() => {});
  }, []);

  async function submitBooking(e) {
    e.preventDefault();

    setBookingMessage("Sending booking request...");

    const form = new FormData(e.currentTarget);

    const selected = services.find(
      (s) => String(s.id) === String(form.get("service")),
    );

    try {
      const response = await fetch("http://localhost:4000/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.get("name"),
          phone: form.get("phone"),
          serviceId: selected?.id,
          serviceName: selected?.name,
          date: form.get("date"),
          address: form.get("address"),
          details: form.get("details"),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Booking failed");
      }

      setBookingMessage(
        "Booking request received. We will contact you shortly.",
      );

      e.currentTarget.reset();
    } catch (error) {
      setBookingMessage(
        error.message +
          " If the site is being previewed locally, make sure the backend is running.",
      );
    }
  }

  function logout() {
    localStorage.removeItem("acs_session");
    setSession(null);
  }

  return (
    <>
      {/* -------------------------------------------------
          NAVIGATION
      ------------------------------------------------- */}

      <header className="nav">
        <a className="brand" href="#home">
          <img src="/assets/logo.jpg" alt="All Cleaning Services logo" />
        </a>

        <nav>
          <a href="#home">Home</a>
          <a href="#services">Services</a>
          <a href="#about">About</a>
          <a href="#reviews">Reviews</a>
          <a href="#booking">Booking</a>
          <a href="#contact">Contact</a>
          <a href="#account">{session ? "Dashboard" : "Customer Login"}</a>
        </nav>

        <motion.a
          className="nav-cta"
          href="tel:+2349040237971"
          whileHover={{
            scale: 1.04,
          }}
          whileTap={{
            scale: 0.97,
          }}
        >
          Call Us
        </motion.a>
      </header>

      <main>
        {/* -------------------------------------------------
            HERO
        ------------------------------------------------- */}
        <section id="home" className="hero">
          <motion.div
            className="hero-copy"
            initial={{
              opacity: 0,
              x: -45,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <p className="eyebrow">COMPLETE CLEANING & FUMIGATION SOLUTIONS</p>

            <h1>
              Clean spaces.
              <br />
              <span>Happy places.</span>
            </h1>

            <p className="lead">
              Professional cleaning and fumigation services for homes, offices
              and facilities. We clean, you relax.
            </p>

            <div className="hero-actions">
              <motion.a
                className="button primary"
                href="#booking"
                whileHover={{
                  scale: 1.05,
                  y: -2,
                }}
                whileTap={{
                  scale: 0.98,
                }}
              >
                Book a Service
              </motion.a>

              <motion.a
                className="button secondary"
                href="https://wa.me/2349040237971"
                target="_blank"
                rel="noreferrer"
                whileHover={{
                  scale: 1.05,
                  y: -2,
                }}
                whileTap={{
                  scale: 0.98,
                }}
              >
                WhatsApp Us
              </motion.a>
            </div>

            <motion.div
              className="trust-row"
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.6,
                delay: 0.5,
              }}
            >
              <span>✓ Trained Staff</span>
              <span>✓ On-Time Service</span>
              <span>✓ Quality Assured</span>
              <span>✓ Eco-Friendly Products</span>
            </motion.div>
          </motion.div>

          <motion.div
            className="hero-card"
            initial={{
              opacity: 0,
              scale: 0.92,
              x: 45,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              x: 0,
            }}
            transition={{
              duration: 0.9,
              delay: 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={{
              scale: 1.025,
              y: -5,
            }}
          >
            <img
              src="/assets/flyer.jpg"
              alt="All Cleaning Services promotional flyer"
            />
          </motion.div>
        </section>
        {/* -------------------------------------------------
            SERVICES
        ------------------------------------------------- */}
        <section id="services" className="section">
          <Reveal className="section-heading">
            <p className="eyebrow">OUR SERVICES</p>

            <h2>Professional cleaning for every space.</h2>

            <p>Choose the service that fits your home, business or facility.</p>
          </Reveal>

          <div className="service-grid">
            {services.map((service, index) => (
              <motion.article
                className="service-card"
                key={service.name}
                initial={{
                  opacity: 0,
                  y: 45,
                  scale: 0.97,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                viewport={{
                  once: true,
                  amount: 0.12,
                }}
                transition={{
                  duration: 0.55,
                  delay: index * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{
                  y: -8,
                  scale: 1.015,
                }}
              >
                <motion.div
                  className="service-icon"
                  whileHover={{
                    rotate: 8,
                    scale: 1.1,
                  }}
                >
                  {service.icon || "✓"}
                </motion.div>

                <h3>{service.name}</h3>

                <p>{service.description}</p>

                <a href="#booking">Request service →</a>
              </motion.article>
            ))}
          </div>
        </section>
        <BeforeAfter />\
        <Reviews />
        {/* -------------------------------------------------
            ABOUT
        ------------------------------------------------- */}
        <motion.section
          id="about"
          className="about"
          initial={{
            opacity: 0,
            y: 50,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.15,
          }}
          transition={{
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div>
            <p className="eyebrow">WHY ALL CLEANING SERVICES</p>

            <h2>A cleaner, healthier space starts here.</h2>

            <p>
              All Cleaning Services provides professional cleaning and
              fumigation solutions with a focus on reliable service, quality
              results and customer peace of mind.
            </p>

            <ul>
              <motion.li
                initial={{ opacity: 0, x: -15 }}
                whileInView={{
                  opacity: 1,
                  x: 0,
                }}
                viewport={{ once: true }}
              >
                Professional, trained service
              </motion.li>

              <motion.li
                initial={{ opacity: 0, x: -15 }}
                whileInView={{
                  opacity: 1,
                  x: 0,
                }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                Reliable and on-time support
              </motion.li>

              <motion.li
                initial={{ opacity: 0, x: -15 }}
                whileInView={{
                  opacity: 1,
                  x: 0,
                }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                Quality-focused cleaning
              </motion.li>

              <motion.li
                initial={{ opacity: 0, x: -15 }}
                whileInView={{
                  opacity: 1,
                  x: 0,
                }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                Safe and effective fumigation
              </motion.li>
            </ul>
          </div>

          <motion.img
            src="/assets/logo.jpg"
            alt="All Cleaning Services"
            whileHover={{
              scale: 1.03,
              rotate: 1,
            }}
            transition={{
              duration: 0.3,
            }}
          />
        </motion.section>
        {/* -------------------------------------------------
            BOOKING
        ------------------------------------------------- */}
        <section id="booking" className="booking section">
          <Reveal className="section-heading">
            <p className="eyebrow">NEW BOOKING</p>

            <h2>Tell us what you need cleaned.</h2>

            <p>
              Send your details and we’ll use them to prepare your service
              request.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <form className="booking-form" onSubmit={submitBooking}>
              <label>
                Full name
                <input name="name" required placeholder="Your name" />
              </label>

              <label>
                Phone / WhatsApp
                <input name="phone" required placeholder="+234..." />
              </label>

              <label>
                Service
                <select name="service" required defaultValue="">
                  <option value="" disabled>
                    Select a service
                  </option>

                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Preferred date
                <input name="date" required type="date" />
              </label>

              <label className="full">
                Service address
                <input
                  name="address"
                  required
                  placeholder="Where should we provide the service?"
                />
              </label>

              <label className="full">
                Additional details
                <textarea
                  name="details"
                  rows="4"
                  placeholder="Tell us anything we should know..."
                ></textarea>
              </label>

              <motion.button
                className="button primary full"
                type="submit"
                whileHover={{
                  scale: 1.015,
                  y: -2,
                }}
                whileTap={{
                  scale: 0.98,
                }}
              >
                Submit Booking Request
              </motion.button>

              {bookingMessage && (
                <motion.p
                  className="booking-message full"
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                >
                  {bookingMessage}
                </motion.p>
              )}
            </form>
          </Reveal>
        </section>
        {/* -------------------------------------------------
            ACCOUNT
        ------------------------------------------------- */}
        <section id="account">
          {session ? (
            session.user?.role === "admin" ? (
              <AdminDashboard
                token={session.token}
                user={session.user}
                onLogout={logout}
              />
            ) : (
              <Dashboard
                token={session.token}
                user={session.user}
                onLogout={logout}
              />
            )
          ) : (
            <AuthPanel
              onLogin={(data) => {
                localStorage.setItem("acs_session", JSON.stringify(data));

                setSession(data);
              }}
            />
          )}
        </section>
        {/* -------------------------------------------------
            CONTACT
        ------------------------------------------------- */}
        <motion.section
          id="contact"
          className="contact"
          initial={{
            opacity: 0,
            y: 45,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.15,
          }}
          transition={{
            duration: 0.7,
          }}
        >
          <div>
            <p className="eyebrow">CONTACT US TODAY</p>

            <h2>For a cleaner, healthier space.</h2>

            <p>
              <strong>Address:</strong> 8 Olowora, Mafoluku, Oshodi, Lagos
              State, Nigeria.
            </p>

            <p>
              <strong>Call:</strong> +2349040237971
            </p>

            <p>
              <strong>WhatsApp:</strong> 09040237971
            </p>

            <p>
              <strong>TikTok:</strong> @allcleaningservic76
            </p>
          </div>

          <div className="contact-actions">
            <motion.a
              className="button primary"
              href="tel:+2349040237971"
              whileHover={{
                scale: 1.04,
              }}
              whileTap={{
                scale: 0.98,
              }}
            >
              Call +2349040237971
            </motion.a>

            <motion.a
              className="button secondary"
              href="https://wa.me/2349040237971"
              target="_blank"
              rel="noreferrer"
              whileHover={{
                scale: 1.04,
              }}
              whileTap={{
                scale: 0.98,
              }}
            >
              Chat on WhatsApp
            </motion.a>
          </div>
        </motion.section>
      </main>
      <a
        className="floating-whatsapp"
        href="https://wa.me/2349040237971"
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with us on WhatsApp"
      >
        <span className="whatsapp-icon">☏</span>
        <span className="whatsapp-text">WhatsApp Us</span>
      </a>
      {/* -------------------------------------------------
          FOOTER
      ------------------------------------------------- */}

      <footer>
        <div>
          <strong>ALL CLEANING SERVICES</strong>
          <span>WE CLEAN, YOU RELAX</span>
        </div>

        <p>
          © {new Date().getFullYear()} All Cleaning Services. All rights
          reserved.
        </p>
      </footer>
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
