const Bus = require('../models/Bus');
const Booking = require('../models/Booking');

// passengers can provide the date,time and end location and search the buses available for that route
exports.searchBuses = async (req, res) => {
    try {
        const { endLocation, date } = req.query;
        const query = {
            isApproved: true,
            availableSeats: { $gt: 0 },
            startLocation: 'Dublin'
        };

        if (endLocation) query.endLocation = endLocation;
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            query.startTime = { $gte: startOfDay, $lte: endOfDay };
        }

        const buses = await Bus.find(query);
        res.json(buses);
    } catch (error) {
        console.error('Search buses error:', error);
        res.status(500).json({ message: 'Failed to search buses' });
    }
};

// passengers can book a bus by providing number of seats that need to be reserved 
exports.bookBus = async (req, res) => {
    try {
        const { busId, seats } = req.body;

        if (!busId || !seats || seats < 1) {
            return res.status(400).json({ message: 'Bus ID and number of seats are required' });
        }

        const bus = await Bus.findById(busId);
        if (!bus || !bus.isApproved) {
            return res.status(404).json({ message: 'Bus not found or not approved' });
        }

        if (bus.availableSeats < seats) {
            return res.status(400).json({ message: `Only ${bus.availableSeats} seats available` });
        }

        const booking = new Booking({
            passenger: req.user._id,
            bus: busId,
            seatsBooked: seats
        });

        bus.availableSeats -= seats;
        await bus.save();
        await booking.save();

        res.status(201).json({ message: 'Booking successful' });
    } catch (error) {
        console.error('Book bus error:', error);
        res.status(500).json({ message: 'Failed to book bus' });
    }
};

// passengers can see there bus booking history
exports.getBookingHistory = async (req, res) => {
    try {
        const bookings = await Booking.find({ passenger: req.user._id })
            .populate('bus', 'busNumber startLocation endLocation startTime availableSeats');
        res.json(bookings);
    } catch (error) {
        console.error('Booking history error:', error);
        res.status(500).json({ message: 'Failed to fetch booking history' });
    }
};

// passengers can cancel their bus booking
exports.cancelBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.passenger.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to cancel this booking' });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({ message: 'Booking already cancelled' });
        }

        const bus = await Bus.findById(booking.bus);
        bus.availableSeats += booking.seatsBooked;
        booking.status = 'cancelled';

        await bus.save();
        await booking.save();

        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({ message: 'Failed to cancel booking' });
    }
};