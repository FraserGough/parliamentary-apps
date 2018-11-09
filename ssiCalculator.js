"use strict"

var arrayStartDates, arrayEndDates, arrayCdeskClosedDates, numberOfRecessPeriods, numberOfCdeskClosures;

function calculateInForceDate(strChosenDate) {
	var intLayingPeriod = document.getElementById("numLayingDays").value;
	var intCountedDays = 0;
	var bolIsRecess, bolIsCDeskClosed, resumeDate;
	var recessEncountered = "";
//start with laying date
	var dateChosen = new Date(strChosenDate);
	var strExp = "<p>Your chosen laying date is " + formatDateOutput(dateChosen, 1) + ".</p>"
//if clear days required, mv forward 1 day from day of laying
	if (document.getElementById("chkClearDays").checked == true) {
		dateChosen.setDate(dateChosen.getDate() + 1);
		strExp += "<p>As you have chosen to require clear laying days, that day does not count so the laying period begins on " + formatDateOutput(dateChosen, 0) + ".</p>";
	}
//count forward required number of days
	do {
		if (dateIsRecess(dateChosen) == 0) {
			intCountedDays = intCountedDays + 1;
		} else {
			//get what recess block has been hit
			recessEncountered = returnRecessBlock(dateChosen);
			//get the end of that recess block
			resumeDate = arrayEndDates[recessEncountered];
			//make that end date the date chosen so count forward resumes on other side of recess
			dateChosen = new Date(resumeDate);
			strExp += "<p>After counting forward " + intCountedDays + " laying days, a recess is encountered which runs from " + formatDateOutput(arrayStartDates[recessEncountered], 0) + " to " + formatDateOutput(arrayEndDates[recessEncountered], 0) + ". </p>";
		}
		dateChosen.setDate(dateChosen.getDate() + 1);
	}
	while (intCountedDays != intLayingPeriod);
	if (recessEncountered == "") {
		strExp += "<p>Counting forwards " + intLayingPeriod + " laying days, no recesses are encountered.</p>";
	}
//if affirmative, this gives us date instrument can be made, corrections x2
	if (document.getElementById("procedure").innerHTML == "the affirmative procedure") {
		strExp += "<p>Counting forwards the required number of laying days, the laying period ends on " + formatDateOutput(dateChosen, 1) + ".</p>";
		//1. If a weekend, and making on weekends not permitted, find next weekday as day of making
		if (dateChosen.getDay() == 0 || dateChosen.getDay() == 6) {
			if (document.getElementById('chkNoWknds').checked == true) {
				if (dateChosen.getDay() == 0) {
					dateChosen.setDate(dateChosen.getDate() + 1);
				} else if (dateChosen.getDay() == 6) {
					dateChosen.setDate(dateChosen.getDate() + 2);
				}
				strExp += "<p>As you have chosen to proceed on the basis that the instrument cannot be made on a weekend, the earliest day it can be made is " + formatDateOutput(dateChosen, 1) + ".</p>";
			} else {
				strExp += "<p>You have chosen to proceed on the basis that the instrument can be made on a weekend.</p>";
			}
		}
		//2. If gap required between making and in force, count forward 1 day from making
		if (document.getElementById("chkGapBtwnMk").checked == true) {
			strExp += "<p>As you have chosen to require a gap between making and coming into force, the instrument can be made on " + formatDateOutput(dateChosen, 0);
			dateChosen.setDate(dateChosen.getDate() + 1);
			strExp += ", but cannot come into force until " + formatDateOutput(dateChosen, 0);
		} else {
			strExp += " As you have chosen not to require a gap between making and coming into force, the instrument can be made and come into force on " + formatDateOutput(dateChosen, 0);
		}
		strExp += ".</p>";
	}
//output
	var strOutput = formatDateOutput(dateChosen, 1);
	document.getElementById("appOutput").innerHTML = "<p>" + strOutput + "<a href='#' onclick='openModal(`expModal`)' class='modalOpenButton'>*</a></p>";
	document.getElementById("expModalText").innerHTML = strExp;
}

