function slide() {
	var elemAppContainer = document.getElementById("appContainer");
	var elemCalendarContainer = document.getElementById("calendarContainer");
	elemAppContainer.classList.toggle('holdLeft');
	elemCalendarContainer.classList.toggle('holdRight');
	if (elemAppContainer.classList.contains('holdLeft') == true) {
		elemAppContainer.style.visibility = 'hidden';
		elemCalendarContainer.style.visibility = 'visible';
	} else {
		elemAppContainer.style.visibility = 'visible';
		elemCalendarContainer.style.visibility = 'hidden';
	}
}
function init() {
	var txtOutput = "<p>The <span id='mode' class='clickable' onclick='updateAppMain(1)'>latest laying date</span> for an instrument subject to "
							+ "<span id='procedure' class='clickable' onclick='updateAppMain(2)'>the negative procedure</span>, "
							+ " that is <span id='laidOrInForce'>to come into force</span> on "
							+ "<span id='chosenDate' class='clickable' onclick='slide()'>?</span>"
							+ "<span id='conjunct'></span>"
							+ " after <input type='text' id='numLayingDays' onkeyup='changeNoOfDays()' value='40' /> laying <span id='wdDays'>days</span> is&nbsp;...</p>";
	document.getElementById("appMain").innerHTML = txtOutput;
	setUseClearDays();
}
function updateAppMain(change) {
	if (change == 1) {
		change = "mode";
	} else {
		change = "procedure";
	}
	var elemMode = document.getElementById("mode");
	var elemProc = document.getElementById("procedure");
	var elemLoF = document.getElementById("laidOrInForce");
	var elemCon = document.getElementById("conjunct");
	if (change == "mode") {
		if (elemMode.innerHTML == "latest laying date") {
			elemMode.innerHTML = "earliest coming into force date";
		} else {
			elemMode.innerHTML = "latest laying date";
		}
	} else if (change == "procedure") {
		if (elemProc.innerHTML == "the negative procedure") {
			elemProc.innerHTML = "the affirmative procedure";
		} else if (elemProc.innerHTML == "the affirmative procedure") {
			elemProc.innerHTML = "the negative procedure";
		}
	}
	if (elemMode.innerHTML == "latest laying date") {
		elemLoF.innerHTML = "to come into force";
		elemCon.innerHTML = "";
	} else if (elemMode.innerHTML == "earliest coming into force date") {
		if (elemProc.innerHTML == "the negative procedure") {
			elemLoF.innerHTML = "laid";
		} else if (elemProc.innerHTML == "the affirmative procedure") {
			elemLoF.innerHTML = "laid in draft";
		}
		elemCon.innerHTML = " and is to come into force ";
	}
	if (change == "procedure") {
		setUseClearDays();
		var numDays = document.getElementById("numLayingDays");
		if (elemProc.innerHTML == "the negative procedure" && numDays.value == 56) {
			numDays.value = 40;
		} else if (elemProc.innerHTML == "the affirmative procedure" && numDays.value == 40) {
			numDays.value = 56;
		}
	}
	calculateRelevantDate();
}
function changeNoOfDays() {
	var strValue = document.getElementById("numLayingDays").value;
	if (isNaN(strValue) == true) {
		document.getElementById("numLayingDays").value = "";
	}
	var elemDays = document.getElementById("wdDays");
	if (strValue == 1) {
		elemDays.innerHTML = "day";
	} else if (elemDays.innerHTML == "day") {
		elemDays.innerHTML = "days";
	}
	setUseClearDays();
	calculateRelevantDate();
}
function setUseClearDays() {
	var proc = document.getElementById("procedure").innerHTML;
	var intDays = document.getElementById("numLayingDays").value;
	if (proc == "the negative procedure" && intDays == 40) {
		document.getElementById("chkClearDays").checked = false;
	} else {
		document.getElementById("chkClearDays").checked = true;
	}
}
function revealOpts() {
	document.getElementById("btnRevealOpts").classList.toggle("buttonRotated");
	setTimeout(unhideOpts, 250);
}
function unhideOpts() {
	var divPanel = document.getElementById("optionsPanel");
	if (divPanel.style.display == 'none') {
		divPanel.style.display = 'block';
	} else {
		divPanel.style.display = 'none';
	}
}
function calFwBack(direction) {
	var lstMonth = document.getElementById("month");
	var lstYear = document.getElementById('year');
	var yearLmt = new Date();
	if (direction == 0) {
		yearLmt = parseInt(yearLmt.getFullYear()) - 1;
		if (lstMonth.value > 0) {
			lstMonth.value = (parseInt(lstMonth.value) - 1);
		} else {
			if (lstYear.value > yearLmt) {
				lstMonth.value = 11;
				lstYear.value = parseInt(lstYear.value) - 1;
			} else {
				alert('cannot go back further');
			}
		}
	} else {
		yearLmt =parseInt(yearLmt.getFullYear()) + 1;
		if (lstMonth.value < 11) {
			lstMonth.value = (parseInt(lstMonth.value) + 1);
		} else {
			if (lstYear.value < yearLmt) {
				lstMonth.value = 0;
				lstYear.value = parseInt(lstYear.value) + 1;
			} else {
				alert('cannot go further forward');
			}
		}
	}
	writeCalendar();
}
function calBtnsShowHide() {
	var curYear = new Date();
	curYear = parseInt(curYear.getFullYear());
	var earliestDate = String(curYear - 1) + "0";
	var latestDate = String(curYear + 1) + "11";
	var selDate = String(document.getElementById("year").value) + String(document.getElementById("month").value);
	if (selDate == earliestDate) {
		document.getElementById("btnDatBack").style.visibility = 'hidden';
		document.getElementById("btnDatFw").style.visibility = 'visible';
	} else if (selDate == latestDate) {
		document.getElementById("btnDatFw").style.visibility = 'hidden';
		document.getElementById("btnDatBack").style.visibility = 'visible';
	} else {
		document.getElementById("btnDatBack").style.visibility = 'visible';
		document.getElementById("btnDatFw").style.visibility = 'visible';
	}
}