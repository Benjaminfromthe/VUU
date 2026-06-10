import express from "express";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import Database from "better-sqlite3";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

// Load configuration
dotenv.config();

// ==========================================
// 🧠 GEMINI AI INITIALIZATION
// ==========================================
let ai: any = null;
const geminiApiKey = process.env.GEMINI_API_KEY;
if (geminiApiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("🟢 Gemini AI Client initialized successfully!");
  } catch (err) {
    console.error("🔴 Failed to initialize Gemini AI Client:", err);
  }
} else {
  console.log("🟡 GEMINI_API_KEY is not set. AI Features will operate using fallback smart simulations.");
}

// Obtain correct folder references securely
const __filename = typeof __dirname !== "undefined" ? "" : fileURLToPath(import.meta.url);
const __dirname_resolved = typeof __dirname !== "undefined" ? __dirname : path.dirname(__filename);

const app = express();
const PORT = 3000;

// Setup Middleware for standard form body entries
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 🗄️ LOCAL SQLITE DATABASE FALLBACK ENGINE
// ==========================================
const sqliteDb = new Database("vuu.db");

// Establish baseline SQLite schema so app works 100% out of the box in the preview environment
sqliteDb.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    license_number TEXT,
    plate_number TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    ref_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    from_location TEXT NOT NULL,
    to_location TEXT NOT NULL,
    travel_date TEXT NOT NULL,
    seats INTEGER NOT NULL,
    payment_method TEXT NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

// Insert default Admin user to SQLite fallback if not exists (Pass: admin123)
try {
  const adminHash = "a53fe23412cbfe0bc2:761014e7a8dedecbe546a32d1656b2fcb431718db8206d9dfd707c21f7cbedcb0a05a0d6ed15ea41aee763fbc10b2df7b036c0a006efcf5e8ba2ebcd7b0ba52a";
  sqliteDb.prepare(`
    INSERT INTO users (id, name, email, phone, password_hash, role)
    VALUES ('admin-fallback-uuid', 'Admin', 'admin@vuu.rw', '+250 788 000 000', ?, 'admin')
  `).run(adminHash);
} catch (e) {
  // admin already exists or insert error
}

// ==========================================
// ☁️ SUPABASE CLOUD DATABASE CONNECTION
// ==========================================
let supabase: any = null;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const isSupabaseConfigured = supabaseUrl && 
                             !supabaseUrl.includes("your-project-id") && 
                             supabaseKey && 
                             !supabaseKey.includes("your-anon-key");

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl!, supabaseKey!);
    console.log("🟢 Connected successfully to Supabase Database!");
  } catch (err) {
    console.error("🔴 Failed to initialize Supabase client:", err);
  }
} else {
  console.log("🟡 Supabase credentials not set or using placeholder defaults. Utilizing Better-SQLite3 local database failover (100% active persistence)!");
}

// ==========================================
// 🛡️ PASSWORDS CRYPTOGRAPHIC SALT & HASH
// ==========================================
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, originalHash] = stored.split(":");
    if (!salt || !originalHash) return false;
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return hash === originalHash;
  } catch (e) {
    return false;
  }
}

// ==========================================
// 🚌 SYSTEM ROUTE MAPPING AND TICKETING
// ==========================================
const routePrices: Record<string, number> = {
  'musanze': 2500,
  'huye': 2000,
  'rubavu': 3000,
  'nyagatare': 2500,
  'rwamagana': 1000,
  'muhanga': 1500
};

function getTicketPrice(destination: string, seats: number): number {
  const toLower = destination.toLowerCase();
  let basePrice = 2500; // default fallback route tariff
  
  if (toLower.includes("musanze")) basePrice = 2500;
  else if (toLower.includes("huye")) basePrice = 2000;
  else if (toLower.includes("rubavu")) basePrice = 3000;
  else if (toLower.includes("nyagatare")) basePrice = 2500;
  else if (toLower.includes("rwamagana")) basePrice = 1000;
  else if (toLower.includes("muhanga")) basePrice = 1500;
  
  return basePrice * Number(seats || 1);
}

function normalizeDepartureDateTime(dateTimeStr: string): string {
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) {
      return dateTimeStr;
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    let hour = d.getHours();
    
    // Nearest scheduled slot: 08:00, 11:00, 14:00, 17:00
    let slot = "08:00";
    if (hour >= 16) {
      slot = "17:00";
    } else if (hour >= 13) {
      slot = "14:00";
    } else if (hour >= 10) {
      slot = "11:00";
    } else {
      slot = "08:00";
    }
    
    return `${year}-${month}-${day}T${slot}`;
  } catch (e) {
    return dateTimeStr;
  }
}

function getNextDepartureSlot(dateTimeStr: string): string {
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) {
      return dateTimeStr;
    }
    const hour = d.getHours();
    let nextDate = new Date(d.getTime());
    let nextSlot = "08:00";
    
    if (hour < 10) {
      nextSlot = "11:00";
    } else if (hour < 13) {
      nextSlot = "14:00";
    } else if (hour < 16) {
      nextSlot = "17:00";
    } else {
      nextDate = new Date(d.getTime() + 24 * 60 * 60 * 1000);
      nextSlot = "08:00";
    }
    
    const year = nextDate.getFullYear();
    const month = String(nextDate.getMonth() + 1).padStart(2, "0");
    const day = String(nextDate.getDate()).padStart(2, "0");
    
    return `${year}-${month}-${day}T${nextSlot}`;
  } catch (e) {
    return dateTimeStr;
  }
}

async function getBookedSeatsCount(from: string, to: string, normalizedDateStr: string): Promise<number> {
  let count = 0;
  
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('seats')
        .eq('from_location', from)
        .eq('to_location', to)
        .eq('travel_date', normalizedDateStr)
        .neq('status', 'declined');
      
      if (data && !error) {
        count = data.reduce((sum: number, b: any) => sum + Number(b.seats || 0), 0);
        return count;
      }
    } catch (e) {
      console.error("Error checking seats count on Supabase:", e);
    }
  }
  
  try {
    const row = sqliteDb.prepare(`
      SELECT SUM(seats) as total 
      FROM bookings 
      WHERE from_location = ? 
        AND to_location = ? 
        AND travel_date = ? 
        AND status != 'declined'
    `).get(from, to, normalizedDateStr) as any;
    
    if (row && row.total) {
      count = Number(row.total);
    }
  } catch (sqliteErr) {
    console.error("Error checking seats count on SQLite:", sqliteErr);
  }
  
  return count;
}

