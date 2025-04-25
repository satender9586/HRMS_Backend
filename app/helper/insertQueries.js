const departmentInsertQuery = 
`
    INSERT INTO company_departments(department_name,description)
    VALUES( 'HR', 'Human Resource'),( 'Emp', 'Employee')
`

const roleInsertQuery = 
`
    INSERT INTO employee_roles(role_name,description)
    VALUES( 'emp', 'Employee'),( 'adm', 'Admin'),( 'sadm', 'Super Admin')
`
const leaveInsertQuery = 
`
    INSERT INTO leave_categories(leave_name,description)
    VALUES( 'Sick', 'emargency leave'),( 'Vacation', 'planning leave'),( 'Unpaid', 'unpaid leaves')
`


module.exports={departmentInsertQuery,roleInsertQuery,leaveInsertQuery}