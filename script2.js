(function () {

/* =========================
BASIC SAFETY (RetroZilla)
========================= */

if (!window.console) {
window.console = { log: function () {} };
}

if (!window.JSON) {
window.JSON = {
parse: function (s) {
return eval("(" + s + ")");
}
};
}

/* =========================
CONFIG
========================= */

var LAT = 40.638421;
var LNG = -73.978643;

var pt = null;

if (typeof PrayTime !== "undefined") {
pt = new PrayTime();
pt.setCalcMethod(pt.ISNA);

pt.setAsrMethod(1);
pt.setTimeFormat(pt.Time12);
}

/* =========================
DATE DISPLAY
========================= */

function updateDate() {
var d = new Date();

var months = [
"January","February","March","April","May","June",
"July","August","September","October","November","December"
];

var el = document.getElementById("current-date-display");
if (el) {
el.innerHTML =
months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
}
}

/* =========================
RENDER
========================= */

function set(id, val) {
var el = document.getElementById(id);
if (el) el.innerHTML = val || "--:--";
}

function render(times) {
set("fajr-athan", times.Fajr);
set("dhuhr-athan", times.Dhuhr);
set("asr-athan", times.Asr);
set("maghrib-athan", times.Maghrib);
set("maghrib-iqamah", times.Maghrib);
set("isha-athan", times.Isha);
}

/* =========================
PRAYER CALCULATION (ONLY MODE)
========================= */

function run() {
if (!pt) return;

var now = new Date();
var tz = -now.getTimezoneOffset() / 60;

var t = pt.getPrayerTimes(now, LAT, LNG, tz);

render({
Fajr: t[0],
Dhuhr: t[2],
Asr: t[3],
Maghrib: t[5],
Isha: t[6]
});

console.log("RetroZilla mode: PrayTime.js active");
}

/* =========================
INIT
========================= */

function init() {
updateDate();
run();
}

if (document.addEventListener) {
document.addEventListener("DOMContentLoaded", init);
} else {
window.onload = init;
}

})();
