
DROP POLICY IF EXISTS "System insert notifications" ON public.notifications;
CREATE POLICY "Authenticated insert notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
