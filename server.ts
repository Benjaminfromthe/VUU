import express from "express";
import path from "path";
import Database from "better-sqlite3";

const app = express();
const PORT = 3000;

app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));

app.use(express.static(path.join(process.cwd(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- Database Setup ---
const db = new Database(":memory:");

// Initialize tables
db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT UNIQUE,
    role TEXT,
    password TEXT
  );
  
  CREATE TABLE routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_loc TEXT,
    end_loc TEXT,
    duration TEXT,
    price INTEGER
  );

  CREATE TABLE bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    route_id INTEGER,
    seats INTEGER,
    date TEXT,
    status TEXT
  );
`);

// Pre-load Rwanda routes
const insertRoute = db.prepare("INSERT INTO routes (start_loc, end_loc, duration, price) VALUES (?, ?, ?, ?)");
insertRoute.run("Kigali", "Musanze", "3h", 2500);
insertRoute.run("Kigali", "Huye", "2.5h", 2000);
insertRoute.run("Kigali", "Rubavu", "3.5h", 3000);
insertRoute.run("Kigali", "Nyagatare", "3h", 2500);
insertRoute.run("Kigali", "Rwamagana", "1h", 1000);
insertRoute.run("Kigali", "Muhanga", "1.5h", 1500);

// --- Routes ---

app.get("/", (req, res) => {
  res.render("index", { title: "Home | VUU Transport" });
});

app.get("/register", (req, res) => {
  res.render("register", { title: "Register | VUU Transport", success: null, error: null });
});

app.post("/register", (req, res) => {
  const { name, phone, password, role } = req.body;
  try {
    const insert = db.prepare("INSERT INTO users (name, phone, role, password) VALUES (?, ?, ?, ?)");
    insert.run(name, phone, role, password);
    res.render("register", { title: "Register | VUU Transport", success: "Account created successfully! You can now login.", error: null });
  } catch (err: any) {
    res.render("register", { title: "Register | VUU Transport", success: null, error: "Phone number already exists or invalid data." });
  }
});

app.get("/login", (req, res) => {
  res.render("login", { title: "Login | VUU Transport", error: null });
});

app.post("/login", (req, res) => {
  const { phone, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE phone = ? AND password = ?").get(phone, password) as any;
  
  if (user) {
    if (user.role === "driver") return res.redirect("/driver/dashboard");
    if (user.role === "admin") return res.redirect("/admin");
    return res.redirect("/book");
  } else {
    res.render("login", { title: "Login | VUU Transport", error: "Invalid credentials." });
  }
});

app.get("/routes", (req, res) => {
  const routes = db.prepare("SELECT * FROM routes").all();
  res.render("routes", { title: "Routes | VUU Transport", routes });
});

app.get("/book", (req, res) => {
  const routes = db.prepare("SELECT * FROM routes").all();
  res.render("book", { title: "Book a Ride | VUU Transport", routes });
});

app.post("/book", (req, res) => {
  const { route_id, seats, date, payment_method } = req.body;
  const insert = db.prepare("INSERT INTO bookings (user_id, route_id, seats, date, status) VALUES (?, ?, ?, ?, ?)");
  const info = insert.run(1, route_id, seats, date, "PAID (" + payment_method + ")");
  res.redirect("/track?booking=" + info.lastInsertRowid);
});

app.get("/track", (req, res) => {
  const bookingId = req.query.booking;
  if (!bookingId) return res.redirect("/");
  
  const booking = db.prepare("SELECT b.*, r.start_loc, r.end_loc FROM bookings b JOIN routes r ON b.route_id = r.id WHERE b.id = ?").get(bookingId) as any;
  if (!booking) return res.redirect("/");

  res.render("track", { title: "Track Ride | VUU Transport", booking });
});

app.get("/driver/dashboard", (req, res) => {
  res.render("driver_dashboard", { title: "Driver Dashboard | VUU Transport" });
});

app.get("/admin", (req, res) => {
  res.render("admin", { title: "Admin Portal | VUU Transport" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
