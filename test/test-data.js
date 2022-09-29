
//global variable, for html page, refer tpsvr @ npm.
parse_expire_datetime = require("../parse-expire-datetime.js");
var { parseExpireDatetime } = parse_expire_datetime;

//Date to "YYYY-MM-DD hh:mm:ss"
var toString19 = function (dt, toUtc) {
	if (!dt) dt = new Date();

	var s = toUtc ?
		(dt.getUTCFullYear() + "-" + (dt.getUTCMonth() + 1) + "-" + dt.getUTCDate() + " " + dt.getUTCHours() + ":" + dt.getUTCMinutes() + ":" + dt.getUTCSeconds())
		:
		(dt.getFullYear() + "-" + (dt.getMonth() + 1) + "-" + dt.getDate() + " " + dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds());

	return s.replace(/\b(\d)\b/g, "0$1");
}

//Date to "YYYY-MM-DD hh:mm:ss.fff"
var toString23 = function (dt, toUtc) {
	if (!dt) dt = new Date();
	return toString19(dt) + "." + ("00" + (toUtc ? dt.getUTCMilliseconds() : dt.getMilliseconds())).slice(-3);
}

cmp = function (str, localExpect, options) {
	var dt = parseExpireDatetime(str, options);
	if (!dt) {
		console.error("fail to parse, " + str);
		return false;	//format fail
	}

	var str2 = toString23(dt);

	if (str2 === localExpect) return true;

	console.error("input string: " + str);
	console.error("value string: " + str2);
	console.error("the expected: " + localExpect);
}

