import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fixMarkdownTables } from '../utils/markdownUtils';

const MD_COMPONENTS = {
  h1: ({ children }) => <h1 className="mb-2 font-display text-[17px] font-bold text-ink-strong">{children}</h1>,
  h2: ({ children }) => <h2 className="my-[6px] font-display text-[15px] font-bold text-ink">{children}</h2>,
  h3: ({ children }) => <h3 className="my-2 text-[13.5px] font-semibold text-ink">{children}</h3>,
  p: ({ children }) => <p className="mb-2 leading-[1.7] last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-bold text-ink-strong">{children}</strong>,
  em: ({ children }) => <em className="italic text-[#c4b5fd]">{children}</em>,
  ul: ({ children }) => <ul className="mb-2 ml-[18px] my-[6px] list-disc">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 ml-[18px] my-[6px] list-decimal">{children}</ol>,
  li: ({ children }) => <li className="mb-1 leading-[1.6]">{children}</li>,
  code: ({ inline, children }) =>
    inline
      ? <code className="rounded-[4px] border border-white/10 bg-white/[0.08] px-1.5 py-px font-mono text-[12.5px] text-[#a5f3fc]">{children}</code>
      : <code className="whitespace-pre font-mono text-[12.5px] text-[#e2e8f0]">{children}</code>,
  pre: ({ children }) => <pre className="my-2 overflow-x-auto rounded-lg border border-[#1e293b] bg-[#0f172a] p-3">{children}</pre>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-[3px] border-accent pl-3 italic text-ink-secondary">{children}</blockquote>
  ),
  table: ({ children }) => <div className="my-2 overflow-x-auto"><table className="w-full border-collapse text-[13px]">{children}</table></div>,
  th: ({ children }) => <th className="whitespace-nowrap border border-line px-3 py-2 text-left text-xs font-semibold text-ink-strong">{children}</th>,
  td: ({ children }) => <td className="border border-line px-3 py-[7px] text-[13px] text-ink-secondary">{children}</td>,
  tr: ({ children }) => <tr className="transition-colors hover:bg-white/[0.03]">{children}</tr>,
  thead: ({ children }) => <thead className="bg-white/5">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  hr: () => <hr className="my-3 border-t border-line" />,
};

function MarkdownRenderer({ content }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
      {fixMarkdownTables(content)}
    </ReactMarkdown>
  );
}

export default MarkdownRenderer;
