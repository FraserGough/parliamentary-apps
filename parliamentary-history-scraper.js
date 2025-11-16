// global vars
const version = "0.9"
let htmlContent = ""
let jsonContent = ""
let leadCommittee = ""
let doc = ""
let results = []
let sessionObject = {}
let cmtAbbrsDictionary = {}
let billTitle = ""

async function randomTesting() {
	await createSessionObject()
	await buildCommitteeAbbrsDictionary()
	console.log(typeof cmtAbbrsDictionary)
	console.log(cmtAbbrsDictionary instanceof Map)
	for (const [key, value] of cmtAbbrsDictionary.entries()) {
		console.log(value)
		console.log(`${value}`)
	}
}

function setVersion() {
	document.getElementById('versionInfo').textContent = "js: " + version
}

async function scrapeData() {
	if (!htmlContent) {
		alert("Please load an HTML file first")
		return
	}
	await createSessionObject()
	await	buildCommitteeAbbrsDictionary()	
	const parser = new DOMParser()
	doc = parser.parseFromString(htmlContent, 'text/html')
	billTitle = doc.querySelector('title').textContent.split("|")[0].trim()
	//having extracted title from <head> for efficiency from here on only need to look in body
	doc = doc.getElementById("main")
	const billNumber = await findBillNumberByTitle(billTitle)
	leadCommittee = getLeadCommittee()
	getBillDocs(billNumber)
	getOfficialReports()
	//output
	document.getElementById('output').textContent = JSON.stringify(results, null, 2)
	//seek additional info for publications
	await addPromptsForPublications()
	document.getElementById('downloadData').classList.remove('hidden')
	document.getElementById('generateTable').classList.remove('hidden')
}

function mergeJson() {
	// test if there are json strings to merge, end if not
	if (document.getElementsByClassName("publicationInfo").length < 1) {
		return
	}
	const jsonTextStrings = document.getElementsByClassName('jsonOutput')
	let mergeString = ""
	for (let i = 0; i < jsonTextStrings.length; i++) {
		const tag = jsonTextStrings[i].tagName.toLowerCase()
		let fullText = ""
		if (tag === "textarea") {
			fullText = jsonTextStrings[i].value
		} else {
			fullText = jsonTextStrings[i].textContent
		}
		const jsonText = fullText.slice(1,(fullText.length - 2))
		mergeString += jsonText
		if (i != jsonTextStrings.length - 1) {
			mergeString += ","
		}
	}
	mergeString = "[" + mergeString + "]"
	document.getElementById('output').textContent = mergeString
	document.getElementById('publicationsInputs').remove()
}

async function buildHtmlTable() {
	let htmlString = ""
	await mergeJson()
	jsonContent = document.getElementById('output').textContent
	// sort the json chronologically
	const jsonObj = JSON.parse(jsonContent)
	jsonObj.sort((a,b) => {
		const dateA = new Date(a.date)
		const dateB = new Date(b.date)
		const dateComparison = dateA - dateB
		if (dateComparison != 0) {
			return dateComparison
		} else {
			const priorityString = "/official-report/"
			const aHasPriority = a.url.includes(priorityString)
			const bHasPriority = b.url.includes(priorityString)
			if (aHasPriority && !bHasPriority) {
				return -1
			} else if (!aHasPriority && !bHasPriority) {
				return 1
			} else {
				return 0
			}
		}
	})
	htmlString = "<details><summary>see html</summary>"
	htmlString += "<table><tr class='header'><th>Proceedings and reports</td><td>Reference</th></tr>"
	let stageTracker = 0
	Object.keys(jsonObj).forEach(key => {
		const innerJson = JSON.parse(JSON.stringify(jsonObj[key]))
		const stage = innerJson.stage
		if (stage != stageTracker) {
			htmlString += "<tr><td class='interstitial' colspan='2'>Stage " + stage + "</td></tr>"
			stageTracker = stage
		}
		htmlString += "<tr><td>" + innerJson.displayName + "</td>"
		htmlString += "<td><a href='" + innerJson.url + "'>" + innerJson.reference + "</a></td></tr>"
	})
	htmlString += "<tr><td class='interstitial' colspan='2'>Post passage</td></tr>"
	htmlString += "<tr><td>Royal Assent, [date]</td><td>[year] asp [number]</td></tr>"
	htmlString += "</table></details>"
	document.getElementById('htmlOutput').innerHTML = htmlString
	document.getElementById('downloadTable').classList.remove('hidden')
}

