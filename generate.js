const fs = require('fs')
const Fetch = require('node-fetch')
const { generate } = require('pogo-data-generator')

const primary = require('./templates/primary.json')
const raw = require('./templates/raw.json')
const poracle = require('./templates/poracle.json')
const basics = require('./templates/basics.json')
const reactMap = require('./templates/reactMap.json')
const rdmopole2 = require('./templates/rdmopole2.json')

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
  const data = await generate({ template: primary })
  const rawData = await generate({ template: raw, raw: true })
  const poracleData = await generate({ template: poracle })
  const basicData = await generate({ template: basics })
  const reactMapData = await generate({ template: reactMap })
  const rdmopole2Data = await generate({ template: rdmopole2 })

  const pmsfQuestTypes = await fetch('https://raw.githubusercontent.com/pmsf/PMSF/develop/static/data/questtype.json')

  const mergedQuestTypes = {}
  Object.keys(poracleData.questTypes).forEach((key) => {
    mergedQuestTypes[key] = pmsfQuestTypes[key] && pmsfQuestTypes[key].text.includes('{')
      ? pmsfQuestTypes[key]
      : poracleData.questTypes[key]
  })

  data.type_ids = reactMapData.types
  data.quest_types = mergedQuestTypes
  data.throw_types = { 10: "Nice", 11: "Great", 12: "Excellent", 13: "Curveball" }

  poracleData.questTypes = mergedQuestTypes
  delete poracleData.translations
  
  fs.writeFile('./master-latest.json', JSON.stringify(data, null, 2), 'utf8', () => { })
  fs.writeFile('./master-latest-raw.json', JSON.stringify(rawData, null, 2), 'utf8', () => { })
  fs.writeFile('./master-latest-poracle.json', JSON.stringify(poracleData, null, 2), 'utf8', () => { })
  fs.writeFile('./master-latest-basics.json', JSON.stringify(basicData, null, 2), 'utf8', () => { })
  fs.writeFile('./master-latest-react-map.json', JSON.stringify(reactMapData, null, 2), 'utf8', () => { })
  fs.writeFile('./master-latest-rdmopole2.json', JSON.stringify(rdmopole2Data, null, 2), 'utf8', () => { })
}
