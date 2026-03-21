const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Generate JWT
const generateToken = (id, name, role, email) => {
  return jwt.sign({ id, name, role, email }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new customer
// @route   POST /api/auth/register
// @access  Public
const registerCustomer = async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please add all required fields' });
  }

  try {
    // Check if user exists
    const userExists = await db.query('SELECT user_id FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert user
    const result = await db.query(
      `INSERT INTO users (name, email, phone, password_hash, role) 
       VALUES ($1, $2, $3, $4, $5) RETURNING user_id, name, email, role`,
      [name, email, phone, password_hash, 'customer']
    );

    const user = result.rows[0];

    res.status(201).json({
      message: 'Customer registered successfully',
      token: generateToken(user.user_id, user.name, user.role, user.email),
      user: {
        id: user.user_id,
        name: user.name,
        role: user.role,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please add all required fields' });
  }

  try {
    // Check for user email
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      message: 'Login successful',
      token: generateToken(user.user_id, user.name, user.role, user.email),
      user: {
        id: user.user_id,
        name: user.name,
        role: user.role,
        email: user.email
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const result = await db.query('SELECT user_id, name, email, phone, role, created_at FROM users WHERE user_id = $1', [req.user.id]);
    if (result.rows.length === 0) {
       return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
}

module.exports = {
  registerCustomer,
  loginUser,
  getMe
};
