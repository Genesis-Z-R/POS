const db = require('../config/db');

// @desc    Get Inventory list
// @route   GET /api/inventory
// @access  Private (Admin, Manager)
const getInventory = async (req, res) => {
  try {
    const inventory = await db.query(
      `SELECT i.inventory_id, i.product_id, p.product_name, p.category, i.quantity, p.minimum_stock, i.last_updated
       FROM inventory i
       JOIN products p ON i.product_id = p.product_id
       ORDER BY p.product_name ASC`
    );
    res.json(inventory.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update stock quantity directly (manual override)
// @route   PUT /api/inventory/:id
// @access  Private (Admin, Manager)
const updateInventory = async (req, res) => {
  const { id } = req.params; // Using product_id to update
  const { quantity } = req.body;

  if (quantity === undefined) {
      return res.status(400).json({ message: 'Quantity is required' });
  }

  try {
    const updatedStock = await db.query(
      'UPDATE inventory SET quantity = $1 WHERE product_id = $2 RETURNING *',
      [quantity, id]
    );

    if (updatedStock.rows.length === 0) {
      return res.status(404).json({ message: 'Inventory record not found' });
    }

    res.json(updatedStock.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get Low Stock Alerts
// @route   GET /api/inventory/low-stock
// @access  Private (Admin, Manager)
const getLowStockAlerts = async (req, res) => {
  try {
    // Return items where current quantity is less than minimum_stock
    const alerts = await db.query(
      `SELECT p.product_name, i.quantity, p.minimum_stock
       FROM inventory i
       JOIN products p ON i.product_id = p.product_id
       WHERE i.quantity < p.minimum_stock
       ORDER BY i.quantity ASC`
    );
    res.json(alerts.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getInventory,
  updateInventory,
  getLowStockAlerts
};
