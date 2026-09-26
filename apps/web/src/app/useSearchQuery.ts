import { useSearchParams } from "react-router";

/**
 * The dashboard search box is backed by the `?q=` query string rather than
 * component state, so a search is shareable and survives a page reload.
 */
export function useSearchQuery(): [string, (next: string) => void] {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";

  const setQuery = (next: string) => {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (next) p.set("q", next);
        else p.delete("q");
        return p;
      },
      { replace: true },
    );
  };

  return [query, setQuery];
}
