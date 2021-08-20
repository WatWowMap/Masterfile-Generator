const fs = require('fs')
const Fetch = require('node-fetch')
const { generate } = require('pogo-data-generator')
const pokemonTypes = require('./data/pokemonTypes.json')

const primaryTemplate = require('./templates/primary.js')
const rawTemplate = require('./templates/raw.js')
const poracleTemplate = require('./templates/poracle.js')
const basicsTemplate = require('./templates/basics.js')
const reactMapTemplate = require('./templates/reactMap.js')
const rdmopole2Template = require('./templates/rdmopole2.js')

const fetch = async (url) => {
  return new Promise(resolve => {
    Fetch(url)
      .then(res => res.json())
      .then(json => {
        return resolve(json)
      })
  })
}

module.exports.generate = async function update() {

  const data = await generate({ template: primaryTemplate })

  data.quest_types = await fetch('https://raw.githubusercontent.com/pmsf/PMSF/develop/static/data/questtype.json')
  data.throw_types = { 10: "Nice", 11: "Great", 12: "Excellent", 13: "Curveball" }
  data.types = { ...data.types, ...pokemonTypes }

  const rawData = await generate({ template: rawTemplate, raw: true })
  const poracleData = await generate({ template: poracleTemplate })
  const basicData = await generate({ template: basicsTemplate })
  const reactMapData = await generate({ template: reactMapTemplate })
  const rdmopole2Data = await generate({ template: rdmopole2Template })

  fs.writeFile('./master-latest.json', JSON.stringify(data, null, 2), 'utf8', () => { })
  fs.writeFile('./master-latest-raw.json', JSON.stringify(rawData, null, 2), 'utf8', () => { })
  fs.writeFile('./master-latest-poracle.json', JSON.stringify(poracleData, null, 2), 'utf8', () => { })
  fs.writeFile('./master-latest-basics.json', JSON.stringify(basicData, null, 2), 'utf8', () => { })
  fs.writeFile('./master-latest-react-map.json', JSON.stringify(reactMapData, null, 2), 'utf8', () => { })
  fs.writeFile('./master-latest-rdmopole2.json', JSON.stringify(rdmopole2Data, null, 2), 'utf8', () => { })
}
