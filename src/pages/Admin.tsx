import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminProducts } from "@/components/admin/AdminProducts";
import { AdminOrders } from "@/components/admin/AdminOrders";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminAnnouncements } from "@/components/admin/AdminAnnouncements";
import { AdminNegotiations } from "@/components/admin/AdminNegotiations";
import { AdminChats } from "@/components/admin/AdminChats";
import { AdminSettings } from "@/components/admin/AdminSettings";

export default function Admin() {
  const { isAdmin, loading } = useAuth();

  if (loading) return <div className="container py-20 text-center">Loading...</div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="container px-4 py-8 animate-fade-in">
      <h1 className="font-display text-3xl font-bold mb-6">Admin Panel</h1>
      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="negotiations">Negotiations</TabsTrigger>
          <TabsTrigger value="chats">Chats</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="products"><AdminProducts /></TabsContent>
        <TabsContent value="orders"><AdminOrders /></TabsContent>
        <TabsContent value="users"><AdminUsers /></TabsContent>
        <TabsContent value="announcements"><AdminAnnouncements /></TabsContent>
        <TabsContent value="negotiations"><AdminNegotiations /></TabsContent>
        <TabsContent value="chats"><AdminChats /></TabsContent>
        <TabsContent value="settings"><AdminSettings /></TabsContent>
      </Tabs>
    </div>
  );
}
