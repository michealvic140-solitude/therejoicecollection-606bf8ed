import { Link } from "react-router-dom";
import { ShoppingCart, User, Menu, X, MessageCircle, Bell, Crown } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string;
  created_at: string;
}

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const { itemCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [banner, setBanner] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    supabase.from("settings").select("value").eq("key", "banner").single()
      .then(({ data }) => { if (data) setBanner(data.value); });
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      const { data } = await supabase.from("notifications").select("*")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
      if (data) setNotifications(data as Notification[]);
    };
    fetchNotifications();

    // Real-time notifications
    const channel = supabase.channel("user-notifications")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      await supabase.from("notifications").update({ read: true } as any).eq("id", n.id);
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const typeIcons: Record<string, string> = {
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  };

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b shadow-sm">
      {banner && (
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-center text-xs py-1.5 px-4 font-medium tracking-wider">
          {banner}
        </div>
      )}
      <div className="container flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-primary/10 border border-gold/30 flex items-center justify-center">
            <span className="font-display text-xs font-bold text-gold">TRC</span>
          </div>
          <span className="font-display text-lg font-bold tracking-tight hidden sm:block">The Rejoice Collection</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <Link to="/shop" className="hover:text-primary transition-colors">Shop</Link>
          {user && <Link to="/orders" className="hover:text-primary transition-colors">Orders</Link>}
          {user && <Link to="/chat" className="hover:text-primary transition-colors flex items-center gap-1"><MessageCircle className="h-4 w-4" />Support</Link>}
          {isAdmin && <Link to="/admin" className="hover:text-primary transition-colors text-gold font-semibold">Admin</Link>}
        </nav>

        <div className="flex items-center gap-2">
          {user && (
            <>
              {/* Notifications */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="relative p-2 hover:bg-muted rounded-md transition-colors">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="flex items-center justify-between p-3 border-b">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>Mark all read</Button>
                    )}
                  </div>
                  <ScrollArea className="h-64">
                    {notifications.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-8">No notifications</p>
                    ) : (
                      notifications.map(n => (
                        <Link key={n.id} to={n.link || "#"} className={`block p-3 border-b hover:bg-muted/50 transition-colors ${!n.read ? "bg-primary/5" : ""}`}>
                          <div className="flex gap-2">
                            <span className="text-sm">{typeIcons[n.type] || "📌"}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${!n.read ? "font-semibold" : ""}`}>{n.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {new Date(n.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              <Link to="/cart" className="relative p-2 hover:bg-muted rounded-md transition-colors">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-gold text-accent-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
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
          )}
          {!user && (
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
