<?PHP
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
        <title>Spotify Web Controller</title>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#1DB954" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Spotify Web Controller" />
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />
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
        <div class="page active" id="signinpage">
            <h1 id="welcome">Welcome to the Spotify Web Controller</h1>
            <p>You have to sign in with your Spotify account in order to control playback.</p>
            <button class="bigbutton" id="signinbtn">Sign in with Spotify</button>
            <p class="disclaimer"><small>This website uses cookies to store preferences and required user data. By clicking above button, we take that to mean that you accept their use.</small></p>
            <p class="disclaimer footer"><small>This web application is <b>not</b> owned by Spotify AB. It was instead built by <a href="https://freekbes/">Freek Bes</a> using the official <a href="https://developer.spotify.com/documentation/web-api/">Spotify Web API</a>.</small></p>
        </div>
        <div class="page" id="loadingpage">
            <div id="loading" style="display: table; width: 100%; height: 100%; position: fixed; top: 0px; left: 0px; right: 0px; bottom: 0px;">
                <div style="display: table-cell; vertical-align: middle;">
                    <div style="margin-left: auto; margin-right: auto; text-align: center;">
                        <div id="spinner"></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="page" id="playerpage">
            <div id="topbar">
                <div id="playing-from-holder">
                    <div id="playing-from"></div>
                    <div id="playing-from-name"></div>
                </div>
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
                    <button class="material-icons side-button" id="loop-button" title="Loop">&#xe040;</button>
                </div>
                <div id="bottombar">
                    <button class="material-icons bar-button" id="devices-button" title="Spotify Connect">&#xe32e;</button>
                    <button class="material-icons bar-button" id="playlist-button" title="Queue">&#xe05f;</button>
                </div>
            </div>
        </div>
        <script><?PHP readfile("progressbar.js"); ?></script>
    </body>
</html>