import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';

interface EntityListPageProps {
  title: string;
  description?: string;
  addLabel?: string;
  addRoute?: string;
  onAdd?: () => void;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  filters?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  children?: React.ReactNode;
  totalCount?: number;
  headerActions?: React.ReactNode;
  portalId?: string;
}

export default function EntityListPage({
  title,
  description,
  addLabel,
  addRoute,
  onAdd,
  searchValue = '',
  onSearchChange,
  filters,
  loading = false,
  error,
  children,
  totalCount,
  headerActions,
  portalId,
}: EntityListPageProps) {
  const navigate = useNavigate();

  const handleAdd = () => {
    if (onAdd) {
      onAdd();
      return;
    }
    if (addRoute) {
      navigate(addRoute);
    }
  };

  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (portalId) {
      setPortalNode(document.getElementById(portalId));
    }
  }, [portalId]);

  const headerContent = (
    <div className="flex justify-between items-start flex-wrap gap-2">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {headerActions}
        {addLabel && (
          <button
            className="inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 h-10 px-4 active:scale-95 transition-all cursor-pointer shadow-sm"
            onClick={handleAdd}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z" />
            </svg>
            {addLabel}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      {/* ── Page Header ── */}
      {portalNode ? createPortal(headerContent, portalNode) : headerContent}

      {/* ── Toolbar: Search + Filters ── */}
      <div className="flex items-center flex-wrap gap-2">
        <div className="flex items-center border border-input rounded-md bg-card px-3 h-9 gap-2 w-full min-w-[200px] max-w-[360px]">
          <svg className="text-muted-foreground flex-shrink-0" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zm-5.242 1.156a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z" />
          </svg>
          <input
            type="text"
            className="border-0 bg-transparent outline-none w-full text-sm placeholder:text-muted-foreground"
            placeholder={`Search ${title.toLowerCase()}...`}
            value={searchValue}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          />
        </div>

        {filters}

        {totalCount !== undefined && (
          <span className="ml-auto text-sm text-muted-foreground">
            {totalCount} record{totalCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 py-2 px-3 text-sm rounded-lg flex items-center gap-2" role="alert">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
            <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
          </svg>
          {error}
        </div>
      )}

      {/* ── Table Card ── */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <div className="text-sm text-muted-foreground">Loading {title.toLowerCase()}...</div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}




