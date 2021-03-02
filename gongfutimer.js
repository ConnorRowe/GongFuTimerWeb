var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
function GeneratePresetContainerHTML(preset) {
    var container = "<div class='preset-container preset-container-" + preset.teaType + "'>\n";
    container += "<div class='preset-controls'>\n";
    container += "<span class='preset-delete' title='Delete'>&times;</span>\n";
    container += "<span class='preset-edit' title='Edit'>&hellip;</span>\n";
    container += "</div>\n";
    container += "<h2 class='preset-name'>" + preset.name + "</h2>\n";
    container += "<h3 class='preset-alt-name'> " + preset.altName + "</h3>\n";
    container += "<span class='preset-desc'>" + preset.description + "</span>\n";
    container += "<button class='fill-up-btn dark-btn preset-select-button' type='button'><div class='fill-up-bg dark-btn'></div><div class='fill-up-stream dark-btn'></div><span class='fill-up-txt dark-btn'>Apply</span></button>\n";
    container += "</div>\n";
    return container;
}
function AddPresetToDOM(preset, idOverride) {
    //get preset container div
    var presetCntnr = $("#presetsContainer");
    //add element to container
    presetCntnr.append(GeneratePresetContainerHTML(preset));
    var finalIndex = presetCntnr.children().length - 1;
    //get new preset card
    var newPresetCard = presetCntnr.children().eq(finalIndex);
    //get new preset's button element
    var newPresetBtn = newPresetCard.children(".preset-select-button");
    //override index for the preset id attributes
    if (idOverride != undefined) {
        finalIndex = idOverride;
    }
    //add the presetid attribute which holds the preset's index in the PRESETS array
    newPresetBtn.attr("presetid", finalIndex);
    //add click event to the button which gets its presetid attribute and passes it to the ApplyPreset function
    newPresetBtn.click(function (e) { ApplyPreset(parseInt(e.currentTarget.getAttribute("presetid"))); });
    //find preset controls div
    var newPresetControls = newPresetCard.children(".preset-controls");
    //find delete span
    var newPresetDelete = newPresetControls.children(".preset-delete");
    newPresetDelete.attr("presetid", finalIndex);
    //add click event
    newPresetDelete.click(function (e) { RemovePreset(e.target.parentElement.parentElement, parseInt(e.target.getAttribute("presetid"))); });
    //find edit span
    var newPresetEdit = newPresetControls.children(".preset-edit");
    newPresetEdit.attr("presetid", finalIndex);
    //add click event
    newPresetEdit.click(function (e) {
        CURRENTPRESETID = parseInt(e.currentTarget.getAttribute("presetid"));
        //open modal
        $("#newPresetModal").css("display", "block");
        //populate modal with the current preset's data
        var currentPreset = PRESETS[CURRENTPRESETID];
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
function RemovePreset(target, id) {
    //Find the right preset and remove it
    $("#presetsContainer").find(target).remove();
    //Remove preset data from the array
    PRESETS.splice(id, 1);
    //Overwrite cookies with new array data
    SavePresets();
}
function ApplyPreset(id) {
    var targetPreset = PRESETS[id];
    baseSecsInput.val(targetPreset.baseSecs);
    plusSecsInput.val(targetPreset.plusSecs);
    infNumInput.val(0);
    SaveLastTimer();
}
function NewPresetFromModal() {
    var newPreset = CreatePreset({ name: "", altName: "", description: "", temp: 0, amount: 0, baseSecs: 0, plusSecs: 0, infusions: 0, teaType: "" });
    //Read preset data from form inputs
    newPreset.name = $("#presetName").val();
    newPreset.altName = $("#presetAltName").val();
    newPreset.description = $("#presetDesc").val();
    newPreset.teaType = $("#presetTeaType").val();
    newPreset.temp = parseInt($("#presetTemp").val());
    newPreset.baseSecs = parseInt($("#presetBaseSecs").val());
    newPreset.plusSecs = parseInt($("#presetPlusSecs").val());
    newPreset.infusions = parseInt($("#presetInfusions").val());
    //Add new element
    var newElement;
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
    var presetsCookie = GetCookie("presets");
    //if the cookie doesnt exist do not continue
    if (presetsCookie == "" || presetsCookie == undefined) {
        return;
    }
    ;
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
    var lastTimer = { baseSecs: parseInt(baseSecsInput.val()), plusSecs: parseInt(plusSecsInput.val()), infusions: parseInt(infNumInput.val()) };
    SetCookie("lastTimer", JSON.stringify(lastTimer));
}
function LoadLastTimer() {
    //Loads last timer cookie and applies its values to the timer
    var timerCookie = GetCookie("lastTimer");
    if (timerCookie == "" || timerCookie == undefined) {
        return;
    }
    ;
    var lastTimer = JSON.parse(timerCookie);
    baseSecsInput.val(lastTimer.baseSecs);
    plusSecsInput.val(lastTimer.plusSecs);
    infNumInput.val(lastTimer.infusions);
}
function SetCookie(name, value) {
    var options = __assign({ path: '/', SameSite: "Strict", expires: "Fri, 31 Dec 9999 23:59:59 GMT" }, options);
    if (options.expires instanceof Date) {
        options.expires = options.expires.toUTCString();
    }
    var updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);
    for (var optionKey in options) {
        updatedCookie += "; " + optionKey;
        var optionValue = options[optionKey];
        if (optionValue !== true) {
            updatedCookie += "=" + optionValue;
        }
    }
    document.cookie = updatedCookie;
}
function GetCookie(name) {
    var matches = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}
//converts tea type names from the website's format into the local format
function ConvertURLTeaTypeToLocal(teaType) {
    switch (teaType) {
        case 'Ripened Tea':
            return 'ripe-puerh';
        case 'Blend':
            return 'blend';
        case 'Tisanes':
            return 'tisane';
        case 'Herbs':
            return 'medicinal';
        default: {
            //the rest can simply have the tea suffix removed and have spaces replaced with hyphens (Raw PuErh Tea => raw-puerh)
            return teaType.replace(' Tea', '').replace(' ', '-').toLowerCase();
        }
    }
}
function ImportFromURL() {
    var newDoc = document.implementation.createHTMLDocument("import");
    var newURL = urlImportInput.val();
    //clear any previous error
    urlImportError.html("");
    //load webpage from URL
    $.getJSON('https://www.whateverorigin.org/get?url=' + encodeURIComponent(newURL) + '&callback=?', function (data) {
        //write loaded data to the new document so it can be manipulated via jQuery
        newDoc.write(data.contents);
        //create new jQuery object for the new doc
        var jq2 = jQuery(newDoc);
        //test site
        var test = jq2.find('.brewing-instructions').length > 0;
        if (!test) {
            urlImportError.html("Invalid page!");
            return;
        }
        //find all of the elements containing the data we need to make a preset
        $("#presetName").val(jq2.find('.product-info__title').html());
        $("#presetAltName").val(jq2.find('.product-info__subtitle').html().trim());
        $("#presetDesc").val(jq2.find("meta[name=description]").attr("content").trim());
        $("#presetTeaType").val(ConvertURLTeaTypeToLocal(jq2.find('.container > ol').children().eq(1).find('a > span').html()));
        var brewGuideChildren = jq2.find('.brewing-instructions__tr').find('.brewing-instructions__value');
        var fullTemp = brewGuideChildren.eq(0).html();
        $("#presetTemp").val(parseInt(fullTemp.substring(0, fullTemp.indexOf('c') - 1)));
        $("#presetBaseSecs").val(parseInt(brewGuideChildren.eq(2).html()));
        $("#presetPlusSecs").val(parseInt(brewGuideChildren.eq(3).html()));
        $("#presetInfusions").val(parseInt(brewGuideChildren.eq(4).html()));
    })
        //Display error message if it fails
        .fail(function (jqXHR, status, error) { urlImportError.html('Error: ' + jqXHR.status + ': ' + jqXHR.statusText); });
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
var urlImportInput = $("#importURL");
var urlImportError = $(".error__label");
//Preset stuff
var PRESETS = new Array();
var CURRENTPRESETID = -1;
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
    btnNewPreset.click(function () {
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
        urlImportInput.val("");
        urlImportError.html("");
    });
    //close it
    span.click(function () {
        modal.css("display", "none");
        //reset CURRENTPRESETID so if the model is opened via the new preset button, it adds a new one instead of overwriting a previously edited one
        CURRENTPRESETID = -1;
    });
    //import from url
    $("#btnImportURL").click(ImportFromURL);
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
    var baseSecs = parseInt(baseSecsInput.val());
    var plusSecs = parseInt(plusSecsInput.val());
    var infNum = parseInt(infNumInput.val());
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