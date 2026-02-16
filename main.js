document.querySelector('h1').textContent = 'Film Club'

let sortedRounds

function onDataLoaded() {
  renderRoundButtons();
  displayRoundData(sortedRounds[sortedRounds.length - 1]);
}

window.addEventListener('dataLoaded', () => {
  window.rounds && (rounds = window.rounds);
  window.movies && (movies = window.movies);
  window.members && (members = window.members);
  window.ratings && (ratings = window.ratings);

  onDataLoaded()
});


if (window.rounds && window.members && window.movies && window.ratings) {
  onDataLoaded();
}

function displayRoundData(round) {
  const container = document.querySelector('#round-data-container')
  container.innerHTML = ''

  const title = document.querySelector('#round-title')
  title.textContent = `Round ${round.version_number}.${round.round_number}`

  const roundMovies = movies
    .filter(m => m.round_id == round.round_id)
    .sort((a,b) => a.position - b.position)
  const roundMembers = members
    .filter(m => m.version_number == round.version_number)
    .sort((a,b) => a.membership_id.localeCompare(b.membership_id))

  const table = document.createElement('table')
  table.classList.add('ratings-table')

  const pickerRow = document.createElement('tr')
  pickerRow.appendChild(document.createElement('th'))
  pickerRow.id = 'pickerRow'
  roundMovies.forEach((movie, i) => {
    const th = document.createElement('th')
    const picker = roundMembers.find((m, i, a) => m.membership_id == movie.membership_id)
    th.textContent = `Week ${i+1} - ${picker.first_name}`
    pickerRow.appendChild(th)
  })
  table.appendChild(pickerRow)

  const movieRow = document.createElement('tr')
  movieRow.appendChild(document.createElement('th'))
  movieRow.id = 'movieRow'
  roundMovies.forEach(movie => {
    const th = document.createElement('th')
    th.textContent = movie.title || ''
    movieRow.appendChild(th)
  })
  table.appendChild(movieRow)
  const currentMember = roundMembers.find(m => m.email === window.currentUser?.email)
  roundMembers.forEach(member => {
    const tr = document.createElement('tr')
    const nameCell = document.createElement('th')
    nameCell.textContent = member.first_name
    tr.appendChild(nameCell)
    roundMovies.forEach(movie => {
      const td = document.createElement('td')
      const rating = ratings.find(r => 
        r.membership_id === member.membership_id && 
        r.movie_id === movie.movie_id
      )
      td.textContent = rating ? rating.score : '-'
      td.dataset.movieID = movie.movie_id
      td.dataset.memberID = member.membership_id
      tr.appendChild(td)
    })
    table.appendChild(tr)
  })
  container.appendChild(table)

  if (currentMember) {
    const rateBtn = document.createElement('button')
    const addMovieBtn = document.createElement('button')
    rateBtn.textContent = 'Rate My Movies'
    addMovieBtn.textContent = 'Add My Movie'
    rateBtn.id = 'rate-btn'
    addMovieBtn.id = 'addMovie-btn'
    container.appendChild(rateBtn)
    container.appendChild(addMovieBtn)

    rateBtn.addEventListener('click', () => {
      enterEditMode(currentMember,round,roundMovies)
    })

    addMovieBtn.addEventListener('click', () => {
      enterEditMovieMode(currentMember,round,roundMovies)
    })
  }
}

  function enterEditMovieMode(member, round, roundMovies) {
    console.log(`Entering edit movie mode for ${member.first_name}`);

    const container = document.querySelector('#round-data-container');

    const rateBtn = document.querySelector('#rate-btn');
    const addMovieBtn = document.querySelector('#addMovie-btn');
    const roundBtns = document.querySelector('#round-buttons-container');
    const logoutBtn = document.querySelector('#logout-btn');

    // Hide other controls (your intended behavior)
    if (rateBtn) rateBtn.classList.add('hidden');
    if (addMovieBtn) addMovieBtn.classList.add('hidden');
    if (roundBtns) roundBtns.classList.add('hidden');
    if (logoutBtn) logoutBtn.classList.add('hidden'); // keep hidden

    // Identify the movie "owned" by this member (their nomination)
    const ownedMovieIndex = roundMovies.findIndex(m => m.membership_id === member.membership_id);
    if (ownedMovieIndex === -1) {
      console.warn("No owned movie found for this member in this round.");
      container.innerHTML = '';
      displayRoundData(round);
      if (roundBtns) roundBtns.classList.remove('hidden');
      return;
    }

    const ownedMovie = roundMovies[ownedMovieIndex];

    // Find the movie title header cell for that movie
    const movieRow = document.querySelector('#movieRow');
    if (!movieRow) {
      console.error("movieRow not found.");
      container.innerHTML = '';
      displayRoundData(round);
      if (roundBtns) roundBtns.classList.remove('hidden');
      return;
    }

    // movieRow has leading blank <th>, then one <th> per movie
    const movieHeaderCells = [...movieRow.querySelectorAll('th')];
    const targetCell = movieHeaderCells[ownedMovieIndex + 1];

    if (!targetCell) {
      console.error("Target movie title cell not found.");
      container.innerHTML = '';
      displayRoundData(round);
      if (roundBtns) roundBtns.classList.remove('hidden');
      return;
    }

    // Create input pre-filled with existing title
    const previousTitle = (ownedMovie.title || '').toString();
    const input = document.createElement('input');
    input.type = 'text';
    input.value = previousTitle;
    input.classList.add('movie-title-input');
    input.placeholder = 'Enter movie title';
    input.autocomplete = 'off';

    targetCell.textContent = '';
    targetCell.appendChild(input);

    // Create Submit / Cancel buttons for this mode
    const submitBtn = document.createElement('button');
    submitBtn.textContent = 'Submit Movie';
    submitBtn.classList.add('action-btn', 'submit-btn');

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.classList.add('action-btn', 'cancel-btn');

    container.appendChild(submitBtn);
    container.appendChild(cancelBtn);

    // Exit helper: re-render round view, restore buttons
    function exitEditMovieMode() {
      container.innerHTML = '';
      displayRoundData(round);
      if (roundBtns) roundBtns.classList.remove('hidden');
      // logout stays hidden
    }

    // Cancel: no DB update, just revert
    cancelBtn.addEventListener('click', () => {
      exitEditMovieMode();
    });

    // Submit: update DB + local cache, then revert UI
    submitBtn.addEventListener('click', async () => {
      const newTitle = (input.value || '').trim();

      submitBtn.disabled = true;
      cancelBtn.disabled = true;

      try {
        const sb = window.supabase;
        if (!sb) throw new Error("Supabase client not found on window.supabase");

        const { data, error } = await sb
          .from('movies')
          .update({ title: newTitle })
          .eq('movie_id', ownedMovie.movie_id)
          .select('movie_id,title');

        if (error) throw error;
        if (!data || data.length === 0) throw new Error("0 rows updated (blocked or mismatch).");

        const updated = data[0];

        const localMovie = movies.find(m => m.movie_id === updated.movie_id);
        if (localMovie) localMovie.title = updated.title;

        exitEditMovieMode();
      } catch (err) {
        console.error("Error updating movie title:", err);
        alert(String(err?.message || "Failed to save movie title."));
        submitBtn.disabled = false;
        cancelBtn.disabled = false;
      }
    });

    // UX
    input.focus();
    input.select();
  }

