import { Link, useLocation } from "wouter";
import { useTheme } from "./theme-provider";
import { Moon, Sun, Activity, Search, ShieldAlert, Newspaper, Briefcase, FileText, Settings, Shield } from "lucide-react";
import { useListAlerts } from "@workspace/api-client-react";
import { Badge } from "./ui/badge";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();

  const { data: alerts } = useListAlerts({ query: { queryKey: ['alerts', { resolved: false }] } }, { query: { resolved: false } } as any);
  
  const unresolvedCount = alerts?.filter(a => !a.isResolved).length || 0;

  const navItems = [
    { href: "/", label: "Command Center", icon: Activity },
    { href: "/trades", label: "Trade Monitoring", icon: Search },
    { href: "/detection", label: "Anomaly Detection", icon: ShieldAlert },
    { href: "/news", label: "Market Intelligence", icon: Newspaper },
    { href: "/investigations", label: "Investigations", icon: Briefcase },
    { href: "/reports", label: "Reports", icon: FileText },
    { href: "/admin", label: "System Admin", icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-background font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Shield className="w-6 h-6 text-primary mr-3" />
          <span className="font-bold tracking-tight text-lg">MarketShield <span className="text-primary">AI</span></span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <li key={item.href}>
                  <Link href={item.href} className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                    <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    {item.label}
                    {item.href === "/detection" && unresolvedCount > 0 && (
                      <Badge variant="destructive" className="ml-auto flex-shrink-0 text-xs px-1.5 py-0 min-w-5 justify-center rounded-full">
                        {unresolvedCount}
                      </Badge>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-border">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-muted hover:text-foreground transition-colors"
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-4 h-4 mr-2" /> Light Mode
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 mr-2" /> Dark Mode
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}