const departmentInsertQuery = `
  INSERT INTO company_departments(department_id, department_name, description)
  VALUES 
    ('Super_Admin', 'Super Admin', 'Top-level system access'),
    ('Admin', 'Admin', 'Administrator with management privileges'),
    ('HR', 'Human Resources', 'Handles hiring and HR policies'),
    ('IT', 'IT Department', 'Maintains technical infrastructure'),
    ('Sales', 'Sales Department', 'Manages customer acquisition and sales'),
    ('Digital_Marketing', 'Digital Marketing Department', 'Oversees online marketing initiatives'),
    ('Finance', 'Finance Department', 'Manages financial operations and budgeting');
`;




const roleInsertQuery = `
   INSERT INTO employee_roles (role_id, role_name, description)
   VALUES
   ('Super_Admin', 'Super Admin', 'Super administrator role'),
   ('Admin', 'Admin', 'Administrator role'),
   ('Employee', 'Company Employees', 'Standard employee role');
`;



module.exports = { departmentInsertQuery, roleInsertQuery, };
