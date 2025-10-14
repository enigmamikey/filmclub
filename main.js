// Type live-server --port=3000 into gitBash to test all this on a local server

document.querySelector('h1').textContent = 'Film Club'

window.displayFilmClubData = (data) => {
  console.log("Displaying film club data:", data);
  // Example: show number of movies in the console
  alert(`Loaded ${data.movies.length} movies!`);
};
