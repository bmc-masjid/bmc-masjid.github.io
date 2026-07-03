      var isIE = !!document.documentMode; // true for IE8–11
var ieVersion = document.documentMode || 999;
var isIE9 = ieVersion === 9;
var isLegacyIE = ieVersion < 10;
                                
      if (!window.JSON) {
    window.JSON = {
        parse: function (s) {
            return eval('(' + s + ')');
        }
    };
      if (!window.console) {
    window.console = { log: function() {} };
}
      
}
    (function() {
      
      var pt = new PrayTime();
pt.setCalcMethod(pt.ISNA);
      
      pt.setTimeFormat(pt.Time12);
        // Brooklyn Kensington Coordinates & Configuration
        var LATITUDE = 40.638421;
        var LONGITUDE = -73.978643;
        
        var FAJR_ANGLE = 15.0; // ISNA/North America standard calculation parameter
        var ISHA_ANGLE = 15.0; 

        var d = new Date();
        var year = d.getFullYear();
        var month = d.getMonth() + 1;
        var day = d.getDate();

        // Update visual interface calendar UI elements
        var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        var displayElement = document.getElementById('current-date-display');
        if(displayElement) {
            displayElement.innerHTML = monthNames[d.getMonth()] + " " + day + ", " + year;
        }

        // Detect timezone context offset reliably across platforms
var jan = new Date(year, 0, 1);
var jul = new Date(year, 6, 1);

var stdOffset = Math.max(
    jan.getTimezoneOffset(),
    jul.getTimezoneOffset()
);

var dst = d.getTimezoneOffset() < stdOffset ? 1 : 0;

var timeZoneOffsetHours =
    -new Date().getTimezoneOffset() / 60;
        // Try using Modern Api Framework via Fetch Engine first
      var apiURL = 'https://api.aladhan.com/v1/timings/' + day + '-' + month + '-' + year +
             '?latitude=' + LATITUDE + '&longitude=' + LONGITUDE + '&method=2';
      if (isLegacyIE) {
    runLegacyCalculation();
} else {
getJSON(apiURL);
      }     
function getJSON(url, success, fail) {
                                      
    try {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    var json = JSON.parse(xhr.responseText);
                    success(json);
                } else {
                    if (fail) fail();
                }
            }
        };

        xhr.send();
    } catch (e) {
        if (fail) fail();
    }
}
                 
getJSON(apiURL,
    function (json) {
        if (json && json.data && json.data.timings) {
            var times = json.data.timings;

            renderTimes({
                Fajr: convert24To12(times.Fajr),
                Dhuhr: convert24To12(times.Dhuhr),
                Asr: convert24To12(times.Asr),
                Maghrib: convert24To12(times.Maghrib),
                Isha: convert24To12(times.Isha)
            }, "API");
        } else {
            runLegacyCalculation();
        }
    },
    function () {
        runLegacyCalculation();
    }
);
                                           var now = new Date();

