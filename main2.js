document.querySelector('h1').textContent = 'Film Club'
let sortedRounds
const roundBtnsContainer = document.querySelector('#round-buttons-container')
const roundDataContainer = document.querySelector('#round-data-container')






// this one needs two rounds of clean-up at minimum
function enterEditMode(member, round, roundMovies) {  
  console.log(`Entering edit mode for ${member.first_name}`)
  const table = document.querySelector('.ratings-table') // is this really how you want to do stuff? Maybe put it in the inedex.html file and keep it hidden until it needs to be displayed... It could have inner.HTML = '' at the beginning of loadRoundData() This would need some additional major overhaul...
  const rateBtn = document.querySelector('#rate-btn')
  const addMovieBtn = document.querySelector('#addMovie-btn')
  const roundBtns = document.querySelector('#round-buttons-container')
  const logoutBtn = document.querySelector('#logout-btn')
  rateBtn.classList.add('hidden')
  addMovieBtn.classList.add('hidden')
  roundBtns.classList.add('hidden')
  logoutBtn.classList.add('hidden')

  const row = [...table.querySelectorAll('tr')]
    .find(tr => tr.querySelector('th')?.textContent === member.first_name)

  const editableCells = [...row.querySelectorAll('td')]
    .filter(td => {
      const movieID = td.dataset.movieID
      const movie = roundMovies.find(m => m.movie_id === movieID)
      return movie && movie.title && movie.title.trim() != ''
    })
    editableCells.forEach(td => {
      const currentValue = td.textContent === '-' ? '': td.textContent
      const input = document.createElement('input')
      input.type = 'number'
      input.min = 1
      input.max = 10
      input.value = currentValue
      input.classList.add('rating-input')
      td.textContent = ''
      td.appendChild(input)
    })
    const submitBtn = document.createElement('button')
    submitBtn.textContent = 'Submit Ratings'
    submitBtn.classList.add('action-btn', 'submit-btn')
    const cancelBtn = document.createElement('button')
    cancelBtn.textContent = 'Cancel'
    cancelBtn.classList.add('action-btn', 'cancel-btn')
    const container = document.querySelector('#round-data-container')
    container.appendChild(submitBtn)
    container.appendChild(cancelBtn)
    cancelBtn.addEventListener('click', () => {
      container.innerHTML = ''
      displayRoundData(round)
      roundBtns.classList.remove('hidden')
      // logoutBtn.classList.remove('hidden')
    })
    submitBtn.addEventListener('click', async () => {
      const updates = editableCells.map(td => {
        const input = td.querySelector('input')
        let score = parseFloat(input.value)
        if (isNaN(score)) {
          return null
        }
        score = Math.min(Math.max(score,1),10)
        score = Math.floor(score*10)/10
        if (score % 1 == 0) {
          score = score.toFixed(0)
        }
        const existing = ratings.find(r => r.movie_id === td.dataset.movieID && r.membership_id === member.membership_id)
        if (existing.score != score) {
          return {
            movie_id: td.dataset.movieID,
            membership_id: member.membership_id,
            score: score
          }
        }
        return null
      }).filter(Boolean)
      
      console.log(`✅ Submitted ${updates.length} ratings`)
      for (const update of updates) {
        const {error} = await supabase
          .from('ratings')
          .update({score: update.score})
          .eq('movie_id', update.movie_id)
          .eq('membership_id', update.membership_id)
        if (error) {
          console.error("Error updating ratings:", error)
          alert('failed to save ratings')
        } else {
          ratings.find(r => r.movie_id === update.movie_id && r.membership_id === update.membership_id).score = update.score
          container.innerHTML = ''
          roundBtns.classList.remove('hidden')
          // logoutBtn.classList.remove('hidden')
          displayRoundData(round)
        }
      }
    })
}

window.addEventListener('dataLoaded', () => {
  renderRoundButtons()
  displayRoundData(sortedRounds[sortedRounds.length - 1])
})

function renderRoundButtons() {
  roundBtnsContainer.innerHTML = ''
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
    roundBtnsContainer.appendChild(btn)
  })
}

function displayRoundData(round) {
  roundDataContainer.classList.remove('hidden')
  roundDataContainer.innerHTML = ''

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
  roundDataContainer.appendChild(table)

  if (currentMember) {
    const rateBtn = document.createElement('button')
    const addMovieBtn = document.createElement('button')
    rateBtn.textContent = 'Rate My Movies'
    addMovieBtn.textContent = 'Add My Movie'
    rateBtn.id = 'rate-btn'
    addMovieBtn.id = 'addMovie-btn'
    roundDataContainer.appendChild(rateBtn)
    roundDataContainer.appendChild(addMovieBtn)

    rateBtn.addEventListener('click', () => {
      enterEditMode(currentMember,round,roundMovies)
    })

    addMovieBtn.addEventListener('click', () => {
      enterEditMovieMode(currentMember,round,roundMovies)
    })
  }
}