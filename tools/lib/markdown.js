'use strict';

/* Markdown ringan — cukup untuk catatan: heading, paragraf, list,
   kutipan, kode, tautan, tebal, dan miring. Tanpa dependensi. */

function esc(value) {
  return String(value).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function safeUrl(url) {
  const u = url.replace(/&amp;/g, '&');
  if (/^(https?:|mailto:)/i.test(u)) return u;
  if (/^(\/|#|\.{1,2}\/)/.test(u)) return u;
  return null;
}

function inline(text) {
  const codes = [];
  let s = esc(text).replace(/`([^`]+)`/g, function (m, code) {
    codes.push(code);
    return '\u0000C' + (codes.length - 1) + '\u0000';
  });

  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, label, href) {
    const url = safeUrl(href);
    if (!url) return label;
    const external = /^https?:/i.test(url);
    return '<a href="' + esc(url) + '"' + (external ? ' rel="noopener"' : '') + '>' + label + '</a>';
  });

  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  s = s.replace(/\u0000C(\d+)\u0000/g, function (m, i) {
    return '<code>' + codes[Number(i)] + '</code>';
  });
  return s;
}

function headingId(text, used) {
  let base = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
  if (!base) base = 'bagian';
  let id = base;
  let n = 2;
  while (used.has(id)) id = base + '-' + n++;
  used.add(id);
  return id;
}

function renderMarkdown(markdown) {
  const lines = markdown.split('\n');
  const out = [];
  const used = new Set();
  let para = [];
  let quote = [];
  let list = null;
  let code = null;

  function flushPara() {
    if (!para.length) return;
    out.push('<p>' + inline(para.join(' ')) + '</p>');
    para = [];
  }
  function flushQuote() {
    if (!quote.length) return;
    out.push('<blockquote><p>' + inline(quote.join(' ')) + '</p></blockquote>');
    quote = [];
  }
  function flushList() {
    if (!list) return;
    out.push('<' + list.tag + '>' + list.items.map(function (item) {
      return '<li>' + inline(item) + '</li>';
    }).join('') + '</' + list.tag + '>');
    list = null;
  }
  function flushAll() { flushPara(); flushQuote(); flushList(); }

  lines.forEach(function (raw) {
    const line = raw.replace(/\s+$/, '');

    if (code) {
      if (/^```/.test(line)) {
        out.push('<pre><code' + (code.lang ? ' class="language-' + esc(code.lang) + '"' : '') +
          '>' + esc(code.lines.join('\n')) + '</code></pre>');
        code = null;
      } else {
        code.lines.push(raw);
      }
      return;
    }

    if (/^```/.test(line)) {
      flushAll();
      code = { lang: line.slice(3).trim(), lines: [] };
      return;
    }
    if (!line.trim()) { flushAll(); return; }

    const heading = line.match(/^(#{2,3})\s+(.*)$/);
    if (heading) {
      flushAll();
      const level = heading[1].length;
      out.push('<h' + level + ' id="' + headingId(heading[2], used) + '">' +
        inline(heading[2]) + '</h' + level + '>');
      return;
    }

    const quoted = line.match(/^>\s?(.*)$/);
    if (quoted) {
      flushPara(); flushList(); quote.push(quoted[1]); return;
    }

    const bullet = line.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      flushPara(); flushQuote();
      if (!list || list.tag !== 'ul') { flushList(); list = { tag: 'ul', items: [] }; }
      list.items.push(bullet[1]);
      return;
    }

    const numbered = line.match(/^\d+\.\s+(.*)$/);
    if (numbered) {
      flushPara(); flushQuote();
      if (!list || list.tag !== 'ol') { flushList(); list = { tag: 'ol', items: [] }; }
      list.items.push(numbered[1]);
      return;
    }

    if (/^---+$/.test(line)) { flushAll(); out.push('<hr>'); return; }

    if (list) flushList();
    if (quote.length) flushQuote();
    para.push(line.trim());
  });

  if (code) out.push('<pre><code>' + esc(code.lines.join('\n')) + '</code></pre>');
  flushAll();
  return out.join('\n');
}

module.exports = { esc: esc, renderMarkdown: renderMarkdown };
