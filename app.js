const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());

// Create a MySQL connection
const connection = mysql.createConnection({
  host: 'localhost', // Change to your database host
  user: 'root', // Change to your MySQL username
  password: 'Sfl965!!', // Change to your MySQL password
  database: 'healthmate', // Change to your database name
});

// Connect to the MySQL database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Define an API endpoint to retrieve user data
app.get('/api/users', (req, res) => {
  const sql = 'SELECT * FROM users'; // Replace 'your_table' with your table name

  // Execute the SQL query
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error querying data:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    // Send the query results as a JSON response
    res.json(results);
  });
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

/// login post api

app.post('/api/login',(req,res) =>{
  const { email, password } = req?.body;
  const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
  connection.query(sql, [email, password], (err, results) => {
    if (err) {
      console.error('Error querying data:', err);
      console.log(req.body)
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    if (results.length === 1) {
      // User found and password matches
      res.json({ message: 'Login successful' });
    } else {
      // User not found or password doesn't match
      res.status(401).json({ error: 'Invalid credentials' });
    }
})
});

app.post('/api/signup', (req, res) => {
  const { firstName, lastName, phone, email, password } = req.body;
  const sql = 'INSERT INTO users (first_name, last_name, phone, email, password) VALUES (?, ?, ?, ?, ?)';
  connection.query(sql, [firstName, lastName, phone, email, password], (err, results) => {
    if (err) {
      console.error('Error querying data:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    // Check if the INSERT was successful (no error)
    if (!err) {
      res.json({ message: 'signup successful' });
    } else {
      res.status(401).json({ error: 'error in signing up' });
    }
  });
});

