module.exports = {
  pokemon: {
    enabled: true,
    options: {
      topLevelName: 'monsters',
      keyJoiner: '_',
      keys: {
        main: 'pokedexId formId',
      },
      customFields: {
        pokedexId: 'id',
        formId: 'id',
        pokemonName: 'name',
        formName: 'name',
        attack: 'baseAttack',
        defense: 'baseDefense',
        stamina: 'baseStamina',
        forms: 'form',
        typeName: 'name',
        typeId: 'id',
      },
      customChildObj: {
        attack: 'stats',
        defense: 'stats',
        stamina: 'stats',
      },
      includeUnset: true,
      skipNormalIfUnset: true,
      unsetDefaultForm: true,
      processFormsSeparately: true,
      skipForms: ['Shadow', 'Purified'],
      allUnset: true,
      includeEstimatedPokemon: true,
    },
    template: {
      pokemonName: true,
      forms: {
        formName: true,
        formId: true,
      },
      pokedexId: true,
      types: {
        typeId: true,
        typeName: true,
      },
      attack: true,
      defense: true,
      stamina: true,
    },
  },
  items: {
    enabled: true,
    options: {
      keys: {
        main: 'itemId',
      },
      customFields: {
        itemName: 'name',
      },
    },
    template: {
      itemName: true,
    },
  },
  moves: {
    enabled: true,
    options: {
      keys: {
        main: 'moveId',
      },
      customFields: {
        moveName: 'name',
      },
    },
    template: {
      moveName: true,
    },
  },
  questTypes: {
    enabled: true,
    options: {
      keys: {
        main: 'id',
      },
      customFields: {
        formatted: 'text',
      },
    },
    template: {
      formatted: true,
    },
  },
}
