'use client';

import { useLayoutEffect } from 'react';

function inView(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return rect.bottom > 0 && rect.top < window.innerHeight;
}

export function ScrollEffects() {
  useLayoutEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const seen = new WeakSet<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.classList.toggle('is-inview', entry.isIntersecting);
        }
      },
      { threshold: 0 },
    );

    function watch(element: Element) {
      if (!(element instanceof HTMLElement) || seen.has(element) || !element.classList.contains('reveal')) return;
      seen.add(element);
      if (reduce) {
        element.classList.add('is-inview');
        return;
      }
      if (inView(element)) element.classList.add('is-inview');
      observer.observe(element);
    }

    function scan(root: ParentNode) {
      if (root instanceof Element) watch(root);
      root.querySelectorAll?.('.reveal').forEach(watch);
    }

    scan(document);
    document.documentElement.classList.add('reveal-ready');

    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) scan(node);
        });
      }
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
      document.documentElement.classList.remove('reveal-ready');
    };
  }, []);

  return null;
}
