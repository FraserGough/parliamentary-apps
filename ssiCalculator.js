function getXML() {
	initializeCalendarControls();
	var arrayStartDates, arrayEndates, arrayCdeskClosedDates, numberOfRecessPeriods, numberOfDdeskClosures;
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function () {
	   	if (this.readyState == 4 && this.status == 200) {
	   		getRecessDates(this);
	   	}
	};
	xmlhttp.open("GET", "holyroodRecessDates.xml", true);
	xmlhttp.send();
	
	xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function () {
	   	if (this.readyState == 4 && this.status == 200) {
	   		getCdeskClosureDates(this);
	   	}
	};
	xmlhttp.open("GET", "holyroodDeskClosedDates.xml", true);
	xmlhttp.send();
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
	writeCalendar();
}

function initializeCalendarControls() {
	var strOutput = "";
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
}

function writeCalendar() {
	var strOutput = "<table id='tblCalendar'>";
	for (i = 0; i < 7; i++) {
		strOutput = strOutput + "<col class='calendarCol'>";
	}
	strOutput = strOutput + "<thead>";
	var arrayDaysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
	for (var i = 0; i < 7; i++) {
		var strDayAbbr = arrayDaysOfWeek[i].slice(0, 3);
		strOutput = strOutput + "<th>" + strDayAbbr + "</th>";
	}
	strOutput = strOutput + "</thead><tbody>";
	var currentMonth = document.getElementById("month").options[document.getElementById("month").selectedIndex].value;
	var currentYear = document.getElementById("year").options[document.getElementById("year").selectedIndex].value;
	//get day of first day of currentMonth
	var firstDate = new Date(currentYear + "-" + (Number(currentMonth) + 1) + "-1");
	var firstDay = firstDate.getDay();
	//get number of days in currentMonth
	var daysInMonth = 32 - new Date(currentYear, Number(currentMonth), 32).getDate();
	//start writing numbers from day of first day of currentMonth
	var dayNo = 1;
	var firstDayReached = 0;
	i = 1;
	//
	do {
		//start new row on a Monday
		if (i == 1) {
			strOutput = strOutput + "<tr>";
		}
		if (firstDayReached == 0) {
			if (i == firstDay) {
				firstDayReached = 1;
			}
		}
		if (firstDayReached == 0) {
			strOutput += "<td></td>";
		} else {
			strOutput = strOutput + "<td id='date" + dayNo + "'>";
			strOutput = strOutput + "<a href='#' onclick='fillDate(" + dayNo + ")'>" + dayNo + "</a></td>";	
			dayNo = dayNo + 1;
		}
		//end row on a Sunday
		if (i == 0) {
			strOutput = strOutput + "</tr>";
		}
		if (i == 6) {
			i = -1;
		}
	i = i + 1;
	}
	while (dayNo <= daysInMonth);
	strOutput = strOutput + "</tbody></table>";
	document.getElementById("calendarTable").innerHTML = strOutput;
	calBtnsShowHide();
	calMarkSpecialDays(currentMonth, currentYear, daysInMonth);
}

