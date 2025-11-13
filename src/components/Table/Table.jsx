import { useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import { useMemo, useState, useRef, useEffect } from 'react';

export default function Table({
  data,
  columns,
  onRowClick,
  enableRowSelection = true,
  pageSizeOptions = [10, 20, 50],
  initialPageSize = 10,
}) {
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  });
  const [sorting, setSorting] = useState([]);

  // Add skip reset ref
  const skipPageResetRef = useRef(false);

  // Reset flag after data updates
  useEffect(() => {
    skipPageResetRef.current = false;
  }, [data]);

  const tableColumns = useMemo(
    () => [
      ...(enableRowSelection
        ? [
            {
              id: 'select',
              header: ({ table }) => (
                <input
                  type="checkbox"
                  checked={table.getIsAllRowsSelected()}
                  onChange={table.getToggleAllRowsSelectedHandler()}
                  className="cursor-pointer"
                />
              ),
              cell: ({ row }) => (
                <input
                  type="checkbox"
                  checked={row.getIsSelected()}
                  onChange={row.getToggleSelectedHandler()}
                  className="cursor-pointer"
                />
              ),
            },
          ]
        : []),
      ...columns,
    ],
    [columns, enableRowSelection]
  );

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting, rowSelection, pagination },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: !skipPageResetRef.current,
    autoResetExpanded: !skipPageResetRef.current,
    autoResetGrouping: !skipPageResetRef.current,
    autoResetSelectedRows: !skipPageResetRef.current,
    autoResetSortBy: !skipPageResetRef.current,
    autoResetFilters: !skipPageResetRef.current,
  });

  // Pagination controls
  const pageCount = table.getPageCount();
  const { pageIndex, pageSize } = table.getState().pagination;
  const startRow = pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, data.length);
  const totalRows = data.length;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full border-collapse">
            <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="bg-gray-100">
                        {headerGroup.headers.map((header) => (
                            <th
                                key={header.id}
                                className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-700"
                                onClick={header.column.getToggleSortingHandler()}
                            >
                                <div className="flex items-center space-x-1">
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                    <span className="text-gray-500">
                                        {{
                                            asc: '↑',
                                            desc: '↓',
                                        }[header.column.getIsSorted()] ?? '↕'}
                                    </span>
                                </div>
                            </th>
                        ))}
                    </tr>
                ))}
            </thead>
            <tbody className="bg-white text-sm text-gray-800">
                {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="transition hover:bg-gray-50"
                      onClick={(e) => {
                        
                        // Prevent row click when clicking on interactive elements (e.g., buttons, inputs)
                        if (
                          e.target.tagName === 'BUTTON' ||
                          e.target.tagName === 'INPUT' ||
                          e.target.closest('button') ||
                          e.target.closest('input')
                        ) {
                          return;
                        }
                       
                        if (onRowClick) {
                          onRowClick(e, row.original);
                        }
                      }}
                    >
                        {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="border border-gray-200 p-3 align-middle">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
        <div className="flex justify-end">
            <div className="flex items-center space-x-1 rounded border border-gray-200 bg-white p-2 text-sm">
                <button
                    onClick={() => table.setPageIndex(0)}
                    disabled={pageIndex === 0}
                    className="px-1 py-1 text-gray-600 disabled:opacity-50"
                    title="First Page"
                >
                    {'<<'}
                </button>
                <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="px-1 py-1 text-gray-600 disabled:opacity-50"
                    title="Previous Page"
                >
                    {'<'}
                </button>
                <span className="text-main">
                    {startRow}-{endRow} of {totalRows}
                </span>
                <select
                    value={pageIndex}
                    onChange={(e) => table.setPageIndex(Number(e.target.value))}
                    className="rounded border border-gray-300 px-1 py-1 text-main"
                >
                    {Array.from({ length: pageCount }, (_, i) => (
                        <option key={i} value={i}>
                            {i + 1}
                        </option>
                    ))}
                </select>
                <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="px-1 py-1 text-gray-600 disabled:opacity-50"
                    title="Next Page"
                >
                    {'>'}
                </button>
                <button
                    onClick={() => table.setPageIndex(pageCount - 1)}
                    disabled={pageIndex === pageCount - 1}
                    className="px-1 py-1 text-gray-600 disabled:opacity-50"
                    title="Last Page"
                >
                    {'>>'}
                </button>
                <select
                  value={pageSize}
                  onChange={(event) => table.setPageSize(Number(event.target.value))}
                  className="ml-2 rounded border border-gray-300 px-1 py-1 text-main"
                >
                  {pageSizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size} / page
                    </option>
                  ))}
                </select>
            </div>
        </div>
    </div>
  );
}