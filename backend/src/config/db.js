const mongoose = require('mongoose');

/**
 * @function connectDB
 * @description creating a connection to the MongoDB database.
 */
const connectDB = async () => {
    try {
        // Retrieve the MongoDB connection URI from environment variables
        const uri = process.env.MONGODB_URI;

        // Check if the MONGODB_URI environment variable is defined
        if (!uri) {
            throw new Error('MONGODB_URI is not defined');
        }

        // Attempt to connect to MongoDB using the provided URI
        await mongoose.connect(uri);
        console.log('Connected to MongoDB'); 
    } catch (error) {
        // Catch any errors that occur during the connection attempt
        console.error('MongoDB connection error:', error); 
        process.exit(1); 
    }
};

// creating a event listener for when the MongoDB connection is disconnected
mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected'); 
});

// Event listener for the application termination signal 
process.on('SIGINT', async () => {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
});

module.exports = connectDB; 