function getTZ() {
    return -(now.getTimezoneOffset() / 60);
}
               
    function runLegacyCalculation() {
    var tz = getTZ();

    var times = pt.getPrayerTimes(
        new Date(),
        40.638421,     // Brooklyn latitude
        -73.978643,    // Brooklyn longitude
        tz
    );

    renderTimes({
        Fajr: times[0],
        Sunrise: times[1],
        Dhuhr: times[2],
        Asr: times[3],
        Maghrib: times[5],
        Isha: times[6]
    }, "PrayTimes.js");
}
    /*    function renderTimes(timesObj, driverName) {
            document.getElementById('fajr-athan').innerHTML = timesObj.Fajr;
            document.getElementById('dhuhr-athan').innerHTML = timesObj.Dhuhr;
            document.getElementById('asr-athan').innerHTML = timesObj.Asr;
 var maghrib = timesObj.Maghrib || "--:--";

document.getElementById('maghrib-athan').innerHTML = maghrib;
document.getElementById('maghrib-iqamah').innerHTML = maghrib;
            document.getElementById('isha-athan').innerHTML = timesObj.Isha;
            
if (window.console && console.log) {
                                           console.log("Prayer times successfully rendered via: " + driverName);
            }
        } */

        function convert24To12(timeStr) {
            if(!timeStr) return "--:--";
            var parts = timeStr.split(':');
            var hours = parseInt(parts[0], 10);
            var minutes = parts[1].substring(0, 2);
            var suffix = hours >= 12 ? ' PM' : ' AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // conversion element rule for 0 hour flag
            return hours + ':' + minutes + suffix;
        }

        /* --- HIGH ACCURACY MATHEMATICAL ENGINE ---
           Calculates astronomical prayer occurrences conforming precisely to localized coordinates
        */
        function calculatePrayerTimesEngine(yr, mo, dy, lat, lng, tz) {
            if (mo === 1 || mo === 2) {
                yr = yr - 1;
                mo = mo + 12;
            }
            
            // Core Julian Calendar Epoch Operations
            var A = Math.floor(yr / 100);
            var B = 2 - A + Math.floor(A / 4);
            var JD = Math.floor(365.25 * (yr + 4716)) + Math.floor(30.6001 * (mo + 1)) + dy + B - 1524.5;
            
            var dJD = JD - 2451545.0; // Century calculation component threshold tracking
            
            // Solar Position Coordinates Math Formulas 
            var g = fixAngle(357.529 + 0.98560028 * dJD);
            var q = fixAngle(280.459 + 0.98564736 * dJD);
            var L = fixAngle(q + 1.915 * Math.sin(degToRad(g)) + 0.020 * Math.sin(degToRad(2 * g)));
            
            var R = 1.00014 - 0.01671 * Math.cos(degToRad(g)) - 0.00014 * Math.cos(degToRad(2 * g));
            var e = 23.439 - 0.00000036 * dJD;
            
            var RA = radToDeg(Math.atan2(Math.cos(degToRad(e)) * Math.sin(degToRad(L)), Math.cos(degToRad(L)))) / 15;
            RA = fixHour(RA);
            
            var Decl = radToDeg(Math.asin(Math.sin(degToRad(e)) * Math.sin(degToRad(L))));
            var EqT = q / 15 - RA;
            
            // Compute Midday Dynamic Meridian (Dhuhr)
            var midDay = fixHour(12 + tz - lng / 15 - EqT);
            
            // Twilight Horizon Hour Calculations
            var fajrHourValue = midDay - regularT(FAJR_ANGLE, lat, Decl) / 15;
            var ishaHourValue = midDay + regularT(ISHA_ANGLE, lat, Decl) / 15;
            
            // Asr Mathematical Derivation via Shadow Length Standard
var asrFactor = 1; // Shafi, Maliki, Hanbali
var angle = -radToDeg(
    Math.atan(
        1 / (asrFactor + Math.tan(Math.abs(degToRad(lat - Decl))))
    )
);

var asrHourValue = midDay + regularT(angle, lat, Decl) / 15;
            
            // Maghrib Calculations incorporating refraction offset standard adjustments
var maghribHourValue =
    midDay + regularT(-0.833, lat, Decl) / 15;            
            return {
                Fajr: formatHourString(fajrHourValue),
                Dhuhr: formatHourString(midDay),
                Asr: formatHourString(asrHourValue),
                Maghrib: formatHourString(maghribHourValue),
                Isha: formatHourString(ishaHourValue)
            };
        }

    function regularT(angle, lat, decl) {
    var radLat = degToRad(lat);
    var radDecl = degToRad(decl);
    var radAngle = degToRad(angle);

    var cosH =
        (Math.sin(radAngle) -
         Math.sin(radLat) * Math.sin(radDecl)) /
        (Math.cos(radLat) * Math.cos(radDecl));

    if (cosH > 1 || cosH < -1) return 0;

    return radToDeg(Math.acos(cosH));
}

        function degToRad(deg) { return (deg * Math.PI) / 180.0; }
        function radToDeg(rad) { return (rad * 180.0) / Math.PI; }
        
        function fixAngle(a) {
            a = a - 360.0 * Math.floor(a / 360.0);
            return a < 0 ? a + 360.0 : a;
        }
        
        function fixHour(h) {
            h = h - 24.0 * Math.floor(h / 24.0);
            return h < 0 ? h + 24.0 : h;
        }

        function formatHourString(hourValue) {
            if (isNaN(hourValue)) return "--:--";
            hourValue = fixHour(hourValue + 0.5 / 60); // Apply mathematical rounded conversion parameter step
            var h = Math.floor(hourValue);
            var m = Math.floor((hourValue - h) * 60);
            var suffix = h >= 12 ? ' PM' : ' AM';
            h = h % 12;
            h = h ? h : 12; 
            return h + ':' + (m < 10 ? '0' + m : m) + suffix;
        }
    })();
    </script>
     <script type="text/javascript">
