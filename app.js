"use strict";
const express = require('express');
const app = express();
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
const multer = require('multer');
const crypto = require('crypto');

// Middleware for parsing request bodies
app.use(express.urlencoded({extended: true}));
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
  return Math.random().toString(36)
    .substr(2, 9);
}

/**
 * Handles user registration by inserting a new user into the database.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
app.post('/userauth/register', async (req, res) => {
  const {email, password} = req.body;
  try {
    const db = await getDBConnection();
    await db.run('INSERT INTO User (email, password) VALUES (?, ?)', [email, password]);
    res.status(201).json({message: 'User registered successfully.'});
  } catch (err) {
    console.error(err);
    res.status(500).json({error: err.message});
  }
});

/**
 * Handles user login by verifying credentials and generating a session ID.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
app.post('/userauth/login', async (req, res) => {
  const {email, password} = req.body;
  try {
    const db = await getDBConnection();
    const user = await db.get(
      'SELECT * FROM User WHERE email = ? AND password = ?', [email, password]
      );
    if (user) {
      const sessionId = generateSessionId();
      sessions[sessionId] = user.id;
      res.json({sessionId, userId: user.id});
    } else {
      res.status(401).json({error: 'Invalid email or password'});
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({error: err.message});
  }
});

/**
 * Middleware for checking if a session is valid.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {Function} next - The next middleware function.
 * @return {status} - 401 status if user is not authencated.
 */
function authMiddleware(req, res, next) {
  const sessionId = req.header('x-session-id');
  if (!sessionId || !sessions[sessionId]) {
    return res.status(401).json({error: 'Not authenticated'});
  }
  req.userId = sessions[sessionId];
  next();
}

/**
 * Handles item uploads by inserting a new listing into the database.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
app.post('/upload/item', authMiddleware, async (req, res) => {
  const {title, description, image, contact, category, price} = req.body;
  try {
    const db = await getDBConnection();
    const result = await db.run(
      'INSERT INTO Listings (title, description, image, contact, category, price, userId) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description, image, contact, category, price, req.userId]
      );
    res.status(201).json({message: 'Item successfully uploaded.', itemId: result.lastID});
  } catch (err) {
    console.error(err);
    res.status(500).json({error: err.message});
  }
});

/**
 * Retrieves items from the marketplace, optionally filtering by category.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
app.get('/marketplace', async (req, res) => {
  const {categories} = req.query;
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
    res.status(500).json({error: err.message});
  }
});

/**
 * Retrieves details of a specific listing by its ID.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
app.get('/listing/item', async (req, res) => {
  const {id} = req.query;
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
      res.status(404).json({error: 'Item not found'});
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({error: err.message});
  }
});

/**
 * Retrieves account details, including user information and listings.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
app.get('/account', authMiddleware, async (req, res) => {
  const userId = req.userId;
  try {
    const db = await getDBConnection();
    const user = await db.get('SELECT * FROM User WHERE id = ?', [userId]);
    const listings = await db.all('SELECT * FROM Listings WHERE userId = ?', [userId]);
    const purchases = await db.all(`
      SELECT Transactions.*, Listings.title AS itemTitle, Listings.image, Listings.category
      FROM Transactions
      JOIN Listings ON Transactions.itemId = Listings.id
      WHERE Transactions.buyerId = ?
    `, [userId]);

    res.json({
      user: user,
      listings: listings,
      purchases: purchases
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({error: err.message});
  }
});

/**
 * Generates a unique confirmation number.
 * @returns {string} A unique alphanumeric confirmation number.
 */
function generateConfirmationNumber() {
  return crypto.randomBytes(8).toString('hex');
}

/**
 * Records a transaction between a buyer and a seller.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
app.post('/transaction', authMiddleware, async (req, res) => {
  const {buyerId, sellerId, itemId, price} = req.body;
  const db = await getDBConnection();

  try {
    await db.run('BEGIN TRANSACTION');

    const itemCheck = await db.get('SELECT isSold FROM Listings WHERE id = ?', [itemId]);
    if (!itemCheck) {
      throw new Error('Item does not exist');
    } else if (itemCheck.isSold !== 0) {
      throw new Error('Item is already sold');
    }

    const confirmationNumber = generateConfirmationNumber();

    await db.run(
      'INSERT INTO Transactions (buyerId, sellerId, itemId, price, confirmationNumber) ' +
      'VALUES (?, ?, ?, ?, ?)',
      [buyerId, sellerId, itemId, price, confirmationNumber]
    );

    await db.run('UPDATE Listings SET isSold = 1 WHERE id = ?', [itemId]);

    await db.run('COMMIT');

    res.status(201).json({success: true, confirmationNumber: confirmationNumber});
  } catch (err) {
    await db.run('ROLLBACK');
    console.error('Transaction error:', err);
    res.status(500).json({success: false, message: 'Transaction failed: ' + err.message});
  } finally {
    await db.close();
  }
});

/**
 * Starts the Express server on the specified port.
 * @param {number} PORT - The port number to listen on.
 */
const PORT = process.env.PORT || 8000;
app.listen(PORT);