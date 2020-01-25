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
		var currentTime: number;

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

	document.getElementById("btnStart").addEventListener("click", startTimer);
	document.getElementById("btnReset").addEventListener("click", resetTimer);

	document.getElementById("time").innerHTML = formatTimerOutput(0);

	document.getElementById("volumeSlider").addEventListener("input", (v) => { sndComplete.volume = parseFloat((<HTMLInputElement>v.target).value); })

	//and here we begin the frame loop
	window.requestAnimationFrame(Loop);

	sndComplete.volume;
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
		document.getElementById("time").innerHTML = formatTimerOutput(0);
		sndComplete.play();
	}
}

function Draw() {
	if (TEATIMER.isRunning) {
		//update timer display
		document.getElementById("time").innerHTML = formatTimerOutput(TARGETSECS - TEATIMER.elapsedSeconds());
	}
}

function startTimer() {
	var baseSecs: number = parseInt((<HTMLInputElement>document.getElementById("baseSecs")).value);
	var plusSecs: number = parseInt((<HTMLInputElement>document.getElementById("plusSecs")).value);
	var infNum: number = parseInt((<HTMLInputElement>document.getElementById("infNum")).value);

	TARGETSECS = baseSecs + (plusSecs * infNum);
	TEATIMER.start();

	infNum++;
	(<HTMLInputElement>document.getElementById("infNum")).value = infNum.toString();
}

function resetTimer() {
	TEATIMER.stop();
	document.getElementById("time").innerHTML = formatTimerOutput(0);
	(<HTMLInputElement>document.getElementById("infNum")).value = "0";
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
	var minutes = 0;
	var seconds = time;
	var milliseconds = 0.0;

	if (seconds >= 60) {
		minutes = seconds / 60;
		minutes = Math.floor(minutes);
		seconds -= minutes * 60;
	}

	milliseconds = (seconds - Math.floor(seconds)) * 100;
	seconds = Math.floor(seconds);
	milliseconds = Math.floor(milliseconds);

	var m = minutes.toString();
	var s = seconds.toString();
	var ms = milliseconds.toString();

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