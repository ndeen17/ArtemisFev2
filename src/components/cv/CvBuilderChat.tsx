import { useEffect, useMemo, useRef, useState } from 'react';
import type { BuilderAction, StructuredCv } from '@artemis/shared';
import { Button } from '@/components/ui/Button';
import { useCvBuilderChat } from '@/hooks/useOnboarding';
import { cn } from '@/lib/cn';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
  /** Actions emitted alongside this assistant turn — null/empty for user msgs. */
  actions?: BuilderAction[];
  /** Track which actions have been applied/dismissed so we hide their buttons. */
  resolved?: Record<number, 'applied' | 'dismissed'>;
}

export interface CvBuilderChatProps {
  cv: StructuredCv;
  /** Apply an action to the CV draft. Owner is `CvBuilderPage`. */
  onApplyAction: (action: BuilderAction) => void;
  /** Optional className passthrough for layout. */
  className?: string;
  /** Persistence key — ties chat history + JD to the CV id so refresh restores. */
  storageKey?: string;
}

const STORAGE_VERSION = 1;
interface PersistShape {
  v: number;
  messages: Msg[];
  jd: string;
}

const GREETING: Msg = {
  role: 'assistant',
  content:
    "Hi! I'm here to help you build your CV from scratch. Do you have a job description in mind? If so, paste it in the box above — I'll use it to suggest sharper phrasing as we go. If not, no worries — we'll start with your name and headline.",
};

/**
 * Side-panel chat used inside the onboarding CV builder.
 *
 * Stateless on the server — every request sends the full history + current
 * CV draft. We persist the local chat (and pasted JD) to localStorage keyed
 * by cvId so a refresh doesn't lose context. The bot returns structured
 * `actions[]` that we render as Apply / Dismiss cards under each reply.
 */
