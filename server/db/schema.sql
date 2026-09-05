CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  booking_date DATE NOT NULL,
  service_address TEXT NOT NULL,
  details TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','in_progress','completed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO services (name, description) VALUES
('Residential Cleaning','Routine cleaning, deep cleaning, move-in/move-out cleaning.'),
('Commercial Cleaning','Offices, retail stores, schools, churches & more.'),
('Deep Cleaning','Detailed cleaning for a healthier, fresh-smelling space.'),
('Window Cleaning','Streak-free shine for homes & businesses.'),
('Carpet & Upholstery Cleaning','Remove dirt, stains & allergens.'),
('Fumigation Services','Effective pest control for homes, offices & facilities.'),
('Post-Construction Cleaning','We clean up, so you can move in.')
ON CONFLICT (name) DO NOTHING;
