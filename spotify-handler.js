var spotifyHandler = {
	scopes: ["user-read-private", "user-read-currently-playing", "user-read-playback-state", "user-modify-playback-state", "user-read-recently-played", "user-library-read", "user-library-modify", "playlist-read-private", "playlist-read-collaborative"],
	accessToken: null,
	expires: -1,
	api: new SpotifyWebApi(),
	dom: {},
	progress: 0,
	duration: 0,
	lastTrackId: "null2",
	lastQueueId: "null2",
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

	setCurrentlyPlaying: function() {
		if (!document.hidden) {
			spotifyHandler.api.getMyCurrentPlaybackState({}, function(err, data) {
				if (err) {
					console.error(err);
				}
				else if (data != undefined && typeof data != "string" && data.item != null) {
					// console.log(data);
					spotifyHandler.lastPlaybackStatus = data;
					if (pageHandler.shown == "discoverpage") {
						pageHandler.showPage("playerpage");
					}
					if (data.item.id == null) {
						data.item.id = data.item.uri.split(":").pop();
					}
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
									spotifyHandler.api.getPlaylist(data.context.uri.split(":").pop(), {fields: "name,id"}, function(err, data) {
										if (err) {
											console.error(err);
										}
										else {
											// console.log(data);
											spotifyHandler.dom.playingFrom.innerHTML = "Playing from playlist";
											spotifyHandler.dom.playingFromName.innerHTML = stripTags(data.name);
											spotifyHandler.dom.contextName.innerHTML = stripTags(data.name);
											spotifyHandler.fillQueue("playlist", data.id);
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
											spotifyHandler.dom.playingFrom.innerHTML = "Playing from album";
											spotifyHandler.dom.playingFromName.innerHTML = stripTags(data.name);
											spotifyHandler.dom.contextName.innerHTML = stripTags(data.name);
											spotifyHandler.fillQueue("album", data.id);
										}
									});
									break;
								}
								case "artist": {
									spotifyHandler.api.getArtist(data.context.uri.split(":").pop(), {}, function(err, data) {
										if (err) {
											console.error(err);
										}
										else {
											// console.log(data);
											spotifyHandler.dom.playingFrom.innerHTML = "Playing from artist";
											spotifyHandler.dom.playingFromName.innerHTML = stripTags(data.name);
											spotifyHandler.dom.contextName.innerHTML = stripTags(data.name);
											spotifyHandler.fillQueue("artist", data.id);
										}
									});
									break;
								}
								default: {
									spotifyHandler.dom.playingFrom.innerHTML = "";
									spotifyHandler.dom.playingFromName.innerHTML = "";
									spotifyHandler.dom.contextName.innerHTML = "";
									spotifyHandler.fillQueue(null, null);
									break;
								}
							}
						}
						else {
							spotifyHandler.dom.playingFrom.innerHTML = "Playing from Your Library";
							spotifyHandler.dom.playingFromName.innerHTML = "Liked Songs";
							spotifyHandler.dom.contextName.innerHTML = "Liked Songs";
							spotifyHandler.fillQueue("library", "library");
							console.log("No context for currently playing track, assuming library is being played");
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
						spotifyHandler.duration = Math.floor(data.item.duration_ms / 1000);
					}
					spotifyHandler.progress = Math.floor(data.progress_ms / 1000);
					if (!progressBar.hovering) {
						progressBar.setValue((data.progress_ms / data.item.duration_ms) * 100);
						spotifyHandler.updateTimes(spotifyHandler.progress, spotifyHandler.duration);
					}

					if (data.device.volume_percent != null) {
						spotifyHandler.dom.volumebar.disabled = false;
						spotifyHandler.setVolume(data.device.volume_percent, true);
					}
					else {
						spotifyHandler.dom.volumebar.disabled = true;
					}
					
					if (data.is_playing) {
						spotifyHandler.dom.playPauseButton.title = "Pause";
						spotifyHandler.dom.playPauseButton.innerHTML = "&#xe035;";
					}
					else {
						spotifyHandler.dom.playPauseButton.title = "Play";
						spotifyHandler.dom.playPauseButton.innerHTML = "&#xe038;";
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

					if (data.shuffle_state) {
						spotifyHandler.dom.shuffleButton.style.color = "#1DB954";
						spotifyHandler.dom.shuffleButton.className = "material-icons side-button dotted";
					}
					else {
						spotifyHandler.dom.shuffleButton.style.color = null;
						spotifyHandler.dom.shuffleButton.className = "material-icons side-button";
					}

					switch (data.repeat_state) {
						case "context":
							spotifyHandler.dom.repeatButton.style.color = "#1DB954";
							spotifyHandler.dom.repeatButton.innerHTML = "&#xe040;";
							spotifyHandler.dom.repeatButton.className = "material-icons side-button dotted";
							break;
						case "track":
							spotifyHandler.dom.repeatButton.style.color = "#1DB954";
							spotifyHandler.dom.repeatButton.innerHTML = "&#xe041;";
							spotifyHandler.dom.repeatButton.className = "material-icons side-button dotted";
							break;
						default:
						case "off":
							spotifyHandler.dom.repeatButton.style.color = null;
							spotifyHandler.dom.repeatButton.innerHTML = "&#xe040;";
							spotifyHandler.dom.repeatButton.className = "material-icons side-button";
							break;
					}
				}
				else {
					console.log("No instances of Spotify found to control.");
					if (spotifyHandler.lastTrackId != "null2") {
						setTimeout(function() {
							spotifyHandler.refreshDevices();
						}, 500);
					}
					if (pageHandler.shown != "discoverpage") {
						pageHandler.showPage("discoverpage");
					}
				}
			});
		}
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

	refreshDevices: function() {
		if (!document.hidden) {
			spotifyHandler.api.getMyDevices(function(err, data) {
				if (err) {
					console.error(err);
					spotifyHandler.dom.deviceList.innerHTML = "";
				}
				else {
					var tempList = "";
					var tempListDis = "";
					for (var i = 0; i < data.devices.length; i++) {
						if (data.devices[i].is_active) {
							spotifyHandler.dom.listeningOn.innerHTML = stripTags(data.devices[i].name);
							spotifyHandler.dom.listeningOnIcon.innerHTML = getDeviceIcon(data.devices[i].type.toLowerCase());
							if (data.devices.length > 1) {
								spotifyHandler.dom.devicesButton.setAttribute("data-curdevice", stripTags(data.devices[i].name));
							}
							else {
								spotifyHandler.dom.devicesButton.setAttribute("data-curdevice", "");
							}
						}
						else {
							tempList += '<li class="devicelist-item" onclick="spotifyHandler.transferPlayback(\''+data.devices[i].id+'\')"><span class="devicelist-icon material-icons">'+getDeviceIcon(data.devices[i].type.toLowerCase())+'</span><span class="devicelist-name">'+data.devices[i].name+'</span></li>';
						}
						tempListDis += '<li class="devicelist-item" onclick="spotifyHandler.startPlaySession(\''+data.devices[i].id+'\')"><span class="devicelist-icon material-icons">'+getDeviceIcon(data.devices[i].type.toLowerCase())+'</span><span class="devicelist-name">'+data.devices[i].name+'</span></li>';
					}
					spotifyHandler.dom.deviceList.innerHTML = tempList;
					spotifyHandler.dom.discoverList.innerHTML = tempListDis;
					if (data.devices.length > 1) {
						spotifyHandler.dom.deviceListHolder.style.display = "block";
						spotifyHandler.dom.devicesButton.className = "material-icons bar-button dotted";
					}
					else {
						spotifyHandler.dom.deviceListHolder.style.display = "none";
						spotifyHandler.dom.devicesButton.className = "material-icons bar-button";
					}
					if (data.devices.length > 0) {
						spotifyHandler.dom.discoverSpinner.style.display = "none";
						spotifyHandler.dom.discoverListHolder.style.display = null;
					}
					else {
						spotifyHandler.dom.discoverSpinner.style.display = null;
						spotifyHandler.dom.discoverListHolder.style.display = "none";
					}
				}
			});
		}
	},

	setVolume: function(newVolume, volumebarOnly) {
		spotifyHandler.dom.volumebar.style.background = 'linear-gradient(to right, #1DB954 0%, #1DB954 '+newVolume+'%, #353942 '+newVolume+'%, #353942 100%)';
		if (spotifyHandler.dom.volumebar.value != newVolume && !changingVolume) {
			spotifyHandler.dom.volumebar.value = newVolume;
		}
		if (!volumebarOnly) {
			spotifyHandler.api.setVolume(newVolume, {});
		}
	},

	transferringPlayback: false,
	transferPlayback: function(deviceId) {
		if (!spotifyHandler.transferringPlayback) {
			spotifyHandler.transferringPlayback = true;
			spotifyHandler.api.transferMyPlayback([deviceId], {}, function(err, data) {
				if (err) {
					console.error(err);
					spotifyHandler.transferringPlayback = false;
				}
				else {
					console.log("Moved playback");
					setTimeout(function() {
						spotifyHandler.refreshDevices();
						spotifyHandler.transferringPlayback = false;
					}, 500);
				}
			});
		}
	},

	fetchingQueue: false,
	queueTotal: undefined,
	queueOffset: 0,
	fillQueue: function(type, id) {
		if (id != null)
		{
			if (spotifyHandler.lastQueueId != id) {
				spotifyHandler.dom.queueButton.disabled = true;
				spotifyHandler.lastQueueId = id;
				spotifyHandler.lastQueueType = type;
				spotifyHandler.queueOffset = 0;
				spotifyHandler.queueTotal = undefined;
				spotifyHandler.dom.queue.innerHTML = "";
				spotifyHandler.fetchQueueTracks(type, id, 0);
			}
			else {
				console.log("Queue already loaded for id " + id);
			}
		}
		else {
			spotifyHandler.lastQueueId = null;
			spotifyHandler.lastQueueType = null;
			spotifyHandler.dom.queue.innerHTML = "";
			spotifyHandler.fetchQueueTracks(type, id, 0);
		}
	},

	fetchQueueTracks: function(type, id, offset) {
		if (spotifyHandler.fetchingQueue != true) {
			if (type == "album") {
				spotifyHandler.fetchingQueue = true;
				spotifyHandler.api.getAlbumTracks(id, {offset: offset}, spotifyHandler.handleFetchedTracks);
			}
			else if (type == "playlist") {
				spotifyHandler.fetchingQueue = true;
				spotifyHandler.api.getPlaylistTracks(id, {offset: offset}, spotifyHandler.handleFetchedTracks);
			}
			else if (type == "artist") {
				spotifyHandler.fetchingQueue = true;
				spotifyHandler.api.getArtistTopTracks(id, "from_token", {}, spotifyHandler.handleFetchedTracks);
			}
			else if (type == "library" && id == "library") {
				spotifyHandler.fetchingQueue = true;
				spotifyHandler.api.getMySavedTracks({offset: offset, limit: 50, market: "from_token"}, spotifyHandler.handleFetchedTracks);
			}
			else {
				spotifyHandler.dom.queueButton.disabled = true;
				console.log("Queue cannot be retrieved for type " + type);
			}
		}
		else {
			console.warn("Already fetching queue!");
		}
	},

	handleFetchedTracks: function(err, data) {
		spotifyHandler.fetchingQueue = false;
		spotifyHandler.dom.queueButton.disabled = false;
		if (err) {
			console.error(err);
		}
		else {
			console.log("Queue retrieved", data);
			if (data.items) {
				spotifyHandler.addQueueTracks(data.items, false);
				spotifyHandler.queueOffset += data.items.length;
			}
			else if (data.tracks) {
				spotifyHandler.addQueueTracks(data.tracks, true);
				spotifyHandler.queueOffset += data.tracks.length;
			}
			spotifyHandler.queueTotal = data.total;
		}
	},

	createTrackItem: function(tempTrack, doCover, inCurrentContext) {
		var trackElem = document.createElement("li");
		var tempArtists = [];
		trackElem.className = "queue-item";
		trackElem.setAttribute("data-uri", tempTrack.uri);
		if (inCurrentContext) {
			trackElem.setAttribute("data-context", "spotify:"+spotifyHandler.lastQueueType+":"+spotifyHandler.lastQueueId);
		}
		else {
			trackElem.setAttribute("data-context", tempTrack.album.uri);
		}
		trackElem.setAttribute("onclick", "spotifyHandler.playContext(this.getAttribute('data-context'), this.getAttribute('data-uri'));");
		tempArtists = [];
		for (var j = 0; j < tempTrack.artists.length; j++) {
			tempArtists.push(stripTags(tempTrack.artists[j].name));
		}
		trackElem.innerHTML = (doCover ? '<div class="queue-item-cover"><img src="'+(tempTrack.album.images.length > 0 ? tempTrack.album.images.pop().url : 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7')+'"></div>': '<div class="queue-item-cover"><span>'+(tempTrack.disc_number > 1 ? tempTrack.disc_number+'-' : '')+tempTrack.track_number+'</span></div>')+'<div class="queue-item-metadata"><div class="queue-item-name">'+stripTags(tempTrack.name)+'</div><div class="queue-item-artist">'+tempArtists.join(', ')+'</div></div>';
		spotifyHandler.dom.queue.appendChild(trackElem);
		return (trackElem);
	},

	addQueueTracks: function(tracks, doCover) {
		var tempTrack = {};
		for (var i = 0; i < tracks.length; i++) {
			
			tempTrack = tracks[i];
			if ("track" in tempTrack) {
				tempTrack = tempTrack.track;
				doCover = true;
			}
			if (tempTrack.uri != null && tempTrack.uri.indexOf(":local:") == -1) {
				spotifyHandler.dom.queue.appendChild(spotifyHandler.createTrackItem(tempTrack, doCover, true));
			}
		}
	},

	playContext: function(contextUri, trackUri) {
		if (trackUri == null) {
			spotifyHandler.api.play({
				context_uri: contextUri
			});
		}
		else if (contextUri != null && contextUri != "spotify:library:library") {
			spotifyHandler.api.play({
				context_uri: contextUri,
				offset: {
					uri: trackUri
				}
			});
		}
		else {
			// workaround for missing context for user's library
			// only plays tracks fetched so far... but it's better than nothing
			var tempUris = [];
			for (var i = 0; i < spotifyHandler.dom.queue.children.length; i++) {
				tempUris.push(spotifyHandler.dom.queue.children[i].getAttribute("data-uri"));
			}
			spotifyHandler.api.play({
				uris: tempUris,
				offset: {
					uri: trackUri
				}
			});
		}
	},

	startPlaySession: function(deviceId) {
		spotifyHandler.api.play({
			device_id: deviceId
		}, function(err, data) {
			if (err) {
				console.error(err);
				alert("Could not start playback due to an error ("+err.status+"). You'll have to start it yourself, on the device you clicked on.");
			}
		});
	},

	fetchingPlaylists: false,
	playlistsTotal: undefined,
	playlistsOffset: 0,
	firstAlbumFetched: false,
	loadLibrary: function() {
		spotifyHandler.dom.library.innerHTML = "";
		spotifyHandler.dom.library.appendChild(spotifyHandler.createDividerItem("Playlists"));
		spotifyHandler.playlistsOffset = 0;
		spotifyHandler.playlistsTotal = undefined;
		spotifyHandler.fetchPlaylists(0);
	},

	fetchPlaylists: function(offset) {
		if (spotifyHandler.fetchingPlaylists != true) {
			spotifyHandler.fetchingPlaylists = true;
			if (offset < spotifyHandler.playlistsTotal || (offset == 0 && spotifyHandler.playlistsTotal == undefined)) {
				spotifyHandler.api.getUserPlaylists({offset: offset, limit: 50}, spotifyHandler.handleFetchedPlaylists);
			}
			else {
				if (!spotifyHandler.firstAlbumFetched) {
					spotifyHandler.dom.library.appendChild(spotifyHandler.createDividerItem("Albums"));
					spotifyHandler.firstAlbumFetched = true;
				}
				offset = offset - spotifyHandler.playlistsTotal;
				if (offset >= 0) {
					spotifyHandler.api.getMySavedAlbums({offset: offset, limit: 50, country: "from_token"}, spotifyHandler.handleFetchedPlaylists);
				}
			}
		}
		else {
			console.warn("Already fetching playlists!");
		}
	},

	handleFetchedPlaylists: function(err, data) {
		spotifyHandler.fetchingPlaylists = false;
		if (err) {
			console.error(err);
		}
		else {
			console.log("Playlists or albums fetched", data);
			spotifyHandler.addPlaylists(data.items);
			spotifyHandler.playlistsOffset += data.items.length;
			if (data.href.indexOf("me/albums") == -1) {
				spotifyHandler.playlistsTotal = data.total;
			}
			else if (data.offset == data.total) {
				// workaround to stop fetching albums from library once all have been fetched
				spotifyHandler.fetchingPlaylists = true;
			}
		}
	},

	createPlaylistOrAlbumItem: function(tempData) {
		playlistElem = document.createElement("li");
		playlistElem.className = "queue-item";
		playlistElem.setAttribute("data-uri", tempData.uri);
		tempArtists = [];
		if ("artists" in tempData) {
			for (var j = 0; j < tempData.artists.length; j++) {
				tempArtists.push(stripTags(tempData.artists[j].name));
			}
		}
		playlistElem.setAttribute("onclick", "spotifyHandler.playContext(this.getAttribute('data-uri'), null); pageHandler.showPage('playerpage');");
		playlistElem.innerHTML = '<div class="queue-item-cover"><img src="'+(tempData.images.length > 0 ? tempData.images.pop().url : 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7')+'"></div><div class="queue-item-metadata"><div class="queue-item-name">'+stripTags(tempData.name)+'</div><div class="queue-item-artist">'+("artists" in tempData ? tempArtists.join(", ") : 'by '+stripTags(tempData.owner.display_name))+'</div></div>';
		return (playlistElem);
	},

	addPlaylists: function(data) {
		for (var i = 0; i < data.length; i++) {
			tempData = data[i];
			if ("album" in tempData) {
				tempData = tempData.album;
			}
			spotifyHandler.dom.library.appendChild(spotifyHandler.createPlaylistOrAlbumItem(tempData));
		}
	},

	createDividerItem: function(content) {
		divider = document.createElement("li");
		divider.className = "queue-item divider";
		divider.innerHTML = content;
		return (divider);
	},

	searchReq: null,
	search: function(q) {
		if (spotifyHandler.searchReq != null) {
			spotifyHandler.searchReq.abort();
		}
		if (q.trim() != "")
		{
			spotifyHandler.searchReq = spotifyHandler.api.search(q.trim(), ["track", "album", "playlist"], {offset: 0, limit: 12, market: "from_token"});
			spotifyHandler.searchReq.then(function(data) {
				console.log("Search results are in", data);
				spotifyHandler.dom.search.innerHTML = "";
				var anyResults = false;
				if (data.tracks.items.length > 0) {
					spotifyHandler.dom.search.appendChild(spotifyHandler.createDividerItem("Tracks"));
					for (var i = 0; i < data.tracks.items.length; i++) {
						spotifyHandler.dom.search.appendChild(spotifyHandler.createTrackItem(data.tracks.items[i], true, false));
					}
					anyResults = true;
				}
				if (data.albums.items.length > 0) {
					spotifyHandler.dom.search.appendChild(spotifyHandler.createDividerItem("Albums"));
					for (var i = 0; i < data.albums.items.length; i++) {
						spotifyHandler.dom.search.appendChild(spotifyHandler.createPlaylistOrAlbumItem(data.albums.items[i], true));
					}
					anyResults = true;
				}
				if (data.playlists.items.length > 0) {
					spotifyHandler.dom.search.appendChild(spotifyHandler.createDividerItem("Playlists"));
					for (var i = 0; i < data.playlists.items.length; i++) {
						spotifyHandler.dom.search.appendChild(spotifyHandler.createPlaylistOrAlbumItem(data.playlists.items[i], true));
					}
					anyResults = true;
				}
				if (!anyResults) {
					spotifyHandler.dom.search.appendChild(spotifyHandler.createDividerItem("No results found for \""+stripTags(q.trim())+"\""));
				}
			}, function(err) {
				// console.error(err);
			});
		}
		else {
			spotifyHandler.dom.search.innerHTML = "";
		}
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
		spotifyHandler.dom.queuePage = document.getElementById("queuepage");
		spotifyHandler.dom.queueButton = document.getElementById("queue-button");
		spotifyHandler.dom.queue = document.getElementById("queue");
		spotifyHandler.dom.contextName = document.getElementById("contextname");
		spotifyHandler.dom.deviceListHolder = document.getElementById("devicelist-holder");
		spotifyHandler.dom.deviceList = document.getElementById("devicelist");
		spotifyHandler.dom.discoverSpinner = document.getElementById("discoverspinner");
		spotifyHandler.dom.discoverListHolder = document.getElementById("discoverlist-holder");
		spotifyHandler.dom.discoverList = document.getElementById("discoverlist");
		spotifyHandler.dom.volumebar = document.getElementById("volumebar");
		spotifyHandler.dom.listeningOn = document.getElementById("listeningon");
		spotifyHandler.dom.listeningOnIcon = document.getElementById("listeningon-icon");
		spotifyHandler.dom.themeColor = document.querySelector("meta[name=theme-color]");
		spotifyHandler.dom.library = document.getElementById("library");
		spotifyHandler.dom.libraryPage = document.getElementById("librarypage");
		spotifyHandler.dom.search = document.getElementById("search");
		spotifyHandler.dom.searchPage = document.getElementById("searchpage");
		spotifyHandler.dom.searchBar = document.getElementById("searchbar");
		window.addEventListener("resize", spotifyHandler.fixArtSize);
		spotifyHandler.dom.artwork.addEventListener("loadstart", function(event) {
			spotifyHandler.dom.playerPage.style.background = null;
			spotifyHandler.dom.themeColor.setAttribute("content", "#1DB954");
		});
		spotifyHandler.dom.artwork.addEventListener("load", function(event) {
			spotifyHandler.fixArtSize();
			if (event.target.src.indexOf("data:image/gif;base64") != 0) {
				var vibrant = new Vibrant(event.target);
				var swatches = vibrant.swatches();
				if (swatches.Vibrant != undefined) {
					spotifyHandler.dom.playerPage.style.background = "linear-gradient(rgba("+swatches.Vibrant.rgb.join(",")+",0.7), #15161A 75%)";
					spotifyHandler.dom.themeColor.setAttribute("content", swatches.Vibrant.getHex());
				}
				else if (swatches.Muted != undefined) {
					spotifyHandler.dom.playerPage.style.background = "linear-gradient(rgba("+swatches.Muted.rgb.join(",")+",0.7), #15161A 75%)";
					spotifyHandler.dom.themeColor.setAttribute("content", swatches.Muted.getHex());
				}
				else {
					console.log(swatches);
					spotifyHandler.dom.playerPage.style.background = null;
					spotifyHandler.dom.themeColor.setAttribute("content", "#1DB954");
				}
			}
			else {
				spotifyHandler.dom.playerPage.style.background = null;
				spotifyHandler.dom.themeColor.setAttribute("content", "#1DB954");
			}
		});
		spotifyHandler.dom.playPauseButton.addEventListener("click", function(event) {
			spotifyHandler.dom.playPauseButton.disabled = true;
			if (spotifyHandler.dom.playPauseButton.title == "Pause") {
				spotifyHandler.api.pause({}, function() {
					spotifyHandler.dom.playPauseButton.disabled = false;
					spotifyHandler.dom.playPauseButton.innerHTML = "&#xe038;";
					spotifyHandler.dom.playPauseButton.title = "Play";
					setTimeout(function() {
						spotifyHandler.setCurrentlyPlaying();
					}, 250);
				});
			}
			else {
				spotifyHandler.api.play({}, function() {
					spotifyHandler.dom.playPauseButton.disabled = false;
					spotifyHandler.dom.playPauseButton.innerHTML = "&#xe035;";
					spotifyHandler.dom.playPauseButton.title = "Pause";
					setTimeout(function() {
						spotifyHandler.setCurrentlyPlaying();
					}, 250);
				});
			}
		});
		spotifyHandler.dom.nextButton.addEventListener("click", function(event) {
			spotifyHandler.dom.nextButton.disabled = true;
			spotifyHandler.api.skipToNext({}, function() {
				spotifyHandler.dom.nextButton.disabled = false;
				setTimeout(function() {
					spotifyHandler.setCurrentlyPlaying();
				}, 250);
			});
		});
		spotifyHandler.dom.previousButton.addEventListener("click", function(event) {
			spotifyHandler.dom.previousButton.disabled = true;
			spotifyHandler.api.skipToPrevious({}, function() {
				spotifyHandler.dom.previousButton.disabled = false;
				setTimeout(function() {
					spotifyHandler.setCurrentlyPlaying();
				}, 250);
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
		spotifyHandler.dom.devicesButton.addEventListener("click", function(event) {
			pageHandler.showPage("devicespage");
		});
		spotifyHandler.dom.queueButton.addEventListener("click", function(event) {
			pageHandler.showPage("queuepage");
		});
		spotifyHandler.dom.shuffleButton.addEventListener("click", function(event) {
			spotifyHandler.dom.shuffleButton.disabled = true;
			spotifyHandler.api.setShuffle(!spotifyHandler.lastPlaybackStatus.shuffle_state, {}, function(err, data) {
				spotifyHandler.dom.shuffleButton.disabled = false;
				if (err) {
					console.error(err);
				}
				else {
					setTimeout(function() {
						spotifyHandler.setCurrentlyPlaying();
					}, 250);
				}
			});
		});
		spotifyHandler.dom.repeatButton.addEventListener("click", function(event) {
			spotifyHandler.dom.repeatButton.disabled = true;
			var newState = {
				off: "context",
				context: "track",
				track: "off"
			};
			spotifyHandler.api.setRepeat(newState[spotifyHandler.lastPlaybackStatus.repeat_state], {}, function(err, data) {
				spotifyHandler.dom.repeatButton.disabled = false;
				if (err) {
					console.error(err);
				}
				else {
					setTimeout(function() {
						spotifyHandler.setCurrentlyPlaying();
					}, 250);
				}
			});
		});

		spotifyHandler.dom.queuePage.addEventListener("scroll", function(event) {
			if (event.target.offsetHeight + event.target.scrollTop + 1280 >= event.target.scrollHeight && spotifyHandler.fetchingQueue != true && spotifyHandler.queueOffset < spotifyHandler.queueTotal) {
				console.log("Scrolled near the end of queue, fetching more tracks");
				spotifyHandler.fetchQueueTracks(spotifyHandler.lastQueueType, spotifyHandler.lastQueueId, spotifyHandler.queueOffset);
			}
		});

		spotifyHandler.dom.libraryPage.addEventListener("scroll", function(event) {
			if (event.target.offsetHeight + event.target.scrollTop + 1280 >= event.target.scrollHeight && spotifyHandler.fetchingPlaylists != true) {
				console.log("Scrolled near the end of library, fetching more playlists");
				spotifyHandler.fetchPlaylists(spotifyHandler.playlistsOffset);
			}
		});

		spotifyHandler.dom.searchBar.addEventListener("input", function(event) {
			spotifyHandler.search(event.target.value);
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
				setInterval(spotifyHandler.refreshDevices, 5000);
				setInterval(spotifyHandler.setCurrentlyPlaying, 1000);
				setTimeout(function() {
					setInterval(function() {
						if (spotifyHandler.lastPlaybackStatus.is_playing) {
							progressBar.setValue(((spotifyHandler.lastPlaybackStatus.progress_ms + 500) / spotifyHandler.lastPlaybackStatus.item.duration_ms) * 100);
						}
					}, 1000);
				}, 500);
				spotifyHandler.api.setAccessToken(hash["access_token"]);
				pageHandler.showPage("playerpage");
				spotifyHandler.setCurrentlyPlaying();
				spotifyHandler.refreshDevices();
				spotifyHandler.loadLibrary();
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
		else {
			pageHandler.showPage('signinpage');
		}
	}
};