async function findNextAvailableSlot(from: string, to: string, currentNormalizedSlot: string, requestedSeats: number): Promise<string> {
  let attemptSlot = currentNormalizedSlot;
  for (let i = 0; i < 6; i++) {
    attemptSlot = getNextDepartureSlot(attemptSlot);
    const seatsBooked = await getBookedSeatsCount(from, to, attemptSlot);
    if (seatsBooked + requestedSeats <= 30) {
      return attemptSlot;
    }
  }
  return attemptSlot;
}

// ==========================================
// 📲 AFRICA'S TALKING SMS NOTIFICATIONS SERVICE
// ==========================================
async function sendAfricaTalkingSms(to: string, message: string): Promise<any> {
  const username = process.env.AT_USERNAME || "sandbox";
  const apiKey = process.env.AT_API_KEY;
  const senderId = process.env.AT_SENDER_ID;

  if (!apiKey || apiKey.trim() === "" || apiKey.includes("placeholder")) {
    console.log("------------------------------------------------------------");
    console.log(`[SMS NOTIFICATION SIMULATOR (Missing AT_API_KEY)]`);
    console.log(`Recipient: ${to}`);
    console.log(`Message Content:\n${message}`);
    console.log("------------------------------------------------------------");
    return { status: "simulated", reason: "Disabled due to missing AT_API_KEY environment variable" };
  }

  // Sanitize and format phone number for international Rwanda standards (+250)
  let formattedPhone = to.trim().replace(/\s+/g, "");
  if (formattedPhone.startsWith("07")) {
    formattedPhone = "+250" + formattedPhone.substring(1);
  } else if (!formattedPhone.startsWith("+")) {
    formattedPhone = "+" + formattedPhone;
  }

  const isSandbox = username.toLowerCase() === "sandbox";
  const url = isSandbox
    ? "https://api.sandbox.africastalking.com/version1/messaging"
    : "https://api.africastalking.com/version1/messaging";

  const bodyParams = new URLSearchParams();
  bodyParams.append("username", username);
  bodyParams.append("to", formattedPhone);
  bodyParams.append("message", message);
  if (senderId && !isSandbox) {
    bodyParams.append("from", senderId);
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "apiKey": apiKey
      },
      body: bodyParams.toString()
    });

    const data = await response.json();
    console.log(`[Africa's Talking SMS API Response] sent to ${formattedPhone}:`, JSON.stringify(data));
    return data;
  } catch (err: any) {
    console.error(`🔴 Africa's Talking SMS API transmission failed to ${formattedPhone}:`, err);
    return { status: "error", message: err.message };
  }
}

// ==========================================
// 🌐 REST API ENDPOINTS
// ==========================================

// 1. Post Passenger Account Registration
app.post("/api/register/passenger", async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password) {
    return res.redirect("/register.html?error=failed");
  }

  const password_hash = hashPassword(password);
  let userId = crypto.randomUUID();

  // Try signing up with Supabase Auth & saving to Supabase DB if available
  if (supabase) {
    try {
      // Check if user already exists in db
      const { data: existing } = await supabase.from('users').select('email').eq('email', email).maybeSingle();
      if (existing) {
        return res.redirect("/register.html?error=exists");
      }

      // Try authentic Supabase Auth signUp
      console.log(`Setting up Supabase Auth credentials for passenger: ${email}`);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
            role: "passenger"
          }
        }
      });

      if (authError) {
        console.warn("Supabase Auth signUp returned error or status:", authError.message);
        if (authError.message.includes("already registered") || authError.message.includes("exists")) {
          return res.redirect("/register.html?error=exists");
        }
      }

      // Use Auth user's actual UUID so relational binds are valid
      if (authData?.user) {
        userId = authData.user.id;
      }

      const { error } = await supabase.from('users').insert([{
        id: userId,
        name,
        email,
        phone,
        password_hash,
        role: "passenger"
      }]);

      if (!error) {
        // Echo into local SQLite as cache mirror
        try {
          sqliteDb.prepare("INSERT INTO users (id, name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?, 'passenger')")
            .run(userId, name, email, phone, password_hash);
        } catch (sqliteErr) {}
        
        return res.redirect("/login.html?registered=true");
      } else {
        console.error("Supabase user insert error:", error);
      }
    } catch (supabaseErr) {
      console.error("Supabase error during registration, routing fallback:", supabaseErr);
    }
  }

  // Backup or standard local SQLite insert
  try {
    const existing = sqliteDb.prepare("SELECT email FROM users WHERE email = ?").get(email);
    if (existing) {
      return res.redirect("/register.html?error=exists");
    }

    sqliteDb.prepare("INSERT INTO users (id, name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?, 'passenger')")
      .run(userId, name, email, phone, password_hash);
    
    return res.redirect("/login.html?registered=true");
  } catch (sqliteErr) {
    console.error("SQLite user registration error:", sqliteErr);
    return res.redirect("/register.html?error=failed");
  }
});

// 2. Post Driver Account Registration
app.post("/api/register/driver", async (req, res) => {
  const { name, email, phone, license_number, plate_number, password } = req.body;
  if (!name || !email || !phone || !license_number || !plate_number || !password) {
    return res.redirect("/register.html?error=failed");
  }

  const password_hash = hashPassword(password);
  let userId = crypto.randomUUID();

  // Try saving to Supabase first if available
  if (supabase) {
    try {
      // Check if driver exists first in db
      const { data: existing } = await supabase.from('users').select('email').eq('email', email).maybeSingle();
      if (existing) {
        return res.redirect("/register.html?error=exists");
      }

      // Try authentic Supabase Auth signUp
      console.log(`Setting up Supabase Auth credentials for driver: ${email}`);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
            role: "driver",
            license_number,
            plate_number
          }
        }
      });

      if (authError) {
        console.warn("Supabase Auth signUp for driver returned status:", authError.message);
        if (authError.message.includes("already registered") || authError.message.includes("exists")) {
          return res.redirect("/register.html?error=exists");
        }
      }

      // Sync custom UUID with auth payload
      if (authData?.user) {
        userId = authData.user.id;
      }

      const { error } = await supabase.from('users').insert([{
        id: userId,
        name,
        email,
        phone,
        password_hash,
        role: "driver",
        license_number,
        plate_number
      }]);

      if (!error) {
        // Echo into local SQLite cache mirror
        try {
          sqliteDb.prepare("INSERT INTO users (id, name, email, phone, password_hash, role, license_number, plate_number) VALUES (?, ?, ?, ?, ?, 'driver', ?, ?)")
            .run(userId, name, email, phone, password_hash, license_number, plate_number);
        } catch (sqliteErr) {}

        return res.redirect("/login.html?registered=true");
      } else {
        console.error("Supabase driver insert error:", error);
      }
    } catch (supabaseErr) {
      console.error("Supabase error during driver registration, routing fallback:", supabaseErr);
    }
  }

  // Backup or standard local SQLite insert
  try {
    const existing = sqliteDb.prepare("SELECT email FROM users WHERE email = ?").get(email);
    if (existing) {
      return res.redirect("/register.html?error=exists");
    }

    sqliteDb.prepare("INSERT INTO users (id, name, email, phone, password_hash, role, license_number, plate_number) VALUES (?, ?, ?, ?, ?, 'driver', ?, ?)")
      .run(userId, name, email, phone, password_hash, license_number, plate_number);
    
    return res.redirect("/login.html?registered=true");
  } catch (sqliteErr) {
    console.error("SQLite driver registration error:", sqliteErr);
    return res.redirect("/register.html?error=failed");
  }
});