async function createSessionObject() {
	try {
		const jsonText = await getParliamentOpenData("sessions","json")
		const jsonObj = JSON.parse(jsonText)
		const i = jsonObj.length - 1
		const sessionNumber = jsonObj[i].ShortName.slice(1)
		const sessionStart = jsonObj[i].StartDate
		sessionObject = {number: sessionNumber, start: sessionStart}
	} catch (err) {
		console.error("Error parsing json:", err)
	}
}

async function buildCommitteeAbbrsDictionary() {
	try {
		const jsonText = await getParliamentOpenData("committees","json")
		const jsonObj = JSON.parse(jsonText)
		const sessionStart = sessionObject.start
		cmtAbbrsDictionary = new Map()
		for (let i = 0; i < jsonObj.length; i++) {
			const committeeValidFrom = jsonObj[i].ValidFromDate
			if (committeeValidFrom >= sessionStart) {
				const cmtAbbr = jsonObj[i].ShortName
				const cmtName = jsonObj[i].Name
				cmtAbbrsDictionary.set(cmtAbbr, cmtName)
			}
		}
	} catch (err) {
		console.error("Error parsing json:", err)
	}
}

async function getParliamentOpenData(dataSet,format) {
	const url = "https://data.parliament.scot/api/" + dataSet + "/" + format
	try {
		const response = await fetch(url)
		const data = await response.text()
		return data
	} catch (err) {
		console.error("Error fetching data", err)
		return null
	}
}

async function addPromptsForPublications() {
	let output = `<p>The text boxes below show information about publications
	(typically committee reports) data for which cannot easily be scraped from
	the Parliament's website so the text boxes provide an opportunity to fill
	in some blanks.</p>`
	const blocks = doc.querySelectorAll('a')
	const publicationDomains = [
		"digitalpublications.parliament.scot",
		"bprcdn.parliament.scot"
	]
	for (let i = 0; i < blocks.length; i++) {
		const url = blocks[i].href
		let isPublication = false
		for (let j = 0; j < publicationDomains.length; j++) {
			if (url.includes(publicationDomains[j])) {
				isPublication = true
				continue
			}
		}
		if (isPublication === false) {
			continue
		}
		//also skip SPICe briefings
		if (url.includes("/ResearchBriefings/")) {
			continue
		}
		const results = []
		const stage = getStage(blocks[i])
		const publicationData = await extractPublicationDataFromUrl(url)
		let committee = "?"
		let date = "?"
		if (publicationData) {
			committee = publicationData.committee
			date = publicationData.date
		}
		let displayName = "?"
		let reference = "?"
		if (committee != "?") {
			displayName = committee + " report"
			year = date.slice(0,date.indexOf("-"))
			reference = committee + " [xth] report, " + year + ", [report title] (SPP [no.])"
		}
		results.push({
			stage,
			displayName,
			date,
			url,
			reference
		})
		const textAreaContent = JSON.stringify(results, null, 2)
		output += "<div class='publicationInfo' id='publicationInfo-" + i + "'>"
		output += "<p><a target='_blank' href=' " + url + "'>Publication page</a></p>"
		output += `<label><input onchange='showPullDataButton(` + i + `)'
		id='input-` + i + `' type='file' class='publicationInput' accept='.html,.htm'></label>`
		output += "<br /><textArea id='textArea-" + i + "' class='jsonOutput'>"
		output += textAreaContent
		output += "</textArea>"
		output += "<button onclick='extractPublicationInfo(" + i + ")' class='hidden'>pull data</button>"
		output += "</div>"
		output += "<hr />"
	}
	document.getElementById('publicationsInputs').innerHTML = output
}

function showPullDataButton(id) {
	document.querySelector('#publicationInfo-' + id + ' button').classList.remove('hidden')
}

async function extractPublicationInfo(id) {
	const input = document.getElementById('input-' + id)
	const file = input.files[0]
	if (!file) return
	const reader = new FileReader()
	reader.onload = (e) => {
		pageHtml = e.target.result
	}
	reader.onerror = () => {
		console.log("failed to read file")
	}
	await reader.readAsText(file)
	const parser = new DOMParser()
	const doc = parser.parseFromString(pageHtml, 'text/html')
	const publicationTitle = doc.querySelector('title').textContent.split("|")[0].trim()
	const textArea = document.getElementById('textArea-' + id)
	let textContent = textArea.value
	if (publicationTitle != "") {
		textContent = textContent.replace("[report title]", publicationTitle)
	}
	textArea.textContent = textContent	
}

