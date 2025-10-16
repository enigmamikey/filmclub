// raw code links for easy copying

// https://raw.githubusercontent.com/enigmamikey/filmclub/refs/heads/main/style.css
// https://raw.githubusercontent.com/enigmamikey/filmclub/refs/heads/main/main.js
// https://raw.githubusercontent.com/enigmamikey/filmclub/refs/heads/main/index.html
// https://raw.githubusercontent.com/enigmamikey/filmclub/refs/heads/main/auth.js

// Type live-server --port=3000 into gitBash to test all this on a local server

document.querySelector('h1').textContent = 'Film Club'

window.displayFilmClubData = (data) => {
  console.log("Displaying film club data:", data);
  // Example: show number of movies in the console
  alert(`Loaded ${data.movies.length} movies!`);
};
