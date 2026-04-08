# Project Memory

## Core
"The Rejoice Collection" - Nigerian luxury e-commerce. Dark gradient black theme with gold accents hsl(40,70%,50%). Playfair Display headings, DM Sans body. Glassmorphism UI.
Admin email: michealvictor0014@gmail.com. Auto-assigned admin role on signup via trigger.
Lovable Cloud with RLS. Currency: ₦ (NGN). Bank transfer checkout. Uploads bucket is public.

## Memories
- [Auth setup](mem://features/auth) — Supabase auth, auto-confirm emails, admin auto-assign trigger for specific email, Google OAuth
- [Database schema](mem://features/schema) — profiles, products, orders, cart_items, announcements, negotiations, chats, settings, user_roles, promo_codes, spin_wheels, spin_results, popup_ads, events, coupons, coupon_usage, promo_usage, category_discounts
- [Discounts](mem://features/discounts) — Product-level discounts (discount_percent, discount_ends_at), category discounts with time periods, promo codes, coupons from admin/spin/events/negotiations
- [Negotiations](mem://features/negotiations) — Auto-generates 30-min single-use coupons on accept/counter-offer
