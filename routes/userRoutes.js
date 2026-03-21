const express = require('express');
const router = express.Router();
const { createUser, getUsers, updateUserRole, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes here require Admin role
router.use(protect);
router.use(authorize('admin'));

router.post('/', createUser);
router.get('/', getUsers);
router.put('/:id/role', updateUserRole);
router.delete('/:id', deleteUser);

module.exports = router;
