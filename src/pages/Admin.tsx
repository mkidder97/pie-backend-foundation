import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Database, Activity, CheckCircle, XCircle, Loader, Rss, Video } from "lucide-react";

const Admin = () => {
  const { data: episodes, isLoading } = useQuery({
    queryKey: ["admin-pipeline-status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pie_episodes")
        .select("id, status, source_type");
      if (error) throw error;
      return data;
    },
  });

  const stats = episodes
    ? [
        { label: "Total Episodes", value: episodes.length, icon: Database, color: "text-primary" },
        { label: "Pending YouTube", value: episodes.filter((e) => e.status === "pending" && e.source_type === "youtube").length, icon: Video, color: "text-yellow-500" },
        { label: "Pending RSS", value: episodes.filter((e) => e.status === "pending" && e.source_type === "rss").length, icon: Rss, color: "text-yellow-500" },
        { label: "Completed", value: episodes.filter((e) => e.status === "completed").length, icon: CheckCircle, color: "text-green-500" },
        { label: "Failed", value: episodes.filter((e) => e.status === "failed").length, icon: XCircle, color: "text-destructive" },
        { label: "Processing", value: episodes.filter((e) => e.status === "processing" || e.status === "transcribing").length, icon: Loader, color: "text-blue-500" },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">Pipeline status and management</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Pipeline Status</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <Card key={s.label}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                    <Icon className={`h-4 w-4 ${s.color}`} />
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{s.value}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Admin;
