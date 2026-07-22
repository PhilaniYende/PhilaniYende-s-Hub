import { createFileRoute } from "@tanstack/react-router";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatWindow } from "@/components/ChatWindow";

export const Route = createFileRoute("/_authenticated/app/$threadId")({
  component: ChatPage,
});

function ChatPage() {
  const { threadId } = Route.useParams();
  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar />
      <ChatWindow threadId={threadId} />
    </div>
  );
}
