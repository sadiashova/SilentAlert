const express = require('express');
const router = express.Router();
const { register, login, demoLogin, firebaseSync, getMe, updateProfile, updatePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/demo-login', demoLogin);
router.post('/firebase-sync', firebaseSync);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);

module.exports = router;

