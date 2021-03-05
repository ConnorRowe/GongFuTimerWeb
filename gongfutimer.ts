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

interface TimerVals {
	baseSecs: number;
	plusSecs: number;
	infusions: number;
}

function CreatePreset(config: Preset): { name: string; altName: string; description: string; temp: number; amount: number; baseSecs: number; plusSecs: number; infusions: number; teaType: string } {
	const newPreset: Preset = { name: config.name, altName: config.altName, description: config.description, temp: config.temp, amount: config.amount, baseSecs: config.baseSecs, plusSecs: config.plusSecs, infusions: config.infusions, teaType: config.teaType };

	return newPreset;
}

function GeneratePresetContainerHTML(preset: Preset): JQuery<HTMLElement> {

	return $([
		"<div class='preset-container preset-container-" + preset.teaType + "'>",
			"<div class='preset-controls'>",
				"<span class='preset-delete' title='Delete'>&times;</span>",
				"<span class='preset-delete' title='Delete'>&times;</span>",
				"<span class='preset-edit' title='Edit'>&hellip;</span>",
			"</div>",
			"<h2 class='preset-name'>" + preset.name + "</h2>",
			"<h3 class='preset-alt-name'> " + preset.altName + "</h3>",
			"<span class='preset-desc'>" + preset.description + "</span>",
			"<button class='fill-up-btn dark-btn preset-select-button' type='button'><div class='fill-up-bg dark-btn'></div><div class='fill-up-stream dark-btn'></div><span class='fill-up-txt dark-btn'>Apply</span></button>",
		"</div>"
	].join("\n"));
}

function AddPresetToDOM(preset: Preset, idOverride?: number): JQuery<HTMLElement> {
	//get preset container div
	const presetCntnr = $("#presetsContainer");
	//add element to container
	presetCntnr.append(GeneratePresetContainerHTML(preset));
	let finalIndex: number = presetCntnr.children().length - 1;
	//get new preset card
	const newPresetCard: JQuery<HTMLElement> = presetCntnr.children().eq(finalIndex);
	//get new preset's button element
	const newPresetBtn = newPresetCard.children(".preset-select-button");
	//override index for the preset id attributes
	if (idOverride != undefined) {
		finalIndex = idOverride;
	}
	//add the presetid attribute which holds the preset's index in the PRESETS array
	newPresetBtn.attr("presetid", finalIndex);
	//add click event to the button which gets its presetid attribute and passes it to the ApplyPreset function
	newPresetBtn.click((e) => { ApplyPreset(parseInt(e.currentTarget.getAttribute("presetid"))); })
	//find preset controls div
	const newPresetControls = newPresetCard.children(".preset-controls");
	//find delete span
	const newPresetDelete = newPresetControls.children(".preset-delete");
	newPresetDelete.attr("presetid", finalIndex);
	//add click event
	newPresetDelete.click((e) => { RemovePreset(e.target.parentElement.parentElement, parseInt(e.target.getAttribute("presetid"))); });
	//find edit span
	const newPresetEdit = newPresetControls.children(".preset-edit");
	newPresetEdit.attr("presetid", finalIndex);
	//add click event
	newPresetEdit.click((e) => {
		CURRENTPRESETID = parseInt(e.currentTarget.getAttribute("presetid"));
		//open modal
		$("#newPresetModal").css("display", "block");
		//populate modal with the current preset's data
		const currentPreset = PRESETS[CURRENTPRESETID];
		$("#presetName").val(currentPreset.name);
		$("#presetAltName").val(currentPreset.altName);
		$("#presetDesc").val(currentPreset.description);
		$("#presetTeaType").val(currentPreset.teaType);
		$("#presetTemp").val(currentPreset.temp);
		$("#presetBaseSecs").val(currentPreset.baseSecs);
		$("#presetPlusSecs").val(currentPreset.plusSecs);
		$("#presetInfusions").val(currentPreset.infusions);
	});

	return newPresetCard;
}

function RemovePreset(target: HTMLElement, id: number) {
	//Find the right preset and remove it
	$("#presetsContainer").find(target).remove();
	//Remove preset data from the array
	PRESETS.splice(id, 1);
	//Overwrite cookies with new array data
	SavePresets();
}

