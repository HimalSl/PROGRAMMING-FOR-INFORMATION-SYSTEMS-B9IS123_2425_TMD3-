const express = require('express');
const connectDB = require('./config/db');
require('dotenv').config();



// Create Express app
const app = express();

//connect to MongoDB
connectDB();


// Start server
const PORT = process.env.PORT || 5000; // if the PORT is not defined in the environment, default to 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

