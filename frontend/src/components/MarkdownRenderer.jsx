import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fixMarkdownTables } from '../utils/markdownUtils';

/** Componentes de Markdown con clases CSS del design system de S1GM4 */
const MD_COMPONENTS = {
  h1:         ({ children }) => <h1 className="md-h1">{children}</h1>,
  h2:         ({ children }) => <h2 className="md-h2">{children}</h2>,
  h3:         ({ children }) => <h3 className="md-h3">{children}</h3>,
  p:          ({ children }) => <p className="md-p">{children}</p>,
  strong:     ({ children }) => <strong className="md-strong">{children}</strong>,
  em:         ({ children }) => <em className="md-em">{children}</em>,
  ul:         ({ children }) => <ul className="md-ul">{children}</ul>,
  ol:         ({ children }) => <ol className="md-ol">{children}</ol>,
  li:         ({ children }) => <li className="md-li">{children}</li>,
  code:       ({ inline, children }) =>
    inline
      ? <code className="md-code-inline">{children}</code>
      : <code className="md-code-block">{children}</code>,
  pre:        ({ children }) => <pre className="md-pre">{children}</pre>,
  blockquote: ({ children }) => <blockquote className="md-blockquote">{children}</blockquote>,
  table:      ({ children }) => <div className="md-table-wrap"><table className="md-table">{children}</table></div>,
  th:         ({ children }) => <th className="md-th">{children}</th>,
  td:         ({ children }) => <td className="md-td">{children}</td>,
  tr:         ({ children }) => <tr className="md-tr">{children}</tr>,
  thead:      ({ children }) => <thead className="md-thead">{children}</thead>,
  tbody:      ({ children }) => <tbody>{children}</tbody>,
  hr:         () => <hr className="md-hr" />,
};

/**
 * MarkdownRenderer — Renderiza contenido markdown con el design system de S1GM4.
 * @param {{ content: string }} props
 */
function MarkdownRenderer({ content }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
      {fixMarkdownTables(content)}
    </ReactMarkdown>
  );
}

export default MarkdownRenderer;
