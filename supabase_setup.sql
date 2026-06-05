-- SQL Schema Setup for VUU Transport (Supabase PostgreSQL)
-- Copy and run this script in your Supabase SQL Editor to initialize tables!

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('passenger', 'driver', 'admin')),
    license_number TEXT,
    plate_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    ref_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    from_location TEXT NOT NULL,
    to_location TEXT NOT NULL,
    travel_date TEXT NOT NULL,
    seats INTEGER NOT NULL DEFAULT 1,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('momo', 'airtel', 'cash')),
    amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Public Access & Security Row-level policies if desired:
-- (Alternatively, you can turn off RLS on these tables in Supabase for quick prototypes)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- 4. Seed an Admin User (Password: admin123)
-- Hash generated via standard salt format. You can log in as admin with email: admin@vuu.rw
INSERT INTO users (id, name, email, phone, password_hash, role)
VALUES (
    'admin-root-uuid',
    'VUU Admin',
    'admin@vuu.rw',
    '+250 788 000 000',
    'a53fe23412cbfe0bc2:761014e7a8dedecbe546a32d1656b2fcb431718db8206d9dfd707c21f7cbedcb0a05a0d6ed15ea41aee763fbc10b2df7b036c0a006efcf5e8ba2ebcd7b0ba52a',
    'admin'
) ON CONFLICT (email) DO NOTHING;