function extractPublicationDataFromUrl(url) {
	let returnObject = {}
	let committee = ""
	let foundAbbr = ""
	cmtAbbrsDictionary.forEach((name, abbr) => {
		let abbrSearchStr = "/" + abbr + "/"
		if (url.includes(abbrSearchStr)) {
			committee = name
			foundAbbr = abbr
		}
	})
	const abbrSearchStr = "/" + foundAbbr + "/"
	if (committee != "") {
		//iterator to construct date
		let year = ""
		let month = ""
		let day = ""
		let startPos = url.indexOf(abbrSearchStr) + abbrSearchStr.length
		for (let i = 0; i < 3; i++) {
			endPos = url.indexOf("/", startPos)
			let targetString = url.slice(startPos,endPos)
			if (targetString.length < 2) {
				targetString = "0" + targetString
			}
			if (i === 0) {
				year = targetString
			} else if (i === 1) {
				month = targetString
			} else {
				day = targetString
			}
			startPos = endPos + 1
		}
		const date = year + "-" + month + "-" + day
		returnObject = {committee: committee, date: date}
	} else {
		returnObject = null
	}
	return returnObject
}

function getPublicationDetails() {
	const parser = new DOMParser()
	const doc = parser.parseFromString(htmlContent, 'text/html')
	return doc.querySelector('head').innerHTML
}

function getOfficialReports() {
	const blocks = doc.querySelectorAll('a')
	for (let i = 0; i < blocks.length; i++) {
		let url = blocks[i].href
		if (! url.includes("chamber-and-committees/official-report/")) {
			continue
		}
		url = urlCorrection(url)
		const stage = getStage(blocks[i])
		const consideringBody = findConsideringBody(blocks[i], stage)
		const dateArray = url.slice(url.indexOf('?') - 10,url.indexOf('?')).split("-")
		const date = dateArray[2] + "-" + dateArray[1] + "-" + dateArray[0]
		const displayName = consideringBody + ", " + formatDateToLongString(date)
		const reference = "SP OR " + consideringBody + " " + formatDateToLongString(date)
		addToResults(stage,displayName,date,url,reference)
	}
}

function addToResults(stage,displayName,date,url,reference) {
	const exists = results.some(d => d.reference === reference)
	if (!exists) {
		results.push({
			stage,
			displayName,
			date,
			url,
			reference
		})
	}
}

async function findBillNumberByTitle(title) {
// gets the bill number by searching open data for most recent bill with extracted title

	try {
		const xmlText = await getParliamentOpenData("bills","xml")
		const parser = new DOMParser()
		const xmlDoc = parser.parseFromString(xmlText, "text/xml")
		const bills = Array.from(xmlDoc.getElementsByTagName("Bill"))

		// Search backwards
		for (let i = bills.length - 1; i >= 0; i--) {
			const bill = bills[i];
			const fullName = bill.getElementsByTagName("FullName")[0]?.textContent.trim();

			if (fullName === title) {
				let reference = bill.getElementsByTagName("Reference")[0]?.textContent.trim();
				reference = reference.replace("SP Bill","").trim();
				return reference;
			}
		}

		return null; // No match found
	} catch (err) {
		console.error("Error parsing XML:", err);
		return null;
	}
}

function getLeadCommittee() {
	const paras = doc.querySelectorAll('p')
	for (let p of paras) {
		const text = p.textContent.trim()
		if (text.includes("The lead committee for this Bill is")) {
			return p.querySelector('a').textContent
			break
		}
	}
	return "Unknown committee"
}

