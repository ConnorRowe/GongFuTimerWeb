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
function CreatePreset(config) {
    var newPreset = { name: config.name, altName: config.altName, description: config.description, temp: config.temp, amount: config.amount, baseSecs: config.baseSecs, plusSecs: config.plusSecs, infusions: config.infusions, teaType: config.teaType };
    return newPreset;
}
function GeneratePresetContainer(preset) {
    var container = "<div class='preset-container preset-container-" + preset.teaType + "'>\n";
    container += "<h2 class='preset-name'>" + preset.name + "</h2>\n";
    container += "<h3 class='preset-alt-name'> " + preset.altName + "</h3>\n";
    container += "<span class='preset-desc'>" + preset.description + "</span>\n";
    container += "<button type='button' class='preset-select-button'>Apply</button>\n";
    container += "</div>\n";
    return container;
}
function ApplyPreset(id) {
    var targetPreset = PRESETS[id];
    baseSecsInput.val(targetPreset.baseSecs);
    plusSecsInput.val(targetPreset.plusSecs);
    infNumInput.val(0);
}
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
//Frequently modified elements
var baseSecsInput = $("#baseSecs");
var plusSecsInput = $("#plusSecs");
var infNumInput = $("#infNum");
var timerText = $("#time");
//Preset stuff
var PRESETS = new Array();
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
    //Bind button click events
    $("#btnStart").click(startTimer);
    $("#btnReset").click(resetTimer);
    //Set timer display to 00:00:00
    timerText.html(formatTimerOutput(0));
    //Bind volume slider input event to set the volume of the alarm sound
    $("#volumeSlider").bind("input", function (v) { sndComplete.volume = parseFloat(v.target.value); });
    //get new preset modal
    var modal = $("#newPresetModal");
    //get button to open it
    var btnNewPreset = $("#btnNewPreset");
    //get close span
    var span = $(".close");
    //open modal on click
    btnNewPreset.click(function () { modal.css("display", "block"); });
    span.click(function () { modal.css("display", "none"); });
    //get preset container div
    var presetCntnr = $("#presetsContainer");
    //convert the PRESETS array into JSON in cookie format and save to document cookies
    var presetsJSON = "presets=" + JSON.stringify(PRESETS) + "; expires=Fri, 31 Dec 9999 23:59:59 GMT";
    document.cookie = presetsJSON;
    //load Preset data from the document cookies into an array
    var loadedPresets = JSON.parse(document.cookie.replace(/(?:(?:^|.*;\s*)presets\s*\=\s*([^;]*).*$)|^.*$/, "$1"));
    //create HTML elements for each preset in the array
    for (var i = 0; i < loadedPresets.length; i++) {
        //add element to container
        presetCntnr.append(GeneratePresetContainer(loadedPresets[i]));
        //get new preset's button element
        var newPresetBtn = presetCntnr.children().eq(i).children(".preset-select-button");
        //add the presetid attribute which holds the preset's index in the PRESETS array
        newPresetBtn.attr("presetid", i);
        //add click event to the button which gets its presetid attribute and passes it to the ApplyPreset function
        newPresetBtn.click(function (e) { ApplyPreset(parseInt(e.target.getAttribute("presetid"))); });
    }
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
    var baseSecs = parseInt(baseSecsInput.val());
    var plusSecs = parseInt(plusSecsInput.val());
    var infNum = parseInt(infNumInput.val());
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