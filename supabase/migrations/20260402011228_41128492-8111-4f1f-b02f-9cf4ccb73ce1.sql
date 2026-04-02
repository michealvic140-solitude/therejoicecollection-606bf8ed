ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method text NOT NULL DEFAULT 'delivery';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_location text NULL DEFAULT '';