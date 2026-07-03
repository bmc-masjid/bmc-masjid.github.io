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
</script>
    <script type="text/javascript">
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
