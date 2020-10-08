var pageHandler = {
    showPage: function(pageId) {
        pageHandler.hidePage();
        $("#"+pageId).addClass("active");
    },
    
    hidePage: function() {
        var pages = document.getElementsByClassName("page");
        for (var i = 0; i < pages.length; i++)
        {
            $(pages[i]).removeClass("active");
        }
    }
};