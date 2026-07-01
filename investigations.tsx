import { useState } from "react";
import { useListInvestigations, useCreateInvestigation, useUpdateInvestigation, getListInvestigationsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Briefcase, Plus, FileText, ChevronRight, MessageSquare, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  title: z.string().min(5),
  traderName: z.string().min(2),
  riskScore: z.coerce.number().min(0).max(100),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  assignedTo: z.string().optional(),
});

export default function Investigations() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<number | null>(null);

  const { data: investigations, isLoading } = useListInvestigations({ query: { queryKey: getListInvestigationsQueryKey() } });
  const createMutation = useCreateInvestigation({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListInvestigationsQueryKey() });
        setIsCreateOpen(false);
        form.reset();
      }
    }
  });
  
  const updateMutation = useUpdateInvestigation({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListInvestigationsQueryKey() });
        setSelectedCase(null);
      }
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      traderName: "",
      riskScore: 50,
      priority: "medium",
      assignedTo: "Unassigned",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createMutation.mutate({ data: values });
  }

  const activeCase = investigations?.find(i => i.id === selectedCase);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Investigation Center</h1>
          <p className="text-muted-foreground mt-1">Manage and review AI-generated case files for suspicious activity.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New Case</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Open Investigation</DialogTitle>
              <DialogDescription>Manually create a new investigation record.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Case Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="traderName" render={({ field }) => (
                  <FormItem><FormLabel>Target Entity</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="riskScore" render={({ field }) => (
                    <FormItem><FormLabel>Initial Risk Score</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="priority" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Case"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Case List */}
        <div className="lg:col-span-1 border rounded-lg bg-card overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-muted/50 font-medium flex items-center">
            <Briefcase className="h-4 w-4 mr-2" /> Open Cases
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {isLoading ? (
              <div className="p-2 space-y-2"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
            ) : investigations?.map(inv => (
              <button 
                key={inv.id}
                onClick={() => setSelectedCase(inv.id)}
                className={`w-full text-left p-4 rounded-md border transition-all ${selectedCase === inv.id ? 'border-primary ring-1 ring-primary shadow-sm bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-mono text-xs text-muted-foreground">{inv.caseNumber}</span>
                  <Badge variant={inv.priority === 'critical' ? 'destructive' : inv.priority === 'high' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                    {inv.priority.toUpperCase()}
                  </Badge>
                </div>
                <h3 className="font-semibold text-sm leading-tight mb-1 truncate">{inv.title}</h3>
                <div className="flex justify-between items-center text-xs mt-3">
                  <span className="text-muted-foreground">{inv.traderName}</span>
                  <Badge variant="outline" className="text-[10px] font-normal">{inv.status}</Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Case Detail */}
        <div className="lg:col-span-2 border rounded-lg bg-card overflow-hidden flex flex-col">
          {activeCase ? (
            <>
              <div className="p-6 border-b flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-primary font-bold">{activeCase.caseNumber}</span>
                    <Badge variant="outline">{activeCase.status.toUpperCase()}</Badge>
                    <Badge variant={activeCase.priority === 'critical' ? 'destructive' : 'secondary'}>{activeCase.priority}</Badge>
                  </div>
                  <h2 className="text-2xl font-bold">{activeCase.title}</h2>
                  <div className="text-sm text-muted-foreground mt-2 flex gap-4">
                    <span>Target: <strong className="text-foreground">{activeCase.traderName}</strong></span>
                    <span>Risk Score: <strong className="text-foreground">{activeCase.riskScore}</strong></span>
                    <span>Created: {format(new Date(activeCase.createdAt), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {activeCase.status !== 'closed' && (
                    <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: activeCase.id, data: { status: 'closed' } })}>
                      Close Case
                    </Button>
                  )}
                  {activeCase.status !== 'escalated' && (
                    <Button size="sm" variant="destructive" onClick={() => updateMutation.mutate({ id: activeCase.id, data: { status: 'escalated' } })}>
                      Escalate
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/20">
                <section>
                  <h3 className="text-lg font-semibold flex items-center mb-3"><FileText className="h-4 w-4 mr-2" /> AI Summary</h3>
                  <div className="bg-card border p-4 rounded-md text-sm leading-relaxed whitespace-pre-wrap shadow-sm">
                    {activeCase.aiSummary}
                  </div>
                </section>
                
                <section>
                  <h3 className="text-lg font-semibold flex items-center mb-3"><AlertCircle className="h-4 w-4 mr-2" /> Evidence Log</h3>
                  {activeCase.evidence && activeCase.evidence.length > 0 ? (
                    <ul className="space-y-2">
                      {activeCase.evidence.map((ev, i) => (
                        <li key={i} className="flex items-start text-sm bg-card border rounded p-3">
                          <ChevronRight className="h-4 w-4 text-primary mr-2 shrink-0 mt-0.5" />
                          <span>{ev}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No evidence logged yet.</p>
                  )}
                </section>

                <section>
                  <h3 className="text-lg font-semibold flex items-center mb-3"><MessageSquare className="h-4 w-4 mr-2" /> Analyst Notes</h3>
                  <Textarea 
                    defaultValue={activeCase.analystNotes || ''} 
                    className="min-h-[150px] bg-card resize-none" 
                    placeholder="Add your investigation notes here..."
                    onBlur={(e) => {
                      if (e.target.value !== activeCase.analystNotes) {
                        updateMutation.mutate({ id: activeCase.id, data: { analystNotes: e.target.value } });
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-2">Notes are auto-saved on blur.</p>
                </section>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col gap-4">
              <Briefcase className="h-12 w-12 opacity-20" />
              <p>Select a case from the sidebar to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}