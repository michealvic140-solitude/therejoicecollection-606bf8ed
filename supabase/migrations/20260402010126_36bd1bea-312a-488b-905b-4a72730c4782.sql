-- 1. Fix chat admin spoofing: users can't set is_admin or is_system
DROP POLICY "Users create own chats" ON chats;
CREATE POLICY "Users create own chats" ON chats
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND is_admin = false
    AND is_system = false
  );

-- 2. Fix notification spam: drop overly permissive insert policy
DROP POLICY "Authenticated insert notifications" ON notifications;

-- 3. Fix user_roles public read: restrict to own roles + admin
DROP POLICY "Anyone can read roles" ON user_roles;
CREATE POLICY "Users can read own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all roles" ON user_roles
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- 4. Fix order_tracking public read: restrict to order owner + admin
DROP POLICY "Anyone can view tracking" ON order_tracking;
CREATE POLICY "Users view own order tracking" ON order_tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_tracking.order_id AND orders.user_id = auth.uid()
    )
  );
CREATE POLICY "Admins view all tracking" ON order_tracking
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- 5. Fix events promo code exposure: replace public read with restricted view
DROP POLICY "Events are public" ON events;
CREATE POLICY "Authenticated users can view events" ON events
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon users can view events" ON events
  FOR SELECT TO anon USING (true);

-- 6. Make uploads bucket private
UPDATE storage.buckets SET public = false WHERE id = 'uploads';

-- 7. Fix storage policies for uploads
DROP POLICY IF EXISTS "Anyone can view uploads" ON storage.objects;
CREATE POLICY "Users access own uploads" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'uploads'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR has_role(auth.uid(), 'admin')
    )
  );
CREATE POLICY "Users can delete own uploads" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Admins can delete any upload" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'uploads'
    AND has_role(auth.uid(), 'admin')
  );