// 3. Post Account Login verification
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.redirect("/login.html?error=invalid");
  }

  let userRecord: any = null;
  let authSuccess = false;

  // 1. Try secure authentic Supabase Auth Login flow first
  if (supabase) {
    try {
      console.log(`Attempting Supabase Auth sign-in for: ${email}`);
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (!authError && authData?.user) {
        console.log(`🟢 Supabase Auth check successful for ${email}`);
        
        // Load custom database columns (like role, phone, and metrics) from users profiles
        let { data: profile } = await supabase.from('users').select('*').eq('id', authData.user.id).maybeSingle();
        if (!profile) {
          // Robust email fallback matching
          const { data: fallbackProfile } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
          profile = fallbackProfile;
        }

        userRecord = profile || {
          id: authData.user.id,
          name: authData.user.user_metadata?.name || email.split("@")[0],
          email: authData.user.email,
          phone: authData.user.user_metadata?.phone || "",
          role: authData.user.user_metadata?.role || "passenger",
          license_number: authData.user.user_metadata?.license_number,
          plate_number: authData.user.user_metadata?.plate_number
        };

        authSuccess = true;
      } else {
        console.warn(`Supabase Auth sign-in non-successful: ${authError?.message}`);
        // If email not verified is the issue or if something is pending, we allow DB credential parsing as safety backup
      }
    } catch (e) {
      console.error("Supabase Auth sign-in exception:", e);
    }
  }

  // 2. Perform database fallback credentials validation if needed
  if (!authSuccess) {
    // DB profile check in Supabase profiles table
    if (supabase) {
      try {
        const { data, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
        if (data && !error && verifyPassword(password, data.password_hash)) {
          userRecord = data;
          authSuccess = true;
          console.log("🟢 Authenticated user profile via custom password hash matching in Supabase users table.");
        }
      } catch (err) {
        console.error("Supabase profiles custom validation error:", err);
      }
    }

    // SQLite backup check
    if (!authSuccess) {
      try {
        const localUser = sqliteDb.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
        if (localUser && verifyPassword(password, localUser.password_hash)) {
          userRecord = localUser;
          authSuccess = true;
          console.log("🟢 Authenticated user via SQLite local DB password hash matching.");
        }
      } catch (sqliteErr) {
        console.error("SQLite local login query error:", sqliteErr);
      }
    }
  }

  if (authSuccess && userRecord) {
    const role = userRecord.role || "passenger";
    const name = userRecord.name || email.split("@")[0];
    const phone = userRecord.phone || "";

    // After login, redirect passengers to their dashboard, drivers to their driver dashboard, and admins to admin.html
    let destination = "/passenger-dashboard.html";
    if (role === 'driver') {
      destination = "/driver-dashboard.html";
    } else if (role === 'admin') {
      destination = "/admin.html";
    }

    return res.redirect(`${destination}?loggedIn=true&name=${encodeURIComponent(name)}&email=${encodeURIComponent(userRecord.email)}&role=${role}&phone=${encodeURIComponent(phone)}`);
  }

  return res.redirect("/login.html?error=invalid");
});

