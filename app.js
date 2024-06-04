"use strict";
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

/**
 * Opens a connection to the SQLite database and sets up the necessary tables.
 * @returns {Promise<sqlite.Database>} A promise that resolves to the database connection.
 */
async function getDBConnection() {
  try {
    const db = await sqlite.open({
      filename: 'uwmarketplace.db',
      driver: sqlite3.Database
    });
    console.log("Database connection established");
    return db;
  } catch (err) {
    console.error("Error establishing database connection", err);
    throw err;
  }
}

/**
 * Generates a simple random session ID.
 * @returns {string} A random session ID.
 */
function generateSessionId() {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Handles user registration by inserting a new user into the database.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
app.post('/userauth/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const db = await getDBConnection();
    await db.run('INSERT INTO User (email, password) VALUES (?, ?)', [email, password]);
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Handles user login by verifying credentials and generating a session ID.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
app.post('/userauth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const db = await getDBConnection();
    const user = await db.get('SELECT * FROM User WHERE email = ? AND password = ?', [email, password]);
    if (user) {
      const sessionId = generateSessionId();
      sessions[sessionId] = user.id;
      res.json({ sessionId, userId: user.id }); // Return userId along with sessionId
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Middleware for checking if a session is valid.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {Function} next - The next middleware function.
 */
function authMiddleware(req, res, next) {
  const sessionId = req.header('x-session-id');
  if (!sessionId || !sessions[sessionId]) {
    console.log(`Invalid sessionId: ${sessionId}`);
    return res.status(401).json({ error: 'Not authenticated' });
  }
  req.userId = sessions[sessionId];
  console.log(`Authenticated userId: ${req.userId}`);
  next();
}

/**
 * Handles item uploads by inserting a new listing into the database.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
app.post('/upload/item', authMiddleware, async (req, res) => {
  const { title, description, image, contact, category, price } = req.body;
  try {
    const db = await getDBConnection();
    const result = await db.run(
      'INSERT INTO Listings (title, description, image, contact, category, price, userId) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description, image, contact, category, price, req.userId]
    );
    res.status(201).json({ message: 'Item successfully uploaded.', itemId: result.lastID });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Retrieves items from the marketplace, optionally filtering by category.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
app.get('/marketplace', async (req, res) => {
  const { categories } = req.query;
  try {
    const db = await getDBConnection();
    let items;
    if (categories) {
      items = await db.all('SELECT * FROM Listings WHERE category = ?', [categories]);
    } else {
      items = await db.all('SELECT * FROM Listings');
    }
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Retrieves details of a specific listing by its ID.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
app.get('/listing/item', async (req, res) => {
  const { id } = req.query;
  try {
    const db = await getDBConnection();
    const item = await db.get(`
      SELECT Listings.*, User.email AS sellerEmail
      FROM Listings
      JOIN User ON Listings.userId = User.id
      WHERE Listings.id = ?
    `, [id]);

    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Records a transaction between a buyer and a seller.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
app.post('/transaction', authMiddleware, async (req, res) => {
  const { buyerId, sellerId, itemId, price, transactionType, notes } = req.body;
  const db = await getDBConnection();
  try {
    await db.run('BEGIN');  // Start transaction
    const result = await db.run(
      'INSERT INTO Transaction (buyerId, sellerId, itemId, price, transactionType, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [buyerId, sellerId, itemId, price, transactionType, notes]
    );
    await db.run('UPDATE Listings SET isSold = 1 WHERE id = ?', [itemId]);
    await db.run('COMMIT');  // Commit transaction
    res.status(201).json({ message: 'Transaction recorded successfully.', transactionId: result.lastID });
  } catch (err) {
    await db.run('ROLLBACK');  // Rollback in case of error
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Retrieves account details, including user information and listings.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
app.get('/account', authMiddleware, async (req, res) => {
  const userId = req.userId; // Ensure this is coming from the auth middleware
  console.log(`Fetching account details for userId: ${userId}`); // Log userId for debugging
  try {
    const db = await getDBConnection();
    const user = await db.get('SELECT * FROM User WHERE id = ?', [userId]);
    if (!user) {
      console.log(`User not found for userId: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }
    console.log(`User found: ${user.email}`);
    const listings = await db.all(`
      SELECT Listings.*, User.email AS sellerEmail
      FROM Listings
      JOIN User ON Listings.userId = User.id
      WHERE Listings.userId = ?
    `, [userId]);
    console.log(`Found ${listings.length} listings for userId: ${userId}`);
    res.json({ user, listings });
  } catch (err) {
    console.error(`Error fetching account details for userId: ${userId}`, err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Checks if the specified item is available for purchase.
 * This endpoint retrieves the sale status of an item by its ID.
 * 
 * @param {Request} req - The Express request object, containing the item's ID.
 * @param {Response} res - The Express response object, which will return the item's availability.
 */
app.get('/check-item/:id', async (req, res) => {
  const itemId = req.params.id;
  try {
    const db = await getDBConnection();
    const item = await db.get('SELECT isSold FROM Listings WHERE id = ?', [itemId]);
    if (!item) {
      console.log(`Item with ID ${itemId} not found`);
      res.status(404).json({ error: 'Item not found' });
    } else if (item.isSold === 1) { // Check if isSold is 1 (sold)
      console.log(`Item with ID ${itemId} is already sold`);
      res.json({ available: false });
    } else {
      res.json({ available: true });
    }
  } catch (err) {
    console.error(`Failed to check item availability for item ID ${itemId}`, err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/**
 * Starts the Express server on the specified port.
 * @param {number} PORT - The port number to listen on.
 */
const PORT = process.env.PORT || 8000;
app.listen(PORT);