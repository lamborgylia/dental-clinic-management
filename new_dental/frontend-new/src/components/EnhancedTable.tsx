import React from 'react';

interface Column {
  key: string;
  label: string;
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
  sortable?: boolean;
}

interface EnhancedTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: any) => void;
  actions?: (row: any) => React.ReactNode;
  className?: string;
}

const EnhancedTable: React.FC<EnhancedTableProps> = ({
  columns,
  data,
  loading = false,
  emptyMessage = 'Нет данных',
  onRowClick,
  actions,
  className = ''
}) => {
  // Проверяем, что data является массивом
  if (!Array.isArray(data)) {
    console.error('EnhancedTable: data должен быть массивом, получен:', typeof data, data);
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        textAlign: 'center',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ color: '#ef4444' }}>Ошибка: данные не являются массивом</div>
        <div style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Тип данных: {typeof data}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        textAlign: 'center',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #059669',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }} />
        <div style={{ color: '#6b7280' }}>Загрузка данных...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '3rem',
        textAlign: 'center',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
        <div style={{ color: '#6b7280', fontSize: '1.125rem' }}>{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb'
    }} className={className}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.875rem'
        }}>
          <thead>
            <tr style={{
              backgroundColor: '#f9fafb',
              borderBottom: '2px solid #e5e7eb'
            }}>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: column.width || 'auto',
                    borderRight: '1px solid #e5e7eb'
                  }}
                >
                  {column.label}
                </th>
              ))}
              {actions && (
                <th style={{
                  padding: '1rem',
                  textAlign: 'center',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  width: '120px'
                }}>
                  Действия
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={row.id || index}
                onClick={() => onRowClick?.(row)}
                style={{
                  borderBottom: '1px solid #f3f4f6',
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background-color 0.2s ease',
                  backgroundColor: index % 2 === 0 ? 'white' : '#fafafa'
                }}
                onMouseEnter={(e) => {
                  if (onRowClick) {
                    e.currentTarget.style.backgroundColor = '#f0f9ff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (onRowClick) {
                    e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#fafafa';
                  }
                }}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    style={{
                      padding: '1rem',
                      color: '#1f2937',
                      borderRight: '1px solid #f3f4f6',
                      verticalAlign: 'top'
                    }}
                  >
                    {column.render 
                      ? column.render(row[column.key], row)
                      : row[column.key] || '-'
                    }
                  </td>
                ))}
                {actions && (
                  <td style={{
                    padding: '1rem',
                    textAlign: 'center',
                    borderRight: 'none'
                  }}>
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EnhancedTable;
