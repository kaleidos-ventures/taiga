/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

/* PrismJS 1.29.0
https://prismjs.com/download.html#themes=prism-tomorrow&languages=markup+css+clike+javascript+c+csharp+cpp+diff+java+markup-templating+php+python+ruby+typescript */
var _self =
    'undefined' != typeof window
      ? window
      : 'undefined' != typeof WorkerGlobalScope &&
        self instanceof WorkerGlobalScope
      ? self
      : {},
  Prism = (function (e) {
    var n = /(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i,
      t = 0,
      r = {},
      a = {
        manual: e.Prism && e.Prism.manual,
        disableWorkerMessageHandler:
          e.Prism && e.Prism.disableWorkerMessageHandler,
        util: {
          encode: function e(n) {
            return n instanceof i
              ? new i(n.type, e(n.content), n.alias)
              : Array.isArray(n)
              ? n.map(e)
              : n
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/\u00a0/g, ' ');
          },
          type: function (e) {
            return Object.prototype.toString.call(e).slice(8, -1);
          },
          objId: function (e) {
            return (
              e.__id || Object.defineProperty(e, '__id', { value: ++t }), e.__id
            );
          },
          clone: function e(n, t) {
            var r, i;
            switch (((t = t || {}), a.util.type(n))) {
              case 'Object':
                if (((i = a.util.objId(n)), t[i])) return t[i];
                for (var l in ((r = {}), (t[i] = r), n))
                  n.hasOwnProperty(l) && (r[l] = e(n[l], t));
                return r;
              case 'Array':
                return (
                  (i = a.util.objId(n)),
                  t[i]
                    ? t[i]
                    : ((r = []),
                      (t[i] = r),
                      n.forEach(function (n, a) {
                        r[a] = e(n, t);
                      }),
                      r)
                );
              default:
                return n;
            }
          },
          getLanguage: function (e) {
            for (; e; ) {
              var t = n.exec(e.className);
              if (t) return t[1].toLowerCase();
              e = e.parentElement;
            }
            return 'none';
          },
          setLanguage: function (e, t) {
            (e.className = e.className.replace(RegExp(n, 'gi'), '')),
              e.classList.add('language-' + t);
          },
          currentScript: function () {
            if ('undefined' == typeof document) return null;
            if ('currentScript' in document) return document.currentScript;
            try {
              throw new Error();
            } catch (r) {
              var e = (/at [^(\r\n]*\((.*):[^:]+:[^:]+\)$/i.exec(r.stack) ||
                [])[1];
              if (e) {
                var n = document.getElementsByTagName('script');
                for (var t in n) if (n[t].src == e) return n[t];
              }
              return null;
            }
          },
          isActive: function (e, n, t) {
            for (var r = 'no-' + n; e; ) {
              var a = e.classList;
              if (a.contains(n)) return !0;
              if (a.contains(r)) return !1;
              e = e.parentElement;
            }
            return !!t;
          },
        },
        languages: {
          plain: r,
          plaintext: r,
          text: r,
          txt: r,
          extend: function (e, n) {
            var t = a.util.clone(a.languages[e]);
            for (var r in n) t[r] = n[r];
            return t;
          },
          insertBefore: function (e, n, t, r) {
            var i = (r = r || a.languages)[e],
              l = {};
            for (var o in i)
              if (i.hasOwnProperty(o)) {
                if (o == n)
                  for (var s in t) t.hasOwnProperty(s) && (l[s] = t[s]);
                t.hasOwnProperty(o) || (l[o] = i[o]);
              }
            var u = r[e];
            return (
              (r[e] = l),
              a.languages.DFS(a.languages, function (n, t) {
                t === u && n != e && (this[n] = l);
              }),
              l
            );
          },
          DFS: function e(n, t, r, i) {
            i = i || {};
            var l = a.util.objId;
            for (var o in n)
              if (n.hasOwnProperty(o)) {
                t.call(n, o, n[o], r || o);
                var s = n[o],
                  u = a.util.type(s);
                'Object' !== u || i[l(s)]
                  ? 'Array' !== u || i[l(s)] || ((i[l(s)] = !0), e(s, t, o, i))
                  : ((i[l(s)] = !0), e(s, t, null, i));
              }
          },
        },
        plugins: {},
        highlightAll: function (e, n) {
          a.highlightAllUnder(document, e, n);
        },
        highlightAllUnder: function (e, n, t) {
          var r = {
            callback: t,
            container: e,
            selector:
              'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code',
          };
          a.hooks.run('before-highlightall', r),
            (r.elements = Array.prototype.slice.apply(
              r.container.querySelectorAll(r.selector)
            )),
            a.hooks.run('before-all-elements-highlight', r);
          for (var i, l = 0; (i = r.elements[l++]); )
            a.highlightElement(i, !0 === n, r.callback);
        },
        highlightElement: function (n, t, r) {
          var i = a.util.getLanguage(n),
            l = a.languages[i];
          a.util.setLanguage(n, i);
          var o = n.parentElement;
          o && 'pre' === o.nodeName.toLowerCase() && a.util.setLanguage(o, i);
          var s = { element: n, language: i, grammar: l, code: n.textContent };
          function u(e) {
            (s.highlightedCode = e),
              a.hooks.run('before-insert', s),
              (s.element.innerHTML = s.highlightedCode),
              a.hooks.run('after-highlight', s),
              a.hooks.run('complete', s),
              r && r.call(s.element);
          }
          if (
            (a.hooks.run('before-sanity-check', s),
            (o = s.element.parentElement) &&
              'pre' === o.nodeName.toLowerCase() &&
              !o.hasAttribute('tabindex') &&
              o.setAttribute('tabindex', '0'),
            !s.code)
          )
            return a.hooks.run('complete', s), void (r && r.call(s.element));
          if ((a.hooks.run('before-highlight', s), s.grammar))
            if (t && e.Worker) {
              var c = new Worker(a.filename);
              (c.onmessage = function (e) {
                u(e.data);
              }),
                c.postMessage(
                  JSON.stringify({
                    language: s.language,
                    code: s.code,
                    immediateClose: !0,
                  })
                );
            } else u(a.highlight(s.code, s.grammar, s.language));
          else u(a.util.encode(s.code));
        },
        highlight: function (e, n, t) {
          var r = { code: e, grammar: n, language: t };
          if ((a.hooks.run('before-tokenize', r), !r.grammar))
            throw new Error(
              'The language "' + r.language + '" has no grammar.'
            );
          return (
            (r.tokens = a.tokenize(r.code, r.grammar)),
            a.hooks.run('after-tokenize', r),
            i.stringify(a.util.encode(r.tokens), r.language)
          );
        },
        tokenize: function (e, n) {
          var t = n.rest;
          if (t) {
            for (var r in t) n[r] = t[r];
            delete n.rest;
          }
          var a = new s();
          return (
            u(a, a.head, e),
            o(e, a, n, a.head, 0),
            (function (e) {
              for (var n = [], t = e.head.next; t !== e.tail; )
                n.push(t.value), (t = t.next);
              return n;
            })(a)
          );
        },
        hooks: {
          all: {},
          add: function (e, n) {
            var t = a.hooks.all;
            (t[e] = t[e] || []), t[e].push(n);
          },
          run: function (e, n) {
            var t = a.hooks.all[e];
            if (t && t.length) for (var r, i = 0; (r = t[i++]); ) r(n);
          },
        },
        Token: i,
      };
    function i(e, n, t, r) {
      (this.type = e),
        (this.content = n),
        (this.alias = t),
        (this.length = 0 | (r || '').length);
    }
    function l(e, n, t, r) {
      e.lastIndex = n;
      var a = e.exec(t);
      if (a && r && a[1]) {
        var i = a[1].length;
        (a.index += i), (a[0] = a[0].slice(i));
      }
      return a;
    }
    function o(e, n, t, r, s, g) {
      for (var f in t)
        if (t.hasOwnProperty(f) && t[f]) {
          var h = t[f];
          h = Array.isArray(h) ? h : [h];
          for (var d = 0; d < h.length; ++d) {
            if (g && g.cause == f + ',' + d) return;
            var v = h[d],
              p = v.inside,
              m = !!v.lookbehind,
              y = !!v.greedy,
              k = v.alias;
            if (y && !v.pattern.global) {
              var x = v.pattern.toString().match(/[imsuy]*$/)[0];
              v.pattern = RegExp(v.pattern.source, x + 'g');
            }
            for (
              var b = v.pattern || v, w = r.next, A = s;
              w !== n.tail && !(g && A >= g.reach);
              A += w.value.length, w = w.next
            ) {
              var E = w.value;
              if (n.length > e.length) return;
              if (!(E instanceof i)) {
                var P,
                  L = 1;
                if (y) {
                  if (!(P = l(b, A, e, m)) || P.index >= e.length) break;
                  var S = P.index,
                    O = P.index + P[0].length,
                    j = A;
                  for (j += w.value.length; S >= j; )
                    j += (w = w.next).value.length;
                  if (((A = j -= w.value.length), w.value instanceof i))
                    continue;
                  for (
                    var C = w;
                    C !== n.tail && (j < O || 'string' == typeof C.value);
                    C = C.next
                  )
                    L++, (j += C.value.length);
                  L--, (E = e.slice(A, j)), (P.index -= A);
                } else if (!(P = l(b, 0, E, m))) continue;
                S = P.index;
                var N = P[0],
                  _ = E.slice(0, S),
                  M = E.slice(S + N.length),
                  W = A + E.length;
                g && W > g.reach && (g.reach = W);
                var z = w.prev;
                if (
                  (_ && ((z = u(n, z, _)), (A += _.length)),
                  c(n, z, L),
                  (w = u(n, z, new i(f, p ? a.tokenize(N, p) : N, k, N))),
                  M && u(n, w, M),
                  L > 1)
                ) {
                  var I = { cause: f + ',' + d, reach: W };
                  o(e, n, t, w.prev, A, I),
                    g && I.reach > g.reach && (g.reach = I.reach);
                }
              }
            }
          }
        }
    }
    function s() {
      var e = { value: null, prev: null, next: null },
        n = { value: null, prev: e, next: null };
      (e.next = n), (this.head = e), (this.tail = n), (this.length = 0);
    }
    function u(e, n, t) {
      var r = n.next,
        a = { value: t, prev: n, next: r };
      return (n.next = a), (r.prev = a), e.length++, a;
    }
    function c(e, n, t) {
      for (var r = n.next, a = 0; a < t && r !== e.tail; a++) r = r.next;
      (n.next = r), (r.prev = n), (e.length -= a);
    }
    if (
      ((e.Prism = a),
      (i.stringify = function e(n, t) {
        if ('string' == typeof n) return n;
        if (Array.isArray(n)) {
          var r = '';
          return (
            n.forEach(function (n) {
              r += e(n, t);
            }),
            r
          );
        }
        var i = {
            type: n.type,
            content: e(n.content, t),
            tag: 'span',
            classes: ['token', n.type],
            attributes: {},
            language: t,
          },
          l = n.alias;
        l &&
          (Array.isArray(l)
            ? Array.prototype.push.apply(i.classes, l)
            : i.classes.push(l)),
          a.hooks.run('wrap', i);
        var o = '';
        for (var s in i.attributes)
          o +=
            ' ' +
            s +
            '="' +
            (i.attributes[s] || '').replace(/"/g, '&quot;') +
            '"';
        return (
          '<' +
          i.tag +
          ' class="' +
          i.classes.join(' ') +
          '"' +
          o +
          '>' +
          i.content +
          '</' +
          i.tag +
          '>'
        );
      }),
      !e.document)
    )
      return e.addEventListener
        ? (a.disableWorkerMessageHandler ||
            e.addEventListener(
              'message',
              function (n) {
                var t = JSON.parse(n.data),
                  r = t.language,
                  i = t.code,
                  l = t.immediateClose;
                e.postMessage(a.highlight(i, a.languages[r], r)),
                  l && e.close();
              },
              !1
            ),
          a)
        : a;
    var g = a.util.currentScript();
    function f() {
      a.manual || a.highlightAll();
    }
    if (
      (g &&
        ((a.filename = g.src),
        g.hasAttribute('data-manual') && (a.manual = !0)),
      !a.manual)
    ) {
      var h = document.readyState;
      'loading' === h || ('interactive' === h && g && g.defer)
        ? document.addEventListener('DOMContentLoaded', f)
        : window.requestAnimationFrame
        ? window.requestAnimationFrame(f)
        : window.setTimeout(f, 16);
    }
    return a;
  })(_self);
'undefined' != typeof module && module.exports && (module.exports = Prism),
  'undefined' != typeof global && (global.Prism = Prism);
(Prism.languages.markup = {
  comment: { pattern: /<!--(?:(?!<!--)[\s\S])*?-->/, greedy: !0 },
  prolog: { pattern: /<\?[\s\S]+?\?>/, greedy: !0 },
  doctype: {
    pattern:
      /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,
    greedy: !0,
    inside: {
      'internal-subset': {
        pattern: /(^[^\[]*\[)[\s\S]+(?=\]>$)/,
        lookbehind: !0,
        greedy: !0,
        inside: null,
      },
      string: { pattern: /"[^"]*"|'[^']*'/, greedy: !0 },
      punctuation: /^<!|>$|[[\]]/,
      'doctype-tag': /^DOCTYPE/i,
      name: /[^\s<>'"]+/,
    },
  },
  cdata: { pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i, greedy: !0 },
  tag: {
    pattern:
      /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,
    greedy: !0,
    inside: {
      tag: {
        pattern: /^<\/?[^\s>\/]+/,
        inside: { punctuation: /^<\/?/, namespace: /^[^\s>\/:]+:/ },
      },
      'special-attr': [],
      'attr-value': {
        pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
        inside: {
          punctuation: [
            { pattern: /^=/, alias: 'attr-equals' },
            { pattern: /^(\s*)["']|["']$/, lookbehind: !0 },
          ],
        },
      },
      punctuation: /\/?>/,
      'attr-name': {
        pattern: /[^\s>\/]+/,
        inside: { namespace: /^[^\s>\/:]+:/ },
      },
    },
  },
  entity: [
    { pattern: /&[\da-z]{1,8};/i, alias: 'named-entity' },
    /&#x?[\da-f]{1,8};/i,
  ],
}),
  (Prism.languages.markup.tag.inside['attr-value'].inside.entity =
    Prism.languages.markup.entity),
  (Prism.languages.markup.doctype.inside['internal-subset'].inside =
    Prism.languages.markup),
  Prism.hooks.add('wrap', function (a) {
    'entity' === a.type &&
      (a.attributes.title = a.content.replace(/&amp;/, '&'));
  }),
  Object.defineProperty(Prism.languages.markup.tag, 'addInlined', {
    value: function (a, e) {
      var s = {};
      (s['language-' + e] = {
        pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
        lookbehind: !0,
        inside: Prism.languages[e],
      }),
        (s.cdata = /^<!\[CDATA\[|\]\]>$/i);
      var t = {
        'included-cdata': { pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i, inside: s },
      };
      t['language-' + e] = { pattern: /[\s\S]+/, inside: Prism.languages[e] };
      var n = {};
      (n[a] = {
        pattern: RegExp(
          '(<__[^>]*>)(?:<!\\[CDATA\\[(?:[^\\]]|\\](?!\\]>))*\\]\\]>|(?!<!\\[CDATA\\[)[^])*?(?=</__>)'.replace(
            /__/g,
            function () {
              return a;
            }
          ),
          'i'
        ),
        lookbehind: !0,
        greedy: !0,
        inside: t,
      }),
        Prism.languages.insertBefore('markup', 'cdata', n);
    },
  }),
  Object.defineProperty(Prism.languages.markup.tag, 'addAttribute', {
    value: function (a, e) {
      Prism.languages.markup.tag.inside['special-attr'].push({
        pattern: RegExp(
          '(^|["\'\\s])(?:' +
            a +
            ')\\s*=\\s*(?:"[^"]*"|\'[^\']*\'|[^\\s\'">=]+(?=[\\s>]))',
          'i'
        ),
        lookbehind: !0,
        inside: {
          'attr-name': /^[^\s=]+/,
          'attr-value': {
            pattern: /=[\s\S]+/,
            inside: {
              value: {
                pattern: /(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/,
                lookbehind: !0,
                alias: [e, 'language-' + e],
                inside: Prism.languages[e],
              },
              punctuation: [{ pattern: /^=/, alias: 'attr-equals' }, /"|'/],
            },
          },
        },
      });
    },
  }),
  (Prism.languages.html = Prism.languages.markup),
  (Prism.languages.mathml = Prism.languages.markup),
  (Prism.languages.svg = Prism.languages.markup),
  (Prism.languages.xml = Prism.languages.extend('markup', {})),
  (Prism.languages.ssml = Prism.languages.xml),
  (Prism.languages.atom = Prism.languages.xml),
  (Prism.languages.rss = Prism.languages.xml);
!(function (s) {
  var e =
    /(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*')/;
  (s.languages.css = {
    comment: /\/\*[\s\S]*?\*\//,
    atrule: {
      pattern: RegExp(
        '@[\\w-](?:[^;{\\s"\']|\\s+(?!\\s)|' + e.source + ')*?(?:;|(?=\\s*\\{))'
      ),
      inside: {
        rule: /^@[\w-]+/,
        'selector-function-argument': {
          pattern:
            /(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/,
          lookbehind: !0,
          alias: 'selector',
        },
        keyword: {
          pattern: /(^|[^\w-])(?:and|not|only|or)(?![\w-])/,
          lookbehind: !0,
        },
      },
    },
    url: {
      pattern: RegExp(
        '\\burl\\((?:' + e.source + '|(?:[^\\\\\r\n()"\']|\\\\[^])*)\\)',
        'i'
      ),
      greedy: !0,
      inside: {
        function: /^url/i,
        punctuation: /^\(|\)$/,
        string: { pattern: RegExp('^' + e.source + '$'), alias: 'url' },
      },
    },
    selector: {
      pattern: RegExp(
        '(^|[{}\\s])[^{}\\s](?:[^{};"\'\\s]|\\s+(?![\\s{])|' +
          e.source +
          ')*(?=\\s*\\{)'
      ),
      lookbehind: !0,
    },
    string: { pattern: e, greedy: !0 },
    property: {
      pattern:
        /(^|[^-\w\xA0-\uFFFF])(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i,
      lookbehind: !0,
    },
    important: /!important\b/i,
    function: { pattern: /(^|[^-a-z0-9])[-a-z0-9]+(?=\()/i, lookbehind: !0 },
    punctuation: /[(){};:,]/,
  }),
    (s.languages.css.atrule.inside.rest = s.languages.css);
  var t = s.languages.markup;
  t && (t.tag.addInlined('style', 'css'), t.tag.addAttribute('style', 'css'));
})(Prism);
Prism.languages.clike = {
  comment: [
    { pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/, lookbehind: !0, greedy: !0 },
    { pattern: /(^|[^\\:])\/\/.*/, lookbehind: !0, greedy: !0 },
  ],
  string: {
    pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
    greedy: !0,
  },
  'class-name': {
    pattern:
      /(\b(?:class|extends|implements|instanceof|interface|new|trait)\s+|\bcatch\s+\()[\w.\\]+/i,
    lookbehind: !0,
    inside: { punctuation: /[.\\]/ },
  },
  keyword:
    /\b(?:break|catch|continue|do|else|finally|for|function|if|in|instanceof|new|null|return|throw|try|while)\b/,
  boolean: /\b(?:false|true)\b/,
  function: /\b\w+(?=\()/,
  number: /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
  operator: /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
  punctuation: /[{}[\];(),.:]/,
};
(Prism.languages.javascript = Prism.languages.extend('clike', {
  'class-name': [
    Prism.languages.clike['class-name'],
    {
      pattern:
        /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/,
      lookbehind: !0,
    },
  ],
  keyword: [
    { pattern: /((?:^|\})\s*)catch\b/, lookbehind: !0 },
    {
      pattern:
        /(^|[^.]|\.\.\.\s*)\b(?:as|assert(?=\s*\{)|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#\[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
      lookbehind: !0,
    },
  ],
  function:
    /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
  number: {
    pattern: RegExp(
      '(^|[^\\w$])(?:NaN|Infinity|0[bB][01]+(?:_[01]+)*n?|0[oO][0-7]+(?:_[0-7]+)*n?|0[xX][\\dA-Fa-f]+(?:_[\\dA-Fa-f]+)*n?|\\d+(?:_\\d+)*n|(?:\\d+(?:_\\d+)*(?:\\.(?:\\d+(?:_\\d+)*)?)?|\\.\\d+(?:_\\d+)*)(?:[Ee][+-]?\\d+(?:_\\d+)*)?)(?![\\w$])'
    ),
    lookbehind: !0,
  },
  operator:
    /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/,
})),
  (Prism.languages.javascript['class-name'][0].pattern =
    /(\b(?:class|extends|implements|instanceof|interface|new)\s+)[\w.\\]+/),
  Prism.languages.insertBefore('javascript', 'keyword', {
    regex: {
      pattern: RegExp(
        '((?:^|[^$\\w\\xA0-\\uFFFF."\'\\])\\s]|\\b(?:return|yield))\\s*)/(?:(?:\\[(?:[^\\]\\\\\r\n]|\\\\.)*\\]|\\\\.|[^/\\\\\\[\r\n])+/[dgimyus]{0,7}|(?:\\[(?:[^[\\]\\\\\r\n]|\\\\.|\\[(?:[^[\\]\\\\\r\n]|\\\\.|\\[(?:[^[\\]\\\\\r\n]|\\\\.)*\\])*\\])*\\]|\\\\.|[^/\\\\\\[\r\n])+/[dgimyus]{0,7}v[dgimyus]{0,7})(?=(?:\\s|/\\*(?:[^*]|\\*(?!/))*\\*/)*(?:$|[\r\n,.;:})\\]]|//))'
      ),
      lookbehind: !0,
      greedy: !0,
      inside: {
        'regex-source': {
          pattern: /^(\/)[\s\S]+(?=\/[a-z]*$)/,
          lookbehind: !0,
          alias: 'language-regex',
          inside: Prism.languages.regex,
        },
        'regex-delimiter': /^\/|\/$/,
        'regex-flags': /^[a-z]+$/,
      },
    },
    'function-variable': {
      pattern:
        /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/,
      alias: 'function',
    },
    parameter: [
      {
        pattern:
          /(function(?:\s+(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)?\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/,
        lookbehind: !0,
        inside: Prism.languages.javascript,
      },
      {
        pattern:
          /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i,
        lookbehind: !0,
        inside: Prism.languages.javascript,
      },
      {
        pattern:
          /(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/,
        lookbehind: !0,
        inside: Prism.languages.javascript,
      },
      {
        pattern:
          /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/,
        lookbehind: !0,
        inside: Prism.languages.javascript,
      },
    ],
    constant: /\b[A-Z](?:[A-Z_]|\dx?)*\b/,
  }),
  Prism.languages.insertBefore('javascript', 'string', {
    hashbang: { pattern: /^#!.*/, greedy: !0, alias: 'comment' },
    'template-string': {
      pattern:
        /`(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*`/,
      greedy: !0,
      inside: {
        'template-punctuation': { pattern: /^`|`$/, alias: 'string' },
        interpolation: {
          pattern:
            /((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/,
          lookbehind: !0,
          inside: {
            'interpolation-punctuation': {
              pattern: /^\$\{|\}$/,
              alias: 'punctuation',
            },
            rest: Prism.languages.javascript,
          },
        },
        string: /[\s\S]+/,
      },
    },
    'string-property': {
      pattern:
        /((?:^|[,{])[ \t]*)(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2(?=\s*:)/m,
      lookbehind: !0,
      greedy: !0,
      alias: 'property',
    },
  }),
  Prism.languages.insertBefore('javascript', 'operator', {
    'literal-property': {
      pattern:
        /((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m,
      lookbehind: !0,
      alias: 'property',
    },
  }),
  Prism.languages.markup &&
    (Prism.languages.markup.tag.addInlined('script', 'javascript'),
    Prism.languages.markup.tag.addAttribute(
      'on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)',
      'javascript'
    )),
  (Prism.languages.js = Prism.languages.javascript);
(Prism.languages.c = Prism.languages.extend('clike', {
  comment: {
    pattern:
      /\/\/(?:[^\r\n\\]|\\(?:\r\n?|\n|(?![\r\n])))*|\/\*[\s\S]*?(?:\*\/|$)/,
    greedy: !0,
  },
  string: { pattern: /"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"/, greedy: !0 },
  'class-name': {
    pattern:
      /(\b(?:enum|struct)\s+(?:__attribute__\s*\(\([\s\S]*?\)\)\s*)?)\w+|\b[a-z]\w*_t\b/,
    lookbehind: !0,
  },
  keyword:
    /\b(?:_Alignas|_Alignof|_Atomic|_Bool|_Complex|_Generic|_Imaginary|_Noreturn|_Static_assert|_Thread_local|__attribute__|asm|auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|inline|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|typeof|union|unsigned|void|volatile|while)\b/,
  function: /\b[a-z_]\w*(?=\s*\()/i,
  number:
    /(?:\b0x(?:[\da-f]+(?:\.[\da-f]*)?|\.[\da-f]+)(?:p[+-]?\d+)?|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?)[ful]{0,4}/i,
  operator: />>=?|<<=?|->|([-+&|:])\1|[?:~]|[-+*/%&|^!=<>]=?/,
})),
  Prism.languages.insertBefore('c', 'string', {
    char: { pattern: /'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n]){0,32}'/, greedy: !0 },
  }),
  Prism.languages.insertBefore('c', 'string', {
    macro: {
      pattern:
        /(^[\t ]*)#\s*[a-z](?:[^\r\n\\/]|\/(?!\*)|\/\*(?:[^*]|\*(?!\/))*\*\/|\\(?:\r\n|[\s\S]))*/im,
      lookbehind: !0,
      greedy: !0,
      alias: 'property',
      inside: {
        string: [
          { pattern: /^(#\s*include\s*)<[^>]+>/, lookbehind: !0 },
          Prism.languages.c.string,
        ],
        char: Prism.languages.c.char,
        comment: Prism.languages.c.comment,
        'macro-name': [
          { pattern: /(^#\s*define\s+)\w+\b(?!\()/i, lookbehind: !0 },
          {
            pattern: /(^#\s*define\s+)\w+\b(?=\()/i,
            lookbehind: !0,
            alias: 'function',
          },
        ],
        directive: {
          pattern: /^(#\s*)[a-z]+/,
          lookbehind: !0,
          alias: 'keyword',
        },
        'directive-hash': /^#/,
        punctuation: /##|\\(?=[\r\n])/,
        expression: { pattern: /\S[\s\S]*/, inside: Prism.languages.c },
      },
    },
  }),
  Prism.languages.insertBefore('c', 'function', {
    constant:
      /\b(?:EOF|NULL|SEEK_CUR|SEEK_END|SEEK_SET|__DATE__|__FILE__|__LINE__|__TIMESTAMP__|__TIME__|__func__|stderr|stdin|stdout)\b/,
  }),
  delete Prism.languages.c.boolean;
!(function (e) {
  function n(e, n) {
    return e.replace(/<<(\d+)>>/g, function (e, s) {
      return '(?:' + n[+s] + ')';
    });
  }
  function s(e, s, a) {
    return RegExp(n(e, s), a || '');
  }
  function a(e, n) {
    for (var s = 0; s < n; s++)
      e = e.replace(/<<self>>/g, function () {
        return '(?:' + e + ')';
      });
    return e.replace(/<<self>>/g, '[^\\s\\S]');
  }
  var t =
      'bool byte char decimal double dynamic float int long object sbyte short string uint ulong ushort var void',
    r = 'class enum interface record struct',
    i =
      'add alias and ascending async await by descending from(?=\\s*(?:\\w|$)) get global group into init(?=\\s*;) join let nameof not notnull on or orderby partial remove select set unmanaged value when where with(?=\\s*{)',
    o =
      'abstract as base break case catch checked const continue default delegate do else event explicit extern finally fixed for foreach goto if implicit in internal is lock namespace new null operator out override params private protected public readonly ref return sealed sizeof stackalloc static switch this throw try typeof unchecked unsafe using virtual volatile while yield';
  function l(e) {
    return '\\b(?:' + e.trim().replace(/ /g, '|') + ')\\b';
  }
  var d = l(r),
    p = RegExp(l(t + ' ' + r + ' ' + i + ' ' + o)),
    c = l(r + ' ' + i + ' ' + o),
    u = l(t + ' ' + r + ' ' + o),
    g = a('<(?:[^<>;=+\\-*/%&|^]|<<self>>)*>', 2),
    b = a('\\((?:[^()]|<<self>>)*\\)', 2),
    h = '@?\\b[A-Za-z_]\\w*\\b',
    f = n('<<0>>(?:\\s*<<1>>)?', [h, g]),
    m = n('(?!<<0>>)<<1>>(?:\\s*\\.\\s*<<1>>)*', [c, f]),
    k = '\\[\\s*(?:,\\s*)*\\]',
    y = n('<<0>>(?:\\s*(?:\\?\\s*)?<<1>>)*(?:\\s*\\?)?', [m, k]),
    w = n('[^,()<>[\\];=+\\-*/%&|^]|<<0>>|<<1>>|<<2>>', [g, b, k]),
    v = n('\\(<<0>>+(?:,<<0>>+)+\\)', [w]),
    x = n('(?:<<0>>|<<1>>)(?:\\s*(?:\\?\\s*)?<<2>>)*(?:\\s*\\?)?', [v, m, k]),
    $ = { keyword: p, punctuation: /[<>()?,.:[\]]/ },
    _ = "'(?:[^\r\n'\\\\]|\\\\.|\\\\[Uux][\\da-fA-F]{1,8})'",
    B = '"(?:\\\\.|[^\\\\"\r\n])*"';
  (e.languages.csharp = e.languages.extend('clike', {
    string: [
      {
        pattern: s('(^|[^$\\\\])<<0>>', ['@"(?:""|\\\\[^]|[^\\\\"])*"(?!")']),
        lookbehind: !0,
        greedy: !0,
      },
      { pattern: s('(^|[^@$\\\\])<<0>>', [B]), lookbehind: !0, greedy: !0 },
    ],
    'class-name': [
      {
        pattern: s('(\\busing\\s+static\\s+)<<0>>(?=\\s*;)', [m]),
        lookbehind: !0,
        inside: $,
      },
      {
        pattern: s('(\\busing\\s+<<0>>\\s*=\\s*)<<1>>(?=\\s*;)', [h, x]),
        lookbehind: !0,
        inside: $,
      },
      { pattern: s('(\\busing\\s+)<<0>>(?=\\s*=)', [h]), lookbehind: !0 },
      { pattern: s('(\\b<<0>>\\s+)<<1>>', [d, f]), lookbehind: !0, inside: $ },
      {
        pattern: s('(\\bcatch\\s*\\(\\s*)<<0>>', [m]),
        lookbehind: !0,
        inside: $,
      },
      { pattern: s('(\\bwhere\\s+)<<0>>', [h]), lookbehind: !0 },
      {
        pattern: s('(\\b(?:is(?:\\s+not)?|as)\\s+)<<0>>', [y]),
        lookbehind: !0,
        inside: $,
      },
      {
        pattern: s(
          '\\b<<0>>(?=\\s+(?!<<1>>|with\\s*\\{)<<2>>(?:\\s*[=,;:{)\\]]|\\s+(?:in|when)\\b))',
          [x, u, h]
        ),
        inside: $,
      },
    ],
    keyword: p,
    number:
      /(?:\b0(?:x[\da-f_]*[\da-f]|b[01_]*[01])|(?:\B\.\d+(?:_+\d+)*|\b\d+(?:_+\d+)*(?:\.\d+(?:_+\d+)*)?)(?:e[-+]?\d+(?:_+\d+)*)?)(?:[dflmu]|lu|ul)?\b/i,
    operator: />>=?|<<=?|[-=]>|([-+&|])\1|~|\?\?=?|[-+*/%&|^!=<>]=?/,
    punctuation: /\?\.?|::|[{}[\];(),.:]/,
  })),
    e.languages.insertBefore('csharp', 'number', {
      range: { pattern: /\.\./, alias: 'operator' },
    }),
    e.languages.insertBefore('csharp', 'punctuation', {
      'named-parameter': {
        pattern: s('([(,]\\s*)<<0>>(?=\\s*:)', [h]),
        lookbehind: !0,
        alias: 'punctuation',
      },
    }),
    e.languages.insertBefore('csharp', 'class-name', {
      namespace: {
        pattern: s(
          '(\\b(?:namespace|using)\\s+)<<0>>(?:\\s*\\.\\s*<<0>>)*(?=\\s*[;{])',
          [h]
        ),
        lookbehind: !0,
        inside: { punctuation: /\./ },
      },
      'type-expression': {
        pattern: s(
          '(\\b(?:default|sizeof|typeof)\\s*\\(\\s*(?!\\s))(?:[^()\\s]|\\s(?!\\s)|<<0>>)*(?=\\s*\\))',
          [b]
        ),
        lookbehind: !0,
        alias: 'class-name',
        inside: $,
      },
      'return-type': {
        pattern: s(
          '<<0>>(?=\\s+(?:<<1>>\\s*(?:=>|[({]|\\.\\s*this\\s*\\[)|this\\s*\\[))',
          [x, m]
        ),
        inside: $,
        alias: 'class-name',
      },
      'constructor-invocation': {
        pattern: s('(\\bnew\\s+)<<0>>(?=\\s*[[({])', [x]),
        lookbehind: !0,
        inside: $,
        alias: 'class-name',
      },
      'generic-method': {
        pattern: s('<<0>>\\s*<<1>>(?=\\s*\\()', [h, g]),
        inside: {
          function: s('^<<0>>', [h]),
          generic: { pattern: RegExp(g), alias: 'class-name', inside: $ },
        },
      },
      'type-list': {
        pattern: s(
          '\\b((?:<<0>>\\s+<<1>>|record\\s+<<1>>\\s*<<5>>|where\\s+<<2>>)\\s*:\\s*)(?:<<3>>|<<4>>|<<1>>\\s*<<5>>|<<6>>)(?:\\s*,\\s*(?:<<3>>|<<4>>|<<6>>))*(?=\\s*(?:where|[{;]|=>|$))',
          [d, f, h, x, p.source, b, '\\bnew\\s*\\(\\s*\\)']
        ),
        lookbehind: !0,
        inside: {
          'record-arguments': {
            pattern: s('(^(?!new\\s*\\()<<0>>\\s*)<<1>>', [f, b]),
            lookbehind: !0,
            greedy: !0,
            inside: e.languages.csharp,
          },
          keyword: p,
          'class-name': { pattern: RegExp(x), greedy: !0, inside: $ },
          punctuation: /[,()]/,
        },
      },
      preprocessor: {
        pattern: /(^[\t ]*)#.*/m,
        lookbehind: !0,
        alias: 'property',
        inside: {
          directive: {
            pattern:
              /(#)\b(?:define|elif|else|endif|endregion|error|if|line|nullable|pragma|region|undef|warning)\b/,
            lookbehind: !0,
            alias: 'keyword',
          },
        },
      },
    });
  var E = B + '|' + _,
    R = n('/(?![*/])|//[^\r\n]*[\r\n]|/\\*(?:[^*]|\\*(?!/))*\\*/|<<0>>', [E]),
    z = a(n('[^"\'/()]|<<0>>|\\(<<self>>*\\)', [R]), 2),
    S =
      '\\b(?:assembly|event|field|method|module|param|property|return|type)\\b',
    j = n('<<0>>(?:\\s*\\(<<1>>*\\))?', [m, z]);
  e.languages.insertBefore('csharp', 'class-name', {
    attribute: {
      pattern: s(
        '((?:^|[^\\s\\w>)?])\\s*\\[\\s*)(?:<<0>>\\s*:\\s*)?<<1>>(?:\\s*,\\s*<<1>>)*(?=\\s*\\])',
        [S, j]
      ),
      lookbehind: !0,
      greedy: !0,
      inside: {
        target: { pattern: s('^<<0>>(?=\\s*:)', [S]), alias: 'keyword' },
        'attribute-arguments': {
          pattern: s('\\(<<0>>*\\)', [z]),
          inside: e.languages.csharp,
        },
        'class-name': { pattern: RegExp(m), inside: { punctuation: /\./ } },
        punctuation: /[:,]/,
      },
    },
  });
  var A = ':[^}\r\n]+',
    F = a(n('[^"\'/()]|<<0>>|\\(<<self>>*\\)', [R]), 2),
    P = n('\\{(?!\\{)(?:(?![}:])<<0>>)*<<1>>?\\}', [F, A]),
    U = a(
      n('[^"\'/()]|/(?!\\*)|/\\*(?:[^*]|\\*(?!/))*\\*/|<<0>>|\\(<<self>>*\\)', [
        E,
      ]),
      2
    ),
    Z = n('\\{(?!\\{)(?:(?![}:])<<0>>)*<<1>>?\\}', [U, A]);
  function q(n, a) {
    return {
      interpolation: {
        pattern: s('((?:^|[^{])(?:\\{\\{)*)<<0>>', [n]),
        lookbehind: !0,
        inside: {
          'format-string': {
            pattern: s('(^\\{(?:(?![}:])<<0>>)*)<<1>>(?=\\}$)', [a, A]),
            lookbehind: !0,
            inside: { punctuation: /^:/ },
          },
          punctuation: /^\{|\}$/,
          expression: {
            pattern: /[\s\S]+/,
            alias: 'language-csharp',
            inside: e.languages.csharp,
          },
        },
      },
      string: /[\s\S]+/,
    };
  }
  e.languages.insertBefore('csharp', 'string', {
    'interpolation-string': [
      {
        pattern: s(
          '(^|[^\\\\])(?:\\$@|@\\$)"(?:""|\\\\[^]|\\{\\{|<<0>>|[^\\\\{"])*"',
          [P]
        ),
        lookbehind: !0,
        greedy: !0,
        inside: q(P, F),
      },
      {
        pattern: s('(^|[^@\\\\])\\$"(?:\\\\.|\\{\\{|<<0>>|[^\\\\"{])*"', [Z]),
        lookbehind: !0,
        greedy: !0,
        inside: q(Z, U),
      },
    ],
    char: { pattern: RegExp(_), greedy: !0 },
  }),
    (e.languages.dotnet = e.languages.cs = e.languages.csharp);
})(Prism);
!(function (e) {
  var t =
      /\b(?:alignas|alignof|asm|auto|bool|break|case|catch|char|char16_t|char32_t|char8_t|class|co_await|co_return|co_yield|compl|concept|const|const_cast|consteval|constexpr|constinit|continue|decltype|default|delete|do|double|dynamic_cast|else|enum|explicit|export|extern|final|float|for|friend|goto|if|import|inline|int|int16_t|int32_t|int64_t|int8_t|long|module|mutable|namespace|new|noexcept|nullptr|operator|override|private|protected|public|register|reinterpret_cast|requires|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|template|this|thread_local|throw|try|typedef|typeid|typename|uint16_t|uint32_t|uint64_t|uint8_t|union|unsigned|using|virtual|void|volatile|wchar_t|while)\b/,
    n = '\\b(?!<keyword>)\\w+(?:\\s*\\.\\s*\\w+)*\\b'.replace(
      /<keyword>/g,
      function () {
        return t.source;
      }
    );
  (e.languages.cpp = e.languages.extend('c', {
    'class-name': [
      {
        pattern: RegExp(
          '(\\b(?:class|concept|enum|struct|typename)\\s+)(?!<keyword>)\\w+'.replace(
            /<keyword>/g,
            function () {
              return t.source;
            }
          )
        ),
        lookbehind: !0,
      },
      /\b[A-Z]\w*(?=\s*::\s*\w+\s*\()/,
      /\b[A-Z_]\w*(?=\s*::\s*~\w+\s*\()/i,
      /\b\w+(?=\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>\s*::\s*\w+\s*\()/,
    ],
    keyword: t,
    number: {
      pattern:
        /(?:\b0b[01']+|\b0x(?:[\da-f']+(?:\.[\da-f']*)?|\.[\da-f']+)(?:p[+-]?[\d']+)?|(?:\b[\d']+(?:\.[\d']*)?|\B\.[\d']+)(?:e[+-]?[\d']+)?)[ful]{0,4}/i,
      greedy: !0,
    },
    operator:
      />>=?|<<=?|->|--|\+\+|&&|\|\||[?:~]|<=>|[-+*/%&|^!=<>]=?|\b(?:and|and_eq|bitand|bitor|not|not_eq|or|or_eq|xor|xor_eq)\b/,
    boolean: /\b(?:false|true)\b/,
  })),
    e.languages.insertBefore('cpp', 'string', {
      module: {
        pattern: RegExp(
          '(\\b(?:import|module)\\s+)(?:"(?:\\\\(?:\r\n|[^])|[^"\\\\\r\n])*"|<[^<>\r\n]*>|' +
            '<mod-name>(?:\\s*:\\s*<mod-name>)?|:\\s*<mod-name>'.replace(
              /<mod-name>/g,
              function () {
                return n;
              }
            ) +
            ')'
        ),
        lookbehind: !0,
        greedy: !0,
        inside: { string: /^[<"][\s\S]+/, operator: /:/, punctuation: /\./ },
      },
      'raw-string': {
        pattern: /R"([^()\\ ]{0,16})\([\s\S]*?\)\1"/,
        alias: 'string',
        greedy: !0,
      },
    }),
    e.languages.insertBefore('cpp', 'keyword', {
      'generic-function': {
        pattern: /\b(?!operator\b)[a-z_]\w*\s*<(?:[^<>]|<[^<>]*>)*>(?=\s*\()/i,
        inside: {
          function: /^\w+/,
          generic: {
            pattern: /<[\s\S]+/,
            alias: 'class-name',
            inside: e.languages.cpp,
          },
        },
      },
    }),
    e.languages.insertBefore('cpp', 'operator', {
      'double-colon': { pattern: /::/, alias: 'punctuation' },
    }),
    e.languages.insertBefore('cpp', 'class-name', {
      'base-clause': {
        pattern:
          /(\b(?:class|struct)\s+\w+\s*:\s*)[^;{}"'\s]+(?:\s+[^;{}"'\s]+)*(?=\s*[;{])/,
        lookbehind: !0,
        greedy: !0,
        inside: e.languages.extend('cpp', {}),
      },
    }),
    e.languages.insertBefore(
      'inside',
      'double-colon',
      { 'class-name': /\b[a-z_]\w*\b(?!\s*::)/i },
      e.languages.cpp['base-clause']
    );
})(Prism);
!(function (e) {
  e.languages.diff = {
    coord: [/^(?:\*{3}|-{3}|\+{3}).*$/m, /^@@.*@@$/m, /^\d.*$/m],
  };
  var n = {
    'deleted-sign': '-',
    'deleted-arrow': '<',
    'inserted-sign': '+',
    'inserted-arrow': '>',
    unchanged: ' ',
    diff: '!',
  };
  Object.keys(n).forEach(function (a) {
    var i = n[a],
      r = [];
    /^\w+$/.test(a) || r.push(/\w+/.exec(a)[0]),
      'diff' === a && r.push('bold'),
      (e.languages.diff[a] = {
        pattern: RegExp('^(?:[' + i + '].*(?:\r\n?|\n|(?![\\s\\S])))+', 'm'),
        alias: r,
        inside: {
          line: { pattern: /(.)(?=[\s\S]).*(?:\r\n?|\n)?/, lookbehind: !0 },
          prefix: { pattern: /[\s\S]/, alias: /\w+/.exec(a)[0] },
        },
      });
  }),
    Object.defineProperty(e.languages.diff, 'PREFIXES', { value: n });
})(Prism);
!(function (e) {
  var n =
      /\b(?:abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|exports|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|module|native|new|non-sealed|null|open|opens|package|permits|private|protected|provides|public|record(?!\s*[(){}[\]<>=%~.:,;?+\-*/&|^])|requires|return|sealed|short|static|strictfp|super|switch|synchronized|this|throw|throws|to|transient|transitive|try|uses|var|void|volatile|while|with|yield)\b/,
    t = '(?:[a-z]\\w*\\s*\\.\\s*)*(?:[A-Z]\\w*\\s*\\.\\s*)*',
    s = {
      pattern: RegExp('(^|[^\\w.])' + t + '[A-Z](?:[\\d_A-Z]*[a-z]\\w*)?\\b'),
      lookbehind: !0,
      inside: {
        namespace: {
          pattern: /^[a-z]\w*(?:\s*\.\s*[a-z]\w*)*(?:\s*\.)?/,
          inside: { punctuation: /\./ },
        },
        punctuation: /\./,
      },
    };
  (e.languages.java = e.languages.extend('clike', {
    string: {
      pattern: /(^|[^\\])"(?:\\.|[^"\\\r\n])*"/,
      lookbehind: !0,
      greedy: !0,
    },
    'class-name': [
      s,
      {
        pattern: RegExp(
          '(^|[^\\w.])' +
            t +
            '[A-Z]\\w*(?=\\s+\\w+\\s*[;,=()]|\\s*(?:\\[[\\s,]*\\]\\s*)?::\\s*new\\b)'
        ),
        lookbehind: !0,
        inside: s.inside,
      },
      {
        pattern: RegExp(
          '(\\b(?:class|enum|extends|implements|instanceof|interface|new|record|throws)\\s+)' +
            t +
            '[A-Z]\\w*\\b'
        ),
        lookbehind: !0,
        inside: s.inside,
      },
    ],
    keyword: n,
    function: [
      e.languages.clike.function,
      { pattern: /(::\s*)[a-z_]\w*/, lookbehind: !0 },
    ],
    number:
      /\b0b[01][01_]*L?\b|\b0x(?:\.[\da-f_p+-]+|[\da-f_]+(?:\.[\da-f_p+-]+)?)\b|(?:\b\d[\d_]*(?:\.[\d_]*)?|\B\.\d[\d_]*)(?:e[+-]?\d[\d_]*)?[dfl]?/i,
    operator: {
      pattern:
        /(^|[^.])(?:<<=?|>>>?=?|->|--|\+\+|&&|\|\||::|[?:~]|[-+*/%&|^!=<>]=?)/m,
      lookbehind: !0,
    },
    constant: /\b[A-Z][A-Z_\d]+\b/,
  })),
    e.languages.insertBefore('java', 'string', {
      'triple-quoted-string': {
        pattern: /"""[ \t]*[\r\n](?:(?:"|"")?(?:\\.|[^"\\]))*"""/,
        greedy: !0,
        alias: 'string',
      },
      char: { pattern: /'(?:\\.|[^'\\\r\n]){1,6}'/, greedy: !0 },
    }),
    e.languages.insertBefore('java', 'class-name', {
      annotation: {
        pattern: /(^|[^.])@\w+(?:\s*\.\s*\w+)*/,
        lookbehind: !0,
        alias: 'punctuation',
      },
      generics: {
        pattern:
          /<(?:[\w\s,.?]|&(?!&)|<(?:[\w\s,.?]|&(?!&)|<(?:[\w\s,.?]|&(?!&)|<(?:[\w\s,.?]|&(?!&))*>)*>)*>)*>/,
        inside: {
          'class-name': s,
          keyword: n,
          punctuation: /[<>(),.:]/,
          operator: /[?&|]/,
        },
      },
      import: [
        {
          pattern: RegExp('(\\bimport\\s+)' + t + '(?:[A-Z]\\w*|\\*)(?=\\s*;)'),
          lookbehind: !0,
          inside: {
            namespace: s.inside.namespace,
            punctuation: /\./,
            operator: /\*/,
            'class-name': /\w+/,
          },
        },
        {
          pattern: RegExp(
            '(\\bimport\\s+static\\s+)' + t + '(?:\\w+|\\*)(?=\\s*;)'
          ),
          lookbehind: !0,
          alias: 'static',
          inside: {
            namespace: s.inside.namespace,
            static: /\b\w+$/,
            punctuation: /\./,
            operator: /\*/,
            'class-name': /\w+/,
          },
        },
      ],
      namespace: {
        pattern: RegExp(
          '(\\b(?:exports|import(?:\\s+static)?|module|open|opens|package|provides|requires|to|transitive|uses|with)\\s+)(?!<keyword>)[a-z]\\w*(?:\\.[a-z]\\w*)*\\.?'.replace(
            /<keyword>/g,
            function () {
              return n.source;
            }
          )
        ),
        lookbehind: !0,
        inside: { punctuation: /\./ },
      },
    });
})(Prism);
!(function (e) {
  function n(e, n) {
    return '___' + e.toUpperCase() + n + '___';
  }
  Object.defineProperties((e.languages['markup-templating'] = {}), {
    buildPlaceholders: {
      value: function (t, a, r, o) {
        if (t.language === a) {
          var c = (t.tokenStack = []);
          (t.code = t.code.replace(r, function (e) {
            if ('function' == typeof o && !o(e)) return e;
            for (var r, i = c.length; -1 !== t.code.indexOf((r = n(a, i))); )
              ++i;
            return (c[i] = e), r;
          })),
            (t.grammar = e.languages.markup);
        }
      },
    },
    tokenizePlaceholders: {
      value: function (t, a) {
        if (t.language === a && t.tokenStack) {
          t.grammar = e.languages[a];
          var r = 0,
            o = Object.keys(t.tokenStack);
          !(function c(i) {
            for (var u = 0; u < i.length && !(r >= o.length); u++) {
              var g = i[u];
              if (
                'string' == typeof g ||
                (g.content && 'string' == typeof g.content)
              ) {
                var l = o[r],
                  s = t.tokenStack[l],
                  f = 'string' == typeof g ? g : g.content,
                  p = n(a, l),
                  k = f.indexOf(p);
                if (k > -1) {
                  ++r;
                  var m = f.substring(0, k),
                    d = new e.Token(
                      a,
                      e.tokenize(s, t.grammar),
                      'language-' + a,
                      s
                    ),
                    h = f.substring(k + p.length),
                    v = [];
                  m && v.push.apply(v, c([m])),
                    v.push(d),
                    h && v.push.apply(v, c([h])),
                    'string' == typeof g
                      ? i.splice.apply(i, [u, 1].concat(v))
                      : (g.content = v);
                }
              } else g.content && c(g.content);
            }
            return i;
          })(t.tokens);
        }
      },
    },
  });
})(Prism);
!(function (e) {
  var a = /\/\*[\s\S]*?\*\/|\/\/.*|#(?!\[).*/,
    t = [
      { pattern: /\b(?:false|true)\b/i, alias: 'boolean' },
      { pattern: /(::\s*)\b[a-z_]\w*\b(?!\s*\()/i, greedy: !0, lookbehind: !0 },
      {
        pattern: /(\b(?:case|const)\s+)\b[a-z_]\w*(?=\s*[;=])/i,
        greedy: !0,
        lookbehind: !0,
      },
      /\b(?:null)\b/i,
      /\b[A-Z_][A-Z0-9_]*\b(?!\s*\()/,
    ],
    i =
      /\b0b[01]+(?:_[01]+)*\b|\b0o[0-7]+(?:_[0-7]+)*\b|\b0x[\da-f]+(?:_[\da-f]+)*\b|(?:\b\d+(?:_\d+)*\.?(?:\d+(?:_\d+)*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
    n =
      /<?=>|\?\?=?|\.{3}|\??->|[!=]=?=?|::|\*\*=?|--|\+\+|&&|\|\||<<|>>|[?~]|[/^|%*&<>.+-]=?/,
    s = /[{}\[\](),:;]/;
  e.languages.php = {
    delimiter: { pattern: /\?>$|^<\?(?:php(?=\s)|=)?/i, alias: 'important' },
    comment: a,
    variable: /\$+(?:\w+\b|(?=\{))/,
    package: {
      pattern:
        /(namespace\s+|use\s+(?:function\s+)?)(?:\\?\b[a-z_]\w*)+\b(?!\\)/i,
      lookbehind: !0,
      inside: { punctuation: /\\/ },
    },
    'class-name-definition': {
      pattern: /(\b(?:class|enum|interface|trait)\s+)\b[a-z_]\w*(?!\\)\b/i,
      lookbehind: !0,
      alias: 'class-name',
    },
    'function-definition': {
      pattern: /(\bfunction\s+)[a-z_]\w*(?=\s*\()/i,
      lookbehind: !0,
      alias: 'function',
    },
    keyword: [
      {
        pattern:
          /(\(\s*)\b(?:array|bool|boolean|float|int|integer|object|string)\b(?=\s*\))/i,
        alias: 'type-casting',
        greedy: !0,
        lookbehind: !0,
      },
      {
        pattern:
          /([(,?]\s*)\b(?:array(?!\s*\()|bool|callable|(?:false|null)(?=\s*\|)|float|int|iterable|mixed|object|self|static|string)\b(?=\s*\$)/i,
        alias: 'type-hint',
        greedy: !0,
        lookbehind: !0,
      },
      {
        pattern:
          /(\)\s*:\s*(?:\?\s*)?)\b(?:array(?!\s*\()|bool|callable|(?:false|null)(?=\s*\|)|float|int|iterable|mixed|never|object|self|static|string|void)\b/i,
        alias: 'return-type',
        greedy: !0,
        lookbehind: !0,
      },
      {
        pattern:
          /\b(?:array(?!\s*\()|bool|float|int|iterable|mixed|object|string|void)\b/i,
        alias: 'type-declaration',
        greedy: !0,
      },
      {
        pattern: /(\|\s*)(?:false|null)\b|\b(?:false|null)(?=\s*\|)/i,
        alias: 'type-declaration',
        greedy: !0,
        lookbehind: !0,
      },
      {
        pattern: /\b(?:parent|self|static)(?=\s*::)/i,
        alias: 'static-context',
        greedy: !0,
      },
      { pattern: /(\byield\s+)from\b/i, lookbehind: !0 },
      /\bclass\b/i,
      {
        pattern:
          /((?:^|[^\s>:]|(?:^|[^-])>|(?:^|[^:]):)\s*)\b(?:abstract|and|array|as|break|callable|case|catch|clone|const|continue|declare|default|die|do|echo|else|elseif|empty|enddeclare|endfor|endforeach|endif|endswitch|endwhile|enum|eval|exit|extends|final|finally|fn|for|foreach|function|global|goto|if|implements|include|include_once|instanceof|insteadof|interface|isset|list|match|namespace|never|new|or|parent|print|private|protected|public|readonly|require|require_once|return|self|static|switch|throw|trait|try|unset|use|var|while|xor|yield|__halt_compiler)\b/i,
        lookbehind: !0,
      },
    ],
    'argument-name': {
      pattern: /([(,]\s*)\b[a-z_]\w*(?=\s*:(?!:))/i,
      lookbehind: !0,
    },
    'class-name': [
      {
        pattern:
          /(\b(?:extends|implements|instanceof|new(?!\s+self|\s+static))\s+|\bcatch\s*\()\b[a-z_]\w*(?!\\)\b/i,
        greedy: !0,
        lookbehind: !0,
      },
      { pattern: /(\|\s*)\b[a-z_]\w*(?!\\)\b/i, greedy: !0, lookbehind: !0 },
      { pattern: /\b[a-z_]\w*(?!\\)\b(?=\s*\|)/i, greedy: !0 },
      {
        pattern: /(\|\s*)(?:\\?\b[a-z_]\w*)+\b/i,
        alias: 'class-name-fully-qualified',
        greedy: !0,
        lookbehind: !0,
        inside: { punctuation: /\\/ },
      },
      {
        pattern: /(?:\\?\b[a-z_]\w*)+\b(?=\s*\|)/i,
        alias: 'class-name-fully-qualified',
        greedy: !0,
        inside: { punctuation: /\\/ },
      },
      {
        pattern:
          /(\b(?:extends|implements|instanceof|new(?!\s+self\b|\s+static\b))\s+|\bcatch\s*\()(?:\\?\b[a-z_]\w*)+\b(?!\\)/i,
        alias: 'class-name-fully-qualified',
        greedy: !0,
        lookbehind: !0,
        inside: { punctuation: /\\/ },
      },
      {
        pattern: /\b[a-z_]\w*(?=\s*\$)/i,
        alias: 'type-declaration',
        greedy: !0,
      },
      {
        pattern: /(?:\\?\b[a-z_]\w*)+(?=\s*\$)/i,
        alias: ['class-name-fully-qualified', 'type-declaration'],
        greedy: !0,
        inside: { punctuation: /\\/ },
      },
      { pattern: /\b[a-z_]\w*(?=\s*::)/i, alias: 'static-context', greedy: !0 },
      {
        pattern: /(?:\\?\b[a-z_]\w*)+(?=\s*::)/i,
        alias: ['class-name-fully-qualified', 'static-context'],
        greedy: !0,
        inside: { punctuation: /\\/ },
      },
      {
        pattern: /([(,?]\s*)[a-z_]\w*(?=\s*\$)/i,
        alias: 'type-hint',
        greedy: !0,
        lookbehind: !0,
      },
      {
        pattern: /([(,?]\s*)(?:\\?\b[a-z_]\w*)+(?=\s*\$)/i,
        alias: ['class-name-fully-qualified', 'type-hint'],
        greedy: !0,
        lookbehind: !0,
        inside: { punctuation: /\\/ },
      },
      {
        pattern: /(\)\s*:\s*(?:\?\s*)?)\b[a-z_]\w*(?!\\)\b/i,
        alias: 'return-type',
        greedy: !0,
        lookbehind: !0,
      },
      {
        pattern: /(\)\s*:\s*(?:\?\s*)?)(?:\\?\b[a-z_]\w*)+\b(?!\\)/i,
        alias: ['class-name-fully-qualified', 'return-type'],
        greedy: !0,
        lookbehind: !0,
        inside: { punctuation: /\\/ },
      },
    ],
    constant: t,
    function: {
      pattern: /(^|[^\\\w])\\?[a-z_](?:[\w\\]*\w)?(?=\s*\()/i,
      lookbehind: !0,
      inside: { punctuation: /\\/ },
    },
    property: { pattern: /(->\s*)\w+/, lookbehind: !0 },
    number: i,
    operator: n,
    punctuation: s,
  };
  var l = {
      pattern:
        /\{\$(?:\{(?:\{[^{}]+\}|[^{}]+)\}|[^{}])+\}|(^|[^\\{])\$+(?:\w+(?:\[[^\r\n\[\]]+\]|->\w+)?)/,
      lookbehind: !0,
      inside: e.languages.php,
    },
    r = [
      {
        pattern: /<<<'([^']+)'[\r\n](?:.*[\r\n])*?\1;/,
        alias: 'nowdoc-string',
        greedy: !0,
        inside: {
          delimiter: {
            pattern: /^<<<'[^']+'|[a-z_]\w*;$/i,
            alias: 'symbol',
            inside: { punctuation: /^<<<'?|[';]$/ },
          },
        },
      },
      {
        pattern:
          /<<<(?:"([^"]+)"[\r\n](?:.*[\r\n])*?\1;|([a-z_]\w*)[\r\n](?:.*[\r\n])*?\2;)/i,
        alias: 'heredoc-string',
        greedy: !0,
        inside: {
          delimiter: {
            pattern: /^<<<(?:"[^"]+"|[a-z_]\w*)|[a-z_]\w*;$/i,
            alias: 'symbol',
            inside: { punctuation: /^<<<"?|[";]$/ },
          },
          interpolation: l,
        },
      },
      {
        pattern: /`(?:\\[\s\S]|[^\\`])*`/,
        alias: 'backtick-quoted-string',
        greedy: !0,
      },
      {
        pattern: /'(?:\\[\s\S]|[^\\'])*'/,
        alias: 'single-quoted-string',
        greedy: !0,
      },
      {
        pattern: /"(?:\\[\s\S]|[^\\"])*"/,
        alias: 'double-quoted-string',
        greedy: !0,
        inside: { interpolation: l },
      },
    ];
  e.languages.insertBefore('php', 'variable', {
    string: r,
    attribute: {
      pattern:
        /#\[(?:[^"'\/#]|\/(?![*/])|\/\/.*$|#(?!\[).*$|\/\*(?:[^*]|\*(?!\/))*\*\/|"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*')+\](?=\s*[a-z$#])/im,
      greedy: !0,
      inside: {
        'attribute-content': {
          pattern: /^(#\[)[\s\S]+(?=\]$)/,
          lookbehind: !0,
          inside: {
            comment: a,
            string: r,
            'attribute-class-name': [
              {
                pattern: /([^:]|^)\b[a-z_]\w*(?!\\)\b/i,
                alias: 'class-name',
                greedy: !0,
                lookbehind: !0,
              },
              {
                pattern: /([^:]|^)(?:\\?\b[a-z_]\w*)+/i,
                alias: ['class-name', 'class-name-fully-qualified'],
                greedy: !0,
                lookbehind: !0,
                inside: { punctuation: /\\/ },
              },
            ],
            constant: t,
            number: i,
            operator: n,
            punctuation: s,
          },
        },
        delimiter: { pattern: /^#\[|\]$/, alias: 'punctuation' },
      },
    },
  }),
    e.hooks.add('before-tokenize', function (a) {
      /<\?/.test(a.code) &&
        e.languages['markup-templating'].buildPlaceholders(
          a,
          'php',
          /<\?(?:[^"'/#]|\/(?![*/])|("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|(?:\/\/|#(?!\[))(?:[^?\n\r]|\?(?!>))*(?=$|\?>|[\r\n])|#\[|\/\*(?:[^*]|\*(?!\/))*(?:\*\/|$))*?(?:\?>|$)/g
        );
    }),
    e.hooks.add('after-tokenize', function (a) {
      e.languages['markup-templating'].tokenizePlaceholders(a, 'php');
    });
})(Prism);
(Prism.languages.python = {
  comment: { pattern: /(^|[^\\])#.*/, lookbehind: !0, greedy: !0 },
  'string-interpolation': {
    pattern:
      /(?:f|fr|rf)(?:("""|''')[\s\S]*?\1|("|')(?:\\.|(?!\2)[^\\\r\n])*\2)/i,
    greedy: !0,
    inside: {
      interpolation: {
        pattern:
          /((?:^|[^{])(?:\{\{)*)\{(?!\{)(?:[^{}]|\{(?!\{)(?:[^{}]|\{(?!\{)(?:[^{}])+\})+\})+\}/,
        lookbehind: !0,
        inside: {
          'format-spec': { pattern: /(:)[^:(){}]+(?=\}$)/, lookbehind: !0 },
          'conversion-option': {
            pattern: /![sra](?=[:}]$)/,
            alias: 'punctuation',
          },
          rest: null,
        },
      },
      string: /[\s\S]+/,
    },
  },
  'triple-quoted-string': {
    pattern: /(?:[rub]|br|rb)?("""|''')[\s\S]*?\1/i,
    greedy: !0,
    alias: 'string',
  },
  string: {
    pattern: /(?:[rub]|br|rb)?("|')(?:\\.|(?!\1)[^\\\r\n])*\1/i,
    greedy: !0,
  },
  function: {
    pattern: /((?:^|\s)def[ \t]+)[a-zA-Z_]\w*(?=\s*\()/g,
    lookbehind: !0,
  },
  'class-name': { pattern: /(\bclass\s+)\w+/i, lookbehind: !0 },
  decorator: {
    pattern: /(^[\t ]*)@\w+(?:\.\w+)*/m,
    lookbehind: !0,
    alias: ['annotation', 'punctuation'],
    inside: { punctuation: /\./ },
  },
  keyword:
    /\b(?:_(?=\s*:)|and|as|assert|async|await|break|case|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|match|nonlocal|not|or|pass|print|raise|return|try|while|with|yield)\b/,
  builtin:
    /\b(?:__import__|abs|all|any|apply|ascii|basestring|bin|bool|buffer|bytearray|bytes|callable|chr|classmethod|cmp|coerce|compile|complex|delattr|dict|dir|divmod|enumerate|eval|execfile|file|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|intern|isinstance|issubclass|iter|len|list|locals|long|map|max|memoryview|min|next|object|oct|open|ord|pow|property|range|raw_input|reduce|reload|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|unichr|unicode|vars|xrange|zip)\b/,
  boolean: /\b(?:False|None|True)\b/,
  number:
    /\b0(?:b(?:_?[01])+|o(?:_?[0-7])+|x(?:_?[a-f0-9])+)\b|(?:\b\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\B\.\d+(?:_\d+)*)(?:e[+-]?\d+(?:_\d+)*)?j?(?!\w)/i,
  operator: /[-+%=]=?|!=|:=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/,
  punctuation: /[{}[\];(),.:]/,
}),
  (Prism.languages.python[
    'string-interpolation'
  ].inside.interpolation.inside.rest = Prism.languages.python),
  (Prism.languages.py = Prism.languages.python);
!(function (e) {
  (e.languages.ruby = e.languages.extend('clike', {
    comment: { pattern: /#.*|^=begin\s[\s\S]*?^=end/m, greedy: !0 },
    'class-name': {
      pattern:
        /(\b(?:class|module)\s+|\bcatch\s+\()[\w.\\]+|\b[A-Z_]\w*(?=\s*\.\s*new\b)/,
      lookbehind: !0,
      inside: { punctuation: /[.\\]/ },
    },
    keyword:
      /\b(?:BEGIN|END|alias|and|begin|break|case|class|def|define_method|defined|do|each|else|elsif|end|ensure|extend|for|if|in|include|module|new|next|nil|not|or|prepend|private|protected|public|raise|redo|require|rescue|retry|return|self|super|then|throw|undef|unless|until|when|while|yield)\b/,
    operator:
      /\.{2,3}|&\.|===|<?=>|[!=]?~|(?:&&|\|\||<<|>>|\*\*|[+\-*/%<>!^&|=])=?|[?:]/,
    punctuation: /[(){}[\].,;]/,
  })),
    e.languages.insertBefore('ruby', 'operator', {
      'double-colon': { pattern: /::/, alias: 'punctuation' },
    });
  var n = {
    pattern: /((?:^|[^\\])(?:\\{2})*)#\{(?:[^{}]|\{[^{}]*\})*\}/,
    lookbehind: !0,
    inside: {
      content: {
        pattern: /^(#\{)[\s\S]+(?=\}$)/,
        lookbehind: !0,
        inside: e.languages.ruby,
      },
      delimiter: { pattern: /^#\{|\}$/, alias: 'punctuation' },
    },
  };
  delete e.languages.ruby.function;
  var t =
      '(?:' +
      [
        '([^a-zA-Z0-9\\s{(\\[<=])(?:(?!\\1)[^\\\\]|\\\\[^])*\\1',
        '\\((?:[^()\\\\]|\\\\[^]|\\((?:[^()\\\\]|\\\\[^])*\\))*\\)',
        '\\{(?:[^{}\\\\]|\\\\[^]|\\{(?:[^{}\\\\]|\\\\[^])*\\})*\\}',
        '\\[(?:[^\\[\\]\\\\]|\\\\[^]|\\[(?:[^\\[\\]\\\\]|\\\\[^])*\\])*\\]',
        '<(?:[^<>\\\\]|\\\\[^]|<(?:[^<>\\\\]|\\\\[^])*>)*>',
      ].join('|') +
      ')',
    i =
      '(?:"(?:\\\\.|[^"\\\\\r\n])*"|(?:\\b[a-zA-Z_]\\w*|[^\\s\0-\\x7F]+)[?!]?|\\$.)';
  e.languages.insertBefore('ruby', 'keyword', {
    'regex-literal': [
      {
        pattern: RegExp('%r' + t + '[egimnosux]{0,6}'),
        greedy: !0,
        inside: { interpolation: n, regex: /[\s\S]+/ },
      },
      {
        pattern:
          /(^|[^/])\/(?!\/)(?:\[[^\r\n\]]+\]|\\.|[^[/\\\r\n])+\/[egimnosux]{0,6}(?=\s*(?:$|[\r\n,.;})#]))/,
        lookbehind: !0,
        greedy: !0,
        inside: { interpolation: n, regex: /[\s\S]+/ },
      },
    ],
    variable: /[@$]+[a-zA-Z_]\w*(?:[?!]|\b)/,
    symbol: [
      { pattern: RegExp('(^|[^:]):' + i), lookbehind: !0, greedy: !0 },
      {
        pattern: RegExp('([\r\n{(,][ \t]*)' + i + '(?=:(?!:))'),
        lookbehind: !0,
        greedy: !0,
      },
    ],
    'method-definition': {
      pattern: /(\bdef\s+)\w+(?:\s*\.\s*\w+)?/,
      lookbehind: !0,
      inside: {
        function: /\b\w+$/,
        keyword: /^self\b/,
        'class-name': /^\w+/,
        punctuation: /\./,
      },
    },
  }),
    e.languages.insertBefore('ruby', 'string', {
      'string-literal': [
        {
          pattern: RegExp('%[qQiIwWs]?' + t),
          greedy: !0,
          inside: { interpolation: n, string: /[\s\S]+/ },
        },
        {
          pattern:
            /("|')(?:#\{[^}]+\}|#(?!\{)|\\(?:\r\n|[\s\S])|(?!\1)[^\\#\r\n])*\1/,
          greedy: !0,
          inside: { interpolation: n, string: /[\s\S]+/ },
        },
        {
          pattern: /<<[-~]?([a-z_]\w*)[\r\n](?:.*[\r\n])*?[\t ]*\1/i,
          alias: 'heredoc-string',
          greedy: !0,
          inside: {
            delimiter: {
              pattern: /^<<[-~]?[a-z_]\w*|\b[a-z_]\w*$/i,
              inside: { symbol: /\b\w+/, punctuation: /^<<[-~]?/ },
            },
            interpolation: n,
            string: /[\s\S]+/,
          },
        },
        {
          pattern: /<<[-~]?'([a-z_]\w*)'[\r\n](?:.*[\r\n])*?[\t ]*\1/i,
          alias: 'heredoc-string',
          greedy: !0,
          inside: {
            delimiter: {
              pattern: /^<<[-~]?'[a-z_]\w*'|\b[a-z_]\w*$/i,
              inside: { symbol: /\b\w+/, punctuation: /^<<[-~]?'|'$/ },
            },
            string: /[\s\S]+/,
          },
        },
      ],
      'command-literal': [
        {
          pattern: RegExp('%x' + t),
          greedy: !0,
          inside: {
            interpolation: n,
            command: { pattern: /[\s\S]+/, alias: 'string' },
          },
        },
        {
          pattern: /`(?:#\{[^}]+\}|#(?!\{)|\\(?:\r\n|[\s\S])|[^\\`#\r\n])*`/,
          greedy: !0,
          inside: {
            interpolation: n,
            command: { pattern: /[\s\S]+/, alias: 'string' },
          },
        },
      ],
    }),
    delete e.languages.ruby.string,
    e.languages.insertBefore('ruby', 'number', {
      builtin:
        /\b(?:Array|Bignum|Binding|Class|Continuation|Dir|Exception|FalseClass|File|Fixnum|Float|Hash|IO|Integer|MatchData|Method|Module|NilClass|Numeric|Object|Proc|Range|Regexp|Stat|String|Struct|Symbol|TMS|Thread|ThreadGroup|Time|TrueClass)\b/,
      constant: /\b[A-Z][A-Z0-9_]*(?:[?!]|\b)/,
    }),
    (e.languages.rb = e.languages.ruby);
})(Prism);
!(function (e) {
  (e.languages.typescript = e.languages.extend('javascript', {
    'class-name': {
      pattern:
        /(\b(?:class|extends|implements|instanceof|interface|new|type)\s+)(?!keyof\b)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?:\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)?/,
      lookbehind: !0,
      greedy: !0,
      inside: null,
    },
    builtin:
      /\b(?:Array|Function|Promise|any|boolean|console|never|number|string|symbol|unknown)\b/,
  })),
    e.languages.typescript.keyword.push(
      /\b(?:abstract|declare|is|keyof|readonly|require)\b/,
      /\b(?:asserts|infer|interface|module|namespace|type)\b(?=\s*(?:[{_$a-zA-Z\xA0-\uFFFF]|$))/,
      /\btype\b(?=\s*(?:[\{*]|$))/
    ),
    delete e.languages.typescript.parameter,
    delete e.languages.typescript['literal-property'];
  var s = e.languages.extend('typescript', {});
  delete s['class-name'],
    (e.languages.typescript['class-name'].inside = s),
    e.languages.insertBefore('typescript', 'function', {
      decorator: {
        pattern: /@[$\w\xA0-\uFFFF]+/,
        inside: {
          at: { pattern: /^@/, alias: 'operator' },
          function: /^[\s\S]+/,
        },
      },
      'generic-function': {
        pattern:
          /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>(?=\s*\()/,
        greedy: !0,
        inside: {
          function: /^#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*/,
          generic: { pattern: /<[\s\S]+/, alias: 'class-name', inside: s },
        },
      },
    }),
    (e.languages.ts = e.languages.typescript);
})(Prism);
