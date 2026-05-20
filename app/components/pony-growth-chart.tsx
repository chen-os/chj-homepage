"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type WeightPoint = {
  date: string;
  label: string;
  weight: number;
};

type PonyGrowthChartProps = {
  data: WeightPoint[];
};

export function PonyGrowthChart({ data }: PonyGrowthChartProps) {
  return (
    <div className="h-52 min-w-0 w-full sm:h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#737373", fontSize: 11 }}
            axisLine={{ stroke: "#e5e5e5" }}
            tickLine={false}
          />
          <YAxis
            domain={["dataMin - 0.2", "dataMax + 0.3"]}
            tick={{ fill: "#737373", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}kg`}
            width={42}
          />
          <Tooltip
            contentStyle={{
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              fontSize: 12,
              boxShadow: "none",
            }}
            formatter={(value) => [`${value} kg`, "体重"]}
            labelFormatter={(_, payload) =>
              (payload?.[0]?.payload as WeightPoint | undefined)?.date ?? ""
            }
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#171717"
            strokeWidth={1.5}
            dot={{ fill: "#171717", r: 3, strokeWidth: 0 }}
            activeDot={{ r: 4, fill: "#171717" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
