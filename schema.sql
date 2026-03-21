-- PostgreSQL Schema for POS System (Supabase)

-- 1. USERS TABLE (Employees only)
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'cashier')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. CUSTOMERS TABLE (CRM for loyalty and receipts)
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE, -- Used for searching and emailing receipts
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. PRODUCTS TABLE
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(150) NOT NULL,
    category VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    barcode VARCHAR(100) UNIQUE,
    minimum_stock INT DEFAULT 10 CHECK (minimum_stock >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. INVENTORY TABLE
CREATE TABLE inventory (
    inventory_id SERIAL PRIMARY KEY,
    product_id INT UNIQUE NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Function and trigger to auto-update last_updated in inventory
CREATE OR REPLACE FUNCTION update_inventory_last_updated()
RETURNS TRIGGER AS $$
BEGIN
   NEW.last_updated = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory_last_updated
BEFORE UPDATE ON inventory
FOR EACH ROW
EXECUTE FUNCTION update_inventory_last_updated();


-- 5. SALES TABLE
CREATE TABLE sales (
    sale_id SERIAL PRIMARY KEY,
    cashier_id INT NOT NULL REFERENCES users(user_id) ON DELETE SET NULL,
    customer_id INT REFERENCES customers(customer_id) ON DELETE SET NULL,
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    receipt_type VARCHAR(20) CHECK (receipt_type IN ('email', 'printed', 'none')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. SALE ITEMS TABLE
CREATE TABLE sale_items (
    sale_item_id SERIAL PRIMARY KEY,
    sale_id INT NOT NULL REFERENCES sales(sale_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(product_id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    price_at_sale DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * price_at_sale) STORED
);

-- 7. PAYMENTS TABLE
CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    sale_id INT NOT NULL REFERENCES sales(sale_id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('Cash', 'Mobile Money', 'Card')),
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    status VARCHAR(20) NOT NULL CHECK (status IN ('SUCCESSFUL', 'FAILED', 'PENDING')),
    external_transaction_id VARCHAR(255), -- For MTN MoMo ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- SEED DATA
-- Seed an Initial Admin User
-- Password is 'admin123' hashed with bcrypt (Cost: 10)
INSERT INTO users (name, email, password_hash, role)
VALUES (
    'Main Admin', 
    'admin@store.com', 
    '$2b$10$X8a0WzR93J06w7pA.H40i.7I8vD2tA.B/M12HkK6e4z0F4A.5X/nC', 
    'admin'
) ON CONFLICT DO NOTHING;

-- Optionally, seed some sample products
INSERT INTO products (product_name, category, price, barcode, minimum_stock) VALUES
('Coca-Cola', 'Beverages', 5.00, '0000000001', 10),
('Bread', 'Bakery', 8.00, '0000000002', 5),
('Milk', 'Dairy', 12.00, '0000000003', 10)
ON CONFLICT DO NOTHING;

-- Seed inventory for products
INSERT INTO inventory (product_id, quantity) 
SELECT product_id, 20 FROM products
ON CONFLICT DO NOTHING;
