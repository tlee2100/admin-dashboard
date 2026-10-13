"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ChatStats } from "@/types/dashboard";

interface MessageTrendChartProps {
  chatStats: ChatStats;
}

export function MessageTrendChart({ chatStats }: MessageTrendChartProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const maxMessageCount =
    chatStats.messagesTrend.reduce(
      (max, item) => Math.max(max, item.count),
      0,
    ) || 1;

  const chartHeight = 160;
  const chartWidth = 500;
  const barPadding = 12;
  const barWidth =
    Math.floor(chartWidth / (chatStats.messagesTrend.length || 7)) - barPadding;

  return (
    <Card className="md:col-span-2 border-primary/5">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold">
            Weekly Message Frequency
          </CardTitle>
          <CardDescription>
            Number of conversations handled automatically by the chatbot
          </CardDescription>
        </div>
        <TrendingUp className="text-muted-foreground size-4" />
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center p-6 pb-2">
        <div className="relative w-full h-[200px] flex items-end justify-center">
          <svg
            width="100%"
            height={chartHeight}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="overflow-visible"
          >
            {/* Horizontal guide lines */}
            {Array.from({ length: 4 }).map((_, i) => {
              const y = (chartHeight / 4) * (i + 1);
              return (
                <line
                  key={i}
                  x1="0"
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke="hsl(var(--border))"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
              );
            })}

            {/* SVG Bars */}
            {chatStats.messagesTrend.map((item, index) => {
              const barHeight = Math.max(
                (item.count / maxMessageCount) * (chartHeight - 40),
                10,
              );
              const x = index * (barWidth + barPadding) + barPadding;
              const y = chartHeight - barHeight - 20;

              return (
                <g key={index} className="group">
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="4"
                    className="fill-primary/80 transition-all duration-300 group-hover:fill-primary"
                    onMouseEnter={() => setHoveredBar(index)}
                    onMouseLeave={() => setHoveredBar(null)}
                  />

                  {/* X Axis Label */}
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight - 4}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[10px] font-medium select-none"
                  >
                    {item.label}
                  </text>

                  {/* Hover tooltip label */}
                  <text
                    x={x + barWidth / 2}
                    y={y - 6}
                    textAnchor="middle"
                    className={`fill-foreground text-xs font-semibold select-none transition-opacity duration-200 ${
                      hoveredBar === index ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    {item.count}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="flex w-full items-center justify-between text-xs text-muted-foreground border-t pt-4 mt-2">
          <span>
            Avg. response time:{" "}
            <strong className="text-foreground">
              {chatStats.avgResponseTime}
            </strong>
          </span>
          <span>
            Total conversations:{" "}
            <strong className="text-foreground">
              {chatStats.totalConversations}
            </strong>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
