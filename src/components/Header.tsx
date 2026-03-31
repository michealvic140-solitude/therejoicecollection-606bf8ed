import { Link } from "react-router-dom";
import { ShoppingCart, User, Menu, X, MessageCircle, Crown } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const { itemCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [banner, setBanner] = useState("");

  useEffect(() => {
    supabase.from("settings").select("value").eq("key", "banner").single()
      .then(({ data }) => { if (data) setBanner(data.value); });
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b">
      {banner && (
        <div className="bg-primary text-primary-foreground text-center text-xs py-1.5 px-4 font-medium tracking-wider">
          {banner}
        </div>
      )}
      <div className="container flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <Crown className="h-6 w-6 text-gold" />
          <span className="font-display text-xl font-bold tracking-tight">The Rejoice Collection</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <Link to="/shop" className="hover:text-primary transition-colors">Shop</Link>
          {user && <Link to="/orders" className="hover:text-primary transition-colors">Orders</Link>}
          {user && <Link to="/chat" className="hover:text-primary transition-colors flex items-center gap-1"><MessageCircle className="h-4 w-4" />Support</Link>}
          {isAdmin && <Link to="/admin" className="hover:text-primary transition-colors text-gold font-semibold">Admin</Link>}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/cart" className="relative p-2 hover:bg-muted rounded-md transition-colors">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold text-accent-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {itemCount}
                  </span>
                )}
              </Link>
              <Link to="/profile" className="p-2 hover:bg-muted rounded-md transition-colors">
                <User className="h-5 w-5" />
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut} className="hidden md:inline-flex">
                Logout
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login"><Button variant="ghost" size="sm">Login</Button></Link>
              <Link to="/register"><Button size="sm">Sign Up</Button></Link>
            </div>
          )}
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-card p-4 space-y-3 animate-fade-in">
          <Link to="/" className="block py-2 hover:text-primary" onClick={() => setMobileOpen(false)}>Home</Link>
          <Link to="/shop" className="block py-2 hover:text-primary" onClick={() => setMobileOpen(false)}>Shop</Link>
          {user && <Link to="/orders" className="block py-2 hover:text-primary" onClick={() => setMobileOpen(false)}>My Orders</Link>}
          {user && <Link to="/chat" className="block py-2 hover:text-primary" onClick={() => setMobileOpen(false)}>Support Chat</Link>}
          {isAdmin && <Link to="/admin" className="block py-2 text-gold font-semibold" onClick={() => setMobileOpen(false)}>Admin Panel</Link>}
          {user && <button onClick={() => { signOut(); setMobileOpen(false); }} className="block py-2 text-destructive">Logout</button>}
        </div>
      )}
    </header>
  );
}
