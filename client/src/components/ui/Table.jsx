import { RiInboxLine } from 'react-icons/ri';
import './ui.css';

const Table = ({ columns, data, keyField = 'id', onRowClick }) => {
  if (!data || data.length === 0) {
    return (
      <div className="table-empty-state">
        <span className="table-empty-state-icon" aria-hidden="true">
          <RiInboxLine />
        </span>
        <p>No data available yet</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} style={{ textAlign: col.align || 'left', width: col.width }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr 
              key={row[keyField]} 
              onClick={() => onRowClick && onRowClick(row)}
              className={onRowClick ? 'clickable-row' : ''}
            >
              {columns.map((col, idx) => (
                <td key={idx} style={{ textAlign: col.align || 'left' }}>
                  {col.cell ? col.cell(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
