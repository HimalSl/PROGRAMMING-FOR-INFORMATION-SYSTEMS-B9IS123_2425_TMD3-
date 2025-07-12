const BusModification = require('../models/BusModification');
const Bus = require('../models/Bus');
const Booking = require('../models/Booking');
const transporter = require('../config/email');


// when the driver requests a bus modification this function will be triggered
exports.requestBusModification = async (req, res) => {
    try {
        const { busId, type, newStartTime } = req.body;
        const driverId = req.user._id;

        if (!busId || !type || (type === 'update' && !newStartTime)) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const bus = await Bus.findById(busId);
        if (!bus) {
            return res.status(404).json({ message: 'Bus not found' });
        }

        if (bus.driver.toString() !== driverId.toString()) {
            return res.status(403).json({ message: 'Not authorized to modify this bus' });
        }

        const modification = new BusModification({
            busId,
            driverId,
            type,
            newStartTime: type === 'update' ? newStartTime : undefined,
            status: 'pending'
        });

        await modification.save();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: req.user.email,
            subject: 'Mathew Coach Hire Bus Booking System - Bus Modification Request Submitted',
            html: `
                <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #06528b;">Modification Request Submitted</h2>
                    <p>Hello ${req.user.name},</p>
                    <p>Your request to ${type === 'update' ? 'update the start time of' : 'remove'} bus ${bus.busNumber} has been submitted.</p>
                    <p>You will be notified once the admin reviews your request.</p>
                    <p>Best regards,<br>Mathew Coach Hire Bus Booking Team</p>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.error('Modification request email failed:', emailError);
        }

        res.status(201).json({ message: 'Modification request submitted' });
    } catch (error) {
        console.error('Request bus modification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all pending bus modifications for admin review
exports.getBusModifications = async (req, res) => {
    try {
        const modifications = await BusModification.find({ status: 'pending' })
            .populate('busId', 'busNumber startLocation endLocation startTime')
            .populate('driverId', 'name email');
        res.json(modifications);
    } catch (error) {
        console.error('Get bus modifications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Approve or reject a bus modification request
exports.approveBusModification = async (req, res) => {
    try {
        const { id } = req.params;
        const modification = await BusModification.findById(id).populate('busId driverId');
        if (!modification) {
            return res.status(404).json({ message: 'Modification request not found' });
        }

        if (modification.status !== 'pending') {
            return res.status(400).json({ message: 'Modification already processed' });
        }

        const bus = await Bus.findById(modification.busId._id);
        if (!bus) {
            return res.status(404).json({ message: 'Bus not found' });
        }

        // Fetch all active bookings for the bus
        const bookings = await Booking.find({ 
            bus: modification.busId._id, 
            status: 'active' 
        }).populate('passenger', 'name email');

        if (modification.type === 'update') {
            await Bus.findByIdAndUpdate(modification.busId._id, {
                startTime: modification.newStartTime,
                updatedAt: new Date()
            });

            // Send email to passengers about time change
            for (const booking of bookings) {
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: booking.passenger.email,
                    subject: 'Mathew Coach Hire Bus Booking System - Bus Start Time Updated',
                    html: `
                        <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #06528b;">Bus Schedule Update</h2>
                            <p>Hello ${booking.passenger.name},</p>
                            <p>The start time for your booked bus ${bus.busNumber} from Dublin to ${bus.endLocation} has been updated.</p>
                            <p><strong>New Start Time:</strong> ${new Date(modification.newStartTime).toLocaleString()}</p>
                            <p>Please plan your journey accordingly.</p>
                            <p>Best regards,<br>Mathew Coach Hire Bus Booking Team</p>
                        </div>
                    `
                };

                try {
                    await transporter.sendMail(mailOptions);
                } catch (emailError) {
                    console.error(`Failed to send time update email to ${booking.passenger.email}:`, emailError);
                }
            }
        } else if (modification.type === 'remove') {
            // Update bookings to cancelled status
            await Booking.updateMany(
                { bus: modification.busId._id, status: 'active' },
                { status: 'cancelled' }
            );

            // Send cancellation email to passengers
            for (const booking of bookings) {
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: booking.passenger.email,
                    subject: 'Mathew Coach Hire Bus Booking System - Bus Cancellation Notice',
                    html: `
                        <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #dc3545;">Bus Cancellation</h2>
                            <p>Hello ${booking.passenger.name},</p>
                            <p>We regret to inform you that bus ${bus.busNumber} from Dublin to ${bus.endLocation}, scheduled for ${new Date(bus.startTime).toLocaleString()}, has been cancelled.</p>
                            <p>We apologize for any inconvenience this may cause. Please contact our support team for assistance or to rebook on another bus.</p>
                            <p>Best regards,<br>Mathew Coach Hire Bus Booking Team</p>
                        </div>
                    `
                };

                try {
                    await transporter.sendMail(mailOptions);
                } catch (emailError) {
                    console.error(`Failed to send cancellation email to ${booking.passenger.email}:`, emailError);
                }
            }

            // Remove the bus
            await Bus.findByIdAndDelete(modification.busId._id);
        }

        modification.status = 'approved';
        await modification.save();

        // Notify driver of approval
        const driverMailOptions = {
            from: process.env.EMAIL_USER,
            to: modification.driverId.email,
            subject: 'Mathew Coach Hire Bus Booking System - Bus Modification Approved',
            html: `
                <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #28a745;">Modification Approved</h2>
                    <p>Hello ${modification.driverId.name},</p>
                    <p>Your request to ${modification.type === 'update' ? 'update the start time of' : 'remove'} bus ${modification.busId.busNumber} has been approved.</p>
                    ${modification.type === 'update' ? `
                        <p><strong>New Start Time:</strong> ${new Date(modification.newStartTime).toLocaleString()}</p>
                    ` : ''}
                    <p>Best regards,<br>Mathew Coach Hire Bus Booking Team</p>
                </div>
            `
        };

        try {
            await transporter.sendMail(driverMailOptions);
        } catch (emailError) {
            console.error('Modification approval email to driver failed:', emailError);
        }

        res.json({ message: 'Modification approved' });
    } catch (error) {
        console.error('Approve bus modification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Reject a bus modification request
exports.rejectBusModification = async (req, res) => {
    try {
        const { id } = req.params;
        const modification = await BusModification.findById(id).populate('busId driverId');
        if (!modification) {
            return res.status(404).json({ message: 'Modification request not found' });
        }

        if (modification.status !== 'pending') {
            return res.status(400).json({ message: 'Modification already processed' });
        }

        modification.status = 'rejected';
        await modification.save();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: modification.driverId.email,
            subject: 'Mathew Coach Hire Bus Booking System - Bus Modification Rejected',
            html: `
                <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #dc3545;">Modification Rejected</h2>
                    <p>Hello ${modification.driverId.name},</p>
                    <p>Your request to ${modification.type === 'update' ? 'update the start time of' : 'remove'} bus ${modification.busId.busNumber} has been rejected.</p>
                    <p>Please contact support for more details.</p>
                    <p>Best regards,<br>Mathew Coach Hire Bus Booking Team</p>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.error('Modification rejection email failed:', emailError);
        }

        res.json({ message: 'Modification rejected' });
    } catch (error) {
        console.error('Reject bus modification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};