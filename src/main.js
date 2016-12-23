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

// TODO: add pool of free components for reuse
const removeComponentFromEntity = function(entity, name) {
    if (entity.hasOwnProperty(name)) {
        var component = entity[name];
        var componentList = get(name);
        componentList[component.componentIndex] = null;
        delete entity[name];
    }
};

// TODO: add pool of free entities for reuse
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

const rollCritMultiplierDice = function (attack) {
    var roll = Math.random() * 100;
    return roll < attack.critical ? 2 : 1;
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
                    var critMultiplier = rollCritMultiplierDice(actor.attack);
                    var rawDamage = critMultiplier * rollDamageDice(actor.attack);
                    var damage = reducedByDefense(rawDamage, target.defense);

                    var critRemark = critMultiplier > 1 ? " (crit x" + critMultiplier + ")" : "";

                    addLog(actor.name + " inflicts " + damage + " points of damage to " + target.name + critRemark);
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
            actor.sprite.originalText = actor.sprite.text;
            actor.sprite.text = "~";

            if (actor.death.canDecay) {
                addComponentToEntity(actor, "corpse", {decayIn: 10000});
            }

            var lastDamageInflicter = entities[actor.battle.lastDamageInflicter];
            addLog(actor.name + " is killed by " + lastDamageInflicter.name);
        }
    });
};

