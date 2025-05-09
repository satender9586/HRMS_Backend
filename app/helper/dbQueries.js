//-------------> DATABASE CREATE QUERY

const dbCreatQuery = "CREATE DATABASE IF NOT EXISTS EMS";

//-------------> COMPANY DEPARTMENT CREATE QUERY

const companyDepartmentTableCreateQuery = `CREATE TABLE IF NOT EXISTS company_departments (
   department_id INT AUTO_INCREMENT PRIMARY KEY,
   department_name VARCHAR(255) UNIQUE NOT NULL,
   description VARCHAR(255) NOT NULL,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`;

const employeeRolesTableCreateQuery = `CREATE TABLE IF NOT EXISTS employee_roles (
   role_id INT AUTO_INCREMENT PRIMARY KEY,
   role_name VARCHAR(255) NOT NULL,
   description VARCHAR(255) NOT NULL,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP 
)`;

const leavesTypesTablesCreateQuery = `CREATE TABLE IF NOT EXISTS leave_categories(
  leave_id INT PRIMARY KEY AUTO_INCREMENT,
  leave_name VARCHAR(255) NOT NULL,
  description VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`;

const officialHolidayTableCreateQuery = `CREATE TABLE IF NOT EXISTS official_holidays(
  holiday_id INT AUTO_INCREMENT PRIMARY KEY,
  holiday_name VARCHAR(100),
  description TEXT,
  start_date DATE NOT NULL,                           
  end_date DATE NOT NULL    
)`;



const employeesTableCreateQuery = `CREATE TABLE IF NOT EXISTS employees (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  status ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Inactive',
  role INT NOT NULL , 
  department INT NOT NULL,
  refreshToken TEXT,
  FOREIGN KEY (department) REFERENCES company_departments(department_id),
  FOREIGN KEY (role) REFERENCES employee_roles(role_id)
)`;

const attendenceTableCreateQuery = `CREATE TABLE IF NOT EXISTS attendence (
  attendance_id INT PRIMARY KEY AUTO_INCREMENT,
  users_id INT,
  punch_date DATE,                                      
  punch_in TIME,   
  punch_out TIME, 
  hours_worked time DEFAULT NULL, 
  status ENUM("ShortHours",'Present', 'Absent') DEFAULT 'Present' ,
  FOREIGN KEY (users_id) REFERENCES employees(user_id)
  )`;

const employeeLeavesTablesCreateQuery = `CREATE TABLE IF NOT EXISTS employee_leaves(
    leave_request_id INT AUTO_INCREMENT PRIMARY KEY,            
    users_id INT,                                
    start_date DATE NOT NULL,                           
    end_date DATE NOT NULL,                           
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    request_date DATETIME DEFAULT CURRENT_TIMESTAMP,    
    action_date DATETIME,                                                         
    action_by INT, 
    leave_type ENUM('sick','emergency'),                                                                  
    reason TEXT,                                         
    FOREIGN KEY (users_id) REFERENCES employees(user_id) ON DELETE CASCADE,
    FOREIGN KEY (action_by) REFERENCES employees(user_id) ON DELETE SET NULL
)`;

const employeeBasicPersonalDetails = `CREATE TABLE IF NOT EXISTS personal_details (
  personal_id INT AUTO_INCREMENT PRIMARY KEY,
  users_id INT NOT NULL,
  first_name VARCHAR(200),
  last_name VARCHAR(200),
  date_of_birth DATE,
  gender ENUM('male', 'female', 'other'),
  marital_status ENUM('married', 'single', 'divorced'),
  blood_group VARCHAR(10),
  FOREIGN KEY (users_id) REFERENCES employees(user_id) ON DELETE CASCADE
)`


const employeeContactDetails = `CREATE TABLE IF NOT EXISTS contact_details(
  contact_id INT AUTO_INCREMENT PRIMARY KEY,
  users_id INT,
  phoneNumber VARCHAR(100) UNIQUE,
  email   VARCHAR(50) UNIQUE,
  address VARCHAR(100),
  emergencyNumber VARCHAR(100),
  FOREIGN KEY (users_id) REFERENCES employees(user_id) ON DELETE CASCADE
)`

const employeebankDetails = `CREATE TABLE IF NOT EXISTS bank_details (
  bank_id INT AUTO_INCREMENT PRIMARY KEY,
  users_id INT NOT NULL,
  bank_name VARCHAR(200),
  bank_number VARCHAR(30),
  ifsc_number VARCHAR(20),
  pan_number VARCHAR(20),
  pf_number VARCHAR(20),
  FOREIGN KEY (users_id) REFERENCES employees(user_id) ON DELETE CASCADE
)`

const employeeDocumentDetails =`CREATE TABLE IF NOT EXISTS documents (
  document_id INT AUTO_INCREMENT PRIMARY KEY,
  users_id INT NOT NULL,
  resume LONGBLOB,
  adhaar LONGBLOB,
  experience_letter LONGBLOB,
  education_certificate LONGBLOB,
  FOREIGN KEY (users_id) REFERENCES employees(user_id) ON DELETE CASCADE
)`


module.exports = {
  dbCreatQuery,
  companyDepartmentTableCreateQuery,
  employeeRolesTableCreateQuery,
  leavesTypesTablesCreateQuery,
  officialHolidayTableCreateQuery,
  employeesTableCreateQuery,
  attendenceTableCreateQuery,
  employeeLeavesTablesCreateQuery,
  employeeBasicPersonalDetails,
  employeeContactDetails,
  employeebankDetails,
  employeeDocumentDetails
};
