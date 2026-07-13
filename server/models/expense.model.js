export const ExpenseModel = {
  create: `
    INSERT INTO expenses (
      category, amount, description, expense_date, 
      payment_type, reference_number, remarks, entity_type, entity_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *;
  `,
  
  findById: `
    SELECT * FROM expenses WHERE id = $1;
  `,

  update: `
    UPDATE expenses
    SET category = $1, amount = $2, description = $3, expense_date = $4,
        payment_type = $5, reference_number = $6, remarks = $7,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $8
    RETURNING *;
  `,

  delete: `
    DELETE FROM expenses WHERE id = $1 RETURNING *;
  `,

  deleteByEntity: `
    DELETE FROM expenses WHERE entity_type = $1 AND entity_id = $2;
  `,

  getMonthlySummary: `
    SELECT TO_CHAR(DATE_TRUNC('month', expense_date), 'YYYY-MM') AS month, SUM(amount) AS total 
    FROM expenses 
    GROUP BY DATE_TRUNC('month', expense_date)
    ORDER BY month DESC;
  `,

  getYearlySummary: `
    SELECT TO_CHAR(DATE_TRUNC('year', expense_date), 'YYYY') AS year, SUM(amount) AS total 
    FROM expenses 
    GROUP BY DATE_TRUNC('year', expense_date)
    ORDER BY year DESC;
  `
};
