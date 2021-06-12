function getParameterByName(name, url) {
	if (!url) url = window.location.href;
	name = name.replace(/[\[\]]/g, "\\$&");
	var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)", "i"),
	results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function stripTags(text) {
	var tmp = document.createElement("div");
	tmp.innerHTML = text;
	return tmp.textContent || tmp.innerText;
}

function getCookie(name) {
	var re = new RegExp(name + "=([^;]+)");
	var value = re.exec(document.cookie);
	return (value != null) ? unescape(value[1]) : null;
}

function setCookie(name, value) {
	document.cookie = name + " = " + value + "; expires=Mon, 14 Sep 2025 18:49:22 GMT; path=/";
}

function formatSeconds(seconds) {
	var s = Math.floor(seconds % 60);
	var m = Math.floor((seconds / 60) % 60);
	var u = Math.floor(((seconds / 60) / 60 ) % 60);
	if (u > 0 && m < 10) {
		m = '0' + m;
	}
	if (s < 10) {
		s = '0' + s;
	}
	if (u < 1) {
		return (m + ':' + s);
	}
	else if (u >= 1) {
		return (u + ':' + m + ':' + s);
	}
}

function getDeviceIcon(type) {
	switch (type) {
		case "smartphone":
			return "&#xe32c;";
		case "computer":
			return "&#xe30a;";
		case "speaker":
		case "avr":
			return "&#xe32d;";
		case "tv":
		case "stb":
			return "&#xe333;"
		case "gameconsole":
			return "&#xe30f;";
		case "castvideo":
		case "castaudio":
			return "&#xe307;";
		case "automobile":
			return "&#xe531;";
		case "audiodongle":
			return "&#xe60f;";
		case "unknown":
		default:
			return "&#xe337;";
	}
}