function calculateLayingDate(strChosenDate) {
	var strExp = "";
	var intLayingPeriod = Number(document.getElementById("numLayingDays").value);
	var intCountedDays = 0;
	var bolIsRecess, bolIsCDeskClosed;
	var recessEncountered = "";
	var resumeDate = "";
	//start with in force date
	var dateChosen = new Date(strChosenDate);
	strExp = "<p>The instrument is to come into force on " + formatDateOutput(dateChosen, 1) + " after " + intLayingPeriod + " laying " + document.getElementById('wdDays').innerHTML + ".</p>";
	//corrections for affirmatives x2:
	if (document.getElementById('procedure').innerHTML == "the affirmative procedure") {
		//1. if gap required between making and in force go back a day - just normal day
		if (document.getElementById('chkGapBtwnMk').checked == true) {
			dateChosen.setDate(dateChosen.getDate() - 1);
			strExp += "<p>As you have chosen to proceed on the basis that a gap is required between making and coming into force, the instrument must be made not later than " + formatDateOutput(dateChosen, 1) + ". </p>";
		} else {
			strExp += "<p>You have chosen to proceed on the basis that the instrument can be made and come into force on the same day.</p>"
		}
		//2. unless can be made on weekend, go back to nearest weekday for making
		if (dateChosen.getDay() == 0 || dateChosen.getDay() == 6) {
			if (document.getElementById('chkNoWknds').checked == true) {
				if (dateChosen.getDay() == 0) {
					dateChosen.setDate(dateChosen.getDate() - 2);
				} else if (dateChosen.getDay() == 6) {
					dateChosen.setDate(dateChosen.getDate() - 1);
				}
				strExp += "<p>As the instrument cannot be made on a weekend, it will need to be made by " + formatDateOutput(dateChosen, 1) + ". </p>";
			} else {
				strExp += "<p>You have chosen to proceed on the basis that the instrument can be made on a weekend.</p>";
			}
		}
	}
	var initialDate = new Date(dateChosen);
	//count back required number of laying days
	do { 
		dateChosen.setDate(dateChosen.getDate() - 1);
		if (dateIsRecess(dateChosen) == 0) {
			intCountedDays = intCountedDays + 1;
		} else {
			//get what recess block has been hit
			recessEncountered = returnRecessBlock(dateChosen);
			//get the start date of that recess block
			resumeDate = arrayStartDates[recessEncountered];
			//make that start date the date chosen so count back resumes on the other side of the recess
			dateChosen = new Date(resumeDate);
			strExp += "<p>After counting back " + intCountedDays + " laying days, a recess is encountered which runs from " + formatDateOutput(arrayStartDates[recessEncountered], 0) + " to " + formatDateOutput(arrayEndDates[recessEncountered], 0) + ".</p>"
		}
	}
	while (intCountedDays != intLayingPeriod);
	if (recessEncountered == "") {
		strExp += "<p>Counting back from that day, no recesses are encountered.</p>"; 
	}
	//if clear days required count back one more day - just normal day, does not have to be laying day
	strExp += "<p>The day falling " + intLayingPeriod + " laying " + document.getElementById('wdDays').innerHTML + " before " + formatDateOutput(initialDate, 1) + " is " + formatDateOutput(dateChosen, 1);
	if (document.getElementById('chkClearDays').checked == true) {
		dateChosen.setDate(dateChosen.getDate() - 1);
		strExp += "; as you have chosen to require clear laying days, the (draft) instrument must be laid not later than " + formatDateOutput(dateChosen, 1);
	}
	//then find nearest day instrument can be laid, i.e. day that is not c desk holiday
	if (dateIsCDeskClosed(dateChosen) == 1) {
		do {
			dateChosen.setDate(dateChosen.getDate() - 1);
			bolIsCDeskClosed = dateIsCDeskClosed(dateChosen);
		}
		while (bolIsCDeskClosed == 1);
		strExp += ".</p><p>But the Chamber Desk is not open that day and so the latest permissible laying date is " + formatDateOutput(dateChosen, 0) + ".</p>";
	}
	//output
	var strOutput = "<p>" + formatDateOutput(dateChosen, 1);
	if (dateIsCDeskClosed(dateChosen) > 1) {
	//warning if chamber desk half day
		strOutput = strOutput + "!";
	}
	document.getElementById("appOutput").innerHTML = strOutput + "<a href='#' onclick='openModal(`expModal`)' class='modalOpenButton'>*</a></p>";
	document.getElementById("expModalText").innerHTML = strExp;
}

