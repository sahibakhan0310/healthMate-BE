const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());

const saltRounds = 10;

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

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Retrieve the user from the database by email
    connection.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) {
        console.error('Error querying data:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }

      if (results.length === 1) {
        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
          // Generate a JWT token for authentication
          const token = jwt.sign({ userId: user.id }, 'your-secret-key', { expiresIn: '1h' });

          res.json({ message: 'Login successful', token });
        } else {
          res.status(401).json({ error: 'Invalid credentials' });
        }
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/signup', async (req, res) => {
  const { firstName, lastName, phone, email, password } = req.body;
  const sql_check = 'SELECT * FROM users WHERE email = ?';

  try {
    // Check if a user with the same email already exists
    const existingUser = await new Promise((resolve, reject) => {
      connection.query(sql_check, [email], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0]);
        }
      });
    });

    if (existingUser) {
      // User with the same email already exists
      return res.status(409).json({ error: 'User already exists' });
    }

    // User does not exist, proceed with registration
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const sql = 'INSERT INTO users (first_name, last_name, phone, email, password) VALUES (?, ?, ?, ?, ?)';

    // Insert the user data into the database
    const insertResult = await new Promise((resolve, reject) => {
      connection.query(sql, [firstName, lastName, phone, email, hashedPassword], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    if (insertResult.affectedRows === 1) {
      // Registration successful
      res.json({ message: 'Signup successful' });
    } else {
      res.status(500).json({ error: 'Error in signing up' });
    }
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// user details api

app.post('/api/details', (req, res) => {
  const { user_id,height, weight, steps, water_reminder } = req?.body;
  const sql = 'INSERT INTO user_details (height, weight, steps, water_reminder) VALUES (?, ?, ?, ?)';
  connection.query(sql, [user_id,height, weight, steps, water_reminder], (err, results) => {
    if (err) {
      console.error('Error inserting data:', err);
      console.log(req.body);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      // Insert successful, no need to check results.length
      res.json({ message: 'Insert successful' });
    }
  });
});

