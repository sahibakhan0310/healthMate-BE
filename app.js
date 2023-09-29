const express = require('express');
const mysql = require('mysql2');

const app = express();
const port = 3000;

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
