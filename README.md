# Film Club

Film Club is a private group that commisioned a paid project for a web application with real users designed to manage a small, invitation-only movie club. Members participate in themed “rounds,” nominate films and rate each other’s selections, with all data persisted and managed through a backend database.

This project was built as a real internal tool for an active group and is currently under continued development.

---

## What the App Does

- Manages authenticated members via email-based signup
- Organizes the club into **versions** and **rounds**
- Allows each member to:
  - Nominate a movie per round
  - View all nominated movies
  - Enter and update ratings for each movie
- Displays ratings in a dynamic grid (members × movies)
- Persists all data using a relational backend

The interface supports both browsing historical rounds and actively entering new ratings.

---

## How It Works (High Level)

Authentication and database operations are handled via **Supabase**, while the frontend dynamically renders available rounds, movie lists, and rating grids with interactive inputs.

The application explicitly models core domain entities including members, rounds, movies and ratings so that the structure of the code closely mirrors the structure of the club itself. Each rating is associated with a specific member, movie and round, which simplifies data integrity, UI rendering and future feature expansion (such as aggregate statistics and historical comparisons).

Most core CRUD functionality is implemented, including creating and reading rounds and movies, updating ratings, and removing entries as needed. Some administrative actions (e.g., adding or removing members) are currently handled manually and are planned for future UI support.

---

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend / Database:** Supabase
- **Hosting:** Netlify

---

## Screenshots / Demo

> ⚠️ Note: This application is designed for a private group and requires authentication.
>
> Public visitors to the live site will see a login screen only. Screenshots below demonstrate authenticated functionality, including round navigation and rating entry.

<!-- Screenshots or GIFs go here -->

---

## Live Site

The application is deployed and live at:

[thefilmclub.netlify.app](https://thefilmclub.netlify.app/)

Access is restricted to invited members of the Film Club. Public visitors will be presented with a login screen only.


---

## Security Note

API keys and credentials are managed using environment variables and are excluded from version control via `.gitignore`.

Earlier commits reflect an iterative learning process as the project evolved. The current structure follows standard practices for handling secrets in client-facing applications.

---

## Current Status & Next Steps

The application is functional and in active use. Planned improvements include:

- Completing remaining CRUD operations (e.g., updating movie metadata)
- Adding admin tools for managing members and rounds
- Automatically calculating aggregate statistics (e.g., highest-rated films)
- Automating email summaries when new rounds begin
- Integrating third-party APIs to enrich the UI (e.g., displaying poster artwork and metadata for highlighted films)

