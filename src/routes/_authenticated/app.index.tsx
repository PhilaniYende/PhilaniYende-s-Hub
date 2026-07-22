import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listThreads, createThread } from "@/lib/threads.functions";

export const Route = createFileRoute("/_authenticated/app/")({
  component: AppIndex,
});

function AppIndex() {
  const navigate = useNavigate();
  const list = useServerFn(listThreads);
  const create = useServerFn(createThread);

  useEffect(() => {
    (async () => {
      const threads = await list();
      if (threads.length > 0) {
        navigate({ to: "/app/$threadId", params: { threadId: threads[0].id }, replace: true });
      } else {
        const t = await create({ data: {} });
        navigate({ to: "/app/$threadId", params: { threadId: t.id }, replace: true });
      }
    })();
  }, [list, create, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      Loading your workspace…
    </div>
  );
}
