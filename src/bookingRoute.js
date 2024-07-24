const express = require('express');
const Booking = require('./models/BookingSchema');
const router = express.Router();

router.post('/booking', async (req, res) => {
  try {
    const { propertyName, parentPropertyName, date, time, username, organisationName } = req.body;

    console.log('Received booking request:', req.body);

    // Validate required fields
    if (!propertyName || !parentPropertyName || !date || !time || !username || !organisationName) {
      console.log('Missing required fields');
      return res.status(400).json({ message: 'Missing required fields' });
    } 

    // Check for existing booking
    const existingBooking = await Booking.findOne({ propertyName, parentPropertyName, date, time, username, organisationName });
    if (existingBooking) {
      console.log('Booking already exists:', existingBooking);
      return res.status(409).json({ message: 'Booking already exists' });
    }

    // Create a new booking instance
    const booking = new Booking({ propertyName, parentPropertyName, date, time, username, organisationName, status: 'confirmed' });
    await booking.save();
    
    console.log('Booking confirmed:', booking);
    res.status(200).json({ message: 'Booking confirmed', booking });
  } catch (error) {
    console.error('Error booking property:', error);
    res.status(500).json({ message: 'Failed to book property', error: error.message });
  }
});
router.get('/bookings/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const bookings = await Booking.find({ username });

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: 'No bookings found for this user' });
    }

    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error retrieving bookings:', error);
    res.status(500).json({ message: 'Failed to retrieve bookings', error: error.message });
  }
});

module.exports = router;