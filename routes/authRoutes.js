const express = require('express');
const router = express.Router();
const { registerCustomer, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerCustomer);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

module.exports = router;
