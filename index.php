<?PHP
	if (empty($_SERVER['HTTPS']) || $_SERVER['HTTPS'] === "off") {
		$location = 'https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
		header('HTTP/1.1 301 Moved Permanently');
		header('Location: ' . $location);
		exit();
	}
	session_start();
	if (!isset($_SESSION["state"])) {
		$_SESSION["state"] = rand(100, 999);
	}
	else if (isset($_GET["state"]) && intval($_GET["state"]) != $_SESSION["state"]) {
		http_response_code(409);
		exit();
	}
?>
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<link rel="manifest" href="manifest.json" />
		<title>Spotify Remote Web Controller</title>
		<meta name="description" content="A web controller for Spotify, targeted for Android Go, because I've heard the official Spotify application runs like shit and sometimes you just wanna control what's playing without getting up from bed or something">
		<meta name="mobile-web-app-capable" content="yes" />
		<meta name="theme-color" content="#1DB954" />
		<meta name="application-name" content="Spotify Remote Web Controller">
		<meta name="og:image" content="https://freekb.es/spotify/icon.png" />
		<meta property="og:image" content="https://freekb.es/spotify/icon.png" />
		<link rel="shortcut icon" href="favicon.ico" type="image/x-icon" />
		<link rel="icon" type="image/ico" href="favicon.ico" />
		<meta name="apple-mobile-web-app-capable" content="yes" />
		<meta name="apple-mobile-web-app-title" content="Spotify Remote Web Controller" />
		<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
		<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />
		<meta name="browsermode" content="application">
		<meta name="screen-orientation" content="portrait">

		<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
		<style><?php readfile("styles.css"); ?></style>
		<script>var state = <?PHP echo $_SESSION["state"]; ?>;</script>
		<script><?php readfile("helpers.js"); ?></script>
		<script type="application/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
		<script><?php readfile("page-handler.js"); ?></script>
		<script type="application/javascript" src="vibrant.min.js"></script>
		<script type="application/javascript" src="spotify-web-api.js"></script>
		<script><?php readfile("spotify-handler.js"); ?></script>
	</head>
	<body onload="spotifyHandler.init();">
		<div class="page active" id="loadingpage">
			<div id="loading" style="display: table; width: 100%; height: 100%; position: fixed; top: 0px; left: 0px; right: 0px; bottom: 0px;">
				<div style="display: table-cell; vertical-align: middle;">
					<div style="margin-left: auto; margin-right: auto; text-align: center;">
						<div class="spinner"></div>
					</div>
				</div>
			</div>
		</div>
		<div class="page" id="signinpage">
			<h1 id="welcome">Welcome to the Spotify Web Controller</h1>
			<p>You have to sign in with your Spotify account in order to control playback.</p>
			<button class="bigbutton" id="signinbtn">Sign in with Spotify</button>
			<p class="disclaimer"><small>This website uses cookies to store preferences and required user data. By clicking above button, we take that to mean that you accept their use.</small></p>
			<p class="disclaimer footer"><small>This web application is <b>not</b> owned by Spotify AB. It was instead built by <a href="https://freekb.es/">Freek Bes</a> using the official <a href="https://developer.spotify.com/documentation/web-api/">Spotify Web API</a>.</small></p>
		</div>
		<div class="page" id="discoverpage">
			<div style="display: table; width: 100%; height: 100%; position: fixed; top: 0px; left: 0px; right: 0px; bottom: 0px;">
				<div style="display: table-cell; vertical-align: middle;">
					<h2>Looking for instances of Spotify...</h2>
					<p id="discover-disclaimer" class="disclaimer">Open Spotify on your computer, smartphone, or anything else. You will be able to control playback here once you've done so.</p>
					<div id="discoverspinner" class="spinner"></div>
					<div id="discoverlist-holder" style="display: none;">
						<div class="selectdevice">Which device would you like to use?</div>
						<ul id="discoverlist"></ul>
					</div>
				</div>
			</div>
		</div>
		<div class="page" id="devicespage">
			<div id="listeningon-holder">
				<div id="listeningon-icon" class="material-icons">&#xe30a;</div>
				<div id="listeningon-title">Listening on</div>
				<div id="listeningon"></div>
			</div>
			<div id="devicelist-holder">
				<div class="selectdevice">Select a device</div>
				<ul id="devicelist"></ul>
			</div>
			<div id="volumebar-holder">
				<div id="volumebar-icon" class="material-icons">&#xe050;</div><input id="volumebar" type="range" min="0" max="100" value="50" step="1" title="Volume" />
			</div>
			<button id="devicespageclose-button" class="material-icons close-button" onclick="pageHandler.showPage('playerpage');" title="Close">&#xe5cd;</button>
		</div>
		<div class="page" id="queuepage">
			<h2 id="contextname" class="list-header"></h2>
			<div id="queue-holder">
				<ul id="queue" class="tracklist"></ul>
			</div>
			<button id="queuepageclose-button" class="material-icons close-button" onclick="pageHandler.showPage('playerpage');" title="Close">&#xe5cd;</button>
		</div>
		<div class="page" id="librarypage">
			<h2 class="list-header">Playlists &amp; albums</h2>
			<div id="library-holder">
				<ul id="library" class="tracklist"></ul>
			</div>
			<button id="librarypageclose-button" class="material-icons close-button" onclick="pageHandler.showPage('playerpage');" title="Close">&#xe5cd;</button>
		</div>
		<div class="page" id="searchpage">
			<h2 class="list-header">Search</h2>
			<div id="search-holder">
				<div id="searchbar-wrapper">
					<input type="text" id="searchbar" placeholder="Search Spotify" />
				</div>
				<ul id="search" class="tracklist"></ul>
			</div>
			<button id="searchpageclose-button" class="material-icons close-button" onclick="pageHandler.showPage('playerpage');" title="Close">&#xe5cd;</button>
		</div>
		<div class="page" id="playerpage">
			<div id="topbar">
				<button id="library-button" class="material-icons" onclick="pageHandler.showPage('librarypage');" title="View your playlists and saved albums">&#xe5cf;</button>
				<div id="playing-from-holder">
					<div id="playing-from"></div>
					<div id="playing-from-name"></div>
				</div>
				<button id="search-button" class="material-icons" onclick="pageHandler.showPage('searchpage');" title="Search Spotify">&#xe8b6;</button>
			</div>
			<div id="art-holder">
				<img id="artwork" crossOrigin="anonymous" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
			</div>
			<div id="below-art-holder">
				<div id="metadata-holder-holder">
					<div id="metadata-holder">
						<div id="title"></div>
						<div id="artist"></div>
					</div>
					<button class="material-icons" id="like-button" title="Add to liked songs" data-liked="false">&#xe87e;</button>
				</div>
				<div id="seekbar-holder">
					<div id="progressbar-outer">
						<div class="progressbar-inner" id="barbackground"></div>
						<div class="progressbar-inner" id="bufferbar"></div>
						<div class="progressbar-inner" id="progressbar"></div>
					</div>
					<div id="times"><span id="playback-time"></span><span id="duration-time"></span></div>
				</div>
				<div id="controls-holder">
					<button class="material-icons side-button" id="shuffle-button" title="Shuffle">&#xe043;</button>
					<button class="material-icons skip-button" id="previous-button" title="Previous">&#xe045;</button>
					<button class="material-icons main-button" id="play-pause-button" title="Play">&#xe038;</button>
					<button class="material-icons skip-button" id="next-button" title="Next">&#xe044;</button>
					<button class="material-icons side-button" id="repeat-button" title="Repeat">&#xe040;</button>
				</div>
				<div id="bottombar">
					<button class="material-icons bar-button" id="devices-button" title="Available devices" data-curdevice="">&#xe32e;</button>
					<button class="material-icons bar-button" id="queue-button" title="Queue" disabled>&#xe05f;</button>
				</div>
			</div>
		</div>
		<script><?PHP readfile("progressbar.js"); ?></script>
		<script>
			window.onbeforeunload = function(e) {
				pageHandler.showPage("loadingpage");
			};
			var changingVolume = false;
			document.getElementById("volumebar").addEventListener("input", function(event) {
				spotifyHandler.setVolume(event.target.value, true);
			});
			document.getElementById("volumebar").addEventListener("mousedown", function(event) {
				changingVolume = true;
			});
			document.getElementById("volumebar").addEventListener("touchstart", function(event) {
				changingVolume = true;
			});
			document.getElementById("volumebar").addEventListener("mouseup", function(event) {
				spotifyHandler.setVolume(event.target.value, false);
				changingVolume = false;
			});
			document.getElementById("volumebar").addEventListener("touchend", function(event) {
				spotifyHandler.setVolume(event.target.value, false);
				changingVolume = false;
			});
		</script>
	</body>
</html>
