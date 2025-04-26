function getCurrentDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Utility function to get all dates between two dates
const getDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dates = [];

  while (start <= end) {
    dates.push(start.toISOString().split("T")[0]);
    start.setDate(start.getDate() + 1);
  }

  return dates;
};

// date formate for get attendence controller
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};


// filter object base on dates
const filterDataBaseOnDates = function (data) {
  const result = data.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB - dateA;
  });
  return result
};

// retrive attendence 

const attendeData = function(queryResponse,startDate,endDate){
  const result = [];
  const dateSet = new Set();

  queryResponse.forEach((entry) => {
    const dates = entry.punch_date ? [entry.punch_date] : getDateRange(entry.start_date, entry.end_date);
    dates.forEach(date => {
      const formattedDate = formatDate(date);
      dateSet.add(formattedDate);

      result.push({
        date: formattedDate,
        status: entry.leave_status || entry.attendance_status || 'Absent',
        leave_type: entry.leave_type || null,
        punch_in: entry.punch_in || null,
        punch_out: entry.punch_out || null,
        hours_worked: entry.hours_worked || null,
      });
    });
  });


  let currentDate = new Date(startDate);
  const endDateObj = new Date(endDate);

  while (currentDate <= endDateObj) {
    const formattedDate = formatDate(currentDate);


    if (!dateSet.has(formattedDate)) {
      result.push({
        date: formattedDate,
        status: 'Absent',
        leave_type: null,
        punch_in: null,
        punch_out: null,
        hours_worked: null,
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
