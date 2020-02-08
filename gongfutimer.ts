class Timer {
	startTime: number = 0;
	endTime: number = 0;
	isRunning: boolean = false;

	constructor() {
	}

	start() {
		this.startTime = TIME;
		this.isRunning = true;
	}

	stop() {
		this.endTime = TIME;
		this.isRunning = false;
	}

	elapsedMilliseconds(): number {
		let currentTime: number;

		if (this.isRunning) {
			currentTime = TIME;
		} else {
			currentTime = this.endTime;
		}

		return currentTime - this.startTime;
	}

	elapsedSeconds(): number {
		return this.elapsedMilliseconds() / 1000.0;
	}

	clear() {
		this.start();
		this.stop();
	}

	restart() {
		this.stop();
		this.start();
	}
}

interface Preset {
	name: string;
	altName: string;
	description: string;
	temp: number;
	amount: number;
	baseSecs: number;
	plusSecs: number;
	infusions: number;
	teaType: string;
}

function CreatePreset(config: Preset): { name: string; altName: string; description: string; temp: number; amount: number; baseSecs: number; plusSecs: number; infusions: number; teaType: string } {
	const newPreset: Preset = { name: config.name, altName: config.altName, description: config.description, temp: config.temp, amount: config.amount, baseSecs: config.baseSecs, plusSecs: config.plusSecs, infusions: config.infusions, teaType: config.teaType };

	return newPreset;
}

function GeneratePresetContainerHTML(preset: Preset) {
	let container: string = "<div class='preset-container preset-container-" + preset.teaType + "'>\n";
	container += "<span class='preset-delete'>&times;</span>\n";
	container += "<h2 class='preset-name'>" + preset.name + "</h2>\n";
	container += "<h3 class='preset-alt-name'> " + preset.altName + "</h3>\n";
	container += "<span class='preset-desc'>" + preset.description + "</span>\n";
	container += "<button type='button' class='preset-select-button'>Apply</button>\n"
	container += "</div>\n";

	return container;
}

function AddPresetToDOM(preset: Preset) {
	//get preset container div
	const presetCntnr = $("#presetsContainer");
	//add element to container
	presetCntnr.append(GeneratePresetContainerHTML(preset));
	const finalIndex: number = presetCntnr.children().length - 1;
	//get new preset's button element
	const newPresetBtn = presetCntnr.children().eq(finalIndex).children(".preset-select-button");
	//add the presetid attribute which holds the preset's index in the PRESETS array
	newPresetBtn.attr("presetid", finalIndex);
	//add click event to the button which gets its presetid attribute and passes it to the ApplyPreset function
	newPresetBtn.click((e) => { ApplyPreset(parseInt(e.target.getAttribute("presetid"))); })
	//find delete span
	const newPresetDelete = presetCntnr.children().eq(finalIndex).children(".preset-delete");
	newPresetDelete.attr("presetid", finalIndex);
	//add click event
	newPresetDelete.click((e) => { RemovePreset(e.target.parentElement, parseInt(e.target.getAttribute("presetid"))); });
}

function RemovePreset(target: HTMLElement, id: number) {
	//Find the right preset and remove it
	$("#presetsContainer").find(target).remove();
	//Remove preset data from the array
	PRESETS.splice(id);
	//Overwrite cookies with new array data
	SavePresets();
}

function ApplyPreset(id: number) {
	const targetPreset: Preset = PRESETS[id];

	baseSecsInput.val(targetPreset.baseSecs);
	plusSecsInput.val(targetPreset.plusSecs);
	infNumInput.val(0);
}

function NewPresetFromModal() {
	let newPreset: Preset = CreatePreset({ name: "", altName: "", description: "", temp: 0, amount: 0, baseSecs: 0, plusSecs: 0, infusions: 0, teaType: "" })

	//Read preset data from form inputs
	newPreset.name = <string>$("#presetName").val();
	newPreset.altName = <string>$("#presetAltName").val();
	newPreset.description = <string>$("#presetDesc").val();
	newPreset.teaType = <string>$("#presetTeaType").val();
	newPreset.temp = parseInt(<string>$("#presetTemp").val());
	newPreset.baseSecs = parseInt(<string>$("#presetBaseSecs").val());
	newPreset.plusSecs = parseInt(<string>$("#presetPlusSecs").val());
	newPreset.infusions = parseInt(<string>$("#presetInfusions").val());

	//Add to array
	PRESETS.push(newPreset);
	//Save to cookies
	SavePresets();

	//Add new element
	AddPresetToDOM(newPreset);

	//Hide modal
	$("#newPresetModal").css("display", "none");
}

