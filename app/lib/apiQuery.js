
// ---------->> check leave already exista
export const isLeaveExistsQuery = `SELECT * FROM leave_balance WHERE employee_id = ? AND leave_name = ?`;

// ---------->> already leave exists to update

export const updateExistsLeaveQuery = `UPDATE leave_balance SET total = ? , used = 0 WHERE employee_id = ? AND leave_name = ?`;

// ---------->> insert new alloted leaves

export const insertAllotedLeaveQuery =
  "INSERT INTO leave_balance (employee_id, leave_name, total) VALUES(?,?,?)";

// ---------->> insert new alloted leaves

export const isPunchInExistsQuery = `SELECT * FROM attendence WHERE employee_id = ? AND DATE(punch_date) = ?`;
// ---------->> insert new alloted leaves

export const checkUserExistsQuery = `SELECT * FROM employees WHERE employee_id = ?`;

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
export const pendingLeaveQuery = `
        SELECT * FROM employee_leaves
        WHERE employee_id = ? AND status = 'pending'
      `;
//---------->>  Check if employee has any pending leave request
export const insertLeaveQuery = `
      INSERT INTO employee_leaves (employee_id, leave_type, start_date, end_date, reason,request_date)
      VALUES (?, ?, ?, ?, ?,?)
    `;
//---------->>  retriveMyAllLeavesQuery
export const retriveMyAllLeavesQuery = `
      SELECT 
        leave_request_id,
        employee_id,
        start_date,
        end_date,
        status,
        request_date,
        action_date,
        action_by,
        leave_type,
        reason,
        remark,
        DATEDIFF(end_date, start_date) + 1 AS total_days
      FROM employee_leaves
      WHERE employee_id = ?
      ORDER BY start_date DESC
    `;

//---------->>  retriveAllRequestLeavesQuery
export const retiveLeavesByStatus =       `
          SELECT 
        leave_request_id,
        employee_id,
        start_date,
        end_date,
        status,
        request_date,
        action_date,
        action_by,
        leave_type,
        reason,
        remark,
        DATEDIFF(end_date, start_date) + 1 AS total_days
      FROM employee_leaves
      WHERE status = ?
      ORDER BY start_date DESC
      `

//---------->>  retriveAllRequestLeavesQuery

export  const retriveAllLeavesRequestsQuery = `
      SELECT 
        leave_request_id,
        employee_id,
        start_date,
        end_date,
        status,
        request_date,
        action_date,
        action_by,
        leave_type,
        reason,
        remark
      FROM employee_leaves
      ORDER BY start_date DESC
    `;

//---------->>  check today holidy

export const checkTodayHoliday = `SELECT COUNT(*) AS isHoliday FROM official_holidays WHERE start_date <= ? AND end_date >= ?`


//---------->>  total employee

export const countEmployee = `SELECT COUNT(*) AS totalEmployees FROM employees`

//---------->>  total present

export const countPresent = `
      SELECT COUNT(DISTINCT employee_id) AS totalPresent
      FROM attendence 
      WHERE status = 'Present' AND DATE(punch_date) = ?
    `