// 4. Submit New Booking Reservation
app.post("/api/book", async (req, res) => {
  const { name, phone, from, to, date, seats, payment } = req.body;
  if (!name || !phone || !from || !to || !date || !seats || !payment) {
    return res.redirect("/book.html?error=missing_fields");
  }

  const normalizedDate = normalizeDepartureDateTime(date);
  const seatsRequested = Number(seats || 1);

  // Check seat limit: Each route departure has a maximum of 30 seats
  const bookedSeats = await getBookedSeatsCount(from, to, normalizedDate);
  if (bookedSeats + seatsRequested > 30) {
    const nextSlot = await findNextAvailableSlot(from, to, normalizedDate, seatsRequested);
    return res.redirect(`/book.html?error=full&nextSlot=${encodeURIComponent(nextSlot)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&originalDate=${encodeURIComponent(date)}&seats=${seatsRequested}`);
  }

  // Generate reference number: like #VUU-2047
  const reference = `VUU-${Math.floor(1000 + Math.random() * 9000)}`;
  const amount = getTicketPrice(to, seatsRequested);
  const bookingId = crypto.randomUUID();

  // Try inserting into Supabase
  if (supabase) {
    try {
      const { error } = await supabase.from('bookings').insert([{
        id: bookingId,
        ref_number: reference,
        name,
        phone,
        from_location: from,
        to_location: to,
        travel_date: normalizedDate,
        seats: seatsRequested,
        payment_method: payment,
        amount,
        status: "pending"
      }]);

      if (!error) {
        // Cache mirror on Local DB
        try {
          sqliteDb.prepare(`
            INSERT INTO bookings (id, ref_number, name, phone, from_location, to_location, travel_date, seats, payment_method, amount, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
          `).run(bookingId, reference, name, phone, from, to, normalizedDate, seatsRequested, payment, amount);
        } catch (mirrorErr) {}

        return res.redirect(`/confirmation.html?ref=${reference}&name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(normalizedDate)}&seats=${seatsRequested}&payment=${payment}&price=${amount}`);
      } else {
        console.error("Supabase booking creation error:", error);
      }
    } catch (supabaseErr) {
      console.error("Supabase error during booking, utilizing local database failover:", supabaseErr);
    }
  }

  // SQLite fallback booking reservation
  try {
    sqliteDb.prepare(`
      INSERT INTO bookings (id, ref_number, name, phone, from_location, to_location, travel_date, seats, payment_method, amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(bookingId, reference, name, phone, from, to, normalizedDate, seatsRequested, payment, amount);

    return res.redirect(`/confirmation.html?ref=${reference}&name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(normalizedDate)}&seats=${seatsRequested}&payment=${payment}&price=${amount}`);
  } catch (sqliteErr) {
    console.error("SQLite booking insert error:", sqliteErr);
    return res.redirect("/book.html?error=booking_failed");
  }
});

// 5. Get List of Bookings
app.get("/api/bookings", async (req, res) => {
  let bookings: any[] = [];

  if (supabase) {
    try {
      const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
      if (data && !error) {
        bookings = data;
      }
    } catch (e) {
      console.error("Supabase fetching bookings error:", e);
    }
  }

  // Fallback to SQLite if empty or offline
  if (bookings.length === 0) {
    try {
      bookings = sqliteDb.prepare("SELECT * FROM bookings ORDER BY created_at DESC").all();
    } catch (sqliteErr) {
      console.error("SQLite bookings fetching error:", sqliteErr);
    }
  }

  res.json({ status: "success", bookings });
});

// 6. Get List of Drivers
app.get("/api/drivers", async (req, res) => {
  let drivers: any[] = [];

  if (supabase) {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('role', 'driver');
      if (data && !error) {
        drivers = data;
      }
    } catch (e) {
      console.error("Supabase fetching drivers error:", e);
    }
  }

  if (drivers.length === 0) {
    try {
      drivers = sqliteDb.prepare("SELECT * FROM users WHERE role = 'driver'").all();
    } catch (sqliteErr) {
      console.error("SQLite drivers fetching error:", sqliteErr);
    }
  }

  res.json({ status: "success", drivers });
});

// 7. Update status of any individual booking
app.post("/api/bookings/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!id || !status) {
    return res.status(400).json({ status: "error", message: "Missing required fields" });
  }

  let updated = false;

  if (supabase) {
    try {
      const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
      if (!error) {
        // Sync local SQLite mirror status immediately
        try {
          sqliteDb.prepare("UPDATE bookings SET status = ? WHERE id = ?").run(status, id);
        } catch (sqliteError) {}
        updated = true;
      } else {
        console.error("Supabase booking status update error:", error);
      }
    } catch (supabaseErr) {
      console.error("Supabase status update error:", supabaseErr);
    }
  }

  if (!updated) {
    try {
      const result = sqliteDb.prepare("UPDATE bookings SET status = ? WHERE id = ?").run(status, id);
      if (result.changes > 0) {
        updated = true;
      }
    } catch (sqliteErr) {
      console.error("SQLite booking status update error:", sqliteErr);
    }
  }

  if (updated) {
    // If the booking is accepted, send the automated SMS alerts
    if (status === 'accepted') {
      try {
        let bookingRecord: any = null;
        if (supabase) {
          const { data } = await supabase.from('bookings').select('*').eq('id', id).maybeSingle();
          if (data) bookingRecord = data;
        }
        if (!bookingRecord) {
          bookingRecord = sqliteDb.prepare("SELECT * FROM bookings WHERE id = ?").get(id);
        }

        if (bookingRecord) {
          const { driverName, plateNumber, driverPhone } = req.body;
          const dName = driverName || "Jean Kagorora";
          const pNum = plateNumber || "RAB 456D";

          let formattedDate = bookingRecord.travel_date;
          let formattedTime = "";
          try {
            const tDate = new Date(bookingRecord.travel_date);
            if (!isNaN(tDate.getTime())) {
              formattedDate = tDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              formattedTime = tDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
            }
          } catch (e) {}

          const passengerMsg = `📡 VUU Transport Rwanda:\nYour booking is CONFIRMED!\nRef: ${bookingRecord.ref_number || 'VUU-RIDE'}\nRoute: ${bookingRecord.from_location} ➔ ${bookingRecord.to_location}\nDate: ${formattedDate}${formattedTime ? ' at ' + formattedTime : ''}\nDriver: ${dName} (Plate: ${pNum})\nPickup: ${bookingRecord.from_location} Bus Station.\nThank you!`;

          const driverMsg = `⚡ VUU Transport Dispatch:\nYou've accepted trip to ${bookingRecord.to_location}.\nPassenger: ${bookingRecord.name} (${bookingRecord.phone})\nPickup: ${bookingRecord.from_location} Bus Station.\nDrive safe!`;

          // Send passenger SMS
          sendAfricaTalkingSms(bookingRecord.phone, passengerMsg).catch(err => {
            console.error("Passenger automated SMS promise failure:", err);
          });

          // Send driver SMS
          const finalDriverPhone = driverPhone || "+250788000000"; // Default driver desk fallback
          sendAfricaTalkingSms(finalDriverPhone, driverMsg).catch(err => {
            console.error("Driver automated SMS promise failure:", err);
          });
        }
      } catch (smsErr) {
        console.error("Error planning SMS sending triggers:", smsErr);
      }
    }

    return res.json({ status: "success", message: `Booking status updated to ${status}` });
  } else {
    return res.status(404).json({ status: "error", message: "Booking record reference not found" });
  }
});

// 8. Admin Statistics API endpoint
app.get("/api/admin/stats", async (req, res) => {
  let stats = {
    bookingsCount: 0,
    totalRevenue: 0,
    driversCount: 0
  };

  try {
    // Sum from DB structures
    let bookingsList: any[] = [];
    let driversList: any[] = [];

    if (supabase) {
      try {
        const { data: bData } = await supabase.from('bookings').select('*');
        const { data: dData } = await supabase.from('users').select('*').eq('role', 'driver');
        if (bData) bookingsList = bData;
        if (dData) driversList = dData;
      } catch (e) {
        console.error("Supabase statistics compute error:", e);
      }
    }

    if (bookingsList.length === 0 && driversList.length === 0) {
      bookingsList = sqliteDb.prepare("SELECT * FROM bookings").all();
      driversList = sqliteDb.prepare("SELECT * FROM users WHERE role = 'driver'").all();
    }

    stats.bookingsCount = bookingsList.length;
    stats.driversCount = driversList.length;
    stats.totalRevenue = bookingsList
      .filter(b => b.status === 'completed' || b.status === 'accepted')
      .reduce((sum, b) => sum + Number(b.amount || 0), 0);

  } catch (err) {
    console.error("API Stats error:", err);
  }

  res.json(stats);
});

// ==========================================
// 💸 REAL & SIMULATED MTN MOMO PAYMENTS
// ==========================================
const momoTransactions: Record<string, any> = {};
let momoApiUserCache = "";
let momoApiKeyCache = "";
let momoTokenCache = { token: "", expires: 0 };

