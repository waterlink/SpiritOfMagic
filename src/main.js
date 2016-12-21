var componentStorage = {};

const get = function (name) {
    if (!componentStorage[name])
        componentStorage[name] = [];
    return componentStorage[name];
};

const addComponent = function (name, component) {
    get(name).push(component);
    component.componentIndex = get(name).length - 1;
};

var entities = [];

const addComponentToEntity = function (entity, name, component) {
    entity[name] = component;
    component.entityIndex = entity.index;
    addComponent(name, component);
};

const addEntity = function (entity) {
    entities.push(entity);
    entity.index = entities.length - 1;

    for (var name in entity) {
        if (entity.hasOwnProperty(name)) {
            var component = entity[name];
            addComponentToEntity(entity, name, component);
        }
    }

    return entity.index;
};

function removeComponentFromEntity(entity, name) {
    if (entity.hasOwnProperty(name)) {
        var component = entity[name];
        var componentList = get(name);
        componentList[component.componentIndex] = null;
        delete entity[name];
    }
}

const removeEntity = function (entity) {
    var index = entity.index;

    for (var name in entity) {
        //noinspection JSUnfilteredForInLoop
        removeComponentFromEntity(entity, name);
    }

    entities[index] = null;
};

const each = function (name, action) {
    get(name).forEach(function (component) {
        if (component) {
            var entity = entities[component.entityIndex];
            if (entity)
                action(entity);
        }
    });
};

const field = document.getElementById("field");
const rows = [];
const fieldWidth = 21;
const fieldHeight = 17;
const halfWidth = Math.floor(fieldWidth / 2);
const halfHeight = Math.floor(fieldHeight / 2);

const initField = function () {
    for (var i = 0; i < fieldHeight; i++) {
        var row = document.createElement("div");
        row.classList.add("field__row");
        field.appendChild(row);
        rows.push(row);
        row.cells = [];

        for (var j = 0; j < fieldWidth; j++) {
            var cell = document.createElement("div");
            cell.classList.add("field__cell");
            row.appendChild(cell);
            row.cells.push(cell);
        }
    }
};

const renderSprite = function (x, y, sprite) {
    if (x < 0 || x >= fieldWidth || y < 0 || y >= fieldHeight) return;

    rows[y].cells[x].textContent = sprite;
};

const renderSpriteAtOrigin = function (x, y, sprite) {
    renderSprite(x + halfWidth, y + halfHeight, sprite);
};

const clearField = function () {
    for (var i = 0; i < fieldHeight; i++) {
        for (var j = 0; j < fieldWidth; j++) {
            rows[i].cells[j].textContent = "";
        }
    }
};

const renderSprites = function () {
    clearField();

    each("player", function (player) {
        each("sprite", function (sprite) {
            if (sprite.sprite.text && sprite.position) {
                renderSpriteAtOrigin(
                    sprite.position.x - player.position.x,
                    sprite.position.y - player.position.y,
                    sprite.sprite.text
                )
            }
        });
    });
};

const renderPlayerSprite = function () {
    each("player", function (player) {
        if (player.sprite.text) {
            renderSpriteAtOrigin(0, 0, player.sprite.text);
        }
    });
};

const LEFT_ARROW = 37;
const UP_ARROW = 38;
const RIGHT_ARROW = 39;
const DOWN_ARROW = 40;

const moves = {};
moves[LEFT_ARROW] = {dx: -1, dy: 0};
moves[UP_ARROW] = {dx: 0, dy: -1};
moves[RIGHT_ARROW] = {dx: 1, dy: 0};
moves[DOWN_ARROW] = {dx: 0, dy: 1};

const movementKeyUp = function (key) {
    each("player", function (player) {
        if (moves.hasOwnProperty(key) && !player.death.dead) {
            player.willMove.dx = moves[key].dx;
            player.willMove.dy = moves[key].dy;
        }
    });
};

