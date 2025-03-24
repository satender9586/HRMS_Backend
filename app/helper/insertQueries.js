const departmentInsertQuery = 
`
    INSERT INTO department(department_name,description)
    VALUES( 'HR', 'Human Resource'),( 'Emp', 'Employee')
`

const roleInsertQuery = 
`
    INSERT INTO role(role_name,description)
    VALUES( 'emp', 'Employee'),( 'adm', 'Admin'),( 'sadm', 'Super Admin')
`

module.exports={departmentInsertQuery,roleInsertQuery}