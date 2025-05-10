const { promisePool } = require("../config/dbConnected");


const generateEmployeeId = async () => {
   const [lastEmployee] = await promisePool.query("SELECT employee_id FROM employees ORDER BY user_id DESC LIMIT 1");
  if (lastEmployee.length === 0) {
    return 'PTY-0001';
  }
  const lastEmployeeId = lastEmployee[0].employee_id;
  const lastEmployeeNumber = parseInt(lastEmployeeId.split('-')[1]);
  const newEmployeeNumber = lastEmployeeNumber + 1;
  const newEmployeeId = `PTY-${newEmployeeNumber.toString().padStart(4, '0')}`;
  return newEmployeeId;
};

module.exports = { generateEmployeeId }