import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { AIConcierge } from "./AIConcierge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, Phone, Mail, MessageCircle } from "lucide-react";

export function Layout() {
  const [contacts, setContacts] = useState<Record<string, string>>({});
  const [maintenance, setMaintenance] = useState(false);
  const { isAdmin, profile, user } = useAuth();

  useEffect(() => {
    supabase.from("settings").select("*").then(({ data }) => {
      if (data) {
        const s: Record<string, string> = {};
        data.forEach(r => { s[r.key] = r.value; });
        setContacts(s);
        if (s.maintenance_mode === "true") setMaintenance(true);
      }
    });
  }, []);

  const isBanned = profile?.status === "Banned";

  if (isBanned && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4 glass-card rounded-2xl p-8">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto" />
          <h1 className="font-display text-2xl font-bold">Account Suspended</h1>
          <p className="text-muted-foreground">Your account has been suspended. Please contact support for assistance.</p>
          <a href={contacts.whatsapp ? `https://wa.me/${contacts.whatsapp.replace(/\D/g, "")}` : "/chat"}>
            <button className="gradient-gold text-primary-foreground px-6 py-2 rounded-lg font-medium">Contact Support</button>
          </a>
        </div>
      </div>
    );
  }

  if (maintenance && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4 glass-card rounded-2xl p-8">
          <div className="w-20 h-20 mx-auto rounded-full gradient-gold flex items-center justify-center animate-glow">
            <span className="font-display text-2xl font-bold text-primary-foreground">TRC</span>
          </div>
          <h1 className="font-display text-3xl font-bold">Under Maintenance</h1>
          <p className="text-muted-foreground leading-relaxed">
            We're currently performing scheduled maintenance to improve your shopping experience. We'll be back shortly.
          </p>
          <p className="text-sm text-muted-foreground">— The Rejoice Collection Team</p>
        </div>
      </div>
    );
  }

  const hasContact = contacts.whatsapp || contacts.facebook || contacts.tiktok || contacts.instagram || contacts.contact_phone || contacts.contact_email;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>

      {/* AI Concierge - only for logged-in users */}
      {user && <AIConcierge />}

      <footer className="border-t border-border/50 glass">
        <div className="container px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center">
                  <span className="font-display text-sm font-bold text-primary-foreground">TRC</span>
                </div>
                <span className="font-display text-lg font-bold">The Rejoice Collection</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Nigeria's premier destination for luxury fashion and accessories. Quality guaranteed.
              </p>
            </div>

            <div>
              <h4 className="font-display font-semibold mb-3">Quick Links</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="/shop" className="block hover:text-gold transition-colors">Shop</a>
                <a href="/orders" className="block hover:text-gold transition-colors">Track Order</a>
                <a href="/chat" className="block hover:text-gold transition-colors">Support</a>
                <a href="/profile" className="block hover:text-gold transition-colors">My Account</a>
              </div>
            </div>

            {hasContact && (
              <div>
                <h4 className="font-display font-semibold mb-3">Contact Us</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {contacts.whatsapp && (
                    <a href={`https://wa.me/${contacts.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-gold transition-colors">
                      <MessageCircle className="h-4 w-4" /> WhatsApp: {contacts.whatsapp}
                    </a>
                  )}
                  {contacts.contact_phone && (
                    <a href={`tel:${contacts.contact_phone}`} className="flex items-center gap-2 hover:text-gold transition-colors">
                      <Phone className="h-4 w-4" /> Phone: {contacts.contact_phone}
                    </a>
                  )}
                  {contacts.contact_email && (
                    <a href={`mailto:${contacts.contact_email}`} className="flex items-center gap-2 hover:text-gold transition-colors">
                      <Mail className="h-4 w-4" /> Email: {contacts.contact_email}
                    </a>
                  )}
                  {contacts.instagram && (
                    <a href={contacts.instagram} target="_blank" rel="noopener noreferrer" className="block hover:text-gold transition-colors">Instagram</a>
                  )}
                  {contacts.facebook && (
                    <a href={contacts.facebook} target="_blank" rel="noopener noreferrer" className="block hover:text-gold transition-colors">Facebook</a>
                  )}
                  {contacts.tiktok && (
                    <a href={contacts.tiktok} target="_blank" rel="noopener noreferrer" className="block hover:text-gold transition-colors">TikTok</a>
                  )}
                  {contacts.contact_sms && (
                    <a href={`sms:${contacts.contact_sms}`} className="flex items-center gap-2 hover:text-gold transition-colors">
                      <MessageCircle className="h-4 w-4" /> SMS: {contacts.contact_sms}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-border/50 mt-8 pt-6 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} The Rejoice Collection. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
