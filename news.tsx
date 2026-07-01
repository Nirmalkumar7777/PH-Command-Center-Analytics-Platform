import { useListNews, useListNamedEntities, useListMarketEvents, getListNewsQueryKey, getListNamedEntitiesQueryKey, getListMarketEventsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Newspaper, Building2, TrendingUp, AlertCircle, Link as LinkIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function News() {
  const { data: news, isLoading: isLoadingNews } = useListNews({ limit: 15 }, { query: { queryKey: getListNewsQueryKey({ limit: 15 }) } });
  const { data: entities, isLoading: isLoadingEntities } = useListNamedEntities({ query: { queryKey: getListNamedEntitiesQueryKey() } });
  const { data: events, isLoading: isLoadingEvents } = useListMarketEvents({ query: { queryKey: getListMarketEventsQueryKey() } });

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Market Intelligence</h1>
        <p className="text-muted-foreground mt-1">NLP-driven analysis of news, filings, and market events.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* News Feed */}
        <Card className="xl:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Newspaper className="h-5 w-5" /> Real-time News Sentiment</CardTitle>
            <CardDescription>Processed financial news stream with embedded NLP scoring</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-[600px] px-6">
              {isLoadingNews ? (
                <div className="space-y-4 py-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-12 w-12 rounded" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {news?.map((article) => (
                    <div key={article.id} className="py-5 space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <h3 className="font-semibold text-lg leading-tight hover:text-primary transition-colors">
                          <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2">
                            {article.title}
                            <LinkIcon className="h-3 w-3 mt-1.5 opacity-50" />
                          </a>
                        </h3>
                        <Badge 
                          variant={article.sentiment === 'negative' ? 'destructive' : article.sentiment === 'positive' ? 'default' : 'secondary'}
                          className="shrink-0"
                        >
                          {article.sentiment.toUpperCase()} ({article.sentimentScore.toFixed(2)})
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {article.summary}
                      </p>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{article.source}</span>
                        <span>•</span>
                        <span>{format(new Date(article.publishedAt), 'MMM dd, yyyy HH:mm')}</span>
                        {article.relatedCompanies.length > 0 && (
                          <>
                            <span>•</span>
                            <div className="flex gap-1">
                              {article.relatedCompanies.map(c => (
                                <span key={c} className="bg-secondary/50 px-1.5 py-0.5 rounded text-secondary-foreground">{c}</span>
                              ))}
                            </div>
                          </>
                        )}
                        {article.isMarketMoving && (
                          <Badge variant="outline" className="ml-auto border-primary text-primary text-[10px] uppercase">Market Moving</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Market Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5" /> Detected Market Events</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingEvents ? <Skeleton className="h-40 w-full" /> : (
                <div className="space-y-4">
                  {events?.map(event => (
                    <div key={event.id} className="border border-border rounded p-3 bg-card/50">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-sm">{event.eventType.replace('_', ' ')}</span>
                        <Badge variant={event.impactLevel === 'critical' ? 'destructive' : 'secondary'} className="text-[10px]">
                          {event.impactLevel.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{event.description}</p>
                      <div className="flex gap-1 flex-wrap">
                        {event.affectedSymbols.map(sym => (
                          <Badge key={sym} variant="outline" className="text-[10px]">{sym}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Named Entities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Trending Entities</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingEntities ? <Skeleton className="h-40 w-full" /> : (
                <div className="space-y-3">
                  {entities?.map((entity, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          entity.sentiment === 'negative' ? 'bg-destructive' : 
                          entity.sentiment === 'positive' ? 'bg-primary' : 'bg-muted'
                        }`} />
                        <span className="font-medium text-sm">{entity.entity}</span>
                        <span className="text-[10px] text-muted-foreground border px-1 rounded">{entity.entityType}</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">{entity.mentionCount} mentions</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}