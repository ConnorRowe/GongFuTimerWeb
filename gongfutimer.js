var Timer = /** @class */ (function () {
    function Timer() {
        this.startTime = 0;
        this.endTime = 0;
        this.isRunning = false;
    }
    Timer.prototype.start = function () {
        this.startTime = TIME;
        this.isRunning = true;
    };
    Timer.prototype.stop = function () {
        this.endTime = TIME;
        this.isRunning = false;
    };
    Timer.prototype.elapsedMilliseconds = function () {
        var currentTime;
        if (this.isRunning) {
            currentTime = TIME;
        }
        else {
            currentTime = this.endTime;
        }
        return currentTime - this.startTime;
    };
    Timer.prototype.elapsedSeconds = function () {
        return this.elapsedMilliseconds() / 1000.0;
    };
    Timer.prototype.clear = function () {
        this.start();
        this.stop();
    };
    Timer.prototype.restart = function () {
        this.stop();
        this.start();
    };
    return Timer;
}());
/// GLOBALS
var KEYSTATE = new Array(); //check the defined keypress
var ISMOBILE = false; //if running on mobile
var CLIENTX; //Client click / press position
var CLIENTY; //^
//Timing
var TIME = 0; //total time ms
var DELTATIME = 0; //time difference between last frames
var TIMESECS = 0; //total time (in seconds)
var TIMEFRAC = 0; //time remainder in seconds (0.0 - 1.0)
var TARGETSECS = 0; //time calculated for the brew
var TEATIMER = new Timer(); //Timer object handling the actual tea timer
//Sound
var sndComplete = new Audio("audio/Alarm.wav");
function Main() {
    ISMOBILE = detectMob();
    // these listeners will keep track of keyboard presses
    document.addEventListener("keydown", function (evt) {
        KEYSTATE[evt.keyCode] = true;
    });
    //button up can then be used to delete the keystroke
    document.addEventListener("keyup", function (evt) {
        delete KEYSTATE[evt.keyCode];
    });
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
    $("#btnStart")[0].addEventListener("click", startTimer);
    $("#btnReset")[0].addEventListener("click", resetTimer);
    $("#time")[0].innerHTML = formatTimerOutput(0);
    $("#volumeSlider")[0].addEventListener("input", function (v) { sndComplete.volume = parseFloat(v.target.value); });
    //get new preset modal
    var modal = $("#newPresetModal");
    //get button to open it
    var btnNewPreset = $("#btnNewPreset")[0];
    //get close span
    var span = $(".close")[0];
    //open modal on click
    btnNewPreset.addEventListener("click", function () { modal.css("display", "block"); });
    span.addEventListener("click", function () { modal.css("display", "none"); });
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
        $("#time").html(formatTimerOutput(0));
        sndComplete.play();
    }
}
function Draw() {
    if (TEATIMER.isRunning) {
        //update timer display
        $("#time").html(formatTimerOutput(TARGETSECS - TEATIMER.elapsedSeconds()));
    }
}
function startTimer() {
    var baseSecs = parseInt($("#baseSecs")[0].value);
    var plusSecs = parseInt($("#plusSecs")[0].value);
    var infNum = parseInt($("#infNum")[0].value);
    TARGETSECS = baseSecs + (plusSecs * infNum);
    TEATIMER.start();
    infNum++;
    $("#infNum")[0].value = infNum.toString();
}
function resetTimer() {
    TEATIMER.stop();
    $("#time").html(formatTimerOutput(0));
    $("#infNum")[0].value = "0";
}
function detectMob() {
    if (navigator.userAgent.match(/Android/i) ||
        navigator.userAgent.match(/webOS/i) ||
        navigator.userAgent.match(/iPhone/i) ||
        navigator.userAgent.match(/iPad/i) ||
        navigator.userAgent.match(/iPod/i) ||
        navigator.userAgent.match(/BlackBerry/i) ||
        navigator.userAgent.match(/Windows Phone/i)) {
        return true;
    }
    else {
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
//# sourceMappingURL=gongfutimer.js.map