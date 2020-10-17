const protobuf = require("protobufjs");

const Fetch = require("node-fetch");
const Fs = require("fs-extra");

var MasterArray, GameMaster, Form_List, Pokemon_List, Item_List, Quest_Types;

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

function get_evolutions(type, evolutions, id) {
  return new Promise(async resolve => {
    let list = [];
    if (type == "names") {
      if (evolutions) {
        await evolutions.forEach(evolution => {
          if (evolution.evolution || evolution.candyCost) {
            let evolution_branch = {};
            if (evolution.evolution) {
              evolution_branch.evolution = capitalize(evolution.evolution);
              evolution_branch.evolution_id = Pokemon_List[evolution.evolution.toUpperCase()];
            }
            if (evolution.candyCost) {
              evolution_branch.candy_cost = evolution.candyCost;
            }
            if (evolution.evolutionItemRequirement) {
              evolution_branch.evolution_item = capitalize(evolution.evolutionItemRequirement.replace("ITEM_", ""));
              evolution_branch.evolution_item_id = Item_List[evolution.evolutionItemRequirement.replace("ITEM_", "")]
            }
            if (evolution_branch.name) {
              evolution_branch.name = evolution.form.split("_")[1];
              evolution_branch.form_id = Form_List[evolution.form];
            }
            list.push(evolution_branch);
          } else if (evolution.tempEvolution) {
            let evolution_branch = {
              temp_evolution: evolution.tempEvolution,
            };
            if (evolution.firstTempEvolutionCandyCost) {
              evolution_branch.first_candy_cost = evolution.firstTempEvolutionCandyCost;
            }
            if (evolution.subsequentTempEvolutionCandyCost) {
              evolution_branch.subsequent_candy_cost = evolution.subsequentTempEvolutionCandyCost;
            }
            if (evolution.form) {
              evolution_branch.form_id = Form_List[evolution.form];
            }
            list.push(evolution_branch);
          } else {
            list.push(capitalize(evolution));
          }
        });
      }
    } else if (type == "ids") {
      if (evolutions) {
        await evolutions.forEach(evolution => {
          if (evolution) {
            list.push(Pokemon_List[evolution.toUpperCase()]);
          }
        });
      }
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
      GameMaster.moves[id].name = capitalize(MoveArray[n].replace("_FAST", ""));
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

function Generate_Forms(GameMaster, MasterArray) {
  return new Promise(async resolve => {
    for (let o = 0, len = MasterArray.length; o < len; o++) {
      let object = MasterArray[o];
      if (object.templateId.split("_")[1]) {
        let pokemon_id = Number(object.templateId.split("_")[1].slice(1));
        try {
          if (object.data.formSettings) {
            if (!GameMaster.pokemon[pokemon_id]) {
              GameMaster.pokemon[pokemon_id] = {};
            }
            if (!GameMaster.pokemon[pokemon_id].name) {
              GameMaster.pokemon[pokemon_id].name = "";
            }
            if (!GameMaster.pokemon[pokemon_id].default_form) {
              GameMaster.pokemon[pokemon_id].default_form = "";
            }
            if (!GameMaster.pokemon[pokemon_id].forms) {
              GameMaster.pokemon[pokemon_id].forms = {};
            }
            let forms = object.data.formSettings.forms;
            if (forms) {
              GameMaster.pokemon[pokemon_id].forms = {};
              for (let f = 0, flen = forms.length; f < flen; f++) {
                let id = Form_List[object.data.formSettings.forms[f].form];
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
      let pokemon_id = Pokemon_List[data[0]];
      if (!pokemon_id) {
        console.warn('Unknown form', FormArray[f]);
        continue;
      }
      let form_name = capitalize(data[1]);
      let form_id = Form_List[FormArray[f]];

      if (!GameMaster.pokemon[pokemon_id].forms) {
        GameMaster.pokemon[pokemon_id].forms = {}
      }
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

function Compile_Data(GameMaster, MasterArray) {
  return new Promise(async resolve => {
    let oddballs = [
      "V0122_POKEMON_MR_MIME",
      "V0250_POKEMON_HO_OH",
      "V0439_POKEMON_MIME_JR",
      "V0474_POKEMON_PORYGON_Z"
    ];
    for (let o = 0, len = MasterArray.length; o < len; o++) {
      let object = MasterArray[o];
      try {
        if (object.data.pokemon) {
          let pokemon_id = Number(object.templateId.split("_")[0].slice(1));
          if (!GameMaster.pokemon[pokemon_id]) {
            GameMaster.pokemon[pokemon_id] = {};
          }
          let Pokemon = GameMaster.pokemon[pokemon_id];
          let form_id = Form_List[object.templateId.split("_")[2] + "_" + object.templateId.split("_")[3]]
          if (object.templateId.split("_").length == 3 || oddballs.indexOf(object.templateId) >= 0) {
            Pokemon.name = capitalize(object.data.pokemon.uniqueId);
            switch (Pokemon.name) {
              case "Nidoran Female":
                Pokemon.name = "Nidoran♀";
                break;
              case "Nidoran Male":
                Pokemon.name = "Nidoran♂";
                break;
            }
            Pokemon.pokedex_id = pokemon_id;
            Pokemon.default_form_id = Form_List[object.data.pokemon.uniqueId + "_NORMAL"];
            Pokemon.types = [];
            Pokemon.attack = object.data.pokemon.stats.baseAttack;
            Pokemon.defense = object.data.pokemon.stats.baseDefense;
            Pokemon.stamina = object.data.pokemon.stats.baseStamina;
            Pokemon.height = object.data.pokemon.pokedexHeightM;
            Pokemon.weight = object.data.pokemon.pokedexWeightKg
            Pokemon.flee_rate = object.data.pokemon.encounter.baseFleeRate;
            Pokemon.capture_rate = object.data.pokemon.encounter.baseCaptureRate;
            Pokemon.quick_moves = await get_moves(object.data.pokemon.quickMoves);
            Pokemon.charged_moves = await get_moves(object.data.pokemon.cinematicMoves);
            Pokemon.evolutions = await get_evolutions("names", object.data.pokemon.evolution, pokemon_id);
            Pokemon.evolutions_ids = await get_evolutions("ids", object.data.pokemon.evolution, pokemon_id);
            Pokemon.evolution_branch = await get_evolutions("names", object.data.pokemon.evolutionBranch, pokemon_id);
            Pokemon.legendary = object.data.pokemon.pokemonClass == "POKEMON_CLASS_LEGENDARY" ? true : false;
            Pokemon.mythic = object.data.pokemon.pokemonClass == "POKEMON_CLASS_MYTHIC" ? true : false;
            Pokemon.candy_to_evolve = object.data.pokemon.candyToEvolve;
            Pokemon.buddy_group_number = object.data.pokemon.buddyGroupNumber;
            Pokemon.buddy_distance = object.data.pokemon.kmBuddyDistance;
            Pokemon.third_move_stardust = object.data.pokemon.thirdMove.stardustToUnlock;
            Pokemon.third_move_candy = object.data.pokemon.thirdMove.candyToUnlock;
            Pokemon.gym_defender_eligible = object.data.pokemon.isDeployable;
            if (object.data.pokemon.type1) {
              Pokemon.types.push(capitalize(object.data.pokemon.type1.replace("POKEMON_TYPE_", "")));
            }
            if (object.data.pokemon.type2) {
              Pokemon.types.push(capitalize(object.data.pokemon.type2.replace("POKEMON_TYPE_", "")));
            }
          } else if (form_id) {
            if (!Pokemon.forms[form_id]) {
              Pokemon.forms[form_id] = {};
            }
            let Form = Pokemon.forms[form_id];
            // ADD TO POKEMON FORMS
            //Form.name = capitalize(object.data.pokemon.uniqueId);
            if (!Form.name) {
              Form.name = capitalize(object.templateId.split("_")[3]);
            }
            if (object.data.pokemon.evolution) {
              Form.evolved_form = Form_List[object.data.pokemon.evolution[0] + "_" + object.templateId.split("_")[3]];
            }

            switch (true) {
              case object.data.pokemon.stats.baseAttack != Pokemon.attack:
              case object.data.pokemon.stats.baseDefense != Pokemon.defense:
              case object.data.pokemon.stats.baseStamina != Pokemon.stamina:
                Form.attack = object.data.pokemon.stats.baseAttack;
                Form.defense = object.data.pokemon.stats.baseDefense;
                Form.stamina = object.data.pokemon.stats.baseStamina;
            }
            switch (true) {
              case object.data.pokemon.pokedexHeightM != Pokemon.height:
              case object.data.pokemon.pokedexWeightKg != Pokemon.weight:
                Form.height = object.data.pokemon.pokedexHeightM;
                Form.weight = object.data.pokemon.pokedexWeightKg;
            }
            //Form.flee_rate = object.data.pokemon.encounter.baseFleeRate;
            //Form.capture_rate = object.data.pokemon.encounter.baseCaptureRate;
            //Form.quick_moves = await get_moves(object.data.pokemon.quickMoves);
            //Form.charged_moves = await get_moves(object.data.pokemon.cinematicMoves);
            //Form.evolutions = await get_evolutions("names", object.data.pokemon.evolution, pokemon_id);
            //Form.evolutions_ids = await get_evolutions("ids", object.data.pokemon.evolution, pokemon_id);
            //Form.evolution_branch = await get_evolutions("names", object.data.pokemon.evolutionBranch, pokemon_id);
            //Form.legendary = object.data.pokemon.pokemonClass == "POKEMON_CLASS_LEGENDARY" ? true : false;
            //Form.mythic = object.data.pokemon.pokemonClass == "POKEMON_CLASS_MYTHIC" ? true : false;
            //Form.candy_to_evolve = object.data.pokemon.candyToEvolve;
            //Form.buddy_group_number = object.data.pokemon.buddyGroupNumber;
            //Form.buddy_distance = object.data.pokemon.kmBuddyDistance;
            //Form.third_move_stardust = object.data.pokemon.thirdMove.stardustToUnlock;
            //Form.third_move_candy = object.data.pokemon.thirdMove.candyToUnlock;
            //Form.gym_defender_eligible = object.data.pokemon.isDeployable;
            let quick_moves = await get_moves(object.data.pokemon.quickMoves);
            if (quick_moves.toString() != Pokemon.quick_moves.toString()) {
              Form.quick_moves = quick_moves;
            }
            let charged_moves = await get_moves(object.data.pokemon.cinematicMoves);
            if (charged_moves.toString() != Pokemon.charged_moves.toString()) {
              Form.charged_moves = charged_moves;
            }
            let types = [];
            if (object.data.pokemon.type1) {
              types.push(capitalize(object.data.pokemon.type1.replace("POKEMON_TYPE_", "")));
            }
            if (object.data.pokemon.type2) {
              types.push(capitalize(object.data.pokemon.type2.replace("POKEMON_TYPE_", "")));
            }
            if (types.toString() != Pokemon.types.toString()) {
              Form.types = types;
            }
          }
        } else if (object.data.item) {
          let item_name = "";
          object.data.item.uniqueId.split("_").forEach((word) => {
            item_name += " " + capitalize(word);
          });
          let item_id = Item_List[object.data.item.uniqueId];
          if (!GameMaster.items[item_id]) {
            GameMaster.items[item_id] = {}
          }
          GameMaster.items[item_id].name = item_name.slice(1);
          GameMaster.items[item_id].proto = object.data.item.uniqueId;
          GameMaster.items[item_id].type = capitalize(object.data.item.itemType.replace("HOLO_ITEM_TYPE_ITEM_TYPE_", ""));
          GameMaster.items[item_id].category = capitalize(object.data.item.category.replace("HOLO_ITEM_CATEGORY_ITEM_CATEGORY_", ""));
          if (object.data.item.dropTrainerLevel && object.data.item.dropTrainerLevel < 60) {
            GameMaster.items[item_id].min_trainer_level = object.data.item.dropTrainerLevel;
          }
        } else if (object.data.combatMove) {
          let move_id = Move_List[object.data.combatMove.uniqueId];
          if (!GameMaster.moves[move_id]) {
            GameMaster.moves[move_id] = {}
          }
          let Move = GameMaster.moves[move_id];
          if (!Move.name) {
            Move.name = capitalize(object.data.combatMove.uniqueId.replace("_FAST", ""));
          }
          Move.proto = object.templateId;
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
  const protoResponse = await Fetch("https://raw.githubusercontent.com/Furtif/POGOProtos/master/src/POGOProtos/Rpc/Rpc.proto");
  const rpc = protobuf.parse(await protoResponse.text()).root.POGOProtos.Rpc;
  Move_List = rpc.HoloPokemonMove;
  Form_List = rpc.PokemonDisplayProto.Form;
  Pokemon_List = rpc.HoloPokemonId;
  Quest_Types = rpc.QuestType;
  Item_List = rpc.Item;

  let GameMaster = {};

  let MasterArray = await Fetch_Json("https://raw.githubusercontent.com/pokemongo-dev-contrib/pokemongo-game-master/master/versions/latest/V2_GAME_MASTER.json");
  MasterArray = MasterArray.template;

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
