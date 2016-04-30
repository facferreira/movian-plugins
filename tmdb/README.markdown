This is a plugin supporting TMDb for Showtime. The idea of the plugin is to allow users to browse and view movie information without exiting Showtime.

## TODO:
- Add: History of seen movie views
- Add: I'm feeling lucky that opens a random watch later movie view
- Add: Allow user rate movies
- Add: Create a new list
- Add: Remove movies from a list
- Add: Delete a list
- Add: Search for keywords
- Add: Browse movies of a keyword
- Add: Browse movies of similar keyword

## Changelog:
#1.3:
- Add: Setting to allow show all movies found in a search from item menu
- Add: Search for movie by custom title in item menu
- Add: Add movies to a list

Note: For now you have to create manually a list in themoviedb.org website.

#1.2.5:
- Add: View Collection images option in movie view
- Add: "Search in Showtime" option in movie view (thanks Buksa)
- Enhancement: Improve some design aspects
- Enhancement: In "Director" field in movie view show all directors instead of just one

#1.2.1:
- Add: TMDb item menu option
- Add: View images option in movie view

#1.1:
- Add: Support for specifying 3 search sources (in Movie View, only suppots PLX playlists at the moment)
- Add: Browse movie in Youtube (in Movie View, requires Youtube plugin to be installed)
- Add: Play Now button (in Movie View, if clicked it will play the video specified in the URI)
- Add: Show all lists that contain a movie (in Movie View)
- Add: Make plugin design independent of Oceanus plugin (user without Oceanus plugin couldn't load See more lists)
- Add: Search for a list
- Add: Show if a movie was marked as favorite (in Movie View)
- Add: Show if a movie was marked as watchlist (in Movie View)
- Add: Choose background for current movie (in Movie View)
- Add: Choose poster for current movie (in Movie View)
- Add: Browse most popular people
- Add: Allow user add movie to watchlist
- Add: Browse a list by id
- Add: Hide Favorite/Watchlist button if movie was already marked
- Add: Kids In Mind's Parents Guide (in Movie View)
- Fix: Search would not work if user specified 2 or more words separated by spaces
- Fix: User would not be logged in after some uses
- Fix: If a movie/person had no poster the screen would be somewhat corrupted
- Fix: In Genres page, movie titles would not show
- Fix: In some cases, when a subrequest (i.e. favorites in user view) failed, the page would not show up
- Enhancement: Better Search movie by title algorithm (only observable externally, i.e.: TMDb View in Navi-X) (See Note 1)
- Enhancement: Improve slightly Genres page design
- Enhancement: Improve Movie View loading time

## Notes:
### Note 1:
The search movie algorithm will now find the first occurence of the substring "(XYZK)" in the title, X, Y, Z and K are numbers 0-9 and represent the year of the movie. If found, the plugin will use it to search for the movie.