async function getBillDocs(billNumber) {
	const blocks = doc.querySelectorAll('span.link-block')
	//bill doc types to include
	const billDocsKeywords = [
		"Explanatory Notes",
		"Policy Memorandum",
		"Financial Memorandum",
		"Delegated Powers Memorandum",
		"Groupings",
		"Marshalled List",
		"Bill as introduced",
		"Bill as amended",
		"Bill as passed"
	]
	let shortTitle = ""
	for (let i = 0; i < blocks.length; i++) {
		const link = blocks[i].querySelector('a')
		if (!link) { continue }
		let displayName = link.textContent.trim()
		// ignore non-relevant docs
		const matchedKnownDoc =  billDocsKeywords.some(keyword => displayName.includes(keyword));
		if (!matchedKnownDoc) {
			continue;
		}
		const date = getDate(blocks[i])
		const dateObj = new Date(date)
		const year = dateObj.getFullYear()
		const url = urlCorrection(link.href) 
		let descriptor = ""
		displayName = displayName.replace(/\s*\([^()]*\)\s*$/, "")
		if (displayName.includes(" as ")) {
			const nameElements = displayName.split(" as ")
			shortTitle = nameElements[0].trim()
			const state = nameElements[1].trim()
			displayName = "Bill as " + state
			descriptor =  "as " + state
		}
		if (descriptor === "") {
			descriptor = displayName.toLowerCase()
		}
		const stage = getStage(blocks[i])
		let reference = "SP Bill " + billNumber
		if (stage > 1) {
				reference += getBillNumSuffix(stage - 1, displayName)
		}
		reference += " " + shortTitle
		reference += " [" + descriptor + "]"
		reference += " Session " + sessionObject.number
		reference += " (" + year + ")"
		addToResults(stage,displayName,date,url,reference)
	}
}

function urlCorrection(url) {
	let wrongDomain = ""
	if (url.indexOf('-/media') != -1) {
		wrongDomain = url.substring(0, url.indexOf('/-/media'))
	} else if (url.indexOf('/official-report/') != -1) {
		wrongDomain = url.substring(0, url.indexOf('/chamber-and-committees'))
	}
	return url.replace(wrongDomain, "https://www.parliament.scot")
}

function getDate(element) {
	const dateMatch = element.textContent.match(/\d{1,2} \w+ \d{4}/);
	const dateObj = new Date(dateMatch);
	return dateObj ? formatAsIsoDateLocal(dateObj) : null;
}

function getStage(element) {
	const ancestor = element.closest('[id^="target-"]')
	if (ancestor) {
		return ancestor.id.split("-")[1].trim()
	} else {
		return "?"
	}
}

async function downloadJsonOutput() {
	await mergeJson()
	const outputText = document.getElementById('output').textContent
	const blob = new Blob([outputText], { type: "application/json" })
	const url = URL.createObjectURL(blob)
	const a = document.createElement("a")
	a.href = url
	a.download = getDownloadName() + ".json" 
	document.body.appendChild(a) // Required for Firefox
	a.click()
	document.body.removeChild(a) // Clean up
	URL.revokeObjectURL(url)     // Free memory
}

async function downloadHtmlTable() {
	/* before returning to Github, comment out hard path in favour of relative */
	const templatePath = "parliamentary-history-scraper-output-table-template.html"
//	const templatePath = "https://frasergough.github.io/parliamentary-apps/parliamentary-history-scraper-output-table-template.html"
	let htmlContent = ""
	try {
		const response = await fetch(templatePath)
		if (!response.ok) {
			throw new Error(`Failed to fetch template`)
		}
		htmlContent = await response.text()
	} catch (err) {
		console.error("Error getting template", err)
	}
	if (htmlContent === "") { return }
	htmlContent = htmlContent.replace("{{BILL TITLE}}", billTitle)
	htmlContent = htmlContent.replace("{{TABLE}}", document.querySelector('#htmlOutput table').outerHTML)
	const blob = new Blob([htmlContent], { type: "text/html" });
	const url = URL.createObjectURL(blob)
	const a = document.createElement("a")
	a.href = url
	a.download = getDownloadName() + ".html"
	document.body.appendChild(a) // Required for Firefox
	a.click()
	document.body.removeChild(a) // Clean up
	URL.revokeObjectURL(url)     // Free memory
}

function getDownloadName() {
	const dateObj = new Date()
	const dateStr = formatAsIsoDateLocal(dateObj)
	if (billTitle === "") {
		billTitle = getBillTitle()
	}
	let plainTitle = billTitle.toLowerCase()
	plainTitle = plainTitle.replaceAll(" ","-")
	plainTitle = plainTitle.replaceAll("(","-")
	plainTitle = plainTitle.replaceAll(")","-")
	return dateStr + "_" + plainTitle + "_" + "parliamentary-history"
}

function test() {
	getDownloadName()
}