function calculateRelevantDate() {
	if (document.getElementById("numLayingDays").value != "" && document.getElementById('chosenDate').innerHTML != "?") {
		var mode = document.getElementById('mode').innerHTML;
		var currentMonth = document.getElementById("month").options[document.getElementById("month").selectedIndex].value;
		currentMonth = Number(currentMonth) + 1;
		var currentYear = document.getElementById("year").options[document.getElementById("year").selectedIndex].value;
		//get day of first day of currentMonth
		var firstDate = new Date(Number(currentYear) + "/" + (Number(currentMonth) + 1) + "/01");
		var strChosenDate = String(currentYear) + "/" + String(currentMonth) + "/" + document.getElementById('selectedDay').innerHTML;
		if (mode == "latest laying date") {
			calculateLayingDate(strChosenDate);
		} else if (mode =="earliest coming into force date") {
			calculateInForceDate(strChosenDate);
		}
	}
}

function calMarkSpecialDays(currentMonth, currentYear, daysInMonth) {
//loop all days in month
	var datCurrentDate, intDayOfWeek, bolInRecess, bolCDeskClosed;
	for (var i = 1; i <= daysInMonth; i++) {
//get date to check
		datCurrentDate = new Date(String(currentYear) + "/" + (Number(currentMonth) + 1) + "/" + i);
//check if date in recess
		bolInRecess = dateIsRecess(datCurrentDate);
//check if day chamber desk closed
	//first check if Sat or Sun
		intDayOfWeek = datCurrentDate.getDay();
		if (intDayOfWeek == 0 || intDayOfWeek == 6) {
			bolCDeskClosed = 1;
	//if not check list of c desk holidays
		} else {
			bolCDeskClosed = dateIsCDeskClosed(datCurrentDate);
		}
//toggle appropriate css
		if (bolInRecess == 1) {
			document.getElementById("date" + i).classList.toggle('recessDay');	
		}
		if (bolCDeskClosed == 1) {
			document.getElementById("date" + i).classList.toggle('cDeskHoliday');
		} else if (bolCDeskClosed > 1) {
			document.getElementById("date" + i).classList.toggle('cDeskHalfHoliday');
		}
	}
}

function dateIsCDeskClosed(currentDate) {
	var intReturn = 0;
	var i;
	currentDate = new Date(currentDate);
	if (currentDate.getDay() == 0 || currentDate.getDay() == 6) {
		intReturn = 1;
	} else {
		for (i = 0; i < arrayCdeskClosedDates.length; i++) {
			if (String(currentDate) == String(arrayCdeskClosedDates[i].date)) {
				if (arrayCdeskClosedDates[i].time == 0) {
				//closed all day
					intReturn = 1;
				} else if (arrayCdeskClosedDates[i].time == 1) {
				//closed am
					intReturn = 2;
				} else {
				//closed pm
					intReturn = 3;
				}
				break;
			}
		}
	}
	return intReturn;
}

function dateIsRecess(currentDate) {
	var intReturn = 0;
	var i;
	currentDate = new Date(currentDate);
	for (i = 0; i <= numberOfRecessPeriods; i++) {
		if (currentDate >= arrayStartDates[i] && currentDate <= arrayEndDates[i]) {
			intReturn = 1;
			break;
		}
	}
	return intReturn;
}

function fillDate(dateChosen) {
	var chosenMonth = document.getElementById('month').value;
	var chosenYear = document.getElementById('year').value;
//test not trying to lay on cdesk holiday
	if (document.getElementById("mode").innerHTML == "earliest coming into force date") {
		var elem = document.getElementById("date" + dateChosen);
		if (elem.classList.contains('cDeskHoliday') == true) {
			document.getElementById('errModalText').innerHTML = "<p>Instruments cannot be laid on days that the Office of the Clerk is closed.</p>";
			openModal('errModal');
			return;
		} else if (elem.classList.contains('cDeskHalfHoliday') == true) {
			document.getElementById('errModalText').innerHTML = "<p>The Office of the Clerk is operating reduced hours on that day.</p>";
			openModal('errModal');
		}
	}
	var arrayMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	var strOutput;
	strOutput = "<span id='selectedDay'>" + dateChosen + "</span> "
					+ arrayMonths[chosenMonth] + " "
					+ document.getElementById("year").value;
	document.getElementById("chosenDate").innerHTML = strOutput;
	calculateRelevantDate();
	fade();
}

