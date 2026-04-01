
-- Add delivery address fields to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS state text DEFAULT '',
  ADD COLUMN IF NOT EXISTS city text DEFAULT '',
  ADD COLUMN IF NOT EXISTS lga text DEFAULT '',
  ADD COLUMN IF NOT EXISTS landmark text DEFAULT '',
  ADD COLUMN IF NOT EXISTS badge text NOT NULL DEFAULT 'Regular',
  ADD COLUMN IF NOT EXISTS warning_message text DEFAULT '',
  ADD COLUMN IF NOT EXISTS restricted boolean NOT NULL DEFAULT false;

-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  link text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins insert notifications" ON public.notifications FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "System insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view all notifications" ON public.notifications FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Order tracking table
CREATE TABLE public.order_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL,
  status text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view tracking" ON public.order_tracking FOR SELECT USING (true);
CREATE POLICY "Admins insert tracking" ON public.order_tracking FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update tracking" ON public.order_tracking FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Events/Countdown table
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text DEFAULT '',
  promo_code text DEFAULT '',
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events are public" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins manage events" ON public.events FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Reviews table
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  order_id text NOT NULL,
  rating integer NOT NULL DEFAULT 5,
  comment text DEFAULT '',
  image_url text DEFAULT '',
  delivery_rating integer DEFAULT NULL,
  delivery_comment text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are public" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users create own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage reviews" ON public.reviews FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add realtime for chats and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Add more settings keys for contacts and maintenance
INSERT INTO public.settings (key, value) VALUES
  ('whatsapp', ''),
  ('facebook', ''),
  ('tiktok', ''),
  ('instagram', ''),
  ('contact_phone', ''),
  ('contact_sms', ''),
  ('contact_email', ''),
  ('maintenance_mode', 'false')
ON CONFLICT DO NOTHING;
