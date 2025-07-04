//-------------> DATABASE CREATE QUERY
const dbCreatQuery = "CREATE DATABASE IF NOT EXISTS HRMS";

//-------------> COMPANY DEPARTMENT CREATE QUERY
const companyDepartmentTableCreateQuery = `CREATE TABLE IF NOT EXISTS company_departments (
   department_id ENUM('Super_Admin','Admin', 'HR','IT', 'Sales', 'Digital_Marketing','Finance') PRIMARY KEY,
   department_name VARCHAR(255) NOT NULL UNIQUE,
   description VARCHAR(255) NOT NULL
)`;

//-------------> EMPLOYEE ROLES CREATE QUERY

const employeeRolesTableCreateQuery = `CREATE TABLE IF NOT EXISTS employee_roles (
   role_id ENUM('Super_Admin', 'Admin', 'Employee') PRIMARY KEY,
   role_name VARCHAR(255) NOT NULL,
   description VARCHAR(255) NOT NULL
)`;

//-------------> OFFICIAL HOLIDAY CREATE QUERY

const officialHolidayTableCreateQuery = `CREATE TABLE IF NOT EXISTS official_holidays(
  holiday_id INT AUTO_INCREMENT PRIMARY KEY,
  holiday_name VARCHAR(100),
  description TEXT,
  start_date DATE NOT NULL,                           
  end_date DATE NOT NULL    
)`;

//-------------> EMPLOYEES TABLE CREATE QUERY
const employeesTableCreateQuery = `CREATE TABLE IF NOT EXISTS employees (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'inactive',
  role ENUM('Super_Admin', 'Admin', 'Employee') NOT NULL,
  department ENUM('Super_Admin','Admin', 'HR','IT', 'Sales', 'Digital_Marketing','Finance') NULL,
  refreshToken TEXT,
  FOREIGN KEY (department) REFERENCES company_departments(department_id),
  FOREIGN KEY (role) REFERENCES employee_roles(role_id)
)`;

//-------------> ATTENDANCE TABLE CREATE QUERY
const attendenceTableCreateQuery = `CREATE TABLE IF NOT EXISTS attendence (
  attendance_id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id VARCHAR(20) NOT NULL,
  punch_date DATE,                                      
  punch_in TIME,   
  punch_out TIME, 
  hours_worked TIME DEFAULT NULL, 
  remarks VARCHAR(200),
  status ENUM('Halfday', 'Present', 'Absent', 'Leave') DEFAULT 'Present',
  leave_type VARCHAR(200),
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
)`;

//-------------> EMPLOYEE LEAVES TABLE CREATE QUERY
const employeeLeaveBalanceTableCreateQuery = `CREATE TABLE IF NOT EXISTS leave_balance (
  leave_balance_id INT NOT NULL AUTO_INCREMENT,
  employee_id VARCHAR(20) NOT NULL,
  leave_name ENUM('sick', 'casual', 'unpaid') DEFAULT 'sick',
  total INT NOT NULL,
  used INT NOT NULL DEFAULT 0,
  remaining INT GENERATED ALWAYS AS (total - used) STORED,
  PRIMARY KEY (leave_balance_id),
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
)`;

//-------------> EMPLOYEE LEAVES TABLE CREATE QUERY
const employeeLeavesTablesCreateQuery = `CREATE TABLE IF NOT EXISTS employee_leaves(
  leave_request_id INT AUTO_INCREMENT PRIMARY KEY,            
  employee_id VARCHAR(20) NOT NULL,                                 
  start_date DATE NOT NULL,                           
  end_date DATE NOT NULL,                           
  status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  request_date DATE,
  action_date DATE,                                                          
  action_by INT, 
  leave_type ENUM('sick', 'casual', 'unpaid'),                                                                  
  reason TEXT,   
  remark VARCHAR(200),                                      
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
  FOREIGN KEY (action_by) REFERENCES employees(user_id) ON DELETE SET NULL
)`;

//-------------> EMPLOYEE BASIC PERSONAL DETAILS CREATE QUERY (Fix Foreign Key)
const employeeBasicPersonalDetails = `CREATE TABLE IF NOT EXISTS personal_details (
  personal_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id VARCHAR(20) NOT NULL,
  first_name VARCHAR(200),
  last_name VARCHAR(200),
  date_of_birth DATE,
  gender ENUM('male', 'female', 'other'),
  marital_status ENUM('married', 'single', 'divorced'),
  blood_group VARCHAR(10),
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
)`;

//-------------> EMPLOYEE CONTACT DETAILS CREATE QUERY 

const employeeContactDetails = `CREATE TABLE IF NOT EXISTS contact_details(
  contact_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id VARCHAR(20) NOT NULL,
  phone_number VARCHAR(100) ,
  alternative_email VARCHAR(50) UNIQUE,
  address VARCHAR(100),
  emergency_number VARCHAR(100),
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
)`;

//-------------> EMPLOYEE BANK DETAILS CREATE QUERY 

const employeebankDetails = `CREATE TABLE IF NOT EXISTS bank_details (
  bank_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id VARCHAR(20) NOT NULL,
  bank_name VARCHAR(200),
  bank_number VARCHAR(30),
  ifsc_number VARCHAR(20),
  pan_number VARCHAR(20),
  pf_number VARCHAR(20),
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
)`;

//-------------> EMPLOYEE DOCUMENT DETAILS CREATE QUERY


const employeeDocumentDetails = `CREATE TABLE IF NOT EXISTS documents (
  document_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id VARCHAR(20) NOT NULL,
  resume LONGBLOB,
  adhaar LONGBLOB,
  experience_letter LONGBLOB,
  education_certificate LONGBLOB,
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
)`;

//-------------> ANNOUNCEMENT 

const annoucementDetails = `CREATE TABLE IF NOT EXISTS announcement(
  announcement_id INT AUTO_INCREMENT PRIMARY KEY,
  message TEXT NOT NULL,
  date DATE,
  create_by INT,
  is_active BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (create_by) REFERENCES employees(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`



module.exports = {
  dbCreatQuery,
  companyDepartmentTableCreateQuery,
  employeeRolesTableCreateQuery,
  officialHolidayTableCreateQuery,
  employeesTableCreateQuery,
  attendenceTableCreateQuery,
  employeeLeavesTablesCreateQuery,
  employeeLeaveBalanceTableCreateQuery,
  employeeBasicPersonalDetails,
  employeeContactDetails,
  employeebankDetails,
  employeeDocumentDetails,
  annoucementDetails
};
