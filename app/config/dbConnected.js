const mysql = require("mysql2");
const {holidayTableQuery, dbCreatQuery, usersCreateQuery,
  departmentTableCreateQuery,roleTableCreateQuery,
  usersLeavesTablesQuery,attendenceTableCreateQuery,
  leavesTablesQuery } = require("../helper/dbQueries.js");
const {departmentInsertQuery,roleInsertQuery,leaveInsertQuery} = require("../helper/insertQueries.js")

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  port: process.env.MYSQL_PORT,
  waitForConnections: true,
  connectionLimit: 10, 
  queueLimit: 0,
});


const promisePool = pool.promise();


async function connectAsync() {
  try {
    await promisePool.query('SELECT 1');
    console.log("DB connected!");
  } catch (error) {
    throw new Error("Something is wrong in DB connect: " + error.message);
  }
}


async function queryAsync(query) {
  try {
    const [rows] = await promisePool.query(query);
    return rows;
  } catch (error) {
    throw new Error("Query failed: " + error.message);
  }
}

async function funDb() {
  try {
    await connectAsync();
    await queryAsync(dbCreatQuery);
    await queryAsync("USE EMS");
    await queryAsync(departmentTableCreateQuery);
    await queryAsync(usersCreateQuery);
    // await queryAsync(departmentInsertQuery);
    await queryAsync(roleTableCreateQuery);
    await queryAsync(leavesTablesQuery);
    await queryAsync(usersLeavesTablesQuery);
    await queryAsync(holidayTableQuery);
    // await queryAsync(roleInsertQuery);
    // await queryAsync(leaveInsertQuery);
    await queryAsync(attendenceTableCreateQuery);
  

  } catch (error) {
    console.error("Error: ", error.message);
  } 
  // finally {
  //   pool.end();
  // }
}

module.exports = { funDb,promisePool };
