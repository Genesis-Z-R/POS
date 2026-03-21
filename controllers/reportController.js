const db = require('../config/db');

// @desc    Get daily sales tabular report
// @route   GET /api/reports/daily-sales
// @access  Private (Admin, Manager)
const getDailySalesReport = async (req, res) => {
   try {
     const todayStr = new Date().toISOString().split('T')[0];
     const sales = await db.query(
       `SELECT s.sale_id, s.total_amount, s.created_at, u.name as cashier_name, c.name as customer_name,
               p.payment_method
        FROM sales s
        LEFT JOIN users u ON s.cashier_id = u.user_id
        LEFT JOIN users c ON s.customer_id = c.user_id
        LEFT JOIN payments p ON s.sale_id = p.sale_id
        WHERE DATE(s.created_at AT TIME ZONE 'UTC') = $1
        ORDER BY s.created_at DESC`, [todayStr]
     );
     res.json(sales.rows);
   } catch(e) {
      console.error(e); res.status(500).send('Error');
   }
};

// @desc    Get inventory status report
// @route   GET /api/reports/inventory
// @access  Private (Admin, Manager)
const getInventoryReport = async (req, res) => {
   try {
     const inv = await db.query(
       `SELECT p.barcode, p.product_name, p.category, p.price, i.quantity, p.minimum_stock,
       CASE WHEN i.quantity < p.minimum_stock THEN 'LOW' ELSE 'OK' END as status
       FROM inventory i JOIN products p ON i.product_id = p.product_id
       ORDER BY p.product_name ASC`
     );
     res.json(inv.rows);
   } catch(e) {
      console.error(e); res.status(500).send('Error');
   }
};

// @desc    Get top products status report
// @route   GET /api/reports/top-products
// @access  Private (Admin, Manager)
const getTopProductsReport = async (req, res) => {
   try {
     const prod = await db.query(
       `SELECT p.barcode, p.product_name, SUM(si.quantity) as units_sold, SUM(si.subtotal) as revenue generated
        FROM sale_items si JOIN products p ON si.product_id = p.product_id
        GROUP BY p.barcode, p.product_name
        ORDER BY units_sold DESC`
     );
     res.json(prod.rows);
   } catch(e) {
      console.error(e); res.status(500).send('Error');
   }
};

module.exports = {
   getDailySalesReport,
   getInventoryReport,
   getTopProductsReport
};
