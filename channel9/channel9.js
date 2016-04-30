/*
Channel 9 plugin for Movian Media Center Copyright (C) 2011-2016 Fábio Ferreira

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

This program is also available under a commercial proprietary license.
*/

var SERVICE = require('showtime/service');
var PAGE = require('showtime/page');
var HTTP = require('showtime/http');
var HTML = require('showtime/html');
var PROP = require('showtime/prop');

var PREFIX = "channel9";

SERVICE.create("Channel 9", PREFIX + ":start", "video", true,
  Plugin.path + "logo.png");

new PAGE.Route(PREFIX + ":start", function(page) {
  page.metadata.icon = Plugin.path + "logo.png";
  page.metadata.title = "Channel 9";

  page.appendItem(PREFIX + ":videos:" + escape("https://channel9.msdn.com/Browse/AllContent"), "directory", {title: "All Content"});
  page.appendItem(PREFIX + ":folders:Shows:" + escape("https://channel9.msdn.com/Browse/Shows"), "directory", {title: "Shows"});
  page.appendItem(PREFIX + ":folders:Series:" + escape("https://channel9.msdn.com/Browse/Series"), "directory", {title: "Series"});
  page.appendItem(PREFIX + ":folders:Blogs:" + escape("https://channel9.msdn.com/Browse/Blogs"), "directory", {title: "Blogs"});
  page.appendItem(PREFIX + ":folders:Events:" + escape("https://channel9.msdn.com/Browse/Events") + ":recent", "directory", {title: "Events"});
  page.appendItem("https://channel9.msdn.com/Browse/Tags", "directory", {title: "Tags"});
  page.appendItem("https://channel9.msdn.com/Browse/Authors", "directory", {title: "Authors"});

  page.type = "list";
});

new PAGE.Route("https://channel9.msdn.com/Browse/Tags", function(page) {
  controller.tags(page, "https://channel9.msdn.com/Browse/Tags");
});

new PAGE.Route("https://channel9.msdn.com/Browse/Tags#(.*)", function(page, tag) {
  controller.tag(page, "https://channel9.msdn.com/Browse/Tags/firstLetter/" + tag + "/json");
});

new PAGE.Route("https://channel9.msdn.com/Browse/Authors", function(page) {
  controller.authors(page, null);
});

new PAGE.Route(PREFIX + ":folders:(.*):(.*)", function(page, type, url) {
  controller.folders(page, type, unescape(url));
});

new PAGE.Route(PREFIX + ":folders:(.*):(.*):(.*)", function(page, type, url, sort) {
  controller.folders(page, type, unescape(url), {"sort": sort});
});

new PAGE.Route(PREFIX + ":videos:(.*)", function(page, url) {
  controller.videos(page, unescape(url));
});

new PAGE.Route(PREFIX + ":videos:(.*):(.*)", function(page, url, sort) {
  controller.videos(page, unescape(url), {"sort": sort});
});

new PAGE.Route(PREFIX + ":video:(.*)", function(page, url) {
  controller.video(page, unescape(url));
});

/*
 * Searchers
 */
 new PAGE.Searcher("Channel 9 - Episodes", Plugin.path + "logo.png", function(page, query) {
   controller.search.episodes(page, query);
 });

 new PAGE.Searcher("Channel 9 - Authors", Plugin.path + "logo.png", function(page, query) {
   controller.authors(page, query);
 });

/*
 * Controller Functions
 */
var controller = {};

controller.authors = function(page, query) {
  page.loading = true;
  page.metadata.icon = Plugin.path + "logo.png";
  page.metadata.title = "Channel 9 - Authors";

  var url = "https://channel9.msdn.com/Browse/Authors";

  var pageNum = 1;
  page.entries = 0;
  var canContinue = true;
  function loader() {
    if (!canContinue) {
      page.haveMore(false);
      return;
    }

    var args = {"page": pageNum};
    if (query) args.term = query;
    var html = HTML.parse(httpRequest(url, args)).root;
    var entries = html.getElementByClassName("authors")[0].getElementByTagName("li");
    for (var i in entries) {
      var entry = entries[i];

      var itemUrl = PREFIX + ":videos:" + escape("https://channel9.msdn.com" +
        entry.getElementByClassName("button")[0].attributes.getNamedItem("href").value) + "/Posts";

      var metadata = {};
      metadata.title = entry.getElementByClassName("name")[0].textContent;
      metadata.icon = entry.getElementByClassName("avatar")[0].attributes.getNamedItem("src").value;

      page.appendItem(itemUrl, "video", metadata);
      page.entries++;
    }

    var hasNextPage = html.getElementByClassName("next").length > 0;
    if (hasNextPage) {
      pageNum++;
      page.haveMore(true);
    }
    else {
      canContinue = false;
      page.haveMore(false);
    }
  }

  page.type = "grid";
  page.asyncPaginator = loader;
  loader();
  page.loading = false;
}

