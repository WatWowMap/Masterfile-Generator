module.exports = {
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
      buddyDistance: true,
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
      },
      customFields: {
        formatted: 'text',
      },
      topLevelName: 'quest_conditions',
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
      },
      customFields: {
        formatted: 'text',
      },
      topLevelName: 'quest_reward_types',
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