function getBillTitle() {
	let string = document.getElementById('output').textContent
	let endPos = string.indexOf("[as passed]")
	let startPos = string.lastIndexOf('"SP Bill', endPos)
	string = string.slice(startPos, endPos)
	stringArray = string.split(" ")
	string = ""
	for (let i = 3; i < stringArray.length; i++) {
		string += stringArray[i] + " "	
	}
	return string.trim()
}

function getSuffix(displayName) {
// returns reference suffix for formal bill docs
const lowerName = displayName.toLowerCase();
const rules = [
	{ match: "explanatory notes", suffix: "EN" },
	{ match: "financial memorandum", suffix: "FM" },
	{ match: "revised financial memorandum", suffix: "FM" },
	{ match: "supplementary financial memorandum", suffix: "FM" },
	{ match: "policy memorandum", suffix: "PM" },
	{ match: "delegated powers memorandum", suffix: "DPM" },
	{ match: "supplementary delegated powers memorandum", suffix: "DPM" },
	{ match: "groupings", suffix: "G" },
	{ match: "marshalled list", suffix: "ML" },
	];
const rule = rules.find(r => lowerName.includes(r.match));
return rule ? rule.suffix : null; // or fallback suffix
}

function findConsideringBody(element,stage) {
	let consideringBody = ""
	if (element.href.includes("/meeting-of-parliament-")) {
		consideringBody = "Chamber"
	} else {
		const dateBlock = element.closest('.bills-date-link-block')
		let currentBlock = dateBlock
		while (currentBlock) {
			const tag = currentBlock.tagName.toLowerCase()
			const currentBlockIsHeading = tag.startsWith('h') && tag.length === 2 && !isNaN(tag[1])
			const currentBlockText = currentBlock.textContent.toLowerCase()
			if (currentBlockIsHeading && currentBlockText.includes("committee")) {
				if (currentBlockText.includes("lead committee")) {
					consideringBody = leadCommittee
				} else {
					for (const [key, value] of cmtAbbrsDictionary.entries()) {
						if (currentBlockText.includes(value.toLowerCase())) {
							consideringBody = value
							break
						}
					}
				}
				break
			}
		currentBlock = currentBlock.previousElementSibling
		}
	}
	if (consideringBody === "" && stage === '2') {
		consideringBody = leadCommittee
	}
	return consideringBody
}


function formatDateToLongString(dateStr) {
// switches ISO date properties to citation format
	const date = new Date(dateStr);
	if (isNaN(date)) return null; // Invalid date

	const day = date.getDate(); // returns 1–31
	const month = date.toLocaleString('en-GB', { month: 'long' }); // "June"
	const year = date.getFullYear();

	return `${day} ${month} ${year}`;
}

function formatAsIsoDateLocal(date) {
// switches extracted dates to local date, to deal with losing hour due to timezone
	const yyyy = date.getFullYear();
	const mm = String(date.getMonth() + 1).padStart(2, '0'); // 0-based month
	const dd = String(date.getDate()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}`;
}

function getBillNumSuffix(stage, displayName) {
// adds a letter to the number of as-amended bills, e.g. no.A at stage 2, no.B at stage 3 etc.
	if (!displayName.includes("Marshalled List") && !displayName.includes("Groupings")) {
		return String.fromCharCode(64 + stage);
	} else {
		if (stage === 1) {
			return "";
		} else {
			return String.fromCharCode(64 + (stage - 1))
		}
	}
}

async function findBillReferenceByTitle(title) {
// gets the bill number by searching open data for most recent bill with extracted title
	const url = 'https://data.parliament.scot/api/bills/xml';

	try {
		const response = await fetch(url);
		const xmlText = await response.text();

		const parser = new DOMParser();
		const xmlDoc = parser.parseFromString(xmlText, "text/xml");

		const bills = Array.from(xmlDoc.getElementsByTagName("Bill"));

		// Search backwards
		for (let i = bills.length - 1; i >= 0; i--) {
			const bill = bills[i];
			const fullName = bill.getElementsByTagName("FullName")[0]?.textContent.trim();

			if (fullName === title) {
				let reference = bill.getElementsByTagName("Reference")[0]?.textContent.trim();
				reference = reference.replace("SP Bill","").trim();
				return reference;
			}
		}

		return null; // No match found
	} catch (err) {
		console.error("Error fetching or parsing XML:", err);
		return null;
	}
}

async function returnReportPageData(link) {
	const response = await fetch(link);
	const html = await response.text();
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, "text/html");
	console.log(doc);
}
