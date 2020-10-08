var spotifyHandler = {
    scopes: ["user-read-currently-playing", "user-read-playback-state", "user-modify-playback-state", "user-read-recently-played", "user-library-read", "user-library-modify"],
    accessToken: null,
    expires: -1,
    api: new SpotifyWebApi(),
    dom: {},
    progress: 0,
    duration: 0,
    lastTrackId: "nullisalsousedforlocaltracks",
    lastPlaybackStatus: {},

    signIn: function() {
        window.location.href = "https://accounts.spotify.com/authorize?client_id=44219fb334174bc6b2c634d8f9e4f6eb&response_type=token&redirect_uri="+encodeURIComponent(window.location.origin + window.location.pathname)+"&scope="+spotifyHandler.scopes.join("%20")+"&show_dialog=false&state="+state;
    },

    checkAccessToken: function() {
        if ((new Date().getTime() + 25000) >= spotifyHandler.expires) {
            console.warn("Spotify Access Token has expired! Refreshing page to refresh the access token...");
            window.location.href = window.location.origin + window.location.pathname;
        }
    },

    setLastPlayed: function() {
        spotifyHandler.api.getMyRecentlyPlayedTracks({limit: 1}, function(err, data) {
            if (err) {
                console.error(err);
            }
            else if (data != undefined) {
                // console.log(data);
                if (data.items[0].track.album.images.length > 0) {
                    spotifyHandler.dom.artwork.src = data.items[0].track.album.images[0].url;
                }
                else {
                    spotifyHandler.dom.artwork.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
                }
                spotifyHandler.dom.title.innerHTML = stripTags(data.items[0].track.name);
                var tempArtists = "";
                for (var i = 0; i < data.items[0].track.artists.length; i++) {
                    tempArtists += data.items[0].track.artists[i].name;
                    if (i != data.items[0].track.artists.length - 1) {
                        tempArtists += ", ";
                    }
                }
                spotifyHandler.dom.artist.innerHTML = stripTags(tempArtists);
                spotifyHandler.dom.playingFrom.innerHTML = "";
                spotifyHandler.dom.playingFromName.innerHTML = "";
            }
        });
    },

    setCurrentlyPlaying: function() {
        spotifyHandler.api.getMyCurrentPlayingTrack({}, function(err, data) {
            if (err) {
                console.error(err);
            }
            else if (data != undefined && typeof data != "string") {
                // console.log(data);
                spotifyHandler.lastPlaybackStatus = data;
                if (data.item.id != spotifyHandler.lastTrackId) {
                    spotifyHandler.lastTrackId = data.item.id;
                    if (data.item.album.images.length > 0) {
                        spotifyHandler.dom.artwork.src = data.item.album.images[0].url;
                    }
                    else {
                        spotifyHandler.dom.artwork.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
                    }
                    spotifyHandler.dom.title.innerHTML = stripTags(data.item.name);
                    var tempArtists = "";
                    for (var i = 0; i < data.item.artists.length; i++) {
                        tempArtists += data.item.artists[i].name;
                        if (i != data.item.artists.length - 1) {
                            tempArtists += ", ";
                        }
                    }
                    spotifyHandler.dom.artist.innerHTML = stripTags(tempArtists);
                    if (data.context != null) {
                        switch (data.context.type) {
                            case "playlist": {
                                spotifyHandler.api.getPlaylist(data.context.uri.split(":").pop(), {fields: "name"}, function(err, data) {
                                    if (err) {
                                        console.error(err);
                                    }
                                    else {
                                        // console.log(data);
                                        spotifyHandler.dom.playingFrom.innerHTML = "Playing from playlist";
                                        spotifyHandler.dom.playingFromName.innerHTML = stripTags(data.name);
                                    }
                                });
                                break;
                            }
                            case "album": {
                                spotifyHandler.api.getAlbum(data.context.uri.split(":").pop(), {}, function(err, data) {
                                    if (err) {
                                        console.error(err);
                                    }
                                    else {
                                        // console.log(data);
                                        spotifyHandler.dom.playingFrom.innerHTML = "Playing from " + data.album_type;
                                        spotifyHandler.dom.playingFromName.innerHTML = stripTags(data.name);
                                    }
                                });
                                break;
                            }
                            default: {
                                spotifyHandler.dom.playingFrom.innerHTML = "";
                                spotifyHandler.dom.playingFromName.innerHTML = "";
                                break;
                            }
                        }
                    }
                    else {
                        spotifyHandler.dom.playingFrom.innerHTML = "";
                        spotifyHandler.dom.playingFromName.innerHTML = "";
                    }
                    if ('mediaSession' in navigator)
                    {
                        navigator.mediaSession.playbackState = "playing";
                        var tempArtwork = [];
                        for (var i = 0; i < data.item.album.images.length; i++) {
                            tempArtwork[i] = {
                                sizes: data.item.album.images[i].width+"x"+data.item.album.images[i].height,
                                src: data.item.album.images[i].url,
                                type: "image/jpeg"
                            };
                        }
                        navigator.mediaSession.metadata = new MediaMetadata({
                            title: data.item.name,
                            artist: tempArtists,
                            artwork: tempArtwork
                        });
                    }
                    if (!data.item.is_local) {
                        spotifyHandler.dom.likeButton.disabled = false;
                        spotifyHandler.dom.likeButton.style.display = "inline-block";
                        spotifyHandler.api.containsMySavedTracks([data.item.id], {}, function(err, data) {
                            if (err) {
                                console.error(err);
                            }
                            else if (data[0]) {
                                spotifyHandler.dom.likeButton.innerHTML = "&#xe87d;";
                                spotifyHandler.dom.likeButton.style.color = "#1DB954";
                                spotifyHandler.dom.likeButton.title = "Remove from liked songs";
                                spotifyHandler.dom.likeButton.setAttribute("data-liked", "true");
                            }
                            else {
                                spotifyHandler.dom.likeButton.innerHTML = "&#xe87e;";
                                spotifyHandler.dom.likeButton.style.color = null;
                                spotifyHandler.dom.likeButton.title = "Add to liked songs";
                                spotifyHandler.dom.likeButton.setAttribute("data-liked", "false");
                            }
                        });
                    }
                    else {
                        spotifyHandler.dom.likeButton.disabled = true;
                        spotifyHandler.dom.likeButton.style.display = "none";
                    }
                    spotifyHandler.duration = Math.floor(data.item.duration_ms / 1000);
                }
                spotifyHandler.progress = Math.floor(data.progress_ms / 1000);
                if (!progressBar.hovering) {
                    progressBar.setValue((data.progress_ms / data.item.duration_ms) * 100);
                    spotifyHandler.updateTimes(spotifyHandler.progress, spotifyHandler.duration);
                }
                if (data.is_playing) {
                    spotifyHandler.dom.playPauseButton.title = "Pause";
                    spotifyHandler.dom.playPauseButton.innerHTML = "&#xe035;";
                }
                else {
                    spotifyHandler.dom.playPauseButton.title = "Play";
                    spotifyHandler.dom.playPauseButton.innerHTML = "&#xe038;";
                }
            }
            else {
                // console.warn("No currently playing track found! Using last played track instead");
                spotifyHandler.setLastPlayed();
            }
        });
    },

    fixArtSize: function() {
        var maxHeight = document.getElementById("below-art-holder").offsetTop - 42 - 48;
        var maxWidth = window.innerWidth - 48;
        if (maxHeight < maxWidth) {
            spotifyHandler.dom.artwork.style.width = maxHeight + "px";
        }
        else {
            spotifyHandler.dom.artwork.style.width = maxWidth + "px";
        }
    },

    updateTimes: function(prog, dur) {
        spotifyHandler.dom.playbackTime.innerHTML = formatSeconds(prog);
        spotifyHandler.dom.durationTime.innerHTML = formatSeconds(dur);
    },

    init: function() {
        document.getElementById("signinbtn").addEventListener("click", spotifyHandler.signIn);

        spotifyHandler.dom.playerPage = document.getElementById("playerpage");
        spotifyHandler.dom.playingFrom = document.getElementById("playing-from");
        spotifyHandler.dom.playingFromName = document.getElementById("playing-from-name");
        spotifyHandler.dom.artwork = document.getElementById("artwork");
        spotifyHandler.dom.title = document.getElementById("title");
        spotifyHandler.dom.artist = document.getElementById("artist");
        spotifyHandler.dom.likeButton = document.getElementById("like-button");
        spotifyHandler.dom.playbackTime = document.getElementById("playback-time");
        spotifyHandler.dom.durationTime = document.getElementById("duration-time");
        spotifyHandler.dom.likeButton = document.getElementById("like-button");
        spotifyHandler.dom.shuffleButton = document.getElementById("shuffle-button");
        spotifyHandler.dom.previousButton = document.getElementById("previous-button");
        spotifyHandler.dom.playPauseButton = document.getElementById("play-pause-button");
        spotifyHandler.dom.nextButton = document.getElementById("next-button");
        spotifyHandler.dom.repeatButton = document.getElementById("repeat-button");
        spotifyHandler.dom.devicesButton = document.getElementById("devices-button");
        spotifyHandler.dom.playlistButton = document.getElementById("playlist-button");
        window.addEventListener("resize", spotifyHandler.fixArtSize);
        spotifyHandler.dom.artwork.addEventListener("loadstart", function(event) {
            spotifyHandler.dom.playerPage.style.background = null;
        });
        spotifyHandler.dom.artwork.addEventListener("load", function(event) {
            spotifyHandler.fixArtSize();
            if (event.target.src.indexOf("data:image/gif;base64") != 0) {
                var vibrant = new Vibrant(event.target);
                var swatches = vibrant.swatches();
                if (swatches.Vibrant != undefined) {
                    spotifyHandler.dom.playerPage.style.background = "linear-gradient(rgba("+swatches.Vibrant.rgb.join(",")+",0.7), #15161A 75%)";
                }
                else if (swatches.Muted != undefined) {
                    spotifyHandler.dom.playerPage.style.background = "linear-gradient(rgba("+swatches.Muted.rgb.join(",")+",0.7), #15161A 75%)";
                }
                else {
                    console.log(swatches);
                    spotifyHandler.dom.playerPage.style.background = null;
                }
            }
            else {
                spotifyHandler.dom.playerPage.style.background = null;
            }
        });
        spotifyHandler.dom.playPauseButton.addEventListener("click", function(event) {
            spotifyHandler.dom.playPauseButton.disabled = true;
            if (spotifyHandler.dom.playPauseButton.title == "Pause") {
                spotifyHandler.api.pause({}, function() {
                    spotifyHandler.dom.playPauseButton.disabled = false;
                    spotifyHandler.dom.playPauseButton.innerHTML = "&#xe038;";
                    spotifyHandler.dom.playPauseButton.title = "Play";
                });
            }
            else {
                spotifyHandler.api.play({}, function() {
                    spotifyHandler.dom.playPauseButton.disabled = false;
                    spotifyHandler.dom.playPauseButton.innerHTML = "&#xe035;";
                    spotifyHandler.dom.playPauseButton.title = "Pause";
                });
            }
        });
        spotifyHandler.dom.nextButton.addEventListener("click", function(event) {
            spotifyHandler.dom.nextButton.disabled = true;
            spotifyHandler.api.skipToNext({}, function() {
                spotifyHandler.dom.nextButton.disabled = false;
            });
        });
        spotifyHandler.dom.previousButton.addEventListener("click", function(event) {
            spotifyHandler.dom.previousButton.disabled = true;
            spotifyHandler.api.skipToPrevious({}, function() {
                spotifyHandler.dom.previousButton.disabled = false;
            });
        });
        spotifyHandler.dom.likeButton.addEventListener("click", function(event) {
            spotifyHandler.dom.likeButton.disabled = true;
            if (spotifyHandler.dom.likeButton.getAttribute("data-liked") == "false") {
                spotifyHandler.api.addToMySavedTracks([spotifyHandler.lastTrackId], {}, function(err, data) {
                    if (err) {
                        console.error(err);
                    }
                    else {
                        spotifyHandler.dom.likeButton.disabled = false;
                        spotifyHandler.dom.likeButton.innerHTML = "&#xe87d;";
                        spotifyHandler.dom.likeButton.style.color = "#1DB954";
                        spotifyHandler.dom.likeButton.title = "Remove from liked songs";
                        spotifyHandler.dom.likeButton.setAttribute("data-liked", "true");
                    }
                });
            }
            else {
                spotifyHandler.api.removeFromMySavedTracks([spotifyHandler.lastTrackId], {}, function(err, data) {
                    if (err) {
                        console.error(err);
                    }
                    else {
                        spotifyHandler.dom.likeButton.disabled = false;
                        spotifyHandler.dom.likeButton.innerHTML = "&#xe87e;";
                        spotifyHandler.dom.likeButton.style.color = null;
                        spotifyHandler.dom.likeButton.title = "Add to liked songs";
                        spotifyHandler.dom.likeButton.setAttribute("data-liked", "false");
                    }
                });
            }
        });

        if ('mediaSession' in navigator)
        {
            navigator.mediaSession.metadata = new MediaMetadata({});
            navigator.mediaSession.setActionHandler('play', spotifyHandler.api.play);
            navigator.mediaSession.setActionHandler('pause', spotifyHandler.api.pause);
            navigator.mediaSession.setActionHandler('nexttrack', spotifyHandler.api.skipToNext);
            navigator.mediaSession.setActionHandler('previoustrack', spotifyHandler.api.skipToPrevious);
            navigator.mediaSession.playbackState = "none";
        }

        if (window.location.hash.length > 0)
        {
            pageHandler.showPage("loadingpage");
            var hash = {};
            var tempHash = window.location.hash.substring(1).split("&");
            window.location.hash = "";
            for (var i = 0; i < tempHash.length; i++) {
                hash[tempHash[i].split("=")[0]] = tempHash[i].split("=")[1];
            }
            if ("access_token" in hash && parseInt(hash["state"]) == state) {
                if (getCookie("spat") != hash["access_token"]) {
                    setCookie("spat", hash["access_token"]);
                    spotifyHandler.expires = new Date().getTime() + (parseInt(hash["expires_in"]) * 1000);
                    setCookie("spex", spotifyHandler.expires);
                }
                else {
                    spotifyHandler.expires = parseInt(getCookie("spex"));
                }
                setInterval(spotifyHandler.checkAccessToken, 1000);
                setInterval(spotifyHandler.setCurrentlyPlaying, 1000);
                spotifyHandler.api.setAccessToken(hash["access_token"]);
                pageHandler.showPage("playerpage");
                spotifyHandler.setCurrentlyPlaying();
            }
            else if ("error" in hash && parseInt(hash["state"]) == state) {
                if (hash["error"] == "access_denied") {

                }
                else {
                    alert("An error occurred connecting to your Spotify account: " + hash["error"]);
                }
                pageHandler.showPage("signinpage");
            }
            else {
                alert("Something went wrong connecting your Spotify account. Please try again.");
                pageHandler.showPage("signinpage");
            }
        }
        else if (getCookie("spat") != null) {
            console.log("No hash present, but we might be able to sign in automatically, since a previous access token was found.");
            spotifyHandler.signIn();
        }
    }
};