"use strict"

var animationEvent = whichAnimationEvent(); /* used for whichAnimationEvent function */

function changeNoOfDays() {
	var strValue = document.getElementById("numLayingDays").value;
	if (isNaN(strValue) == true) {
		document.getElementById("numLayingDays").value = "1";
	}
	var elemDays = document.getElementById("wdDays");
	if (strValue == 1) {
		elemDays.innerHTML = "day";
	} else if (elemDays.innerHTML == "day") {
		elemDays.innerHTML = "days";
	}
	document.getElementById("numLayingDays").style.width = (2.2 * strValue.length) + "vmax";
	setDefaults();
	calculateRelevantDate();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fade() {
	var animationEvent = whichAnimationEvent();
	var appContainer = document.getElementById("appContainer");
	var calContainer = document.getElementById("calendarContainer");
	var elemToShow = "";
	var elemToHide = "";
	if (calContainer.classList.contains("hidden") == 1) {
		elemToShow = calContainer;
		elemToHide = appContainer;
	} else {
		elemToShow = appContainer;
		elemToHide = calContainer;
	}
	elemToShow.classList.add("fadeIn");
	elemToShow.classList.remove("hidden");
	elemToHide.addEventListener("animationEvent", hide(elemToShow, elemToHide));
	elemToHide.classList.add("fadeOut");
}

async function hide(elemToShow, elemToHide) {
	await sleep(1000);
	elemToHide.removeEventListener("animationEvent", hide);
	elemToHide.classList.add("hidden");
	elemToHide.classList.remove("fadeOut");
	elemToShow.classList.remove("fadeIn");
}

function init() {
	var txtOutput = "<p>The <span id='mode' class='clickable' onclick='updateAppMain(1)'>latest laying date</span> for an instrument subject to "
							+ "<span id='procedure' class='clickable' onclick='updateAppMain(2)'>the negative procedure</span>, "
							+ " that is <span id='laidOrInForce'>to come into force</span> on "
							+ "<span id='chosenDate' class='clickable' onclick='fade()'>?</span>"
							+ "<span id='conjunct'></span>"
							+ " after <input type='text' id='numLayingDays' onkeyup='changeNoOfDays()' value='40' /> laying <span id='wdDays'>days</span> is&nbsp;...</p>";
	document.getElementById("appMain").innerHTML = txtOutput;
	setDefaults();
	initializeCalendarControls();
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
	var elemChDate = document.getElementById("chosenDate");
	if (change == "mode") {
		if (elemMode.innerHTML == "latest laying date") {
		// handler for switching to get coming into force date when impermissible laying date chosen
			if (elemChDate.innerHTML != "?") {
				var datCurrentDate = String(document.getElementById("year").options[document.getElementById("year").selectedIndex].value) + "/" 
					+ String(Number(document.getElementById("month").options[document.getElementById("month").selectedIndex].value) + 1) 
					+ "/" + document.getElementById('selectedDay').innerHTML;
				var datCurrentDate = new Date(datCurrentDate);
				var bolCDeskClosed = dateIsCDeskClosed(datCurrentDate);
				if (bolCDeskClosed == 1) {
					document.getElementById('errModalText').innerHTML = "<p>You cannot lay an instrument on " 
						+ elemChDate.innerText + ", because the Chamber Desk is closed that day.</p>";
					openModal('errModal');
					return;
				}
			}
			elemMode.innerHTML = "earliest coming into force date";
		} else {
			elemMode.innerHTML = "latest laying date";
		}
	} else if (change == "procedure") {
		if (elemProc.innerHTML == "the negative procedure") {
			elemProc.innerHTML = "the affirmative procedure";
			document.getElementById('affirmativeOptionsPanel').style.display = 'block';
		} else if (elemProc.innerHTML == "the affirmative procedure") {
			elemProc.innerHTML = "the negative procedure";
			document.getElementById('affirmativeOptionsPanel').style.display = 'none';
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
		setDefaults();
		var numDays = document.getElementById("numLayingDays");
		if (elemProc.innerHTML == "the negative procedure" && numDays.value == 56) {
			numDays.value = 40;
		} else if (elemProc.innerHTML == "the affirmative procedure" && numDays.value == 40) {
			numDays.value = 56;
		}
	}
	calculateRelevantDate();
}

function setDefaults() {
//change opts to defaults, but only if user selected to use defaults
	if (document.getElementById("chkUseDefault").checked == true) {
		var proc = document.getElementById("procedure").innerHTML;
		var intDays = document.getElementById("numLayingDays").value;
		if (proc == "the negative procedure" && intDays == 40) {
			document.getElementById("chkClearDays").checked = false;
		} else {
			document.getElementById("chkClearDays").checked = true;
		}
	}
	document.getElementById("chkGapBtwnMk").checked = true;
	document.getElementById("chkNoWknds").checked = true;
//run calculation again to update if defaults being reapplied
	if (document.getElementById("chosenDate").innerHTML != "?") {
		calculateRelevantDate();
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

function showHideOpts() {
	var divPanel = document.getElementById("optionsPanel");
	if (divPanel.style.display == 'none') {
		divPanel.style.display = 'block';
	} else {
		setDefaults();
		divPanel.style.display = 'none'
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
				document.getElementById('errModalText').innerHTML = "<p>Cannot go back further.</p>";
				openModal('errModal');
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
				document.getElementById('errModalText').innerHTML = "<p>Cannot go further forward.</p>";
				openModal('errModal');
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

function openModal(chosenModal) {
	document.getElementById(chosenModal).style.display = "block";
}

function closeModal(chosenModal) {
	document.getElementById(chosenModal).style.display = "none";
}

/* From Modernizr */
function whichAnimationEvent() {
//    var t;
    var el = document.createElement('fakeelement');
    var animations = {
		      'anitmation':'animationend',
			      'OAnimation':'oAnimationEnd',
			      'MozAnimation':'animationend',
			      'WebkitAnimation':'webkitAnimationEnd'
    }
    var a;
    for(a in animations) {
        if( el.style[a] !== undefined ) {
            return animations[a];
        }
    }
}