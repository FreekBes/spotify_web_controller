var pageHandler = {
	shown: "loadingpage",

	showPage: function(pageId) {
		pageHandler.hidePage();
		$("#"+pageId).addClass("active");
		pageHandler.shown = pageId;
		if (pageId == "playerpage") {
			spotifyHandler.fixArtSize();
		}
		if (pageId == "searchpage") {
			document.getElementById("searchbar").focus();
		}
	},
	
	hidePage: function() {
		var pages = document.getElementsByClassName("page");
		for (var i = 0; i < pages.length; i++)
		{
			$(pages[i]).removeClass("active");
		}
		pageHandler.shown = null;
	}
};