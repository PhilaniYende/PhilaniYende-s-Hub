import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { UIMessage } from "ai";

export const listThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("threads")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ title: z.string().optional() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("threads")
      .insert({ user_id: context.userId, title: data.title ?? "New conversation" })
      .select("id, title, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("threads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const renameThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), title: z.string().min(1).max(120) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("threads")
      .update({ title: data.title })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getThreadMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ threadId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("messages")
      .select("id, role, parts, created_at")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => ({
      id: r.id,
      role: r.role as "user" | "assistant" | "system",
      parts: r.parts as unknown as UIMessage["parts"],
    }));
  });

export const saveMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        threadId: z.string().uuid(),
        messages: z.array(
          z.object({
            role: z.enum(["user", "assistant", "system"]),
            parts: z.array(z.any()),
          }),
        ),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    // Verify ownership
    const { data: thread, error: tErr } = await context.supabase
      .from("threads")
      .select("id")
      .eq("id", data.threadId)
      .maybeSingle();
    if (tErr || !thread) throw new Error("Thread not found");

    const rows = data.messages.map((m) => ({
      thread_id: data.threadId,
      user_id: context.userId,
      role: m.role,
      parts: m.parts,
    }));
    const { error } = await context.supabase.from("messages").insert(rows);
    if (error) throw new Error(error.message);

    // Auto-title from first user message
    if (data.messages[0]?.role === "user") {
      const firstText =
        (data.messages[0].parts.find((p: { type?: string }) => p?.type === "text") as
          | { text?: string }
          | undefined)?.text ?? "";
      if (firstText) {
        const title = firstText.slice(0, 60);
        await context.supabase
          .from("threads")
          .update({ title })
          .eq("id", data.threadId)
          .eq("title", "New conversation");
      }
    }
    return { ok: true };
  });
