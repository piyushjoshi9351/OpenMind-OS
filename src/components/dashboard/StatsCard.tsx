"use client"

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
  className?: string;
}

export function StatsCard({ title, value, description, icon, trend, className }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={cn("overflow-hidden border-none shadow-sm", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="bg-primary/5 p-3 rounded-xl text-primary">
              {icon}
            </div>
            {trend && (
              <span className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                trend.isUp ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              )}>
                {trend.isUp ? "+" : "-"}{trend.value}%
              </span>
            )}
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold font-headline mt-1">{value}</h3>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}