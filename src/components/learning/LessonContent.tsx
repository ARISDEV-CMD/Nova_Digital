import { Fragment, useMemo } from 'react';
import { motion } from 'motion/react';
import { useReducedMotionPreference } from '../../hooks/use-reduced-motion.ts';

type ContentBlock =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'quote'; text: string }
  | { kind: 'code'; text: string };

function splitLongParagraph(text: string): ContentBlock[] {
  if (text.length < 650) return [{ kind: 'paragraph', text }];

  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length < 4) return [{ kind: 'paragraph', text }];

  const paragraphs: ContentBlock[] = [];
  for (let index = 0; index < sentences.length; index += 2) {
    paragraphs.push({ kind: 'paragraph', text: sentences.slice(index, index + 2).join(' ') });
  }
  return paragraphs;
}

function parseContent(source: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let listOrdered: boolean | null = null;
  let codeLines: string[] | null = null;

  const flushParagraph = () => {
    const text = paragraph.join(' ').trim();
    if (text) blocks.push(...splitLongParagraph(text));
    paragraph = [];
  };
  const flushList = () => {
    if (listItems.length) blocks.push({ kind: 'list', ordered: Boolean(listOrdered), items: listItems });
    listItems = [];
    listOrdered = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    const listItem = trimmed.match(/^(?:(\d+)[.)]|[-*+])\s+(.+)$/);

    if (trimmed.startsWith('```')) {
      flushParagraph();
      flushList();
      if (codeLines) {
        blocks.push({ kind: 'code', text: codeLines.join('\n') });
        codeLines = null;
      } else codeLines = [];
      continue;
    }
    if (codeLines) {
      codeLines.push(line);
      continue;
    }
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ kind: 'heading', level: heading[1].length, text: heading[2] });
      continue;
    }
    if (listItem) {
      flushParagraph();
      const ordered = Boolean(listItem[1]);
      if (listOrdered !== null && listOrdered !== ordered) flushList();
      listOrdered = ordered;
      listItems.push(listItem[2]);
      continue;
    }
    if (trimmed.startsWith('>')) {
      flushParagraph();
      flushList();
      blocks.push({ kind: 'quote', text: trimmed.replace(/^>\s?/, '') });
      continue;
    }
    flushList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  if (codeLines) blocks.push({ kind: 'code', text: codeLines.join('\n') });
  return blocks;
}

function LearningCycle() {
  const prefersReducedMotion = useReducedMotionPreference();

  return (
    <motion.figure
      className="overflow-hidden rounded-xl border border-[#343956] bg-[radial-gradient(ellipse_at_top,#25294a_0%,#151a27_66%)] p-4 sm:p-6"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <figcaption className="mb-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4cd7f6]">Le fil conducteur</p>
        <h3 className="mt-1 text-base font-semibold text-white">Apprendre en trois temps</h3>
      </figcaption>
      <img
        src="/assets/illustrations/learning-cycle.svg"
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="mx-auto block h-auto w-full max-w-3xl"
      />
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border border-white/5 bg-[#10141d]/60 px-2 py-2">
          <p className="text-xs font-semibold text-[#dfe2ee]">Comprendre</p>
          <p className="mt-1 hidden text-[11px] text-[#9ca5bd] sm:block">Repérer l’idée clé</p>
        </div>
        <div className="rounded-lg border border-white/5 bg-[#10141d]/60 px-2 py-2">
          <p className="text-xs font-semibold text-[#dfe2ee]">Pratiquer</p>
          <p className="mt-1 hidden text-[11px] text-[#9ca5bd] sm:block">L’essayer concrètement</p>
        </div>
        <div className="rounded-lg border border-white/5 bg-[#10141d]/60 px-2 py-2">
          <p className="text-xs font-semibold text-[#dfe2ee]">Vérifier</p>
          <p className="mt-1 hidden text-[11px] text-[#9ca5bd] sm:block">Contrôler le résultat</p>
        </div>
      </div>
    </motion.figure>
  );
}

function renderBlock(block: ContentBlock, index: number) {
  if (block.kind === 'heading') {
    const Heading = block.level === 1 ? 'h2' : 'h3';
    return <Heading key={index} className="border-b border-[#313746] pb-2 text-lg font-bold text-white">{block.text}</Heading>;
  }
  if (block.kind === 'list') {
    const List = block.ordered ? 'ol' : 'ul';
    return (
      <List key={index} className={`space-y-2 pl-5 text-sm leading-7 text-[#c7c4d7] ${block.ordered ? 'list-decimal marker:text-[#4cd7f6]' : 'list-disc marker:text-[#4cd7f6]'}`}>
        {block.items.map((item, itemIndex) => <li key={`${index}-${itemIndex}`} className="pl-1">{item}</li>)}
      </List>
    );
  }
  if (block.kind === 'quote') {
    return <blockquote key={index} className="border-l-2 border-[#8083ff] pl-4 text-sm italic leading-7 text-[#b7bad1]">{block.text}</blockquote>;
  }
  if (block.kind === 'code') {
    return <pre key={index} className="overflow-x-auto rounded-lg border border-[#313746] bg-[#0b0f17] p-4 text-xs leading-6 text-[#b7dcff]"><code>{block.text}</code></pre>;
  }
  return <p key={index} className="text-sm leading-7 text-[#d1d4e0]">{block.text}</p>;
}

export function LessonContent({ content }: { content: string }) {
  const blocks = useMemo(() => parseContent(content), [content]);
  const visualIndex = useMemo(() => {
    const practiceHeading = blocks.findIndex((block) => block.kind === 'heading' && /mise en pratique|application/i.test(block.text));
    if (practiceHeading > 0) return practiceHeading;
    return Math.min(Math.max(1, Math.floor(blocks.length / 2)), blocks.length);
  }, [blocks]);
  const showVisual = content.trim().length > 240 && blocks.length > 1;

  return (
    <div className="space-y-5">
      {blocks.map((block, index) => (
        <Fragment key={`${block.kind}-${index}`}>
          {showVisual && index === visualIndex && <LearningCycle />}
          {renderBlock(block, index)}
        </Fragment>
      ))}
      {showVisual && visualIndex === blocks.length && <LearningCycle />}
    </div>
  );
}
