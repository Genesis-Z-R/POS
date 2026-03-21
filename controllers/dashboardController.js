const db = require('../config/db');

// @desc    Get top level dashboard summary
// @route   GET /api/dashboard/summary
// @access  Private (Admin, Manager)
const getDashboardSummary = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Sales Today & Transactions Today
    const salesRes = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0) as sales_today, COUNT(sale_id) as transactions_today 
       FROM sales 
       WHERE DATE(created_at AT TIME ZONE 'UTC') = $1`,
      [todayStr]
    );
    const { sales_today, transactions_today } = salesRes.rows[0];

    // Best Selling Product
    const bestSellerRes = await db.query(
      `SELECT p.product_name 
       FROM sale_items si 
       JOIN products p ON si.product_id = p.product_id 
       GROUP BY p.product_id, p.product_name 
       ORDER BY SUM(si.quantity) DESC LIMIT 1`
    );
    const best_selling_product = bestSellerRes.rows.length > 0 ? bestSellerRes.rows[0].product_name : 'N/A';

    // Low Stock Count
    const lowStockRes = await db.query(
      `SELECT COUNT(*) as low_stock_count 
       FROM inventory i JOIN products p ON i.product_id = p.product_id 
       WHERE i.quantity < p.minimum_stock`
    );
    const { low_stock_count } = lowStockRes.rows[0];

    res.json({
      sales_today: parseFloat(sales_today) || 0,
      transactions_today: parseInt(transactions_today, 10),
      best_selling_product,
      low_stock_count: parseInt(low_stock_count, 10)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Errror fetching summary' });
  }
};

// @desc    Get daily sales trend
// @route   GET /api/dashboard/sales-trend
// @access  Private (Admin, Manager)
const getSalesTrend = async (req, res) => {
  try {
    // Get last 7 days of sales
    const trendRes = await db.query(
      `SELECT DATE(created_at AT TIME ZONE 'UTC') as date, SUM(total_amount) as total 
       FROM sales 
       WHERE created_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(created_at AT TIME ZONE 'UTC') 
       ORDER BY date ASC`
    );
    res.json(trendRes.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Errror' });
  }
};

// @desc    Get top products chart data
// @route   GET /api/dashboard/top-products
// @access  Private (Admin, Manager)
const getTopProducts = async (req, res) => {
  try {
    const topRes = await db.query(
      `SELECT p.product_name, SUM(si.quantity) as total_sold
       FROM sale_items si
       JOIN products p ON si.product_id = p.product_id
       GROUP BY p.product_name
       ORDER BY total_sold DESC
       LIMIT 5`
    );
    res.json(topRes.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Errror' });
  }
};

// @desc    Get payment methods breakdown chart data
// @route   GET /api/dashboard/payment-methods
// @access  Private (Admin, Manager)
const getPaymentMethods = async (req, res) => {
  try {
    const payRes = await db.query(
      `SELECT payment_method, COUNT(*) as usage_count
       FROM payments
       WHERE status = 'SUCCESSFUL'
       GROUP BY payment_method`
    );
    res.json(payRes.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Errror' });
  }
};


module.exports = {
  getDashboardSummary,
  getSalesTrend,
  getTopProducts,
  getPaymentMethods
};
