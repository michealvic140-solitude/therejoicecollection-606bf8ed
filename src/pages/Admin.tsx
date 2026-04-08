import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AdminProducts } from "@/components/admin/AdminProducts";
import { AdminOrders } from "@/components/admin/AdminOrders";
import { AdminPayments } from "@/components/admin/AdminPayments";
import { AdminTracking } from "@/components/admin/AdminTracking";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminAnnouncements } from "@/components/admin/AdminAnnouncements";
import { AdminNegotiations } from "@/components/admin/AdminNegotiations";
import { AdminChats } from "@/components/admin/AdminChats";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { AdminEvents } from "@/components/admin/AdminEvents";
import { AdminRefunds } from "@/components/admin/AdminRefunds";
import { AdminPromoCodes } from "@/components/admin/AdminPromoCodes";
import { AdminCoupons } from "@/components/admin/AdminCoupons";
import { AdminSpinWheels } from "@/components/admin/AdminSpinWheels";
import { AdminPopupAds } from "@/components/admin/AdminPopupAds";
import { AdminCategoryDiscounts } from "@/components/admin/AdminCategoryDiscounts";

export default function Admin() {
  const { isAdmin, loading } = useAuth();

  if (loading) return <div className="container py-20 text-center">Loading...</div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="container px-4 py-8 animate-fade-in">
      <h1 className="font-display text-3xl font-bold mb-6 text-gradient-gold">Admin Panel</h1>
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 glass p-1.5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="negotiations">Negotiations</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
          <TabsTrigger value="promos">Promo Codes</TabsTrigger>
          <TabsTrigger value="coupons">Coupons</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="spins">Spin Wheel</TabsTrigger>
          <TabsTrigger value="ads">Popup Ads</TabsTrigger>
          <TabsTrigger value="catdiscount">Category Discounts</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="chats">Chats</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><AdminOverview /></TabsContent>
        <TabsContent value="products"><AdminProducts /></TabsContent>
        <TabsContent value="orders"><AdminOrders /></TabsContent>
        <TabsContent value="payments"><AdminPayments /></TabsContent>
        <TabsContent value="tracking"><AdminTracking /></TabsContent>
        <TabsContent value="users"><AdminUsers /></TabsContent>
        <TabsContent value="negotiations"><AdminNegotiations /></TabsContent>
        <TabsContent value="refunds"><AdminRefunds /></TabsContent>
        <TabsContent value="promos"><AdminPromoCodes /></TabsContent>
        <TabsContent value="coupons"><AdminCoupons /></TabsContent>
        <TabsContent value="events"><AdminEvents /></TabsContent>
        <TabsContent value="spins"><AdminSpinWheels /></TabsContent>
        <TabsContent value="ads"><AdminPopupAds /></TabsContent>
        <TabsContent value="announcements"><AdminAnnouncements /></TabsContent>
        <TabsContent value="chats"><AdminChats /></TabsContent>
        <TabsContent value="settings"><AdminSettings /></TabsContent>
      </Tabs>
    </div>
  );
}