controller.folders = function(page, title, url, args) {
  if (!args) args = {};

  page.loading = true;
  page.metadata.title = title;
  page.metadata.icon = Plugin.path + "logo.png";

  page.appendPassiveItem("separator", null, {
    "title": "Sort by"
  });

  function fillSortBy() {
    var html = HTML.parse(httpRequest(url, args)).root;
    var entries = html.getElementByClassName("tabs")[0].getElementByTagName("li");
    for (var i in entries) {
      var entry = entries[i];

      if (entry.getElementByTagName("a").length > 0) {
        var sort = entry.getElementByTagName("a")[0].attributes.getNamedItem("href").value;
        if (sort.indexOf("?sort=") != -1) sort = sort.match(/\?sort=([^#]*)/)[1];
        else sort = null;

        var itemUrl = PREFIX + ":folders:" + title + ":" + escape(url);
        if (sort) itemUrl += ":" + sort;

        var metadata = {};
        metadata.title = entry.getElementByTagName("a")[0].textContent;

        page.appendItem(itemUrl, "directory", metadata);
      }
    }

    var selected = html.getElementByClassName("tabs")[0].getElementByClassName("selected")[0].textContent;
    page.metadata.title += " (" + selected + ")";
  }

  fillSortBy();

  page.appendPassiveItem("separator", null, {
    "title": title
  });

  var pageNum = 1;
  function loader() {
    args.page = pageNum;
    var html = HTML.parse(httpRequest(url, args)).root;
    var entries = html.getElementByClassName("entries")[0].getElementByTagName("li");
    for (var i in entries) {
      var entry = entries[i];

      var itemUrl = PREFIX + ":videos:" + escape("https://channel9.msdn.com" +
        entry.getElementByClassName("title")[0].attributes.getNamedItem("href").value);

      var metadata = {};
      metadata.title = entry.getElementByClassName("entry-meta")[0].getElementByClassName("title")[0].textContent;

      metadata.icon = entry.getElementByClassName("thumb")[0].attributes.getNamedItem("src").value;
      if (metadata.icon[0] == '/') metadata.icon = "https://channel9.msdn.com" + metadata.icon;

      if (entry.getElementByClassName("description")[0].textContent)
        metadata.description = entry.getElementByClassName("description")[0].textContent.trim();

      if (entry.getElementByClassName("count").length > 0)
        metadata.duration = entry.getElementByClassName("count")[0].textContent + " episodes";

      page.appendItem(itemUrl, "video", metadata);
    }

    var hasNextPage = html.getElementByClassName("next").length > 0;
    if (hasNextPage) {
      pageNum++;
      page.haveMore(true);
    }
    else page.haveMore(false);
  }

  page.type = "grid";
  page.asyncPaginator = loader;
  page.loading = false;
}

controller.search = {};
controller.search.episodes = function(page, query) {
  page.loading = true;
  page.metadata.icon = Plugin.path + "logo.png";
  page.metadata.title = "Channel 9 - Episodes";

  var url = "https://c9search.azurewebsites.net/content/search";

  var offset = 0;
  var perPage = 15;
  var canContinue = true;
  function loader() {
    if (!canContinue) {
      page.haveMore(false);
      return;
    }

    var body = httpRequest(url, {"text": query, "$top": perPage, "$skip": offset});
    body = body.substring(body.indexOf("{"), body.lastIndexOf("});") + 1);

    var json = JSON.parse(body);

    var entries = json.documents;
    for (var i in entries) {
      var entry = entries[i];

      var itemUrl = entry.permalink;

      var metadata = {};
      metadata.title = entry.title;
      metadata.icon = entry.previewImage;
      metadata.description = entry.body;
      if (entry.mediaDuration > 0.0)
        metadata.duration = toDuration(entry.mediaDuration);

      var publishDate = new Date(Date.parse(entry.published));
      metadata.title += " (" + publishDate.toLocaleString() + ")";

      page.appendItem(itemUrl, "video", metadata);
    }

    offset += perPage;
    canContinue = offset < json.totalCount;
    page.haveMore(canContinue);
    page.entries = json.totalCount;
  }

  page.type = "list";
  page.asyncPaginator = loader;
  loader();
  page.loading = false;
}

controller.tag = function(page, url) {
  page.loading = true;
  page.metadata.icon = Plugin.path + "logo.png";
  page.metadata.title = "Tag";

  var json = JSON.parse(httpRequest(url));
  for (var i in json) {
    var entry = json[i];

    var itemUrl = PREFIX + ":videos:" + escape("https://channel9.msdn.com" + entry.href);

    var metadata = {};
    metadata.title = entry.name;

    page.appendItem(itemUrl, "directory", metadata);
  }

  page.type = "list";
  page.loading = false;
}

controller.tags = function(page, url) {
  page.loading = true;
  page.metadata.icon = Plugin.path + "logo.png";
  page.metadata.title = "Tags";

  var html = HTML.parse(httpRequest(url)).root;
  var entries = html.getElementByClassName("quickJump")[0].getElementByTagName("li");
  for (var i in entries) {
    var entry = entries[i];

    var itemUrl = url + entry.getElementByTagName("a")[0].attributes.getNamedItem("href").value;

    var metadata = {};
    metadata.title = entry.getElementByTagName("a")[0].textContent;

    page.appendItem(itemUrl, "directory", metadata);
  }

  page.type = "list";
  page.loading = false;
}

controller.video = function(page, url) {
  page.loading = true;
  page.metadata.icon = Plugin.path + "logo.png";

  var html = HTML.parse(httpRequest(url)).root;

  page.metadata.title = html.getElementByClassName("entry-header")[0].getElementByTagName("h1")[0].textContent;

  if (html.getElementByClassName("download").length > 0) {
    var viewCount = parseInt(html.getElementByClassName("views")[0].getElementByClassName("count")[0].textContent);
    var duration = toDuration(html.getElementByClassName("entry-caption")[0].textContent);
    var thumb = getMetaProperty(html, "og:image");
    var downloads = html.getElementByClassName("download")[0].getElementByTagName("li");
    for (var i in downloads) {
      var download = downloads[i];

      var title = download.getElementByTagName("a")[0].textContent;
      var url = download.getElementByTagName("a")[0].attributes.getNamedItem("href").value;

      page.appendItem(url, "video", {
        "title": title,
        "icon": thumb,
        "duration": duration,
        "viewCount": viewCount
      });
    }
  }
  else {
    page.appendPassiveItem("default", null, {
      "title": "Video possibly not yet available"
    });
  }

  page.type = "list";
  page.loading = false;
}

controller.videos = function(page, url, args) {
  page.loading = true;
  page.metadata.icon = Plugin.path + "logo.png";
  page.metadata.title = "Videos";

  function fillSortBy() {
    var html = HTML.parse(httpRequest(url, args)).root;

    if (html.getElementByClassName("entries").length > 0 &&
      html.getElementByClassName("tabs").length > 0) {
      page.appendPassiveItem("separator", null, {
        "title": "Sort by"
      });

      var entries = html.getElementByClassName("tabs")[0].getElementByTagName("li");
      for (var i in entries) {
        var entry = entries[i];

        if (entry.getElementByTagName("a").length > 0) {
          var sort = entry.getElementByTagName("a")[0].attributes.getNamedItem("href").value;
          if (sort[0] == '#') continue;

          if (sort.indexOf("?sort=") != -1) sort = sort.match(/\?sort=([^#]*)/)[1];
          else sort = null;

          var itemUrl = PREFIX + ":videos:" + escape(url);
          if (sort) itemUrl += ":" + sort;

          var metadata = {};
          metadata.title = entry.getElementByTagName("a")[0].textContent;

          page.appendItem(itemUrl, "directory", metadata);
        }
      }

      var selected = html.getElementByClassName("tabs")[0].getElementByClassName("selected")[0].textContent;
      page.metadata.title += " (" + selected + ")";
    }
  }

  fillSortBy();

  page.appendPassiveItem("separator", null, {
    "title": "Videos"
  });

  var pageNum = 1;
  page.entries = 0;
  function loader() {
    if (!args) args = {};
    args.page = pageNum;
    var html = HTML.parse(httpRequest(url, args)).root;

    if (html.getElementByClassName("alert info").length > 0) {
      var message = html.getElementByClassName("alert info")[0].getElementByTagName("p")[0].textContent;
      page.appendPassiveItem("default", null, {
        "title": message
      });

      page.haveMore(false);
      return;
    }

    var entries = html.getElementByClassName("entries")[0].getElementByTagName("li");
    for (var i in entries) {
      var entry = entries[i];

      if (entry.getElementByClassName("entry-image").length > 0) {
        var itemUrl = PREFIX + ":video:" + escape("https://channel9.msdn.com" +
          entry.getElementByTagName("a")[0].attributes.getNamedItem("href").value);

        var metadata = {};
        metadata.title = entry.getElementByClassName("entry-meta")[0].getElementByClassName("title")[0].textContent;
        metadata.icon = entry.getElementByClassName("thumb")[0].attributes.getNamedItem("src").value;
        metadata.description = entry.getElementByClassName("description")[0].textContent.trim();
        if (entry.getElementByClassName("entry-caption").length > 0)
          metadata.duration = toDuration(entry.getElementByClassName("entry-caption")[0].textContent);

        if (entry.getElementByClassName("date").length > 0)
          metadata.title += " (" + entry.getElementByClassName("date")[0].textContent + ")";

        page.appendItem(itemUrl, "video", metadata);
        page.entries++;
      }
    }

    var hasNextPage = html.getElementByClassName("next").length > 0;
    if (hasNextPage) {
      pageNum++;
      page.haveMore(true);
    }
    else {
      page.haveMore(false);
      if(page.entries === 0) {
        page.appendPassiveItem("default", null, {
          "title": "Apparently there are no videos yet"
        });
      }
    }
  }

  page.type = "list";
  page.asyncPaginator = loader;
  //loader();
  page.loading = false;
}

/**
 * Auxiliary Functions
 */

function getMetaProperty(doc, property) {
  var metas = doc.getElementByTagName("meta");
  for (var i in metas) {
    var meta = metas[i];

    var type = meta.attributes.getNamedItem("property");
    if (type && type.value === property)
      return meta.attributes.getNamedItem("content").value;
  }

  return null;
}

function httpRequest(url, args) {
  var request = HTTP.request(url, {
    "args": args
  });
  return request.toString();
}

function toDuration(value) {
  var minutes = -1;
  var seconds = 0;

  // try first string regex
  if (typeof(value) === "string") {
    var regex = /(.+?) minute[s]?, (.+?) second[s]?/;
    var match = value.match(regex);
    if (match) {
      minutes = parseInt(match[1]);
      seconds = parseInt(match[2]);
    }
  }

  // try double regex
  if (typeof(value) === "number") {
    minutes = Math.floor(value);
    seconds = Math.floor((value - minutes) * 60);
  }

  if (minutes >= 0) {
    var text = "";

    text += minutes;

    text += ":";

    if (seconds < 10) text += "0";
    text += seconds;

    return text;
  }

  return null;
}

var log = {
  "deep": function(data, depth) {
    if (!depth) depth = 0;

    var body = "";
    for (var i = 0; i < depth; i++) body += "  ";
    if (depth > 0) body += "'-> ";

    if (typeof(data) === 'boolean') console.log(body + data);
    else if (typeof(data) === 'number') console.log(body + data);
    else if (typeof(data) === 'string') console.log(body + data);
    else if (typeof(data) === 'undefined') console.log(body + "UNDEFINED");
    else if (Array.isArray(data)) {
      if (data.length === 0) console.log(body + "[]");
      else {
        for (var i in data) {
          console.log(body + "[" + i + "]" + ": ");
          this.deep(data[i], depth + 1);
        }
      }
    }
    else if (typeof(data) === 'object') {
      if (Object.keys(data).length === 0) console.log(body + "{}");
      else {
        for (var key in data) {
          console.log(body + key + ": ");
          this.deep(data[key], depth + 1);
        }
      }
    }
    else if (typeof(data) === 'function') console.log(body + "Function()");
    else console.log(body + "Unknown data type");
  }
};
