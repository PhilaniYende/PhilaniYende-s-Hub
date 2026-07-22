import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { listThreads, createThread, deleteThread } from "@/lib/threads.functions";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Trash2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";
import { toast } from "sonner";

export function ChatSidebar() {
  const params = useParams({ strict: false }) as { threadId?: string };
  const navigate = useNavigate();
  const qc = useQueryClient();
  const list = useServerFn(listThreads);
  const create = useServerFn(createThread);
  const remove = useServerFn(deleteThread);

  const { data: threads = [] } = useQuery({
    queryKey: ["threads"],
    queryFn: () => list(),
  });

  async function newThread() {
    const t = await create({ data: {} });
    await qc.invalidateQueries({ queryKey: ["threads"] });
    navigate({ to: "/app/$threadId", params: { threadId: t.id } });
  }

  async function del(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Delete this conversation?")) return;
    await remove({ data: { id } });
    await qc.invalidateQueries({ queryKey: ["threads"] });
    if (params.threadId === id) navigate({ to: "/app" });
    toast.success("Deleted");
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <aside className="w-72 shrink-0 border-r bg-sidebar text-sidebar-foreground flex flex-col h-screen">
      <div className="p-4 flex items-center gap-2">
        <img src={logo} alt="" width={28} height={28} />
        <span className="font-semibold">Flow</span>
      </div>
      <div className="px-3">
        <Button onClick={newThread} className="w-full justify-start gap-2" variant="default">
          <Plus className="size-4" /> New conversation
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 mt-3 space-y-1">
        {threads.length === 0 && (
          <p className="text-xs text-muted-foreground px-3 py-2">No conversations yet.</p>
        )}
        {threads.map((t) => (
          <Link
            key={t.id}
            to="/app/$threadId"
            params={{ threadId: t.id }}
            className={cn(
              "group flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent transition-colors",
              params.threadId === t.id && "bg-sidebar-accent font-medium",
            )}
          >
            <MessageSquare className="size-4 shrink-0 opacity-60" />
            <span className="truncate flex-1">{t.title}</span>
            <button
              type="button"
              onClick={(e) => del(t.id, e)}
              className="opacity-0 group-hover:opacity-100 hover:text-destructive transition"
              aria-label="Delete"
            >
              <Trash2 className="size-3.5" />
            </button>
          </Link>
        ))}
      </div>
      <div className="p-3 border-t">
        <Button variant="ghost" onClick={signOut} className="w-full justify-start gap-2 text-sm">
          <LogOut className="size-4" /> Sign out
        </Button>
      </div>
    </aside>
  );
}
