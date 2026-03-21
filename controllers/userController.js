const bcrypt = require('bcrypt');
const db = require('../config/db');

// @desc    Create a new employee user
// @route   POST /api/users
// @access  Private (Admin)
const createUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Please add all required fields' });
  }

  if (!['admin', 'manager', 'cashier'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    // Check if user exists
    const userExists = await db.query('SELECT user_id FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert user
    const newUser = await db.query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) RETURNING user_id, name, email, role`,
      [name, email, password_hash, role]
    );

    res.status(201).json({ message: 'User created', user: newUser.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all users (employees and customers) or filter by role
// @route   GET /api/users
// @access  Private (Admin)
const getUsers = async (req, res) => {
  try {
    const users = await db.query(
      'SELECT user_id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(users.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a user's role
// @route   PUT /api/users/:id/role
// @access  Private (Admin)
const updateUserRole = async (req, res) => {
  const { role } = req.body;
  const { id } = req.params;

  if (!['admin', 'manager', 'cashier'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    const updatedUser = await db.query(
      'UPDATE users SET role = $1 WHERE user_id = $2 RETURNING user_id, name, role',
      [role, id]
    );

    if (updatedUser.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User role updated', user: updatedUser.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Deactivate/Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // In a real system we might just deactivate, but per reqs Admin can deactivate/delete.
    // We'll delete for simplicity, ON DELETE SET NULL handles the foreign keys in sales.
    const deletedUser = await db.query('DELETE FROM users WHERE user_id = $1 RETURNING user_id', [id]);
    
    if (deletedUser.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  createUser,
  getUsers,
  updateUserRole,
  deleteUser
};
