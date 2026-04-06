
-- Make uploads bucket public so product images display
UPDATE storage.buckets SET public = true WHERE id = 'uploads';

-- Create promo_codes table
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_percent numeric NOT NULL DEFAULT 0,
  min_quantity integer NOT NULL DEFAULT 1,
  max_uses integer DEFAULT NULL,
  used_count integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active promo codes" ON public.promo_codes FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage promo codes" ON public.promo_codes FOR ALL TO public USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create spin_wheels table (admin creates spin events with prizes as JSONB)
CREATE TABLE public.spin_wheels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  prizes jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.spin_wheels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active spins" ON public.spin_wheels FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage spins" ON public.spin_wheels FOR ALL TO public USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create spin_results table (tracks who won what)
CREATE TABLE public.spin_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  spin_wheel_id uuid REFERENCES public.spin_wheels(id) ON DELETE CASCADE NOT NULL,
  prize_name text NOT NULL DEFAULT '',
  prize_type text NOT NULL DEFAULT '',
  prize_value text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.spin_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own spins" ON public.spin_results FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Users create own spins" ON public.spin_results FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all spins" ON public.spin_results FOR SELECT TO public USING (has_role(auth.uid(), 'admin'));

-- Create popup_ads table
CREATE TABLE public.popup_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text DEFAULT '',
  link_type text NOT NULL DEFAULT 'product',
  link_id text NOT NULL DEFAULT '',
  discount_percent numeric DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.popup_ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active ads" ON public.popup_ads FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage ads" ON public.popup_ads FOR ALL TO public USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add delivery address columns to orders for admin visibility
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_address text DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_state text DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_city text DEFAULT '';
