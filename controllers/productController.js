const db = require('../config/db');

// @desc    Get all products
// @route   GET /api/products
// @access  Private (Admin, Manager, Cashier)
const getProducts = async (req, res) => {
  try {
    const products = await db.query(
      `SELECT p.*, COALESCE(i.quantity, 0) as stock_quantity 
       FROM products p
       LEFT JOIN inventory i ON p.product_id = i.product_id
       ORDER BY p.product_name ASC`
    );
    res.json(products.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Private (Admin, Manager)
const createProduct = async (req, res) => {
  const { product_name, category, price, barcode, minimum_stock } = req.body;

  if (!product_name || !price) {
     return res.status(400).json({ message: 'Please provide required fields (product_name, price)' });
  }

  try {
    // Check barcode uniqueness
    if (barcode) {
        const existing = await db.query('SELECT product_id FROM products WHERE barcode = $1', [barcode]);
        if (existing.rows.length > 0) {
           return res.status(400).json({ message: 'Barcode already in use' });
        }
    }

    const newProduct = await db.query(
      `INSERT INTO products (product_name, category, price, barcode, minimum_stock) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [product_name, category || null, price, barcode || null, minimum_stock || 10]
    );

    // Initialize inventory for this product 
    await db.query(
      `INSERT INTO inventory (product_id, quantity) VALUES ($1, 0)`,
      [newProduct.rows[0].product_id]
    );

    res.status(201).json(newProduct.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (Admin, Manager)
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { product_name, category, price, barcode, minimum_stock } = req.body;

  try {
    const updatedUser = await db.query(
      `UPDATE products SET 
         product_name = COALESCE($1, product_name),
         category = COALESCE($2, category),
         price = COALESCE($3, price),
         barcode = COALESCE($4, barcode),
         minimum_stock = COALESCE($5, minimum_stock)
       WHERE product_id = $6 RETURNING *`,
      [product_name, category, price, barcode, minimum_stock, id]
    );

    if (updatedUser.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(updatedUser.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Admin, Manager)
const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedProduct = await db.query('DELETE FROM products WHERE product_id = $1 RETURNING product_id', [id]);
    if (deletedProduct.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error. Product might be attached to historical sales data.' });
  }
}


module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
};
