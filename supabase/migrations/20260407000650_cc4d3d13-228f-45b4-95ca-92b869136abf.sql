
-- Coupons table with expiry, user targeting, source tracking
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  discount_percent numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  min_quantity integer NOT NULL DEFAULT 1,
  max_uses integer DEFAULT NULL,
  used_count integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamp with time zone DEFAULT NULL,
  user_id uuid DEFAULT NULL,
  for_all_users boolean NOT NULL DEFAULT true,
  source text NOT NULL DEFAULT 'admin',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view own coupons" ON public.coupons FOR SELECT TO public
  USING (for_all_users = true OR user_id = auth.uid());
