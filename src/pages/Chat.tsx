import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageCircle } from "lucide-react";

interface ChatMessage {
  id: string;
  message: string;
  is_admin: boolean;
  is_system: boolean;
  created_at: string;
}

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!user) return;
    const { data } = await supabase.from("chats").select("*").eq("user_id", user.id).order("created_at", { ascending: true });
    if (data) setMessages(data);
  };

  useEffect(() => { fetchMessages(); }, [user]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    await supabase.from("chats").insert({ user_id: user.id, message: input.trim(), is_admin: false });
    setInput("");
    await fetchMessages();
  };

  return (
    <div className="container px-4 py-8 max-w-2xl animate-fade-in">
      <h1 className="font-display text-3xl font-bold mb-6">Customer Support</h1>
      <Card className="h-[60vh] flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="font-display flex items-center gap-2"><MessageCircle className="h-5 w-5" /> Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-muted-foreground py-10">Send a message to start a conversation</p>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.is_admin || msg.is_system ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[75%] rounded-lg px-4 py-2 text-sm ${
                msg.is_system ? "bg-muted text-muted-foreground italic" :
                msg.is_admin ? "bg-secondary text-secondary-foreground" :
                "bg-primary text-primary-foreground"
              }`}>
                {msg.is_admin && <span className="text-xs font-bold block mb-1">Admin</span>}
                <p>{msg.message}</p>
                <span className="text-[10px] opacity-70 mt-1 block">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </CardContent>
        <form onSubmit={sendMessage} className="border-t p-4 flex gap-2">
          <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." className="flex-1" />
          <Button type="submit" size="icon"><Send className="h-4 w-4" /></Button>
        </form>
      </Card>
    </div>
  );
}