const movement = function () {
    each("willMove", function (actor) {
        actor.position.x += actor.willMove.dx;
        actor.position.y += actor.willMove.dy;
        actor.willMove.dx = 0;
        actor.willMove.dy = 0;
    });
};

const stats = document.getElementById("stats");

const subElement = function (el, name) {
    return el.getElementsByClassName(el.id + "__" + name)[0];
};

const renderStats = function () {
    each("player", function (player) {
        subElement(stats, "str").textContent = player.stats.strength;
        subElement(stats, "agi").textContent = player.stats.agility;
        subElement(stats, "vit").textContent = player.stats.vitality;
        subElement(stats, "dex").textContent = player.stats.dexterity;
        subElement(stats, "free").textContent = player.stats.freePoints;

        subElement(stats, "hp").textContent =
            player.health.points +"/" + player.health.total;
        subElement(stats, "hreg").textContent = player.healthRegen.delay;
        subElement(stats, "dmg").textContent =
            player.attack.damage + "d" + player.attack.dice + "+" + player.attack.bonus;
        subElement(stats, "hit").textContent = player.attack.accuracy;
        subElement(stats, "crit").textContent = player.attack.critical;
        subElement(stats, "aspd").textContent = player.attack.delay;
        subElement(stats, "def").textContent = player.defense.reduction;
        subElement(stats, "eva").textContent = player.defense.evasion;
    });
};

const statsKeyUp = function (key) {
    if (key === "S".charCodeAt(0)) {
        toggleStats();
    }
};

const toggleStats = function () {
    stats.classList.toggle("hide");
};

const equipment = document.getElementById("equipment");

const equipmentKeyUp = function (key) {
    if (key === "E".charCodeAt(0)) {
        toggleEquipment();
    }
};

const toggleEquipment = function () {
    equipment.classList.toggle("hide");
};

const nameOf = function (entity) {
    return entity && entity.name ? entity.name : "---";
};

const renderEquipment = function () {
    each("player", function (player) {
        subElement(equipment, "wield").textContent = nameOf(entities[player.wielding.weapon]);
        subElement(equipment, "shield").textContent = nameOf(entities[player.wearing.shield]);
    });
};

const statusBar = document.getElementById("status_bar");
const healthBarSize = 10;

const healthIndicator = function (health) {
    var i;
    var representation = "";
    var fillLevel = Math.floor(health.points / health.total * healthBarSize);

    for (i = 0; i < fillLevel; i++) representation += "*";
    for (i = fillLevel; i < healthBarSize; i++) representation += "-";

    if (health.points <= 0) representation += " (RIP)";

    return representation;
};

const renderStatusBar = function () {
    each("player", function (player) {
        subElement(statusBar, "health_indicator").textContent = healthIndicator(player.health);
        subElement(statusBar, "level").textContent = player.experience.level;
        subElement(statusBar, "experience").textContent = player.experience.points + "/" + player.experience.total;
    });
};

const regenHealth = function () {
    each("healthRegen", function (actor) {
        var delayMultiplier = actor.battle.inBattle ? 1 : 5;
        actor.healthRegen.delayLeft -= timePassedMs * delayMultiplier;

        if (actor.healthRegen.delayLeft <= 0 && !actor.death.dead) {
            var regenAmount = actor.battle.inBattle ? 1 : 10;
            affectHealth(actor.health, +regenAmount);
            actor.healthRegen.delayLeft = actor.healthRegen.delay;
        }
    });
};

const BATTLE_SPRITE = "\u2694";

const battleStatus = function () {
    each("player", function (player) {
        player.battle.inBattle = false;

        each("enemy", function (enemy) {
            if (player.position.x === enemy.position.x &&
                player.position.y === enemy.position.y &&
                !player.death.dead && !enemy.death.dead) {

                if (player.battle.target !== enemy.index)
                    addLog("Battle between " + player.name + " and " + enemy.name + " begins!");

                player.battle.inBattle = true;
                player.battle.target = enemy.index;

                enemy.battle.inBattle = true;
                enemy.battle.target = player.index;
            } else {
                enemy.battle.inBattle = false;
            }
        });

        if (!player.battle.inBattle) {
            player.battle.target = null;
        }
    });
};

