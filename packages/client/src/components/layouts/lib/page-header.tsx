import { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface PageHeaderConfig {
  title: string;
  backTo?: string;
  badge?: string;
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
  const { title, backTo, badge } = config;
  const stableSetHeader = useCallback(setHeader, [setHeader]);

  useEffect(() => {
    stableSetHeader({ title, backTo, badge });
    return () => stableSetHeader(null);
  }, [title, backTo, badge, stableSetHeader]);
}
