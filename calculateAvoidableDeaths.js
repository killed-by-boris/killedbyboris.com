// @license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3-or-Later

const baseTitle = document.title
const baseAPI = 'https://corona-api.com/countries'
const quickPickGrid = [
  ['PL', 'DE', 'IE'],
  ['CA', 'NZ', 'AU'],
  ['TW', 'HK', 'KR', 'SG', 'JP'],
  ['CN', 'IR']
]

var stats = {}
var parameters = {
  comp: 'NZ'
}
var countries = {
  GB: 'United Kingdom',
  DE: 'Germany',
  IE: 'Ireland',
  PL: 'Poland',
  CA: 'Canada',
  NZ: 'New Zealand',
  AU: 'Australia',
  TW: 'Taiwan',
  HK: 'Hong Kong',
  KR: 'South Korea',
  JP: 'Japan',
  SG: 'Singapore',
  CN: 'China',
  IR: 'Iran'
}

var called = []
function callAPI (url, callback) {
  if (called.indexOf(url) >= 0) {
    setTimeout(
      function (url) {
        called.pop(url)
      },
      30000
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
      parameters[sub[0]] = sub[1].toUpperCase()
    }
  })

  document.getElementById('country').className = `flag-icon flag-icon-${parameters.comp.toLowerCase()}`
}

function calculateAvoidableDeaths () {
  if (['GB', parameters.comp].map(ensureStatsPresent).every(x => x)) {
    var seconds = new Date().getTime()
    var gb = stats.GB
    var comp = stats[parameters.comp]
    var popRatio = gb.population / comp.population
    gb.projected = gb.latest_data.deaths + (gb.rate * (seconds - gb.updated))
    comp.projected = comp.latest_data.deaths + (comp.rate * (seconds - comp.updated))
    var avoidableDeaths = gb.projected - (comp.projected * popRatio)

    var out = {
      GB: parseInt(gb.projected).toLocaleString(),
      comp: parseInt(comp.projected).toLocaleString(),
      ratio: Number.parseFloat(popRatio).toPrecision(2),
      avoidable: parseInt(avoidableDeaths).toLocaleString(),
      compTotal: parseInt(comp.projected * popRatio).toLocaleString()
    }

    var avoidable = document.getElementById('avoidable')
    avoidable.innerText = out.avoidable
    avoidable.title = `
      UK deaths\t-\t${parameters.comp} deaths\t*\tPopRatio\n
      ${out.GB}\t\t-\t${out.comp}\t*\t${out.ratio}\n
      ${out.GB}\t\t-\t${out.compTotal}\n
      ${out.avoidable}
    `
  }
}

function ensureStatsPresent (country) {
  if (!(country in stats)) {
    callAPI(`/${country}`, updateCountry)
  } else if (!('rate' in stats[country])) {
    getCountryRate(country)
  } else {
    return true
  }
}

function updateCountry (response) {
  updateCountryData(response.data)
  getCountryRate(response.data.code)
}

function getCountryRate (country) {
  var data = stats[country]
  data.updated = new Date(stats[country].updated_at)
  data.hasTimeline = (('timeline' in data) && (data.timeline.length > 1))

  // if we don't have timeline data estimate since midnight
  data.rate = 0
  if (data.today.deaths > 0) {
    var timeDiff = data.hasTimeline
      ? data.updated - new Date(data.timeline[1].updated_at)
      : getMilliSecondsSinceMidnight(data.updated)
    data.rate = data.today.deaths / timeDiff
  } else if (data.hasTimeline) {
    data.rate = data.timeline[0].new_deaths /
      (new Date(data.timeline[0].updated_at) - new Date(data.timeline[1].updated_at))
  }
  if (country === 'GB' && data.rate > 0) { setUpdateInterval(data.rate) }
  calculateAvoidableDeaths()
}

function setUpdateInterval (rate) {
  /* Do this here so only 1 setInterval will be run */
  console.log(`Browser update interval: ${parseInt(1000 / rate)}s :'(`)
  setInterval(calculateAvoidableDeaths, parseInt(1 / rate))
}

function getMilliSecondsSinceMidnight (time) {
  return time.getUTCMilliseconds() +
    (1000 * (time.getSeconds() +
      (60 * (time.getUTCMinutes() +
        (60 * time.getUTCHours())
      ))
    ))
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
  flag.title = (country in stats) ? stats[country].name : countries[country]
  flag.onclick = pickCountry.bind(this, country)
  return flag
}

function pickCountry (country) {
  window.location.search = `?comp=${country}`
}

function getAllCountries () {
  document.getElementById('getAllCountries').textContent = 'Loading more countries...'
  callAPI('', updateCountriesList)
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
  data.deathsPerPop = data.latest_data.deaths / data.population
  if ('GB' in stats && data.deathsPerPop >= stats.GB.deathsPerPop) {
    return
  }
  stats[data.code] = data
  if (!(data.code in countries)) {
    return data.code
  }
}

function sliceArray (array, size) {
  var grid = []
  for (var i = 0; i < array.length; i += size) {
    grid.push(array.slice(i, i + size))
  }
  return grid
}