const renderBattleIndicator = function () {
    each("player", function (player) {
        if (player.battle.inBattle) {
            renderSpriteAtOrigin(0, 0, BATTLE_SPRITE);
        }
    });
};

const renderBattleTargetStats = function () {
    each("player", function (player) {
        subElement(statusBar, "target").classList.toggle("hide", !player.battle.inBattle);

        var target = entities[player.battle.target];
        if (target) {
            subElement(statusBar, "target__name").textContent = target.name;
            subElement(statusBar, "target__health").textContent = healthIndicator(target.health);
        }
    });
};

const saveToLocalStorage = function () {
    localStorage.setItem("SpiritOfMagic.componentStorage", JSON.stringify(componentStorage));
    localStorage.setItem("SpiritOfMagic.entities", JSON.stringify(entities));
};

const attackDelay = function () {
    each("attack", function (actor) {
        actor.attack.delayLeft = Math.max(0, actor.attack.delayLeft - timePassedMs);
    });
};

const affectHealth = function (health, change) {
    health.points = Math.max(0, Math.min(health.total, health.points + change));
};

const rollHitDice = function (attack, targetDefense) {
    var roll = Math.random() * (100 + targetDefense.evasion);
    return roll <= attack.accuracy;
};

const rollDamageDice = function (attack) {
    var roll = Math.random() * (attack.dice - 1) + 1;
    return Math.floor(roll * attack.damage) + attack.bonus;
};

const reducedByDefense = function (damage, defense) {
    return Math.max(0, damage - defense.reduction);
};

const autoAttack = function () {
    each("battle", function (actor) {
        if (actor.battle.inBattle) {
            var target = entities[actor.battle.target];
            if (target && actor.attack.delayLeft <= 0) {
                actor.attack.delayLeft = actor.attack.delay;

                if (rollHitDice(actor.attack, target.defense)) {
                    var damage = reducedByDefense(rollDamageDice(actor.attack), target.defense);

                    addLog(actor.name + " inflicts " + damage + " points of damage to " + target.name);
                    affectHealth(target.health, -damage);

                    target.battle.lastDamageInflicter = actor.index;
                } else {
                    addLog(actor.name + " misses " + target.name);
                }
            }
        }
    });
};

const death = function () {
    each("health", function (actor) {
        if (actor.health.points <= 0 && !actor.death.dead) {
            actor.death.dead = true;
            actor.sprite.text = "~";

            addComponentToEntity(actor, "corpse", {decayIn: 10000});

            var lastDamageInflicter = entities[actor.battle.lastDamageInflicter];
            addLog(actor.name + " is killed by " + lastDamageInflicter.name);
        }
    });
};

const corpseDecay = function () {
    generalDecay("corpse");
};

const droppedLootDecay = function () {
    generalDecay("droppedLoot");
};

const generalDecay = function (name) {
    each(name, function (actor) {
        actor[name].decayIn -= timePassedMs;
        if (actor[name].decayIn <= 0) {
            removeEntity(actor);
        }
    });
};

const lootDice = function (possibility) {
    return Math.random() < possibility.probability;
};

const dropLoot = function () {
    each("loot", function (actor) {
        if (actor.death.dead && !actor.loot.dropped) {
            actor.loot.items.forEach(function (possibility) {
                if (lootDice(possibility) && !actor.loot.dropped) {
                    var item = deepCloneEntityPrototype(possibility.item);
                    item.position = {x: actor.position.x, y: actor.position.y};
                    item.droppedLoot = {decayIn: 30000};
                    addEntity(item);
                    actor.loot.dropped = true;
                    addLog("Item " + item.name + " has been dropped - wear/wield with 'W'")
                }
            });
            actor.loot.dropped = true;
        }
    });
};

