const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
    startLocation: {
        type: String,
        required: true,
        trim: true
    },
    endLocation: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Route', routeSchema);