function SavePresets() {
	//convert the PRESETS array into JSON in cookie format and save to document cookies
	const presetsJSON = "presets=" + JSON.stringify(PRESETS) + "; expires=Fri, 31 Dec 9999 23:59:59 GMT";
	document.cookie = presetsJSON;
}

function LoadPresets() {
	//Empty the preset container
	$("#presetsContainer").empty();

	//load Preset data from the document cookies into array
	PRESETS = JSON.parse(document.cookie.replace(/(?:(?:^|.*;\s*)presets\s*\=\s*([^;]*).*$)|^.*$/, "$1"));

	//create HTML elements for each preset in the array
	for (var i = 0; i < PRESETS.length; i++) {
		AddPresetToDOM(PRESETS[i]);
	}
}

/// GLOBALS
var KEYSTATE: boolean[] = new Array<boolean>();		//check the defined keypress
var ISMOBILE: boolean = false;						//if running on mobile
var CLIENTX: number;								//Client click / press position
var CLIENTY: number;								//^

//Timing
var TIME: number = 0;								//total time ms
var DELTATIME: number = 0;							//time difference between last frames
var TIMESECS: number = 0;							//total time (in seconds)
var TIMEFRAC: number = 0;							//time remainder in seconds (0.0 - 1.0)
var TARGETSECS: number = 0;							//time calculated for the brew
var TEATIMER: Timer = new Timer();					//Timer object handling the actual tea timer

//Sound
const sndComplete: HTMLAudioElement = new Audio("audio/Alarm.wav");

//Frequently modified elements
const baseSecsInput: JQuery<HTMLInputElement> = <JQuery<HTMLInputElement>>$("#baseSecs");
const plusSecsInput: JQuery<HTMLInputElement> = <JQuery<HTMLInputElement>>$("#plusSecs");
const infNumInput: JQuery<HTMLInputElement> = <JQuery<HTMLInputElement>>$("#infNum");
const timerText: JQuery<HTMLHeadingElement> = <JQuery<HTMLHeadingElement>>$("#time");

//Preset stuff
var PRESETS: Preset[] = new Array<Preset>();
//Adding presets manually for testing purposes before the form is implemented
PRESETS.push(CreatePreset({ name: "Souchong Liquour", altName: "Tong Mu Zhengshan Xiaozhong", description: "An unsmoked Lapsang that shows the true depth of flavour of this famous tea. Dark cocoa, charred bourbon casks and rambutan.", temp: 90, amount: 5, baseSecs: 15, plusSecs: 5, infusions: 5, teaType: "black" }));
PRESETS.push(CreatePreset({ name: "Imperial Green - Pre Qing Ming", altName: "Long Jing - Dragonwell", description: "Pre Qing Ming harvest of one of China’s most famous teas. Deep, rich and aromatic with roasted borlotti beans, sweet limoncello and strawberry jam aromatics.", temp: 80, amount: 5, baseSecs: 15, plusSecs: 5, infusions: 5, teaType: "green" }));
PRESETS.push(CreatePreset({ name: "Amber Mountain", altName: "Huo Shan Huang Ya", description: "Smooth and elegant tea made in small batches. Morning dew, fresh cut grass, green beans with a light and warming pear sweetness.", temp: 70, amount: 5, baseSecs: 45, plusSecs: 10, infusions: 5, teaType: "yellow" }));
PRESETS.push(CreatePreset({ name: "Alishan Cream", altName: "Alishan Jin Xuan", description: "A rich and luxurious tea made from the naturally milky Jin Xuan cultivar. Malted milkshake, high mountain grass, alpine rhododendrons and cream.", temp: 95, amount: 6, baseSecs: 20, plusSecs: 5, infusions: 9, teaType: "oolong" }));

