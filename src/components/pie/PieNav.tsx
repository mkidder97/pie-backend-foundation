import { NavLink } from "@/components/NavLink";
import { LayoutDashboard, Rss, Hammer, Radar, Wrench, Search, MessageSquare, Users, Settings } from "lucide-react";

const links = [
  { to: "/dashboard", label: "Briefing", icon: LayoutDashboard },
  { to: "/feed", label: "Feed", icon: Rss },
  { to: "/build", label: "Build", icon: Hammer },
  { to: "/horizon", label: "Horizon", icon: Radar },
  { to: "/tools", label: "Tools", icon: Wrench },
  { to: "/search", label: "Search", icon: Search },
  { to: "/relay", label: "Relay", icon: MessageSquare },
  { to: "/creators", label: "Creators", icon: Users },
  { to: "/admin", label: "Admin", icon: Settings },
];

const PieNav = () => {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-12 max-w-6xl items-center gap-8 px-4">
        <span className="font-mono-pie text-sm font-bold tracking-widest text-primary">
          PIE
        </span>
        <div className="flex gap-1 overflow-x-auto">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap"
                activeClassName="bg-accent text-foreground"
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{link.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default PieNav;