(function () {

    /* =========================
       BASIC IE DETECTION
    ========================= */

    function getIEVersion() {
        var ua = navigator.userAgent;

        if (document.documentMode) {
            return document.documentMode;
        }

        var match = ua.match(/MSIE\s(\d+\.\d+)/);
        if (match) return parseFloat(match[1]);

        return null;
    }

    function isLegacyIE() {
        var ver = getIEVersion();
        return ver !== null && ver <= 9;
    }

    function isIE9OrBelow() {
        var ver = getIEVersion();
        return ver !== null && ver <= 9;
    }

   function getOperaVersion() {
    var ua = navigator.userAgent;

    if (ua.indexOf("Opera") === -1) return null;

    var match = ua.match(/Version\/([\d.]+)/);
    if (!match) match = ua.match(/Opera\/([\d.]+)/);

    if (!match) return null;

    return parseFloat(match[1]);
}

function isOldOpera() {
    var ua = navigator.userAgent;

    // Old Presto Opera
    var isPrestoOpera = ua.indexOf("Presto") > -1;

    // Very old Opera (legacy string)
    var isLegacyOpera = ua.indexOf("Opera") > -1;

    // Modern Opera (Chromium-based)
    var isChromiumOpera = ua.indexOf("OPR/") > -1;

    // Only treat Presto/legacy as "old"
    return (isPrestoOpera || isLegacyOpera) && !isChromiumOpera;
}

    function isModernBrowser() {
    return !!(window.fetch && window.Promise && document.querySelector);
}

function isSupportedOpera() {
    var ver = getOperaVersion();
    if (ver === null) return false;

    return ver >= 11.6;
}

    function isKmeleon15OrBelow() {
        var ua = navigator.userAgent;
        var isKM = /K-Meleon\//i.test(ua);
        if (!isKM) return false;

        var match = ua.match(/K-Meleon\/([0-9.]+)/i);
        if (!match) return false;

        var ver = match[1].split(".");
        var major = parseInt(ver[0], 10);
        var minor = parseInt(ver[1] || "0", 10);

        return (major < 1 || (major === 1 && minor <= 5));
    }

    function isFirefox35OrBelow() {
        var ua = navigator.userAgent;
        var match = ua.match(/Firefox\/([0-9.]+)/i);
        if (!match) return false;

        var parts = match[1].split(".");
        var major = parseInt(parts[0], 10);
        var minor = parseInt(parts[1] || "0", 10);

        return (major < 3 || (major === 3 && minor <= 5));
    }

    function isRetroZilla() {
        return /RetroZilla/i.test(navigator.userAgent);
    }

    /* =========================
       PRAYTIME INIT
    ========================= */

    var pt = null;
    if (typeof PrayTime !== "undefined") {
        pt = new PrayTime();
        pt.setCalcMethod(pt.ISNA);
       pt.setAsrMethod(1); 

        pt.setTimeFormat(pt.Time12);
    }

    var LAT = 40.638421;
    var LNG = -73.978643;

    /* =========================
       DATE DISPLAY
    ========================= */

    function updateDate() {
        var d = new Date();

        var monthNames = [
            "January","February","March","April","May","June",
            "July","August","September","October","November","December"
        ];

        var el = document.getElementById("current-date-display");
        if (el) {
            el.innerHTML = monthNames[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
        }
    }

    /* =========================
       RENDER FUNCTION
    ========================= */

 function renderTimes(t) {
    var set = function (id, val) {
        var el = document.getElementById(id);
        if (el) el.innerHTML = val || "--:--";
    };

    set("fajr-athan", t.Fajr);
    set("dhuhr-athan", t.Dhuhr);
    set("asr-athan", t.Asr);

    set("maghrib-athan", t.Maghrib);
    set("maghrib-iqamah", t.Maghrib); // <-- FIX

    set("isha-athan", t.Isha);
}
    /* =========================
       CONVERSION HELPERS
    ========================= */

    function convert24To12(str) {
        if (!str) return "--:--";

        var parts = str.split(":");
        var h = parseInt(parts[0], 10);
        var m = parts[1].substring(0, 2);

        var suffix = h >= 12 ? " PM" : " AM";
        h = h % 12;
        if (h === 0) h = 12;

        return h + ":" + m + suffix;
    }

    /* =========================
       API FETCH (IE SAFE)
    ========================= */

    function getJSON(url, success, fail) {
        try {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        try {
                            var json = JSON.parse(xhr.responseText);
                            success && success(json);
                        } catch (e) {
                            fail && fail(e);
                        }
                    } else {
                        fail && fail();
                    }
                }
            };

            xhr.send();
        } catch (e) {
            fail && fail(e);
        }
    }

    /* =========================
       LEGACY CALCULATION
    ========================= */

    function runLegacyCalculation() {
        if (!pt) return;

        var now = new Date();
        var tz = -now.getTimezoneOffset() / 60;

        var times = pt.getPrayerTimes(now, LAT, LNG, tz);

        renderTimes({
            Fajr: times[0],
            Dhuhr: times[2],
            Asr: times[3],
            Maghrib: times[5],
            Isha: times[6]
        });

        console.log("Prayer times loaded via legacy engine");
    }

    /* =========================
       MODERN API CALCULATION
    ========================= */

    function runAPICalculation() {
        var d = new Date();
        var day = d.getDate();
        var month = d.getMonth() + 1;
        var year = d.getFullYear();

        var url =
            "https://api.aladhan.com/v1/timings/" +
            day + "-" + month + "-" + year +
            "?latitude=" + LAT +
            "&longitude=" + LNG +
            "&method=2&school=1";

        getJSON(
            url,
            function (json) {
                if (json && json.data && json.data.timings) {
                    var t = json.data.timings;

                    renderTimes({
                        Fajr: convert24To12(t.Fajr),
                        Dhuhr: convert24To12(t.Dhuhr),
                        Asr: convert24To12(t.Asr),
                        Maghrib: convert24To12(t.Maghrib),
                        Isha: convert24To12(t.Isha)
                    });

                    console.log("Prayer times loaded via API");
                } else {
                    runLegacyCalculation();
                }
            },
            function () {
                runLegacyCalculation();
            }
        );
    }

    /* =========================
       MODAL (LEGACY IE)
    ========================= */

    function getPrayerTimesForModal() {
        if (!pt) return null;

        var now = new Date();
        var tz = -now.getTimezoneOffset() / 60;

        var t = pt.getPrayerTimes(now, LAT, LNG, tz);

        return {
            Fajr: t[0],
            Dhuhr: t[2],
            Asr: t[3],
            Maghrib: t[5],
            Isha: t[6]
        };
    }

    window.showModal = function () {
        var t = getPrayerTimesForModal();

        var el = document.getElementById("modal-times");
        if (el) {
            el.innerHTML =
                "Fajr: " + (t ? t.Fajr : "--") + "<br>" +
                "Dhuhr: " + (t ? t.Dhuhr : "--") + "<br>" +
                "Asr: " + (t ? t.Asr : "--") + "<br>" +
                "Maghrib: " + (t ? t.Maghrib : "--") + "<br>" +
                "Isha: " + (t ? t.Isha : "--");
        }

        document.getElementById("ie-modal").style.display = "block";
        document.getElementById("ie-overlay").style.display = "block";
    };

    window.closeModal = function () {
        document.getElementById("ie-modal").style.display = "none";
        document.getElementById("ie-overlay").style.display = "none";
    };

    /* =========================
       INIT (SAFE BOOT)
    ========================= */

   function init() {
       if (navigator.userAgent.indexOf("Opera") > -1 && navigator.userAgent.indexOf("11") > -1) {
    runLegacyCalculation();
    return;
}
    updateDate();

    try {
        if (
            isLegacyIE() || isOldOpera() ||
            isIE9OrBelow() ||
            isKmeleon15OrBelow() ||
            isFirefox35OrBelow() ||
            isRetroZilla() ||
            isOldOpera()
        ) {
            runLegacyCalculation();
        } else {
            runAPICalculation();
        }
    } catch (e) {
        console.log("Init error, falling back", e);
        runLegacyCalculation();
    }

    if (
        isIE9OrBelow() || isOldOpera() ||
        isKmeleon15OrBelow() ||
        isFirefox35OrBelow() ||
        isRetroZilla() ||
        isOldOpera()
    ) {
        var el = document.getElementById("ie-only-container");
        if (el) el.style.display = "none";
    }
}

if (document.addEventListener) {
    document.addEventListener("DOMContentLoaded", init);
} else {
    window.onload = init;
}

})();
