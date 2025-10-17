// Type live-server --port=3000 into gitBash to test all this on a local server

document.querySelector('h1').textContent = 'Film Club'
let sortedRounds

window.addEventListener('dataLoaded', () => {
  renderRoundButtons()
  displayRoundData(sortedRounds[sortedRounds.length - 1])
})

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

  const headerRow = document.createElement('tr')
  headerRow.appendChild(document.createElement('th'))
  roundMovies.forEach(movie => {
    const th = document.createElement('th')
    th.textContent = movie.title
    headerRow.appendChild(th)
  })
  table.appendChild(headerRow)

  roundMembers.forEach(member => {
    const tr = document.createElement('tr')
    const nameCell = document.createElement('th')
    nameCell.textContent = member.first_name
    tr.appendChild(nameCell)

    roundMovies.forEach(movie => {
      const td = document.createElement('td')
      const rating = ratings.find(r => 
        r.membership_id === member.membership_id && r.movie_id === movie.movie_id
      )
      td.textContent = rating ? rating.score : '-'
      tr.appendChild(td)
    })

    table.appendChild(tr)
  })

  container.appendChild(table)
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