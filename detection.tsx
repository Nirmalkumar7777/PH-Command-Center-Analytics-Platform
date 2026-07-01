import { useListAnomalies, useListRiskScores, useListPatterns, useGetFeatureImportance, getListAnomaliesQueryKey, getListRiskScoresQueryKey, getListPatternsQueryKey, getGetFeatureImportanceQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { BrainCircuit, Activity, ShieldAlert, Cpu } from "lucide-react";

export default function Detection() {
  const { data: anomalies, isLoading: isLoadingAnomalies } = useListAnomalies({ limit: 10 }, { query: { queryKey: getListAnomaliesQueryKey({ limit: 10 }) } });
  const { data: scores, isLoading: isLoadingScores } = useListRiskScores({ query: { queryKey: getListRiskScoresQueryKey() } });
  const { data: patterns, isLoading: isLoadingPatterns } = useListPatterns({ query: { queryKey: getListPatternsQueryKey() } });
  const { data: features, isLoading: isLoadingFeatures } = useGetFeatureImportance({ query: { queryKey: getGetFeatureImportanceQueryKey() } });

  // Prepare radar data from the top risky trader
  const topRisky = scores && scores.length > 0 ? scores[0] : null;
  const radarData = topRisky ? [
    { model: 'Random Forest', score: topRisky.randomForestScore },
    { model: 'XGBoost', score: topRisky.xgboostScore },
    { model: 'Isolation Forest', score: topRisky.isolationForestScore },
    { model: 'LSTM', score: topRisky.lstmScore }
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Insider Trading Detection</h1>
        <p className="text-muted-foreground mt-1">Multi-model ensemble analysis and anomaly detection results.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ML Ensamble Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-primary" /> Ensemble Model Consensus</CardTitle>
            <CardDescription>Risk score breakdown for most anomalous entity ({topRisky?.traderName || 'Loading...'})</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoadingScores ? <Skeleton className="h-full w-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="model" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <Radar name="Risk Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
            {topRisky && (
               <div className="mt-4 flex justify-center">
                 <Badge variant="destructive" className="text-sm px-4 py-1">Overall Confidence: {topRisky.overallScore.toFixed(1)}%</Badge>
               </div>
            )}
          </CardContent>
        </Card>

        {/* Feature Importance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5 text-primary" /> Feature Importance</CardTitle>
            <CardDescription>Top predictive signals triggering current anomalies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              {isLoadingFeatures ? <Skeleton className="h-full w-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={features} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" hide domain={[0, 1]} />
                    <YAxis dataKey="feature" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={100} />
                    <Tooltip 
                      cursor={{fill: 'hsl(var(--muted))'}}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      formatter={(value: number) => [(value * 100).toFixed(1) + '%', 'Importance']}
                    />
                    <Bar dataKey="importance" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Anomalies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Anomalies</CardTitle>
          <CardDescription>Flagged transactions awaiting analyst review</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAnomalies ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Detected</TableHead>
                    <TableHead>Trader</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Model Used</TableHead>
                    <TableHead className="text-right">Risk Score</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {anomalies?.map((anomaly) => (
                    <TableRow key={anomaly.id}>
                      <TableCell className="font-mono text-xs">{format(new Date(anomaly.detectedAt), 'MMM dd, HH:mm')}</TableCell>
                      <TableCell className="font-medium">{anomaly.traderName}</TableCell>
                      <TableCell>{anomaly.anomalyType}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{anomaly.modelUsed}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-destructive">{anomaly.riskScore.toFixed(1)}</TableCell>
                      <TableCell>
                        <Badge variant={
                          anomaly.status === 'confirmed' ? 'destructive' :
                          anomaly.status === 'pending' ? 'secondary' :
                          anomaly.status === 'under_review' ? 'default' : 'outline'
                        }>
                          {anomaly.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Structural Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Structural Trading Patterns</CardTitle>
          <CardDescription>Multi-actor behavioral motifs detected across network</CardDescription>
        </CardHeader>
        <CardContent>
           {isLoadingPatterns ? <Skeleton className="h-32 w-full" /> : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {patterns?.map(pattern => (
                 <div key={pattern.id} className="border border-border rounded-lg p-4 bg-card/50">
                   <div className="flex justify-between items-start mb-2">
                     <h3 className="font-bold">{pattern.patternType}</h3>
                     <Badge variant={pattern.riskLevel === 'critical' || pattern.riskLevel === 'high' ? 'destructive' : 'secondary'}>
                       {pattern.riskLevel.toUpperCase()}
                     </Badge>
                   </div>
                   <p className="text-sm text-muted-foreground mb-4">{pattern.description}</p>
                   <div className="flex justify-between text-xs text-muted-foreground border-t border-border pt-3">
                     <span>{pattern.affectedTraders} affected traders</span>
                     <span>Detected {format(new Date(pattern.detectedAt), 'MMM dd')}</span>
                   </div>
                 </div>
               ))}
             </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}