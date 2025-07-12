const Bus = require('../models/Bus');
const Booking = require('../models/Booking');
const Location = require('../models/Location');

// Add new bus (Driver)
exports.addBus = async (req, res) => {
    try {
        const { busNumber, endLocation, startTime, maxSeats } = req.body;

        if (!busNumber || !endLocation || !startTime || !maxSeats) {
            return res.status(400).json({ message: 'Bus number, end location, start time, and max seats are required' });
        }

        if (req.user.role !== 'driver') {
            return res.status(403).json({ message: 'Only drivers can add buses' });
        }

        const bus = new Bus({
            busNumber,
            driver: req.user._id,
            startLocation: 'Dublin',
            endLocation,
            startTime,
            maxSeats,
            availableSeats: maxSeats,
            isApproved: false
        });

        await bus.save();
        res.status(201).json({ message: 'Bus added successfully, awaiting admin approval' });
    } catch (error) {
        console.error('Add bus error:', error);
        res.status(500).json({ message: 'Failed to add bus' });
    }
};

// Update bus (Driver)
exports.updateBus = async (req, res) => {
    try {
        const { busId } = req.params;
        const { busNumber, endLocation, startTime, maxSeats } = req.body;

        const bus = await Bus.findById(busId);
        if (!bus) {
            return res.status(404).json({ message: 'Bus not found' });
        }

        if (bus.driver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this bus' });
        }

        bus.busNumber = busNumber || bus.busNumber;
        bus.endLocation = endLocation || bus.endLocation;
        bus.startTime = startTime || bus.startTime;
        bus.maxSeats = maxSeats || bus.maxSeats;
        bus.availableSeats = maxSeats ? maxSeats : bus.availableSeats;
        bus.isApproved = false; // Reset approval status

        await bus.save();
        res.json({ message: 'Bus updated successfully, awaiting admin approval' });
    } catch (error) {
        console.error('Update bus error:', error);
        res.status(500).json({ message: 'Failed to update bus' });
    }
};

// Delete bus (Driver)
exports.deleteBus = async (req, res) => {
    try {
        const { busId } = req.params;

        const bus = await Bus.findById(busId);
        if (!bus) {
            return res.status(404).json({ message: 'Bus not found' });
        }

        if (bus.driver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this bus' });
        }

        await Bus.findByIdAndDelete(busId);
        res.json({ message: 'Bus deletion requested, awaiting admin approval' });
    } catch (error) {
        console.error('Delete bus error:', error);
        res.status(500).json({ message: 'Failed to delete bus' });
    }
};

// Get all locations
exports.getLocations = async (req, res) => {
    try {
        const locations = await Location.find();
        res.json(locations);
    } catch (error) {
        console.error('Get locations error:', error);
        res.status(500).json({ message: 'Failed to fetch locations' });
    }
};

// Get driver's buses
exports.getDriverBuses = async (req, res) => {
    try {
        const buses = await Bus.find({ driver: req.user._id });
        res.json(buses);
    } catch (error) {
        console.error('Get driver buses error:', error);
        res.status(500).json({ message: 'Failed to fetch buses' });
    }
};

// Get driver booking history
exports.getDriverBookingHistory = async (req, res) => {
    try {
        const buses = await Bus.find({ driver: req.user._id });
        const busIds = buses.map(bus => bus._id);
        const bookings = await Booking.find({ bus: { $in: busIds } })
            .populate('passenger', 'name email')
            .populate('bus', 'busNumber startLocation endLocation startTime');
        res.json(bookings);
    } catch (error) {
        console.error('Driver booking history error:', error);
        res.status(500).json({ message: 'Failed to fetch booking history' });
    }
};