function calMarkSpecialDays(currentMonth, currentYear, daysInMonth) {
//loop all days in month
	var datCurrentDate, intDayOfWeek, bolInRecess, bolCDeskClosed;
	for (var i = 1; i <= daysInMonth; i++) {
//get date to check
		datCurrentDate = new Date(currentYear + "-" + (Number(currentMonth) + 1) + "-" + i);
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

function dateIsRecess(currentDate) {
	var intReturn = 0;
	currentDate = new Date(currentDate);
	for (i = 0; i < numberOfRecessPeriods; i++) {
		if (currentDate >= arrayStartDates[i] && currentDate <= arrayEndDates[i]) {
			intReturn = 1;
			break;
		}
	}
	return intReturn;
}

function dateIsCDeskClosed(currentDate) {
	var intReturn = 0;
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

function fillDate(dateChosen) {
	var chosenMonth = document.getElementById('month').value;
	var chosenYear = document.getElementById('year').value;
//test not trying to lay on cdesk holiday
	if (document.getElementById("mode").innerHTML == "earliest coming into force date") {
		var elem = document.getElementById("date" + dateChosen);
		if (elem.classList.contains('cDeskHoliday') == true) {
			alert('Instruments cannot be laid on days that the Office of the Clerk is closed.');
			return;
		} else if (elem.classList.contains('cDeskHalfHoliday') == true) {
			alert('The Office of the Clerk is operating reduced hours on that day.');
		}
	}
	var arrayMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	var strOutput;
	strOutput = "<span id='selectedDay'>" + dateChosen + "</span> "
					+ arrayMonths[chosenMonth] + " "
					+ document.getElementById("year").value;
	document.getElementById("chosenDate").innerHTML = strOutput;
	calculateRelevantDate();
	slide();
}

function calculateRelevantDate() {
	if (document.getElementById("numLayingDays").value != "" && document.getElementById('chosenDate').innerHTML != "?") {
		var mode = document.getElementById('mode').innerHTML;
		var currentMonth = document.getElementById("month").options[document.getElementById("month").selectedIndex].value;
		currentMonth = Number(currentMonth) + 1;
		var currentYear = document.getElementById("year").options[document.getElementById("year").selectedIndex].value;
		//get day of first day of currentMonth
		var firstDate = new Date(currentYear + "-" + (Number(currentMonth) + 1) + "-1");
		var strChosenDate = currentYear + "-" + currentMonth + "-" + document.getElementById('selectedDay').innerHTML;
		if (mode == "latest laying date") {
			calculateLayingDate(strChosenDate);
		} else if (mode =="earliest coming into force date") {
			calculateInForceDate(strChosenDate);
		}
	}
}

function calculateInForceDate(strChosenDate) {
	var intLayingPeriod = document.getElementById("numLayingDays").value;
	var intCountedDays = 0;
	var bolIsRecess, bolIsCDeskClosed, resumeDate;
	var recessEncountered = "";
//start with laying date
	var dateChosen = new Date(strChosenDate);
	var strExp = "Your chosen laying date is " + formatDateOutput(dateChosen, 1) + "."
//if clear days required, mv forward 1 day from day of laying
	if (document.getElementById("chkClearDays").checked == true) {
		dateChosen.setDate(dateChosen.getDate() + 1);
		strExp += " As you have chosen to require clear laying days, that day does not count so the laying period begins on " + formatDateOutput(dateChosen, 0) + ".";
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
			strExp += " After counting forward " + intCountedDays + " laying days, a recess is encountered which runs from " + formatDateOutput(arrayStartDates[recessEncountered], 0) + " to " + formatDateOutput(arrayEndDates[recessEncountered], 0) + ". ";
		}
		dateChosen.setDate(dateChosen.getDate() + 1);
	}
	while (intCountedDays != intLayingPeriod);
	if (recessEncountered == "") {
		strExp += " Counting forwards " + intLayingPeriod + " laying days from that day, no recesses are encountered.";
	}
//if affirmative, this gives us date instrument can be made, corrections x2
	if (document.getElementById("procedure").innerHTML == "the affirmative procedure") {
		strExp += " Counting forwards the required number of laying days, the laying period ends on " + formatDateOutput(dateChosen, 1) + ".";
		//1. If a weekend, and making on weekends not permitted, find next weekday as day of making
		if (dateChosen.getDay() == 0 || dateChosen.getDay() == 6) {
			if (document.getElementById('chkNoWknds').checked == true) {
				if (dateChosen.getDay() == 0) {
					dateChosen.setDate(dateChosen.getDate() + 1);
				} else if (dateChosen.getDay() == 6) {
					dateChosen.setDate(dateChosen.getDate() + 2);
				}
				strExp += " As you have chosen to proceed on the basis that the instrument cannot be made on a weekend, the earliest day it can be made is " + formatDateOutput(dateChosen, 1) + ".";
			} else {
				strExp += " You have chosen to proceed on the basis that the instrument can be made on a weekend.";
			}
		}
		//2. If gap required between making and in force, count forward 1 day from making
		if (document.getElementById("chkGapBtwnMk").checked == true) {
			strExp += " As you have chosen to require a gap between making and coming into force, the instrument can be made on " + formatDateOutput(dateChosen, 0);
			dateChosen.setDate(dateChosen.getDate() + 1);
			strExp += ", but cannot come into force until " + formatDateOutput(dateChosen, 0);
		} else {
			strExp += " As you have chosen not to require a gap between making and coming into force, the instrument can be made and come into force on " + formatDateOutput(dateChosen, 0);
		}
	}
//output
	var strOutput = formatDateOutput(dateChosen, 1);
	document.getElementById("appOutput").innerHTML = "<p>" + strOutput + "</p>";
	document.getElementById("appOutputExp").innerHTML = "<p>" + strExp + "</p>";
}


function calculateLayingDate(strChosenDate) {
	var strExp = "";
	var intLayingPeriod = Number(document.getElementById("numLayingDays").value);
	var intCountedDays = 0;
	var bolIsRecess, bolIsCDeskClosed;
	var recessEncountered = ""
	var resumeDate;
	//start with in force date
	var dateChosen = new Date(strChosenDate);
	strExp = "The instrument is to come into force on " + formatDateOutput(dateChosen, 1) + " after " + intLayingPeriod + " laying " + document.getElementById('wdDays').innerHTML + ".";
	//corrections for affirmatives x2:
	if (document.getElementById('procedure').innerHTML == "the affirmative procedure") {
		//1. if gap required between making and in force go back a day - just normal day
		if (document.getElementById('chkGapBtwnMk').checked == true) {
			dateChosen.setDate(dateChosen.getDate() - 1);
			strExp += " As you have chosen to proceed on the basis that a gap is required between making and coming into force, the instrument must be made not later than " + formatDateOutput(dateChosen, 1) + ". ";
		} else {
			strExp += " You have chosen to proceed on the basis that the instrument can be made and come into force on the same day. "
		}
		//2. unless can be made on weekend, go back to nearest weekday for making
		if (dateChosen.getDay() == 0 || dateChosen.getDay() == 6) {
			if (document.getElementById('chkNoWknds').checked == true) {
				if (dateChosen.getDay() == 0) {
					dateChosen.setDate(dateChosen.getDate() - 2);
				} else if (dateChosen.getDay() == 6) {
					dateChosen.setDate(dateChosen.getDate() - 1);
				}
				strExp += "As the instrument cannot be made on a weekend, it will need to be made by " + formatDateOutput(dateChosen, 1) + ". ";
			} else {
				strExp += "You have chosen to proceed on the basis that the instrument can be made on a weekend. ";
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
			strExp += " After counting back " + intCountedDays + " laying days, a recess is encountered which runs from " + formatDateOutput(arrayStartDates[recessEncountered], 0) + " to " + formatDateOutput(arrayEndDates[recessEncountered], 0) + ". "
		}
	}
	while (intCountedDays != intLayingPeriod);
	if (recessEncountered == "") {
		strExp += " Counting back from that day, no recesses are encountered."; 
	}
	//if clear days required count back one more day - just normal day, does not have to be laying day
	strExp += " The day falling " + intLayingPeriod + " laying " + document.getElementById('wdDays').innerHTML + " before " + formatDateOutput(initialDate, 1) + " is " + formatDateOutput(dateChosen, 1);
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
		strExp += ". But the Chamber Desk is not open that day and so the latest permissible laying date is " + formatDateOutput(dateChosen, 0);
	}
	//output
	var strOutput = "<p>" + formatDateOutput(dateChosen, 1);
	if (dateIsCDeskClosed(dateChosen) > 1) {
	//warning if chamber desk half day
		strOutput = strOutput + "!";
	}
	document.getElementById("appOutput").innerHTML = strOutput;	 + "</p>";
	document.getElementById("appOutputExp").innerHTML = "<p>" + strExp + ".</p>";
}

function returnRecessBlock(currentDate) {
	var intReturn = 0;
	currentDate = new Date(currentDate);
	for (i = 0; i < numberOfRecessPeriods; i++) {
		if (currentDate >= arrayStartDates[i] && currentDate <= arrayEndDates[i]) {
			intReturn = i;
			break;
		}
	}
	return intReturn;
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