function ApplyPreset(id: number) {
	const targetPreset: Preset = PRESETS[id];

	baseSecsInput.val(targetPreset.baseSecs);
	plusSecsInput.val(targetPreset.plusSecs);
	infNumInput.val(0);

	SaveLastTimer();
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

	//Add new element
	let newElement: JQuery<HTMLElement>;

	if (CURRENTPRESETID < 0) {
		//Add new preset to array
		PRESETS.push(newPreset);
		newElement = AddPresetToDOM(newPreset);
	}
	else {
		//get the preset to be edited
		PRESETS[CURRENTPRESETID] = newPreset;

		//Override the card's ID attributes
		newElement = AddPresetToDOM(newPreset, CURRENTPRESETID);

		//replace the old element with a new version with updated data
		$("#presetsContainer").children().eq(CURRENTPRESETID).replaceWith(newElement);

		//reset CURRENTPRESETID
		CURRENTPRESETID = -1;
	}

	//Save to cookies
	SavePresets();

	//Hide modal
	$("#newPresetModal").css("display", "none");
}

function SavePresets() {
	//convert the PRESETS array into JSON in cookie format and save to document cookies
	SetCookie("presets", JSON.stringify(PRESETS));
}

function LoadPresets() {
	//Empty the preset container
	$("#presetsContainer").empty();

	//load Preset data from the document cookies into array
	const presetsCookie = GetCookie("presets");

	//if the cookie doesnt exist do not continue
	if (presetsCookie == "" || presetsCookie == undefined) { return; };

	PRESETS = JSON.parse(presetsCookie);

	//create HTML elements for each preset in the array
	for (var i = 0; i < PRESETS.length; i++) {
		if (PRESETS[i] != null) {
			AddPresetToDOM(PRESETS[i]);
		}
	}
}

function SaveLastTimer() {
	//Saves the last used timer values to doc cookies
	const lastTimer: TimerVals = { baseSecs: parseInt(<string>baseSecsInput.val()), plusSecs: parseInt(<string>plusSecsInput.val()), infusions: parseInt(<string>infNumInput.val()) };

	SetCookie("lastTimer", JSON.stringify(lastTimer));
}

function LoadLastTimer() {
	//Loads last timer cookie and applies its values to the timer
	const timerCookie = GetCookie("lastTimer");
	if (timerCookie == "" || timerCookie == undefined) { return; };

	const lastTimer: TimerVals = JSON.parse(timerCookie);
	baseSecsInput.val(lastTimer.baseSecs);
	plusSecsInput.val(lastTimer.plusSecs);
	infNumInput.val(lastTimer.infusions);
}

function SetCookie(name: string, value: string) {
	var options = {
		path: '/',
		SameSite: "Strict",
		expires: "Fri, 31 Dec 9999 23:59:59 GMT",
		// add other defaults here if necessary
		...options
	};

	if (options.expires instanceof Date) {
		options.expires = options.expires.toUTCString();
	}

	let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);

	for (let optionKey in options) {
		updatedCookie += "; " + optionKey;
		let optionValue = options[optionKey];
		if (optionValue !== true) {
			updatedCookie += "=" + optionValue;
		}
	}

	document.cookie = updatedCookie;
}

function GetCookie(name: string): string {
	let matches = document.cookie.match(new RegExp(
		"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
	));

	return matches ? decodeURIComponent(matches[1]) : undefined;
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
var CURRENTPRESETID: number = -1;

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
	btnNewPreset.click(() => {
		modal.css("display", "block");
		//clear modal inputs
		$("#presetName").val("");
		$("#presetAltName").val("");
		$("#presetDesc").val("");
		$("#presetTeaType").val("");
		$("#presetTemp").val("");
		$("#presetBaseSecs").val("");
		$("#presetPlusSecs").val("");
		$("#presetInfusions").val("");
	});
	//close it
	span.click(() => {
		modal.css("display", "none");
		//reset CURRENTPRESETID so if the model is opened via the new preset button, it adds a new one instead of overwriting a previously edited one
		CURRENTPRESETID = -1;
	});

	//create new preset on cick
	$("#btnCreatePreset").click(NewPresetFromModal);

	LoadPresets();

	LoadLastTimer();

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

	SaveLastTimer();
}

function resetTimer() {
	TEATIMER.stop();
	timerText.html(formatTimerOutput(0));
	infNumInput.val(0);

	SaveLastTimer();
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