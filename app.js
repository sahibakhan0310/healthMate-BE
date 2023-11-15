const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
//const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const port=3000
// const server = app.listen(0, () => {
//   const port = server.address().port;
//   console.log(`Server is running on port ${port}`);
// });

app.use(cors());
app.use(express.json());
const crypto = require('crypto');

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
  const user_id = req.query.user_id;
  if (!user_id) {
    // Handle the case where user_id is missing
    res.status(400).json({ error: 'user_id parameter is required' });
    return;
  }

  // Modify the SQL query to retrieve user details for the specified user_id
  const sql = 'SELECT * FROM users WHERE user_id = ?';

  // Execute the SQL query with the user_id parameter
  connection.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error('Error querying data:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    if (results.length === 0) {
      // Handle the case where no user with the specified user_id is found
      res.status(404).json({ error: 'User not found' });
    } else {
      // Send the query results as a JSON response
      res.json(results[0]); // Assuming you expect only one user to match the user_id
    }
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
        
        // Compare the submitted password with the stored password
        if (password === user.password) {
          // Passwords match, generate a JWT token for authentication
          const token = jwt.sign({ userId: user.id }, 'your-secret-key', { expiresIn: '1h' });
          res.json({ message: 'Login successful', token, user_id:user.user_id });
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

  const sqlCheck = 'SELECT * FROM users WHERE email = ?';
  const sqlInsert = 'INSERT INTO users (first_name, last_name, phone, email, password) VALUES (?, ?, ?, ?, ?)';

  try {
    // Check if a user with the same email already exists
    const existingUser = await new Promise((resolve, reject) => {
      connection.query(sqlCheck, [email], (err, results) => {
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

    // Insert the user data, including the plain password, into the database
    const insertResult = await new Promise((resolve, reject) => {
      connection.query(sqlInsert, [firstName, lastName, phone, email, password], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    if (insertResult.affectedRows === 1) {
      // Registration successful, fetch user details
      const userDetails = await new Promise((resolve, reject) => {
        connection.query(sqlCheck, [email], (err, results) => {
          if (err) {
            reject(err);
          } else {
            resolve(results[0]);
          }
        });
      });
console.log("here",userDetails)
      // Return user details in the response
      res.json({ message: 'Signup successful', user: userDetails });
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
  const { user_id, height, weight, step, waterReminder } = req.body;
  console.log(step);
  console.log(waterReminder);
  console.log(req.body);

  // Check if user_id exists in user_details table
  const sqlSelect = 'SELECT * FROM user_details WHERE user_id = ?';

  connection.query(sqlSelect, [user_id], (selectErr, selectResults) => {
    console.log('Select Results:', selectResults);
    console.log('Select Error:', selectErr);

    if (selectErr) {
      console.error('Error checking user_id:', selectErr);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      if (selectResults.length === 0) {
        // User ID not found, perform insert
        const sqlInsert = 'INSERT INTO user_details (user_id, height, weight, step_count, water_reminder) VALUES (?, ?, ?, ?, ?)';

        connection.query(sqlInsert, [user_id, height, weight, step, waterReminder], (insertErr, insertResults) => {
          console.log('Insert Results:', insertResults);
          console.log('Insert Error:', insertErr);

          if (insertErr) {
            console.error('Error inserting data:', insertErr);
            res.status(500).json({ error: 'Internal server error' });
          } else {
            // Check if any rows were affected (1 row should be affected for a successful insert)
            if (insertResults.affectedRows === 1) {
              console.log('Insert successful');
              res.json({ message: 'Insert successful' });
            } else {
              res.status(500).json({ error: 'Error in inserting data' });
            }
          }
        });
      } else {
        // User ID found, perform update
        const sqlUpdate = 'UPDATE user_details SET height = ?, weight = ?, step_count = ?, water_reminder = ? WHERE user_id = ?';

        connection.query(sqlUpdate, [height, weight, step, waterReminder, user_id], (updateErr, updateResults) => {
          console.log('Update Results:', updateResults);
          console.log('Update Error:', updateErr);

          if (updateErr) {
            console.error('Error updating data:', updateErr);
            res.status(500).json({ error: 'Internal server error' });
          } else {
            // Check if any rows were affected (1 row should be affected for a successful update)
            if (updateResults.affectedRows === 1) {
              console.log('Update successful');
              res.json({ message: 'Update successful' });
            } else {
              res.status(404).json({ error: 'User not found or no changes were made' });
            }
          }
        });
      }
    }
  });
});



// Define an API endpoint to retrieve user deatils
app.get('/api/userdetails', (req, res) => {
  // Extract the user_id from the query parameters
  const user_id = req.query.user_id;
  if (!user_id) {
    // Handle the case where user_id is missing
    res.status(400).json({ error: 'user_id parameter is required' });
    return;
  }

  // Modify the SQL query to retrieve user details and user's first name and last name
  const sql = 'SELECT user_details.*, users.first_name, users.last_name ' +
              'FROM user_details ' +
              'JOIN users ON user_details.user_id = users.user_id ' +
              'WHERE user_details.user_id = ?';

  // Execute the SQL query with the user_id parameter
  connection.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error('Error querying data:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    if (results.length === 0) {
      // Handle the case where no user with the specified user_id is found
      res.status(404).json({ error: 'User not found' });
    } else {
      // Send the query results as a JSON response
      res.json(results[0]); // Assuming you expect only one user to match the user_id
    }
  });
});

// Define an API endpoint to store step count data
app.post('/api/stepcount', (req, res) => {
  const { user_id, date, steps } = req.body;

  if (!user_id || !date || steps === undefined) {
    res.status(400).json({ error: 'user_id, date, and steps parameters are required' });
    return;
  }

  // Modify the SQL query to insert step count data into the database
  const sql = 'INSERT INTO Activity (user_id, date, steps) VALUES (?, ?, ?)';

  // Execute the SQL query with the provided parameters
  connection.query(sql, [user_id, date, steps], (err, results) => {
    if (err) {
      console.error('Error inserting step count data:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      // Insert successful, no need to check results.affectedRows
      res.json({ message: 'Step count data inserted successfully' });
    }
  });
});

// Define an API endpoint to retrieve activity data by user_id
app.get('/api/activity', (req, res) => {
  const user_id = req.query.user_id;

  if (!user_id) {
    res.status(400).json({ error: 'user_id parameter is required' });
    return;
  }

  // Modify the SQL query to retrieve activity data for the specified user_id
  const sql = 'SELECT * FROM Activity WHERE user_id = ?';

  // Execute the SQL query with the user_id parameter
  connection.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error('Error querying activity data:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json(results);
    }
  });
});


// Define an API endpoint to retrieve activity data by user_id
app.get('/api/water_reminder', (req, res) => {
  const user_id = req.query.user_id;

  if (!user_id) {
    res.status(400).json({ error: 'user_id parameter is required' });
    return;
  }

  // Modify the SQL query to retrieve water data for the specified user_id
  const sql = 'SELECT * FROM water_reminder WHERE user_id = ?';

  // Execute the SQL query with the user_id parameter
  connection.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error('Error querying activity data:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json(results);
    }
  });
});

// Define an API endpoint to store water data
app.post('/api/set_water_reminder', (req, res) => {
  const { user_id, intake_limit } = req.body;

  if (!user_id || intake_limit === undefined) {
    res.status(400).json({ error: 'user_id, intake_limit parameters are required' });
    return;
  }

  // Modify the SQL query to insert step count data into the database
  const sql = 'INSERT INTO water_reminder (user_id, intake_target) VALUES (?, ?)';

  // Execute the SQL query with the provided parameters
  connection.query(sql, [user_id, intake_limit], (err, results) => {
    if (err) {
      console.error('Error inserting water reminder:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      // Insert successful, no need to check results.affectedRows
      res.json({ message: 'water data inserted successfully' });
    }
  });
});

app.post('/api/add_water_intake', (req, res) => {
  const { user_id, current_intake } = req.body;
  console.log(req.body);

  connection.query(
    'UPDATE water_reminder SET current_intake = COALESCE(current_intake, 0) + ? WHERE user_id = ?',
    [current_intake, user_id],
    (error, results) => {
      console.log('Query executed:', results); // Log the results for debugging

      if (error) {
        console.error('Error adding water intake:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        res.status(200).json({ message: 'Water intake added successfully.' });
      }
    }
  );
});

// if (process.env.NODE_ENV !== 'test') {
//   // Start the server only if not in test environment
//   app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
//   });
// }

