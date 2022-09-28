
//Convert a local-fake-timezone Date to a real local Date.
function timezoneToLocal(dt, timezoneOffset) {
	return new Date(dt.getTime() + (timezoneOffset - dt.getTimezoneOffset()) * 60000);
}

//Convert a real local Date to a local-fake-timezone Date.
function localToTimezone(dt, timezoneOffset) {
	return new Date(dt.getTime() - (timezoneOffset - dt.getTimezoneOffset()) * 60000);
}

//MM: 1-12, dd: 1-31
function createExpireDate(YYYY, MM, dd, hh, mm, ss, sss, timezoneOffset) {
	YYYY = parseInt(YYYY, 10);
	MM = parseInt(MM, 10) - 1;
	dd = parseInt(dd, 10) - 1;
	hh = parseInt(hh, 10);
	mm = parseInt(mm, 10);
	ss = parseInt(ss, 10);
	sss = parseInt(sss, 10);

	var dt = new Date(YYYY || 0, MM || 0, (dd || 0) + 1, hh || 0, mm || 0, ss || 0, sss || 0);

	if (isNaN(hh)) dt.setHours(23);
	if (isNaN(mm)) dt.setMinutes(59);
	if (isNaN(ss)) dt.setSeconds(59);
	if (isNaN(sss)) dt.setMilliseconds(999);

	//timezoneOffset
	return (typeof timezoneOffset === "number") ? timezoneToLocal(dt, timezoneOffset) : dt;
}

//utcTime: refer to Date.prototype.getTime()
function offsetExpireDate(utcTime, dd, hh, mm, ss, sss, timezoneOffset) {
	if (typeof utcTime !== "number") utcTime = (new Date()).getTime();

	var dt = new Date(utcTime);
	if (typeof timezoneOffset === "number") dt = localToTimezone(dt, timezoneOffset);

	return createExpireDate(
		dt.getFullYear(),
		dt.getMonth() + 1,
		dt.getDate() + (parseInt(dd, 10) || 0),
		dt.getHours() + parseInt(hh, 10),
		dt.getMinutes() + parseInt(mm, 10),
		dt.getSeconds() + parseInt(ss, 10),
		dt.getMilliseconds() + parseInt(sss, 10),
		timezoneOffset
	);
}

/*
Parse string to expire datetime.

parseExpireDatetime(str, options | timezoneOffset | now )
	options
		timezoneOffset
			Number type, in minutes, refer to Date.prototype.getTimezoneOffset().

		now
			A Date object, for debug purpose, only available for offset type string.

Return a date object, or empty if fail.
*/
function parseExpireDatetime(str, options) {
	//arguments

	//str
	if (!str) return;
	str = str.replace(/(^\s+|\s+$)/g, "");	//remove head/tail spaces
	if (!str) return;

	//options
	if (typeof options === "number") options = { timezoneOffset: options };
	else if (options && (options instanceof Date)) options = { now: options };

	//parsing start

	var mr;		//match result

	// YYYY-MM-DD( hh(:mm(:ss(.sss)?)?)?)?, as YYYY-MM-DD (hh|23):(mm|59):(ss|59).(sss|999)
	if (mr = str.match(/^(\d+)\-(\d+)\-(\d+)(\s+\d+(\:\d+(\:\d+(\.\d+)?)?)?)?$/)) {
		return createExpireDate(
			mr[1], mr[2], mr[3],		//YYYY-MM-DD
			mr[4], mr[5]?.slice(1), mr[6]?.slice(1), mr[7]?.slice(1),	//hh:mm:ss.sss
			options?.timezoneOffset
		);
	}
	// YYYY-MM, as YYYY-MM-(last-day-of-month) 23:59:59.999	
	else if (mr = str.match(/^(\d+)\-(\d+)$/)) {
		return createExpireDate(
			mr[1],	//YYYY
			(parseInt(mr[2], 10) || 1) + 1,	//MM+1
			1,		//1st
			0, 0, 0, -1,		//00:00:00.000 - 1 = 23:59:59.999
			options?.timezoneOffset);
	}
	// dd( hh(:mm(:ss(.sss)?)?)?)?, as now + ( dd (hh|00):(mm|00):(ss|00).(sss|000) ), then set hh/mm/ss/sss to 23/59/59/999 if they are omitted.
	else if (mr = str.match(/^(\d+)(\s+\d+(\:\d+(\:\d+(\.\d+)?)?)?)?$/)) {
		return offsetExpireDate(options?.now?.getTime(),
			mr[1], mr[2], mr[3]?.slice(1), mr[4]?.slice(1), mr[5]?.slice(1),
			options?.timezoneOffset);
	}
	// hh:(mm(:ss(.sss)?)?)?, as now + ( hh:(mm|00):(ss|00).(sss|000) ), then set mm/ss/sss to 59/59/999 if they are omitted.
	else if (mr = str.match(/^(\d+)\:(\d+(\:\d+(\.\d+)?)?)?$/)) {
		return offsetExpireDate(options?.now?.getTime(),
			0, mr[1], mr[2], mr[3]?.slice(1), mr[4]?.slice(1),
			options?.timezoneOffset);
	}
	// ddD? hhH? mmM? ss.sssS?, as now + ( dd (hh|00):(mm|00):(ss|00).(sss|000) ).
	else if (mr = str.match(/^(\d+d\s*)?(\d+h\s*)?(\d+m\s*)?(?:(\d*)(\.\d+)?s)?$/i)) {
		return offsetExpireDate(options?.now?.getTime(),
			mr[1] || 0, mr[2] || 0, mr[3] || 0, mr[4] || 0, mr[5]?.slice(1) || 0,
			options?.timezoneOffset);
	}
	/*
	*/
}

// module exports
module.exports = {
	timezoneToLocal,
	localToTimezone,

	createExpireDate,
	create: createExpireDate,

	offsetExpireDate,
	offset: offsetExpireDate,

	parseExpireDatetime,
	parse: parseExpireDatetime,
};
