import { useEffect, useRef, useState } from 'react';
import type { CvCoachSection, StructuredCv } from '@artemis/shared';
import { useCvCoach } from '@/hooks/useOnboarding';
import { Button } from '@/components/ui/Button';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

export interface CvCoachChatProps {
  cv: StructuredCv;
  section: CvCoachSection;
  onClose: () => void;
}

/**
 * Floating CV-coach chat panel. Stateless — history lives in component memory
 * and is sent on every request alongside the current CV draft so the model has
 * fresh context. Closing the panel discards the conversation.
 */
export function CvCoachChat({ cv, section, onClose }: CvCoachChatProps) {
  const coach = useCvCoach();
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Msg[]>(() => [
    {
      role: 'assistant',
      content:
        "Hi, I'm your CV coach. Tell me what you're stuck on and I'll suggest a sharper angle. I can rewrite a bullet, tighten your summary, or list the keywords you're missing.",
    },
  ]);
  const scroller = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [messages, coach.isPending]);

  async function send() {
    const text = draft.trim();
    if (!text || coach.isPending) return;
    const next: Msg[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setDraft('');
    try {
      const reply = await coach.mutateAsync({
        cv,
        section,
        history: messages,
        message: text,
      });
      setMessages([...next, { role: 'assistant', content: reply }]);
    } catch {
      setMessages([
        ...next,
        {
          role: 'assistant',
          content: "Sorry — I couldn't reach the coach just now. Try again in a moment.",
        },
      ]);
    }
  }

  return (
    <div
      role="dialog"
      aria-label="CV coach chat"
      className="fixed bottom-6 right-6 z-40 w-[min(420px,calc(100vw-2rem))] h-[min(560px,calc(100vh-3rem))] rounded-3xl border border-gray-100 bg-white shadow-[0_24px_48px_rgba(0,0,0,0.16)] flex flex-col"
    >
      <header className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100">
        <div>
          <div className="text-[14px] font-semibold tracking-tight">CV Coach</div>
          <div className="text-[11.5px] text-gray-500">
            Focused on: <span className="capitalize">{section}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close coach"
        >
          ×
        </button>
      </header>

      <div ref={scroller} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === 'user'
                ? 'ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-brand-green text-white px-3.5 py-2 text-[13.5px] whitespace-pre-wrap'
                : 'mr-auto max-w-[90%] rounded-2xl rounded-bl-sm bg-gray-100 text-[#111827] px-3.5 py-2 text-[13.5px] whitespace-pre-wrap'
            }
          >
            {m.content}
          </div>
        ))}
        {coach.isPending ? (
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
              void send();
            }
          }}
          placeholder="Ask anything about your CV…"
          className="flex-1 resize-none rounded-2xl border border-gray-200 bg-white px-3 py-2 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent"
        />
        <Button type="button" onClick={send} disabled={coach.isPending || !draft.trim()}>
          Send
        </Button>
      </footer>
    </div>
  );
}
