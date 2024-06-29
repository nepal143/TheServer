const express = require('express');
const router = express.Router();
const User = require('./models/User');
const twilio = require('twilio');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
// Load environment variables from .env file
dotenv.config();

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const mongoUri = process.env.MONGODB_URI;

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // Example: Increase timeout to 30 seconds
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// User registration
router.post('/register', async (req, res) => {
  try {
    const { username, phoneNumber, password } = req.body;

    // Check if user with the same phone number already exists
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).send('User with this phone number already exists');
    }

    // Generate a unique verification code for each user
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Generate a unique userId
    const userId = require('crypto').randomBytes(16).toString("hex");

    // Create a new user instance
    const newUser = new User({
      userId,
      username,
      phoneNumber,
      password,
      verificationCode,
    });

    // Save the user to MongoDB
    await newUser.save();

    // Send verification code via Twilio SMS
    await twilioClient.messages.create({
      body: `Your verification code is ${verificationCode}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    // Handle response
    res.status(200).send({ userId, verificationCode });

  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).send(error.message || 'Error during registration');
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { phoneNumber, verificationCode } = req.body;

    const user = await User.findOne({ phoneNumber: phoneNumber });
    if (user) {
      if (verificationCode === user.verificationCode) {
        user.isVerified = true;
        await user.save();
        res.status(200).send('Phone number verified successfully');
      } else {
        res.status(401).send('Invalid verification code');
      }
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    console.error('Error during verification:', error); 
    res.status(500).send(error);
  }
});

module.exports = router;
