/**
 * @file Utilities that can be used within program code
 */

// Get formatted UTC date
function getDate(con = '-') {
    let date = new Date();
    let fullDate = date.getUTCFullYear();
    fullDate = ((date.getUTCMonth()+1) < 10 ? fullDate + con + '0' + parseInt(date.getUTCMonth()+1) : fullDate + con + parseInt(date.getUTCMonth()+1));
    fullDate = (date.getUTCDate() < 10 ? fullDate + con + '0' + date.getUTCDate() : fullDate + con + date.getUTCDate());
    return fullDate;
}

// Get formatted UTC time
function getTime(con = ':') {
    let date = new Date();
    let timestamp = date.getUTCHours() < 10 ? '0' + date.getUTCHours() : date.getUTCHours();
    timestamp = (date.getUTCMinutes() < 10 ? timestamp + con + '0' + date.getUTCMinutes() : timestamp + con + date.getUTCMinutes());
    timestamp = (date.getUTCSeconds() < 10 ? timestamp + con + '0' + date.getUTCSeconds() : timestamp + con + date.getUTCSeconds());
    return timestamp;
}

// Export util data
module.exports = {
    getDate,
    getTime
}