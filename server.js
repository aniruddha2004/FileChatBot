const express = require('express');
const bodyParser = require('body-parser');
const chatbotController = require('./chatbotController');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000; // You can change this to your desired port number

// Use the cors middleware
app.use(cors());

// Use static assets
app.use(express.static('public'));

// Middleware to parse incoming JSON data
app.use(bodyParser.json());

// Using the controllers
app.use('/api', chatbotController);

// Setting up front page route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'uploadPage.html'));
});

// Setting up chat page route
app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chatPage.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
