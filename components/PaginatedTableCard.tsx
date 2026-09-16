"use client";

import { useState } from "react";

interface PaginatedTableCardProps<T> {
  title: string;
  items?: T[];
  pageSize?: number;
  headers: string[];
  renderRow: (item: T, index: number) => React.ReactNode;
}

export default function PaginatedTableCard<T>({
  title,
  items = [],
  pageSize = 10,
  headers,
  renderRow,
}: PaginatedTableCardProps<T>) {
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.ceil(items.length / pageSize);
  const startIndex = currentPage * pageSize;
  const currentItems = items.slice(startIndex, startIndex + pageSize);

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      {/* Header + Title & Controls */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
        <h3 className="serif text-xl font-bold text-[#1a1a1a]">{title}</h3>
        
        {/* Navigation Dots / Stepper */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-2">
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    currentPage === index
                      ? "w-6 bg-[#a92e27]"
                      : "w-2.5 bg-gray-200 hover:bg-gray-300"
                  }`}
                  aria-label={`Page ${index + 1}`}
                />
              ))}
            </div>

            {/* Prev / Next arrows */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="px-2 py-1 text-xs rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
            >
              ←
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className="px-2 py-1 text-xs rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* Table Content */}
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 py-4">Aucune donnée disponible.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#4a4741]">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
                {headers.map((header) => (
                  <th key={header} className="pb-3 font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentItems.map((item, index) => renderRow(item, startIndex + index))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}