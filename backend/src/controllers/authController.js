
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const transporter = require('../config/email');
const { secret, expiresIn } = require('../config/jwt');


// Register new user
exports.register = async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;

        // Validate input
        if (!name || !email || !password || !phone || !role) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create verification token only for passengers
        const verificationToken = role === 'passenger' ? crypto.randomBytes(32).toString('hex') : null;

        // Create new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            phone,
            role,
            verificationToken,
            isVerified: role === 'passenger' ? false : role === 'driver' ? false : true,
            isApproved: role === 'driver' ? false : true
        });

        const savedUser = await newUser.save();

        // Send verification email only for passengers
        if (role === 'passenger') {
            const verificationLink = `http://localhost:5000/api/auth/verify-email?token=${verificationToken}`;
            
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Mathew Coach Hire Bus Booking - Verify Your Email',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #06528b;">Welcome to Mathew Coach Hire Bus Booking system!</h2>
                        <p>Hello ${name},</p>
                        <p>Thank you for registering with Mathew Coach Hire Bus Booking system. Please click the button below to verify your email address otherwise you cannot access the system:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verificationLink}" 
                               style="background-color: #06528b; color: white; padding: 12px 30px; 
                                      text-decoration: none; border-radius: 5px; display: inline-block;">
                                Verify Email Address
                            </a>
                        </div>
                        <p>If the button doesn't work, copy and paste this link into your browser:</p>
                        <p>${verificationLink}</p>
                        <p>Best regards,<br>The BusBook Team</p>
                    </div>
                `
            };

            try {
                await transporter.sendMail(mailOptions);
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
            }
        }

        res.status(201).json({
            message: role === 'passenger' 
                ? 'Registration successful! Please check your email to verify your account.'
                : 'Driver registration submitted! Please wait for admin approval.',
            userId: savedUser._id
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Registration failed. Please try again.' });
    }
};

// Email verification
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ message: 'Verification token required' });
        }

        const user = await User.findOne({ verificationToken: token });
        if (!user) {
            return res.status(400).json({ message: 'The email has been already verified' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.json({ message: 'Email verified successfully!' });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ message: 'Verification failed' });
    }
};


// Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Authentication failed. Invalid email or password.' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Authentication failed. Invalid email or password.' });
        }

        // Check if user is verified (for passengers and drivers)
        
        // Check if driver is approved
        if (user.role === 'driver' && !user.isApproved) {
            return res.status(401).json({ message: 'Your driver application is pending admin approval.' });
        }

        if ((user.role === 'passenger' || user.role === 'driver') && !user.isVerified) {
            return res.status(401).json({ message: 'Please verify your email address before logging in.' });
        }

        

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            secret,
            { expiresIn }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed. Please try again.' });
    }
};

// Create admin (one-time setup)
exports.createAdmin = async (req, res) => {
    try {
        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
            return res.status(400).json({ message: 'Admin user already exists' });
        }

        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        const admin = new User({
            name: 'System Administrator',
            email: 'nemsararanaba14@gmail.com',
            password: hashedPassword,
            phone: '1234567890',
            role: 'admin',
            isVerified: true,
            isApproved: true
        });

        await admin.save();
        res.json({ 
            message: 'Admin user created successfully',
            credentials: {
                email: 'nemsararanaba14@gmail.com',
                password: 'admin123'
            }
        });

    } catch (error) {
        console.error('Admin creation error:', error);
        res.status(500).json({ message: 'Failed to create admin user' });
    }
};