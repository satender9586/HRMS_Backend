function getCurrentDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}





// filter object base on dates
const filterDataBaseOnDates = function (data) {
  const result = data.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB - dateA;
  });
  return result
};

// date formated
const formatDate = (date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0]; 
}


const getDateRange = (startDate, endDate) => {
  const dates = [];
  let currentDate = new Date(startDate);
  const endDateObj = new Date(endDate);

  while (currentDate <= endDateObj) {
    dates.push(new Date(currentDate)); 
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}



// funciton go get data from attendence as well as leave

const attendeData = function(queryResponse, startDate, endDate, userId) {
  const result = [];
  const dateSet = new Set();
  

  queryResponse.forEach((entry) => {
    const dates = entry.punch_date ? [entry.punch_date] : getDateRange(entry.start_date, entry.end_date);
    
    dates.forEach(date => {
      const formattedDate = formatDate(date);
      dateSet.add(formattedDate);
      result.push({
        user_id: userId, 
        date: formattedDate,
        status: entry.leave_status || entry.attendance_status || 'Absent',
        leave_type: entry.leave_type || null,
        punch_in: entry.punch_in || null,
        punch_out: entry.punch_out || null,
        hours_worked: entry.hours_worked || null,
        id: entry.attendance || null, 
      });
    });
  });

 
  let currentDate = new Date(startDate);
  const endDateObj = new Date(endDate);

  while (currentDate <= endDateObj) {
    const formattedDate = formatDate(currentDate);

    if (!dateSet.has(formattedDate)) {
      result.push({
        user_id: userId, 
        date: formattedDate,
        status: 'Absent',
        leave_type: null,
        punch_in: null,
        punch_out: null,
        hours_worked: null,
        id: null, 
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}




module.exports = {
  getCurrentDate,
  getDateRange,
  formatDate,
  filterDataBaseOnDates,
  attendeData
};
