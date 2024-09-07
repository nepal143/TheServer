// server.js or your routes file
const express = require('express');
const router = express.Router();
const Booking = require('./models/BookingSchema'); // Assuming you have a Booking model
const generateUniqueKey = require('./utils/generateKey'); // Import the utility function

// POST /api/bookings
router.post('/bookings', async (req, res) => {
  try {
    const { username, watchlist } = req.body;
    const key = await generateUniqueKey(); // Generate a unique key
    const newBooking = new Booking({
      username,
      watchlist,
      key,
      date: new Date(),
    });
    await newBooking.save();
    res.status(201).json({ message: 'Booking successful', booking: newBooking });
  } catch (error) {
    console.error('Error saving booking:', error);
    res.status(500).json({ message: 'Failed to book', error });
  }
});


router.get('/bookings/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const bookings = await Booking.find({ username });

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'No bookings found for this username' });
    }

    res.status(200).json({ bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Failed to fetch bookings', error });
  }
});



router.get('/bookings/key/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const booking = await Booking.findOne({ key });

    if (!booking) {
      return res.status(404).json({ message: 'No booking found with this key' });
    }

    res.status(200).json({ booking });
  } catch (error) {
    console.error('Error fetching booking by key:', error);
    res.status(500).json({ message: 'Failed to fetch booking', error });
  }
});

router.get('/watchlist/organisation/:organizationName', async (req, res) => {
  try {
    const { organizationName } = req.params;
    console.log('Received organizationName:', organizationName); // Debug

    // Query to find all documents where the organizationName matches, and return only the watchlist field
    const bookings = await Booking.find({ organizationName }, 'watchlist');
    console.log('Bookings found:', bookings); // Debug

    if (bookings.length === 0) {
      console.log('No watchlist found for this organization'); // Debug
      return res.status(404).json({ message: 'No watchlist found for this organization' });
    }

    // Extract watchlist arrays from each document and combine them
    const combinedWatchlist = bookings.reduce((acc, booking) => acc.concat(booking.watchlist), []);
    res.status(200).json({ watchlist: combinedWatchlist });
  } catch (error) {
    console.error('Error fetching watchlist by organization name:', error);
    res.status(500).json({ message: 'Failed to fetch watchlist', error });
  }
});


// PUT /api/slots/bookings/approve/:key/:propertyName/:parentPropertyName
router.put('/bookings/approve/:key/:propertyName/:parentPropertyName', async (req, res) => {
  try {
    const { key, propertyName, parentPropertyName } = req.params;
    const { approvalStatus } = req.body;

    // Validate input
    if (!approvalStatus) {
      return res.status(400).json({ message: 'Approval status is required' });
    }

    // Find the booking by its unique key
    const booking = await Booking.findOne({ key });
    if (!booking) {
      return res.status(404).json({ message: 'No booking found with this key' });
    }

    // Find and update the slot in the watchlist
    let slotUpdated = false;
    const updatedWatchlist = booking.watchlist.map(slot => {
      if (slot.propertyName === propertyName && slot.parentPropertyName === parentPropertyName) {
        slotUpdated = true;
        return { ...slot, ApprovalStatus: approvalStatus };
      }
      return slot;
    });

    if (!slotUpdated) {
      return res.status(404).json({ message: 'No slot found to update' });
    }

    // Save the updated booking
    booking.watchlist = updatedWatchlist;
    await booking.save();

    res.status(200).json({ message: 'Slot approval status updated', booking });
  } catch (error) {
    console.error('Error updating slot approval status:', error);
    res.status(500).json({ message: 'Failed to update slot approval status', error });
  }
});


module.exports = router;
