import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, FileText, Clock, Shield } from "lucide-react";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Philani Yende Hub" },
      {
        name: "description",
        content:
          "Flow drafts your emails and summarizes your meetings so you can stop losing hours to your inbox. An AI teammate for burnt-out professionals.",
      },
      { property: "og:title", content: "Philani Yende Hub" },
      {
        property: "og:description",
        content: "Flow drafts your emails and summarizes your meetings so you can stop losing hours to your inbox. An AI teammate for burnt-out professionals.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 font-semibold">
          <img src={logo} alt="" width={28} height={28} />
          Flow
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
          <Link to="/auth">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </header>

      <main>
        <section className="max-w-4xl mx-auto px-6 pt-16 pb-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground mb-6">
            <span className="size-1.5 rounded-full bg-[oklch(0.7_0.18_15)]" />
            For the 3-hours-a-day-in-your-inbox crowd
          </div>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
            Your inbox is not
            <br />
            <span className="italic text-[oklch(0.55_0.18_15)]">your job.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
            Flow is an AI teammate that drafts your replies and turns messy meeting notes into
            clean summaries. Log off on time. Guilt-free.
          </p>
          <div className="mt-8 flex gap-3 justify-center">
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                Start for free <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6">
          <Feature
            icon={Mail}
            title="Draft emails in seconds"
            body="Tell Flow the recipient, the ask, and the tone. Get a clean draft you can actually send."
          />
          <Feature
            icon={FileText}
            title="Meetings, distilled"
            body="Paste notes or a transcript. Get a summary, decisions, action items, and open questions."
          />
          <Feature
            icon={Clock}
            title="Built for the crisis"
            body="Designed for professionals losing hours to email. Fast, focused, and never bloated."
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 pb-24">
          <div className="rounded-3xl border bg-card p-8 sm:p-12 text-center space-y-4">
            <Shield className="size-8 mx-auto text-[oklch(0.55_0.18_15)]" />
            <h2 className="text-2xl font-semibold">Responsible by default</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Flow never fabricates names, quotes, or decisions. It flags when it needs more
              context and keeps your drafts private to your account.
            </p>
          </div>
        </section>
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-8 text-sm text-muted-foreground flex justify-between">
        <span>© Flow</span>
        <span>Built with responsible AI</span>
      </footer>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-6 space-y-3">
      <div className="size-10 rounded-lg bg-[oklch(0.96_0.03_15)] flex items-center justify-center">
        <Icon className="size-5 text-[oklch(0.5_0.18_15)]" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
