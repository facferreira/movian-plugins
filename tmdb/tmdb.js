/*
TMDb plugin for Movian Media Center Copyright (C) 2012-2016 Fábio Ferreira

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

(function(plugin) {
	var plugin_info = plugin.getDescriptor();
    var PREFIX = plugin_info.id;

    var service = plugin.createService(plugin_info.title, PREFIX + ":start", "video", true,
			   plugin.path + "logo.png");

    var settings = plugin.createSettings(plugin_info.title,
					  plugin.path + "logo.png",
					 plugin_info.synopsis);

    var store_auth = plugin.createStore('auth', true);
    store_auth.session;
    store_auth.id;
    store_auth.username;
    if (!store_auth.session) {
        store_auth.session = "";
    }

    settings.createInfo("info",
				 plugin.path + "logo.png",
				 "Plugin developed by facanferff.");

    settings.createString("searchSource1", "Search Source #1", "", function (v) { service.searchSource1 = v; });
    settings.createString("searchSource2", "Search Source #2", "", function (v) { service.searchSource2 = v; });
    settings.createString("searchSource3", "Search Source #3", "", function (v) { service.searchSource3 = v; });

    settings.createDivider("TMDB View");
    settings.createBool("cast", "Show Cast", true, function (v) { service.cast = v; });
    settings.createBool("crew", "Show Crew", true, function (v) { service.crew = v; });
    settings.createBool("trailers", "Show Trailers", false, function (v) { service.trailers = v; });
    settings.createBool("collection", "Show Collection", false, function (v) { service.collection = v; });
    settings.createBool("lists", "Show Lists that have a movie", false, function (v) { service.lists = v; });
    settings.createBool("similar_movies", "Show Similar Movies", false, function (v) { service.similar_movies = v; });
    settings.createBool("extras", "Show Extras", true, function (v) { service.extras = v; });

    settings.createDivider("Home page");
    settings.createBool("upcoming", "Show Upcoming", true, function (v) { service.upcoming = v; });
    settings.createBool("now_playing", "Show Now Playing", true, function (v) { service.now_playing = v; });
    settings.createBool("top_rated", "Show Top Rated", true, function (v) { service.top_rated = v; });
    settings.createBool("popular", "Show Popular", true, function (v) { service.popular = v; });
    //settings.createBool("tv_top_rated", "Show TV Top Rated", true, function (v) { service.tv_top_rated = v; });
    //settings.createBool("tv_popular", "Show TV Popular", true, function (v) { service.tv_popular = v; });
    settings.createBool("people_popular", "Show Popular People", true, function (v) { service.people_popular = v; });

    settings.createDivider("Search Settings");
    settings.createBool("show_all_movies", "Show a page with all movies found", false, function (v) { service.show_all_movies = v; });

    var api = new TMDB();
    api.init();
    var imdb = new IMDB();
    var util = new Util();
    var shortener = new GoogleUrlShortener();
    var kim = new KidsInMind();

    function requestUserAnswer(message) {
        var query = showtime.textDialog(message, true, false);

        if (query.rejected) {
            return null;
        }

        var answer = query.input;
        if (answer.length == 0) {
            return null;
        }

        return answer;
    }

    function openMovieItemhook(obj, nav, title) {
      title = title.replace(/<.+?>/g, "").replace(/[ ]+/g, " ").replace(/\(.+?\)/,"");
      t("TMDb: " + title);
      var args = {
        mode: 0,
        query: title
      };

      /*t(obj.metadata);
			for (var i in obj.metadata) {
				p(i + ": " + obj.metadata[i]);
			}*/

      args.sources = [{
        title: title,
        //image: obj.metadata.icon ? obj.metadata.icon : "",
        url: obj.url.toString()
      }];

      //args.year = null;
      if (obj.metadata.year.toString() != "null")
        args.year = parseInt(obj.metadata.year.toString());

      if (obj.metadata.imdbid.toString() != "null") {
        args.query = obj.metadata.imdbid.toString();
        args.mode = 2;
      }

			if (obj.metadata.icon.toString() != "null") {
				args.sources[0].image = obj.metadata.icon.toString();
			}

      if (!service.show_all_movies) {
				/*for (var i in args) {
					p(i + ": " + args[i]);
				}*/
				var arguments = escape(JSON.stringify(args));
        nav.openURL(PREFIX + ":movie:play:" + arguments);
			}
      else {
      	nav.openURL(PREFIX + ":search:movies:" + escape(title) + ":" + args.year);
			}
    }

    plugin.addItemHook({
      "title": "View in TMDb (Movie)",
      "itemtype": "video",
			"icon": "",
      handler: function(obj, nav) {
        var title = obj.metadata.title.toString();
        openMovieItemhook(obj, nav, title);
      }
    });

    plugin.addItemHook({
      title: "View in TMDb (Movie) - Custom Title",
      itemtype: "video",
      handler: function(obj, nav) {
        var title = requestUserAnswer("Title: ");
        if (!title || title === "")
          return;
        openMovieItemhook(obj, nav, title);
      }
    });

    /*if (showtime.currentVersionInt >= 4 * 10000000 + 3 * 100000 + 261) {
        plugin.addItemHook({
            title: "View in TMDb (TV Show)",
            itemtype: "video",
            handler: function(obj, nav) {
                var title = obj.metadata.title;
                title = title.replace(/<.+?>/g, "").replace(/[ ]+/g, " ");
                t("TMDb: " + title);
                var args = {
                    mode: 0,
                    query: title
                };

                t(obj.metadata);

                args.sources = [
                    {
                        title: title,
                        //image: obj.metadata.icon ? obj.metadata.icon : "",
                        url: obj.url
                    }
                ];

                if (obj.metadata.year)
                    args.year = obj.metadata.year;

                if (obj.metadata.imdbid) {
                    args.query = obj.metadata.imdbid;
                    args.mode = 2;
                }
                nav.openURL(PREFIX + ":tv:play:" + escape(showtime.JSONEncode(args)));
            }
        });
    }

    if (showtime.currentVersionInt >= 4 * 10000000 + 3 * 100000 + 261) {
        plugin.addItemHook({
            title: "View in TMDb (TV Show) - Custom Title",
            itemtype: "video",
            handler: function(obj, nav) {
                var title = requestUserAnswer("Title: ");
                if (!title || title === "")
                    return;
                title = title.replace(/<.+?>/g, "").replace(/[ ]+/g, " ");
                t("TMDb: " + title);
                var args = {
                    mode: 0,
                    query: title
                };

                t(obj.metadata);

                args.sources = [
                    {
                        title: title,
                        //image: obj.metadata.icon ? obj.metadata.icon : "",
                        url: obj.url
                    }
                ];

                if (obj.metadata.year)
                    args.year = obj.metadata.year;

                if (obj.metadata.imdbid) {
                    args.query = obj.metadata.imdbid;
                    args.mode = 2;
                }
                nav.openURL(PREFIX + ":tv:play:" + escape(showtime.JSONEncode(args)));
            }
        });
    }*/

    function pageMenu(page) {
        //page.metadata.background = plugin.path + "views/img/background.png";

        //page.appendAction("navopen", PREFIX + ":standard:lists", true, { title: "Standard Lists", icon: plugin.path + "views/img/list.png", hidden: true });
        //page.appendAction("navopen", PREFIX + ":genre:list", true, { title: "Genres", icon: plugin.path + "views/img/list.bmp", hidden: true });

        page.appendAction("navopen", PREFIX + ":search", true, { title: "Search", icon: plugin.path + "views/img/search.png", hidden: true });

        page.appendAction("navopen", PREFIX + ":user", true, { title: "User Profile", icon: plugin.path + "views/img/user.png", hidden: true });
    }

    plugin.addURI(PREFIX + ":text:(.*):(.*):(.*)", function (page, title, data, mode) {
        // Page Menu
        pageMenu(page);

        page.type = "directory";
        page.metadata.glwview = plugin.path + "views/text.view";

        var content = unescape(data);

        if (mode == "1")
            content = showtime.httpGet(content).toString();

        page.appendPassiveItem("bodytext", new showtime.RichText(content));

        page.metadata.title = unescape(title);
        page.metadata.content = content;
        page.metadata.lines = content.replace(/\n\n/g, "\n").split("\n").length;

        page.loading = false;
    });

    function pageController(page, loader) {
        var offset = 1;

        function paginator() {
            while(true) {
                var data = loader(offset);

                page.entries = data.total_results;
                var total_pages = data.total_pages;

                var items = data.results;
                for (var k = 0; k < items.length; k++) {
                    var it = items[k];
                    try {
                        var title = it.original_title;
                        if (!title) // for tv shows
                            title = it.name;
                        var metadata = {
                            title: title,
                            icon: "tmdb:image:poster:" + it.poster_path
                        }
                        if (it.backdrop_path)
                            metadata.background = "tmdb:image:backdrop:" + it.backdrop_path;
                        page.appendItem(PREFIX + ":movie:" + it.id + ":2", "directory", metadata);
                    }
                    catch (ex) {
                        t("Skipping 1 item because: ");
                        e(ex);
                    }
                }

                page.loading = false;

                if(offset == total_pages)
                    break;

                offset++;
                page.contents = "movies";
                page.metadata.glwview = plugin.path + "views/posters.view";
            }

            return offset < page.entries;
        }

        paginator();
        page.paginator = paginator;
    }

    plugin.addURI(PREFIX + ":search:movies:(.*):(.*)", function (page, query, year) {
        page.type = "directory";
        page.loading = false;

        page.metadata.glwview = plugin.path + "views/loading.view";

        query = unescape(query);
        year = year == "null" ? null : parseInt(year);
        var data = api.searchMoviesByQuery(query, year);
        if (!data) {
            page.error("Failed to search for movies.");
            return;
        }
        p(data);

        page.entries = data.total_results;
        var total_pages = data.total_pages;

        var items = data.results;
        for (var k = 0; k < items.length; k++) {
            var it = items[k];
            try {
                var title = it.original_title;
                if (!title) // for tv shows
                    title = it.name;
                var metadata = {
                    title: title,
                    icon: "tmdb:image:poster:" + it.poster_path
                }
                if (it.backdrop_path)
                    metadata.background = "tmdb:image:backdrop:" + it.backdrop_path;
                page.appendItem(PREFIX + ":movie:" + it.id + ":2", "directory", metadata);
            }
            catch (ex) {
                t("Skipping 1 item because: ");
                e(ex);
            }
        }

        page.loading = false;

        page.contents = "movies";
        page.metadata.glwview = plugin.path + "views/posters.view";

        page.metadata.title = "List";

        page.loading = false;
    });

    plugin.addURI(PREFIX + ":lists:(.*):(.*)", function (page, section, id) {
        page.type = "grid";
        page.loading = false;

        page.metadata.glwview = plugin.path + "views/loading.view";

        pageController(page, function(offset) {
            return api.getData(section, null, id, offset);
        });

        page.metadata.title = "List";

        page.loading = false;
    });

    plugin.addURI(PREFIX + ":lists:add:(.*)", function (page, media_id) {
        page.type = "directory";
        page.loading = false;

        if (!api.authenticated()) {
            page.error("User should be authenticated in order to add an item to a list.");
            return;
        }

        page.metadata.glwview = plugin.path + "views/loading.view";

        var item1 = api.getData("account", api.id, "lists");
        if (item1 && item1.total_results) {
            var lists = [];
            for (var i in item1.results) {
                try {
                    var list = item1.results[i];
                    var image = "tmdb:image:profile:" + list.poster_path;
                    if (!list.poster_path || list.poster_path == "null") image = plugin.path + "views/img/question.png";
                    page.appendItem(PREFIX + ":list:" + list.id + ":add:" + media_id, "directory", {
                        title: list.name,
                        icon: image
                    });
                }
                catch (ex) {
                    showtime.trace("Skipped 1 list because: ");
                    e(ex);
                }
            }
        }
        else {
            page.error("It was not possible to satisfy the request.");
            return;
        }

        /*page.appendItem(PREFIX + ":list:new:add:" + media_id, "directory", {
            title: "New list",
            icon: plugin.path + "views/img/add_list.png"
        });*/

        page.contents = "movies";
        page.metadata.glwview = plugin.path + "views/posters.view";

        page.metadata.title = "Add to list";

        page.loading = false;
    });

    plugin.addURI(PREFIX + ":list:new:add:(.*)", function (page, media_id) {
        page.type = "directory";

        page.loading = false;

        var query = showtime.textDialog('Title of the list: ', true, false);

        if (query.rejected) {
            page.error('User didn\'t specify the name of the list.');
            return;
        }

        var name = query.input;
        if (name.length == 0) {
            page.error('Empty list\'s name.');
            return;
        }

        var data = api.createList(name);
        if (!data || data.status_code != 1) {
            if (data && data.status_message)
                page.error(data.status_message);
            else
                page.error("There was an error while trying to create the list");
            return;
        }

        for (var i in args) {
            p(i + ": " + args[i]);
        }

        var list_id = data.list_id;

        var res = api.addListItem(list_id, media_id);
        if (res != null) {
            showtime.notify(res, 3);
        }
        else {
            showtime.notify("Movie added successfully to list", 3);
        }
        page.redirect(PREFIX + ":movie:" + media_id + ":1");

        page.loading = false;
    });

    plugin.addURI(PREFIX + ":kim:parentsguide:(.*)", function (page, title) {
        page.type = "raw";
        page.metadata.glwview = plugin.path + "views/kim_parentsguide.view";

        var kim_url = kim.searchMovie(unescape(title));
        if (kim_url) {
            var rating = kim.getMovie(kim_url);
            var guide = kim.getParentsGuide(kim_url);

            page.metadata.ratings = [
                {
                    title: "Sex/Nudity",
                    rating: parseInt(rating.nudity) / 10
                },
                {
                    title: "Violence/Gore",
                    rating: parseInt(rating.violence) / 10
                },
                {
                    title: "Profanity",
                    rating: parseInt(rating.profanity) / 10
                }
            ];

            var content = "";
            if (guide.nudity) content += "SEX/NUDITY\n" + guide.nudity + "\n";
            if (guide.violence) content += "VIOLENCE/GORE\n" + guide.violence + "\n";
            if (guide.profanity) content += "PROFANITY\n" + guide.profanity + "\n";
        }
        else var content = "No Parents Guide has been found.";

        page.metadata.content = new showtime.RichText(content);

        page.metadata.title = unescape(title);

        page.loading = false;
    });

    plugin.addURI(PREFIX + ":imdb:parentsguide:(.*)", function (page, id) {
        page.type = "raw";
        page.metadata.glwview = plugin.path + "views/text.view";

        var parentsguide = imdb.getParentsGuide(id);
        var body = "";
        if (parentsguide)
            body = showtime.entityDecode(parentsguide.replace(/<br\/>/g, "\n").replace(/<(.+?)>/g, ""));
        else
            body = "No information found for this movie.";

        page.metadata.content = new showtime.RichText(body);

        page.metadata.title = "IMDB - Parent's Guide";

        page.loading = false;
    });

    plugin.addURI(PREFIX + ":search", function (page) {
        page.type = "grid";
        //page.metadata.glwview = plugin.path + "views/lists.view";

        page.metadata.curPage = PREFIX + ":search";

        pageMenu(page);

        var search = showtime.textDialog('Search for Movies/Persons/Companies/Lists:', true, false);

        if (search.rejected) {
            return;
        }
        var searchstring = search.input;
        if (searchstring.length == 0) {
            return;
        }

        //var searchstring = unescape(input);

        var search_movies = [];
        var data = api.getData("search", "movie", null, null, {
            'query': searchstring
        });

				page.appendPassiveItem("separator", null, {
					"title": "Movies"
				});
        for (var i in data.results) {
            var it = data.results[i];
            var image = it.poster_path;
						if (!image || image == "null") image = plugin.path + "views/img/question.png";
            else image = "tmdb:image:poster:" + image;
            search_movies.push({
                title: it.title,
                icon: image,
                url: PREFIX + ":movie:" + it.id + ":1"
            });

						page.appendItem(PREFIX + ":movie:" + it.id + ":1", "directory", {
							title: it.title,
							icon: image
						});
        }

        //page.appendPassiveItem("list", search_movies, { title: "Search Movies" });


        var search_persons = [];
        var data = api.getData("search", "person", null, null, {
            'query': searchstring
        });

				page.appendPassiveItem("separator", null, {
					"title": "People"
				});
        for (var i in data.results) {
            var item = data.results[i];
            var image = item.profile_path;
            if (!image || image == "null") image = plugin.path + "views/img/person.png";
            else image = "tmdb:image:profile:" + image;
            search_persons.push({
                title: item.name,
                image: image,
                url: PREFIX + ":person:" + item.id
            });

						page.appendItem(PREFIX + ":person:" + item.id, "directory", {
							title: item.name,
							icon: image
						});
        }

        //page.appendPassiveItem("list", search_persons, { title: "Search Persons" });


        var search_lists = [];
        var data = api.getData("search", "list", null, null, {
            'query': searchstring
        });

        if (data) {
						page.appendPassiveItem("separator", null, {
							"title": "Lists"
						});
            for (var i in data.results) {
                var item = data.results[i];
                var image = item.poster_path;
                if (!image || image == "null") image = plugin.path + "views/img/question.png";
                else image = "tmdb:image:profile:" + image;
                search_lists.push({
                    title: item.name,
                    image: image,
                    url: PREFIX + ":list:" + item.id
                });

								page.appendItem(PREFIX + ":list:" + item.id, "directory", {
									title: item.name,
									icon: image
								});
            }

            //page.appendPassiveItem("list", search_lists, { title: "Search Lists" });
        }


        var search_companies = [];
        var data = api.getData("search", "company", null, null, {
            'query': searchstring
        });

        if (!data) {
						page.appendPassiveItem("separator", null, {
							"title": "Companies"
						});
            for (var i in data.results) {
                var item = data.results[i];
                var image = item.logo_path;
                if (!image || image == "null") image = plugin.path + "views/img/question.png";
                else image = "tmdb:image:logo:" + image;
                search_companies.push({
                    title: item.name,
                    image: image,
                    url: PREFIX + ":company:" + item.id
                });

								page.appendItem(PREFIX + ":company:" + item.id, "directory", {
									title: item.name,
									icon: image
								});
            }

            //page.appendPassiveItem("list", search_companies, { title: "Search Companies" });
        }

        page.loading = false;
    });

    function startPage(page) {
        page.type = "grid";
        page.metadata.glwview = plugin.path + "views/loading.view";
        page.loading = false;

        page.metadata.curPage = PREFIX + ":standard:lists";

        pageMenu(page);

				page.appendPassiveItem("separator", null, {
						"title": "Extras"
				});

				/*page.appendItem(PREFIX + ":genre:list", "directory", {
						title: "Genres",
						icon: plugin.path + "views/img/list.bmp"
				});*/

				page.appendItem(PREFIX + ":search", "directory", {
					title: "Search",
					icon: plugin.path + "views/img/search.png"
				});

				page.appendItem(PREFIX + ":user", "directory", {
						title: "User Profile",
						icon: plugin.path + "views/img/user.png"
				});

        if (service.upcoming) {
            page.metadata.message = "Preparing to parse Upcoming Movies list";
            parseHomePageList(page, 'Movies - Upcoming', 'movie', 'upcoming');
        }

        if (service.now_playing) {
            page.metadata.message = "Preparing to parse Now Playing Movies list";
            parseHomePageList(page, 'Movies - Now Playing', 'movie', 'now_playing');
        }

        if (service.popular) {
            page.metadata.message = "Preparing to parse Popular Movies list";
            parseHomePageList(page, 'Movies - Popular', 'movie', 'popular');
        }

        if (service.top_rated) {
            page.metadata.message = "Preparing to parse Top Rated Movies list";
            parseHomePageList(page, 'Movies - Top Rated', 'movie', 'top_rated');
        }

        if (service.tv_top_rated) {
            page.metadata.message = "Preparing to parse TV Top Rated list";
            parseHomePageList(page, 'TV - Top Rated', 'tv', 'top_rated');
        }

        if (service.tv_popular) {
            page.metadata.message = "Preparing to parse TV Popular list";
            parseHomePageList(page, 'TV - Popular', 'tv', 'popular');
        }

        if (service.people_popular) {
            page.metadata.message = "Preparing to parse Popular People list";
            parseHomePageList(page, 'People - Popular', 'person', 'popular');
        }

        page.loading = false;
        page.metadata.glwview = plugin.path + "views/lists.view";
    }

    function parseHomePageList(page, title, section, request) {
				page.appendPassiveItem("separator", null, {
					"title": title
				});

        var data = api.getData(section, null, request);
        if (data) {
            var list = [];
            for (var i in data.results) {
                var it = data.results[i];
                var image = "tmdb:image:profile:" + it.poster_path;
                if (!it.poster_path || it.poster_path == "null") {
									if (section === 'person') image = plugin.path + "views/img/person.png";
									else image = plugin.path + "views/img/question.png";
								}

                if (it.profile_path && it.profile_path !== "null") {
									image = "tmdb:image:profile:" + it.profile_path;
								}

                var background = "tmdb:image:backdrop:" + it.backdrop_path;
                if (!it.backdrop_path || it.backdrop_path == "null") background = plugin.path + "views/img/background.png";

                var title1 = it.title;
                if (!title1)
                    title1 = it.name;

                var url = PREFIX + ":" + section + ":" + it.id;
                if (section == 'movie' || section == 'tv')
                    url += ":1"

                list.push({
                    title: title1,
                    image: image,
                    url: url,
                    background: background
                });

								page.appendItem(url, "video", {
									"title": title1,
									"icon": image,
									"background": background
								});
            }
            list.push({
                title: "See more",
                image: plugin.path + "views/img/add.png",
                url: PREFIX + ":lists:" + section + ":" + request
            });
            /*page.appendPassiveItem("list", list, {
                title: title,
                url: PREFIX + ":lists:" + section + ":" + request
            });*/

						page.appendItem(PREFIX + ":lists:" + section + ":" + request, "directory", {
							"title": "See more",
							"icon": plugin.path + "views/img/add.png"
						});
        }
    }

    function GoogleUrlShortener() {
        this.key = "AIzaSyD1r1jmKuuVwFkg6FXcck2xywK7uHVL60A";

        this.shorten_link = function (link) {
            try {
								var postdata = {
									"longUrl": link
								}
								postdata = JSON.stringify(postdata);

								var req = showtime.httpReq("https://www.googleapis.com/urlshortener/v1/url", {
									args: {
										"key": this.key
									},
									method: "POST",
									postdata: postdata,
									headers: {
										'Content-Type': 'application/json',
										'Referer': 'https://showtimemediacenter.com/'
									}
								});

								var data = JSON.parse(req.toString());
								return data.id;
            }
            catch (ex) {
                showtime.trace("Shorten Link: " + ex);
                return link;
            }
        }
    }

    function IMDB() {
        this.getParentsGuide = function (id) {
            try {
                var data = showtime.httpGet("http://www.imdb.com/title/" + id + "/parentalguide").toString();
                var init = data.indexOf('<div id="swiki.2.view">');
                var end = data.indexOf('<div id="swiki_control2">');
                data = data.slice(init, end).replace(/\r?\n/g, "");
                var split = data.split('<div class="section">');
                var j = 0;
                var body = "";
                for (var i in split) {
                    if (i > 5)
                        break;
                    var item = split[i];
                    var title = item.match("<span>(.+?)<\/span>");
                    if (item.indexOf('<p id="swiki.2.' + (i + 1) + '.1"></p>') != -1)
                        continue;
                    var paragraph = item.match('<p id="swiki.2...1">(.+?)<\/p>');
                    if (title && paragraph) {
                        body += title[1] + "\n" + paragraph[1] + "\n\n";
                        j++;
                    }
                }
                if (j == 0) {
                    return false;
                }
                else {
                    return body;
                }
            }
            catch (ex) { return false; }
        }
    }

    function Util() {
        this.insertionSort = function(array, field) {
            for (var i = 0, j, tmp; i < array.length; ++i) {
                tmp = array[i];

                for (j = i - 1; j >= 0 && array[j][field] > tmp[field]; --j)
                    array[j + 1] = array[j];
                array[j + 1] = tmp;
            }

            return array;
        }
    }

    function TMDB() {
        //this.key = "78d57cc453f9a284f483a0969ee65578";
        this.key = "7d96be668cf87445a253be87dcf164f0";
        this.session = "";

        this.init = function () {
            for (var i in store_auth) {
                var value = store_auth[i];
                this[i] = value;
            }

						this.session = store_auth.session;
						this.id = store_auth.id;
        }

        this.authenticated = function () {
            if (this.session && this.session != "" && this.id && this.id != "")
                return true;

            /*if (this.session && this.session != "") {
                var data = this.getData("account");
                if (!data) {
                    t("There was an error while authenticating");
                    this.session = null;
                    return false;
                }
                this.id = data.id;
                return true;
            }*/
            else return false;
        }

        this.addFavorite = function (movie_id) {
            var body = {
                'movie_id': movie_id,
                'favorite': true
            };

            try {
                var data = showtime.httpReq("https://api.themoviedb.org/3/account/" + this.id + "/favorite", {
									"postdata": showtime.JSONEncode(body),
									"args": {
                    'api_key': this.key,
                    'session_id': this.session
                	},
									"headers": {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
									}
                }).toString();

                showtime.notify("Added succesfully movie to favorites.", 2);
            }
            catch (ex) {
                showtime.trace(ex);
                showtime.notify("Failed to add movie to favorites.", 2);
            }
        }

        this.addWatchList = function (movie_id) {
            var body = {
                'movie_id': movie_id,
                'movie_watchlist': true
            };

            try {
                var data = showtime.httpPost("https://api.themoviedb.org/3/account/" + this.id + "/movie_watchlist", showtime.JSONEncode(body), {
                    'api_key': this.key,
                    'session_id': this.session
                }, {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }).toString();

                showtime.notify("Added succesfully movie to Watch List.", 2);
            }
            catch (ex) {
                showtime.trace(ex);
                showtime.notify("Failed to add movie to Watch List.", 2);
            }
        }

        this.request_token = function () {
            try {
                var request = showtime.httpGet("https://api.themoviedb.org/3/authentication/token/new", {
                    "api_key": this.key
                });
                var data = showtime.JSONDecode(request.toString());

                if (data.success) {
                    this.request_token = data.request_token;

                    data.url = request.headers["Authentication-Callback"];
                    return data;
                }
                else return null;
            }
            catch (ex) {
                return null;
            }
        }

        this.session_id = function () {
            try {
                var request = showtime.httpGet("https://api.themoviedb.org/3/authentication/session/new", {
                    "api_key": this.key,
                    "request_token": this.request_token
                });
                var data = showtime.JSONDecode(request.toString());

                if (data.success) {
                    this.session = data.session_id;

                    store_auth.session = this.session;

                    var info = this.getData("account");
                    if (!info) {
                        this.session = "";
                        throw new Exception("Couldn't parse user's ID.");
                    }

                    for (var i in info) {
                        this[i] = info[i];
                        store_auth[i] = info[i];
                    }

										this.id = info.id;

                    /*var match = this.expires.match("(.+?)-(.+?)-(.+?) (.+?):(.+?):(.+?) (.+?)00");
                    var year = parseInt(match[1]);
                    var month = parseInt(match[2]);
                    var day = parseInt(match[3]);
                    var hours = parseInt(match[4]) - parseInt(match[7]);
                    var minutes = parseInt(match[5]);
                    var seconds = parseInt(match[6]);
                    store_auth.expires = new Date(year, month, day, hours, minutes, seconds).getTime().toString();*/

                    return data;
                }
            }
            catch (ex) {
                e(ex);
            }
            return null;
        }

        var stopstrings = [
			"1080",
			"1080P",
			"3D",
			"720",
			"720P",
			"AC3",
			"AE",
            "AKA",
			"AHDTV",
			"ANALOG",
			"AUDIO",
			"BDRIP",
			"CAM",
			"CD",
			"CD1",
			"CD2",
			"CD3",
			"CHRONO",
			"COLORIZED",
			"COMPLETE",
			"CONVERT",
			"CUSTOM",
			"DC",
			"DDC",
			"DIRFIX",
			"DISC",
			"DISC1",
			"DISC2",
			"DISC3",
			"DIVX",
			"DOLBY",
			"DSR",
			"DTS",
			"DTV",
			"DUAL",
            "DVD",
			"DUBBED",
			"DVBRIP",
			"DVDRIP",
			"DVDSCR",
			"DVDSCREENER",
            "ENGSUB",
			"EXTENDED",
			"FINAL",
			"FS",
			"HARDCODED",
			"HARDSUB",
			"HARDSUBBED",
			"HD",
			"HDDVDRIP",
			"HDRIP",
			"HDTV",
			"HR",
			"INT",
			"INTERNAL",
			"LASERDISC",
			"LIMITED",
			"LINE",
			"LIVE.AUDIO",
			"MP3",
			"MULTI",
			"NATIVE",
			"NFOFIX",
			"NTSC",
			"OAR",
			"P2P",
			"PAL",
			"PDTV",
			"PPV",
			"PREAIR",
			"PROOFFIX",
			"PROPER",
			"PT",
			"R1",
			"R2",
			"R3",
			"R4",
			"R5",
			"R6",
			"RATED",
			"RC",
			"READ.NFO",
			"READNFO",
			"REMASTERED",
			"REPACK",
			"RERIP",
			"RETAIL",
			"SAMPLEFIX",
			"SATRIP",
			"SCR",
			"SCREENER",
			"SE",
			"STV",
			"SUBBED",
			"SUBFORCED",
			"SUBS",
			"SVCD",
			"SYNCFIX",
			"TC",
			"TELECINE",
			"TELESYNC",
			"THEATRICAL",
			"TS",
			"TVRIP",
			"UNCUT",
			"UNRATED",
			"UNSUBBED",
			"VCDRIP",
			"VHSRIP",
			"WATERMARKED",
			"WORKPRINT",
			"WP",
			"WS",
			"X264",
			"XVID"
        ];

        this.searchMoviesByQuery = function (title, year) {
            var match = title.match(/\(([0-9][0-9][0-9][0-9])\)/);
            if (match) {
                year = match[1];
            }
            var t = title.replace(/\[(.*?)\]/g, '').replace(/\(.+?\)/g, "").replace(/:/g, " ");
            /*var end = t.indexOf('(');
            if (end != -1) t = t.slice(0, end);*/

            t = t.toUpperCase();
            for (var i in stopstrings) {
                var index = t.indexOf(stopstrings[i]);
                if (index != -1 &&
                    (index == 0 || (t[index - 1] == '.' || t[index - 1] == ' '))) {
                    t = t.slice(0, index);
                    p(t);
                    p(stopstrings[i]);
                }
            }

            t = t.replace(/[ ]+/g, " ");
            t = t.replace(/^\s+|\s+$/g,'');
            showtime.trace("Search for: " + t);

            try {
                var args = {
                    'api_key': this.key,
                    'query': encodeURIComponent(showtime.entityDecode(t)),
                    'include_adult': 'true'
                };
                if (year != null) {
                    args["year"] = year;
                }
                //var url = URL.appendArgs("https://api.themoviedb.org/3/search/movie", args);
                //var data = showtime.httpGet(url);
                //data = showtime.JSONDecode(data.toString());
                var data = this.getData("search", null, "movie", null, args);

                if (parseInt(data['total_results']) > 0) {
                   showtime.trace('TMDB: Found ' + data['total_results'] + ' movie entries.');
                    return data;
                }
                else {
                    showtime.trace('TMDB: No movie entries found.');
                    return null;
                }
            }
            catch (ex) {
                e(ex);
                if (ex == 'Error: HTTP error: 404') {
                    return "Movie was not found. Possibly it doesn't exist in TMDb.";
                    return null;
                }
            }
            return null;
        }

        this.searchMovie = function (title, year) {
            var match = title.match(/\(([0-9][0-9][0-9][0-9])\)/);
            if (match) {
                year = match[1];
            }
            var t = title.replace(/\[(.*?)\]/g, '').replace(/\(.+?\)/g, "").replace(/:/g, " ");
            /*var end = t.indexOf('(');
            if (end != -1) t = t.slice(0, end);*/

            t = t.toUpperCase();
            for (var i in stopstrings) {
                var index = t.indexOf(stopstrings[i]);
                if (index != -1 &&
                    (index == 0 || (t[index - 1] == '.' || t[index - 1] == ' '))) {
                    t = t.slice(0, index);
                    p(t);
                    p(stopstrings[i]);
                }
            }

            t = t.replace(/[ ]+/g, " ");
            t = t.replace(/^\s+|\s+$/g,'');
            showtime.trace("Search for: " + t);

            try {
                var args = {
                    'api_key': this.key,
                    'query': encodeURIComponent(showtime.entityDecode(t)),
                    'include_adult': 'true'
                };
                if (year != null)
                    args["year"] = year;
                var url = URL.appendArgs("https://api.themoviedb.org/3/search/movie", args);
                var data = showtime.httpGet(url);
                data = showtime.JSONDecode(data.toString());

                if (parseInt(data['total_results']) > 0) {
                   showtime.trace('TMDB: Found ' + data['total_results'] + ' movie entries.');
                    return data.results[0].id;
                }
                else {
                    showtime.trace('TMDB: No movie entries found.');
                    return null;
                }
            }
            catch (ex) {
                e(ex);
                if (ex == 'Error: HTTP error: 404') {
                    return "Movie was not found. Possibly it doesn't exist in TMDb.";
                    return null;
                }
            }
            return null;
        }

        this.searchTvshow = function (title, year) {
            var match = title.match(/\(([0-9][0-9][0-9][0-9])\)/);
            if (match) {
                year = match[1];
            }
            var t = title.replace(/\[(.*?)\]/g, '').replace(/\(.+?\)/g, "").replace(/:/g, " ");
            /*var end = t.indexOf('(');
            if (end != -1) t = t.slice(0, end);*/

            t = t.toUpperCase();
            for (var i in stopstrings) {
                var index = t.indexOf(stopstrings[i]);
                if (index != -1 &&
                    (index == 0 || (t[index - 1] == '.' || t[index - 1] == ' '))) {
                    t = t.slice(0, index);
                    p(t);
                    p(stopstrings[i]);
                }
            }

            t = t.replace(/[ ]+/g, " ");
            t = t.replace(/^\s+|\s+$/g,'');
            showtime.trace("Search for: " + t);

            try {
                var args = {
                    'api_key': this.key,
                    'query': encodeURIComponent(showtime.entityDecode(t)),
                    'include_adult': 'true'
                };
                if (year != null)
                    args["year"] = year;
                //var url = URL.appendArgs("https://api.themoviedb.org/3/search/tv", args);
                var data = this.getData("search", null, "tv", null, args);
                //var data = showtime.httpGet(url);
                //data = showtime.JSONDecode(data.toString());

                if (parseInt(data['total_results']) > 0) {
                   showtime.trace('TMDB: Found ' + data['total_results'] + ' movie entries.');
                    return data.results[0].id;
                }
                else {
                    showtime.trace('TMDB: No TV Show entries found.');
                    return null;
                }
            }
            catch (ex) {
                e(ex);
                if (ex == 'Error: HTTP error: 404') {
                    return "TV Show was not found. Possibly it doesn't exist in TMDb.";
                    return null;
                }
            }
            return null;
        }

        this.getData = function (section, id, subsection, page, extra_args) {
            try {
                var feature = section;
                if (id) feature += "/" + id;
                if (id && subsection) feature += "/";
                if (!id && subsection) feature += "/";
                if (subsection) feature += subsection;
                var args = {
                    'api_key': this.key,
                    'page': (page) ? page : 1
                };
                if (api.session)
                    args["session_id"] = api.session;
                for (var arg in extra_args) {
                    t("Adding arg: " + arg + " - " + extra_args[arg]);
                    args[arg] = extra_args[arg];
                }

                /*var url = "https://api.themoviedb.org/3/" + feature + "?";
                for (var i in args) {
                    url += i + "=" + encodeURIComponent(args[i]) + "&";
                }
                url = url.slice(0, url.length - 1);*/
                var url = URL.appendArgs("https://api.themoviedb.org/3/" + feature, args);
                p("Loading " + url);
                try {
                    var data = showtime.JSONDecode(showtime.httpGet(url, {}, {
                        'Accept': 'application/json'
                    }).toString());
                    /*var data = showtime.JSONDecode(showtime.httpReq(url, {
                        method: "GET",
                        caching: true,
                        compression: true
                    }).toString());*/

                    return data;
                }
                catch (ex) {
                    e(ex);
                    if (ex == "Error: HTTP error: 503")
                        t("There is a big number of simultaneous connections");
                    return null;
                }
            }
            catch (ex) {
                showtime.trace(ex, "TMDB");
                e(ex);
                return null;
            }
        }

        this.createList = function(name) {
            if (!api.authenticated()) {
                return "User must be authenticated";
            }

            var args = {
                'api_key': this.key,
                'session_id': this.session
            };
            var json = {
                "name": name,
                "description": ""
            };
            var url = URL.appendArgs("https://api.themoviedb.org/3/list", args);
            try {
                var data = showtime.JSONDecode(showtime.httpPost(url, showtime.JSONEncode(json), null, {
                    "Content-Type": "application/json"
                }).toString());
                return data;
            }
            catch (ex) {
                e(ex);
                if (ex == "Error: HTTP error: 503")
                    return "Right now it is not possible to process this request. Try later again.";
                return "There was one error while trying to add item to list";
            }
        }

        this.addListItem = function(list_id, media_id) {
            if (!api.authenticated()) {
                return "User must be authenticated";
            }

            var args = {
                'api_key': this.key,
                'session_id': this.session
            };
            var json = {
                "media_id": media_id
            };
            var url = URL.appendArgs("https://api.themoviedb.org/3/list/" + list_id + "/add_item", args);
            try {
                p(url);
                p(showtime.JSONEncode(json));
                var data = showtime.httpReq(url, {
									"postdata": showtime.JSONEncode(json),
									"headers": {
										"Content-Type": "application/json"
									}
								});
                return null;
            }
            catch (ex) {
                e(ex);
                if (ex == "Error: HTTP error: 403")
                    return "Or you can't add items to this list or the list contains already this item";
                else if (ex == "Error: HTTP error: 503")
                    return "Right now it is not possible to process this request. Try later again.";
                return "There was one error while trying to add item to list";
            }
        }
    }

    var URL = {
        "appendArgs": function(url, args) {
            url += "?";
            for (var i in args) {
                url += i + "=" + encodeURIComponent(args[i]) + "&";
            }
            url = url.slice(0, url.length - 1);
            return url;
        }
    };

    function KidsInMind() {
        this.searchMovie = function (name) {
            var data = showtime.httpGet("http://www.kids-in-mind.com/cgi-bin/search/search.pl?q=" + encodeURIComponent(name) + "&stpos=0&s=R&I14.x=0&I14.y=0").toString();
            var init = data.indexOf('<p class="t11normal" align="right">Found: ');
            var end = data.indexOf('<center>', init);
            data = data.slice(init, end);
            var split = data.split("<br>");

            var items = [];
            for (var i in split) {
                var it = split[i];
                var match = it.match('HREF="(.+?)"');
                if (match) {
                    items.push(match[1]);
                }
            }

            if (items.length > 0) {
                return items[0];
            }
            return null;
        }

        this.getMovie = function (url) {
            var data = showtime.httpGet(url).toString();
            var nudity = data.match('src="../images/ratings/s&n(.+?).jpg" alt="Sex &amp; Nudity"')[1];
            var violence = data.match('src="../images/ratings/v&g(.+?).jpg" alt="Violence &amp; Gore"')[1];
            var profanity = data.match('src="../images/ratings/prof(.+?).jpg" alt="Profanity"')[1];
            return {
                nudity: parseInt(nudity),
                violence: parseInt(violence),
                profanity: parseInt(profanity)
            };
        }

        this.getParentsGuide = function (url) {
            var data = showtime.httpGet(url).toString().replace(/\n/g, "");
            data = data.replace(/<!-- start ssi squaretopcenter1 -->.*<!-- end ssi squaretopcenter1 -->/g, "");
            var match = data.match('<span style="border-bottom:1px dotted #3C3C3C; color:#3C3C3C; text-decoration:none; font-weight: bold">SEX/NUDITY .+?</span> - (.+?)<span style="border-bottom:1px dotted #3C3C3C;');
            var guide = {};
            if (match) {
                guide.nudity = match[1];
            }

            var match = data.match('<span style="border-bottom:1px dotted #3C3C3C; color:#3C3C3C; text-decoration:none; font-weight: bold">VIOLENCE/GORE .+?</span> - (.+?)<span style="border-bottom:1px dotted #3C3C3C;');
            if (match) {
                guide.violence = match[1];
            }

            var match = data.match('<span style="border-bottom:1px dotted #3C3C3C; color:#3C3C3C; text-decoration:none; font-weight: bold">PROFANITY .+?</span> - (.+?)<span style="border-bottom:1px dotted #3C3C3C;');
            if (match) {
                guide.profanity = match[1];
            }

            return guide;
        }
    }

    function movieView(page, options) {
        var id = options.id;

        /*var tmdbIds = [
            [id, "Original", true],
            [68724, "Movie 2"]
        ];
        page.options.createMultiOpt("tmdbId" + id, "Movie", tmdbIds, function(tmdbid) {
            page.flush();
            p(tmdbid + " " + id);
            options.id = tmdbid;
            loadMovieView(page, options);
        });*/

        loadMovieView(page, options);
    }

    function loadMovieView(page, options) {
        page.metadata.background = plugin.path + "views/img/background.png";

        var id = options.id;
        var images = api.getData("movie", id, "images");

        page.metadata.logo = plugin.path + "views/img/question.png";
        if (images && images.posters) {
            var posters = [];
            for (var i = 0; i < images.posters.length; i++) {
                var poster = [images.posters[i].file_path, i + 1, (i == 0 ? true : false)];
                posters.push(poster);
            }
            page.options.createMultiOpt("poster" + id, "Poster", posters, function(posterId) {
                t("Using poster: " + posterId);
                page.metadata.logo = "tmdb:image:profile:" + posterId
            });
        }
        if (images && images.backdrops && images.backdrops.length > 0) {
            var backgrounds = [];
            for (var i = 0; i < images.backdrops.length; i++) {
                var back = [images.backdrops[i].file_path, i + 1, (i == 0 ? true : false)];
                backgrounds.push(back);
            }

            page.options.createMultiOpt("background" + id, "Background", backgrounds, function(backId) {
                t("Using background: " + backId);
                page.metadata.backgroundImage = "tmdb:image:backdrop:" + backId
            });
        }

        page.options.createAction("viewImages", "View images", function() {
            page.redirect(PREFIX + ":movie:images:" + id);
        });

        var args = { append_to_response: '' };

        if (api.authenticated()) {
            args.append_to_response += "account_states,";
        }

        if (service.cast || service.crew)
            args.append_to_response += "casts,";
        args.append_to_response += "releases,";
        if (service.trailers)
            args.append_to_response += "trailers,";
        if (service.similar_movies)
            args.append_to_response += "similar_movies,";
        if (service.lists)
            args.append_to_response += "lists,";

        var data = api.getData("movie", id, null, null);

        if (!data) {
            page.error("Movie not found. Possibly it doesn't exist in TMDb's Database");
            return;
        }

        if (data.status_message) {
            page.error(data.status_message);
            return;
        }

        if (api.authenticated()) {
            page.metadata.canFavorite = true;
            page.metadata.canWatchlist = true;
            var state = api.getData("movie", id, "account_states");
            page.metadata.favorite = state.favorite;
            page.metadata.watchlist = state.watchlist;
        }

        //var item = api.getData("movie", id);

        page.metadata.progress = 20;

        var tmdb_id = data.id;

        page.metadata.title = data.title;

        /*page.metadata.logo = "tmdb:image:poster:" + data.poster_path;
        if (data.backdrop_path)
            page.metadata.background = "tmdb:image:backdrop:" + data.backdrop_path;*/

        // General Movie Informations
        var genres = "";
        for (var i in data.genres) {
            var entry = data.genres[i];
            genres += entry.name;
            if (i < data.genres.length - 1)
                genres += ', ';
        }

        var titles = [];
        var title = data.title;

        if (data.original_title != title) {
            page.metadata.original_title = data.original_title;
        }

        var item1 = {};

        if (service.cast || service.crew) {
            // Cast and Crew Informations
            var item1 = api.getData("movie", tmdb_id, "casts");
            if (item1) {
                var cast = [];
                var crew = [];
                var directors = "";
                var writers = "";

                if (service.crew) {
                    for (var i in item1.crew) {
                        var person = item1.crew[i];

                        if (person.department == "Directing" && directors.indexOf(person.name) == -1)
                            directors += person.name + ", ";

                        if (person.department == "Writing" && writers.indexOf(person.name) == -1)
                            writers += person.name + ", ";

                        var image = "tmdb:image:profile:" + person.profile_path;
                        if (!person.profile_path || person.profile_path == "null") image = plugin.path + "views/img/person.png";
                        crew.push({
                            //title: person.name + "\n" + person.job,
                            title: person.name,
                            subtitle: person.job,
                            image: image,
                            url: PREFIX + ":person:" + person.id,
                            parent: "Crew List"
                        });
                    }
                }

                page.metadata.progress = 40;

                if (directors != "")
                    directors = directors.slice(0, directors.length - 2);

                if (writers != "")
                    writers = writers.slice(0, writers.length - 2);

                if (service.cast) {
                    item1.cast = util.insertionSort(item1.cast, "order");
                    for (var i in item1.cast) {
                        var character = item1.cast[i];
                        var image = "tmdb:image:profile:" + character.profile_path;
                        if (!character.profile_path || character.profile_path == "null") image = plugin.path + "views/img/person.png";
                        cast.push({
                            //title: character.name + "\n" + character.character,
                            title: character.name,
                            subtitle: character.character,
                            actor: character.name,
                            character: character.character,
                            image: image,
                            url: PREFIX + ":person:" + character.id,
                            parent: "Cast List"
                        });
                    }

                    if (cast.length > 0)
                        page.appendPassiveItem("list", cast, { title: "Actors" });
                }

                if (service.crew && crew.length > 0)
                    page.appendPassiveItem("list", crew, { title: "Crew" });
            }
        }

        page.metadata.progress = 60;

        page.metadata.description = data.overview;

        if (directors)
            page.appendPassiveItem("label", new showtime.RichText(directors), { title: "Director(s): " });
        if (writers)
            page.appendPassiveItem("label", new showtime.RichText(writers), { title: "Writer(s): " });
        if (genres)
            page.appendPassiveItem("label", new showtime.RichText(genres), { title: "Genres: " });
        if (data.budget)
            page.appendPassiveItem("label", new showtime.RichText("$" + data.budget.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")), { title: "Budget: " });

        if (data.release_date) {
            var year = data.release_date.slice(0, data.release_date.indexOf("-"));
            page.metadata.title += " (" + year + ")";
        }

        var rating = parseFloat(data.vote_average) / 10;
        if (rating) {
            //page.appendPassiveItem("rating", rating, { title: "Rating: " });
		        page.appendPassiveItem("label", new showtime.RichText(Math.round(rating * 100) + "%"), { title: "Rating: " });
				}
        if (data.runtime)
            page.appendPassiveItem("label", new showtime.RichText(data.runtime + " min"), { title: "Runtime: " });

        var item2 = data.releases;
        if (item2) {
            for (var i in item2.countries) {
                var it = item2.countries[i];
                if (it.iso_3166_1 == "US" && it.certification != "") {
                    page.appendPassiveItem("label", new showtime.RichText(it.certification), { title: "US Certification: " });
                }
            }
        }

        if (page.metadata.description)
            page.appendPassiveItem("bodytext", new showtime.RichText(page.metadata.description), { title: "Overview" });

        if (service.trailers) {
            // Trailers
            var item1 = api.getData("movie", id, "trailers");
            var trailers = [];
            if (item1 && item1.total_results) {
                showtime.trace("TMDB: Parsing Trailers");
                for (var i in item1.youtube) {
                    var trailer = item1.youtube[i];
                    var image = "http://i.ytimg.com/vi/" + trailer.source + "/hqdefault.jpg";
                    trailers.push({
                        image: image,
                        title: trailer.name + " (" + trailer.size + ")",
                        url: "youtube:video:simple:" + escape(page.metadata.title + " - " + trailer.name) + ":" + trailer.source
                    });
                }

                page.appendPassiveItem("list", trailers, { title: "Trailers" });
            }
        }

        page.metadata.progress = 70;

        if (service.collection) {
            // Collection
            if (data.belongs_to_collection && data.belongs_to_collection != "null") {
                var item1 = api.getData("collection", data.belongs_to_collection.id);
                var collection = [];
                if (item1) {
                    showtime.trace("TMDB: Parsing Collection");
                    for (var i in item1.parts) {
                        var movie = item1.parts[i];
                        var image = "tmdb:image:profile:" + movie.poster_path;
                        if (!movie.poster_path || movie.poster_path == "null") image = plugin.path + "views/img/question.png";
                        collection.push({
                            image: image,
                            title: movie.title,
                            url: PREFIX + ":movie:" + movie.id + ":1"
                        });
                    }
                }

                page.appendPassiveItem("list", collection, { title: "Collection" });

                page.options.createAction("viewCollectionImages", "View Collection images", function() {
                    page.redirect(PREFIX + ":collection:images:" + data.belongs_to_collection.id);
                });
            }
        }

        page.metadata.progress = 80;

        if (service.similar_movies) {
            // Similar movies
            var item1 = api.getData("movie", id, "similar_movies");
            if (item1 && item1.total_results) {
                var similar_movies = [];
                for (var i in item1.results) {
                    try {
                        var movie = item1.results[i];
                        var image = "tmdb:image:profile:" + movie.poster_path;
                        if (!movie.poster_path || movie.poster_path == "null") image = plugin.path + "views/img/question.png";
                        similar_movies.push({
                            image: image,
                            title: movie.title,
                            url: PREFIX + ":movie:" + movie.id + ":1",
                            mode: "navopen"
                        });
                    }
                    catch (ex) {
                        showtime.trace("Skipped 1 similar movie due to: ");
                        e(ex);
                    }
                }
                page.appendPassiveItem("list", similar_movies, { title: "Similar Movies" });
            }
        }

        if (service.lists) {
            // Lists that contain the movie
            var item1 = api.getData("movie", id, "lists");
            if (item1 && item1.total_results) {
                var lists = [];
                for (var i in item1.results) {
                    try {
                        var list = item1.results[i];
                        var image = "tmdb:image:profile:" + list.poster_path;
                        if (!list.poster_path || list.poster_path == "null") image = plugin.path + "views/img/question.png";
                        lists.push({
                            image: image,
                            title: list.name,
                            url: PREFIX + ":list:" + list.id,
                            mode: "navopen"
                        });
                    }
                    catch (ex) {
                        showtime.trace("Skipped 1 list due to: ");
                        e(ex);
                    }
                }
                page.appendPassiveItem("list", lists, { title: "Lists" });
            }
        }

        if (api.authenticated()) {
            var item = api.getData("account", api.id, "lists");
            if (item && item.total_results) {
                var lists = [];
                for (var i in item.results) {
                    var it = item.results[i];
                    var image = "tmdb:image:profile:" + it.poster_path;
                    if (!it.poster_path || it.poster_path == "null") image = plugin.path + "views/img/question.png";
                    var args = {
                        operation: "add",
                        list_id: it.id,
                        media_id: tmdb_id,
                        referrer: options.url
                    };
                    args = escape(showtime.JSONEncode(args));
                    lists.push({
                        title: it.name,
                        image: image,
                        url: PREFIX + ":user:list:" + args,
                        mode: "pageevent",
                        event: "list" + i
                    });
                }

                page.appendPassiveItem("list", lists, { title: "My Lists" });
            }
        }

        page.metadata.progress = 90;

        if (service.extras) {
            var q = title;
            /*if (item.original_title != title)
                q = item.original_title;*/
            if (year)
                q += " " + year;

            page.metadata.actions_title = "Extras";

            if (api.authenticated()) {
                if (!page.metadata.favorite) {
									console.log("here");
                    page.appendAction("pageevent", "addToFavorites", true, { title: "Add To", subtitle: "Favorites", image: plugin.path + "views/img/add_favorite.png" })
                    page.onEvent("addToFavorites", function (v) {
                        api.addFavorite(tmdb_id);
                    });
                }

                if (!page.metadata.watchlist) {
                    page.appendAction("pageevent", "addToWatchList", true, { title: "Add To", subtitle: "Watch List", image: plugin.path + "views/img/watchlist.png" })
                    page.onEvent("addToWatchList", function (v) {
                        api.addWatchList(tmdb_id);
                    });
                }

                page.appendAction("navopen", PREFIX + ":lists:add:" + tmdb_id, true, { title: "Add To", subtitle: "List", image: plugin.path + "views/img/add_list.png" })
                /*page.onEvent("addToList", function (v) {
                    page.redirect(PREFIX + ":lists:add:" + tmdb_id);
                });*/
            }

            //page.appendAction("navopen", "youtube:feed:" + escape("https://gdata.youtube.com/feeds/api/videos?q=" + q), true, { title: "View more", subtitle: "Youtube", image: plugin.path + "img/youtube.png" });

            // send title to Showtime searcher so we can search in another apps/hdd/share
            page.appendAction("navopen", "search:" + q, true, { title: "Search", subtitle: "In Movian", image: plugin.path + "views/img/search.png" });

            /*if (service.searchSource1 && service.searchSource1 != "")
                page.appendAction("navopen", "navi-x:playlist:playlist:" + escape(service.searchSource1 + encodeURIComponent(q)), true, { title: "Searcher #1", image: plugin.path + "views/img/search.png" });
            if (service.searchSource2 && service.searchSource2 != "")
                page.appendAction("navopen", "navi-x:playlist:playlist:" + escape(service.searchSource2 + encodeURIComponent(q)), true, { title: "Searcher #2", image: plugin.path + "views/img/search.png" });
            if (service.searchSource3 && service.searchSource3 != "")
                page.appendAction("navopen", "navi-x:playlist:playlist:" + escape(service.searchSource3 + encodeURIComponent(q)), true, { title: "Searcher #3", image: plugin.path + "views/img/search.png" });
						*/
            if (data.imdb_id && data.imdb_id != "null")
                page.appendAction("navopen", PREFIX + ":imdb:parentsguide:" + data.imdb_id, true, { title: "IMDB", subtitle: "Parents Guide", image: plugin.path + "views/img/rated-r.png" });

            page.appendAction("navopen", PREFIX + ":kim:parentsguide:" + encodeURIComponent(title), true, { title: "Kids in Mind", subtitle: "Parents Guide", image: plugin.path + "views/img/rated-r.png" })
        }

        page.metadata.progress = 100;
        page.metadata.glwview = plugin.path + "views/tmdb.view";
    }

    plugin.addURI(PREFIX + ":tv:(.*):(.*)", function (page, query, mode) {
        page.type = "directory";
        page.metadata.glwview = plugin.path + "views/loading.view";
        page.metadata.backgroundAlpha = 0.5;
        page.loading = false;
        page.metadata.lists = [];

        page.metadata.progress = 0;

        query = unescape(query);
        var id = null;
        var args = {};
        if (mode == "0") {
            page.error("Unsupported");
            return;

            args.id = api.searchTvshow(query);

            if (!args.id) {
                page.error("No movies found for the title given.");
                return;
            }
        }
        else if (parseInt(mode) < 3) args.id = query;
        else {
            page.error("Unknown mode");
            return;
        }

        args.url = PREFIX + ":tv:" + escape(query) + ":" + mode;
        tvshowView(page, args);

        page.loading = false;
    });

    plugin.addURI(PREFIX + ":tv:play:(.*)", function (page, options) {
        page.type = "directory";
        page.metadata.glwview = plugin.path + "views/loading.view";
        page.metadata.backgroundAlpha = 0.5;
        page.loading = false;
        page.metadata.lists = [];

        page.metadata.progress = 0;

        options = showtime.JSONDecode(unescape(options));

        t("Options:");
				for (var i in options) {
					t("[OPTION] " + i + " = " + options[i]);
				}

        var query = unescape(options.query);
        var id = null;
        var args = {};
        var mode = options.mode;
        var year = options.year;
        args.req = {};
        if (year)
            args.req.year = year;
        if (mode == 0) {
            args.id = api.searchTvshow(query, year);

            if (!args.id) {
                page.error("No movies found for the title given.");
                return;
            }
        }
        else if (mode < 3) args.id = query;
        else {
            page.error("Unknown mode");
            return;
        }

        if (options.sources) {
            var sources = [];
            showtime.trace("TMDB: Parsing Sources");
            for (var i in options.sources) {
                var source = options.sources[i];
                sources.push({
                    image: source.image ? source.image : plugin.path + "views/img/movie.png",
                    title: source.title,
                    url: source.url
                });
            }

            page.appendPassiveItem("list", sources, { title: "Play Now" });
        }

        args.url = PREFIX + ":tv:play:" + showtime.JSONEncode(escape(options));
        tvshowView(page, args);

        page.loading = false;
    });

    function tvshowView(page, options) {
        loadTvshowView(page, options);
    }

    function loadTvshowView(page, options) {
        page.metadata.background = plugin.path + "views/img/background.png";

        var id = options.id;
        var images = api.getData("tv", id, "images");

        page.metadata.logo = plugin.path + "views/img/question.png";
        if (images && images.posters) {
            var posters = [];
            for (var i = 0; i < images.posters.length; i++) {
                var poster = [images.posters[i].file_path, i + 1, (i == 0 ? true : false)];
                posters.push(poster);
            }
            page.options.createMultiOpt("poster" + id, "Poster", posters, function(posterId) {
                t("Using poster: " + posterId);
                page.metadata.logo = "tmdb:image:profile:" + posterId
            });
        }
        if (images && images.backdrops) {
            var backgrounds = [];
            for (var i = 0; i < images.backdrops.length; i++) {
                var back = [images.backdrops[i].file_path, i + 1, (i == 0 ? true : false)];
                backgrounds.push(back);
            }
            page.options.createMultiOpt("background" + id, "Background", backgrounds, function(backId) {
                t("Using background: " + backId);
                page.metadata.background = "tmdb:image:backdrop:" + backId
            });
        }

        page.options.createAction("viewImages", "View images", function() {
            page.redirect(PREFIX + ":tv:images:" + id);
        });

        var args = { append_to_response: '' };

        if (api.authenticated()) {
            args.append_to_response += "account_states,";
        }

        if (service.cast || service.crew)
            args.append_to_response += "casts,";
        args.append_to_response += "releases,";
        if (service.trailers)
            args.append_to_response += "trailers,";
        if (service.similar_movies)
            args.append_to_response += "similar_movies,";
        if (service.lists)
            args.append_to_response += "lists,";

        var data = api.getData("tv", id, null, null);

        if (!data) {
            page.error("TV Show not found. Possibly it doesn't exist in TMDb's Database");
            return;
        }

        if (data.status_message) {
            page.error(data.status_message);
            return;
        }

        page.metadata.glwview = plugin.path + "views/tvshow.view";

        //var item = api.getData("movie", id);

        page.metadata.progress = 20;

        var tmdb_id = data.id;

        page.metadata.title = data.name;

        /*page.metadata.logo = "tmdb:image:poster:" + data.poster_path;
        if (data.backdrop_path)
            page.metadata.background = "tmdb:image:backdrop:" + data.backdrop_path;*/

        // General Movie Informations
        var genres = "";
        for (var i in data.genres) {
            var entry = data.genres[i];
            genres += entry.name;
            if (i < data.genres.length - 1)
                genres += ', ';
        }

        var titles = [];
        var title = data.title;

        if (data.original_title != title) {
            page.metadata.original_title = data.original_title;
        }

        var item1 = {};

        // Cast and Crew Informations
        var item1 = api.getData("tv", tmdb_id, "credits");
        if (item1) {
            var cast = [];
            var crew = [];
            var executive_producers = "";
            var executive_producers_count = 0;

            for (var i in item1.crew) {
                var person = item1.crew[i];

                if (person.job == "Executive Producer" && executive_producers.indexOf(person.name) == -1 &&
                    executive_producers_count < 2) {
                    executive_producers += person.name + "\n";
                    executive_producers_count++;
                }

                var image = "tmdb:image:profile:" + person.profile_path;
                if (!person.profile_path || person.profile_path == "null") image = plugin.path + "views/img/person.png";
                crew.push({
                    //title: person.name + "\n" + person.job,
                    title: person.name,
                    subtitle: person.job,
                    image: image,
                    url: PREFIX + ":person:" + person.id,
                    parent: "Crew List"
                });
            }

            if (executive_producers != "")
                executive_producers = executive_producers.slice(0, executive_producers.length - 1);
        }

        page.metadata.progress = 60;

        page.metadata.description = data.overview;

        if (executive_producers)
            page.appendPassiveItem("label", new showtime.RichText(executive_producers), { title: "Executive Producer(s): " });

        if (genres)
            page.appendPassiveItem("label", new showtime.RichText(genres), { title: "Genres: " });
        if (data.budget)
            page.appendPassiveItem("label", new showtime.RichText("$" + data.budget.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")), { title: "Budget: " });

        if (data.release_date) {
            var year = data.release_date.slice(0, data.release_date.indexOf("-"));
            page.metadata.title += " (" + year + ")";
        }

        var rating = parseFloat(data.vote_average) / 10;
        if (rating) {
          	//page.appendPassiveItem("rating", rating, { title: "Rating: " });
		        page.appendPassiveItem("label", new showtime.RichText(Math.round(rating * 100) + "%"), { title: "Rating: " });
				}

        if (data.episode_run_time)
            page.appendPassiveItem("label", new showtime.RichText(data.episode_run_time[0] + " min"), { title: "Runtime: " });

        if (data.status)
            page.appendPassiveItem("label", new showtime.RichText(data.status), { title: "Status: " });

        if (page.metadata.description)
            page.appendPassiveItem("bodytext", new showtime.RichText(page.metadata.description), { title: "Overview" });

        page.metadata.progress = 80;

        /*if (api.authenticated()) {
            var item = api.getData("account", api.id, "lists");
            if (item && item.total_results) {
                var lists = [];
                for (var i in item.results) {
                    var it = item.results[i];
                    var image = "tmdb:image:profile:" + it.poster_path;
                    if (!it.poster_path || it.poster_path == "null") image = plugin.path + "views/img/question.png";
                    var args = {
                        operation: "add",
                        list_id: it.id,
                        media_id: tmdb_id,
                        referrer: options.url
                    };
                    args = escape(showtime.JSONEncode(args));
                    lists.push({
                        title: it.name,
                        image: image,
                        url: PREFIX + ":user:list:" + args,
                        mode: "pageevent",
                        event: "list" + i
                    });
                }

                page.appendPassiveItem("list", lists, { title: "My Lists" });
            }
        }*/

        page.metadata.progress = 90;

        if (service.extras) {
            var q = title;
            /*if (item.original_title != title)
                q = item.original_title;*/
            if (year)
                q += " " + year;

            page.metadata.actions_title = "Extras";

            /*if (api.authenticated()) {
                if (!page.metadata.favorite) {
                    page.appendAction("pageevent", "addToFavorites", true, { title: "Add To", subtitle: "Favorites", image: plugin.path + "views/img/add_favorite.png" })
                    page.onEvent("addToFavorites", function (v) {
                        api.addFavorite(tmdb_id);
                    });
                }

                if (!page.metadata.watchlist) {
                    page.appendAction("pageevent", "addToWatchList", true, { title: "Add To", subtitle: "Watch List", image: plugin.path + "views/img/watchlist.png" })
                    page.onEvent("addToWatchList", function (v) {
                        api.addWatchList(tmdb_id);
                    });
                }

                //page.appendAction("pageevent", "addToList", true, { title: "Add to List", image: plugin.path + "views/img/add_list.png" })
                //page.onEvent("addToList", function (v) {
                //    page.redirect(PREFIX + ":lists:add:" + tmdb_id);
                //});
            }*/

            /*page.appendAction("navopen", "youtube:feed:" + escape("https://gdata.youtube.com/feeds/api/videos?q=" + q), true, { title: "View more", subtitle: "Youtube", image: plugin.path + "img/youtube.png" });

            // send title to Showtime searcher so we can search in another apps/hdd/share
            page.appendAction("navopen", "search:" + q, true, { title: "Search", subtitle: "In Showtime", image: plugin.path + "views/img/search.png" });

            if (service.searchSource1 && service.searchSource1 != "")
                page.appendAction("navopen", "navi-x:playlist:playlist:" + escape(service.searchSource1 + encodeURIComponent(q)), true, { title: "Searcher #1", image: plugin.path + "views/img/search.png" });
            if (service.searchSource2 && service.searchSource2 != "")
                page.appendAction("navopen", "navi-x:playlist:playlist:" + escape(service.searchSource2 + encodeURIComponent(q)), true, { title: "Searcher #2", image: plugin.path + "views/img/search.png" });
            if (service.searchSource3 && service.searchSource3 != "")
                page.appendAction("navopen", "navi-x:playlist:playlist:" + escape(service.searchSource3 + encodeURIComponent(q)), true, { title: "Searcher #3", image: plugin.path + "views/img/search.png" });

            if (data.imdb_id && data.imdb_id != "null")
                page.appendAction("navopen", PREFIX + ":imdb:parentsguide:" + data.imdb_id, true, { title: "IMDB", subtitle: "Parents Guide", image: plugin.path + "views/img/rated-r.png" });

            page.appendAction("navopen", PREFIX + ":kim:parentsguide:" + encodeURIComponent(title), true, { title: "Kids in Mind", subtitle: "Parents Guide", image: plugin.path + "views/img/rated-r.png" })
        */}

        var seasonsList = [];
        var seasons = data.seasons;
        for (var i in seasons) {
            var season = seasons[i];
            var image = "tmdb:image:profile:" + season.poster_path;
            if (!season.poster_path || season.poster_path == "null") image = plugin.path + "views/img/question.png";

            var item = {
                title: "Season #" + season.season_number,
                image: image,
                url: PREFIX + ":tv:" + data.id + ":season:" + season.season_number
            };
            seasonsList.push(item);
        }

        page.appendPassiveItem("seasons_list", seasonsList, {
            title: "Seasons (" + data.seasons.length + ")"
        });

        page.metadata.progress = 100;
    }

    plugin.addURI(PREFIX + ":movie:(.*):(.*)", function (page, query, mode) {
        page.type = "raw";
        page.metadata.glwview = plugin.path + "views/loading.view";
        page.metadata.backgroundAlpha = 0.4;
        page.loading = false;
        page.metadata.lists = [];

        page.metadata.progress = 0;

        query = unescape(query);
        var id = null;
        var args = {};
        if (mode == "0") {
            args.id = api.searchMovie(query);

            if (!args.id) {
                page.error("No movies found for the title given.");
                return;
            }
        }
        else if (parseInt(mode) < 3) args.id = query;
        else {
            page.error("Unknown mode");
            return;
        }

        args.url = PREFIX + ":movie:" + escape(query) + ":" + mode;
        movieView(page, args);

        page.loading = false;
    });

    function showImages(page, images) {
        var configuration = api.getData("configuration");
        var base_url = configuration.images.secure_base_url;
        var size = "original";

        if (images && images.backdrops) {
            var backgrounds = [];
            for (var i = 0; i < images.backdrops.length; i++) {
                //var url = "tmdb:image:backdrop:" + images.backdrops[i].file_path;
                var url = base_url + size + images.backdrops[i].file_path;
                page.appendItem(url, "image", {
                    title: "Background #" + (i + 1),
                    icon: url
                });
            }
        }

        if (images && images.posters) {
            var posters = [];
            for (var i = 0; i < images.posters.length; i++) {
                //var url = "tmdb:image:backdrop:" + images.posters[i].file_path;
                var url = base_url + size + images.posters[i].file_path;
                page.appendItem(url, "image", {
                    title: "Poster #" + (i + 1),
                    icon: url
                });
            }
        }
    }

    plugin.addURI(PREFIX + ":movie:images:(.*)", function (page, tmdbid) {
        page.type = "directory";
        page.contents = "items";
        page.loading = false;

        var images = api.getData("movie", tmdbid, "images");

        showImages(page, images);

        page.loading = false;
    });

    plugin.addURI(PREFIX + ":collection:images:(.*)", function (page, collectionId) {
        page.type = "directory";
        page.contents = "items";
        page.loading = false;

        var images = api.getData("collection", collectionId, "images");

        showImages(page, images);

        page.loading = false;
    });

    plugin.addURI(PREFIX + ":movie:play:(.*)", function (page, options) {
        page.type = "raw";
        page.metadata.glwview = plugin.path + "views/loading.view";
        page.metadata.backgroundAlpha = 0.5;
        page.loading = false;
        page.metadata.lists = [];

        page.metadata.progress = 0;

        options = showtime.JSONDecode(unescape(options));

        t("Options:");
				for (var i in options) {
					t("[OPTION] " + i + " = " + options[i]);
				}

        var query = unescape(options.query);
        var id = null;
        var args = {};
        var mode = options.mode;
        var year = options.year;
        args.req = {};
        if (year)
            args.req.year = year;
        if (mode == 0) {
            args.id = api.searchMovie(query, year);

            if (!args.id) {
                page.error("No movies found for the title given.");
                return;
            }
        }
        else if (mode < 3) args.id = query;
        else {
            page.error("Unknown mode");
            return;
        }

        if (options.sources) {
            var sources = [];
            showtime.trace("TMDB: Parsing Sources");
            for (var i in options.sources) {
                var source = options.sources[i];
                sources.push({
                    image: source.image ? source.image : plugin.path + "views/img/movie.png",
                    title: source.title,
                    url: source.url
                });
            }

            page.appendPassiveItem("list", sources, { title: "Play Now" });
        }

        args.url = PREFIX + ":movie:play:" + showtime.JSONEncode(escape(options));
        movieView(page, args);

        page.loading = false;
    });

    plugin.addURI(PREFIX + ":list:(.*)", function (page, id) {
        page.type = "grid";

        page.loading = true;
        //page.metadata.glwview = plugin.path + "views/loading.view";

        var data = api.getData("list", id, null, null);
        if (!data) {
            page.loading = false;
            page.error("There was an error while loading the information.");
            return;
        }
        listPageController(page, function(offset) {
            return data;
        });

        page.metadata.title = data.name;
        //page.metadata.glwview = plugin.path + "views/posters.view";

        page.loading = false;
    });

    plugin.addURI(PREFIX + ":list:(.*):add:(.*)", function (page, list_id, media_id) {
        page.type = "directory";

        page.loading = false;
        var res = api.addListItem(list_id, media_id);
        if (res != null) {
            showtime.notify(res, 3);
        }
        else {
            showtime.notify("Movie added successfully to list", 3);
        }
        page.redirect(PREFIX + ":movie:" + media_id + ":1");

        page.loading = false;
    });

    function listPageController(page, loader) {
        var offset = 1;

        function paginator() {
            //while(true) {
                var data = loader(offset);

                var items = data.items;
                page.entries = items.length;
                for (var k = 0; k < items.length; k++) {
                    var it = items[k];
                    var metadata = {
                        title: it.original_title,
                        icon: "tmdb:image:poster:" + it.poster_path
                    }
                    if (it.backdrop_path)
                        metadata.background = "tmdb:image:backdrop:" + it.backdrop_path;
                    page.appendItem(PREFIX + ":movie:" + it.id + ":2", "directory", metadata);
                }

                page.loading = false;
                offset++;
                page.contents = "movies";
                page.metadata.glwview = plugin.path + "views/loading.view";

                /*break;
            }

            return false;*/
            //return offset < page.entries;
        }

        paginator();
        //page.paginator = paginator;
    }

    plugin.addURI(PREFIX + ":genre:list", function (page) {
        page.type = "directory";
        page.metadata.backgroundAlpha = 0.5;
        page.metadata.glwview = plugin.path + "views/genres.view";
        page.metadata.actions_title = "Genres";

        page.metadata.curPage = PREFIX + ":genre:list";

        pageMenu(page);

        var data = api.getData("genre", null, "list");

        var genres = [];
        var image = plugin.path + "views/img/question.png";
        for (var i in data.genres) {
            var item = data.genres[i];

            genres.push({
                title: item.name,
                image: image,
                url: PREFIX + ":genre:" + item.id
            });

            page.appendAction("pageevent", "getGenre" + item.id + "_" + escape(item.name), true, { title: item.name, image: image })
            page.onEvent("getGenre" + item.id + "_" + escape(item.name), function (v) {
                var match = v.match("getGenre(.+?)_(.*)");
                var j = match[1];
                page.metadata.genre = unescape(match[2]);
                var data = api.getData("genre", j, "movies");
                var movies = [];
                for (var k in data.results) {
                    movies.push({
                        title: data.results[k].title,
                        image: "tmdb:image:poster:" + data.results[k].poster_path,
                        url: PREFIX + ":movie:" + data.results[k].id + ":1"
                    });
                }
                page.metadata.movies = movies;
            });
        }

        page.loading = false;
    });


    plugin.addURI(PREFIX + ":person:(.*)", function (page, id) {
        page.type = "raw";
        page.metadata.glwview = plugin.path + "views/loading.view";
        page.loading = false;
        page.metadata.backgroundAlpha = 0.5;

        var item = api.getData("person", id);

        page.metadata.title = item.name;

        page.metadata.logo = "tmdb:image:poster:" + item.profile_path;
        if (!item.profile_path || item.profile_path == "null") page.metadata.logo = plugin.path + "views/img/person.png";

        if (item.birthday)
            page.appendPassiveItem("label", item.birthday + "\n" + item.place_of_birth, { title: "Birthday: " });
        if (item.deathday)
            page.appendPassiveItem("label", item.deathday, { title: "Day of death: " });
        if (item.homepage)
            page.appendPassiveItem("label", item.homepage, { title: "Website: " });
        if (item.biography)
            page.appendPassiveItem("bodytext", item.biography, { title: "Biography" });

        var credits = api.getData("person", id, "credits");

        if (service.cast) {
            var cast = [];
            for (var i in credits.cast) {
                var character = credits.cast[i];
                var image = "tmdb:image:profile:" + character.poster_path;
                if (!character.poster_path || character.poster_path == "null") image = plugin.path + "views/img/person.png";
                cast.push({
                   title: character.title + "\n" + character.character,
                    character: character.character,
                    image: image,
                    url: PREFIX + ":movie:" + character.id + ":1",
                    parent: "Cast List"
                });
            }

            if (cast.length > 0)
                page.appendPassiveItem("list", cast, { title: "As Actor/Actress" });
        }

        if (service.crew) {
            var crew = [];
            for (var i in credits.crew) {
                var person = credits.crew[i];

                var image = "tmdb:image:profile:" + person.poster_path;
                if (!person.poster_path || person.poster_path == "null") image = plugin.path + "views/img/person.png";
                crew.push({
                    title: person.title + "\n" + person.job,
                    image: image,
                    url: PREFIX + ":movie:" + person.id + ":1",
                    parent: "Crew List"
                });
            }

            if (crew.length > 0)
                page.appendPassiveItem("list", crew, { title: "As Crew" });
        }

        page.loading = false;
        page.metadata.glwview = plugin.path + "views/tmdb.view";
    });

    plugin.addURI(PREFIX + ":company:(.*)", function (page, id) {
        page.type = "directory";
        page.metadata.glwview = plugin.path + "views/tmdb.view";
        page.metadata.backgroundAlpha = 0.5;

        var item = api.getData("company", id);
        page.metadata.title = item.name;
        var image = "tmdb:image:poster:" + item.logo_path;
        if (!item.poster_path || item.poster_path == "null") image = plugin.path + "views/img/question.png";
        page.metadata.logo = image;

        var item = api.getData("company", id, "movies");
        var movies = [];
        for (var i in item.results) {
            var movie = item.results[i];
            var image = "tmdb:image:poster:" + movie.poster_path;
            if (!movie.poster_path || movie.poster_path == "null") image = plugin.path + "views/img/question.png";
            movies.push({
                title: movie.title,
                image: image,
                url: PREFIX + ":movie:" + movie.id + ":1"
            });
        }

        page.appendPassiveItem("list", movies, { title: "Movies" });


        page.loading = false;
    });

		plugin.addURI(PREFIX + ":user:confirm", function (page) {
			page.type = "list";
			var session = api.session_id();
			if (api.session) {
				showtime.notify("Authentication succeeded.", 2);
				page.redirect(PREFIX + ":start");
			}
			else {
				showtime.notify("Authentication failed. Try again.", 2);
				page.appendItem(PREFIX + ":user:confirm", "directory", {
						"title": "Authentication failed. Click to try again. (You may return to home page and retry if you lost the URL)",
						"icon": ""
				});
			}
		});

    plugin.addURI(PREFIX + ":user", function (page) {
        if (!api.authenticated()) {
            page.type = "list";
            //page.metadata.glwview = plugin.path + "views/auth_1.view";

            page.loading = false;

            api = new TMDB();
            var request = api.request_token();
            if (request) {
                showtime.trace("Go to: " + request.url);
                var url = shortener.shorten_link(request.url);
                page.metadata.url = url;
            }
            else return;

						page.appendPassiveItem("default", "1", {
						    "title": "1. Go to " + page.metadata.url,
								"icon": ""
						});

						page.appendPassiveItem("default", null, {
						    "title": "2. If you're not authenticated, please enter your credentials to log in",
								"icon": ""
						});

						page.appendPassiveItem("default", null, {
						    "title": "3. When the website asks if you Deny or Allow, click Allow if you authorize",
								"icon": ""
						});

						page.appendPassiveItem("default", null, {
						    "title": "4. If everything goes well, you should achieve a page telling you to return to application",
								"icon": ""
						});

						page.appendItem(PREFIX + ":user:confirm", "directory", {
						    "title": "5. Once you completed the steps above, click here",
								"icon": ""
						});

            var screens = [
                {
                    image: plugin.path + "views/img/auth/login.png",
                    caption: "If you're not authenticated, please enter your credentials to log in."
                },
                {
                    image: plugin.path + "views/img/auth/auth_request.png",
                    caption: "When the website asks if you Deny or Allow, click Allow if you authorize."
                },
                {
                    image: plugin.path + "views/img/auth/auth_confirmation.png",
                    caption: "If everything goes well, you should achieve a page telling you to return to application.",
                    event: "auth_confirm"
                }
            ];

            var screens2 = [
                /*{
                    image: plugin.path + "views/img/auth/movie.png",
                    caption: "In the Movie View you get all information about a movie you want and much more."
                },*/
                {
                    image: plugin.path + "views/img/auth/person.png",
                    caption: "Don't remember the name of a movie but you know one actor of it? Simple, access that actor page."
                }
            ];

            page.onEvent('auth_confirm', function () {
                var session = api.session_id();
                if (api.session) {
                    page.metadata.glwview = plugin.path + "views/auth_2.view";
                }
                else showtime.notify("Authentication failed. Try again.", 2);
            });

            page.metadata.screens = screens;
            page.metadata.screens2 = screens2;
        }
        else {
            page.type = "grid";
            //page.metadata.glwview = plugin.path + "views/user.view";
            page.metadata.backgroundAlpha = 0.5;

            page.metadata.curPage = PREFIX + ":user";

            pageMenu(page);

            page.metadata.title = api.username;

            var item = api.getData("account", api.id, "lists");
            if (item && item.total_results) {
								page.appendPassiveItem("separator", null, {
									"title": "Lists"
								});

                var lists = [];
                for (var i in item.results) {
                    var it = item.results[i];
                    var image = "tmdb:image:profile:" + it.poster_path;
                    if (!it.poster_path || it.poster_path == "null") image = plugin.path + "views/img/question.png";
                    lists.push({
                        title: it.name,
                        image: image,
                        url: PREFIX + ":list:" + it.id
                    });

										page.appendItem(PREFIX + ":list:" + it.id, "video", {
											title: it.name,
											icon: image
										});
                }

                //page.appendPassiveItem("list", lists, { title: "Lists" });
            }


            item = api.getData("account", api.id, "favorite_movies");
            if (item && item.total_results) {
								page.appendPassiveItem("separator", null, {
									"title": "Favorite movies"
								});

                var favorites = [];
                for (var i in item.results) {
                    var it = item.results[i];
                    var image = "tmdb:image:profile:" + it.poster_path;
                    if (!it.poster_path || it.poster_path == "null") image = plugin.path + "views/img/question.png";
                    favorites.push({
                        title: it.title,
                        image: image,
                        url: PREFIX + ":movie:" + it.id + ":1"
                    });

										page.appendItem(PREFIX + ":movie:" + it.id + ":1", "video", {
											title: it.title,
											icon: image
										});
                }

                //page.appendPassiveItem("list", favorites, { title: "Favorites" });
            }


            item = api.getData("account", api.id, "movie_watchlist");
            if (item && item.total_results) {
							page.appendPassiveItem("separator", null, {
								"title": "Watch List"
							});

                var watchList = [];
                for (var i in item.results) {
                    var it = item.results[i];
                    var image = "tmdb:image:profile:" + it.poster_path;
                    if (!it.poster_path || it.poster_path == "null") image = plugin.path + "views/img/question.png";
                    watchList.push({
                        title: it.title,
                        image: image,
                        url: PREFIX + ":movie:" + it.id + ":1"
                    });
                }

								page.appendItem(PREFIX + ":movie:" + it.id + ":1", "video", {
									title: it.title,
									icon: image
								});

                //page.appendPassiveItem("list", watchList, { title: "Watch List" });
            }


            item = api.getData("account", api.id, "rated_movies");
            if (item && item.total_results) {
							page.appendPassiveItem("separator", null, {
								"title": "Rated Movies"
							});

                var ratedMovies = [];
                for (var i in item.results) {
                    var it = item.results[i];
                    var image = "tmdb:image:profile:" + it.poster_path;
                    if (!it.poster_path || it.poster_path == "null") image = plugin.path + "views/img/question.png";
                    ratedMovies.push({
                        title: it.title,
                        image: image,
                        url: PREFIX + ":movie:" + it.id + ":1"
                    });

										page.appendItem(PREFIX + ":movie:" + it.id + ":1", "video", {
											title: it.title,
											icon: image
										});
                }

                //page.appendPassiveItem("list", ratedMovies, { title: "Rated Movies" });
            }

            page.loading = false;
        }
    });

    plugin.addURI(PREFIX + ":user:list:(.*)", function (page, options) {
        options = showtime.JSONDecode(unescape(options));
        if (options.operation == "add") {
            var res = api.addListItem(options.list_id, options.media_id);
            if (res != null) {
                showtime.notify(res, 3);
            }
            else {
                showtime.notify("Movie added successfully to list", 3);
            }
            page.redirect(options.referrer);
        }

        page.error("Invalid operation");
    });

    function e(ex) {
        t(ex);
        t("Line #" + ex.lineNumber);
    }

    function t(message) {
        showtime.trace(message, plugin.getDescriptor().id);
    }

    function p(message) {
        showtime.print(message);
    }

    plugin.addURI(PREFIX + ":start", startPage);
    plugin.addURI(PREFIX + ":standard:lists", startPage);
})(this);
