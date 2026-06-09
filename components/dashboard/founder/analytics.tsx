"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, TrendingUp, Users, BarChart2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Props {
  startupName: string;
  healthHistory: Record<string, unknown>[];
  pitchViews: Record<string, unknown>[];
  connections: Record<string, unknown>[];
  crmStages: Record<string, unknown>[];
}

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7", "#ec4899", "#14b8a6"];

export default function FounderAnalytics({
  startupName,
  healthHistory,
  pitchViews,
  connections,
  crmStages,
}: Props) {
  // Process health history for chart
  const healthChartData = healthHistory.map((h) => ({
    date: formatDate(h.computed_at as string),
    overall: h.overall_score,
    team: h.team_quality_score,
    market: h.market_opportunity_score,
    product: h.business_model_score,
    traction: h.traction_score,
    growth: h.growth_score,
  }));

  // Process pitch views — group by date
  const viewsByDate = pitchViews.reduce<Record<string, number>>((acc, v) => {
    const date = (v.created_at as string).slice(0, 10);
    acc[date] = (acc[date] ?? 0) + 1;
    return acc;
  }, {});
  const viewsChartData = Object.entries(viewsByDate)
    .map(([date, count]) => ({ date, views: count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);

  // Connection status breakdown
  const connectionStatusCounts = connections.reduce<Record<string, number>>((acc, c) => {
    const s = c.status as string;
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});
  const connectionPieData = Object.entries(connectionStatusCounts).map(([name, value]) => ({ name, value }));

  // CRM stage breakdown (investor interest)
  const stageCounts = crmStages.reduce<Record<string, number>>((acc, r) => {
    const s = r.stage as string;
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});
  const stageChartData = Object.entries(stageCounts).map(([stage, count]) => ({
    stage: stage.replace(/_/g, " "),
    count,
  }));

  const latestHealth = healthHistory[healthHistory.length - 1];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">{startupName} — performance insights</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="h-3.5 w-3.5" /> Health Score
            </div>
            <p className="text-2xl font-bold">
              {latestHealth ? `${latestHealth.overall_score as number}/100` : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Eye className="h-3.5 w-3.5" /> Total Views
            </div>
            <p className="text-2xl font-bold">{pitchViews.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="h-3.5 w-3.5" /> Connections
            </div>
            <p className="text-2xl font-bold">{connections.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <BarChart2 className="h-3.5 w-3.5" /> Investor Interest
            </div>
            <p className="text-2xl font-bold">{crmStages.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Health score over time OR breakdown if only 1 data point */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              {healthChartData.length >= 2 ? "Health Score History" : "Health Score Breakdown"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {healthChartData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                No health score yet — run an AI analysis to get started
              </div>
            ) : healthChartData.length >= 2 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={healthChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="overall" stroke="#6366f1" strokeWidth={2} name="Overall" dot={false} />
                  <Line type="monotone" dataKey="team" stroke="#22c55e" strokeWidth={1.5} name="Team" dot={false} />
                  <Line type="monotone" dataKey="market" stroke="#f59e0b" strokeWidth={1.5} name="Market" dot={false} />
                  <Line type="monotone" dataKey="product" stroke="#06b6d4" strokeWidth={1.5} name="Product" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              /* Single data point — show a category breakdown bar chart */
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  layout="vertical"
                  data={[
                    { label: "Overall", score: latestHealth?.overall_score ?? 0 },
                    { label: "Team", score: latestHealth?.team_quality_score ?? 0 },
                    { label: "Business Model", score: latestHealth?.business_model_score ?? 0 },
                    { label: "Traction", score: latestHealth?.traction_score ?? 0 },
                    { label: "Growth", score: latestHealth?.growth_score ?? 0 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="label" type="category" tick={{ fontSize: 11 }} width={110} />
                  <Tooltip formatter={(v) => [`${v}/100`, "Score"]} />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pitch views */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile Views (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {viewsChartData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                No views tracked yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={viewsChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="views" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Investor interest by stage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Investor Interest by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            {stageChartData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                No investor interest yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stageChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="stage" type="category" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Connection requests */}
        {connectionPieData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Connection Requests</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie
                    data={connectionPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    dataKey="value"
                  >
                    {connectionPieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {connectionPieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    <span className="capitalize text-muted-foreground">{d.name}</span>
                    <Badge variant="secondary" className="text-xs ml-auto">{d.value}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