const logsContainer = document.getElementById("log");

const clearLogs = function () {
    Array(logsContainer.children).forEach(function (element) {
        element.textContent = "";
    });
};

const renderLogs = function () {
    each("log", function (log) {
        log.log.logs.forEach(function (message, index) {
            var element = subElement(logsContainer, index);
            if (element) element.textContent = message;
        });
    });
};

const addLog = function (message) {
    each("log", function (log) {
        log.log.logs.unshift(message);
    });
};

const coreStats = function () {
    each("stats", function (actor) {
        actor.health.total = 10 + actor.stats.vitality * 10;
        actor.healthRegen.delay = 10000 - actor.stats.vitality * 30;
        actor.defense.reduction = actor.stats.vitality;
        actor.defense.evasion = 5 + actor.stats.agility * 2 + actor.stats.dexterity;
        actor.attack.bonus = 1 + actor.stats.strength;
        actor.attack.accuracy = 40 + actor.stats.agility + actor.stats.dexterity * 3;
        actor.attack.critical = 5 + actor.stats.agility * 2 + actor.stats.dexterity;
        actor.attack.delay = 1000 - actor.stats.agility * 10;
    });
};

const levelStats = function () {
    each("experience", function (actor) {
        actor.health.total += 2 * actor.experience.level;
        actor.healthRegen.delay -= 10 * actor.experience.level;
        actor.defense.reduction += Math.floor(actor.experience.level / 2);
        actor.defense.evasion += actor.experience.level;
        actor.attack.bonus += Math.floor(actor.experience.level / 2);
        actor.attack.accuracy += actor.experience.level;
        actor.attack.critical += actor.experience.level;
        actor.attack.delay -= 3 * actor.experience.level;
    });
};

const increaseStat = function (stat) {
    each("player", function (player) {
        if (player.stats.freePoints > 0) {
            player.stats[stat]++;
            player.stats.freePoints--;
        }
    });
};

const weaponStats = function () {
    each("wielding", function (actor) {
        var weapon = entities[actor.wielding.weapon];
        actor.attack.damage = weapon.weapon.damage;
        actor.attack.dice = weapon.weapon.dice;
        actor.attack.bonus += weapon.weapon.bonus;
    });
};

const shieldStats = function () {
    each("wearing", function (actor) {
        if (actor.wearing.shield) {
            var shield = entities[actor.wearing.shield];
            actor.defense.reduction += shield.shield.reduction;
            actor.defense.evasion += shield.shield.evasion;
        }
    });
};

const rewards = function () {
    each("rewards", function (actor) {
        if (actor.death.dead && !actor.rewards.rewarded) {
            var lastDamageInflicter = entities[actor.battle.lastDamageInflicter];
            if (lastDamageInflicter.experience)
                lastDamageInflicter.experience.points += actor.rewards.experience;
            actor.rewards.rewarded = true;
        }
    });
};

const leveling = function () {
    each("experience", function (actor) {
        var experience = actor.experience;
        if (experience.points >= experience.total) {
            experience.points -= experience.total;
            experience.level++;
            experience.total = Math.floor(experience.growth * experience.total);
            actor.stats.freePoints += experience.gainedStatPoints;
        }
    });
};

var byPosition = {};

const optimizeByPosition = function () {
    byPosition = {};

    each("position", function (actor) {
        if (!byPosition[actor.position.x])
            byPosition[actor.position.x] = {};
        byPosition[actor.position.x][actor.position.y] = actor;
    });
};

const getByPosition = function (x, y) {
    if (!byPosition[x]) return null;
    return byPosition[x][y];
};

const obstacles = function () {
    each("willMove", function (actor) {
        if (actor.willMove.dx != 0 || actor.willMove.dy != 0) {
            var nx = actor.position.x + actor.willMove.dx;
            var ny = actor.position.y + actor.willMove.dy;

            var possibleObstacle = getByPosition(nx, ny);
            if (possibleObstacle && possibleObstacle.obstacle) {
                actor.willMove.dx = 0;
                actor.willMove.dy = 0;
            }
        }
    });
};