function Main() {
	ISMOBILE = detectMob();

	// these listeners will keep track of keyboard presses
	document.addEventListener("keydown", function (evt) {
		KEYSTATE[evt.keyCode] = true;
	})

	//button up can then be used to delete the keystroke
	document.addEventListener("keyup", function (evt) {
		delete KEYSTATE[evt.keyCode];
	})

	document.addEventListener("touchstart", function (evt) { }, false);

	document.addEventListener("touchend", function (evt) {
		//cache coords
		CLIENTX = null;
		CLIENTY = null;
	}, false);

	document.addEventListener("touchcancel", function (evt) {
		//cache coords
		CLIENTX = null;
		CLIENTY = null;
	}, false);

	document.addEventListener("mousedown", function (evt) { }, false);

	document.addEventListener("mouseup", function (evt) {
		//cache coords
		CLIENTX = null;
		CLIENTY = null;
	}, false);

	//resize mobile canvas size
	document.addEventListener("orientationchange", function (evt) { }, false);
	window.addEventListener("resize", function (evt) { }, false);

	//Bind button click events
	$("#btnStart").click(startTimer);
	$("#btnReset").click(resetTimer);

	//Set timer display to 00:00:00
	timerText.html(formatTimerOutput(0));

	//Bind volume slider input event to set the volume of the alarm sound
	$("#volumeSlider").bind("input", (v) => { sndComplete.volume = parseFloat((<HTMLInputElement>v.target).value); })

	//get new preset modal
	const modal = $("#newPresetModal");
	//get button to open it
	const btnNewPreset = $("#btnNewPreset");
	//get close span
	const span = $(".close");

	//open modal on click
	btnNewPreset.click(() => { modal.css("display", "block"); });
	//close it
	span.click(() => { modal.css("display", "none"); });

	//create new preset on cick
	$("#btnCreatePreset").click(NewPresetFromModal);

	LoadPresets();

	//and here we begin the frame loop
	window.requestAnimationFrame(Loop);
}

//loop function
function Loop(timeStamp) {
	DELTATIME = (timeStamp - TIME);
	TIME = timeStamp;
	TIMESECS = (TIME / 1000);
	TIMEFRAC = TIMESECS % 1;

	Update();
	Draw();
	//this loops the "animation" of the document, the max is 60fps
	window.requestAnimationFrame(Loop);
}


function Update() {
	if (TARGETSECS - TEATIMER.elapsedSeconds() <= 0 && TEATIMER.isRunning) {
		//Timer complete
		TEATIMER.stop();
		timerText.html(formatTimerOutput(0));
		sndComplete.play();
	}
}

function Draw() {
	if (TEATIMER.isRunning) {
		//update timer display
		timerText.html(formatTimerOutput(TARGETSECS - TEATIMER.elapsedSeconds()));
	}
}

function startTimer() {
	const baseSecs: number = parseInt(<string>baseSecsInput.val());
	const plusSecs: number = parseInt(<string>plusSecsInput.val());
	let infNum: number = parseInt(<string>infNumInput.val());

	TARGETSECS = baseSecs + (plusSecs * infNum);
	TEATIMER.start();

	infNum++;
	infNumInput.val(infNum);
}

function resetTimer() {
	TEATIMER.stop();
	timerText.html(formatTimerOutput(0));
	infNumInput.val(0);
}

function detectMob() {
	if (navigator.userAgent.match(/Android/i) ||
		navigator.userAgent.match(/webOS/i) ||
		navigator.userAgent.match(/iPhone/i) ||
		navigator.userAgent.match(/iPad/i) ||
		navigator.userAgent.match(/iPod/i) ||
		navigator.userAgent.match(/BlackBerry/i) ||
		navigator.userAgent.match(/Windows Phone/i)
	) {
		return true;
	} else {
		return false;
	}
}

function formatTimerOutput(time) {
	let minutes = 0;
	let seconds = time;
	let milliseconds = 0.0;

	if (seconds >= 60) {
		minutes = seconds / 60;
		minutes = Math.floor(minutes);
		seconds -= minutes * 60;
	}

	milliseconds = (seconds - Math.floor(seconds)) * 100;
	seconds = Math.floor(seconds);
	milliseconds = Math.floor(milliseconds);

	let m = minutes.toString();
	let s = seconds.toString();
	let ms = milliseconds.toString();

	if (minutes < 10) {
		m = "0" + m;
	}
	if (seconds < 10) {
		s = "0" + s;
	}
	if (milliseconds < 10) {
		ms = "0" + ms;
	}

	return m.concat(":", s, ":", ms);
}

Main();