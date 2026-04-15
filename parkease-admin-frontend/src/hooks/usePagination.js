import { useState, useMemo } from "react";

/**
 * Reusable pagination hook.
 * 
 * Usage:
 *   const { currentRows, currentPage, totalPages, 
 *           goToPage, nextPage, prevPage, setRowsPerPage, rowsPerPage } 
 *         = usePagination(filteredData, 10);
 */
export function usePagination(data = [], defaultRowsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPageState] = useState(defaultRowsPerPage);

  const totalPages = Math.max(1, Math.ceil(data.length / rowsPerPage));

  // Auto-reset to page 1 when data length changes (filter applied)
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const currentRows = useMemo(() => {
    const start = (safeCurrentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return data.slice(start, end);
  }, [data, safeCurrentPage, rowsPerPage]);

  const goToPage = (page) => {
    const clamped = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(clamped);
  };

  const nextPage = () => goToPage(safeCurrentPage + 1);
  const prevPage = () => goToPage(safeCurrentPage - 1);

  const setRowsPerPage = (val) => {
    setRowsPerPageState(val);
    setCurrentPage(1); // Reset to first page
  };

  return {
    currentRows,
    currentPage: safeCurrentPage,
    totalPages,
    totalRows: data.length,
    rowsPerPage,
    goToPage,
    nextPage,
    prevPage,
    setRowsPerPage,
    hasNext: safeCurrentPage < totalPages,
    hasPrev: safeCurrentPage > 1,
  };
}