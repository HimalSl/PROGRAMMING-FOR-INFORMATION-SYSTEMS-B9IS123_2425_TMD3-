const User = require('../models/User');
const Bus = require('../models/Bus');
const Booking = require('../models/Booking');
const Location = require('../models/Location');
const transporter = require('../config/email');
const crypto = require('crypto');

// admin dashboard loading
exports.getDashboard = async (req, res) => {
    try {
        const passengerCount = await User.countDocuments({ role: 'passenger', isVerified: true });
        const approvedDriverCount = await User.countDocuments({ role: 'driver', isApproved: true });
        const pendingDrivers = await User.find({ 
            role: 'driver', 
            isApproved: false 
        }).select('name email phone createdAt');
        const pendingBuses = await Bus.find({ isApproved: false })
            .populate('driver', 'name email');
        const totalBookings = await Booking.countDocuments({ status: 'active' });

        res.json({
            passengerCount,
            approvedDriverCount,
            pendingDrivers,
            pendingBuses,
            totalBookings
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ message: 'Failed to load dashboard' });
    }
};

// After the admin approves a driver, system send an email to the driver
exports.approveDriver = async (req, res) => {
    try {
        const { driverId } = req.params;

        const driver = await User.findById(driverId);
        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        if (driver.role !== 'driver') {
            return res.status(400).json({ message: 'User is not a driver' });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');
        driver.verificationToken = verificationToken;
        driver.isApproved = true;
        await driver.save();

        const verificationLink = `http://localhost:5000/api/auth/verify-email?token=${verificationToken}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: driver.email,
            subject: '>Mathew Coach Hire Bus Booking System - Driver Application Approved',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #28a745;">Congratulations!</h2>
                    <p>Hello ${driver.name},</p>
                    <p>Great news! Your driver application has been approved by our admin team.</p>
                    <p>Please click the button below to verify your email address and activate your account Otherwise you cannot log in to the account:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationLink}" 
                           style="background-color: #28a745; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            Verify Email Address
                        </a>
                    </div>
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p>${verificationLink}</p>
                    <p>After verifying your email, you can log in to your BusBook driver account.</p>
                    <p>Welcome to the BusBook Mathew Coach Hire community!</p>
                    <p>Best regards,<br>Mathew Coach Hire Bus Booking Team</p>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.error('Approval email failed:', emailError);
        }

        res.json({ message: 'Driver approved successfully' });
    } catch (error) {
        console.error('Driver approval error:', error);
        res.status(500).json({ message: 'Failed to approve driver' });
    }
};

// Reject driver process also sending a email to the driver
exports.rejectDriver = async (req, res) => {
    try {
        const { driverId } = req.params;

        const driver = await User.findById(driverId);
        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: driver.email,
            subject: 'Mathew Coach Hire Bus Booking system - Driver Application Update',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #dc3545;">Application Update</h2>
                    <p>Hello ${driver.name},</p>
                    <p>Thank you for your interest in becoming a Mathew Coach Hire Bus Booking driver.</p>
                    <p>After careful review, we regret to inform you that your driver application has not been approved at this time.</p>
                    <p>This decision may be due to various factors including documentation requirements or current driver capacity.</p>
                    <p>You're welcome to reapply in the future when circumstances change.</p>
                    <p>Thank you for your understanding.</p>
                    <p>Best regards,<br>>Mathew Coach Hire Bus Booking Team</p>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.error('Rejection email failed:', emailError);
        }

        await User.findByIdAndDelete(driverId);

        res.json({ message: 'Driver application rejected' });
    } catch (error) {
        console.error('Driver rejection error:', error);
        res.status(500).json({ message: 'Failed to reject driver' });
    }
};

// when a driver added a bus the bus request need to be approved by the admin
exports.approveBus = async (req, res) => {
    try {
        const { busId } = req.params;

        const bus = await Bus.findById(busId).populate('driver');
        if (!bus) {
            return res.status(404).json({ message: 'Bus not found' });
        }

        bus.isApproved = true;
        await bus.save();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: bus.driver.email,
            subject: 'Mathew Coach Hire Bus Booking System - Bus Approved',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #28a745;">Bus Approved!</h2>
                    <p>Hello ${bus.driver.name},</p>
                    <p>Your bus (${bus.busNumber}) has been approved and is now available for booking.</p>
                    <p>Best regards,<br>Mathew Coach Hire Bus Booking Team</p>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.error('Bus approval email failed:', emailError);
        }

        res.json({ message: 'Bus approved successfully' });
    } catch (error) {
        console.error('Bus approval error:', error);
        res.status(500).json({ message: 'Failed to approve bus' });
    }
};

// If the bus approval reject by the admin below functionality will happen
exports.rejectBus = async (req, res) => {
    try {
        const { busId } = req.params;

        const bus = await Bus.findById(busId).populate('driver');
        if (!bus) {
            return res.status(404).json({ message: 'Bus not found' });
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: bus.driver.email,
            subject: 'Mathew Coach Hire Bus Booking System - Bus Rejected',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #dc3545;">Bus Rejected</h2>
                    <p>Hello ${bus.driver.name},</p>
                    <p>Your bus (${bus.busNumber}) has not been approved at this time.</p>
                    <p>Please review the requirements and resubmit if necessary.</p>
                    <p>Best regards,<br>Mathew Coach Hire Bus Booking Team</p>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.error('Bus rejection email failed:', emailError);
        }

        await Bus.findByIdAndDelete(busId);
        res.json({ message: 'Bus rejected successfully' });
    } catch (error) {
        console.error('Bus rejection error:', error);
        res.status(500).json({ message: 'Failed to reject bus' });
    }
};

// Admins can add only a end location because are start from dublin
exports.addLocation = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'End location name is required' });
        }

        const location = new Location({ name });
        await location.save();
        res.status(201).json({ message: 'End location added successfully' });
    } catch (error) {
        console.error('Add end location error:', error);
        res.status(500).json({ message: 'Failed to add end location' });
    }
};

// admins can see the end location they added in the admin dashboard
exports.getLocations = async (req, res) => {
    try {
        const locations = await Location.find();
        res.json(locations);
    } catch (error) {
        console.error('Get end locations error:', error);
        res.status(500).json({ message: 'Failed to fetch end locations' });
    }
};

// admins can delete the end locations
exports.deleteLocation = async (req, res) => {
    try {
        const { locationId } = req.params;
        await Location.findByIdAndDelete(locationId);
        res.json({ message: 'End location deleted successfully' });
    } catch (error) {
        console.error('Delete end location error:', error);
        res.status(500).json({ message: 'Failed to delete end location' });
    }
};

// admins can see the analytics of the system
exports.getAnalytics = async (req, res) => {
    try {
        const totalPassengers = await User.countDocuments({ role: 'passenger', isVerified: true });
        const totalDrivers = await User.countDocuments({ role: 'driver', isApproved: true });
        const totalBuses = await Bus.countDocuments({ isApproved: true });
        const totalBookings = await Booking.countDocuments({ status: 'active' });
        const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });

        res.json({
            totalPassengers,
            totalDrivers,
            totalBuses,
            totalBookings,
            cancelledBookings
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ message: 'Failed to fetch analytics' });
    }
};