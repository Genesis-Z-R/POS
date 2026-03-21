const db = require('../config/db');

// @desc    Search customers by name, email, or phone
// @route   GET /api/customers/search?q=searchterm
// @access  Private (Admin, Manager, Cashier)
const searchCustomers = async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ message: 'Please provide a search term' });
  }

  try {
    const searchTerm = `%${q}%`;
    const customers = await db.query(
      `SELECT customer_id as user_id, name, email, phone 
       FROM customers 
       WHERE name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1
       LIMIT 10`,
      [searchTerm]
    );

    res.json(customers.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a new walk-in customer
// @route   POST /api/customers
// @access  Private (Admin, Manager, Cashier)
const createCustomer = async (req, res) => {
  const { name, email, phone } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  try {
    const newCustomer = await db.query(
      `INSERT INTO customers (name, email, phone) 
       VALUES ($1, $2, $3) 
       RETURNING customer_id as user_id, name, email, phone`,
      [name, email || null, phone || null]
    );

    res.status(201).json(newCustomer.rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ message: 'Customer with this email already exists.' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  searchCustomers,
  createCustomer
};
