
-- Add discount columns to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_percent numeric DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_ends_at timestamptz DEFAULT NULL;

-- Add max_spins to spin_wheels
ALTER TABLE public.spin_wheels ADD COLUMN IF NOT EXISTS max_spins_per_user integer DEFAULT 1;

-- Add logo_url setting capability (uses existing settings table)

-- Add coupon_usage tracking table
CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid REFERENCES public.coupons(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  used_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage coupon usage" ON public.coupon_usage
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users insert own coupon usage" ON public.coupon_usage
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own coupon usage" ON public.coupon_usage
  FOR SELECT TO public USING (auth.uid() = user_id);

-- Add promo_code_usage tracking table
CREATE TABLE IF NOT EXISTS public.promo_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid REFERENCES public.promo_codes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  used_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage promo usage" ON public.promo_usage
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users insert own promo usage" ON public.promo_usage
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);

-- Add category discount table
CREATE TABLE IF NOT EXISTS public.category_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  discount_percent numeric NOT NULL DEFAULT 0,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.category_discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage category discounts" ON public.category_discounts
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone view active category discounts" ON public.category_discounts
  FOR SELECT TO public USING (true);
