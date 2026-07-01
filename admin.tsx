import { useListAuditLogs, getListAuditLogsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ShieldCheck, UserCog, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Admin() {
  const { data: logs, isLoading } = useListAuditLogs({ limit: 50 }, { query: { queryKey: getListAuditLogsQueryKey({ limit: 50 }) } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Admin</h1>
        <p className="text-muted-foreground mt-1">Platform configuration, user management, and audit trailing.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="opacity-50">
          <CardHeader>
             <CardTitle className="flex items-center gap-2"><UserCog className="h-5 w-5" /> User Management</CardTitle>
             <CardDescription>Manage analyst access and role-based permissions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-8 border border-dashed rounded-md text-muted-foreground">
              Feature restricted to SuperAdmin
            </div>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader>
             <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Model Configuration</CardTitle>
             <CardDescription>Adjust ML threshold parameters and weighting.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-8 border border-dashed rounded-md text-muted-foreground">
              Feature restricted to Data Science Lead
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Security Audit Log</CardTitle>
          <CardDescription>Immutable record of all system actions and data access.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
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
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs?.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">{format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                      <TableCell className="font-medium">{log.userName} <span className="text-xs text-muted-foreground ml-1">(ID: {log.userId})</span></TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px] uppercase bg-muted/50">{log.action}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{log.resource}</TableCell>
                      <TableCell className="text-sm truncate max-w-md" title={log.details}>{log.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}