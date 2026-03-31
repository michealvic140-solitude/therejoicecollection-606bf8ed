import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Users } from "lucide-react";
import { toast } from "sonner";

interface ChatUser {
  user_id: string;
  user_name: string;
  last_message: string;
  last_time: string;
}

interface ChatMsg {
  id: string;
  message: string;
  is_admin: boolean;
  is_system: boolean;
  created_at: string;
  user_id: string;
}

export function AdminChats() {
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchChatUsers = async () => {
    const { data } = await supabase.from("chats").select("user_id, message, created_at").order("created_at", { ascending: false });
    if (!data) return;
    const userMap = new Map<string, ChatUser>();
    for (const msg of data) {
      if (!userMap.has(msg.user_id)) {
        userMap.set(msg.user_id, {
          user_id: msg.user_id,
          user_name: "",
          last_message: msg.message,
          last_time: msg.created_at,
        });
      }
    }
    const userIds = [...userMap.keys()];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      if (profiles) {
        profiles.forEach(p => {
          const u = userMap.get(p.user_id);
          if (u) u.user_name = p.full_name;
        });
      }
    }
    setChatUsers([...userMap.values()]);
  };

  const fetchMessages = async (userId: string) => {
    const { data } = await supabase.from("chats").select("*").eq("user_id", userId).order("created_at", { ascending: true });
    if (data) setMessages(data);
  };

  useEffect(() => { fetchChatUsers(); }, []);
  useEffect(() => { if (selectedUserId) fetchMessages(selectedUserId); }, [selectedUserId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedUserId) return;
    await supabase.from("chats").insert({ user_id: selectedUserId, message: `[ADMIN] ${input.trim()}`, is_admin: true });
    setInput("");
    fetchMessages(selectedUserId);
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold flex items-center gap-2"><Users className="h-5 w-5" /> Customer Chats</h2>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2 md:col-span-1">
          {chatUsers.map(u => (
            <Card
              key={u.user_id}
              className={`cursor-pointer transition-colors ${selectedUserId === u.user_id ? "border-primary" : ""}`}
              onClick={() => setSelectedUserId(u.user_id)}
            >
              <CardContent className="p-3">
                <p className="font-semibold text-sm">{u.user_name || "Unknown"}</p>
                <p className="text-xs text-muted-foreground truncate">{u.last_message}</p>
              </CardContent>
            </Card>
          ))}
          {chatUsers.length === 0 && <p className="text-sm text-muted-foreground">No conversations yet</p>}
        </div>

        <Card className="md:col-span-2 flex flex-col h-[500px]">
          <CardHeader className="border-b py-3"><CardTitle className="text-base">{selectedUserId ? "Conversation" : "Select a chat"}</CardTitle></CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.is_admin ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-lg px-4 py-2 text-sm ${
                  msg.is_system ? "bg-muted text-muted-foreground italic" :
                  msg.is_admin ? "bg-primary text-primary-foreground" :
                  "bg-secondary text-secondary-foreground"
                }`}>
                  <p>{msg.message}</p>
                  <span className="text-[10px] opacity-70">{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </CardContent>
          {selectedUserId && (
            <form onSubmit={sendMessage} className="border-t p-3 flex gap-2">
              <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Reply..." className="flex-1" />
              <Button type="submit" size="icon"><Send className="h-4 w-4" /></Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