function formatDateOutput(dateToFormat, bolGiveDay) {
	var arrayMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	var arrayDaysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	var strMonth = arrayMonths[dateToFormat.getMonth()];
	var strYear = dateToFormat.getFullYear();
	var strDate = dateToFormat.getDate();
	var strOutput = "";
	if (bolGiveDay == 1) {
		strOutput = arrayDaysOfWeek[dateToFormat.getDay()] + ", ";
	}
	return strOutput + strDate + " " + strMonth + " " + strYear;
}

function getXML() {
//	initializeCalendarControls();
//	var arrayStartDates, arrayEndDates, arrayCdeskClosedDates, numberOfRecessPeriods, numberOfCdeskClosures;
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function () {
	   	if (this.readyState == 4 && this.status == 200) {
	   		getRecessDates(this);
	   	}
	}
	xmlhttp.open("GET", "holyroodRecessDates.xml", true);
	xmlhttp.send();

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function () {
	   	if (this.readyState == 4 && this.status == 200) {
	   		getCdeskClosureDates(this);
	   		xmlhttp = null;
	   	}
	}
	xmlhttp.open("GET", "holyroodDeskClosedDates.xml", true);
	xmlhttp.send();
}

function getCdeskClosureDates(xml) {
	var xmlDoc = xml.responseXML;
	var objClosedDay;
	numberOfCdeskClosures = xmlDoc.getElementsByTagName('day').length;
	arrayCdeskClosedDates = new Array(numberOfCdeskClosures);
	for (var i = 0; i < numberOfCdeskClosures; i++) {
		objClosedDay = {
			date: new Date(xmlDoc.getElementsByTagName('date')[i].childNodes[0].nodeValue),
			time: xmlDoc.getElementsByTagName('time')[i].childNodes[0].nodeValue
		};
		arrayCdeskClosedDates[i] = objClosedDay;
	}
	xml = null;
	writeCalendar();
}

function getRecessDates(xml) {
	var xmlDoc = xml.responseXML;
	numberOfRecessPeriods = xmlDoc.getElementsByTagName('period').length;
	arrayStartDates = new Array(numberOfRecessPeriods);
	arrayEndDates = new Array(numberOfRecessPeriods);
	for (var i = 0; i < numberOfRecessPeriods; i++) {
		arrayStartDates[i] = new Date(xmlDoc.getElementsByTagName('start')[i].childNodes[0].nodeValue);
		arrayEndDates[i] = new Date(xmlDoc.getElementsByTagName('end')[i].childNodes[0].nodeValue);
	};
}

function initializeCalendarControls() {
	var oUAParser = new UAParser();
	var strBrowserName = oUAParser.getResult().browser.name;
	var strBrowserVersion = parseInt(oUAParser.getResult().browser.version);
	if ((strBrowserName == "IE") || (strBrowserName == "Edge" && strBrowserVersion < 16)) {
		var strOutput = '<table><tr><td><input type="button" class="calendarButton" id="btnDatBack" value="&#8592;" onclick="calFwBack(0)"/></td>'
								+ '<td><select id="month" onchange="writeCalendar()"></select></td>'
								+ '<td><select id="year" onchange="writeCalendar()"></select></td>'
								+'<td><input type="button" class="calendarButton" id="btnDatFw" value="&#8594;" onclick="calFwBack(1)"/></td>'
								+'<td><input type="button" class="keyButton" id="btnCalKey" value="?" onclick="openModal(\'keyModal\')"/></td></tr></table>';
		document.getElementById("calendarControls").innerHTML  = strOutput;
	}
	var strOutput = "";
	var i;
	var currentDate = new Date();
	var currentYear = Number(currentDate.getFullYear());
	for (i = -1; i < 2; i++) {
		strOutput = strOutput + "<option value=" + (currentYear + i)
		if (i == 0) {
			strOutput = strOutput + " selected";
		}
		strOutput = strOutput + ">" + String(currentYear + i) + "</option>";
	}
	document.getElementById("year").innerHTML = strOutput;
	strOutput = "";
	var currentMonth  = Number(currentDate.getMonth());
	var arrayMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	for (i = 0; i <= 11; i++) {
		strOutput = strOutput + "<option value=" + i;
		if (i == currentMonth) {
			strOutput = strOutput + " selected";
		}
		strOutput = strOutput + ">" + arrayMonths[i] + "</option>";
	}
	document.getElementById("month").innerHTML = strOutput;
	getXML();
}

