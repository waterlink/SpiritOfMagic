var componentStorage = {};

function get(name) {
    if (!componentStorage[name])
        componentStorage[name] = [];
    return componentStorage[name];
}

const addComponent = function (name, component) {
    get(name).push(component);
};

var entities = [];

const addEntity = function (entity) {
    entities.push(entity);
    entity.index = entities.length - 1;

    for (var name in entity) {
        if (entity.hasOwnProperty(name)) {
            var component = entity[name];
            component.entityIndex = entity.index;
            addComponent(name, component);
        }
    }
};

const each = function (name, action) {
    get(name).forEach(function (component) {
        action(entities[component.entityIndex]);
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
            if (sprite.sprite.text) {
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
        subElement(stats, "hp").textContent = player.health.points + "/" + player.health.total;
        subElement(stats, "dmg").textContent = player.attack.damage;
        subElement(stats, "hit").textContent = player.attack.accuracy;
        subElement(stats, "crit").textContent = player.attack.critical;
        subElement(stats, "aspd").textContent = player.attack.delay;
        subElement(stats, "def").textContent = player.defense.reduction;
        subElement(stats, "eva").textContent = player.defense.evasion ;
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

const statusBar = document.getElementById("status_bar");
const healthBarSize = 10;

function healthIndicator(health) {
    var i;
    var representation = "";
    var fillLevel = Math.floor(health.points / health.total * healthBarSize);

    for (i = 0; i < fillLevel; i++) representation += "*";
    for (i = fillLevel; i < healthBarSize; i++) representation += "-";

    if (health.points <= 0) representation += " (RIP)";

    return representation;
}

const renderHealthBar = function () {
    each("player", function (player) {
        subElement(statusBar, "health_indicator").textContent = healthIndicator(player.health);
    });
};

const regenHealth = function () {
    each("healthRegen", function (actor) {
        actor.healthRegen.delayLeft -= timePassedMs;

        if (actor.healthRegen.delayLeft <= 0 && !actor.death.dead) {
            affectHealth(actor.health, +1);
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

const autoAttack = function () {
    each("battle", function (actor) {
        if (actor.battle.inBattle) {
            var target = entities[actor.battle.target];
            if (target && actor.attack.delayLeft <= 0) {
                actor.attack.delayLeft = actor.attack.delay;
                addLog(actor.name + " inflicts " + actor.attack.damage + " points of damage to " + target.name);
                affectHealth(target.health, -actor.attack.damage);
                target.battle.lastAttacker = actor.index;
            }
        }
    });
};

const death = function () {
    each("health", function (actor) {
        if (actor.health.points <= 0 && !actor.death.dead) {
            actor.death.dead = true;
            actor.sprite.text = null;

            addEntity({
                corpse: {},
                position: {x: actor.position.x, y: actor.position.y},
                sprite: {text: "~"},
            });

            var lastAttacker = entities[actor.battle.lastAttacker];
            addLog(actor.name + " is killed by " + lastAttacker.name);
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

clearLogs();
initField();

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
        health: {points: 30, total: 50},
        healthRegen: {delay: 2000, delayLeft: 2000},
        attack: {damage: 20, accuracy: 70, critical: 5, delay: 1000, delayLeft: 0},
        defense: {reduction: 5, evasion: 20},
        battle: {inBattle: false},
        death: {dead: false},
    });

    addEntity({
        enemy: {},
        name: "Goblin",
        position: {x: 5, y: 10},
        sprite: {text: "g"},
        health: {points: 50, total: 50},
        healthRegen: {delay: 5000, delayLeft: 5000},
        attack: {damage: 10, accuracy: 90, critical: 5, delay: 3000, delayLeft: 0},
        defense: {reduction: 0, evasion: 10},
        battle: {inBattle: false},
        death: {dead: false},
    });

    addEntity({
        enemy: {},
        name: "Ghoul",
        position: {x: 15, y: 15},
        sprite: {text: "G"},
        health: {points: 300, total: 300},
        healthRegen: {delay: 5000, delayLeft: 500},
        attack: {damage: 15, accuracy: 90, critical: 5, delay: 1000, delayLeft: 0},
        defense: {reduction: 5, evasion: 10},
        battle: {inBattle: false},
        death: {dead: false},
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

startGame();

var timePassedMs = 0;
var previousTime = new Date();

setInterval(function () {
    var nextTime = new Date();
    timePassedMs = nextTime.getTime() - previousTime.getTime();

    renderSprites();
    renderStats();
    renderHealthBar();
    renderPlayerSprite();
    renderBattleIndicator();
    renderBattleTargetStats();
    renderLogs();

    movement();
    regenHealth();
    battleStatus();
    attackDelay();
    autoAttack();
    death();

    saveToLocalStorage();

    previousTime = nextTime;
}, 50);

document.body.onkeyup = function (event) {
    [
        movementKeyUp,
        statsKeyUp,
        newGameKeyUp,
    ].forEach(function (fn) {
        fn(event.keyCode)
    });
};

document.body.onkeydown = function (event) {
    [].forEach(function (fn) {
        fn(event.keyCode)
    });
};