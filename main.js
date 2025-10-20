// to do list
// 1. Add an extra row showing who picked each movie - there is a chatGPT suggestion on how to do this. make sure that afterwards you only have one header at the top of the columns (or see if this even matters)

// 2. We should add a button that allows a user to add a movie BUT it should only allow them to add a movie in the spot where thier pick for the round will go.

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
    th.textContent = movie.title || ''
    headerRow.appendChild(th)
  })
  table.appendChild(headerRow)

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
    rateBtn.textContent = 'Rate My Movies'
    rateBtn.classList.add('action-btn')
    container.appendChild(rateBtn)

    rateBtn.addEventListener('click', () => {
      enterEditMode(currentMember,round,roundMovies)
    })
  }
}

function enterEditMode(member, round, roundMovies) {  
  console.log(`Entering edit mode for ${member.first_name}`)
  const table = document.querySelector('.ratings-table')
  const rateBtn = document.querySelector('.action-btn')
  const roundBtns = document.querySelector('#round-buttons-container')
  const logoutBtn = document.querySelector('#logout-btn')
  rateBtn.classList.add('hidden')
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