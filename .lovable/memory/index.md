# Project Memory

## Core
"The Rejoice Collection" - Nigerian luxury e-commerce. Primary hsl(30,60%,28%), gold hsl(40,70%,50%). Playfair Display headings, DM Sans body.
Admin email: michealvictor0014@gmail.com. Auto-assigned admin role on signup via trigger.
Lovable Cloud with RLS. Currency: ₦ (NGN). Bank transfer checkout.

## Memories
- [Auth setup](mem://features/auth) — Supabase auth, auto-confirm emails, admin auto-assign trigger for specific email, Google OAuth, forgot/reset password flow
- [Database schema](mem://features/schema) — profiles, products, orders, cart_items, announcements, negotiations, chats, settings, user_roles, coupons, coupon_usage, promo_codes, promo_usage, category_discounts, spin_wheels, spin_results, reviews, notifications, events, popup_ads
- [VVIP Vault](mem://features/vault) — Private /vault page for users with badge="VVIP" in profiles. Products with category="vault"
- [AI Concierge](mem://features/ai-concierge) — Edge function ai-concierge using Lovable AI gateway, fetches inventory for context
- [Express Checkout](mem://features/express-checkout) — Buy Now button creates order directly using saved address, skips cart
