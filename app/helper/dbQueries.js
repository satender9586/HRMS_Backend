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
    date DATE,
    status ENUM('Present', 'Absent', 'Leave') DEFAULT 'Absent',
    hours_worked DECIMAL(5,2), 
    leave_type ENUM('Sick Leave', 'Casual Leave'),     
    punch_in TIME,              
    punch_out TIME,             
    notes TEXT,
    FOREIGN KEY (users_id) REFERENCES users(user_id)

)`;

module.exports = {
  dbCreatQuery,
  usersCreateQuery,
  departmentTableCreateQuery,
  roleTableCreateQuery,
  attendenceTableCreateQuery
};
