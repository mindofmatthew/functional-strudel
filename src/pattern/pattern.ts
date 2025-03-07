import { Time, Span, withSpanTime, spanCycles, wholeCycle } from "../time";
import { Hap, withSpan } from "../hap";

export type State = Readonly<{
  span: Span;
}>;

export interface Pattern<T> {
  query: (state: State) => Hap<T>[];
  steps: number;
}

export function splitQueries<T>(pat: Pattern<T>): Pattern<T> {
  return {
    ...pat,
    query: (state) => spanCycles(state.span).flatMap((span) => pat.query({ ...state, span })),
  };
}

// Transformations on the query
export function withQuerySpan<T>(f: (span: Span) => Span, pat: Pattern<T>): Pattern<T> {
  return {
    ...pat,
    query: (state) => pat.query({ ...state, span: f(state.span) }),
  };
}

export function withQueryTime<T>(f: (t: Time) => Time, pat: Pattern<T>): Pattern<T> {
  return withQuerySpan((span) => withSpanTime(f, span), pat);
}

// Transformations on the haps

export function withHap<T, U = T>(f: (hap: Hap<T>) => Hap<U>, pat: Pattern<T>): Pattern<U> {
  return {
    ...pat,
    query: (state) => pat.query(state).map((hap) => f(hap)),
  };
}

export function withHapSpan<T>(f: (span: Span) => Span, pat: Pattern<T>) {
  return withHap((hap) => withSpan(f, hap), pat);
}

export function withHapTime<T>(f: (time: Time) => Time, pat: Pattern<T>) {
  return withHapSpan((span) => withSpanTime(f, span), pat);
}

export function withValue<A, B = A>(f: (value: A) => B, pat: Pattern<A>): Pattern<B> {
  return withHap(
    (hap) => ({
      ...hap,
      value: f(hap.value),
    }),
    pat
  );
}

export function filterHaps<T>(f: (hap: Hap<T>) => boolean, pat: Pattern<T>): Pattern<T> {
  return {
    ...pat,
    query: (state) => pat.query(state).filter(f),
  };
}

export function filterValues<T>(f: (value: T) => boolean, pat: Pattern<T>): Pattern<T> {
  return filterHaps(({ value }) => f(value), pat);
}