const revival = function () {
    each("revives", function (actor) {
        if (actor.death.dead) {
            actor.revives.revivesIn -= timePassedMs;
            if (actor.revives.revivesIn <= 0) {
                actor.health.points = actor.health.total;
                actor.death.dead = false;
                actor.sprite.text = actor.sprite.originalText;
                actor.revives.revivesIn = actor.revives.reviveDelay;

                each("startPosition", function (start) {
                    var position = start.startPosition;
                    actor.position.x = position.x;
                    actor.position.y = position.y;
                });
            }
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
            if (lastDamageInflicter.experience) {
                lastDamageInflicter.experience.points += actor.rewards.experience;
                addLog(lastDamageInflicter.name + " gained " + actor.rewards.experience + " XP");
            }
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

const dialogElement = document.getElementById("dialog");

const clearDialogOptions = function () {
    for (var i = 0; i < 5; i++) {
        subElement(dialogElement, "option_" + i).textContent = "";
    }
};

const renderDialog = function () {
    dialogElement.classList.add("hide");

    each("dialog", function (entity) {
        var dialog = entity.dialog;
        if (dialog.active) {
            dialogElement.classList.remove("hide");
            subElement(dialogElement, "title").textContent = dialog.title;
            subElement(dialogElement, "text").textContent = dialog.text;

            clearDialogOptions();

            dialog.options.forEach(function (option, index) {
                subElement(dialogElement, "option_" + index).textContent = option.text;
            });
        }
    });
};

const positionalDialogTriggers = function () {
    each("player", function (player) {
        var position = player.position;

        each("dialog", function (entity) {
            var dialog = entity.dialog;
            if (dialog.x === position.x &&
                dialog.y === position.y &&
                dialog.auto && !dialog.activated) {

                addComponentToEntity(entity, "activateDialog", {});
            }
        });
    });
};

const dialogOption = function (index) {
    each("activeDialog", function (entity) {
        var option = entity.dialog.options[index];
        if (!option) return;

        if (option.close || option.nextDialog) {
            removeComponentFromEntity(entity, "activeDialog");
            entity.dialog.active = false;
        }

        if (option.nextDialog) {
            console.log("activating dialog with title: ", option.nextDialog);
            activateDialogWithTitle(option.nextDialog);
        }
    });
};

const activateDialogWithTitle = function (dialogTitle) {
    each("dialog", function (dialog) {
        if (dialog.dialog.title === dialogTitle) {
            addComponentToEntity(dialog, "activateDialog", {});
        }
    });
};

const dialogTriggers = function () {
    each("dialogTrigger", function (entity) {
        var dialogTrigger = entity.dialogTrigger;

        if (dialogTrigger.when === "immediately") {
            activateDialogWithTitle(dialogTrigger.dialogTitle);
        }
    });
};

const levelDialogTriggers = function () {
    each("levelDialogTrigger", function (entity) {
        var dialogTrigger = entity.levelDialogTrigger;

        each("player", function (player) {
            if (player.experience.level === dialogTrigger.atLevel) {
                activateDialogWithTitle(dialogTrigger.dialogTitle);
            }
        });
    });
};

const deathDialogTriggers = function () {
    each("deathDialogTrigger", function (actor) {
        if (actor.death.dead) {
            activateDialogWithTitle(actor.deathDialogTrigger.dialogTitle);
        }
    });
};

const activateDialogs = function () {
    each("activateDialog", function (entity) {
        var dialog = entity.dialog;
        removeComponentFromEntity(entity, "activateDialog");

        if (dialog.once && dialog.activated) return;
        if (dialog.active) return;

        dialog.active = true;
        dialog.activated = true;
        addComponentToEntity(entity, "activeDialog", {});
    });
};

const deactivateDialogs = function () {
    each("deactivateDialog", function (entity) {
        var dialog = entity.dialog;
        removeComponentFromEntity(entity, "deactivateDialog");

        dialog.active = false;
        removeComponentFromEntity(entity, "activeDialog");
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
        death: {dead: false, canDecay: true},
        wielding: {
            weapon: addEntity({
                weapon: {damage: 1, dice: 2, bonus: 0},
                name: "Dagger 1d2",
            }),
        },
        wearing: {
            shield: null,
        },
        rewards: {experience: 75, rewarded: false},
        loot: {
            items: [
                {
                    probability: 0.07,
                    item: {
                        weapon: {damage: 2, dice: 4, bonus: 2},
                        name: "Stolen Short Sword 2d4 + 2",
                        sprite: {text: "|"},
                        dialogTrigger: {
                            when: "immediately",
                            dialogTitle: "Tutorial Sign: Wielding a weapon",
                        },
                    },
                },
                {
                    probability: 0.05,
                    item: {
                        shield: {reduction: 5, evasion: 3},
                        name: "Small Shield",
                        sprite: {text: "()"},
                        dialogTrigger: {
                            when: "immediately",
                            dialogTitle: "Tutorial Sign: Wearing an item",
                        },
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
        death: {dead: false, canDecay: true},
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
        rewards: {experience: 150, rewarded: false},
        loot: {
            items: [
                {
                    probability: 0.03,
                    item: {
                        shield: {reduction: 7, evasion: 7},
                        name: "Arm Spike Shield + 4",
                        sprite: {text: "<("},
                        dialogTrigger: {
                            when: "immediately",
                            dialogTitle: "Tutorial Sign: Wearing an item",
                        },
                    },
                }
            ],
            dropped: false,
        },
    };
};

const ghoulPrototype = function () {
    return {
        enemy: {},
        name: "Ghoul",
        position: {},
        sprite: {text: "{G}"},
        stats: {strength: 10, agility: 10, vitality: 20, dexterity: 10, freePoints: 0},
        health: {points: 300, total: 300},
        healthRegen: {delay: 5000, delayLeft: 500},
        attack: {damage: 5, dice: 3, bonus: 2, accuracy: 90, critical: 5, delay: 1000, delayLeft: 0},
        defense: {reduction: 5, evasion: 10},
        battle: {inBattle: false},
        death: {dead: false, canDecay: true},
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
        rewards: {experience: 2500, rewarded: false},
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
        startPosition: {x: 10, y: 5},
    });

    addEntity({
        dialog: {
            auto: true,
            activated: false,
            x: 10,
            y: 5,
            title: "Tutorial Sign 1",
            text: "Welcome to Spirit of Magic game. To move around, [use arrow keys]. Try to get out of this dungeon!",
            options: [
                {text: "OK. I will move around using [arrow keys]!", close: true},
            ],
        },
    });

    addEntity({
        dialog: {
            auto: true,
            activated: false,
            x: 8,
            y: 7,
            title: "Tutorial Sign 2",
            text: "You see Goblin in front of you. To engage in a fight with an enemy move on the same spot as they are." +
            "Also, don't forget to check out your stats ([press S] to open stats window) - you have unallocated stat points.",
            options: [
                {text: "Tell me more about stats", close: false, nextDialog: "Tutorial Sign 2: Stats"},
                {text: "Got it! Let's go! [step on Goblin's spot]", close: true},
            ],
        },
    });

    addEntity({
        dialog: {
            auto: false,
            activated: false,
            once: false,
            title: "Tutorial Sign 2: Stats",
            text: "There are 4 core stats, that you can allocate free points to: " +
            "[STR] strength - increases your [DMG+] physical damage; " +
            "[AGI] agility - increases your [EVA++] evasion, [ACC+] accuracy, [CRIT++] critical chance, " +
            "and increases your [ASPD+] attack speed (decreases delay between attacks); " +
            "[VIT] vitality - increases your [HP+] total health points, [HREG+] health regeneration rate, " +
            "and [DEF+] damage reduction; " +
            "[DEX] dexterity - increases your [EVA+] evasion, [ACC+++] accuracy, and [CRIT+] critical chance.",
            options: [
                {text: "Awesome! I'm going to allocate my free stats now [press S to open stats window]", close: true},
            ],
        },
    });

    addEntity({
        levelDialogTrigger: {atLevel: 2, dialogTitle: "Tutorial Sign: Leveling up"},
    });

    addEntity({
        dialog: {
            auto: false,
            activated: false,
            once: true,
            title: "Tutorial Sign: Leveling up",
            text: "You have just leveled up. Congratulations! And don't forget to allocate your new free stat points" +
            " [press S to access your stats].",
            options: [
                {text: "Fantastic! I will allocate my free points right away. [press S]", close: true},
            ],
        },
    });

    addEntity({
        dialog: {
            auto: false,
            activated: false,
            once: true,
            title: "Tutorial Sign: Wielding a weapon",
            text: "Look! There is a loot on the floor. This looks like a weapon. Quickly, wield it - it looks stronger " +
            "than that dagger you have! To wield a weapon stand on the same spot with it and [press W]. To see your equipment " +
            "[press E] to open",
            options: [
                {text: "Great! I wonder how great this weapon is. [press W to wield]", close: true},
            ],
        },
    });

    addEntity({
        dialog: {
            auto: false,
            activated: false,
            once: true,
            title: "Tutorial Sign: Wearing an item",
            text: "Look! There is a loot on the floor. This looks like a shield. Quickly, wear it - you don't have any!" +
            "To wear an item stand on the same spot with it and press W.",
            options: [
                {text: "Awesome! I needed that shield. [press W to wear]", close: true},
            ],
        },
    });

    addEntity({
        dialog: {
            auto: false,
            activated: false,
            once: false,
            title: "You have died",
            text: "Don't worry! You will be revived in 10 seconds.",
            options: [
                {text: "OK", close: true},
            ],
        },
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
        death: {dead: false, canDecay: false},
        deathDialogTrigger: {dialogTitle: "You have died"},
        revives: {reviveDelay: 10000, revivesIn: 10000},
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

    designRoom(7, 4, createStoneWall, [
        "#####",
        "#...#",
        "#...#",
    ]);

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

    createGoblin({x: 8, y: 8});

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

    addEntity({
        spawnZone: {
            x: 22,
            y: 12,
            width: 3,
            height: 3,
            prototype: ghoulPrototype(),
            probability: 0.0007,
            max: 1,
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
    renderDialog();
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
    revival();
    dropLoot();
    corpseDecay();
    droppedLootDecay();
    rewards();
    leveling();
    spawnZones();
    positionalDialogTriggers();
    dialogTriggers();
    levelDialogTriggers();
    deathDialogTriggers();
    activateDialogs();
    deactivateDialogs();

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