export function CvBuilderChat({
  cv,
  onApplyAction,
  className,
  storageKey,
}: CvBuilderChatProps) {
  const chat = useCvBuilderChat();
  const [draft, setDraft] = useState('');
  const [jd, setJd] = useState('');
  const [jdOpen, setJdOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const scroller = useRef<HTMLDivElement | null>(null);
  const hydratedRef = useRef(false);

  // Restore persisted chat once on mount.
  useEffect(() => {
    if (hydratedRef.current || !storageKey) return;
    hydratedRef.current = true;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PersistShape;
      if (parsed?.v !== STORAGE_VERSION) return;
      if (Array.isArray(parsed.messages) && parsed.messages.length) {
        setMessages(parsed.messages);
      }
      if (typeof parsed.jd === 'string' && parsed.jd) {
        setJd(parsed.jd);
        setJdOpen(true);
      }
    } catch {
      /* ignore corrupt storage */
    }
  }, [storageKey]);

  // Persist chat + JD whenever they change.
  useEffect(() => {
    if (!storageKey) return;
    try {
      const payload: PersistShape = { v: STORAGE_VERSION, messages, jd };
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      /* ignore quota errors */
    }
  }, [messages, jd, storageKey]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [messages, chat.isPending]);

  const historyForApi = useMemo(
    () =>
      messages
        .filter((m): m is Msg & { content: string } => Boolean(m.content?.trim()))
        .map((m) => ({ role: m.role, content: m.content })),
    [messages],
  );

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || chat.isPending) return;
    const next: Msg[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(next);
    setDraft('');
    try {
      const result = await chat.mutateAsync({
        cv,
        history: historyForApi,
        message: trimmed,
        ...(jd.trim().length >= 30 ? { jobDescription: jd.trim() } : {}),
      });
      setMessages([
        ...next,
        {
          role: 'assistant',
          content: result.reply,
          actions: result.actions,
          resolved: {},
        },
      ]);
    } catch {
      setMessages([
        ...next,
        {
          role: 'assistant',
          content:
            "Sorry — I couldn't reach the assistant just now. Try again in a moment, or keep editing the CV directly while I recover.",
        },
      ]);
    }
  }

  function applyActionAt(msgIdx: number, actionIdx: number, action: BuilderAction) {
    onApplyAction(action);
    setMessages((prev) =>
      prev.map((m, i) =>
        i === msgIdx
          ? { ...m, resolved: { ...(m.resolved ?? {}), [actionIdx]: 'applied' } }
          : m,
      ),
    );
  }

  function dismissActionAt(msgIdx: number, actionIdx: number) {
    setMessages((prev) =>
      prev.map((m, i) =>
        i === msgIdx
          ? { ...m, resolved: { ...(m.resolved ?? {}), [actionIdx]: 'dismissed' } }
          : m,
      ),
    );
  }

  return (
    <aside
      role="complementary"
      aria-label="CV builder assistant"
      className={cn(
        'flex flex-col h-full rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden',
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100">
        <div>
          <div className="text-[14px] font-semibold tracking-tight">CV Assistant</div>
          <div className="text-[11.5px] text-gray-500">
            I'll help you build your CV section by section.
          </div>
        </div>
        <button
          type="button"
          onClick={() => setJdOpen((v) => !v)}
          className="text-[11.5px] font-medium text-brand-green hover:underline"
          aria-expanded={jdOpen}
        >
          {jdOpen ? 'Hide JD' : 'Add JD'}
        </button>
      </header>

      {jdOpen ? (
        <div className="border-b border-gray-100 px-4 py-3 bg-gray-50/50">
          <label className="block text-[11.5px] font-medium text-gray-600 mb-1">
            Job description (optional)
          </label>
          <textarea
            rows={3}
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste a JD to inform phrasing — I'll never invent experience you don't have."
            className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent"
          />
          <div className="text-[11px] text-gray-500 mt-1">
            {jd.trim().length >= 30
              ? `${jd.trim().length} chars — included in suggestions`
              : 'Paste at least 30 chars to use as context.'}
          </div>
        </div>
      ) : null}

      <div ref={scroller} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((m, mi) => (
          <div key={mi} className="space-y-2">
            <div
              className={
                m.role === 'user'
                  ? 'ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-brand-green text-white px-3.5 py-2 text-[13.5px] whitespace-pre-wrap'
                  : 'mr-auto max-w-[92%] rounded-2xl rounded-bl-sm bg-gray-100 text-[#111827] px-3.5 py-2 text-[13.5px] whitespace-pre-wrap'
              }
            >
              {m.content}
            </div>
            {m.role === 'assistant' && m.actions && m.actions.length > 0 ? (
              <div className="mr-auto max-w-[92%] space-y-1.5">
                {m.actions.map((a, ai) => {
                  const status = m.resolved?.[ai];
                  return (
                    <div
                      key={ai}
                      className={cn(
                        'rounded-xl border px-3 py-2 text-[12.5px] flex items-center justify-between gap-3',
                        status === 'applied'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : status === 'dismissed'
                            ? 'border-gray-200 bg-gray-50 text-gray-400 line-through'
                            : 'border-brand-green/30 bg-brand-green/5 text-gray-800',
                      )}
                    >
                      <div className="min-w-0">
                        <div className="font-medium truncate">{a.label}</div>
                        <div className="text-[11px] text-gray-500 capitalize">
                          {humanType(a.type)}
                        </div>
                      </div>
                      {status ? (
                        <span className="text-[11px] font-medium shrink-0">
                          {status === 'applied' ? 'Added' : 'Dismissed'}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => applyActionAt(mi, ai, a)}
                          >
                            Apply
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => dismissActionAt(mi, ai)}
                          >
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        ))}
        {chat.isPending ? (
          <div className="mr-auto max-w-[60%] rounded-2xl rounded-bl-sm bg-gray-100 text-gray-500 px-3.5 py-2 text-[13.5px]">
            Thinking…
          </div>
        ) : null}
      </div>

      <footer className="border-t border-gray-100 px-3 py-3 flex items-end gap-2">
        <textarea
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send(draft);
            }
          }}
          placeholder="Ask anything, or tell me about your experience…"
          className="flex-1 resize-none rounded-2xl border border-gray-200 bg-white px-3 py-2 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent"
        />
        <Button type="button" onClick={() => void send(draft)} disabled={chat.isPending || !draft.trim()}>
          Send
        </Button>
      </footer>
    </aside>
  );
}

function humanType(t: BuilderAction['type']): string {
  switch (t) {
    case 'setHeader':
      return 'Update header';
    case 'setSummary':
      return 'Set summary';
    case 'addExperience':
      return 'Add experience';
    case 'updateExperience':
      return 'Update experience';
    case 'addBullet':
      return 'Add bullet';
    case 'addEducation':
      return 'Add education';
    case 'updateEducation':
      return 'Update education';
    case 'addSkill':
      return 'Add skill';
    case 'addSkills':
      return 'Add skills';
    default:
      return 'Update CV';
  }
}
