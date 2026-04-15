import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { usePagination } from "../../hooks/usePagination";
import { useDebounce } from "../../hooks/useDebounce";
import EmptyState from "./EmptyState";
import LoadingSpinner from "./LoadingSpinner";

/**
 * Props:
 *   columns: Array<{ key: string, label: string, render?: (row) => ReactNode, className?: string }>
 *   data: Array<object>
 *   loading: boolean
 *   searchKeys: string[] — which fields to search across (e.g. ["fullName","email"])
 *   searchPlaceholder: string
 *   rowKey: string — unique key field (default "id")
 *   defaultRowsPerPage: number (default 10)
 *   toolbar: ReactNode — extra buttons/filters above table (optional)
 *   emptyMessage: string
 */
export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  searchKeys = [],
  searchPlaceholder = "Search...",
  rowKey = "id",
  defaultRowsPerPage = 10,
  toolbar,
  emptyMessage = "No records found",
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 250);

  // Client-side search/filter
  const filtered = debouncedSearch.trim()
    ? data.filter((row) =>
        searchKeys.some((key) =>
          String(row[key] ?? "")
            .toLowerCase()
            .includes(debouncedSearch.toLowerCase())
        )
      )
    : data;

  const {
    currentRows,
    currentPage,
    totalPages,
    totalRows,
    rowsPerPage,
    goToPage,
    nextPage,
    prevPage,
    setRowsPerPage,
    hasNext,
    hasPrev,
  } = usePagination(filtered, defaultRowsPerPage);

  const startRow = (currentPage - 1) * rowsPerPage + 1;
  const endRow = Math.min(currentPage * rowsPerPage, filtered.length);

  return (
    <div className="table-container">
      {/* Table toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-muted/40">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            className="
              w-full pl-9 pr-4 py-2 text-sm bg-surface border border-muted/60
              rounded-md focus:outline-none focus:ring-2 focus:ring-accent/40
              focus:border-accent placeholder:text-secondary
            "
          />
        </div>

        {/* Right side toolbar (filters, buttons) */}
        {toolbar && (
          <div className="flex items-center gap-2 flex-wrap">{toolbar}</div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface/70 border-b border-muted/40">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`
                    text-left px-4 py-3 text-xs font-semibold text-secondary
                    uppercase tracking-wider whitespace-nowrap
                    ${col.className ?? ""}
                  `}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-muted/30">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <LoadingSpinner size="md" text="Loading data..." />
                </td>
              </tr>
            ) : currentRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState message={emptyMessage} />
                </td>
              </tr>
            ) : (
              currentRows.map((row, rowIdx) => (
                <tr
                  key={row[rowKey] ?? rowIdx}
                  className="hover:bg-surface/50 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-gray-700 ${col.className ?? ""}`}
                    >
                      {col.render ? col.render(row) : row[col.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      {!loading && filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-muted/40 bg-surface/30">
          {/* Rows info + per-page */}
          <div className="flex items-center gap-3 text-xs text-secondary">
            <span>
              Showing {startRow}–{endRow} of {totalRows} results
            </span>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="border border-muted/60 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-accent/40"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>{n} / page</option>
              ))}
            </select>
          </div>

          {/* Page controls */}
          <div className="flex items-center gap-1">
            <PaginationBtn onClick={() => goToPage(1)} disabled={!hasPrev} title="First">
              <ChevronsLeft size={14} />
            </PaginationBtn>
            <PaginationBtn onClick={prevPage} disabled={!hasPrev} title="Previous">
              <ChevronLeft size={14} />
            </PaginationBtn>

            {/* Page number pills */}
            {getPageNumbers(currentPage, totalPages).map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="px-2 text-secondary text-xs">...</span>
              ) : (
                <PaginationBtn
                  key={p}
                  onClick={() => goToPage(p)}
                  active={p === currentPage}
                >
                  {p}
                </PaginationBtn>
              )
            )}

            <PaginationBtn onClick={nextPage} disabled={!hasNext} title="Next">
              <ChevronRight size={14} />
            </PaginationBtn>
            <PaginationBtn onClick={() => goToPage(totalPages)} disabled={!hasNext} title="Last">
              <ChevronsRight size={14} />
            </PaginationBtn>
          </div>
        </div>
      )}
    </div>
  );
}

// Small pagination button component
function PaginationBtn({ children, onClick, disabled, active, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        w-7 h-7 flex items-center justify-center rounded text-xs font-medium
        transition-colors
        ${active
          ? "bg-primary text-white"
          : disabled
          ? "text-muted cursor-not-allowed"
          : "text-secondary hover:bg-surface hover:text-primary"
        }
      `}
    >
      {children}
    </button>
  );
}

// Generates smart page number array: [1, 2, 3, "...", 10]
function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = [];
  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, "...", total);
  } else if (current >= total - 3) {
    pages.push(1, "...", total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, "...", current - 1, current, current + 1, "...", total);
  }
  return pages;
}