const spawnDice = function (spawnZone) {
    return Math.random() < spawnZone.probability;
};

const deepCloneEntityPrototype = function (prototype) {
    return JSON.parse(JSON.stringify(prototype));
};

const spawnZones = function () {
    var i, j, x, y;

    each("spawnZone", function (zone) {
        var thingsInZone = 0;
        var spawnZone = zone.spawnZone;

        for (i = 0; i < spawnZone.width; i++) {
            for (j = 0; j < spawnZone.height; j++) {
                x = i + spawnZone.x;
                y = j + spawnZone.y;

                if (getByPosition(x, y)) {
                    thingsInZone++;
                }
            }
        }

        for (i = 0; i < spawnZone.width; i++) {
            for (j = 0; j < spawnZone.height; j++) {
                x = i + spawnZone.x;
                y = j + spawnZone.y;

                if (!getByPosition(x, y) && thingsInZone < spawnZone.max) {
                    if (spawnDice(spawnZone)) {
                        var prototype = deepCloneEntityPrototype(spawnZone.prototype);
                        addEntity(Object.assign({}, prototype, {position: {x: x, y: y}}));
                        thingsInZone++;
                    }
                }
            }
        }
    });
};

const resetStats = function () {
    each("player", function (player) {
        player.stats.freePoints =
            player.stats.strength +
            player.stats.agility +
            player.stats.vitality +
            player.stats.dexterity +
            player.stats.freePoints;

        player.stats.strength = 0;
        player.stats.agility = 0;
        player.stats.vitality = 0;
        player.stats.dexterity = 0;
    });
};

clearLogs();
initField();

const goblinPrototype = function() {
    return {
        enemy: {},
        name: "Goblin",
        position: {},
        sprite: {text: "g"},
        stats: {strength: 1, agility: 1, vitality: 1, dexterity: 1, freePoints: 0},
        health: {points: 50, total: 50},
        healthRegen: {delay: 5000, delayLeft: 5000},
        attack: {damage: 2, dice: 4, bonus: 0, accuracy: 90, critical: 5, delay: 3000, delayLeft: 0},
        defense: {reduction: 0, evasion: 10},
        battle: {inBattle: false},
        death: {dead: false},
        wielding: {
            weapon: addEntity({
                weapon: {damage: 1, dice: 2, bonus: 0},
                name: "Dagger 1d2",
            }),
        },
        wearing: {
            shield: null,
        },
        rewards: {experience: 100, rewarded: false},
        loot: {
            items: [
                {
                    probability: 0.07,
                    item: {
                        weapon: {damage: 2, dice: 4, bonus: 2},
                        name: "Stolen Short Sword 2d4 + 2",
                        sprite: {text: "|"},
                    },
                },
                {
                    probability: 0.05,
                    item: {
                        shield: {reduction: 5, evasion: 3},
                        name: "Small Shield",
                        sprite: {text: "()"},
                    },
                }
            ],
            dropped: false,
        },
    };
};

const goblinShamanPrototype = function() {
    return {
        enemy: {},
        name: "Goblin Shaman",
        position: {},
        sprite: {text: "\\g"},
        stats: {strength: 5, agility: 5, vitality: 5, dexterity: 5, freePoints: 0},
        health: {points: 50, total: 50},
        healthRegen: {delay: 5000, delayLeft: 5000},
        attack: {damage: 2, dice: 4, bonus: 0, accuracy: 90, critical: 5, delay: 3000, delayLeft: 0},
        defense: {reduction: 0, evasion: 10},
        battle: {inBattle: false},
        death: {dead: false},
        wielding: {
            weapon: addEntity({
                weapon: {damage: 3, dice: 4, bonus: 0},
                name: "Shaman Claw",
            }),
        },
        wearing: {
            shield: addEntity({
                shield: {reduction: 3, evasion: 3},
                name: "Arm Shield",
            }),
        },
        rewards: {experience: 2000, rewarded: false},
        loot: {
            items: [
                {
                    probability: 0.03,
                    item: {
                        shield: {reduction: 7, evasion: 7},
                        name: "Arm Spike Shield + 4",
                        sprite: {text: "<("},
                    },
                }
            ],
            dropped: false,
        },
    };
};

