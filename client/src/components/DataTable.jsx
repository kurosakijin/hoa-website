function DataTable({ columns, rows }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-stone-900/70">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-white/5">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-xs uppercase tracking-[0.25em] text-stone-400"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((row, index) => (
              <tr key={row.id ?? index} className="text-sm text-stone-200">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-4 align-top">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
