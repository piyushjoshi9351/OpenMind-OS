"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Loader2, Send, User2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { api, type ChatMessage } from '@/lib/api';

const STORAGE_KEY = 'openmind-chat-conversation-id';

type ChatBubble = ChatMessage & { optimistic?: boolean };

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const conversationLabel = useMemo(() => (conversationId ? conversationId.slice(0, 8) : 'New chat'), [conversationId]);

  useEffect(() => {
    const storedConversationId = window.localStorage.getItem(STORAGE_KEY);
    if (!storedConversationId) {
      setLoading(false);
      return;
    }

    setConversationId(storedConversationId);
    void api.getChatHistory(storedConversationId)
      .then((history) => {
        if (!history) {
          window.localStorage.removeItem(STORAGE_KEY);
          setConversationId(null);
          setMessages([]);
          return;
        }

        setConversationId(history.conversation_id);
        setMessages(history.messages);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load chat history.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || sending) {
      return;
    }

    setSending(true);
    setError(null);

    const optimisticUserMessage: ChatBubble = {
      id: Date.now(),
      conversation_id: conversationId ?? 'pending',
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
      optimistic: true,
    };

    setMessages((current) => [...current, optimisticUserMessage]);
    setMessage('');

    try {
      const response = await api.sendChatMessage({ message: trimmed, conversationId: conversationId ?? undefined });
      const nextConversationId = response.conversation_id;
      setConversationId(nextConversationId);
      window.localStorage.setItem(STORAGE_KEY, nextConversationId);

      const history = await api.getChatHistory(nextConversationId);
      if (history) {
        setMessages(history.messages);
      } else {
        setMessages((current) => [
          ...current.filter((item) => !item.optimistic),
          {
            id: Date.now() + 1,
            conversation_id: nextConversationId,
            role: 'assistant',
            content: response.assistant_message,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (sendError) {
      setMessages((current) => current.filter((item) => !item.optimistic));
      setMessage(trimmed);
      setError(sendError instanceof Error ? sendError.message : 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="AI Chat"
        subtitle="Real Gemini responses flow through FastAPI and rehydrate on reload."
        secondaryAction={<Badge variant="outline">{conversationLabel}</Badge>}
      />

      <Card className="om-card">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2">
            <Bot className="h-5 w-5" /> Conversation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4 min-h-[420px] space-y-3 overflow-y-auto">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-3/4" />
                <Skeleton className="h-16 w-2/3 ml-auto" />
                <Skeleton className="h-16 w-4/5" />
              </div>
            ) : messages.length ? (
              messages.map((item) => (
                <div key={`${item.id}-${item.created_at}`} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${item.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                    <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] opacity-80">
                      {item.role === 'user' ? <User2 className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                      {item.role}
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{item.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex min-h-[360px] items-center justify-center text-center">
                <div className="max-w-md space-y-2 text-muted-foreground">
                  <Bot className="mx-auto h-10 w-10 text-primary" />
                  <p className="font-semibold text-foreground">Start a real AI conversation</p>
                  <p className="text-sm">Send a message and Gemini will answer through FastAPI. Reload the page to see the same conversation again.</p>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

          <div className="grid gap-3">
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ask about goals, planning, study paths, or anything else..."
              className="min-h-[110px] resize-none"
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">Press Ctrl/Cmd + Enter to send.</p>
              <Button onClick={() => void handleSend()} disabled={sending || !message.trim()}>
                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}