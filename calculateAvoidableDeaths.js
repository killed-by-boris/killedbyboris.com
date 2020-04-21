// @license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3-or-Later

const baseTitle = document.title
const baseAPI = 'https://api.coronatab.app/places'
const quickPickGrid = [
  ['PL', 'DE', 'IE'],
  ['CA', 'NZ', 'AU'],
  ['TW', 'HK', 'KR', 'SG', 'JP'],
  ['CN', 'IR']
]

var stats = {}
var parameters = {
  ref: 'NZ'
}
var countries = {
  GB: 'united-kingdom',
  DE: 'germany',
  IE: 'ireland',
  PL: 'poland',
  CA: 'canada',
  NZ: 'new-zealand',
  AU: 'australia',
  TW: 'taiwan',
  HK: 'hong-kong',
  KR: 'south-korea',
  JP: 'japan',
  SG: 'singapore',
  CN: 'china',
  IR: 'iran'
}

var called = []
function callAPI (url, callback) {
  if (called.indexOf(url) >= 0) {
    setTimeout(
      function (url) {
        called.pop(url)
      },
      5000
    )
  } else {
    called.push(url)
    var request = new XMLHttpRequest()
    request.onreadystatechange = function () {
      if (request.readyState === 4 && request.status === 200) {
        var data = JSON.parse(request.responseText)
        callback(data)
      }
    }
    request.open('GET', baseAPI + url, true)
    request.send()
  }
}

function getAvoidableDeaths () {
  parseParemeters()
  calculateAvoidableDeaths()
}

function parseParemeters () {
  var queryElements = window.location.search.slice(1).split('&')

  queryElements.forEach(function (elem) {
    var sub = elem.split('=')
    if (sub.length > 1) {
      parameters[sub[0]] = sub[1]
    }
  })

  document.getElementById('country').className = `flag-icon flag-icon-${parameters.ref.toLowerCase()}`
}

function calculateAvoidableDeaths () {
  if (['GB', parameters.ref].map(ensureStatsPresent).every(x => x)) {
    var seconds = getSeconds()
    var gb = stats.GB
    var ref = stats[parameters.ref]
    gb.projected = gb.latestData.deaths + (gb.rate * seconds)
    ref.projected = ref.latestData.deaths + (ref.rate * seconds)
    var avoidableDeaths = gb.projected - (ref.projected * gb.population / ref.population)
    updateAvoidableDeaths(parseInt(avoidableDeaths))
  }
}

function ensureStatsPresent (country) {
  if (!(country in countries)) {
    getAllCountries()
  } else if (!(country in stats)) {
    callAPI(`/${countries[country]}`, updateCountry)
  } else if (!('rate' in stats[country])) {
    getCountryRate(country)
  } else {
    return true
  }
}

function updateCountry (response) {
  updateCountryData(response.data)
  getCountryRate(response.data.alpha2code)
}

function getCountryRate (country) {
  callAPI(`/${countries[country]}/data`, caclulateRate.bind(this, country))
}

function caclulateRate (country, response) {
  var rate = ((response.meta.projected[0].deaths - response.data[response.data.length - 1].deaths) / (24 * 60 * 60))
  stats[country].rate = rate
  if (country === 'GB') {
    /* Do this here so only 1 setInterval will be run */
    var interval = parseInt(1000 / rate)
    console.log(`Browser update interval: ${interval}ms :'(`)
    setInterval(calculateAvoidableDeaths, interval)
  }
  calculateAvoidableDeaths()
}

function getSeconds () {
  /* todo: calculate based on timezone */
  var now = new Date()
  var seconds = (60 * ((60 * now.getUTCHours()) + now.getUTCMinutes())) + now.getSeconds()
  return seconds
}

function updateAvoidableDeaths (avoidableDeaths) {
  document.getElementById('avoidable').innerText = avoidableDeaths.toLocaleString()
}

function hideIncompetence () {
  document.getElementById('incompetence').style.visibility = 'collapse'
}

function showIncompetence () {
  var picker = document.getElementById('incompetence')
  if (picker.style.visibility === 'visible') {
    hideIncompetence()
  } else {
    picker.style.visibility = 'visible'
  }
}

function hideCountryPicker () {
  document.getElementById('countryPicker').style.visibility = 'collapse'
}

function showCountryPicker () {
  var picker = document.getElementById('countryPicker')
  if (picker.style.visibility === 'visible') {
    hideCountryPicker()
  } else {
    picker.style.visibility = 'visible'
  }
  var quickPicks = document.getElementById('quickPicks')
  if (!quickPicks.innerHTML) {
    generateCountriesGrid(quickPickGrid).map(appendChild.bind(this, quickPicks))
    picker.scrollIntoView()
  }
}

function appendChild (elem, child) {
  elem.appendChild(child)
}

function generateCountriesGrid (countresGrid) {
  return countresGrid.map(generateCountriesRow)
}

function generateCountriesRow (countries) {
  var row = document.createElement('div')
  row.className = 'countryRow'
  countries.map(generateFlag).map(appendChild.bind(this, row))
  return row
}

function generateFlag (country) {
  var flag = document.createElement('span')
  flag.id = `flag-${country.toLowerCase()}`
  flag.className = `flag-icon flag-icon-${country.toLowerCase()}`
  flag.title = (country in stats) ? stats[country].name : toTitleCase(countries[country])
  flag.onclick = pickCountry.bind(this, country)
  return flag
}

function toTitleCase (string) {
  return string.split('-').map(function (word) {
    return word[0].toUpperCase() + word.slice(1)
  }).join(' ')
}

function pickCountry (country) {
  var newTitle = `${baseTitle} - (compared to ${country})`
  var newURL = document.URL
  if (window.location.search.indexOf(`ref=${parameters.ref}`) > 0) {
    newURL = newURL.replace(`ref=${parameters.ref}`, `ref=${country}`)
  } else {
    newURL += `?ref=${country}`
  }
  history.pushState({ id: country }, newTitle, newURL)
  parseParemeters()
  calculateAvoidableDeaths()
}

function getAllCountries () {
  document.getElementById('getAllCountries').textContent = 'Loading more countries...'
  callAPI('?typeId=country', updateCountriesList)
}

function updateCountriesList (response) {
  var countriesToAdd = response.data.map(updateCountryData).filter(x => x)
  var rowWidth = parseInt(countriesToAdd.length ** 0.5)
  var countriesToAddGrid = sliceArray(countriesToAdd, rowWidth)
  var otherCountries = document.getElementById('otherCountries')
  generateCountriesGrid(countriesToAddGrid).map(appendChild.bind(this, otherCountries))
  document.getElementById('getAllCountries').style.visibility = 'collapse'
}

function updateCountryData (data) {
  var alpha2code = data.alpha2code
  data.deathsPerPop = data.latestData.deaths / data.population
  if ('GB' in stats && data.deathsPerPop >= stats.GB.deathsPerPop) {
    return
  }
  stats[alpha2code] = data
  if (!(alpha2code in countries)) {
    countries[alpha2code] = data.id
    if (parameters.ref === data.id) {
      calculateAvoidableDeaths()
    }
    return alpha2code
  }
}

function sliceArray (array, size) {
  var grid = []
  for (var i = 0; i < array.length; i += size) {
    grid.push(array.slice(i, i + size))
  }
  return grid
}