function returnRecessBlock(currentDate) {
	var intReturn = 0;
	var i;
	currentDate = new Date(currentDate);
	for (i = 0; i < numberOfRecessPeriods; i++) {
		if (currentDate >= arrayStartDates[i] && currentDate <= arrayEndDates[i]) {
			intReturn = i;
			break;
		}
	}
	return intReturn;
}

function writeCalendar() {
	var oUAParser = new UAParser();
	var strBrowserName = oUAParser.getResult().browser.name;
	var strBrowserVersion = parseInt(oUAParser.getResult().browser.version);
	if ((strBrowserName == "IE") || (strBrowserName == "Edge" && strBrowserVersion < 16)) {
		writeCalenderMS();
	} else {
		writeCalendarNormal();
	}
}

function writeCalenderMS() {
	var strOutput = "<table><tr>";
	// put days of week along top row
	var arrayDaysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
	for (var i = 0; i < 7; i++) {
		var strDayAbbr = arrayDaysOfWeek[i].slice(0, 3);
		strOutput += "<th>" + strDayAbbr + "</th>";
	}
	strOutput += "</tr>";
	//add days of month
	var currentMonth = Number(document.getElementById("month").options[document.getElementById("month").selectedIndex].value);
	var currentYear = Number(document.getElementById("year").options[document.getElementById("year").selectedIndex].value);
	//get number of days in currentMonth
	var daysInMonth = 32 - new Date(currentYear, currentMonth, 32).getDate();
	//get day of first day of currentMonth
	var firstDate = new Date(String(currentYear) + "/" + String((currentMonth + 1)) + "/" + "01");
	var firstDay = Number(firstDate.getDay());
	if (firstDay == 0) {
		firstDay = 7;
	}
	var i = 1 - firstDay + 1;
	var j = 1;
	do {
		if (j == 1) {
			strOutput += "<tr>";
		}
		if (i > 0 && i <= daysInMonth) {
			strOutput = strOutput + "<td id='date"+ i + "' onclick='fillDate(" + i + ")'>" + i + "</td>";
		}
		else {
			strOutput = strOutput + "<td class='calendarEmptySquare'></td>";
		}
		if (j == 7) {
			strOutput += "</tr>";
		}
		i = i + 1;
		if (j < 7) {
			j = j + 1;
		}
		else {
			j = 1;
		}
	}
	while  (i <= daysInMonth);
	strOutput += "</table>"
	document.getElementById("calendarGrid").innerHTML = strOutput;
	calBtnsShowHide();
	calMarkSpecialDays(currentMonth, currentYear, daysInMonth);
}

function writeCalendarNormal() {
	var strOutput = "";
	// put days of week along top row
	var arrayDaysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
	for (var i = 0; i < 7; i++) {
		var strDayAbbr = arrayDaysOfWeek[i].slice(0, 3);
		strOutput += "<div class='header'>" + strDayAbbr + "</div>";
	}
	//add days of month
	var currentMonth = Number(document.getElementById("month").options[document.getElementById("month").selectedIndex].value);
	var currentYear = Number(document.getElementById("year").options[document.getElementById("year").selectedIndex].value);
	//get number of days in currentMonth
	var daysInMonth = 32 - new Date(currentYear, currentMonth, 32).getDate();
	//get day of first day of currentMonth
	var firstDate = new Date(String(currentYear) + "/" + String((currentMonth + 1)) + "/" + "01");
	var firstDay = Number(firstDate.getDay());
	if (firstDay == 0) {
		firstDay = 7;
	}
	var i = 1 - firstDay + 1;
	do {
		if (i > 0 && i <= daysInMonth) {
			strOutput = strOutput + "<div id='date"+ i + "' onclick='fillDate(" + i + ")'>" + i + "</div>" ;
		}
		else {
			strOutput = strOutput + "<div class='calendarEmptySquare'></div>";
		}
		i = i + 1;
	}
	while  (i <= daysInMonth);
	document.getElementById("calendarGrid").innerHTML = strOutput;
	calBtnsShowHide();
	calMarkSpecialDays(currentMonth, currentYear, daysInMonth);
}