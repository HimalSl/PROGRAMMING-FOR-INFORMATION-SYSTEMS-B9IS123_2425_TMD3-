// Admin Controller for managing drivers and dashboard statistics

const User = require('../models/User');
const transporter = require('../config/email');
const crypto = require('crypto');

// Admin dashboard
exports.getDashboard = async (req, res) => {
    try {
        const passengerCount = await User.countDocuments({ role: 'passenger', isVerified: true });
        const approvedDriverCount = await User.countDocuments({ role: 'driver', isApproved: true });
        const pendingDrivers = await User.find({ 
            role: 'driver', 
            isApproved: false 
        }).select('name email phone createdAt');

        res.json({
            passengerCount,
            approvedDriverCount,
            pendingDrivers
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ message: 'Failed to load dashboard' });
    }
};

// Approve driver
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

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        driver.verificationToken = verificationToken;
        driver.isApproved = true;
        await driver.save();

        // Send approval email with verification link
        const verificationLink = `http://localhost:5000/api/auth/verify-email?token=${verificationToken}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: driver.email,
            subject: 'Mathew Coach Hire Bus Booking System - Driver Application Approved',
            html: `
                <div style="font-family: "Poppins", sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #28a745;">Congratulations!</h2>
                    <p>Hello ${driver.name},</p>
                    <p>Great news! Your driver application has been approved by our team.</p>
                    <p>Please click the button below to verify your email address and activate your account Otherwise you cannot log in to the account:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationLink}" 
                           style="background-color: #28a745; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 15px; display: inline-block;">
                            Verify Email Address
                        </a>
                    </div>
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p>${verificationLink}</p>
                    <p>After verifying your email, you can log in to your Mathew Coach Hire Bus Booking System driver account.</p>
                    <p>Welcome to the BusBook Mathew Coach Hire community!</p>
                    <p>Best regards,<br>The BusBook Team</p>
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

// Reject driver
exports.rejectDriver = async (req, res) => {
    try {
        const { driverId } = req.params;

        const driver = await User.findById(driverId);
        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        // Send rejection email
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
                    <p>This decision may be due to various factors including requirements and current driver capacity.</p>
                    <p>You're welcome to reapply in the future when circumstances are changed.</p>
                    <p>Thank you for your understanding.</p>
                    <p>Best regards,<br>Mathew Coach Hire Bus Booking System Team</p>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.error('Rejection email failed:', emailError);
        }

        // Remove the rejected driver from database
        await User.findByIdAndDelete(driverId);

        res.json({ message: 'Driver application rejected' });

    } catch (error) {
        console.error('Driver rejection error:', error);
        res.status(500).json({ message: 'Failed to reject driver' });
    }
};