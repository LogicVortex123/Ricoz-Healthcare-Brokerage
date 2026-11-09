type Column<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => React.ReactNode;
};

export function Table<T>({ columns, rows, rowKey }: { columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-white">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-sand-100 text-muted">
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={`px-4 py-3 font-semibold ${column.className ?? ''}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-t border-line">
              {columns.map((column) => (
                <td key={column.key} className={`px-4 py-3 align-middle text-ink ${column.className ?? ''}`}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
