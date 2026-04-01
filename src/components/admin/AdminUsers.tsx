import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/format";
import { Send, Eye, Shield, Ban, AlertTriangle, Star, MessageSquare } from "lucide-react";
import { toast } from "sonner";

type Profile = Tables<"profiles"> & { state?: string; city?: string; lga?: string; landmark?: string; badge?: string; warning_message?: string; restricted?: boolean };

export function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [msgDialog, setMsgDialog] = useState<string | null>(null);
  const [broadcastDialog, setBroadcastDialog] = useState(false);
  const [message, setMessage] = useState("");
  const [msgTitle, setMsgTitle] = useState("");
  const [userOrders, setUserOrders] = useState<any[]>([]);

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setUsers(data as Profile[]);
  };

  useEffect(() => { fetchUsers(); }, []);

  const updateStatus = async (userId: string, status: string) => {
    await supabase.from("profiles").update({ status } as any).eq("user_id", userId);
    if (status === "Banned") {
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "Account Banned",
        message: "Your account has been banned. Please contact support for more information.",
        type: "error",
        link: "/chat",
      } as any);
    }
    toast.success(`User status updated to ${status}`);
    fetchUsers();
  };

  const updateBadge = async (userId: string, badge: string) => {
    await supabase.from("profiles").update({ badge } as any).eq("user_id", userId);
    toast.success(`Badge updated to ${badge}`);
    fetchUsers();
  };

  const toggleRestriction = async (user: Profile) => {
    const restricted = !(user as any).restricted;
    await supabase.from("profiles").update({ restricted } as any).eq("user_id", user.user_id);
    await supabase.from("notifications").insert({
      user_id: user.user_id,
      title: restricted ? "Account Restricted" : "Restriction Removed",
      message: restricted ? "Your account has been restricted from making purchases." : "Your purchasing restriction has been lifted.",
      type: restricted ? "warning" : "success",
    } as any);
    toast.success(restricted ? "User restricted" : "Restriction removed");
    fetchUsers();
  };

  const sendWarning = async (userId: string, warning: string) => {
    await supabase.from("profiles").update({ warning_message: warning } as any).eq("user_id", userId);
    await supabase.from("notifications").insert({
      user_id: userId,
      title: "⚠️ Warning",
      message: warning,
      type: "warning",
    } as any);
    toast.success("Warning sent");
  };

  const sendPrivateMessage = async (userId: string) => {
    if (!message.trim()) return;
    await supabase.from("notifications").insert({
      user_id: userId,
      title: msgTitle || "Message from Admin",
      message: message,
      type: "info",
    } as any);
    toast.success("Message sent");
    setMsgDialog(null);
    setMessage("");
    setMsgTitle("");
  };

  const broadcastMessage = async () => {
    if (!message.trim()) return;
    const inserts = users.map(u => ({
      user_id: u.user_id,
      title: msgTitle || "Announcement",
      message: message,
      type: "info" as const,
    }));
    await supabase.from("notifications").insert(inserts as any);
    toast.success(`Message sent to ${users.length} users`);
    setBroadcastDialog(false);
    setMessage("");
    setMsgTitle("");
  };

  const viewUserProfile = async (user: Profile) => {
    setSelectedUser(user);
    const { data } = await supabase.from("orders").select("*").eq("user_id", user.user_id).order("created_at", { ascending: false });
    setUserOrders(data || []);
  };

  const badgeColors: Record<string, string> = {
    VIP: "bg-gold text-accent-foreground",
    Verified: "bg-blue-100 text-blue-800",
    Regular: "bg-secondary text-secondary-foreground",
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="font-display text-xl font-bold">Users ({users.length})</h2>
        <Button onClick={() => setBroadcastDialog(true)} className="gap-1">
          <Send className="h-4 w-4" /> Broadcast Message
        </Button>
      </div>

      {users.map(u => (
        <Card key={u.id}>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-semibold">{u.full_name || "No name"}</p>
                  <p className="text-sm text-muted-foreground">{u.username || "No username"} · {u.phone || "No phone"}</p>
                </div>
                <Badge className={badgeColors[(u as any).badge || "Regular"]}>{(u as any).badge || "Regular"}</Badge>
                {u.status === "Banned" && <Badge variant="destructive">Banned</Badge>}
                {(u as any).restricted && <Badge variant="secondary">Restricted</Badge>}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={u.status} onValueChange={v => updateStatus(u.user_id, v)}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Banned">Banned</SelectItem>
                    <SelectItem value="Frozen">Frozen</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={(u as any).badge || "Regular"} onValueChange={v => updateBadge(u.user_id, v)}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Regular">Regular</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="Verified">Verified</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => toggleRestriction(u)} title={`${(u as any).restricted ? "Unrestrict" : "Restrict"}`}>
                  <Ban className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => {
                  const msg = prompt("Enter warning message:");
                  if (msg) sendWarning(u.user_id, msg);
                }} title="Send Warning">
                  <AlertTriangle className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setMsgDialog(u.user_id)} title="Private Message">
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => viewUserProfile(u)} title="View Profile">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Private Message Dialog */}
      <Dialog open={!!msgDialog} onOpenChange={() => setMsgDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send Private Message</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Title</Label><Input value={msgTitle} onChange={e => setMsgTitle(e.target.value)} placeholder="Message title" /></div>
            <div className="space-y-2"><Label>Message</Label><Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your message..." /></div>
            <Button onClick={() => msgDialog && sendPrivateMessage(msgDialog)} className="w-full">Send</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Broadcast Dialog */}
      <Dialog open={broadcastDialog} onOpenChange={setBroadcastDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Broadcast to All Users</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Title</Label><Input value={msgTitle} onChange={e => setMsgTitle(e.target.value)} placeholder="Announcement title" /></div>
            <div className="space-y-2"><Label>Message</Label><Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your broadcast..." /></div>
            <Button onClick={broadcastMessage} className="w-full">Send to {users.length} Users</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Profile Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>User Profile</DialogTitle></DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Name:</strong> {selectedUser.full_name}</div>
                <div><strong>Username:</strong> {selectedUser.username || "—"}</div>
                <div><strong>Phone:</strong> {selectedUser.phone || "—"}</div>
                <div><strong>Status:</strong> {selectedUser.status}</div>
                <div><strong>Badge:</strong> {(selectedUser as any).badge || "Regular"}</div>
                <div><strong>DOB:</strong> {selectedUser.dob || "—"}</div>
                <div className="col-span-2"><strong>State:</strong> {(selectedUser as any).state || "—"} · <strong>City:</strong> {(selectedUser as any).city || "—"}</div>
                <div className="col-span-2"><strong>LGA:</strong> {(selectedUser as any).lga || "—"} · <strong>Landmark:</strong> {(selectedUser as any).landmark || "—"}</div>
                <div className="col-span-2"><strong>Address:</strong> {selectedUser.address || "—"}</div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Order History ({userOrders.length})</h4>
                {userOrders.map((o: any) => (
                  <div key={o.id} className="border-b py-2 text-sm flex justify-between">
                    <span className="font-mono">{o.id}</span>
                    <Badge variant="secondary">{o.status}</Badge>
                    <span className="font-bold">{formatPrice(o.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
