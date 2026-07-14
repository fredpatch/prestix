import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { partyApi, type Party } from "@/lib/party.api";

interface PartySelectProps {
  value: Party | null;
  onChange: (party: Party | null) => void;
  filterReferrer?: boolean;
  placeholder?: string;
}

export function PartySelect({ value, onChange, filterReferrer, placeholder }: PartySelectProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Party[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      partyApi
        .list({ search: query, active: true, isReferrer: filterReferrer || undefined })
        .then((res) => setResults(res.data.data));
    }, 200);
    return () => clearTimeout(timeout);
  }, [query, filterReferrer]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (value) {
    return (
      <div className="flex items-center justify-between bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2">
        <div>
          <p className="text-[12px] font-medium text-neutral-800">{value.fullName}</p>
          <p className="text-[10.5px] text-neutral-500">{value.phone ?? value.email ?? "—"}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-neutral-400 hover:text-red-500"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder ?? "Rechercher une partie..."}
          className="pl-8"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-md max-h-52 overflow-y-auto">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onChange(p);
                setOpen(false);
                setQuery("");
              }}
              className="w-full text-left px-3 py-2 hover:bg-neutral-50 text-[12px]"
            >
              <span className="font-medium text-neutral-800">{p.fullName}</span>
              <span className="text-neutral-500 ml-2">{p.phone ?? p.email ?? ""}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
