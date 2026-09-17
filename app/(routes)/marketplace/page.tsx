"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, Sparkles, PlusCircle, ExternalLink, Coins, Download, CheckCircle2, ShieldCheck, Flame, Tag } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface Product {
  id: number;
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  priceInCents: number;
  priceInGold: number;
  assetUrl: string;
  category: string;
  salesCount: number;
}

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isListOpen, setIsListOpen] = useState(false);
  const [buyingProd, setBuyingProd] = useState<Product | null>(null);

  // Listing form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceInCents, setPriceInCents] = useState("1900");
  const [priceInGold, setPriceInGold] = useState("100");
  const [assetUrl, setAssetUrl] = useState("");
  const [category, setCategory] = useState("Starters");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("/api/marketplace");
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!title || !assetUrl || !description) {
      toast.error("Please fill in all required fields including title, description, and asset URL.");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post("/api/marketplace", {
        action: "CREATE",
        title,
        description,
        priceInCents: parseInt(priceInCents) || 1900,
        priceInGold: parseInt(priceInGold) || 100,
        assetUrl,
        category
      });
      toast.success("Digital Asset Listed in Guild Hall Marketplace!");
      setIsListOpen(false);
      setTitle("");
      setDescription("");
      setAssetUrl("");
      fetchProducts();
    } catch (err) {
      toast.error("Failed to list product");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePurchaseProduct = async (product: Product, paymentMethod: "GOLD" | "CASH") => {
    try {
      const res = await axios.post("/api/marketplace", {
        action: "PURCHASE",
        productId: product.id,
        paymentMethod
      });

      if (res.data.success) {
        toast.success(res.data.message || "Purchase successful!");
        window.open(res.data.assetUrl || product.assetUrl, "_blank");
        setBuyingProd(null);
        fetchProducts();
      } else {
        toast.error(res.data.message || "Purchase failed");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Purchase transaction failed");
    }
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory === "all") return true;
    return p.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-neutral-900 via-neutral-900 to-purple-950/40 p-8 rounded-2xl border border-purple-500/20 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-game mb-2">
            <ShoppingBag className="w-4 h-4 text-purple-400" /> GUILD HALL MONETIZATION MARKETPLACE
          </div>
          <h1 className="text-4xl md:text-5xl font-game font-bold tracking-wide text-white">
            DIGITAL ASSET HALL
          </h1>
          <p className="text-gray-400 mt-1 font-game text-xl">
            Buy and sell micro-digital assets (templates, starters, API wrappers, component libraries) with Gold or Stripe Connect.
          </p>
        </div>
        <Button variant="pixel" className="font-game text-2xl px-6 py-6" onClick={() => setIsListOpen(true)}>
          <PlusCircle className="mr-2 w-5 h-5 text-yellow-400" /> LIST DIGITAL ASSET
        </Button>
      </div>

      {/* Category Tabs */}
      <Tabs defaultValue="all" className="w-full" onValueChange={setSelectedCategory}>
        <TabsList className="bg-neutral-900 border border-neutral-800 p-1 font-game text-lg gap-2">
          <TabsTrigger value="all" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            ALL ASSETS
          </TabsTrigger>
          <TabsTrigger value="starters" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            STARTERS
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            TEMPLATES
          </TabsTrigger>
          <TabsTrigger value="api wrappers" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            API WRAPPERS
          </TabsTrigger>
          <TabsTrigger value="component libraries" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            COMPONENTS
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Products Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((prod) => (
          <Card key={prod.id} className="bg-neutral-900 border-2 border-neutral-800 hover:border-purple-500/50 transition-all flex flex-col justify-between">
            <CardHeader className="space-y-3">
              <div className="flex justify-between items-center">
                <Badge variant="pixel">{prod.category.toUpperCase()}</Badge>
                <div className="text-xs text-gray-400 font-mono">By {prod.sellerName || "Indie Hacker"}</div>
              </div>
              <CardTitle className="font-game text-2xl text-white">{prod.title}</CardTitle>
              <CardDescription className="text-gray-300 text-sm leading-relaxed">
                {prod.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 flex justify-between items-center text-xs font-mono">
                <div className="text-yellow-400 font-bold flex items-center gap-1 text-sm">
                  <Coins className="w-4 h-4" /> {prod.priceInGold} Gold
                </div>
                <div className="text-emerald-400 font-bold text-sm">
                  ${(prod.priceInCents / 100).toFixed(2)} USD
                </div>
                <div className="text-gray-400">{prod.salesCount} Sales</div>
              </div>
            </CardContent>

            <CardFooter className="pt-2">
              <Button
                variant="pixel"
                className="w-full font-game text-xl py-5"
                onClick={() => setBuyingProd(prod)}
              >
                <Download className="mr-2 w-5 h-5 text-yellow-400" /> BUY & UNLOCK ASSET
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* LIST ASSET DIALOG */}
      <Dialog open={isListOpen} onOpenChange={setIsListOpen}>
        <DialogContent className="bg-neutral-900 border-2 border-purple-400 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-game text-3xl text-purple-400 flex items-center gap-2">
              <PlusCircle className="w-6 h-6" /> LIST DIGITAL ASSET
            </DialogTitle>
            <DialogDescription className="text-gray-300 font-game text-lg">
              Monetize your code templates, starters, or wrappers with instant Gold & Stripe routing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div>
              <label className="text-xs font-mono text-purple-400 uppercase block mb-1">Asset Title *</label>
              <Input
                placeholder="e.g. Next.js 15 Auth & Drizzle Boilerplate"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono text-gray-400 uppercase block mb-1">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 text-white border-neutral-800">
                    <SelectItem value="Starters">Starters</SelectItem>
                    <SelectItem value="Templates">Templates</SelectItem>
                    <SelectItem value="API Wrappers">API Wrappers</SelectItem>
                    <SelectItem value="Component Libraries">Component Libraries</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-mono text-yellow-400 uppercase block mb-1">Price (Gold)</label>
                <Input
                  type="number"
                  value={priceInGold}
                  onChange={(e) => setPriceInGold(e.target.value)}
                  className="bg-neutral-950 border-neutral-800 text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-emerald-400 uppercase block mb-1">Price in USD ($)</label>
              <Input
                type="number"
                value={(parseInt(priceInCents) / 100).toString()}
                onChange={(e) => setPriceInCents((parseFloat(e.target.value) * 100).toString())}
                className="bg-neutral-950 border-neutral-800 text-white"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-purple-400 uppercase block mb-1">Asset Download / Repo Link *</label>
              <Input
                placeholder="https://github.com/yourusername/asset-repo"
                value={assetUrl}
                onChange={(e) => setAssetUrl(e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-gray-400 uppercase block mb-1">Description *</label>
              <Textarea
                placeholder="Key features, stack used, setup instructions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white h-20"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="font-game text-lg" onClick={() => setIsListOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="pixel"
              className="font-game text-2xl px-6"
              onClick={handleCreateProduct}
              disabled={submitting}
            >
              {submitting ? "PUBLISHING..." : "PUBLISH TO MARKETPLACE 🚀"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PURCHASE CONFIRMATION DIALOG */}
      <Dialog open={!!buyingProd} onOpenChange={(open) => !open && setBuyingProd(null)}>
        <DialogContent className="bg-neutral-900 border-2 border-yellow-400 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-game text-3xl text-yellow-400 flex items-center gap-2">
              <Download className="w-6 h-6" /> UNLOCK DIGITAL ASSET
            </DialogTitle>
            <DialogDescription className="text-gray-300 font-game text-lg">
              Purchasing <span className="text-white font-bold">{buyingProd?.title}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2 text-sm font-mono">
              <div className="text-gray-400">Description:</div>
              <div className="text-gray-200">{buyingProd?.description}</div>
              <div className="text-xs text-indigo-400 pt-2 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Guaranteed Instant Delivery via Vercel Edge / Stripe
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="pixel"
                className="font-game text-xl py-6 flex flex-col gap-1"
                onClick={() => buyingProd && handlePurchaseProduct(buyingProd, "GOLD")}
              >
                <span>PAY WITH GOLD</span>
                <span className="text-xs font-mono text-yellow-300">{buyingProd?.priceInGold} Gold</span>
              </Button>

              <Button
                variant="outline"
                className="font-game text-xl py-6 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 flex flex-col gap-1"
                onClick={() => buyingProd && handlePurchaseProduct(buyingProd, "CASH")}
              >
                <span>STRIPE CHECKOUT</span>
                <span className="text-xs font-mono">${((buyingProd?.priceInCents || 0) / 100).toFixed(2)} USD</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
