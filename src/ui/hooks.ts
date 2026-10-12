import { useEffect, useRef, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => (typeof window === 'undefined' ? false : window.matchMedia(query).matches));
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);
  return matches;
}

export type Route = 'home' | 'privacy' | 'guides';

function routeFromHash(): { route: Route; anchor: string | null } {
  const raw = window.location.hash.replace(/^#/, '');
  const [path = '', anchor] = raw.split('#');
  if (path === '/privacy') return { route: 'privacy', anchor: anchor ?? null };
  if (path === '/guides') return { route: 'guides', anchor: anchor ?? null };
  return { route: 'home', anchor: null };
}

export function useRoute() {
  const [state, setState] = useState(routeFromHash);
  useEffect(() => {
    const on = () => setState(routeFromHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  useEffect(() => {
    if (state.anchor) document.getElementById(state.anchor)?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [state]);
  return state;
}

/** Rolls a number toward its target. Jumps straight there when motion is reduced. */
export function useCountUp(target: number, durationMs = 600): number {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || from.current === target) {
      from.current = target;
      setValue(target);
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(origin + (target - origin) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
      else from.current = target;
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      from.current = target;
    };
  }, [target, durationMs]);
  return value;
}

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef(0);
  const show = (text: string) => {
    setMessage(text);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(null), 2200);
  };
  return { message, show };
}
