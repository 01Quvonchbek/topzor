import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("platform.db");

// Initialize Database with full schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT,
    phone TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'user', -- 'user', 'business', 'moderator', 'admin'
    avatar TEXT,
    region_id INTEGER,
    is_verified INTEGER DEFAULT 0,
    is_blocked INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT,
    parent_id INTEGER,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ad_id INTEGER,
    user_id INTEGER, -- reporter
    reason TEXT,
    status TEXT DEFAULT 'open', -- 'open', 'resolved'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ad_id) REFERENCES ads(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    ad_id INTEGER,
    amount REAL,
    method TEXT, -- 'click', 'payme', 'card'
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (ad_id) REFERENCES ads(id)
  );

  CREATE TABLE IF NOT EXISTS tariffs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price REAL,
    duration_day INTEGER,
    features TEXT -- JSON string
  );

  CREATE TABLE IF NOT EXISTS shops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    shop_name TEXT NOT NULL,
    logo TEXT,
    description TEXT,
    tariff_id INTEGER,
    subscription_status TEXT DEFAULT 'active',
    expires_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (tariff_id) REFERENCES tariffs(id)
  );

  CREATE TABLE IF NOT EXISTS ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    category_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    price REAL,
    currency TEXT DEFAULT 'UZS',
    condition TEXT DEFAULT 'new', -- 'new', 'used'
    region_id INTEGER,
    district_id INTEGER,
    location TEXT,
    lat REAL,
    lng REAL,
    status TEXT DEFAULT 'pending', -- 'pending', 'active', 'rejected', 'sold'
    is_premium INTEGER DEFAULT 0,
    is_vip INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    main_image TEXT,
    video_url TEXT,
    telegram TEXT,
    has_delivery INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS ad_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ad_id INTEGER,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (ad_id) REFERENCES ads(id)
  );

  CREATE TABLE IF NOT EXISTS ad_videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ad_id INTEGER,
    video_url TEXT,
    FOREIGN KEY (ad_id) REFERENCES ads(id)
  );

  CREATE TABLE IF NOT EXISTS auctions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ad_id INTEGER,
    start_price REAL,
    end_time DATETIME,
    status TEXT DEFAULT 'active', -- 'active', 'finished'
    FOREIGN KEY (ad_id) REFERENCES ads(id)
  );

  CREATE TABLE IF NOT EXISTS bids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    auction_id INTEGER,
    user_id INTEGER,
    amount REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auction_id) REFERENCES auctions(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, -- target user (seller)
    reviewer_id INTEGER,
    reviewer_name TEXT,
    rating INTEGER,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS favorites (
    user_id INTEGER,
    ad_id INTEGER,
    PRIMARY KEY (user_id, ad_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (ad_id) REFERENCES ads(id)
  );

  CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ad_id INTEGER,
    buyer_id INTEGER,
    seller_id INTEGER,
    last_message TEXT,
    last_message_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ad_id) REFERENCES ads(id),
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    FOREIGN KEY (seller_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER,
    sender_id INTEGER,
    message TEXT,
    file_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ad_id INTEGER,
    user_id INTEGER, -- reporter
    reason TEXT,
    status TEXT DEFAULT 'open', -- 'open', 'resolved'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ad_id) REFERENCES ads(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_url TEXT,
    link_url TEXT,
    position TEXT, -- 'home_top', 'sidebar'
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount REAL,
    type TEXT, -- 'premium_ad', 'vip_ad', 'subscription', 'auction_fee'
    status TEXT DEFAULT 'completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Seed Data
const catCount = db.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number };
if (catCount.count < 10) {
  const categories = [
    // 1) Transport
    { id: 1, name: "Transport", icon: "Car", parent_id: null },
    { name: "Yengil avtomobil", icon: "Car", parent_id: 1 },
    { name: "Yuk mashina", icon: "Truck", parent_id: 1 },
    { name: "Moto", icon: "Bike", parent_id: 1 },
    { name: "Ehtiyot qismlar", icon: "Settings", parent_id: 1 },
    { name: "Avto xizmatlar", icon: "Wrench", parent_id: 1 },

    // 2) Uy-joy
    { id: 2, name: "Uy-joy", icon: "Home", parent_id: null },
    { name: "Kvartira sotuv", icon: "Home", parent_id: 2 },
    { name: "Kvartira ijara", icon: "Key", parent_id: 2 },
    { name: "Hovli", icon: "Home", parent_id: 2 },
    { name: "Yer uchastka", icon: "Map", parent_id: 2 },
    { name: "Tijorat binolari", icon: "Building", parent_id: 2 },

    // 3) Elektronika
    { id: 3, name: "Elektronika", icon: "Smartphone", parent_id: null },
    { name: "Telefon", icon: "Smartphone", parent_id: 3 },
    { name: "Laptop", icon: "Laptop", parent_id: 3 },
    { name: "Kompyuter", icon: "Monitor", parent_id: 3 },
    { name: "TV", icon: "Tv", parent_id: 3 },
    { name: "Maishiy texnika", icon: "Zap", parent_id: 3 },
    { name: "Aksessuarlar", icon: "Headphones", parent_id: 3 },

    // 4) Ish e’lonlari
    { id: 4, name: "Ish e’lonlari", icon: "Briefcase", parent_id: null },
    { name: "Doimiy ish", icon: "Briefcase", parent_id: 4 },
    { name: "Masofaviy ish", icon: "Globe", parent_id: 4 },
    { name: "Freelancer", icon: "User", parent_id: 4 },
    { name: "Stajirovka", icon: "GraduationCap", parent_id: 4 },

    // 5) Xizmatlar
    { id: 5, name: "Xizmatlar", icon: "Wrench", parent_id: null },
    { name: "Santexnik", icon: "Droplets", parent_id: 5 },
    { name: "Elektrik", icon: "Zap", parent_id: 5 },
    { name: "Remont", icon: "Hammer", parent_id: 5 },
    { name: "Dizayn", icon: "Palette", parent_id: 5 },
    { name: "Dasturlash", icon: "Code", parent_id: 5 },
    { name: "Yetkazib berish", icon: "Truck", parent_id: 5 },

    // 6) Qurilish bozori
    { id: 6, name: "Qurilish bozori", icon: "Hammer", parent_id: null },
    { name: "Sement", icon: "Box", parent_id: 6 },
    { name: "G‘isht", icon: "Grid", parent_id: 6 },
    { name: "Armatura", icon: "Hash", parent_id: 6 },
    { name: "Bo‘yoq", icon: "Paintbrush", parent_id: 6 },
    { name: "Qurilish texnikasi", icon: "Truck", parent_id: 6 },

    // 7) Fermer bozori
    { id: 7, name: "Fermer bozori", icon: "Leaf", parent_id: null },
    { name: "Meva", icon: "Apple", parent_id: 7 },
    { name: "Sabzavot", icon: "Carrot", parent_id: 7 },
    { name: "Chorva", icon: "Dog", parent_id: 7 },
    { name: "Yem", icon: "Wheat", parent_id: 7 },
    { name: "Urug‘", icon: "Sprout", parent_id: 7 },
    { name: "Qishloq xo'jaligi texnikasi", icon: "Tractor", parent_id: 7 },

    // 8) Ikkinchi qo‘l texnika
    { id: 8, name: "Ikkinchi qo‘l texnika", icon: "Cpu", parent_id: null },
    { name: "Telefon", icon: "Smartphone", parent_id: 8 },
    { name: "Noutbuk", icon: "Laptop", parent_id: 8 },
    { name: "Kamera", icon: "Camera", parent_id: 8 },
    { name: "Printer", icon: "Printer", parent_id: 8 },
    { name: "O‘yin konsollari", icon: "Gamepad", parent_id: 8 },

    // 9) Auksion
    { id: 9, name: "Auksion", icon: "Gavel", parent_id: null },
    { name: "Elektronika auksioni", icon: "Smartphone", parent_id: 9 },
    { name: "Avto auksion", icon: "Car", parent_id: 9 },
    { name: "Uy jihozlari auksioni", icon: "Home", parent_id: 9 },
    { name: "Maxsus lotlar", icon: "Star", parent_id: 9 }
  ];

  const seedTransaction = db.transaction(() => {
    db.exec("DELETE FROM categories");
    db.exec("DELETE FROM sqlite_sequence WHERE name='categories'");
    
    const insertCat = db.prepare("INSERT INTO categories (id, name, icon, parent_id) VALUES (?, ?, ?, ?)");
    const insertSubCat = db.prepare("INSERT INTO categories (name, icon, parent_id) VALUES (?, ?, ?)");

    // Insert parents first to avoid ID collisions with autoincrement
    categories.filter(c => c.id).forEach(c => {
      insertCat.run(c.id, c.name, c.icon, c.parent_id);
    });
    
    // Then insert subcategories
    categories.filter(c => !c.id).forEach(c => {
      insertSubCat.run(c.name, c.icon, c.parent_id);
    });
  });

  seedTransaction();
}

const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  // Create tariffs
  db.prepare("INSERT INTO tariffs (name, price, duration_day, features) VALUES (?, ?, ?, ?)").run("Standard", 0, 30, JSON.stringify(["Basic listings"]));
  db.prepare("INSERT INTO tariffs (name, price, duration_day, features) VALUES (?, ?, ?, ?)").run("Premium", 100000, 30, JSON.stringify(["VIP listings", "Banner ads"]));

  // Create users with different roles
  db.prepare("INSERT INTO users (full_name, phone, email, avatar, role, is_verified) VALUES (?, ?, ?, ?, ?, ?)").run("Akmal", "+998901234567", "akmal@example.com", "https://i.pravatar.cc/150?u=akmal", "admin", 1);
  db.prepare("INSERT INTO users (full_name, phone, email, avatar, role, is_verified) VALUES (?, ?, ?, ?, ?, ?)").run("Biznes Sotuvchi", "+998907654321", "biznes@example.com", "https://i.pravatar.cc/150?u=biznes", "business", 1);
  db.prepare("INSERT INTO users (full_name, phone, email, avatar, role, is_verified) VALUES (?, ?, ?, ?, ?, ?)").run("Moderator", "+998901112233", "mod@example.com", "https://i.pravatar.cc/150?u=mod", "moderator", 1);
  db.prepare("INSERT INTO users (full_name, phone, email, avatar, role, is_verified) VALUES (?, ?, ?, ?, ?, ?)").run("Oddiy Foydalanuvchi", "+998904445566", "user@example.com", "https://i.pravatar.cc/150?u=user", "user", 0);
  
  db.prepare("INSERT INTO shops (shop_name, description, logo, user_id, tariff_id) VALUES (?, ?, ?, ?, ?)").run("TexnoMart", "Eng yaxshi gadjetlar", "https://picsum.photos/seed/texno/200/200", 2, 2);
  db.prepare("INSERT INTO shops (shop_name, description, logo, user_id, tariff_id) VALUES (?, ?, ?, ?, ?)").run("AvtoSalon", "Yangi va haydalgan mashinalar", "https://picsum.photos/seed/avto/200/200", 2, 2);

  const getCatId = (name: string) => {
    const row = db.prepare("SELECT id FROM categories WHERE name = ?").get(name) as { id: number } | undefined;
    return row?.id || 1;
  };

  db.prepare("INSERT INTO ads (title, description, price, category_id, location, main_image, is_vip, user_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    "iPhone 15 Pro Max", "Yangi, ochilmagan", 15000000, getCatId("Telefon"), "Toshkent", "https://picsum.photos/seed/iphone15/800/600", 1, 2, "active"
  );
  db.prepare("INSERT INTO ads (title, description, price, category_id, location, main_image, is_premium, user_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    "Chevrolet Gentra", "Ideal holatda", 160000000, getCatId("Yengil avtomobil"), "Samarqand", "https://picsum.photos/seed/gentra/800/600", 1, 2, "active"
  );

  // Auctions
  const auc1 = db.prepare("INSERT INTO ads (title, description, price, category_id, location, main_image, user_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
    "Noyob Tilla Soat", "Antikvar soat", 5000000, getCatId("Uy jihozlari auksioni"), "Toshkent", "https://picsum.photos/seed/watch/800/600", 2, "active"
  );
  db.prepare("INSERT INTO auctions (ad_id, start_price, end_time) VALUES (?, ?, ?)").run(auc1.lastInsertRowid, 5000000, "2026-12-31");

  const auc2 = db.prepare("INSERT INTO ads (title, description, price, category_id, location, main_image, user_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
    "BMW M5 CS (Auksion)", "Tezkor mashina", 500000000, getCatId("Avto auksion"), "Samarqand", "https://picsum.photos/seed/bmw-auc/800/600", 2, "active"
  );
  db.prepare("INSERT INTO auctions (ad_id, start_price, end_time) VALUES (?, ?, ?)").run(auc2.lastInsertRowid, 500000000, "2026-12-20");

  db.prepare("INSERT INTO reviews (user_id, reviewer_id, reviewer_name, rating, comment) VALUES (?, ?, ?, ?, ?)").run(2, 4, "Jasur", 5, "Ishonchli sotuvchi!");

  // Banners
  db.prepare("INSERT INTO banners (image_url, link_url, position) VALUES (?, ?, ?)").run("https://picsum.photos/seed/banner1/1200/300", "/ads/1", "home_top");
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get("/api/categories", (req, res) => {
    const categories = db.prepare("SELECT * FROM categories").all();
    res.json(categories);
  });

  app.get("/api/shops", (req, res) => {
    const shops = db.prepare("SELECT * FROM shops").all();
    res.json(shops);
  });

  app.get("/api/ads", (req, res) => {
    const { category, search, minPrice, maxPrice, condition, hasDelivery, is_premium, is_auction } = req.query;
    let query = `
      SELECT ads.*, categories.name as category_name, 
             auctions.id as auction_id, auctions.start_price as auction_start_price, auctions.end_time as auction_end_time
      FROM ads 
      JOIN categories ON ads.category_id = categories.id 
      LEFT JOIN auctions ON ads.id = auctions.ad_id
      WHERE ads.status = 'active'
    `;
    const params: any[] = [];

    if (category) {
      const subCategories = db.prepare("SELECT id FROM categories WHERE parent_id = ?").all(category) as { id: number }[];
      if (subCategories.length > 0) {
        const ids = [category, ...subCategories.map(s => s.id)];
        query += ` AND ads.category_id IN (${ids.map(() => '?').join(',')})`;
        params.push(...ids);
      } else {
        query += " AND ads.category_id = ?";
        params.push(category);
      }
    }
    if (search) { query += " AND ads.title LIKE ?"; params.push(`%${search}%`); }
    if (minPrice) { query += " AND ads.price >= ?"; params.push(minPrice); }
    if (maxPrice) { query += " AND ads.price <= ?"; params.push(maxPrice); }
    if (condition) { query += " AND ads.condition = ?"; params.push(condition); }
    if (hasDelivery) { query += " AND ads.has_delivery = 1"; }
    if (is_premium) { query += " AND ads.is_premium = 1"; }
    if (is_auction) { query += " AND auctions.id IS NOT NULL"; }

    query += " ORDER BY ads.is_vip DESC, ads.is_premium DESC, ads.created_at DESC";
    const ads = db.prepare(query).all(...params);
    res.json(ads);
  });

  app.get("/api/ads/:id", (req, res) => {
    db.prepare("UPDATE ads SET views_count = views_count + 1 WHERE id = ?").run(req.params.id);
    const ad = db.prepare(`
      SELECT ads.*, categories.name as category_name, 
             users.full_name as seller_name, users.phone as seller_phone, users.avatar as seller_avatar, users.role as seller_role,
             auctions.id as auction_id, auctions.start_price as auction_start_price, auctions.end_time as auction_end_time
      FROM ads 
      JOIN categories ON ads.category_id = categories.id 
      JOIN users ON ads.user_id = users.id 
      LEFT JOIN auctions ON ads.id = auctions.ad_id
      WHERE ads.id = ?
    `).get(req.params.id) as any;

    const images = db.prepare("SELECT image_url FROM ad_images WHERE ad_id = ?").all(req.params.id);
    
    let auction = null;
    if (ad.auction_id) {
      const bids = db.prepare("SELECT bids.*, users.full_name as user_name FROM bids JOIN users ON bids.user_id = users.id WHERE auction_id = ? ORDER BY amount DESC").all(ad.auction_id);
      auction = {
        id: ad.auction_id,
        start_price: ad.auction_start_price,
        end_time: ad.auction_end_time,
        bids: bids,
        highest_bid: bids.length > 0 ? (bids[0] as any).amount : ad.auction_start_price
      };
    }

    res.json({ ...ad, images, auction });
  });

  app.get("/api/my-ads", (req, res) => {
    const ads = db.prepare("SELECT * FROM ads WHERE user_id = 1").all();
    res.json(ads);
  });

  app.delete("/api/ads/:id", (req, res) => {
    db.prepare("DELETE FROM ads WHERE id = ? AND user_id = 1").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/favorites", (req, res) => {
    const ads = db.prepare("SELECT ads.* FROM ads JOIN favorites ON ads.id = favorites.ad_id WHERE favorites.user_id = 1").all();
    res.json(ads);
  });

  app.post("/api/favorites/:id", (req, res) => {
    try {
      db.prepare("INSERT INTO favorites (user_id, ad_id) VALUES (1, ?)").run(req.params.id);
      res.json({ success: true });
    } catch (e) {
      db.prepare("DELETE FROM favorites WHERE user_id = 1 AND ad_id = ?").run(req.params.id);
      res.json({ success: false, removed: true });
    }
  });

  app.get("/api/reviews/:userId", (req, res) => {
    const reviews = db.prepare("SELECT * FROM reviews WHERE user_id = ?").all(req.params.userId);
    res.json(reviews);
  });

  app.get("/api/auctions", (req, res) => {
    const auctions = db.prepare(`
      SELECT ads.*, auctions.id as auction_id, auctions.start_price, auctions.end_time,
             (SELECT MAX(amount) FROM bids WHERE auction_id = auctions.id) as highest_bid 
      FROM ads 
      JOIN auctions ON ads.id = auctions.ad_id 
      WHERE ads.status = 'active'
    `).all();
    res.json(auctions);
  });

  app.post("/api/bids", (req, res) => {
    const { auction_id, user_id, amount } = req.body;
    const auction = db.prepare("SELECT start_price FROM auctions WHERE id = ?").get(auction_id) as { start_price: number };
    const highestBid = db.prepare("SELECT MAX(amount) as max_amount FROM bids WHERE auction_id = ?").get(auction_id) as { max_amount: number | null };
    
    const minBid = highestBid.max_amount || auction.start_price;
    if (amount <= minBid) {
      return res.status(400).json({ error: "Bid must be higher than current price" });
    }

    db.prepare("INSERT INTO bids (auction_id, user_id, amount) VALUES (?, ?, ?)").run(auction_id, user_id, amount);
    res.json({ success: true });
  });

  app.get("/api/banners", (req, res) => {
    const banners = db.prepare("SELECT * FROM banners WHERE is_active = 1").all();
    res.json(banners);
  });

  app.post("/api/ads", (req, res) => {
    const { title, description, price, category_id, location, condition, has_delivery, image_url } = req.body;
    const result = db.prepare("INSERT INTO ads (title, description, price, category_id, location, condition, has_delivery, main_image, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)").run(
      title, description, price, category_id, location, condition, has_delivery ? 1 : 0, image_url
    );
    res.json({ id: result.lastInsertRowid });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
  }

  app.listen(3000, "0.0.0.0", () => console.log("Server running on port 3000"));
}

startServer();
