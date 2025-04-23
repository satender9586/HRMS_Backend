const dbCreatQuery = "CREATE DATABASE IF NOT EXISTS EMS";

const departmentTableCreateQuery = `CREATE TABLE IF NOT EXISTS department (
   department_id INT AUTO_INCREMENT PRIMARY KEY,
   department_name VARCHAR(255) UNIQUE NOT NULL,
   description VARCHAR(255) NOT NULL,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`;

const roleTableCreateQuery = `CREATE TABLE IF NOT EXISTS role (
   role_id INT AUTO_INCREMENT PRIMARY KEY,
   role_name VARCHAR(255) NOT NULL,
   description VARCHAR(255) NOT NULL,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`;

const usersCreateQuery = `CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  status ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Inactive',
  role INT NOT NULL , 
  department INT NOT NULL,
  FOREIGN KEY (department) REFERENCES department(department_id),
  FOREIGN KEY (role) REFERENCES role(role_id)
)`;

const attendenceTableCreateQuery = `CREATE TABLE IF NOT EXISTS attendence (
  attendance_id INT PRIMARY KEY AUTO_INCREMENT,
  users_id INT,
  punch_date DATE,                                      
  punch_in TIME,   
  punch_out TIME, 
  hours_worked DECIMAL(5,2), 
  status ENUM('Present', 'Absent', 'Leave') DEFAULT 'Absent',
  leave_type ENUM('Sick Leave', 'Casual Leave'),                                      
  notes TEXT,
  FOREIGN KEY (users_id) REFERENCES users(user_id)
  )`;



const leavesTablesQuery = `CREATE TABLE IF NOT EXISTS leaves(
  leave_id INT PRIMARY KEY AUTO_INCREMENT,
  leave_name VARCHAR(255) NOT NULL,
  description VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`;

const usersLeavesTablesQuery = `CREATE TABLE IF NOT EXISTS employeesLeaves(
    leave_id INT AUTO_INCREMENT PRIMARY KEY,            
    users_id INT,                                
    leave_type ENUM('sick', 'vacation', 'personal', 'emergency', 'maternity', 'paternity', 'compensatory','unpaid') ,
    description VARCHAR(255),
    start_date DATE NOT NULL,                           
    end_date DATE NOT NULL,                           
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    request_date DATETIME DEFAULT CURRENT_TIMESTAMP,    
    action_date DATETIME,                                                         
    action_by INT,                                                                   
    reason TEXT,                                         
    FOREIGN KEY (users_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (action_by) REFERENCES users(user_id) ON DELETE SET NULL
)`;

const holidayTableQuery = `CREATE TABLE IF NOT EXISTS holidays(
    holiday_id INT AUTO_INCREMENT PRIMARY KEY,
    holiday_name VARCHAR(100),
    description TEXT,
    start_date DATE NOT NULL,                           
    end_date DATE NOT NULL    
)`;

module.exports = {
  dbCreatQuery,
  usersCreateQuery,
  departmentTableCreateQuery,
  roleTableCreateQuery,
  attendenceTableCreateQuery,
  leavesTablesQuery,
  usersLeavesTablesQuery,
  holidayTableQuery,
};
