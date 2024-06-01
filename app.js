const express = require('express');
const app = express();
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
const multer = require('multer');

// Middleware for parsing request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(multer().none());
app.use(express.static('public'));

// In-memory session store
const sessions = {};

async function getDBConnection() {
  const db = await sqlite.open({
    filename: 'uwmarketplace.db',
    driver: sqlite3.Database
  });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS User (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Listing (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      image TEXT,
      contact TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      userId INTEGER,
      FOREIGN KEY(userId) REFERENCES User(id)
    );

    CREATE TABLE IF NOT EXISTS Transaction (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      buyerId INTEGER,
      sellerId INTEGER,
      itemId INTEGER,
      price REAL NOT NULL,
      transactionType TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY(buyerId) REFERENCES User(id),
      FOREIGN KEY(sellerId) REFERENCES User(id),
      FOREIGN KEY(itemId) REFERENCES Listing(id)
    );
  `);
  return db;
}

// Generate a simple session ID
function generateSessionId() {
  return Math.random().toString(36).substr(2, 9);
}

// Register route
app.post('/userauth/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const db = await getDBConnection();
    await db.run('INSERT INTO User (email, password) VALUES (?, ?)', [email, password]);
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login route
app.post('/userauth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const db = await getDBConnection();
    const user = await db.get('SELECT * FROM User WHERE email = ? AND password = ?', [email, password]);
    if (user) {
      const sessionId = generateSessionId();
      sessions[sessionId] = user.id;
      res.json({ sessionId });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Middleware for checking session
function authMiddleware(req, res, next) {
  const sessionId = req.header('x-session-id');
  if (!sessionId || !sessions[sessionId]) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  req.userId = sessions[sessionId];
  next();
}

// Upload item route
app.post('/upload/item', authMiddleware, async (req, res) => {
  const { title, description, image, contact, category, price } = req.body;
  try {
    const db = await getDBConnection();
    const result = await db.run(
      'INSERT INTO Listing (title, description, image, contact, category, price, userId) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description, image, contact, category, price, req.userId]
    );
    res.status(201).json({ message: 'Item successfully uploaded.', itemId: result.lastID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get category route
app.get('/marketplace', async (req, res) => {
  const { categories } = req.query;
  try {
    const db = await getDBConnection();
    let items;
    if (categories) {
      items = await db.all('SELECT * FROM Listing WHERE category = ?', [categories]);
    } else {
      items = await db.all('SELECT * FROM Listing');
    }
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get listing details route
app.get('/listing/item', async (req, res) => {
  const { id } = req.query;
  try {
    const db = await getDBConnection();
    const item = await db.get('SELECT * FROM Listing WHERE id = ?', [id]);
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record transaction route
app.post('/transaction', authMiddleware, async (req, res) => {
  const { buyerId, sellerId, itemId, price, transactionType, notes } = req.body;
  try {
    const db = await getDBConnection();
    const result = await db.run(
      'INSERT INTO Transaction (buyerId, sellerId, itemId, price, transactionType, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [buyerId, sellerId, itemId, price, transactionType, notes]
    );
    res.status(201).json({ message: 'Transaction recorded successfully.', transactionId: result.lastID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get account details route
app.get('/account', authMiddleware, async (req, res) => {
  const { userId } = req.query;
  try {
    const db = await getDBConnection();
    const user = await db.get('SELECT * FROM User WHERE id = ?', [userId]);
    const listings = await db.all('SELECT * FROM Listing WHERE userId = ?', [userId]);
    const purchases = await db.all('SELECT * FROM Transaction WHERE buyerId = ?', [userId]);
    res.json({ user, listings, purchases });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});