async function getMomoApiCredentials(subKey: string): Promise<{ apiUser: string, apiKey: string }> {
  try {
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS momo_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  } catch (e) {
    console.error("momo_config table setup failed:", e);
  }

  if (momoApiUserCache && momoApiKeyCache) {
    return { apiUser: momoApiUserCache, apiKey: momoApiKeyCache };
  }

  try {
    const userRow = sqliteDb.prepare("SELECT value FROM momo_config WHERE key = 'api_user'").get() as any;
    const keyRow = sqliteDb.prepare("SELECT value FROM momo_config WHERE key = 'api_key'").get() as any;
    if (userRow && keyRow) {
      momoApiUserCache = userRow.value;
      momoApiKeyCache = keyRow.value;
      return { apiUser: momoApiUserCache, apiKey: momoApiKeyCache };
    }
  } catch (e) {
    console.error("Failed standard load of cached momo keys:", e);
  }

  const apiUser = crypto.randomUUID();
  console.log(`[MTN MoMo Sandbox] Auto-Provisioning Sandbox API User: ${apiUser}`);

  const userRes = await fetch("https://sandbox.momodeveloper.mtn.com/v1_0/apiuser", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Reference-Id": apiUser,
      "Ocp-Apim-Subscription-Key": subKey
    },
    body: JSON.stringify({ providerCallbackHost: "https://vuu.rw/momo-callback" })
  });

  if (!userRes.ok && userRes.status !== 201) {
    throw new Error(`Failed to create API user: ${userRes.statusText} (${userRes.status})`);
  }

  const keyRes = await fetch(`https://sandbox.momodeveloper.mtn.com/v1_0/apiuser/${apiUser}/apikey`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": subKey,
      "Content-Length": "0"
    }
  });

  if (!keyRes.ok) {
    throw new Error(`Failed to retrieve API key: ${keyRes.statusText} (${keyRes.status})`);
  }

  const keyData = await keyRes.json() as any;
  const apiKey = keyData.apiKey;

  try {
    sqliteDb.prepare("INSERT OR REPLACE INTO momo_config (key, value) VALUES ('api_user', ?)").run(apiUser);
    sqliteDb.prepare("INSERT OR REPLACE INTO momo_config (key, value) VALUES ('api_key', ?)").run(apiKey);
  } catch (e) {
    console.error("Failed saving new keys cache to SQLite:", e);
  }

  momoApiUserCache = apiUser;
  momoApiKeyCache = apiKey;

  return { apiUser, apiKey };
}

async function getMomoAccessToken(subKey: string): Promise<string> {
  const now = Date.now();
  if (momoTokenCache.token && momoTokenCache.expires > now) {
    return momoTokenCache.token;
  }

  const { apiUser, apiKey } = await getMomoApiCredentials(subKey);
  const basicAuth = Buffer.from(`${apiUser}:${apiKey}`).toString("base64");

  const res = await fetch("https://sandbox.momodeveloper.mtn.com/collection/token/", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basicAuth}`,
      "Ocp-Apim-Subscription-Key": subKey
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to retrieve OAuth token: ${res.statusText}`);
  }

  const data = await res.json() as any;
  momoTokenCache = {
    token: data.access_token,
    expires: Date.now() + (data.expires_in - 30) * 1000
  };

  return data.access_token;
}

