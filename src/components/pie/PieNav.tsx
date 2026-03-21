import { NavLink, useLocation } from "react-router-dom";
import { Settings, Users, BarChart3, Bookmark } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const categories = [
  { to: "/all", label: "All", dbCategory: null },
  { to: "/src-tools", label: "SRC Tools", dbCategory: "src_tools" },
  { to: "/stack-watch", label: "Stack Watch", dbCategory: "stack_watch" },
  { to: "/finance", label: "Finance", dbCategory: "finance" },
  { to: "/opportunities", label: "Opportunities", dbCategory: "opportunities" },
  { to: "/tools", label: "Tools", dbCategory: null },
];

const PieNav = () => {
  const location = useLocation();

  const { data: counts } = useQuery({
    queryKey: ["pie-nav-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pie_episodes")
        .select("pie_creators!inner(category)")
        .eq("status", "completed");

      if (error) throw error;

      const map: Record<string, number> = {};
      for (const row of data ?? []) {
        const cat = (row.pie_creators as any)?.category as string;
        if (cat) map[cat] = (map[cat] ?? 0) + 1;
      }
      return map;
    },
    staleTime: 60_000,
  });

  const totalCount = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;

  const getCount = (cat: typeof categories[number]) => {
    if (cat.to === "/all") return totalCount;
    if (cat.to === "/tools" || !cat.dbCategory) return 0;
    return counts?.[cat.dbCategory] ?? 0;
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-2 px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-3 sm:gap-8">
          <span className="font-mono-pie text-sm font-bold tracking-widest text-primary shrink-0">
            PIE
          </span>
          <div className="flex gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {categories.map((cat) => {
              const count = getCount(cat);
              return (
                <NavLink
                  key={cat.to}
                  to={cat.to}
                  className={({ isActive }) =>
                    cn(
                      "rounded px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1 sm:gap-1.5",
                      isActive
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )
                  }
                >
                  {cat.label}
                  {count > 0 && (
                    <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-muted px-1 text-[10px] font-semibold text-muted-foreground">
                      {count}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="shrink-0 rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <Settings className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem asChild>
              <NavLink to="/creators" className="flex items-center gap-2 cursor-pointer">
                <Users className="h-3.5 w-3.5" />
                Creators
              </NavLink>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <NavLink to="/saved" className="flex items-center gap-2 cursor-pointer">
                <Bookmark className="h-3.5 w-3.5" />
                Agent Briefs
              </NavLink>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <NavLink to="/admin" className="flex items-center gap-2 cursor-pointer">
                <BarChart3 className="h-3.5 w-3.5" />
                Admin
              </NavLink>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default PieNav;
