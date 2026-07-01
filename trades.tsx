import { useListTrades, useGetVolumeAnalysis, getListTradesQueryKey, getGetVolumeAnalysisQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, TrendingDown, TrendingUp, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Trades() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: tradeData, isLoading: isLoadingTrades } = useListTrades({ symbol: searchTerm || undefined }, { query: { queryKey: getListTradesQueryKey({ symbol: searchTerm || undefined }) } });
  const { data: volumeData, isLoading: isLoadingVolume } = useGetVolumeAnalysis({ query: { queryKey: getGetVolumeAnalysisQueryKey() } });

  const trades = tradeData?.trades || [];

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trade Monitoring</h1>
        <p className="text-muted-foreground mt-1">Live feed of transactions across connected exchanges.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Live Trade Feed</CardTitle>
            <CardDescription>Real-time transaction monitoring with ML risk scoring</CardDescription>
            <div className="flex items-center pt-2">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="search" 
                  placeholder="Filter by symbol..." 
                  className="pl-8" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingTrades ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Trader</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">Risk Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No trades found
                        </TableCell>
                      </TableRow>
                    ) : (
                      trades.map((trade) => (
                        <TableRow key={trade.id} className={trade.isSuspicious ? "bg-destructive/10" : ""}>
                          <TableCell className="font-mono text-xs">{format(new Date(trade.timestamp), 'HH:mm:ss.SSS')}</TableCell>
                          <TableCell className="font-bold">{trade.symbol}</TableCell>
                          <TableCell>{trade.traderName}</TableCell>
                          <TableCell>
                            <Badge variant={trade.tradeType === 'buy' ? 'default' : trade.tradeType === 'sell' ? 'secondary' : 'destructive'}>
                              {trade.tradeType.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">{trade.quantity.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono">${trade.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-right font-mono">${trade.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={trade.riskScore > 80 ? 'destructive' : trade.riskScore > 50 ? 'secondary' : 'outline'} className="font-mono">
                              {trade.riskScore.toFixed(1)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Volume Analysis</CardTitle>
              <CardDescription>Anomalous volume detection by symbol</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                {isLoadingVolume ? <Skeleton className="h-full w-full" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={volumeData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="symbol" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={60} />
                      <Tooltip 
                        cursor={{fill: 'hsl(var(--muted))'}}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      />
                      <Bar dataKey="volumeRatio" name="Vol Ratio" radius={[0, 4, 4, 0]}>
                        {
                          volumeData?.map((entry, index) => (
                            <cell key={`cell-${index}`} fill={entry.anomalyDetected ? "hsl(var(--destructive))" : "hsl(var(--primary))"} />
                          ))
                        }
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <AlertTriangle className="h-5 w-5 text-destructive" />
                 Volume Alerts
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               {isLoadingVolume ? <Skeleton className="h-20 w-full" /> : volumeData?.filter(v => v.anomalyDetected).map(v => (
                 <div key={v.symbol} className="flex flex-col gap-1 border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">{v.symbol}</span>
                      <Badge variant="destructive">{(v.volumeRatio * 100).toFixed(0)}% avg</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">{v.companyName}</span>
                 </div>
               ))}
               {!isLoadingVolume && volumeData?.filter(v => v.anomalyDetected).length === 0 && (
                 <p className="text-sm text-muted-foreground">No volume anomalies detected.</p>
               )}
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}