"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { Scale, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompare } from "@/components/compare/compare-provider";

export function CompareTray() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();

  if (compareList.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 bg-card/95 backdrop-blur-md border border-primary/30 rounded-2xl p-3 shadow-2xl animate-in slide-in-from-bottom-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-foreground">
            Compare ({compareList.length}/3 items)
          </span>
        </div>
        <button
          onClick={clearCompare}
          className="text-[10px] text-muted-foreground hover:text-foreground font-medium"
        >
          Clear all
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        {compareList.map((item) => (
          <div
            key={item.id}
            className="relative flex-1 bg-background border border-border rounded-xl p-1.5 flex items-center gap-2 min-w-0"
          >
            <img
              src={
                item.images.find((i) => i.is_cover)?.url ||
                item.images[0]?.url ||
                "/placeholder-furniture.svg"
              }
              alt={item.title}
              className="w-8 h-8 rounded-lg object-cover shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-foreground truncate">
                {item.title}
              </p>
              <p className="text-[10px] font-mono text-primary truncate">
                {item.price ? `${item.price.toLocaleString()} ETB` : "Ask price"}
              </p>
            </div>
            <button
              onClick={() => removeFromCompare(item.id)}
              className="p-1 text-muted-foreground hover:text-red-500 rounded-full"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <Button asChild size="sm" className="w-full h-8 rounded-xl text-xs font-bold gap-1.5">
        <Link href="/compare">
          Compare Side-by-Side <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </Button>
    </div>
  );
}
