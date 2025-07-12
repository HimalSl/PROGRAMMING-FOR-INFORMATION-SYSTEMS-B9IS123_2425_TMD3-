const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
    busNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startLocation: {
        type: String,
        default: 'Dublin'
    },
    endLocation: {
        type: String,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    maxSeats: {
        type: Number,
        required: true,
        min: 1
    },
    availableSeats: {
        type: Number,
        required: true,
        min: 0
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Bus', busSchema);