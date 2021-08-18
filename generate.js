const fs = require('fs')
const Fetch = require('node-fetch')
const { generate } = require('pogo-data-generator')
const pokemonTypes = require('./data/pokemonTypes.json')

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
  const template = {
    globalOptions: {
      keyJoiner: "_",
      keys: {},
      customChildObj: {},
      customFields: {},
      snake_case: true,
      includeProtos: true
    },
    pokemon: {
      enabled: true,
      options: {
        keys: {
          main: 'pokedexId',
          forms: 'formId',
          tempEvolutions: 'tempEvoId',
        },
        customFields: {
          evoId: 'pokemon',
          formId: 'form',
          formName: 'name',
          pokemonName: 'name'
        },
        includeEstimatedPokemon: true,
      },
      template: {
        pokedexId: true,
        pokemonName: true,
        formId: false,
        forms: {
          formId: false,
          formName: true,
          proto: true,
          isCostume: true,
          evolutions: {
            evoId: true,
            formId: true,
            genderRequirement: true
          },
          tempEvolutions: {},
          attack: true,
          defense: true,
          stamina: true,
          height: true,
          weight: true,
          types: 'typeName',
          quickMoves: 'moveName',
          chargedMoves: 'moveName',
          family: true,
          little: true,
        },
        defaultFormId: true,
        genId: true,
        generation: true,
        types: 'typeName',
        quickMoves: 'moveName',
        chargedMoves: 'moveName',
        attack: true,
        defense: true,
        stamina: true,
        height: true,
        weight: true,
        fleeRate: true,
        captureRate: true,
        tempEvolutions: {
          tempEvoId: false,
          attack: true,
          defense: true,
          stamina: true,
          height: true,
          weight: true,
          types: 'typeName',
          unreleased: true
        },
        evolutions: {
          evoId: true,
          formId: true,
          genderRequirement: true
        },
        legendary: true,
        mythic: true,
        buddyGroupNumber: true,
        kmBuddyDistance: true,
        thirdMoveStardust: true,
        thirdMoveCandy: true,
        gymDefenderEligible: true,
        family: true,
        little: true
      }
    },
    types: {
      enabled: true,
      options: {
        keys: {
          main: 'typeId'
        }
      },
      template: 'typeName'
    },
    moves: {
      enabled: true,
      options: {
        keys: {
          main: 'moveId',
        },
        customFields: {
          moveId: 'id',
          moveName: 'name'
        }
      },
      template: {
        moveName: true,
        proto: true,
        type: 'typeName',
        power: true
      }
    },
    items: {
      enabled: true,
      options: {
        keys: {
          main: 'itemId'
        },
        customFields: {
          itemId: 'id',
          itemName: 'name'
        },
        minTrainerLevel: 100
      },
      template: {
        itemName: true,
        proto: true,
        type: true,
        category: true,
        minTrainerLevel: true
      }
    },
    questConditions: {
      enabled: true,
      options: {
        keys: {
          main: 'id'
        }
      },
      template: {
        proto: true,
        formatted: true
      }
    },
    questRewardTypes: {
      enabled: true,
      options: {
        keys: {
          main: 'id'
        }
      },
      template: {
        proto: true,
        formatted: true
      }
    },
    invasions: {
      enabled: true,
      options: {
        keys: {
          main: 'id',
          encounters: 'position'
        },
        placeholderData: true
      },
      template: {
        type: true,
        gender: true,
        grunt: true,
        secondReward: true,
        encounters: 'id'
      }
    },
    weather: {
      enabled: true,
      options: {
        keys: {
          main: 'weatherId'
        },
        customFields: {
          weatherName: 'name'
        }
      },
      template: {
        weatherName: true,
        types: 'typeName'
      }
    },
  }

  template.questRewardTypes.options.topLevelName = 'quest_reward_types'
  template.questConditions.options.topLevelName = 'quest_conditions'
  const data = await generate({ template })

  data.quest_types = await fetch('https://raw.githubusercontent.com/pmsf/PMSF/develop/static/data/questtype.json')
  data.throw_types = { 10: "Nice", 11: "Great", 12: "Excellent", 13: "Curveball" }

  Object.keys(pokemonTypes).forEach(type => {
    Object.keys(data.types).forEach(mfType => {
      if (data.types[mfType] === type) {
        data.types[mfType] = {
          name: data.types[mfType],
          ...pokemonTypes[type]
        }
      }
    })
  })

  template.pokemon.options.includeUnset = true
  template.pokemon.options.unsetDefaultForm = true

  const rawData = await generate({ template, raw: true })

  fs.writeFile('./master-latest.json', JSON.stringify(data, null, 2), 'utf8', () => { })
  fs.writeFile('./master-latest-v2.json', JSON.stringify(rawData, null, 2), 'utf8', () => { })
}
