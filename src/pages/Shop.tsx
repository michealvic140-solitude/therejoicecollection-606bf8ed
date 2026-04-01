import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { toast } from "sonner";

type Product = Tables<"products">;

const categories = ["all", "watches", "bags", "jewelry", "accessories", "footwear", "clothes", "nightwear", "undies", "trousers", "shirts", "polo", "slippers", "shoes", "glasses", "others"];

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || "all";
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    supabase.from("products").select("*").eq("visible", true).order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setProducts(data); });
  }, []);

  const filtered = products.filter(p => {
    const matchCat = activeCategory === "all" || p.category === activeCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description || "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleAddToCart = async (id: string) => {
    if (!user) { toast.error("Please sign in to add items to cart"); return; }
    await addToCart(id);
    toast.success("Added to cart!");
  };

  return (
    <div className="container px-4 py-8 animate-fade-in">
      <h1 className="font-display text-3xl font-bold mb-6">Shop</h1>
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>
      <div className="flex gap-2 flex-wrap mb-8">
        {categories.map(cat => (
          <Button key={cat} variant={activeCategory === cat ? "default" : "outline"} size="sm" className="capitalize"
            onClick={() => setSearchParams(cat === "all" ? {} : { category: cat })}>
            {cat}
          </Button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground"><p className="text-lg">No products found</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(p => <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />)}
        </div>
      )}
    </div>
  );
}
