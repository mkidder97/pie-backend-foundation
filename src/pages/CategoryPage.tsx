import { useState } from "react";
import { useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import CategoryFeed from "@/components/pie/CategoryFeed";
import CategoryRelay from "@/components/pie/CategoryRelay";
import CategorySignals from "@/components/pie/CategorySignals";

const CATEGORY_MAP: Record<string, string | null> = {
  all: null,
  "src-tools": "src_tools",
  "stack-watch": "stack_watch",
  finance: "finance",
  opportunities: "opportunities",
};

type TabId = "feed" | "relay" | "signals";

const tabs: { id: TabId; label: string }[] = [
  { id: "feed", label: "Feed" },
  { id: "relay", label: "Relay" },
  { id: "signals", label: "Signals" },
];

const CategoryPage = () => {
  const { category = "all" } = useParams<{ category: string }>();
  const [activeTab, setActiveTab] = useState<TabId>("feed");

  const categoryFilter = CATEGORY_MAP[category] ?? null;

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-4 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "pb-2 text-xs font-medium transition-colors border-b-2",
              activeTab === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "feed" && <CategoryFeed category={categoryFilter} />}
      {activeTab === "relay" && <CategoryRelay category={categoryFilter} />}
      {activeTab === "signals" && <CategorySignals category={categoryFilter} />}
    </div>
  );
};

export default CategoryPage;
