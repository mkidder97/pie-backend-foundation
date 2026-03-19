import { NavLink } from "@/components/NavLink";

const links = [
  { to: "/feed", label: "Feed" },
  { to: "/build", label: "Build" },
  { to: "/tools", label: "Tools" },
];

const PieNav = () => {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-12 max-w-6xl items-center gap-8 px-4">
        <span className="font-mono-pie text-sm font-bold tracking-widest text-primary">
          PIE
        </span>
        <div className="flex gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className="rounded px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeClassName="bg-accent text-foreground"
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default PieNav;
