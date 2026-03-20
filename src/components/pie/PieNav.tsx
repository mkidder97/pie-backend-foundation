import { NavLink, useLocation } from "react-router-dom";
import { Settings, Users, BarChart3 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const categories = [
  { to: "/all", label: "All" },
  { to: "/src-tools", label: "SRC Tools" },
  { to: "/stack-watch", label: "Stack Watch" },
  { to: "/finance", label: "Finance" },
  { to: "/opportunities", label: "Opportunities" },
  { to: "/tools", label: "Tools" },
];

const PieNav = () => {
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <span className="font-mono-pie text-sm font-bold tracking-widest text-primary">
            PIE
          </span>
          <div className="flex gap-1 overflow-x-auto">
            {categories.map((cat) => (
              <NavLink
                key={cat.to}
                to={cat.to}
                className={({ isActive }) =>
                  cn(
                    "rounded px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )
                }
              >
                {cat.label}
              </NavLink>
            ))}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
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
