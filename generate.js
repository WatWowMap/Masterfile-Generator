const fs = require('fs')
const { exec } = require('child_process')
const Fetch = require('node-fetch')
const { generate } = require('pogo-data-generator')

const fetch = async (url) => {
  try {
    const data = await Fetch(url)
    if (!data.ok) {
      throw new Error(`${data.status} ${data.statusText} URL: ${url}`)
    }
    return await data.json()
  } catch (e) {
    console.error(e, `Unable to fetch ${url}`)
  }
}

let sha = ''
exec('git rev-parse HEAD', (err, stdout) => {
  try {
    if (err || typeof stdout !== 'string' || !stdout.trim()) {
      throw new Error('Unable to get current sha', err)
    }
    sha = stdout.trim().substring(0, 7)
  } catch (e) {
    console.warn(
      '[UPDATE] Unable to get current SHA',
      e.message,
      'Branch:',
      branch
    )
  }
})

async function masterfile() {
  const templates = await fs.promises.readdir('./templates')
  const pmsfQuestTypes = await fetch(
    'https://raw.githubusercontent.com/pmsf/PMSF/develop/static/data/questtype.json'
  )

  if (!fs.existsSync(`./previous-versions/${sha}`)) {
    fs.mkdirSync(`./previous-versions/${sha}`)
  }

  await Promise.all(
    templates.map(async (templateName) => {
      const previousFilePath =
        __dirname + `./previous-versions/${sha}/${templateName}`
      const exists = fs.existsSync(previousFilePath)

      if (exists) {
        try {
          fs.writeFileSync(
            previousFilePath,
            fs.readFileSync(`./${templateName}`)
          )
        } catch (e) {
          console.warn(`Previous version of ${templateName} does not exist`)
        }
      }
      try {
        console.log('Generating', templateName)
        const template = JSON.parse(
          fs.readFileSync(`./templates/${templateName}`)
        )
        const newData = await generate({
          template,
          raw: templateName === 'master-latest-raw.json',
          translationApkUrl:
            'https://raw.githubusercontent.com/turtiesocks/pogo_assets/master/Texts/Latest%20APK/JSON/i18n_english.json',
        })

        if (
          templateName === 'master-latest-poracle.json' ||
          templateName === 'master-latest.json'
        ) {
          const mergedQuestTypes = {}
          const questKey =
            templateName === 'master-latest-poracle.json'
              ? 'questTypes'
              : 'quest_types'
          Object.keys(newData[questKey]).forEach((key) => {
            mergedQuestTypes[key] =
              pmsfQuestTypes[key] && pmsfQuestTypes[key].text.includes('{')
                ? pmsfQuestTypes[key]
                : newData[questKey][key]
          })
          newData[questKey] = mergedQuestTypes
          if (templateName === 'master-latest.json') {
            newData.type_ids = JSON.parse(
              fs.readFileSync('./master-latest-react-map.json')
            ).types
            newData.throw_types = {
              10: 'Nice',
              11: 'Great',
              12: 'Excellent',
              13: 'Curveball',
            }
          }
        }
        if (
          templateName === 'master-latest-poracle.json' ||
          templateName === 'master-latest-everything.json'
        ) {
          delete newData.translations
        }
        fs.writeFileSync(`./${templateName}`, JSON.stringify(newData, null, 2))

        // compare content of both files
        if (exists) {
          const newFile = fs.readFileSync(`./${templateName}`)
          const previousFile = fs.readFileSync(previousFilePath)
          if (previousFile.equals(newFile)) {
            fs.unlinkSync(previousFilePath, (err) => {
              if (err) console.error(err)
              else {
                console.log(`Deleted file ${templateName}`)
              }
            })
          }
        }

        if (templateName === 'master-latest.json') {
          const pokedex = []
          for (const [pokemonId, pokemon] of Object.entries(newData.pokemon)) {
            if (!(pokemon.attack && pokemon.defense && pokemon.stamina))
              continue
            const pushEntry = (stats, name) =>
              pokedex.push(
                `{id:${pokemonId},name:` +
                  JSON.stringify(
                    name === null ? pokemon.name : `${pokemon.name} (${name})`
                  ) +
                  `,at:${stats.attack},df:${stats.defense},st:${stats.stamina}}`
              )
            pushEntry(pokemon, null)
            for (const form of Object.values(pokemon.forms)) {
              if (form.attack && form.defense && form.stamina)
                pushEntry(form, form.name)
            }
            for (const [id, evo] of Object.entries(
              pokemon.temp_evolutions || {}
            )) {
              if (evo.attack && evo.defense && evo.stamina)
                pushEntry(evo, ['Unset', 'Mega', 'Mega X', 'Mega Y'][id])
            }
          }
          fs.writeFileSync('./pokedex.js', `pokedex=[${pokedex.join(',')}]`)
        }
      } catch (e) {
        console.error(e, `Unable to process ${templateName}`)
      }
    })
  )
}

module.exports.masterfile = masterfile

if (require.main === module) {
  masterfile().then(() => console.log('Masterfiles Generated'))
}
