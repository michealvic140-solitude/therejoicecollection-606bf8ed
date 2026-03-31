import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Profile = Tables<"profiles">;

export function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setUsers(data);
  };

  useEffect(() => { fetchUsers(); }, []);

  const updateStatus = async (userId: string, status: string) => {
    await supabase.from("profiles").update({ status }).eq("user_id", userId);
    toast.success(`User status updated to ${status}`);
    fetchUsers();
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold">Users ({users.length})</h2>
      {users.map(u => (
        <Card key={u.id}>
          <CardContent className="flex items-center justify-between p-4 flex-wrap gap-2">
            <div>
              <p className="font-semibold">{u.full_name || "No name"}</p>
              <p className="text-sm text-muted-foreground">{u.username || "No username"} · {u.phone || "No phone"}</p>
              <p className="text-xs text-muted-foreground">{u.address || "No address"}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={u.status === "Active" ? "default" : "destructive"}>{u.status}</Badge>
              <Select value={u.status} onValueChange={v => updateStatus(u.user_id, v)}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Banned">Banned</SelectItem>
                  <SelectItem value="Frozen">Frozen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
