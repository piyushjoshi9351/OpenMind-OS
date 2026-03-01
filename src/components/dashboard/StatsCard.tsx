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
      whileHover={{ y: -4, scale: 1.02 }}
    >
      <Card className={cn("om-card overflow-hidden", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="bg-primary/15 p-3 rounded-xl text-primary neon-glow">
              {icon}
            </div>
            {trend && (
              <span className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                trend.isUp ? "bg-cyan-400/20 text-cyan-200" : "bg-purple-500/20 text-purple-200"
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