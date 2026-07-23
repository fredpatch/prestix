import { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface PageGuide {
  steps: string[]; // short, concise — "what do I do on THIS page", not exhaustive reference
  tip?: string;
}

export interface PageHeaderConfig {
  title: string;
  backTo?: string;
  badge?: string;
  helpTopic?: string; // Aide slug (content/aide/index.ts) — drives the header "?" button
  guide?: PageGuide; // drives the floating "Besoin d'aide ?" popover trigger
}

interface PageHeaderContextType {
  header: PageHeaderConfig | null;
  setHeader: (config: PageHeaderConfig | null) => void;
}

const PageHeaderContext = createContext<PageHeaderContextType>({
  header: null,
  setHeader: () => {},
});

export function PageHeaderProvider({ children }: { children: React.ReactNode }) {
  const [header, setHeader] = useState<PageHeaderConfig | null>(null);
  return (
    <PageHeaderContext.Provider value={{ header, setHeader }}>
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeaderValue() {
  return useContext(PageHeaderContext).header;
}

export function usePageHeader(config: PageHeaderConfig) {
  const { setHeader } = useContext(PageHeaderContext);
  const { title, backTo, badge, helpTopic, guide } = config;
  const stableSetHeader = useCallback(setHeader, [setHeader]);

  useEffect(() => {
    stableSetHeader({ title, backTo, badge, helpTopic, guide });
    return () => stableSetHeader(null);
    // guide/steps and guide/tip are plain arrays/strings re-created on every
    // render at the call site (inline object literals) — depend on their
    // serialized form, not object identity, or this would loop forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, backTo, badge, helpTopic, JSON.stringify(guide), stableSetHeader]);
}