//noinspection JSUnusedGlobalSymbols
const corpseDummyPrototype = {
    corpse: {decayIn: 0},
};

const createGoblin = function (position) {
    addEntity(Object.assign({}, goblinPrototype(), {position: position}));
};

const createStoneWall = function (position) {
    addEntity({
        obstacle: {},
        name: "Stone Wall",
        position: position,
        sprite: {text: "#"},
    });
};

const designRoom = function (x, y, fn, rows) {
    for (var j = 0; j < rows.length; j++) {
        var row = rows[j];
        for (var i = 0; i < row.length; i++) {
            if (row[i] === "#") {
                fn({x: x + i, y: y + j});
            }
        }
    }
};

const newGame = function () {
    console.log("There is no saved game. Creating new one");

    clearLogs();
    componentStorage = {};
    entities = [];

    addEntity({
        log: {logs: ["started new game"]},
        name: "Logging Entity",
    });

    addEntity({
        player: {},
        name: "Player",
        position: {x: 10, y: 5},
        willMove: {dx: 0, dy: 0},
        sprite: {text: "@"},
        stats: {strength: 1, agility: 1, vitality: 1, dexterity: 1, freePoints: 3},
        health: {points: 10, total: 50},
        healthRegen: {delay: 2000, delayLeft: 2000},
        attack: {damage: 3, dice: 4, bonus: 0, accuracy: 70, critical: 5, delay: 1000, delayLeft: 0},
        defense: {reduction: 5, evasion: 20},
        battle: {inBattle: false},
        death: {dead: false},
        wielding: {
            weapon: addEntity({
                weapon: {damage: 1, dice: 2, bonus: 0},
                name: "Dagger",
            }),
        },
        wearing: {
            shield: null,
        },
        rewards: {experience: 0, rewarded: false},
        experience: {level: 1, points: 0, total: 100, growth: 1.1, gainedStatPoints: 1},
    });

    createGoblin({x: 5, y: 10});
    createGoblin({x: 7, y: 9});
    createGoblin({x: 9, y: 8});
    createGoblin({x: 11, y: 10});
    createGoblin({x: 5, y: 11});
    createGoblin({x: 8, y: 11});
    createGoblin({x: 11, y: 11});
    createGoblin({x: 6, y: 13});
    createGoblin({x: 8, y: 12});
    createGoblin({x: 10, y: 14});

    addEntity({
        enemy: {},
        name: "Ghoul",
        position: {x: 23, y: 15},
        sprite: {text: "G"},
        stats: {strength: 10, agility: 5, vitality: 20, dexterity: 5, freePoints: 0},
        health: {points: 300, total: 300},
        healthRegen: {delay: 5000, delayLeft: 500},
        attack: {damage: 5, dice: 3, bonus: 2, accuracy: 90, critical: 5, delay: 1000, delayLeft: 0},
        defense: {reduction: 5, evasion: 10},
        battle: {inBattle: false},
        death: {dead: false},
        wielding: {
            weapon: addEntity({
                weapon: {damage: 5, dice: 3, bonus: 5},
                name: "Ghoul's Claw",
            }),
        },
        wearing: {
            shield: addEntity({
                shield: {reduction: 1, evasion: 2},
                name: "Broken Arm Shield",
            }),
        },
        rewards: {experience: 5000, rewarded: false},
    });

    designRoom(4, 7, createStoneWall, [
        "####.####",
        "#.......#",
        "#.......#",
        "#.......#",
        "#.......#",
        "#.......#",
        "#.......#",
        "#.......#",
        "####.####",
    ]);

    addEntity({
        spawnZone: {
            x: 5,
            y: 8,
            width: 7,
            height: 7,
            prototype: goblinPrototype(),
            probability: 0.0001,
            max: 10,
        },
    });

    designRoom(4, 16, createStoneWall, [
        "#.......#######......",
        "#.............#...#.#",
        "#.............#...#.#",
        "#.............#####.#",
        "#...................#",
        "#.............#######",
        "###############",
    ]);

    addEntity({
        spawnZone: {
            x: 5,
            y: 18,
            width: 13,
            height: 5,
            prototype: goblinPrototype(),
            probability: 0.0001,
            max: 20,
        },
    });

    addEntity({
        spawnZone: {
            x: 5,
            y: 18,
            width: 13,
            height: 5,
            prototype: goblinShamanPrototype(),
            probability: 0.0001,
            max: 25,
        },
    });
};

