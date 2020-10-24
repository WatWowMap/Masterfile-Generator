const Fetch = require("node-fetch");
const Fs = require("fs-extra");

var MasterArray, GameMaster, Form_List, Pokemon_List, Item_List, Quest_Types, Gender_List, Temp_Evolutions;

function Fetch_Json(url) {
  return new Promise(resolve => {
    Fetch(url)
      .then(res => res.json())
      .then(json => {
        return resolve(json);
      });
  });
}

function capitalize(string) {
  try {
    string = string.toLowerCase();
    if (string.split("_").length > 1) {
      let processed = "";
      string.split("_").forEach((word) => {
        processed += " " + word.charAt(0).toUpperCase() + word.slice(1)
      });
      return processed.slice(1);
    } else {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
  } catch (e) {
    console.error(e);
    console.error(string);
  }
}

function ensure_pokemon(pokemon_id) {
  if (!GameMaster.pokemon[pokemon_id]) {
    GameMaster.pokemon[pokemon_id] = {};
  }
  if (!GameMaster.pokemon[pokemon_id].name) {
    GameMaster.pokemon[pokemon_id].name = pokemon_id === 29 ? "Nidoran♀" : pokemon_id === 32 ? "Nidoran♂" : capitalize(Pokemon_List[pokemon_id].substr(36));
  }
}

function get_moves(moves) {
  return new Promise(async resolve => {
    let list = [];
    if (moves) {
      await moves.forEach(move => {
        let m = move.replace("_FAST", "").split("_");
        let new_move = capitalize(m[0]);
        if (m[1]) {
          new_move += " " + capitalize(m[1]);
        }
        list.push(new_move);
      });
    }
    return resolve(list);
  });
}

function Generate_Moves(GameMaster) {
  return new Promise(resolve => {
    let MoveArray = Object.keys(Move_List).map(i => i);
    for (let n = 0, len = MoveArray.length; n < len; n++) {
      let id = Move_List[MoveArray[n]];
      GameMaster.moves[id] = {};
      GameMaster.moves[id].name = capitalize(MoveArray[n].substr(11).replace("_FAST", ""));
    }
    return resolve(GameMaster);
  });
}

function Generate_Quest_Types(GameMaster) {
  return new Promise(resolve => {
    let QuestTypeArray = Object.keys(Quest_Types).map(i => i);
    for (let n = 0, len = QuestTypeArray.length; n < len; n++) {
      let id = Quest_Types[QuestTypeArray[n]];
      GameMaster.quest_types[Quest_Types[QuestTypeArray[n]]] = {};
      GameMaster.quest_types[Quest_Types[QuestTypeArray[n]]].name = capitalize(QuestTypeArray[n].replace("QUEST_", ""));
      GameMaster.quest_types[Quest_Types[QuestTypeArray[n]]].proto = QuestTypeArray[n];
    }
    return resolve(GameMaster);
  });
}

function Lookup_Pokemon(name) {
  let pokemon_id = null;
  for (const key of Object.keys(Pokemon_List)) {
    if (!key.startsWith('V') || !name.startsWith(key.substr('V9999_POKEMON_'.length) + '_') && name !== key.substr('V9999_POKEMON_'.length)) {
      continue;
    }
    if (pokemon_id !== null) {
      if (pokemon_id.length > key.length) {
        continue;
      }
      if (pokemon_id.length === key.length) {
        console.warn('Ambiguous form', name, pokemon_id, key);
      }
    }
    pokemon_id = key;
  }
  if (pokemon_id === null) {
    console.warn('Unknown form', name);
  }
  return pokemon_id;
}

function Generate_Forms(GameMaster, MasterArray) {
  return new Promise(async resolve => {
    for (let o = 0, len = MasterArray.length; o < len; o++) {
      let object = MasterArray[o];
      if (object.templateId.split("_")[1]) {
        let pokemon_id = Number(object.templateId.split("_")[1].slice(1));
        try {
          if (object.data.formSettings) {
            ensure_pokemon(pokemon_id);
            if (!GameMaster.pokemon[pokemon_id].forms) {
              GameMaster.pokemon[pokemon_id].forms = {};
            }
            let forms = object.data.formSettings.forms;
            if (forms) {
              GameMaster.pokemon[pokemon_id].forms = {};
              for (let f = 0, flen = forms.length; f < flen; f++) {
                let id = Form_List[object.data.formSettings.forms[f].form];
                if (f === 0) {
                  GameMaster.pokemon[pokemon_id].default_form_id = id;
                }
                if (!GameMaster.pokemon[pokemon_id].forms[id]) {
                  GameMaster.pokemon[pokemon_id].forms[id] = {};
                }
                if (forms[f].form.split("_")[2] && !GameMaster.pokemon[pokemon_id].forms[id].name) {
                  GameMaster.pokemon[pokemon_id].forms[id].name = capitalize(forms[f].form.split("_")[1] + " " + forms[f].form.split("_")[2]);
                } else if (!GameMaster.pokemon[pokemon_id].forms[id].name) {
                  GameMaster.pokemon[pokemon_id].forms[id].name = capitalize(forms[f].form.split("_")[1]);
                }
                if (!GameMaster.pokemon[pokemon_id].forms[id].proto) {
                  GameMaster.pokemon[pokemon_id].forms[id].proto = object.data.formSettings.forms[f].name;
                }
              }
            }
          }
        } catch (e) {
          console.error(e);
          console.error(object);
        }
      }
    }

    let FormArray = Object.keys(Form_List).map(i => i);
    for (let f = 0, flen = FormArray.length; f < flen; f++) {

      let data = FormArray[f].split("_");
      let pokemon_id = Lookup_Pokemon(FormArray[f]);
      if (pokemon_id === null) {
        continue;
      }
      pokemon_id = Pokemon_List[pokemon_id];
      let form_name = capitalize(data[1]);
      let form_id = Form_List[FormArray[f]];

      ensure_pokemon(pokemon_id);
      if (!GameMaster.pokemon[pokemon_id].forms[form_id]) {
        GameMaster.pokemon[pokemon_id].forms[form_id] = {};
      }
      if (!GameMaster.pokemon[pokemon_id].forms[form_id].name) {
        GameMaster.pokemon[pokemon_id].forms[form_id].name = form_name;
      }
      if (!GameMaster.pokemon[pokemon_id].forms[form_id].proto) {
        GameMaster.pokemon[pokemon_id].forms[form_id].proto = FormArray[f];
      }
    }

    return resolve(GameMaster);
  });
}

function Compile_Evolutions(target, object, pokemon = target) {
  if (object.data.pokemonSettings.evolutionBranch) {
    object.data.pokemonSettings.evolutionBranch.forEach(branch => {
      if (branch.tempEvolution) {
        // ignored: handled below
        // const result = {};
        // result.temp_evolution = Temp_Evolutions[branch.tempEvolution];
        // result.form = Form_List[branch.form];
      } else if (branch.evolution) {
        if (!target.evolutions) {
          target.evolutions = {};
        }
        const evolution = {};
        if (branch.form) {
          evolution.form = Form_List[branch.form];
        }
        if (branch.genderRequirement) {
          evolution.gender_requirement = Gender_List[branch.genderRequirement];
        }
        target.evolutions[Pokemon_List[Lookup_Pokemon(branch.evolution)]] = evolution;
      } else {
        console.warn('Unrecognized evolutionBranch', branch);
      }
    });
  }
  if (object.data.pokemonSettings.obTemporaryEvolutions) {
    if (!target.temp_evolutions) {
      target.temp_evolutions = {};
    }
    for (const tempEvolution of object.data.pokemonSettings.obTemporaryEvolutions) {
      const key = Temp_Evolutions[tempEvolution.obTemporaryEvolution];
      const result = {};
      const compared = pokemon === target ? {} : pokemon.temp_evolutions[key];
      if (tempEvolution.stats.baseAttack !== compared.attack && tempEvolution.stats.baseAttack !== pokemon.attack ||
          tempEvolution.stats.baseDefense !== compared.defense && tempEvolution.stats.baseDefense !== pokemon.defense ||
          tempEvolution.stats.baseStamina !== compared.stamina && tempEvolution.stats.baseStamina !== pokemon.stamina) {
        result.attack = tempEvolution.stats.baseAttack;
        result.defense = tempEvolution.stats.baseDefense;
        result.stamina = tempEvolution.stats.baseStamina;
      }
      if (tempEvolution.obPokedexHeightM !== compared.height && tempEvolution.obPokedexHeightM !== pokemon.height) {
        result.height = tempEvolution.obPokedexHeightM;
      }
      if (tempEvolution.obPokedexWeightKg !== compared.weight && tempEvolution.obPokedexWeightKg !== pokemon.weight) {
        result.weight = tempEvolution.obPokedexWeightKg;
      }
      let types = [];
      if (tempEvolution.type) {
        types.push(capitalize(tempEvolution.type.replace("POKEMON_TYPE_", "")));
      }
      if (tempEvolution.type2) {
        types.push(capitalize(tempEvolution.type2.replace("POKEMON_TYPE_", "")));
      }
      if (types.toString() !== (compared.types || []).toString() && types.toString() !== pokemon.types.toString()) {
        result.types = types;
      }
      target.temp_evolutions[key] = result;
    }
  }
}

function Compile_Data(GameMaster, MasterArray) {
  return new Promise(async resolve => {
    for (let o = 0, len = MasterArray.length; o < len; o++) {
      let object = MasterArray[o];
      try {
        if (object.data.pokemonSettings) {
          let pokemon_id = Number(object.templateId.split("_")[0].slice(1));
          ensure_pokemon(pokemon_id);
          let Pokemon = GameMaster.pokemon[pokemon_id];
          let form_id = null;
          if (/^V\d{4}_POKEMON_/.test(object.templateId)) {
            form_id = Form_List[object.templateId.substr('V9999_POKEMON_'.length)];
          }
          if (form_id) {
            if (!Pokemon.forms[form_id]) {
              Pokemon.forms[form_id] = {};
            }
            let Form = Pokemon.forms[form_id];
            // ADD TO POKEMON FORMS
            //Form.name = capitalize(object.data.pokemonSettings.uniqueId);
            if (!Form.name) {
              Form.name = capitalize(object.templateId.split("_")[3]);
            }
            Compile_Evolutions(Form, object, Pokemon);

            switch (true) {
              case object.data.pokemonSettings.stats.baseAttack != Pokemon.attack:
              case object.data.pokemonSettings.stats.baseDefense != Pokemon.defense:
              case object.data.pokemonSettings.stats.baseStamina != Pokemon.stamina:
                Form.attack = object.data.pokemonSettings.stats.baseAttack;
                Form.defense = object.data.pokemonSettings.stats.baseDefense;
                Form.stamina = object.data.pokemonSettings.stats.baseStamina;
            }
            switch (true) {
              case object.data.pokemonSettings.pokedexHeightM != Pokemon.height:
              case object.data.pokemonSettings.pokedexWeightKg != Pokemon.weight:
                Form.height = object.data.pokemonSettings.pokedexHeightM;
                Form.weight = object.data.pokemonSettings.pokedexWeightKg;
            }
            //Form.flee_rate = object.data.pokemonSettings.encounter.baseFleeRate;
            //Form.capture_rate = object.data.pokemonSettings.encounter.baseCaptureRate;
            //Form.quick_moves = await get_moves(object.data.pokemonSettings.quickMoves);
            //Form.charged_moves = await get_moves(object.data.pokemonSettings.cinematicMoves);
            //Form.legendary = object.data.pokemonSettings.pokemonClass == "POKEMON_CLASS_LEGENDARY" ? true : false;
            //Form.mythic = object.data.pokemonSettings.pokemonClass == "POKEMON_CLASS_MYTHIC" ? true : false;
            //Form.buddy_group_number = object.data.pokemonSettings.buddyGroupNumber;
            //Form.buddy_distance = object.data.pokemonSettings.kmBuddyDistance;
            //Form.third_move_stardust = object.data.pokemonSettings.thirdMove.stardustToUnlock;
            //Form.third_move_candy = object.data.pokemonSettings.thirdMove.candyToUnlock;
            //Form.gym_defender_eligible = object.data.pokemonSettings.isDeployable;
            let quick_moves = await get_moves(object.data.pokemonSettings.quickMoves);
            if (quick_moves.toString() != Pokemon.quick_moves.toString()) {
              Form.quick_moves = quick_moves;
            }
            let charged_moves = await get_moves(object.data.pokemonSettings.cinematicMoves);
            if (charged_moves.toString() != Pokemon.charged_moves.toString()) {
              Form.charged_moves = charged_moves;
            }
            let types = [];
            if (object.data.pokemonSettings.type) {
              types.push(capitalize(object.data.pokemonSettings.type.replace("POKEMON_TYPE_", "")));
            }
            if (object.data.pokemonSettings.type2) {
              types.push(capitalize(object.data.pokemonSettings.type2.replace("POKEMON_TYPE_", "")));
            }
            if (types.toString() != Pokemon.types.toString()) {
              Form.types = types;
            }
          } else {
            Pokemon.pokedex_id = pokemon_id;
            Pokemon.types = [];
            if (object.data.pokemonSettings.type) {
              Pokemon.types.push(capitalize(object.data.pokemonSettings.type.replace("POKEMON_TYPE_", "")));
            }
            if (object.data.pokemonSettings.type2) {
              Pokemon.types.push(capitalize(object.data.pokemonSettings.type2.replace("POKEMON_TYPE_", "")));
            }
            Pokemon.attack = object.data.pokemonSettings.stats.baseAttack;
            Pokemon.defense = object.data.pokemonSettings.stats.baseDefense;
            Pokemon.stamina = object.data.pokemonSettings.stats.baseStamina;
            Pokemon.height = object.data.pokemonSettings.pokedexHeightM;
            Pokemon.weight = object.data.pokemonSettings.pokedexWeightKg
            Pokemon.flee_rate = object.data.pokemonSettings.encounter.baseFleeRate;
            Pokemon.capture_rate = object.data.pokemonSettings.encounter.baseCaptureRate;
            Pokemon.quick_moves = await get_moves(object.data.pokemonSettings.quickMoves);
            Pokemon.charged_moves = await get_moves(object.data.pokemonSettings.cinematicMoves);
            Compile_Evolutions(Pokemon, object);
            Pokemon.legendary = object.data.pokemonSettings.pokemonClass == "POKEMON_CLASS_LEGENDARY" ? true : false;
            Pokemon.mythic = object.data.pokemonSettings.pokemonClass == "POKEMON_CLASS_MYTHIC" ? true : false;
            Pokemon.buddy_group_number = object.data.pokemonSettings.buddyGroupNumber;
            Pokemon.buddy_distance = object.data.pokemonSettings.kmBuddyDistance;
            Pokemon.third_move_stardust = object.data.pokemonSettings.thirdMove.stardustToUnlock;
            Pokemon.third_move_candy = object.data.pokemonSettings.thirdMove.candyToUnlock;
            Pokemon.gym_defender_eligible = object.data.pokemonSettings.isDeployable;
          }
        } else if (object.data.itemSettings) {
          let item_name = "";
          object.data.itemSettings.itemId.split("_").splice(1).forEach((word) => {
            item_name += " " + capitalize(word);
          });
          let item_id = Item_List[object.data.itemSettings.itemId];
          if (!GameMaster.items[item_id]) {
            GameMaster.items[item_id] = {}
          }
          GameMaster.items[item_id].name = item_name.slice(1);
          GameMaster.items[item_id].proto = object.data.itemSettings.itemId;
          GameMaster.items[item_id].type = capitalize(object.data.itemSettings.itemType.replace("ITEM_TYPE_", ""));
          GameMaster.items[item_id].category = capitalize(object.data.itemSettings.category.replace("ITEM_CATEGORY_", ""));
          if (object.data.itemSettings.dropTrainerLevel && object.data.itemSettings.dropTrainerLevel < 60) {
            GameMaster.items[item_id].min_trainer_level = object.data.itemSettings.dropTrainerLevel;
          }
        } else if (object.data.combatMove) {
          let move_id = Move_List[object.data.templateId.substr(7)];
          if (!GameMaster.moves[move_id]) {
            GameMaster.moves[move_id] = {}
          }
          let Move = GameMaster.moves[move_id];
          Move.name = capitalize(object.data.combatMove.uniqueId.replace("_FAST", ""));
          Move.proto = object.templateId.substr(7);
          Move.type = capitalize(object.data.combatMove.type.replace("POKEMON_TYPE_", ""));
          Move.power = object.data.combatMove.power;
        }
      } catch (e) {
        console.error(e);
        console.error(object);
      }
    }

    // END
    return resolve(GameMaster)
  });
}


(async function () {
  const rpc = await require('purified-protos')();
  Move_List = rpc.HoloPokemonMove;
  Form_List = rpc.PokemonDisplayProto.Form;
  Pokemon_List = rpc.HoloPokemonId;
  Quest_Types = rpc.QuestType;
  Item_List = rpc.Item;
  Gender_List = rpc.PokemonDisplayProto.Gender;
  Temp_Evolutions = rpc.TempEvolution;

  GameMaster = {};

  let MasterArray = await Fetch_Json("https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json");

  GameMaster.pokemon = {};
  GameMaster = await Generate_Forms(GameMaster, MasterArray);
  GameMaster.pokemon_types = require(__dirname + "/data/pokemonTypes.json");
  GameMaster.moves = {};
  GameMaster = await Generate_Moves(GameMaster);
  GameMaster.throw_types = JSON.parse(`{"10": "Nice", "11": "Great", "12": "Excellent"}`)
  GameMaster.quest_types = await Fetch_Json("https://raw.githubusercontent.com/pmsf/PMSF/master/static/data/questtype.json");
  GameMaster.quest_conditions = await Fetch_Json("https://raw.githubusercontent.com/pmsf/PMSF/master/static/data/conditiontype.json");
  GameMaster.quest_reward_types = await Fetch_Json("https://raw.githubusercontent.com/pmsf/PMSF/master/static/data/rewardtype.json");
  GameMaster.grunt_types = await Fetch_Json("https://raw.githubusercontent.com/pmsf/PMSF/master/static/data/grunttype.json");
  GameMaster.items = {};
  GameMaster = await Compile_Data(GameMaster, MasterArray);
  Fs.writeJSONSync("master-latest.json", GameMaster, {
    spaces: "\t",
    EOL: "\n"
  });
})();
