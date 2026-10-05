import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

// Tabela simples com paginação no cliente.
// columns: [{ key, header, render?(row), align?, className? }]
export function DataTable({ columns, rows, rowKey = 'id', onRowClick, pageSize = 20, caption }) {
  const [page, setPage] = useState(0)
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const current = Math.min(page, totalPages - 1)
  const visible = rows.slice(current * pageSize, current * pageSize + pageSize)

  return (
    <div className="table-wrap">
      <div className="table-scroll">
        <table className="table">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} scope="col" className={col.align ? `align-${col.align}` : undefined}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr
                key={row[rowKey]}
                className={onRowClick ? 'is-clickable' : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} className={[col.align && `align-${col.align}`, col.className].filter(Boolean).join(' ') || undefined}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > pageSize && (
        <div className="table-footer">
          <span>
            {current * pageSize + 1}–{Math.min(rows.length, (current + 1) * pageSize)} de {rows.length}
          </span>
          <div className="table-footer__nav">
            <button type="button" className="btn btn-ghost btn-icon" onClick={() => setPage(current - 1)} disabled={current === 0} aria-label="Página anterior">
              <ChevronLeft size={16} />
            </button>
            <span>
              {current + 1} / {totalPages}
            </span>
            <button type="button" className="btn btn-ghost btn-icon" onClick={() => setPage(current + 1)} disabled={current >= totalPages - 1} aria-label="Próxima página">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