const DELETE_KEY = 46;

const newGameKeyUp = function (key) {
    if (key === DELETE_KEY) {
        newGame();
    }
};

const loadGameOr = function (fn) {
    var rawComponentStorage = localStorage.getItem("SpiritOfMagic.componentStorage");
    var rawEntities = localStorage.getItem("SpiritOfMagic.entities");
    if (rawComponentStorage && rawEntities) {
        componentStorage = JSON.parse(rawComponentStorage);
        entities = JSON.parse(rawEntities);
    } else {
        fn();
    }
};

const startGame = function () {
    loadGameOr(newGame);
};

const wieldKeyUp = function (key) {
    if (key === "W".charCodeAt(0)) {
        each("player", function (actor) {
            var item = getByPosition(actor.position.x, actor.position.y);
            if (item && item.weapon) {
                actor.wielding.weapon = item.index;
                removeComponentFromEntity(item, "position");
                removeComponentFromEntity(item, "droppedLoot");
                addLog(actor.name + " wielding " + item.name);
            }
        });
    }
};

const wearKeyUp = function (key) {
    if (key === "W".charCodeAt(0)) {
        each("player", function (actor) {
            var item = getByPosition(actor.position.x, actor.position.y);
            if (item && item.shield) {
                actor.wearing.shield = item.index;
                removeComponentFromEntity(item, "position");
                removeComponentFromEntity(item, "droppedLoot");
                addLog(actor.name + " wearing " + item.name);
            }
        });
    }
};

startGame();

var timePassedMs = 0;
var previousTime = new Date();

setInterval(function () {
    var nextTime = new Date();
    timePassedMs = nextTime.getTime() - previousTime.getTime();

    renderSprites();
    renderStats();
    renderEquipment();
    renderStatusBar();
    renderPlayerSprite();
    renderBattleIndicator();
    renderBattleTargetStats();
    renderLogs();

    optimizeByPosition();

    coreStats();
    levelStats();
    weaponStats();
    shieldStats();
    obstacles();
    movement();
    regenHealth();
    battleStatus();
    attackDelay();
    autoAttack();
    death();
    dropLoot();
    corpseDecay();
    droppedLootDecay();
    rewards();
    leveling();
    spawnZones();

    saveToLocalStorage();

    previousTime = nextTime;
}, 50);

document.body.onkeyup = function (event) {
    [
        movementKeyUp,
        statsKeyUp,
        equipmentKeyUp,
        newGameKeyUp,
        wieldKeyUp,
        wearKeyUp,
    ].forEach(function (fn) {
        fn(event.keyCode)
    });
};

document.body.onkeydown = function (event) {
    [].forEach(function (fn) {
        fn(event.keyCode)
    });
};

const strPlus = function () {
    increaseStat("strength");
};

const agiPlus = function () {
    increaseStat("agility");
};

const vitPlus = function () {
    increaseStat("vitality");
};

const dexPlus = function () {
    increaseStat("dexterity");
};
