# WooCommerce Integration Setup Guide

## Overview
This guide explains how to set up the integration between WooCommerce and your course platform to automatically enroll students when they purchase digital products.

## System Architecture

### 1. Database Schema
The integration uses several new tables:
- `course_sku_mappings` - Links courses to WooCommerce SKUs
- `woo_orders` - Stores WooCommerce order data
- `woo_order_items` - Individual items in orders
- `student_enrollments` - Student course enrollments

### 2. Webhook Handler
- **Endpoint**: `/api/woocommerce/webhook`
- **Method**: POST
- **Purpose**: Processes WooCommerce order notifications

## Setup Steps

### Step 1: Database Migration
Run the database migration to create the necessary tables:

```sql
-- Execute the course-sku-mapping.sql file
-- This creates all required tables and indexes
```

### Step 2: WooCommerce Configuration

#### 2.1 Enable Webhooks
1. Go to WooCommerce → Settings → Advanced → Webhooks
2. Click "Add webhook"
3. Configure the webhook:
   - **Name**: Order Completed Webhook
   - **Status**: Active
   - **Topic**: Order completed
   - **Delivery URL**: `https://yourdomain.com/api/woocommerce/webhook`
   - **Version**: v3
   - **Secret**: (optional, for security)

#### 2.2 Product Configuration
For each digital product in WooCommerce:
1. Set the product type to "Digital product"
2. Add a unique SKU (e.g., "KURSSI-001", "KURSSI-002")
3. Configure the product to grant access upon purchase

### Step 3: Course-SKU Mapping

#### 3.1 Access Admin Interface
1. Navigate to `/admin/course-mappings`
2. Log in as an admin user

#### 3.2 Create Mappings
For each course:
1. Click "Lisää uusi kytkentä"
2. Select the course from the dropdown
3. Enter the WooCommerce SKU
4. Optionally add product ID and price
5. Set status to "Aktiivinen"
6. Click "Lisää kytkentä"

### Step 4: Email Configuration

#### 4.1 Resend Setup
Ensure your Resend configuration is set up in `src/lib/resend.ts`:
```typescript
import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);
```

#### 4.2 Environment Variables
Add to your `.env.local`:
```
RESEND_API_KEY=your_resend_api_key
```

### Step 5: Testing the Integration

#### 5.1 Test Order Flow
1. Create a test order in WooCommerce
2. Complete the order (set status to "completed")
3. Check the webhook logs in your application
4. Verify user creation and enrollment
5. Check email delivery

#### 5.2 Monitor Logs
Check your application logs for:
- Webhook reception
- User creation
- Enrollment creation
- Email sending

## Webhook Payload Example

The webhook expects a payload like this:
```json
{
  "id": 12345,
  "order_key": "wc_order_abc123",
  "status": "completed",
  "currency": "EUR",
  "total": "99.00",
  "customer_id": 123,
  "billing": {
    "email": "student@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "line_items": [
    {
      "product_id": 456,
      "name": "Parisuhdekurssi",
      "sku": "KURSSI-001",
      "quantity": 1,
      "total": "99.00"
    }
  ],
  "payment_method_title": "Stripe",
  "date_created": "2024-01-15T10:30:00Z",
  "date_modified": "2024-01-15T10:35:00Z"
}
```

## Security Considerations

### 1. Webhook Authentication
Consider implementing webhook signature verification:
```typescript
// In your webhook handler
const signature = request.headers.get('x-wc-webhook-signature');
// Verify signature against your webhook secret
```

### 2. Rate Limiting
Implement rate limiting on the webhook endpoint to prevent abuse.

### 3. Error Handling
The webhook handler includes comprehensive error handling:
- Duplicate order prevention
- Invalid SKU handling
- User creation error handling
- Email sending error handling

## Troubleshooting

### Common Issues

#### 1. Webhook Not Received
- Check WooCommerce webhook configuration
- Verify delivery URL is correct
- Check server logs for connection issues

#### 2. User Not Created
- Check Supabase authentication settings
- Verify admin API keys are configured
- Check user creation logs

#### 3. Enrollment Not Created
- Verify course-SKU mapping exists
- Check database permissions
- Review enrollment creation logs

#### 4. Email Not Sent
- Verify Resend API key
- Check email configuration
- Review email sending logs

### Debugging Tools

#### 1. Webhook Testing
Use a tool like ngrok to test webhooks locally:
```bash
ngrok http 3000
```

#### 2. Database Queries
Check the database for:
```sql
-- Check mappings
SELECT * FROM course_sku_mappings;

-- Check orders
SELECT * FROM woo_orders ORDER BY created_at DESC;

-- Check enrollments
SELECT * FROM student_enrollments ORDER BY created_at DESC;
```

## Maintenance

### Regular Tasks
1. **Monitor webhook logs** for failed deliveries
2. **Review course mappings** for accuracy
3. **Check email delivery** rates
4. **Audit enrollments** for consistency

### Backup Strategy
- Regular database backups
- Webhook log retention
- Email delivery logs

## Support

For issues with this integration:
1. Check the application logs
2. Verify WooCommerce webhook configuration
3. Test with a simple webhook payload
4. Contact the development team

## Future Enhancements

Potential improvements:
- Webhook signature verification
- Retry mechanism for failed webhooks
- Advanced email templates
- Order status tracking
- Refund handling
- Bulk enrollment management
