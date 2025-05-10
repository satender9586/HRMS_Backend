const departmentInsertQuery = 
`
    INSERT INTO company_departments(department_name,description)
    VALUES( 'HR', 'Human Resource'),( 'Emp', 'Employee')
`

const roleInsertQuery = 
`
    INSERT INTO employee_roles(role_name,description)
    VALUES( '0', 'Employee'),( '1', 'Admin'),( '2', 'Super Admin')
`
const leaveInsertQuery = 
`
    INSERT INTO leave_categories(leave_name,description)
    VALUES( 'sick', 'emargency leave'),( 'vacation', 'planning leave'),( 'unpaid', 'unpaid leaves')
`


module.exports={departmentInsertQuery,roleInsertQuery,leaveInsertQuery}