function enterEditMode(member, round, roundMovies) {
  console.log(`Entering edit mode for ${member.first_name}`);

  const table = document.querySelector('.ratings-table');
  const rateBtn = document.querySelector('#rate-btn');
  const addMovieBtn = document.querySelector('#addMovie-btn');
  const roundBtns = document.querySelector('#round-buttons-container');
  const logoutBtn = document.querySelector('#logout-btn');

  if (rateBtn) rateBtn.classList.add('hidden');
  if (addMovieBtn) addMovieBtn.classList.add('hidden');
  if (roundBtns) roundBtns.classList.add('hidden');
  if (logoutBtn) logoutBtn.classList.add('hidden'); // keep hidden per your preference

  const row = [...table.querySelectorAll('tr')]
    .find(tr => tr.querySelector('th')?.textContent === member.first_name);

  if (!row) {
    console.error("Could not find rating row for current member.");
    displayRoundData(round);
    if (roundBtns) roundBtns.classList.remove('hidden');
    return;
  }

  // Only allow rating movies that actually have titles
  const editableCells = [...row.querySelectorAll('td')].filter(td => {
    const movieID = td.dataset.movieID;
    const movie = roundMovies.find(m => m.movie_id === movieID);
    return movie && movie.title && movie.title.trim() !== '';
  });

  editableCells.forEach(td => {
    const currentValue = td.textContent === '-' ? '' : td.textContent;
    const input = document.createElement('input');
    input.type = 'number';
    input.min = 1;
    input.max = 10;
    input.step = 0.5; // optional: makes UI nicer
    input.value = currentValue;
    input.classList.add('rating-input');
    td.textContent = '';
    td.appendChild(input);
  });

  const submitBtn = document.createElement('button');
  submitBtn.textContent = 'Submit Ratings';
  submitBtn.classList.add('action-btn', 'submit-btn');

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.classList.add('action-btn', 'cancel-btn');

  const container = document.querySelector('#round-data-container');
  container.appendChild(submitBtn);
  container.appendChild(cancelBtn);

  function exitEditMode() {
    container.innerHTML = '';
    displayRoundData(round);
    if (roundBtns) roundBtns.classList.remove('hidden');
    // logout stays hidden
  }

  cancelBtn.addEventListener('click', exitEditMode);

  submitBtn.addEventListener('click', async () => {
    submitBtn.disabled = true;
    cancelBtn.disabled = true;

    try {
      const sb = window.supabase;
      if (!sb) throw new Error("Supabase client not found on window.supabase");

      const updates = editableCells.map(td => {
        const input = td.querySelector('input');
        let score = parseFloat(input.value);

        if (isNaN(score)) return null;

        score = Math.min(Math.max(score, 1), 10);
        score = Math.floor(score * 10) / 10;

        // store as string for display consistency (your existing code does this)
        const scoreOut = (score % 1 === 0) ? score.toFixed(0) : score.toString();

        const existing = ratings.find(r =>
          r.movie_id === td.dataset.movieID &&
          r.membership_id === member.membership_id
        );

        // If you ever have missing rows, switch to upsert (we can do later).
        if (!existing) return null;

        if (existing.score != scoreOut) {
          return {
            movie_id: td.dataset.movieID,
            membership_id: member.membership_id,
            score: scoreOut
          };
        }

        return null;
      }).filter(Boolean);

      console.log(`✅ Submitted ${updates.length} ratings`);

      for (const update of updates) {
        const { error } = await sb
          .from('ratings')
          .update({ score: update.score })
          .eq('movie_id', update.movie_id)
          .eq('membership_id', update.membership_id);

        if (error) throw error;

        const local = ratings.find(r =>
          r.movie_id === update.movie_id &&
          r.membership_id === update.membership_id
        );
        if (local) local.score = update.score;
      }

      exitEditMode();
    } catch (err) {
      console.error("Error updating ratings:", err);
      alert("Failed to save ratings.");
      submitBtn.disabled = false;
      cancelBtn.disabled = false;
    }
  });
}

function renderRoundButtons() {
  const container = document.querySelector('#round-buttons-container')
  container.innerHTML = ''
  sortedRounds = [...rounds].sort((a,b) => {
    if (a.version_number === b.version_number) {
      return a.round_number - b.round_number
    }
    return a.version_number - b.version_number
  })

  sortedRounds.forEach(round => {
    const btn = document.createElement('button')
    btn.textContent = `${round.version_number}.${round.round_number}`
    btn.classList.add('round-btn')
    btn.addEventListener('click', () => {
      displayRoundData(round)
    })
    container.appendChild(btn)
  })
}