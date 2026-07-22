import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { getThreadMessages, saveMessages } from "@/lib/threads.functions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Mail, FileText, Sparkles } from "lucide-react";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS = [
  {
    icon: Mail,
    label: "Draft an email",
    prompt: "Help me draft a professional email. Ask me: who it's for, what I want to say, and the tone. Then produce the draft.",
  },
  {
    icon: FileText,
    label: "Summarize a meeting",
    prompt: "I'll paste meeting notes or a transcript. Give me: a 2-3 sentence summary, key decisions, action items (with owner + due date if mentioned), and open questions.",
  },
  {
    icon: Sparkles,
    label: "Reply to an email",
    prompt: "I'll paste an email I received. Help me draft a reply — first restate the ask in one line, then give me 2 short reply options: one concise, one warmer.",
  },
];

export function ChatWindow({ threadId }: { threadId: string }) {
  const qc = useQueryClient();
  const loadMessages = useServerFn(getThreadMessages);
  const persist = useServerFn(saveMessages);

  const { data: initial, isLoading } = useQuery({
    queryKey: ["messages", threadId],
    queryFn: () => loadMessages({ data: { threadId } }),
  });

  const initialMessages = useMemo<UIMessage[]>(() => {
    if (!initial) return [];
    return initial.map((m) => ({
      id: m.id,
      role: m.role,
      parts: JSON.parse(m.partsJson),
    })) as UIMessage[];
  }, [initial]);

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  return (
    <ChatInner key={threadId} threadId={threadId} initialMessages={initialMessages} onFirstSave={() => qc.invalidateQueries({ queryKey: ["threads"] })} persist={persist} />
  );
}

function ChatInner({
  threadId,
  initialMessages,
  persist,
  onFirstSave,
}: {
  threadId: string;
  initialMessages: UIMessage[];
  persist: (opts: { data: { threadId: string; messages: Array<{ role: string; parts: unknown[] }> } }) => Promise<unknown>;
  onFirstSave: () => void;
}) {
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
  });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastSavedRef = useRef<number>(initialMessages.length);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [threadId, status]);

  // Persist newly completed messages once streaming is idle
  useEffect(() => {
    if (status !== "ready") return;
    if (messages.length <= lastSavedRef.current) return;
    const toSave = messages.slice(lastSavedRef.current).map((m) => ({
      role: m.role,
      parts: m.parts as unknown as unknown[],
    }));
    lastSavedRef.current = messages.length;
    persist({ data: { threadId, messages: toSave } }).then(() => {
      if (lastSavedRef.current <= 2) onFirstSave();
    }).catch((e) => console.error("persist failed", e));
  }, [status, messages, persist, threadId, onFirstSave]);

  const isBusy = status === "submitted" || status === "streaming";

  function submit() {
    const text = input.trim();
    if (!text || isBusy) return;
    setInput("");
    void sendMessage({ text });
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-background">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          {messages.length === 0 ? (
            <EmptyState onPick={(p) => sendMessage({ text: p })} />
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} />)
          )}
          {status === "submitted" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="size-2 rounded-full bg-foreground/40 animate-pulse" />
              Thinking…
            </div>
          )}
        </div>
      </div>
      <div className="border-t bg-background">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="relative rounded-2xl border bg-card shadow-sm focus-within:ring-2 focus-within:ring-ring/30 transition">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Draft an email, summarize a meeting, ask anything…"
              className="min-h-[60px] max-h-40 border-0 shadow-none focus-visible:ring-0 resize-none pr-14 pb-12 bg-transparent"
            />
            <Button
              onClick={submit}
              disabled={!input.trim() || isBusy}
              size="icon"
              className="absolute right-2 bottom-2 rounded-full size-9"
              aria-label="Send"
            >
              <ArrowUp className="size-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Flow can make mistakes. Verify important details before sending.
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="text-center py-12 space-y-8">
      <div className="flex justify-center">
        <img src={logo} alt="" width={64} height={64} />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">How can I help you win back your day?</h1>
        <p className="text-muted-foreground">Draft an email, distill a meeting, or just think out loud.</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.label}
            onClick={() => onPick(a.prompt)}
            className="rounded-xl border bg-card p-4 text-left hover:border-foreground/30 hover:shadow-sm transition-all group"
          >
            <a.icon className="size-5 mb-3 text-primary" />
            <div className="font-medium text-sm">{a.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = (message.parts as Array<{ type: string; text?: string }>)
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");

  return (
    <div className={cn("flex gap-3", isUser && "justify-end")}>
      {!isUser && (
        <div className="shrink-0 size-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
          <img src={logo} alt="" width={20} height={20} />
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser ? "bg-primary text-primary-foreground rounded-br-sm" : "text-foreground",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{text}</p>
        ) : (
          <div className="prose max-w-none">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
