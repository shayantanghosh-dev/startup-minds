"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Briefcase,
  Bookmark,
  ExternalLink,
  TrendingUp,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface Props {
  portfolio: Record<string, unknown>[];
  watchlist: Record<string, unknown>[];
}

function StartupCard({ item, startup }: { item: Record<string, unknown>; startup: Record<string, unknown> }) {
  const healthScore = (startup.health_scores as Record<string, unknown>[])?.[0];
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-sm">{startup.name as string}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {(startup.stage as string ?? "").replace(/_/g, " ")} •{" "}
                {(startup.industry as string ?? "").replace(/_/g, " ")}
              </p>
            </div>
          </div>
          {healthScore && (
            <Badge variant="secondary" className="text-xs">
              {healthScore.overall_score as number}/100
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {startup.tagline as string}
        </p>
        <div className="flex items-center gap-2">
          <Link href={`/startups/${startup.id as string}`}>
            <Button variant="outline" size="sm" className="gap-1">
              <ExternalLink className="h-3 w-3" />
              View
            </Button>
          </Link>
          {!!(item.investment_amount) && (
            <span className="text-xs text-muted-foreground ml-auto">
              Invested: ₹{Number(item.investment_amount).toLocaleString("en-IN")}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function InvestorPortfolio({ portfolio, watchlist }: Props) {
  const totalInvested = portfolio.reduce(
    (sum, r) => sum + ((r.investment_amount as number) ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <p className="text-muted-foreground">Track your investments and watchlist</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Briefcase className="h-4 w-4" />
              Portfolio Companies
            </div>
            <p className="text-3xl font-bold">{portfolio.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingUp className="h-4 w-4" />
              Total Invested
            </div>
            <p className="text-3xl font-bold">
              {totalInvested > 0
                ? `₹${(totalInvested / 1e7).toFixed(1)}Cr`
                : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Bookmark className="h-4 w-4" />
              Watchlist
            </div>
            <p className="text-3xl font-bold">{watchlist.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="portfolio">
        <TabsList>
          <TabsTrigger value="portfolio">
            <Briefcase className="h-3.5 w-3.5 mr-1.5" />
            Portfolio ({portfolio.length})
          </TabsTrigger>
          <TabsTrigger value="watchlist">
            <Bookmark className="h-3.5 w-3.5 mr-1.5" />
            Watchlist ({watchlist.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="mt-4">
          {portfolio.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No investments yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Mark CRM records as &quot;Invested&quot; to see them here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {portfolio.map((record) => (
                <StartupCard
                  key={record.id as string}
                  item={record}
                  startup={record.startup as Record<string, unknown>}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="watchlist" className="mt-4">
          {watchlist.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No bookmarked startups</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Bookmark startups in the discovery feed
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {watchlist.map((bookmark) => (
                <StartupCard
                  key={bookmark.id as string}
                  item={bookmark}
                  startup={bookmark.startup as Record<string, unknown>}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
