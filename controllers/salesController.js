const db = require('../config/db');
const MoMoService = require('../services/momoService');
const { v4: uuidv4 } = require('uuid');

// Helper to generate a dummy UUID for the MoMo package since it may not be installed
// Note: We used `uuidv4` above, let's just make sure we export a generic sales endpoint

// @desc    Process a new POS Sale
// @route   POST /api/sales
// @access  Private (Cashier, Manager, Admin)
const processSale = async (req, res) => {
  const { cartItems, customer_id, payment_method, phone_number, receipt_type } = req.body;
  
  if (!cartItems || cartItems.length === 0) {
     return res.status(400).json({ message: 'Cart is empty' });
  }

  const client = await db.query('SELECT NOW()'); // Use a generic client query, but for transactions we need a dedicated client if we want BEGIN/COMMIT safely
  // For simplicity, we'll do sequence of queries.

  try {
    // 1. Calculate Total and Verify Stock
    let total_amount = 0;
    const validatedItems = [];

    for (let item of cartItems) {
      // Fetch product
      const pRes = await db.query(
        'SELECT p.product_id, p.price, p.product_name, i.quantity FROM products p JOIN inventory i ON p.product_id = i.product_id WHERE p.product_id = $1',
        [item.product_id]
      );
      if (pRes.rows.length === 0) {
         return res.status(400).json({ message: `Product ID ${item.product_id} not found` });
      }

      const product = pRes.rows[0];

      if (product.quantity < item.quantity) {
         return res.status(400).json({ message: `Insufficient stock for ${product.product_name}. Available: ${product.quantity}` });
      }

      const subtotal = Number(product.price) * Number(item.quantity);
      total_amount += subtotal;

      validatedItems.push({
         product_id: product.product_id,
         product_name: product.product_name,
         price: product.price,
         quantity: item.quantity,
         subtotal: subtotal
      });
    }

    // 2. Initiate Payment (Mobile Money if selected)
    let paymentStatus = 'SUCCESSFUL';
    let externalTransactionId = `TXN-${Date.now()}`;

    if (payment_method === 'Mobile Money') {
      if (!phone_number) {
         return res.status(400).json({ message: 'Phone number is required for Mobile Money' });
      }

      const momoResult = await MoMoService.requestToPay(
         total_amount, 
         phone_number, 
         externalTransactionId, 
         `POS Checkout`
      );

      // MoMo typically returns 202 Accepted (Pending user approval on their phone)
      if (momoResult.status === 202) {
         paymentStatus = 'PENDING';
         externalTransactionId = momoResult.referenceId;
      } else {
         return res.status(400).json({ message: 'Mobile Money initiation failed' });
      }
    }

    // 3. Store Sale
    const saleRes = await db.query(
      `INSERT INTO sales (cashier_id, customer_id, total_amount, receipt_type) VALUES ($1, $2, $3, $4) RETURNING sale_id, created_at`,
      [req.user.id, customer_id || null, total_amount, receipt_type || 'none']
    );
    const sale_id = saleRes.rows[0].sale_id;
    const sale_date = saleRes.rows[0].created_at;

    // 4. Store Sale Items & Deduct Inventory
    for (let vItem of validatedItems) {
      await db.query(
        `INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale) VALUES ($1, $2, $3, $4)`,
        [sale_id, vItem.product_id, vItem.quantity, vItem.price]
      );

      await db.query(
        `UPDATE inventory SET quantity = quantity - $1 WHERE product_id = $2`,
        [vItem.quantity, vItem.product_id]
      );
    }

    // 5. Create Payment Record
    await db.query(
      `INSERT INTO payments (sale_id, payment_method, amount, status, external_transaction_id) VALUES ($1, $2, $3, $4, $5)`,
      [sale_id, payment_method, total_amount, paymentStatus, externalTransactionId]
    );

    // 6. Generate Receipt JSON Format
    const receipt = {
      store_name: "Capstone POS Store",
      transaction_id: `SALE-${sale_id}`,
      date: sale_date,
      items: validatedItems.map(i => ({
         name: i.product_name,
         quantity: i.quantity,
         price: i.price,
         subtotal: i.subtotal
      })),
      total_amount: total_amount,
      payment_method: payment_method,
      payment_status: paymentStatus
    };

    if (receipt_type === 'email') {
      console.log(`\n========================================`);
      console.log(`[MOCK EMAIL SERVICE] Sending receipt for Sale #${sale_id}`);
      console.log(`To Customer ID: ${customer_id}`);
      console.log(`Total Amount: GHS ${total_amount.toFixed(2)}`);
      console.log(`========================================\n`);
    }

    res.status(201).json({
      message: 'Sale processed successfully',
      receipt: receipt
    });

  } catch (error) {
    console.error("Sale Processing Error:", error);
    res.status(500).json({ message: 'Server Error during sale processing' });
  }
};

// @desc    Get Sales History
// @route   GET /api/sales
// @access  Private (Admin, Manager)
const getSales = async (req, res) => {
  try {
     const sales = await db.query(
       `SELECT s.sale_id, s.total_amount, s.created_at, u.name as cashier_name,
               c.name as customer_name, p.payment_method, p.status as payment_status
        FROM sales s
         LEFT JOIN users u ON s.cashier_id = u.user_id
         LEFT JOIN customers c ON s.customer_id = c.customer_id
         LEFT JOIN payments p ON s.sale_id = p.sale_id
        ORDER BY s.created_at DESC`
     );
     res.json(sales.rows);
  } catch (err) {
     console.error(err);
     res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  processSale,
  getSales
};
