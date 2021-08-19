module.exports = {
  globalOptions: {
    keyJoiner: "_",
    keys: {},
    customChildObj: {},
    customFields: {},
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
        pokemonName: 'name',
        mythic: 'mythical',
      },
      includeEstimatedPokemon: true,
      skipForms: ['Shadow', 'Purified'],
      includeUnset: true,
      skipNormalIfUnset: true,
      unsetDefaultForm: true,
    },
    template: {
      pokedexId: true,
      pokemonName: true,
      forms: {
        formName: true,
        isCostume: true,
        types: 'typeId',
        family: true,
        little: true,
      },
      defaultFormId: true,
      genId: true,
      generation: true,
      types: 'typeId',
      tempEvolutions: {
        unreleased: true
      },
      legendary: true,
      mythic: true,
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
        moveName: 'name',
      }
    },
    template: {
      moveName: true,
      type: 'typeId',
    }
  },
  items: {
    enabled: true,
    options: {
      keys: {
        main: 'itemId'
      },
      customFields: {
        itemName: 'name'
      },
      minTrainerLevel: 50,
    },
    template: 'itemName',
  },
  questRewardTypes: {
    enabled: true,
    options: {
      keys: {
        main: 'id'
      },
    },
    template: 'formatted'
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
      types: 'typeId'
    }
  },
}