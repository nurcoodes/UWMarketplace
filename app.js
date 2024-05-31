const express = require('express');
const app = express();

const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
const multer = require('multer');

// Middleware for parsing request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(multer().none());

// Serve static files from the 'public' directory
app.use(express.static('public'));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});