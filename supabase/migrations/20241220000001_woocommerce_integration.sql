-- Course-SKU Mapping Table
CREATE TABLE IF NOT EXISTS course_sku_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    woo_sku VARCHAR(255) NOT NULL UNIQUE,
    woo_product_id BIGINT,
    woo_product_name VARCHAR(500),
    price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WooCommerce Orders Table
CREATE TABLE IF NOT EXISTS woo_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    woo_order_id BIGINT UNIQUE NOT NULL,
    woo_order_key VARCHAR(255),
    customer_email VARCHAR(255) NOT NULL,
    customer_first_name VARCHAR(255),
    customer_last_name VARCHAR(255),
    order_status VARCHAR(50) NOT NULL,
    order_total DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'EUR',
    payment_method VARCHAR(100),
    order_date TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS woo_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    woo_order_id UUID REFERENCES woo_orders(id) ON DELETE CASCADE,
    woo_product_id BIGINT,
    woo_sku VARCHAR(255) NOT NULL,
    product_name VARCHAR(500),
    quantity INTEGER DEFAULT 1,
    price DECIMAL(10,2),
    course_id UUID REFERENCES courses(id),
    user_id UUID REFERENCES auth.users(id),
    enrollment_created_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student Enrollments Table (if not exists)
CREATE TABLE IF NOT EXISTS student_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    woo_order_id UUID REFERENCES woo_orders(id),
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'active',
    access_granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_sku_mappings_sku ON course_sku_mappings(woo_sku);
CREATE INDEX IF NOT EXISTS idx_woo_orders_order_id ON woo_orders(woo_order_id);
CREATE INDEX IF NOT EXISTS idx_woo_order_items_sku ON woo_order_items(woo_sku);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_user_course ON student_enrollments(user_id, course_id);

-- RLS Policies
ALTER TABLE course_sku_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE woo_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE woo_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;

-- Admin can manage all
CREATE POLICY "Admin can manage course_sku_mappings" ON course_sku_mappings
    FOR ALL USING (auth.jwt() ->> 'email' = 'teemu.kinnunen@rapidly.fi');

CREATE POLICY "Admin can manage woo_orders" ON woo_orders
    FOR ALL USING (auth.jwt() ->> 'email' = 'teemu.kinnunen@rapidly.fi');

CREATE POLICY "Admin can manage woo_order_items" ON woo_order_items
    FOR ALL USING (auth.jwt() ->> 'email' = 'teemu.kinnunen@rapidly.fi');

CREATE POLICY "Admin can manage student_enrollments" ON student_enrollments
    FOR ALL USING (auth.jwt() ->> 'email' = 'teemu.kinnunen@rapidly.fi');

-- Users can view their own enrollments
CREATE POLICY "Users can view own enrollments" ON student_enrollments
    FOR SELECT USING (auth.uid() = user_id);
