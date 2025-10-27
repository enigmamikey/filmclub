document.querySelector('h1').textContent = 'Film Club'
let sortedRounds
const roundBtnsContainer = document.querySelector('#round-buttons-container')
const roundDataContainer = document.querySelector('#round-data-container')

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