import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

export function Layout() {
  const [contacts, setContacts] = useState<Record<string, string>>({});
  const [maintenance, setMaintenance] = useState(false);
  const { isAdmin, profile } = useAuth();
  const location = useLocation();

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

  // Check if user is banned
  const isBanned = profile?.status === "Banned";

  if (isBanned && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center space-y-4">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto" />
          <h1 className="font-display text-2xl font-bold">Account Suspended</h1>
          <p className="text-muted-foreground">Your account has been suspended. Please contact support for assistance.</p>
          <a href={contacts.whatsapp ? `https://wa.me/${contacts.whatsapp.replace(/\D/g, "")}` : "/chat"}>
            <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium">Contact Support</button>
          </a>
        </div>
      </div>
    );
  }

  if (maintenance && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <span className="font-display text-2xl font-bold text-gold">TRC</span>
          </div>
          <h1 className="font-display text-3xl font-bold">Under Maintenance</h1>
          <p className="text-muted-foreground leading-relaxed">
            We're currently performing scheduled maintenance to improve your shopping experience. We'll be back shortly. Thank you for your patience.
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
      <footer className="border-t bg-card/50">
        <div className="container px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-display text-sm font-bold text-gold">TRC</span>
                </div>
                <span className="font-display text-lg font-bold">The Rejoice Collection</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Nigeria's premier destination for luxury fashion and accessories. Quality guaranteed.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-display font-semibold mb-3">Quick Links</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="/shop" className="block hover:text-foreground transition-colors">Shop</a>
                <a href="/orders" className="block hover:text-foreground transition-colors">Track Order</a>
                <a href="/chat" className="block hover:text-foreground transition-colors">Support</a>
                <a href="/profile" className="block hover:text-foreground transition-colors">My Account</a>
              </div>
            </div>

            {/* Contact */}
            {hasContact && (
              <div>
                <h4 className="font-display font-semibold mb-3">Contact Us</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {contacts.whatsapp && (
                    <a href={`https://wa.me/${contacts.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="block hover:text-foreground transition-colors">
                      📱 WhatsApp: {contacts.whatsapp}
                    </a>
                  )}
                  {contacts.contact_phone && (
                    <a href={`tel:${contacts.contact_phone}`} className="block hover:text-foreground transition-colors">
                      📞 Phone: {contacts.contact_phone}
                    </a>
                  )}
                  {contacts.contact_email && (
                    <a href={`mailto:${contacts.contact_email}`} className="block hover:text-foreground transition-colors">
                      ✉️ Email: {contacts.contact_email}
                    </a>
                  )}
                  {contacts.instagram && (
                    <a href={contacts.instagram} target="_blank" rel="noopener noreferrer" className="block hover:text-foreground transition-colors">
                      📸 Instagram
                    </a>
                  )}
                  {contacts.facebook && (
                    <a href={contacts.facebook} target="_blank" rel="noopener noreferrer" className="block hover:text-foreground transition-colors">
                      📘 Facebook
                    </a>
                  )}
                  {contacts.tiktok && (
                    <a href={contacts.tiktok} target="_blank" rel="noopener noreferrer" className="block hover:text-foreground transition-colors">
                      🎵 TikTok
                    </a>
                  )}
                  {contacts.contact_sms && (
                    <a href={`sms:${contacts.contact_sms}`} className="block hover:text-foreground transition-colors">
                      💬 SMS: {contacts.contact_sms}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} The Rejoice Collection. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
