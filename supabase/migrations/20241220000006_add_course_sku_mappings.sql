-- Add test course SKU mappings for WooCommerce integration
INSERT INTO course_sku_mappings (course_id, woo_sku, woo_product_name, is_active, created_at, updated_at) VALUES 
('0c65a1fa-2dd9-4432-b28f-72350c8b356e', 'TEST-COURSE-001', 'Testikurssi - Digitaalinen versio', true, NOW(), NOW()),
('0c65a1fa-2dd9-4432-b28f-72350c8b356e', 'TEST-COURSE-002', 'Testikurssi - Premium versio', true, NOW(), NOW()),
('0c65a1fa-2dd9-4432-b28f-72350c8b356e', 'COURSE-001', 'Testikurssi', true, NOW(), NOW());
