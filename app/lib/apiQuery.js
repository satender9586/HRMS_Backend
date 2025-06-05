//------------------------------------->>> leaves queries

// ---------->> check leave already exista 
export const isLeaveExistsQuery = `SELECT * FROM leave_balance WHERE employee_id = ? AND leave_name = ?` 

// ---------->> already leave exists to update

export const updateExistsLeaveQuery = `UPDATE leave_balance SET total = ? , used = 0 WHERE employee_id = ? AND leave_name = ?`

// ---------->> insert new alloted leaves

export const insertAllotedLeaveQuery = 'INSERT INTO leave_balance (employee_id, leave_name, total) VALUES(?,?,?)'

// ---------->> insert new alloted leaves

export const  isPunchInExistsQuery = `SELECT * FROM attendence WHERE employee_id = ? AND DATE(punch_date) = ?`
// ---------->> insert new alloted leaves

export const checkUserExistsQuery = `SELECT * FROM employees WHERE employee_id = ?`

//---------->>  Check if leave already exists for selected range
export const leaveOverlapQuery = `
      SELECT * FROM employee_leaves
      WHERE employee_id = ?
        AND (
          (start_date BETWEEN ? AND ?)
          OR (end_date BETWEEN ? AND ?)
          OR (? BETWEEN start_date AND end_date)
          OR (? BETWEEN start_date AND end_date)
        )
    `;

//---------->>  Check if employee has any pending leave request
 export     const pendingLeaveQuery = `
        SELECT * FROM employee_leaves
        WHERE employee_id = ? AND status = 'pending'
      `;
//---------->>  Check if employee has any pending leave request
export const insertLeaveQuery = `
      INSERT INTO employee_leaves (employee_id, leave_type, start_date, end_date, reason)
      VALUES (?, ?, ?, ?, ?)
    `;
//---------->>  Check if employee has any pending leave request
