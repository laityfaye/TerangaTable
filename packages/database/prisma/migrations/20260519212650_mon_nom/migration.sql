/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,sku]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - Made the column `sort_order` on table `categories` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_active` on table `categories` required. This step will fail if there are existing NULL values in that column.
  - Made the column `field_type` on table `custom_fields` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_required` on table `custom_fields` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_shown_on_vitrine` on table `custom_fields` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sort_order` on table `custom_fields` required. This step will fail if there are existing NULL values in that column.
  - Made the column `total_orders` on table `customers` required. This step will fail if there are existing NULL values in that column.
  - Made the column `total_spent` on table `customers` required. This step will fail if there are existing NULL values in that column.
  - Made the column `loyalty_points` on table `customers` required. This step will fail if there are existing NULL values in that column.
  - Made the column `segment` on table `customers` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `customers` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `deliveries` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_available` on table `delivery_agents` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `delivery_agents` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `delivery_zones` required. This step will fail if there are existing NULL values in that column.
  - Made the column `min_order` on table `delivery_zones` required. This step will fail if there are existing NULL values in that column.
  - Made the column `delivery_fee` on table `delivery_zones` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_active` on table `delivery_zones` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `loyalty_transactions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `version` on table `modules` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_active` on table `modules` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_read` on table `notifications` required. This step will fail if there are existing NULL values in that column.
  - Made the column `metadata` on table `notifications` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `notifications` required. This step will fail if there are existing NULL values in that column.
  - Made the column `options` on table `order_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `order_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `orders` required. This step will fail if there are existing NULL values in that column.
  - Made the column `subtotal` on table `orders` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tax_amount` on table `orders` required. This step will fail if there are existing NULL values in that column.
  - Made the column `discount_amount` on table `orders` required. This step will fail if there are existing NULL values in that column.
  - Made the column `total` on table `orders` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `orders` required. This step will fail if there are existing NULL values in that column.
  - Made the column `content` on table `pages` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_published` on table `pages` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sort_order` on table `pages` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `pages` required. This step will fail if there are existing NULL values in that column.
  - Made the column `method` on table `payments` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `payments` required. This step will fail if there are existing NULL values in that column.
  - Made the column `metadata` on table `payments` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `payments` required. This step will fail if there are existing NULL values in that column.
  - Made the column `features` on table `plans` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_active` on table `plans` required. This step will fail if there are existing NULL values in that column.
  - Made the column `opening_amount` on table `pos_sessions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `total_sales` on table `pos_sessions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `total_orders` on table `pos_sessions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sales_by_method` on table `pos_sessions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `pos_sessions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `opened_at` on table `pos_sessions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `price_delta` on table `product_options` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_default` on table `product_options` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_available` on table `product_options` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `product_options_groups` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_required` on table `product_options_groups` required. This step will fail if there are existing NULL values in that column.
  - Made the column `min_select` on table `product_options_groups` required. This step will fail if there are existing NULL values in that column.
  - Made the column `max_select` on table `product_options_groups` required. This step will fail if there are existing NULL values in that column.
  - Made the column `base_price` on table `products` required. This step will fail if there are existing NULL values in that column.
  - Made the column `images` on table `products` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nutritional_info` on table `products` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_available` on table `products` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_featured` on table `products` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sort_order` on table `products` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `products` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_active` on table `regions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `regions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `party_size` on table `reservations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `duration_min` on table `reservations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `reservations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `source` on table `reservations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `reminder_sent` on table `reservations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `reservations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_system` on table `roles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `roles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `conditions` on table `rules` required. This step will fail if there are existing NULL values in that column.
  - Made the column `condition_logic` on table `rules` required. This step will fail if there are existing NULL values in that column.
  - Made the column `actions` on table `rules` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_active` on table `rules` required. This step will fail if there are existing NULL values in that column.
  - Made the column `priority` on table `rules` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `rules` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `settings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `settings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `capacity` on table `tables` required. This step will fail if there are existing NULL values in that column.
  - Made the column `shape` on table `tables` required. This step will fail if there are existing NULL values in that column.
  - Made the column `pos_x` on table `tables` required. This step will fail if there are existing NULL values in that column.
  - Made the column `pos_y` on table `tables` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_active` on table `tables` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_active` on table `tenant_modules` required. This step will fail if there are existing NULL values in that column.
  - Made the column `config` on table `tenant_modules` required. This step will fail if there are existing NULL values in that column.
  - Made the column `activated_at` on table `tenant_modules` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `tenant_requests` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `tenant_requests` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `tenants` required. This step will fail if there are existing NULL values in that column.
  - Made the column `settings` on table `tenants` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `tenants` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `tenants` required. This step will fail if there are existing NULL values in that column.
  - Made the column `config` on table `themes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_premium` on table `themes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_active` on table `themes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `granted_at` on table `user_roles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_active` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_published` on table `website_settings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `primary_color` on table `website_settings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `secondary_color` on table `website_settings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sections_config` on table `website_settings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `social_links` on table `website_settings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `font_heading` on table `website_settings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `font_body` on table `website_settings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_default` on table `workflow_definitions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_initial` on table `workflow_states` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_terminal` on table `workflow_states` required. This step will fail if there are existing NULL values in that column.
  - Made the column `triggers_alert` on table `workflow_states` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sort_order` on table `workflow_states` required. This step will fail if there are existing NULL values in that column.
  - Made the column `conditions` on table `workflow_transitions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_active` on table `zones` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "custom_field_values" DROP CONSTRAINT "custom_field_values_custom_field_id_fkey";

-- DropForeignKey
ALTER TABLE "custom_field_values" DROP CONSTRAINT "custom_field_values_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "custom_fields" DROP CONSTRAINT "custom_fields_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "customers" DROP CONSTRAINT "customers_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "deliveries" DROP CONSTRAINT "deliveries_agent_id_fkey";

-- DropForeignKey
ALTER TABLE "deliveries" DROP CONSTRAINT "deliveries_order_id_fkey";

-- DropForeignKey
ALTER TABLE "deliveries" DROP CONSTRAINT "deliveries_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "delivery_agents" DROP CONSTRAINT "delivery_agents_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "delivery_agents" DROP CONSTRAINT "delivery_agents_user_id_fkey";

-- DropForeignKey
ALTER TABLE "delivery_agents" DROP CONSTRAINT "delivery_agents_zone_id_fkey";

-- DropForeignKey
ALTER TABLE "delivery_zones" DROP CONSTRAINT "delivery_zones_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_created_by_fkey";

-- DropForeignKey
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_role_id_fkey";

-- DropForeignKey
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "loyalty_transactions" DROP CONSTRAINT "loyalty_transactions_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "loyalty_transactions" DROP CONSTRAINT "loyalty_transactions_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_user_id_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_order_id_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_agent_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_table_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_workflow_state_id_fkey";

-- DropForeignKey
ALTER TABLE "pages" DROP CONSTRAINT "pages_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_order_id_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "pos_sessions" DROP CONSTRAINT "pos_sessions_closed_by_fkey";

-- DropForeignKey
ALTER TABLE "pos_sessions" DROP CONSTRAINT "pos_sessions_opened_by_fkey";

-- DropForeignKey
ALTER TABLE "pos_sessions" DROP CONSTRAINT "pos_sessions_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "product_options" DROP CONSTRAINT "product_options_group_id_fkey";

-- DropForeignKey
ALTER TABLE "product_options" DROP CONSTRAINT "product_options_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "product_options_groups" DROP CONSTRAINT "product_options_groups_product_id_fkey";

-- DropForeignKey
ALTER TABLE "product_options_groups" DROP CONSTRAINT "product_options_groups_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_category_id_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "regions" DROP CONSTRAINT "fk_regions_admin";

-- DropForeignKey
ALTER TABLE "reservations" DROP CONSTRAINT "reservations_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "reservations" DROP CONSTRAINT "reservations_table_id_fkey";

-- DropForeignKey
ALTER TABLE "reservations" DROP CONSTRAINT "reservations_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_permission_id_fkey";

-- DropForeignKey
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_role_id_fkey";

-- DropForeignKey
ALTER TABLE "roles" DROP CONSTRAINT "roles_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "rules" DROP CONSTRAINT "rules_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "settings" DROP CONSTRAINT "settings_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "tables" DROP CONSTRAINT "tables_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "tables" DROP CONSTRAINT "tables_zone_id_fkey";

-- DropForeignKey
ALTER TABLE "tenant_modules" DROP CONSTRAINT "tenant_modules_module_id_fkey";

-- DropForeignKey
ALTER TABLE "tenant_modules" DROP CONSTRAINT "tenant_modules_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "tenant_requests" DROP CONSTRAINT "fk_tenant_requests_reviewer";

-- DropForeignKey
ALTER TABLE "tenant_requests" DROP CONSTRAINT "tenant_requests_region_id_fkey";

-- DropForeignKey
ALTER TABLE "tenants" DROP CONSTRAINT "tenants_plan_id_fkey";

-- DropForeignKey
ALTER TABLE "tenants" DROP CONSTRAINT "tenants_region_id_fkey";

-- DropForeignKey
ALTER TABLE "user_permissions" DROP CONSTRAINT "user_permissions_permission_id_fkey";

-- DropForeignKey
ALTER TABLE "user_permissions" DROP CONSTRAINT "user_permissions_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "user_permissions" DROP CONSTRAINT "user_permissions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_granted_by_fkey";

-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_role_id_fkey";

-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_user_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "website_settings" DROP CONSTRAINT "website_settings_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "website_settings" DROP CONSTRAINT "website_settings_theme_id_fkey";

-- DropForeignKey
ALTER TABLE "workflow_definitions" DROP CONSTRAINT "workflow_definitions_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "workflow_states" DROP CONSTRAINT "workflow_states_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "workflow_states" DROP CONSTRAINT "workflow_states_workflow_id_fkey";

-- DropForeignKey
ALTER TABLE "workflow_transitions" DROP CONSTRAINT "workflow_transitions_from_state_id_fkey";

-- DropForeignKey
ALTER TABLE "workflow_transitions" DROP CONSTRAINT "workflow_transitions_to_state_id_fkey";

-- DropForeignKey
ALTER TABLE "workflow_transitions" DROP CONSTRAINT "workflow_transitions_workflow_id_fkey";

-- DropForeignKey
ALTER TABLE "zones" DROP CONSTRAINT "zones_tenant_id_fkey";

-- DropIndex
DROP INDEX "idx_products_tags";

-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "sort_order" SET NOT NULL,
ALTER COLUMN "is_active" SET NOT NULL;

-- AlterTable
ALTER TABLE "custom_field_values" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "custom_fields" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "field_type" SET NOT NULL,
ALTER COLUMN "is_required" SET NOT NULL,
ALTER COLUMN "is_shown_on_vitrine" SET NOT NULL,
ALTER COLUMN "sort_order" SET NOT NULL;

-- AlterTable
ALTER TABLE "customers" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "total_orders" SET NOT NULL,
ALTER COLUMN "total_spent" SET NOT NULL,
ALTER COLUMN "loyalty_points" SET NOT NULL,
ALTER COLUMN "last_visit_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "segment" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "deliveries" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "assigned_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "picked_up_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "delivered_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "delivery_agents" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "is_available" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "delivery_zones" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "type" SET NOT NULL,
ALTER COLUMN "min_order" SET NOT NULL,
ALTER COLUMN "delivery_fee" SET NOT NULL,
ALTER COLUMN "is_active" SET NOT NULL;

-- AlterTable
ALTER TABLE "invitations" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "expires_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "revoked_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "accepted_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "loyalty_transactions" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "modules" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "version" SET NOT NULL,
ALTER COLUMN "is_active" SET NOT NULL;

-- AlterTable
ALTER TABLE "notifications" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "is_read" SET NOT NULL,
ALTER COLUMN "metadata" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "order_items" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "options" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "type" SET NOT NULL,
ALTER COLUMN "subtotal" SET NOT NULL,
ALTER COLUMN "tax_amount" SET NOT NULL,
ALTER COLUMN "discount_amount" SET NOT NULL,
ALTER COLUMN "total" SET NOT NULL,
ALTER COLUMN "paid_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "pages" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "content" SET NOT NULL,
ALTER COLUMN "is_published" SET NOT NULL,
ALTER COLUMN "sort_order" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "method" SET NOT NULL,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "metadata" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "permissions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "plans" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "features" SET NOT NULL,
ALTER COLUMN "is_active" SET NOT NULL;

-- AlterTable
ALTER TABLE "pos_sessions" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "opening_amount" SET NOT NULL,
ALTER COLUMN "total_sales" SET NOT NULL,
ALTER COLUMN "total_orders" SET NOT NULL,
ALTER COLUMN "sales_by_method" SET NOT NULL,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "opened_at" SET NOT NULL,
ALTER COLUMN "opened_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "closed_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "product_options" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "price_delta" SET NOT NULL,
ALTER COLUMN "is_default" SET NOT NULL,
ALTER COLUMN "is_available" SET NOT NULL;

-- AlterTable
ALTER TABLE "product_options_groups" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "type" SET NOT NULL,
ALTER COLUMN "is_required" SET NOT NULL,
ALTER COLUMN "min_select" SET NOT NULL,
ALTER COLUMN "max_select" SET NOT NULL;

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "base_price" SET NOT NULL,
ALTER COLUMN "images" SET NOT NULL,
ALTER COLUMN "nutritional_info" SET NOT NULL,
ALTER COLUMN "is_available" SET NOT NULL,
ALTER COLUMN "is_featured" SET NOT NULL,
ALTER COLUMN "sort_order" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "regions" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "is_active" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "reservations" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "party_size" SET NOT NULL,
ALTER COLUMN "reserved_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "duration_min" SET NOT NULL,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "source" SET NOT NULL,
ALTER COLUMN "reminder_sent" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "roles" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "is_system" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "rules" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "conditions" SET NOT NULL,
ALTER COLUMN "condition_logic" SET NOT NULL,
ALTER COLUMN "actions" SET NOT NULL,
ALTER COLUMN "is_active" SET NOT NULL,
ALTER COLUMN "priority" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "settings" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "type" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tables" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "capacity" SET NOT NULL,
ALTER COLUMN "shape" SET NOT NULL,
ALTER COLUMN "pos_x" SET NOT NULL,
ALTER COLUMN "pos_y" SET NOT NULL,
ALTER COLUMN "is_active" SET NOT NULL;

-- AlterTable
ALTER TABLE "tenant_modules" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "is_active" SET NOT NULL,
ALTER COLUMN "config" SET NOT NULL,
ALTER COLUMN "activated_at" SET NOT NULL,
ALTER COLUMN "activated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "expires_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tenant_requests" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "reviewed_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tenants" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "settings" SET NOT NULL,
ALTER COLUMN "trial_ends_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "themes" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "config" SET NOT NULL,
ALTER COLUMN "is_premium" SET NOT NULL,
ALTER COLUMN "is_active" SET NOT NULL;

-- AlterTable
ALTER TABLE "user_roles" ALTER COLUMN "granted_at" SET NOT NULL,
ALTER COLUMN "granted_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "is_active" SET NOT NULL,
ALTER COLUMN "last_login_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "password_reset_expires_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "website_settings" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "is_published" SET NOT NULL,
ALTER COLUMN "primary_color" SET NOT NULL,
ALTER COLUMN "secondary_color" SET NOT NULL,
ALTER COLUMN "sections_config" SET NOT NULL,
ALTER COLUMN "social_links" SET NOT NULL,
ALTER COLUMN "font_heading" SET NOT NULL,
ALTER COLUMN "font_body" SET NOT NULL;

-- AlterTable
ALTER TABLE "workflow_definitions" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "is_default" SET NOT NULL;

-- AlterTable
ALTER TABLE "workflow_states" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "is_initial" SET NOT NULL,
ALTER COLUMN "is_terminal" SET NOT NULL,
ALTER COLUMN "triggers_alert" SET NOT NULL,
ALTER COLUMN "sort_order" SET NOT NULL;

-- AlterTable
ALTER TABLE "workflow_transitions" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "conditions" SET NOT NULL;

-- AlterTable
ALTER TABLE "zones" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "is_active" SET NOT NULL;

-- CreateIndex
CREATE INDEX "delivery_zones_tenant_id_is_active_idx" ON "delivery_zones"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "product_options_tenant_id_id_idx" ON "product_options"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "product_options_groups_tenant_id_id_idx" ON "product_options_groups"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "products_tenant_id_sku_key" ON "products"("tenant_id", "sku");

-- CreateIndex
CREATE INDEX "website_settings_custom_domain_idx" ON "website_settings"("custom_domain");

-- CreateIndex
CREATE INDEX "workflow_definitions_tenant_id_id_idx" ON "workflow_definitions"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "workflow_states_tenant_id_id_idx" ON "workflow_states"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "zones_tenant_id_is_active_idx" ON "zones"("tenant_id", "is_active");

-- AddForeignKey
ALTER TABLE "regions" ADD CONSTRAINT "regions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_requests" ADD CONSTRAINT "tenant_requests_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_requests" ADD CONSTRAINT "tenant_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_options_groups" ADD CONSTRAINT "product_options_groups_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_options_groups" ADD CONSTRAINT "product_options_groups_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_options" ADD CONSTRAINT "product_options_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "product_options_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_options" ADD CONSTRAINT "product_options_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_workflow_state_id_fkey" FOREIGN KEY ("workflow_state_id") REFERENCES "workflow_states"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zones" ADD CONSTRAINT "zones_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_fields" ADD CONSTRAINT "custom_fields_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_custom_field_id_fkey" FOREIGN KEY ("custom_field_id") REFERENCES "custom_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_definitions" ADD CONSTRAINT "workflow_definitions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_states" ADD CONSTRAINT "workflow_states_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflow_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_states" ADD CONSTRAINT "workflow_states_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflow_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_from_state_id_fkey" FOREIGN KEY ("from_state_id") REFERENCES "workflow_states"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_to_state_id_fkey" FOREIGN KEY ("to_state_id") REFERENCES "workflow_states"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "website_settings" ADD CONSTRAINT "website_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "website_settings" ADD CONSTRAINT "website_settings_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "themes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_modules" ADD CONSTRAINT "tenant_modules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_modules" ADD CONSTRAINT "tenant_modules_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rules" ADD CONSTRAINT "rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_zones" ADD CONSTRAINT "delivery_zones_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_agents" ADD CONSTRAINT "delivery_agents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_agents" ADD CONSTRAINT "delivery_agents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_agents" ADD CONSTRAINT "delivery_agents_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "delivery_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "delivery_agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_sessions" ADD CONSTRAINT "pos_sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_sessions" ADD CONSTRAINT "pos_sessions_opened_by_fkey" FOREIGN KEY ("opened_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_sessions" ADD CONSTRAINT "pos_sessions_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_categories_tenant" RENAME TO "categories_tenant_id_id_idx";

-- RenameIndex
ALTER INDEX "idx_categories_tenant_active" RENAME TO "categories_tenant_id_is_active_sort_order_idx";

-- RenameIndex
ALTER INDEX "idx_categories_tenant_parent" RENAME TO "categories_tenant_id_parent_id_idx";

-- RenameIndex
ALTER INDEX "idx_cfv_tenant_entity" RENAME TO "custom_field_values_tenant_id_entity_type_entity_id_idx";

-- RenameIndex
ALTER INDEX "idx_cfv_tenant_field" RENAME TO "custom_field_values_tenant_id_custom_field_id_idx";

-- RenameIndex
ALTER INDEX "idx_custom_fields_tenant" RENAME TO "custom_fields_tenant_id_id_idx";

-- RenameIndex
ALTER INDEX "idx_custom_fields_tenant_entity" RENAME TO "custom_fields_tenant_id_entity_type_sort_order_idx";

-- RenameIndex
ALTER INDEX "idx_customers_tenant" RENAME TO "customers_tenant_id_id_idx";

-- RenameIndex
ALTER INDEX "idx_customers_tenant_created" RENAME TO "customers_tenant_id_created_at_idx";

-- RenameIndex
ALTER INDEX "idx_customers_tenant_segment" RENAME TO "customers_tenant_id_segment_idx";

-- RenameIndex
ALTER INDEX "idx_customers_tenant_visit" RENAME TO "customers_tenant_id_last_visit_at_idx";

-- RenameIndex
ALTER INDEX "idx_deliveries_order" RENAME TO "deliveries_order_id_idx";

-- RenameIndex
ALTER INDEX "idx_deliveries_tenant" RENAME TO "deliveries_tenant_id_id_idx";

-- RenameIndex
ALTER INDEX "idx_deliveries_tenant_agent" RENAME TO "deliveries_tenant_id_agent_id_status_idx";

-- RenameIndex
ALTER INDEX "idx_deliveries_tenant_status" RENAME TO "deliveries_tenant_id_status_idx";

-- RenameIndex
ALTER INDEX "idx_delivery_agents_available" RENAME TO "delivery_agents_tenant_id_is_available_idx";

-- RenameIndex
ALTER INDEX "idx_delivery_agents_tenant" RENAME TO "delivery_agents_tenant_id_id_idx";

-- RenameIndex
ALTER INDEX "idx_delivery_agents_user" RENAME TO "delivery_agents_tenant_id_user_id_idx";

-- RenameIndex
ALTER INDEX "idx_delivery_zones_tenant" RENAME TO "delivery_zones_tenant_id_id_idx";

-- RenameIndex
ALTER INDEX "idx_invitations_tenant" RENAME TO "invitations_tenant_id_revoked_at_accepted_at_idx";

-- RenameIndex
ALTER INDEX "idx_invitations_token" RENAME TO "invitations_token_idx";

-- RenameIndex
ALTER INDEX "idx_loyalty_tenant_created" RENAME TO "loyalty_transactions_tenant_id_created_at_idx";

-- RenameIndex
ALTER INDEX "idx_loyalty_tenant_customer" RENAME TO "loyalty_transactions_tenant_id_customer_id_idx";

-- RenameIndex
ALTER INDEX "idx_modules_is_active" RENAME TO "modules_is_active_idx";

-- RenameIndex
ALTER INDEX "idx_modules_slug" RENAME TO "modules_slug_idx";

-- RenameIndex
ALTER INDEX "idx_notifications_tenant_created" RENAME TO "notifications_tenant_id_created_at_idx";

-- RenameIndex
ALTER INDEX "idx_notifications_tenant_user" RENAME TO "notifications_tenant_id_user_id_is_read_idx";

-- RenameIndex
ALTER INDEX "idx_order_items_tenant_order" RENAME TO "order_items_tenant_id_order_id_idx";

-- RenameIndex
ALTER INDEX "idx_order_items_tenant_product" RENAME TO "order_items_tenant_id_product_id_created_at_idx";

-- RenameIndex
ALTER INDEX "idx_orders_tenant" RENAME TO "orders_tenant_id_id_idx";

-- RenameIndex
ALTER INDEX "idx_orders_tenant_created" RENAME TO "orders_tenant_id_created_at_idx";

-- RenameIndex
ALTER INDEX "idx_orders_tenant_status" RENAME TO "orders_tenant_id_status_idx";

-- RenameIndex
ALTER INDEX "idx_orders_tenant_type" RENAME TO "orders_tenant_id_type_created_at_idx";

-- RenameIndex
ALTER INDEX "idx_orders_tenant_workflow" RENAME TO "orders_tenant_id_workflow_state_id_idx";

-- RenameIndex
ALTER INDEX "idx_pages_tenant_published" RENAME TO "pages_tenant_id_is_published_sort_order_idx";

-- RenameIndex
ALTER INDEX "idx_pages_tenant_slug" RENAME TO "pages_tenant_id_slug_idx";

-- RenameIndex
ALTER INDEX "idx_payments_tenant_created" RENAME TO "payments_tenant_id_created_at_idx";

-- RenameIndex
ALTER INDEX "idx_payments_tenant_method" RENAME TO "payments_tenant_id_method_created_at_idx";

-- RenameIndex
ALTER INDEX "idx_payments_tenant_order" RENAME TO "payments_tenant_id_order_id_idx";

-- RenameIndex
ALTER INDEX "idx_payments_tenant_status" RENAME TO "payments_tenant_id_status_idx";

-- RenameIndex
ALTER INDEX "idx_permissions_module" RENAME TO "permissions_module_idx";

-- RenameIndex
ALTER INDEX "idx_permissions_module_action" RENAME TO "permissions_module_action_idx";

-- RenameIndex
ALTER INDEX "idx_plans_is_active" RENAME TO "plans_is_active_idx";

-- RenameIndex
ALTER INDEX "idx_pos_sessions_tenant_status" RENAME TO "pos_sessions_tenant_id_status_idx";

-- RenameIndex
ALTER INDEX "idx_product_options_tenant_group" RENAME TO "product_options_tenant_id_group_id_idx";

-- RenameIndex
ALTER INDEX "idx_product_option_groups_tenant_product" RENAME TO "product_options_groups_tenant_id_product_id_idx";

-- RenameIndex
ALTER INDEX "idx_products_tenant" RENAME TO "products_tenant_id_id_idx";

-- RenameIndex
ALTER INDEX "idx_products_tenant_cat" RENAME TO "products_tenant_id_category_id_is_available_idx";

-- RenameIndex
ALTER INDEX "idx_products_tenant_created" RENAME TO "products_tenant_id_created_at_idx";

-- RenameIndex
ALTER INDEX "idx_products_tenant_featured" RENAME TO "products_tenant_id_is_featured_idx";

-- RenameIndex
ALTER INDEX "idx_regions_country_code" RENAME TO "regions_country_code_idx";

-- RenameIndex
ALTER INDEX "idx_regions_is_active" RENAME TO "regions_is_active_idx";

-- RenameIndex
ALTER INDEX "idx_reservations_tenant" RENAME TO "reservations_tenant_id_id_idx";

-- RenameIndex
ALTER INDEX "idx_reservations_tenant_date" RENAME TO "reservations_tenant_id_reserved_at_idx";

-- RenameIndex
ALTER INDEX "idx_reservations_tenant_status" RENAME TO "reservations_tenant_id_status_idx";

-- RenameIndex
ALTER INDEX "idx_reservations_tenant_table" RENAME TO "reservations_tenant_id_table_id_reserved_at_idx";

-- RenameIndex
ALTER INDEX "idx_roles_is_system" RENAME TO "roles_is_system_idx";

-- RenameIndex
ALTER INDEX "idx_roles_tenant_slug" RENAME TO "roles_tenant_id_slug_idx";

-- RenameIndex
ALTER INDEX "idx_rules_tenant" RENAME TO "rules_tenant_id_id_idx";

-- RenameIndex
ALTER INDEX "idx_rules_tenant_created" RENAME TO "rules_tenant_id_created_at_idx";

-- RenameIndex
ALTER INDEX "idx_rules_tenant_event" RENAME TO "rules_tenant_id_event_trigger_is_active_idx";

-- RenameIndex
ALTER INDEX "idx_settings_tenant_category" RENAME TO "settings_tenant_id_category_idx";

-- RenameIndex
ALTER INDEX "idx_settings_tenant_key" RENAME TO "settings_tenant_id_key_idx";

-- RenameIndex
ALTER INDEX "idx_tables_tenant" RENAME TO "tables_tenant_id_id_idx";

-- RenameIndex
ALTER INDEX "idx_tables_tenant_active" RENAME TO "tables_tenant_id_is_active_idx";

-- RenameIndex
ALTER INDEX "idx_tables_tenant_zone" RENAME TO "tables_tenant_id_zone_id_is_active_idx";

-- RenameIndex
ALTER INDEX "idx_tenant_modules" RENAME TO "tenant_modules_tenant_id_module_id_idx";

-- RenameIndex
ALTER INDEX "idx_tenant_modules_active" RENAME TO "tenant_modules_tenant_id_is_active_idx";

-- RenameIndex
ALTER INDEX "idx_tenant_requests_owner_email" RENAME TO "tenant_requests_owner_email_idx";

-- RenameIndex
ALTER INDEX "idx_tenant_requests_region_status" RENAME TO "tenant_requests_region_id_status_idx";

-- RenameIndex
ALTER INDEX "idx_tenant_requests_status" RENAME TO "tenant_requests_status_idx";

-- RenameIndex
ALTER INDEX "idx_tenants_region_status" RENAME TO "tenants_region_id_status_idx";

-- RenameIndex
ALTER INDEX "idx_tenants_status" RENAME TO "tenants_status_idx";

-- RenameIndex
ALTER INDEX "idx_themes_active" RENAME TO "themes_is_active_is_premium_idx";

-- RenameIndex
ALTER INDEX "idx_themes_slug" RENAME TO "themes_slug_idx";

-- RenameIndex
ALTER INDEX "idx_user_permissions_tenant_user" RENAME TO "user_permissions_tenant_id_user_id_idx";

-- RenameIndex
ALTER INDEX "idx_user_roles_role" RENAME TO "user_roles_role_id_idx";

-- RenameIndex
ALTER INDEX "idx_user_roles_tenant_user" RENAME TO "user_roles_tenant_id_user_id_idx";

-- RenameIndex
ALTER INDEX "idx_users_tenant" RENAME TO "users_tenant_id_idx";

-- RenameIndex
ALTER INDEX "idx_users_tenant_active" RENAME TO "users_tenant_id_is_active_idx";

-- RenameIndex
ALTER INDEX "idx_workflow_defs_tenant_entity" RENAME TO "workflow_definitions_tenant_id_entity_type_idx";

-- RenameIndex
ALTER INDEX "idx_workflow_states_tenant_wf" RENAME TO "workflow_states_tenant_id_workflow_id_sort_order_idx";

-- RenameIndex
ALTER INDEX "idx_workflow_transitions_from" RENAME TO "workflow_transitions_workflow_id_from_state_id_idx";

-- RenameIndex
ALTER INDEX "idx_workflow_transitions_to" RENAME TO "workflow_transitions_workflow_id_to_state_id_idx";

-- RenameIndex
ALTER INDEX "idx_zones_tenant" RENAME TO "zones_tenant_id_id_idx";