// MoMo 1. Initiate request-to-pay
app.post("/api/momo/initiate", async (req, res) => {
  const { name, phone, from, to, date, seats, amount, momoPhone } = req.body;
  
  if (!name || !phone || !from || !to || !date || !seats || !amount || !momoPhone) {
    return res.status(400).json({ status: "error", message: "Missing required booking details" });
  }

  const normalizedDate = normalizeDepartureDateTime(date);
  const seatsRequested = Number(seats || 1);

  // Seat availability verification
  const bookedSeats = await getBookedSeatsCount(from, to, normalizedDate);
  if (bookedSeats + seatsRequested > 30) {
    return res.status(400).json({ status: "error", message: "Bus departure full" });
  }

  const reference = `VUU-${Math.floor(1000 + Math.random() * 9000)}`;
  const bookingId = crypto.randomUUID();
  const txId = crypto.randomUUID();

  // Create booking in 'pending_payment' state
  if (supabase) {
    try {
      await supabase.from('bookings').insert([{
        id: bookingId,
        ref_number: reference,
        name,
        phone,
        from_location: from,
        to_location: to,
        travel_date: normalizedDate,
        seats: seatsRequested,
        payment_method: 'momo',
        amount,
        status: "pending_payment"
      }]);
    } catch (e) {
      console.error("Supabase booking insert during MoMo failed:", e);
    }
  }

  try {
    sqliteDb.prepare(`
      INSERT INTO bookings (id, ref_number, name, phone, from_location, to_location, travel_date, seats, payment_method, amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_payment')
    `).run(bookingId, reference, name, phone, from, to, normalizedDate, seatsRequested, 'momo', amount);
  } catch (e) {
    console.error("SQLite booking insert during MoMo failed:", e);
  }

  const subKey = process.env.MTN_MOMO_PRIMARY_KEY;
  let useRealApi = false;
  let apiErrorMessage = "";

  if (subKey && subKey !== "" && !subKey.startsWith("YOUR_")) {
    try {
      const token = await getMomoAccessToken(subKey);
      
      const payload = {
        amount: String(amount),
        currency: "EUR",
        externalId: reference,
        payer: {
          partyIdType: "MSISDN",
          partyId: momoPhone.replace(/[^0-9]/g, "")
        },
        payerMessage: `VUU Ticket Reservation ${reference}`,
        payeeNote: "VUU Payments Collection"
      };

      const payRes = await fetch("https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay", {
        method: "POST",
        headers: {
          "X-Reference-Id": txId,
          "X-Target-Environment": "sandbox",
          "Ocp-Apim-Subscription-Key": subKey,
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (payRes.status === 202 || payRes.ok) {
        useRealApi = true;
        console.log(`[MTN MoMo Sandbox] RequestToPay triggered successfully for Tx ID: ${txId}`);
      } else {
        const errText = await payRes.text();
        console.warn(`[MTN MoMo Sandbox] RequestToPay API response rejected: ${payRes.status} - ${errText}`);
        apiErrorMessage = `API Response: ${payRes.status} ${errText}`;
      }
    } catch (apiErr: any) {
      console.error("[MTN MoMo Sandbox] Sandboxed RequestToPay fetch failed:", apiErr);
      apiErrorMessage = apiErr.message;
    }
  }

  momoTransactions[txId] = {
    bookingId,
    reference,
    name,
    phone,
    from,
    to,
    date: normalizedDate,
    seats: seatsRequested,
    amount,
    momoPhone,
    status: "PENDING",
    useRealApi,
    createdAt: Date.now()
  };

  res.json({
    status: "PENDING",
    txId,
    reference,
    amount,
    phone: momoPhone,
    useRealApi,
    apiErrorMessage
  });
});

// MoMo 2. Poll transaction payment status
app.get("/api/momo/status/:txId", async (req, res) => {
  const { txId } = req.params;
  const tx = momoTransactions[txId];

  if (!tx) {
    return res.status(404).json({ status: "error", message: "Transaction context not found" });
  }

  if (tx.useRealApi && tx.status === "PENDING") {
    const subKey = process.env.MTN_MOMO_PRIMARY_KEY;
    if (subKey) {
      try {
        const token = await getMomoAccessToken(subKey);
        const url = `https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay/${txId}`;
        const checkRes = await fetch(url, {
          method: "GET",
          headers: {
            "X-Target-Environment": "sandbox",
            "Ocp-Apim-Subscription-Key": subKey,
            "Authorization": `Bearer ${token}`
          }
        });

        if (checkRes.ok) {
          const checkData = await checkRes.json() as any;
          console.log(`[MTN MoMo Sandbox] Status poll check response for ${txId}:`, checkData.status);
          
          if (checkData.status === "SUCCESSFUL") {
            tx.status = "SUCCESSFUL";
            
            // Upgrade booking status to default 'pending' (signaling ready for allocation)
            if (supabase) {
              await supabase.from("bookings").update({ status: "pending" }).eq("id", tx.bookingId);
            }
            sqliteDb.prepare("UPDATE bookings SET status = 'pending' WHERE id = ?").run(tx.bookingId);
          } else if (checkData.status === "FAILED") {
            tx.status = "FAILED";
            
            if (supabase) {
              await supabase.from("bookings").update({ status: "declined" }).eq("id", tx.bookingId);
            }
            sqliteDb.prepare("UPDATE bookings SET status = 'declined' WHERE id = ?").run(tx.bookingId);
          }
        }
      } catch (err) {
        console.error(`[MTN MoMo Sandbox] real-time status poll error for Tx: ${txId}`, err);
      }
    }
  }

  res.json({
    status: tx.status,
    booking: {
      ref_number: tx.reference,
      name: tx.name,
      from_location: tx.from,
      to_location: tx.to,
      travel_date: tx.date,
      seats: tx.seats,
      amount: tx.amount,
      payment_method: 'momo',
      phone: tx.phone
    }
  });
});

// MoMo 3. Action simulation (Handset Simulator approve/decline trigger)
app.post("/api/momo/simulate-action", async (req, res) => {
  const { txId, action } = req.body;
  const tx = momoTransactions[txId];

  if (!tx) {
    return res.status(404).json({ status: "error", message: "Transaction context not found" });
  }

  if (action === "approve") {
    tx.status = "SUCCESSFUL";
    
    if (supabase) {
      try {
        await supabase.from("bookings").update({ status: "pending" }).eq("id", tx.bookingId);
      } catch (e) {
        console.error("Supabase booking confirm during simulated approve failed:", e);
      }
    }
    try {
      sqliteDb.prepare("UPDATE bookings SET status = 'pending' WHERE id = ?").run(tx.bookingId);
    } catch (e) {
      console.error("SQLite booking confirm during simulated approve failed:", e);
    }
    
    console.log(`[MTN MoMo Sandbox] Simulated visual APPROVE processed for Tx: ${txId}`);
    return res.json({ status: "SUCCESSFUL" });
  } else {
    tx.status = "FAILED";
    
    if (supabase) {
      try {
        await supabase.from("bookings").update({ status: "declined" }).eq("id", tx.bookingId);
      } catch (e) {
        console.error("Supabase booking decline during simulated decline failed:", e);
      }
    }
    try {
      sqliteDb.prepare("UPDATE bookings SET status = 'declined' WHERE id = ?").run(tx.bookingId);
    } catch (e) {
      console.error("SQLite booking decline during simulated decline failed:", e);
    }

    console.log(`[MTN MoMo Sandbox] Simulated visual DECLINE processed for Tx: ${txId}`);
    return res.json({ status: "FAILED" });
  }
});

// 8.5 Get Google Maps Key Configuration
app.get("/api/maps-config", (req, res) => {
  res.json({
    apiKey: process.env.GOOGLE_MAPS_PLATFORM_KEY || ""
  });
});

// 9. Get Seats Availability for departure query
app.get("/api/seats-availability", async (req, res) => {
  const { from, to, date } = req.query;
  if (!from || !to || !date) {
    return res.status(400).json({ status: "error", message: "Missing required parameters" });
  }

  const rawDate = String(date);
  const normalizedDate = normalizeDepartureDateTime(rawDate);
  const booked = await getBookedSeatsCount(String(from), String(to), normalizedDate);
  const maxSeats = 30;
  const left = Math.max(0, maxSeats - booked);
  const isFull = left <= 0;
  
  // Predict next available slot if currently full
  let nextAvailableSlot = "";
  if (isFull) {
    nextAvailableSlot = await findNextAvailableSlot(String(from), String(to), normalizedDate, 1);
  } else {
    nextAvailableSlot = getNextDepartureSlot(normalizedDate);
  }

  res.json({
    status: "success",
    booked,
    max: maxSeats,
    left,
    normalizedDate,
    isFull,
    nextAvailableSlot
  });
});

// 10. Get all upcoming departures for schedule board
app.get("/api/upcoming-departures", async (req, res) => {
  // Current simulated local date is June 5th, 2026.
  const today = new Date("2026-06-05");
  const tomorrow = new Date("2026-06-06");

  const datesList = [today, tomorrow];
  const slots = ["08:00", "11:00", "14:00", "17:00"];
  const routes = [
    { from: "Kigali", to: "Musanze", est: "3 hrs", price: 2500 },
    { from: "Kigali", to: "Huye", est: "2.5 hrs", price: 2000 },
    { from: "Kigali", to: "Rubavu", est: "3.5 hrs", price: 3000 },
    { from: "Kigali", to: "Nyagatare", est: "3 hrs", price: 2500 },
    { from: "Kigali", to: "Rwamagana", est: "1 hr", price: 1000 },
    { from: "Kigali", to: "Muhanga", est: "1.5 hrs", price: 1500 }
  ];

  const departures: any[] = [];

  for (const r of routes) {
    for (const d of datesList) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      for (const s of slots) {
        const departureTime = `${dateStr}T${s}`;
        const booked = await getBookedSeatsCount(r.from, r.to, departureTime);
        const left = Math.max(0, 30 - booked);
        
        departures.push({
          from: r.from,
          to: r.to,
          est: r.est,
          price: r.price,
          time: departureTime,
          left,
          isFull: left <= 0
        });
      }
    }
  }

  res.json({ status: "success", departures });
});

// ==========================================
// 🧠 GEMINI AI-POWERED CUSTOM SERVICES
// ==========================================

// 1. Smart Price Prediction Forecast
app.post("/api/ai/predict-prices", async (req, res) => {
  const { from, to, date } = req.body;
  if (!from || !to || !date) {
    return res.status(400).json({ status: "error", message: "Missing from, to, or date parameters" });
  }

  // Base price mapping
  let basePrice = 2500;
  const target = String(to).toLowerCase();
  if (target.includes("musanze")) basePrice = 2500;
  else if (target.includes("huye")) basePrice = 2000;
  else if (target.includes("rubavu")) basePrice = 3000;
  else if (target.includes("nyagatare")) basePrice = 2500;
  else if (target.includes("rwamagana")) basePrice = 1000;
  else if (target.includes("muhanga")) basePrice = 1500;

  const parsedDate = new Date(date);
  
  if (ai) {
    try {
      const prompt = `You are a Smart Transport Pricing Algorithm. Predict realistic daily transport ticket price and demand index for the route "${from}" to "${to}" in Rwanda for a 7-day period starting from "${date}".
The baseline cost is ${basePrice} RWF.
Vary the pricing slightly (+15% for high-demand like weekends/Fridays/Sundays, standard for weekdays, maybe 5-10% discount for low-demand mid-week days like Tuesday/Wednesday) to demonstrate "cheaper travel days".
Ensure the output is valid JSON strictly conforming to the following JSON array structure:
[
  {
    "date": "YYYY-MM-DD",
    "dayName": "Friday",
    "price": 2500,
    "demand": "High",
    "isCheapest": false,
    "reason": "Weekend commuter spike"
  }
]
Generate exactly 7 entries starting from ${date}. Ensure the prices are integers and reasonable in RWF. Output ONLY the JSON array, no wrap or markups.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "";
      const cleanedJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const forecast = JSON.parse(cleanedJson);
      return res.json({ status: "success", forecast });
    } catch (err: any) {
      console.error("Gemini Price Prediction failed, falling back to static generator:", err);
    }
  }

  // Fallback if no Gemini configuration or error occurs
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const forecast: any[] = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(parsedDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dayIndex = current.getDay();
    const dayName = daysOfWeek[dayIndex];
    let price = basePrice;
    let demand = "Medium";
    let isCheapest = false;
    let reason = "Standard weekday rate";

    if (dayName === "Friday" || dayName === "Sunday") {
      price = Math.round(basePrice * 1.15);
      demand = "High";
      reason = "Weekend commuter spike";
    } else if (dayName === "Tuesday" || dayName === "Wednesday") {
      price = Math.round(basePrice * 0.90);
      demand = "Low";
      isCheapest = true;
      reason = "Mid-week discount rate";
    }

    const yr = current.getFullYear();
    const mo = String(current.getMonth() + 1).padStart(2, "0");
    const dy = String(current.getDate()).padStart(2, "0");
    const dateString = `${yr}-${mo}-${dy}`;

    forecast.push({
      date: dateString,
      dayName,
      price,
      demand,
      isCheapest,
      reason
    });
  }

  return res.json({ status: "success", forecast });
});

// 2. Chatbot response with English/Kinyarwanda context
app.post("/api/ai/chat", async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ status: "error", message: "Missing message payload" });
  }

  const systemInstruction = `You are VUU Transport AI, a helpful, friendly, and smart transport assistant in Rwanda.
You are embedded in the VUU ride-hailing/bus ticketing app.
You answer questions in English AND/OR Kinyarwanda elegantly (passengers frequently mix the two, e.g., "Mwakwaka bus igana i Musanze?").

VUU Transport Official Information:
- VUU Transport runs high-quality commuter buses across Rwanda.
- Main routes, pricing and times:
  * Kigali to Musanze: 2500 RWF (Duration: ~3 hrs). Departures: daily at 08:00, 11:00, 14:00, 17:00.
  * Kigali to Huye: 2000 RWF (Duration: ~2.5 hrs). Departures: daily at 08:00, 11:00, 14:00, 17:00.
  * Kigali to Rubavu: 3000 RWF (Duration: ~3.5 hrs). Departures: daily at 08:00, 11:00, 14:00, 17:00.
  * Kigali to Nyagatare: 2500 RWF (Duration: ~3 hrs). Departures: daily at 08:00, 11:00, 14:00, 17:00.
  * Kigali to Rwamagana: 1000 RWF (Duration: ~1 hr). Departures: daily at 08:00, 11:00, 14:00, 17:00.
  * Kigali to Muhanga: 1500 RWF (Duration: ~1.5 hrs). Departures: daily at 08:00, 11:00, 14:00, 17:00.
Note: Reverse trips (e.g. Musanze to Kigali, Huye to Kigali) have the exact same schedules and pricing.
- Max capacity is 30 seats per bus.
- Payment operators: MTN Mobile Money (MoMo) [recommended], Airtel Money, or Cash to Driver.
- Features: Users can book tickets, log in as Driver to view allocated passengers, and check-in passengers.
- Tone: Welcoming, secure, polite and brief. If asked in Kinyarwanda, reply in perfect local Kinyarwanda or a blend of Kinyarwanda and English as requested by the phrasing. Use polite phrases like "Amakuru", "Muraho", "Murakoze kuguha serivisi".`;

  if (ai) {
    try {
      const formattedHistory = (history || []).map((h: any) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.text }]
      }));

      // Add latest
      const contents = [...formattedHistory, { role: "user", parts: [{ text: message }] }];

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction
        }
      });

      return res.json({ status: "success", reply: response.text });
    } catch (err: any) {
      console.error("Gemini Chat failed, falling back to heuristic answers:", err);
    }
  }

  // Fallback if no Gemini key or error
  const msgLower = message.toLowerCase();
  let reply = "Hello! I am VUU Transport Assistant. Currently, my active Gemini neural network is loading. Here is our general schedule: Buses leave Kigali to Musanze, Rubavu, Huye, Nyagatare, Rwamagana, and Muhanga daily at 08:00, 11:00, 14:00, and 17:00! Let me know if you want to book or check pricing.";
  
  if (msgLower.includes("musanze")) {
    reply = "Muraho! Bisi ijya i Musanze ihaguruka buri munsi saa munani (08:00), saa tanu (11:00), saa mbiri z'amanywa (14:00) na saa kumi n'imwe z'umugoroba (17:00). Igira igiciro cya 2500 RWF. (The next bus to Musanze departs Kigali/Musanze daily at 08:00, 11:00, 14:00, and 17:00, costing 2500 RWF).";
  } else if (msgLower.includes("huye")) {
    reply = "Amakuru! Bisi ijya i Huye ihaguruka buri munsi saa 08:00, 11:00, 14:00, na 17:00. Igiciro ni 2000 RWF kandi hantwarwa amasaha abiri n'igice (~2.5 hours).";
  } else if (msgLower.includes("rubavu")) {
    reply = "Muraho! Ikiguzi cyo kuva Kigali ujya Rubavu ni 3000 RWF. Bisi zihamagara saa 08:00, 11:00, 14:00, na 17:00 buri munsi.";
  } else if (msgLower.includes("amakuru") || msgLower.includes("muraho") || msgLower.includes("bite")) {
    reply = "Muraho neza! Ndagufasha iki uyu munsi? Ndi VUU AI Assistant, nshobora kugufasha kumenya amasaha ya bisi ndetse n'ibiciro ku ngendo zose.";
  }

  return res.json({ status: "success", reply });
});

// 3. AI Demand Forecasting for Admin
app.get("/api/ai/demand-forecast", async (req, res) => {
  let bookings: any[] = [];
  try {
    bookings = sqliteDb.prepare("SELECT * FROM bookings").all();
  } catch (err) {
    console.error("Failed to query bookings for forecast:", err);
  }

  // Count bookings by route
  const routeCounts: Record<string, number> = {};
  bookings.forEach(b => {
    const route = `${b.from_location} to ${b.to_location}`;
    routeCounts[route] = (routeCounts[route] || 0) + Number(b.seats || 1);
  });

  const bookingsSummary = JSON.stringify(routeCounts);

  if (ai) {
    try {
      const prompt = `You are a transport consultant. Analyze this week's booking data for VUU Transport in Rwanda:
${bookingsSummary}
Generate a demand forecast and popularity analysis for VUU's primary routes.
Select the top trending routes, medium stability routes, and low demand routes.
Return a structured JSON object strictly conforming to this schema:
{
  "routes": [
    {
      "route": "Kigali to Musanze",
      "score": 85,
      "trend": "+12%",
      "status": "Trending",
      "comment": "Weekend tourism and university student influx."
    }
  ],
  "recommendations": "Provide 3 concise high-level actionable recommendation bullets for transport capacity allocation based on this analysis."
}
Only output the JSON object, absolutely no prose wrap or markdown codeblocks.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "";
      const cleanedJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const report = JSON.parse(cleanedJson);
      return res.json({ status: "success", report });
    } catch (err) {
      console.error("Gemini demand forecasting failed:", err);
    }
  }

  // Fallback prediction based on booking data
  const routesList = [
    { route: "Kigali to Musanze", score: 85, trend: "+15%", status: "Trending", comment: "Tourist and university traffic peaking." },
    { route: "Kigali to Rubavu", score: 90, trend: "+20%", status: "High Demand", comment: "Lake Kivu resort commuters for weekend." },
    { route: "Kigali to Huye", score: 70, trend: "+5%", status: "Stable", comment: "Standard academic passenger influx." },
    { route: "Kigali to Rwamagana", score: 65, trend: "-2%", status: "Stable", comment: "Steady weekday trading commutes." },
    { route: "Kigali to Nyagatare", score: 50, trend: "+1%", status: "Normal", comment: "Agricultural trading schedules." },
    { route: "Kigali to Muhanga", score: 60, trend: "+3%", status: "Stable", comment: "Shorter-haul transit hub connections." }
  ];

  routesList.forEach(r => {
    const match = Object.keys(routeCounts).find(k => k.toLowerCase().includes(r.route.split(" to ")[1].toLowerCase()));
    if (match) {
      r.score = Math.min(100, Math.round(r.score + routeCounts[match] * 12));
    }
  });

  const indexForecast = {
    routes: routesList.sort((a,b) => b.score - a.score),
    recommendations: "1. Increase Kigali-Rubavu departure capacity at 14:00 to manage weekend resort peaks.\n2. Run a special promotional fare for Kigali-Rwamagana route on Tuesdays to utilize empty off-peak runs.\n3. Keep driver roster ready for Musanze student return waves on Sunday afternoon."
  };

  return res.json({ status: "success", report: indexForecast });
});

// 4. Suggest Return Trip
app.post("/api/ai/suggest-return", async (req, res) => {
  const { from, to, date, seats } = req.body;
  if (!from || !to || !date) {
    return res.status(400).json({ status: "error", message: "Missing from, to or date" });
  }

  const travelDateObj = new Date(date);
  
  if (ai) {
    try {
      const prompt = `A passenger has just booked a ticket from "${from}" to "${to}" in Rwanda on departures date "${date}" for "${seats || 1}" seats.
Offer a highly tailored and logical return journey (from "${to}" back to "${from}").
Suggest two different optional dates (typically 1 to 3 days after their outbound journey).
Ensure the output is valid JSON strictly matching this schema:
{
  "originalTrip": { "from": "${from}", "to": "${to}", "date": "${date}" },
  "suggestedReturnRoute": "${to} to ${from}",
  "reasoning": "Explain elegantly in 1 brief sentence why this return date/time makes sense for commuter schedules.",
  "suggestions": [
    {
       "date": "YYYY-MM-DD",
       "time": "14:00",
       "price": 2500,
       "displayTag": "Recommended Return (Avoid Bus Spikes!)"
    }
  ]
}
Generate exactly 2 suggested options. Output ONLY JSON, no wrappers.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "";
      const cleanedJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const suggestion = JSON.parse(cleanedJson);
      return res.json({ status: "success", suggestion });
    } catch (err) {
      console.error("Gemini suggestion failed:", err);
    }
  }

  // Fallback suggestions
  const defaultReturnPrice = to.toLowerCase() === "rubavu" ? 3000 : (to.toLowerCase() === "musanze" ? 2500 : (to.toLowerCase() === "huye" ? 2000 : 1500));
  
  const date2DaysLater = new Date(travelDateObj.getTime() + 2 * 24 * 60 * 60 * 1000);
  const date3DaysLater = new Date(travelDateObj.getTime() + 3 * 24 * 60 * 60 * 1000);

  const formatSimpleDate = (d: Date) => {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const dy = String(d.getDate()).padStart(2, "0");
    return `${yr}-${mo}-${dy}`;
  };

  const suggestion = {
    originalTrip: { from, to, date },
    suggestedReturnRoute: `${to} to ${from}`,
    reasoning: `Highly recommended dates to guarantee reliable seat availability on VUU's direct commute back to ${from}.`,
    suggestions: [
      {
        date: formatSimpleDate(date2DaysLater),
        time: "14:00",
        price: defaultReturnPrice,
        displayTag: "Weekend Retainer Option"
      },
      {
        date: formatSimpleDate(date3DaysLater),
        time: "11:00",
        price: Math.round(defaultReturnPrice * 0.95), // minor discount
        displayTag: "Cheaper Mid-Week Return"
      }
    ]
  };

  return res.json({ status: "success", suggestion });
});

// ==========================================
// 🛡️ RE_ROUTING RESILIENCY FOR STATIC PAGES
// ==========================================
app.use(express.static(__dirname_resolved)); 
app.use(express.static(process.cwd()));
app.use(express.static(path.join(process.cwd(), "dist")));

// Fallback all other standard requests to index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(process.cwd(), "index.html"));
});

// Run server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Real VUU Transport Backend Service running on http://localhost:${PORT}`);
});
