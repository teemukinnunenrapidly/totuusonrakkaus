-- Fix RLS policies for WooCommerce webhook operations
-- Drop the restrictive policy
DROP POLICY IF EXISTS "Admin can manage woo_orders" ON woo_orders;

-- Create a more permissive policy that allows service role operations
CREATE POLICY "Service role can manage woo_orders" ON woo_orders
FOR ALL USING (true);

-- Also fix other WooCommerce related tables
DROP POLICY IF EXISTS "Admin can manage woo_order_items" ON woo_order_items;
CREATE POLICY "Service role can manage woo_order_items" ON woo_order_items
FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin can manage student_enrollments" ON student_enrollments;
CREATE POLICY "Service role can manage student_enrollments" ON student_enrollments
FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin can manage course_sku_mappings" ON course_sku_mappings;
CREATE POLICY "Service role can manage course_sku_mappings" ON course_sku_mappings
FOR ALL USING (true);