module.exports = {

	"parse_expire_datetime": function (done) {
		//if (typeof window !==/=== "undefined") throw "disable for browser/nodejs";

		var dtNow = new Date(2022, 0, 1, 10, 20, 30, 40);	//for debug, 2022-01-01 10:20:30.040

		done(!(
			// YYYY-MM-DD( hh(:mm(:ss(.sss)?)?)?)?, as YYYY-MM-DD (hh|23):(mm|59):(ss|59).(sss|999)
			cmp("2000-1-2 12:34:56.78", "2000-01-02 12:34:56.078") &&
			cmp("2000-1-2 12:34:56", "2000-01-02 12:34:56.999") &&
			cmp("2000-1-2 12:34", "2000-01-02 12:34:59.999") &&
			cmp("2000-1-2 12", "2000-01-02 12:59:59.999") &&
			cmp("2000-1-2", "2000-01-02 23:59:59.999") &&

			cmp("2000-1-2", "2000-01-02 22:59:59.999",
				{ timezoneOffset: (new Date()).getTimezoneOffset() - 60 }) &&		//timezoneOffset

			parseExpireDatetime("2000-01-01 00:00:00.000", 0).getTime() ===		//UTC+0
			Date.UTC(2000, 0, 1, 0, 0, 0, 0) &&

			parseExpireDatetime("2000-01-01 00:00:00.000", 0).getTime() ===		//UTC+0
			parseExpireDatetime("2000-01-01 08:00:00.000", -480).getTime() &&	//UTC+8

			// YYYY-MM, as YYYY-MM-(last-day-of-month) 23:59:59.999	
			cmp("2000-1", "2000-01-31 23:59:59.999") &&
			cmp("2000-2", "2000-02-29 23:59:59.999") &&
			cmp("2001-2", "2001-02-28 23:59:59.999") &&

			cmp("2001-2", "2001-02-28 22:59:59.999",
				(new Date()).getTimezoneOffset() - 60) &&	//timezoneOffset

			parseExpireDatetime("2001-2", 0).getTime() ===		//UTC+0
			Date.UTC(2001, 1, 28, 23, 59, 59, 999) &&
			parseExpireDatetime("2001-2", -480).getTime() ===		//UTC+0
			parseExpireDatetime("2001-2-28 15:59:59.999", 0).getTime() &&	//UTC+8

			// dd | dd hh | dd? hh:(mm(:ss(.sss)?)?)?, as now + ( dd (hh|00):(mm|00):(ss|00).(sss|000) ), then set hh/mm/ss/sss to 23/59/59/999 if they are omitted.
			cmp("1 3:4:5.6", "2022-01-02 13:24:35.046", { now: dtNow }) &&
			cmp("1 3:4:5", "2022-01-02 13:24:35.999", dtNow) &&
			cmp("1 3:4", "2022-01-02 13:24:59.999", dtNow) &&
			cmp("1 3", "2022-01-02 13:59:59.999", dtNow) &&
			cmp("1", "2022-01-02 23:59:59.999", dtNow) &&

			cmp("1 3:4", "2022-01-02 13:24:59.999",
				{ now: dtNow, timezoneOffset: (new Date()).getTimezoneOffset() - 60 }) &&
			cmp("1 3", "2022-01-02 13:59:59.999",
				{ now: dtNow, timezoneOffset: 0 }) &&	//UTC+0
			cmp("1 3", "2022-01-02 13:59:59.999",
				{ now: dtNow, timezoneOffset: -480 }) &&	//UTC+8
			cmp("1 3", "2022-01-02 13:59:59.999",
				{ now: dtNow, timezoneOffset: -300 }) &&	//UTC+5
			cmp("1 3", "2022-01-02 13:29:59.999",	//59-30=29
				{ now: dtNow, timezoneOffset: -330 }) &&	//UTC+5.5
			cmp("1 3:4", "2022-01-02 13:24:59.999",
				{ now: dtNow, timezoneOffset: -330 }) &&	//UTC+5.5

			cmp("3:4:5.6", "2022-01-01 13:24:35.046", dtNow) &&
			cmp("3:4:5", "2022-01-01 13:24:35.999", dtNow) &&
			cmp("3:4", "2022-01-01 13:24:59.999", dtNow) &&
			cmp("3:", "2022-01-01 13:59:59.999", dtNow) &&

			cmp("3:124", "2022-01-01 15:24:59.999", dtNow) &&	//value out of range

			cmp("3:4", "2022-01-01 13:24:59.999",
				{ now: dtNow, timezoneOffset: 0 }) &&	//UTC+0
			cmp("3:", "2022-01-01 13:59:59.999",
				{ now: dtNow, timezoneOffset: 0 }) &&	//UTC+0
			cmp("3:", "2022-01-01 13:59:59.999",
				{ now: dtNow, timezoneOffset: -480 }) &&	//UTC+8
			cmp("3:", "2022-01-01 13:29:59.999",	//59-30=29
				{ now: dtNow, timezoneOffset: -330 }) &&	//UTC+5.5
			cmp("3:4", "2022-01-01 13:24:59.999",
				{ now: dtNow, timezoneOffset: -330 }) &&	//UTC+5.5

			// ddD? hhH? mmM? ss.sssS?, as now + ( dd (hh|00):(mm|00):(ss|00).(sss|000) ).
			cmp("1d3h4m5.6s", "2022-01-02 13:24:35.046", dtNow) &&
			cmp("1d3h4m5s", "2022-01-02 13:24:35.040", dtNow) &&
			cmp("1d3h4m", "2022-01-02 13:24:30.040", dtNow) &&
			cmp("1d3h", "2022-01-02 13:20:30.040", dtNow) &&
			cmp("1d", "2022-01-02 10:20:30.040", dtNow) &&

			cmp("3h", "2022-01-01 13:20:30.040", dtNow) &&
			cmp("4m", "2022-01-01 10:24:30.040", dtNow) &&
			cmp("5s", "2022-01-01 10:20:35.040", dtNow) &&
			cmp("0.6s", "2022-01-01 10:20:30.046", dtNow) &&
			cmp(".6s", "2022-01-01 10:20:30.046", dtNow) &&

			cmp(" 1D   3H4m    5.6s    ", "2022-01-02 13:24:35.046", dtNow) &&	//spaces & cases

			cmp(" 1D   4m ", "2022-01-02 10:24:30.040", dtNow) &&	//partial
			cmp(" 3H    5s    ", "2022-01-01 13:20:35.040", dtNow) &&
			cmp(" 3H    .6s    ", "2022-01-01 13:20:30.046", dtNow) &&
			cmp(" 3H.6s    ", "2022-01-01 13:20:30.046", dtNow) &&

			true
		));
	},

	"check exports": function (done) {
		var m = parse_expire_datetime;
		for (var i in m) {
			if (typeof m[i] === "undefined") { done("undefined: " + i); return; }
		}
		done(false);

		console.log(m);
		var list = "export list: " + Object.keys(m).join(", ");
		console.log(list);
		return list;
	},

};

// for html page
//if (typeof setHtmlPage === "function") setHtmlPage("title", "10em", 1);	//page setting
if (typeof showResult !== "function") showResult = function (text) { console.log(text); }

//for mocha
if (typeof describe === "function") describe('parse_expire_datetime', function () { for (var i in module.exports) { it(i, module.exports[i]).timeout(5000); } });
