import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Send, MessageSquare, ArrowLeft } from 'lucide-react';
import { apiError, drivingSchoolApi, websiteApi } from '../../lib/api';
import { Button, Card, CenteredSpinner, EmptyState, Input, Select } from '../../components/ui';
import { cn } from '../../lib/utils';

export default function Messages() {
  const { data: websites } = useQuery({ queryKey: ['websites'], queryFn: websiteApi.list });
  const [wid, setWid] = useState('');
  useEffect(() => {
    if (websites?.length && !wid) setWid(websites[0].id);
  }, [websites, wid]);

  const [activeId, setActiveId] = useState<string | null>(null);

  const conversations = useQuery({
    queryKey: ['conversations', wid],
    queryFn: () => drivingSchoolApi.listConversations(wid),
    enabled: !!wid,
    refetchInterval: 12000,
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-sand-900">Messages</h1>
          <p className="mt-1 text-sm text-sand-600">Chat with your students. Replies reach them in their account.</p>
        </div>
        {websites && websites.length > 1 && (
          <Select value={wid} onChange={(e) => { setWid(e.target.value); setActiveId(null); }} className="w-52">
            {websites.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        )}
      </div>

      {!wid || conversations.isLoading ? (
        <CenteredSpinner label="Loading…" />
      ) : !conversations.data || conversations.data.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-6 w-6" />}
          title="No conversations yet"
          description="When a student sends you a message from their account, it will appear here."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* Conversation list */}
          <Card className={cn('p-0 overflow-hidden', activeId && 'hidden lg:block')}>
            <ul className="divide-y divide-sand-100">
              {conversations.data.map((c) => (
                <li key={c.enrollmentId}>
                  <button
                    onClick={() => setActiveId(c.enrollmentId)}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-3 text-start transition-colors hover:bg-sand-50',
                      activeId === c.enrollmentId && 'bg-sand-50'
                    )}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand-900 text-xs font-semibold text-white">
                      {c.studentName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-sand-900">{c.studentName}</span>
                        {c.unread > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sun-600 px-1.5 text-[11px] font-semibold text-white">
                            {c.unread}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-sand-500">
                        {c.lastSender === 'TEACHER' ? 'You: ' : ''}
                        {c.lastMessage}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          {/* Thread */}
          <div className={cn(!activeId && 'hidden lg:block')}>
            {activeId ? (
              <Thread websiteId={wid} enrollmentId={activeId} onBack={() => setActiveId(null)} />
            ) : (
              <Card className="flex h-full min-h-[24rem] items-center justify-center text-sm text-sand-500">
                Select a conversation to read and reply.
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Thread({ websiteId, enrollmentId, onBack }: { websiteId: string; enrollmentId: string; onBack: () => void }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const thread = useQuery({
    queryKey: ['thread', websiteId, enrollmentId],
    queryFn: () => drivingSchoolApi.listMessages(websiteId, enrollmentId),
    refetchInterval: 8000,
  });

  const send = useMutation({
    mutationFn: (body: string) => drivingSchoolApi.sendMessage(websiteId, enrollmentId, body),
    onSuccess: () => {
      setDraft('');
      thread.refetch();
      qc.invalidateQueries({ queryKey: ['conversations', websiteId] });
    },
    onError: (e) => toast.error(apiError(e).message),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    // reading the thread marks it read server-side; refresh the unread badges
    qc.invalidateQueries({ queryKey: ['conversations', websiteId] });
  }, [thread.data, qc, websiteId]);

  return (
    <Card className="flex h-full min-h-[24rem] flex-col p-0">
      <div className="flex items-center gap-2 border-b border-sand-100 px-4 py-3">
        <button onClick={onBack} className="lg:hidden" aria-label="Back">
          <ArrowLeft className="h-4 w-4 text-sand-500" />
        </button>
        <span className="text-sm font-semibold text-sand-900">{thread.data?.student.name ?? 'Conversation'}</span>
        {thread.data?.student.email && <span className="text-xs text-sand-400">· {thread.data.student.email}</span>}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4" style={{ maxHeight: '26rem' }}>
        {thread.isLoading ? (
          <CenteredSpinner label="Loading…" />
        ) : !thread.data || thread.data.messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-sand-500">No messages yet. Say hello 👋</p>
        ) : (
          thread.data.messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm',
                m.sender === 'TEACHER'
                  ? 'ms-auto rounded-br-sm bg-sun-600 text-white'
                  : 'me-auto rounded-bl-sm bg-sand-100 text-sand-900'
              )}
            >
              {m.body}
              <span className="mt-1 block text-[11px] opacity-70">
                {new Date(m.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>

      <form
        className="flex gap-2 border-t border-sand-100 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          const body = draft.trim();
          if (!body) return;
          send.mutate(body);
        }}
      >
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a reply…" maxLength={2000} />
        <Button variant="primary" type="submit" loading={send.isPending} aria-label="Send">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
}
