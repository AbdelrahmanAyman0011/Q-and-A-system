const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');
const {
  getPendingModerators,
  updateUserStatus,
  updateUserRole,
  getAllUsers
} = require('../controllers/adminController');

router.get('/users',
  authenticateToken,
  checkRole('ADMIN'),
  getAllUsers
);

// Get all pending moderators
router.get('/moderators/pending', 
  authenticateToken,
  checkRole('ADMIN'),
  getPendingModerators
);

// Update user state (approve/reject)
router.put('/users/:userId/state',
  authenticateToken,
  checkRole('ADMIN'),
  updateUserStatus
);

// Update user role
router.put('/users/:userId/role',
  authenticateToken,
  checkRole('ADMIN'),
  updateUserRole
);

module.exports = router;
