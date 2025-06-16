const express = require('express');
const dotenv = require('dotenv');


// Load environment variables
dotenv.config();


// Create Express app
const app = express();


// Start server
const PORT = process.env.PORT || 5000; // if the PORT is not defined in the environment, default to 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

