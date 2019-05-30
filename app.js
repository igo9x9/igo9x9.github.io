const Kifu = function (handArray /* [{x:1, y:1}, {x:2, y:3}] */, resultString /* "B+2" */, id) {
    this._hands = handArray;
    this._result = resultString;
    this._stoppedIndex = -1;
    this._currentIndex = -1;
    this.ID = id;
};

Kifu.prototype.trySetNextHand = function (nextHand) {

    this._currentIndex += 1;

    const myHand = this._hands[this._currentIndex];

    if (!myHand) {
        if (this._stoppedIndex === -1) {
            this._stoppedIndex = this._currentIndex - 1;
        }
        return false;
    }

    if (this._stoppedIndex !== -1) { return false; }

    if (myHand.x !== nextHand.x || myHand.y !== nextHand.y) {
        this._stoppedIndex = this._currentIndex - 1;
        return false;
    }

    return true;
};

Kifu.prototype.tryPopHand = function () {

    if (this._currentIndex === -1) { return false; }

    this._currentIndex -= 1;

    if (this._stoppedIndex === -1) { return true; }

    if (this._stoppedIndex === this._currentIndex) {
        this._stoppedIndex = -1;
    }

    return false;
};

Kifu.prototype.hasNextHand = function () {
    if (this._stoppedIndex !== -1) { return false; }
    return !!(this._hands[this._currentIndex + 1])
};

Kifu.prototype.getNextHand = function () {
    return this._hands[this._currentIndex + 1];
};

Kifu.prototype.winColor = function () {
    return this._result[0] == "0" ? "" : this._result[0];
};

Kifu.prototype.result = function () {
    return this._result;
};

Kifu.prototype.isActive = function () {
    return this._stoppedIndex === -1;
};

Kifu.prototype.getComment = function () {
    if (this._stoppedIndex !== -1) { return null; }
    return this._hands[this._currentIndex].comment;
};

// -----------------

const KifuAll = function (kifuList /* Array of Kifu */ ) {
    this.kifuList = kifuList;
};

KifuAll.prototype.trySetNextHand = function (nextHand /* {x:1, y:2} */) {
    let foundKifu = false;
    this.kifuList.forEach(function (kifu) {
        if (kifu.trySetNextHand(nextHand) === true) {
            foundKifu = true;
        }
    });
    return foundKifu;
};

KifuAll.prototype.tryPopHand = function () {
    let foundKifu = false;
    this.kifuList.forEach(function (kifu) {
        if (kifu.tryPopHand() === true) {
            foundKifu = true;
        }
    });
    return foundKifu;
};

KifuAll.prototype.getNextHands = function () {

    let pickedHands = [];

    function pick(hand) {
        for (let i = 0; i < pickedHands.length; i++) {
            if (pickedHands[i].x === hand.x && pickedHands[i].y === hand.y) {
                return pickedHands[i];
            }
        };
        return null;
    }

    let nextHandIndex = 0;

    this.kifuList.forEach(function (kifu) {
        if (!kifu.hasNextHand()) { return null; }
        kifuHand = kifu.getNextHand();
        nextHand = pick(kifuHand);
        if (nextHand) {
            nextHand.winColors.push(kifu.winColor());
            nextHand.kifuIDs.push(kifu.ID);
            return;
        }
        pickedHands.push({
            nextHandIndex: nextHandIndex,
            x: kifuHand.x,
            y: kifuHand.y,
            winColors: [kifu.winColor()],
            kifuIDs: [kifu.ID],
            predication: function (color) {
                let blackWillWin = 0;
                this.winColors.forEach(function (item) {
                    if (item === "B") {
                        blackWillWin += 1;
                    } else if (item === "") {
                        blackWillWin += 0.5;
                    }
                });
                const blackWinPer = Math.floor(blackWillWin / this.winColors.length * 100);
                if (color === "黒") {
                    return blackWinPer;
                } else {
                    return 100 - blackWinPer; 
                }
            }
        });
        nextHandIndex += 1;
    });

    return pickedHands;
};

KifuAll.prototype.getActiveKifuList = function () {
    const ret = [];
    this.kifuList.forEach(function (kifu) {
        if (kifu.isActive()) {
            ret.push(kifu);
        }
    });
    return ret;
};

KifuAll.prototype.getCurrentComment = function () {
    for (let i = 0; i < this.kifuList.length; i++) {
        const comment = this.kifuList[i].getComment();
        if (comment) {
            return comment;
        }
    }
};

// -----------------

const banSize = 9;

const Cell = function (type) {
    this.type = type;
    this.isLive = true;
    this.nextHand = null;
    this.stone = null;
    this.isLastHand = false;
    this.dame = 0;
    this.group = -1;
};

const Page = function () {
    this.rows = [];
    this.nextHands = 0;
    this.comment = null;
}

Page.prototype.init = function () {
    // init cells
    for (let y = 0; y < banSize; y++) {
        let cols = [];
        for (let x = 0; x < banSize; x++) {
            let type = this._getType(x, y);
            cols.push(new Cell(type));
        }
        this.rows.push(cols);
    }
};

Page.prototype._getType = function (x, y) {
    let type = "middle";

    if (y === 0) {
        type = "top";
    } else if (y === banSize - 1) {
        type = "bottom";
    }

    if (x === 0) {
        type += "-left";
    } else if (x === banSize - 1) {
        type += "-right";
    } else {
        type += "-middle";
    }

    return type;
};

Page.prototype.copy = function () {
    const page = new Page();
    page.rows = JSON.parse(JSON.stringify(this.rows));
    page.rows.forEach(function (row) {
        row.forEach(function (cell) {
            cell.nextHand = null;
            cell.isLastHand = false;
            cell.group = -1;
        });
    });
    return page;
};

Page.prototype.putHand = function (hand) {
    const cell = this.rows[hand.y][hand.x];
    cell.stone = hand.color;
    cell.isLastHand = true;
    this._removeDeadStones(hand.color);
    this._countDame();
    this.comment = hand.comment;
};

Page.prototype.setNextHand = function (nextHand) {
    const cell = this.rows[nextHand.y][nextHand.x];
    cell.nextHand = nextHand;
}

Page.prototype._removeDeadStones = function (color) {

        let lastResult = "";

        const targetColor = color === "B" ? "W" : "B";

        for (let y = 0; y < banSize; y++) {
            for (let x = 0; x < banSize; x++) {
                if (this.rows[y][x].stone === targetColor) {
                    this.rows[y][x].isLive = false;
                } else {
                    this.rows[y][x].isLive = true;
                }
            }
        }

        for (;;) {

            for (let y = 0; y < banSize; y++) {

                for (let x = 0; x < banSize; x++) {

                    if (this.rows[y][x].isLive) {
                        continue;
                    }

                    // upper
                    if (y > 0) {
                        cell = this.rows[y-1][x];
                        if (cell.stone != color && cell.isLive) {
                            this.rows[y][x].isLive = true;
                        }
                    }
                    // right
                    if (x < banSize - 1) {
                        cell = this.rows[y][x+1];
                        if (cell.stone != color && cell.isLive) {
                            this.rows[y][x].isLive = true;
                        }
                    }
                    // bottom
                    if (y < banSize - 1) {
                        cell = this.rows[y+1][x];
                        if (cell.stone != color && cell.isLive) {
                            this.rows[y][x].isLive = true;
                        }
                    }
                    // left
                    if (x > 0) {
                        cell = this.rows[y][x-1];
                        if (cell.stone != color && cell.isLive) {
                            this.rows[y][x].isLive = true;
                        }
                    }
                }
            }

            const result = JSON.stringify(this.rows);
            if (result === lastResult) {
                break;
            }
            lastResult = result;

        }

        for (let y = 0; y < banSize; y++) {
            for (let x = 0; x < banSize; x++) {
                if (this.rows[y][x].isLive === false) {
                    this.rows[y][x].stone = null;
                }
            }
        }
};

Page.prototype._countDame = function () {


    function updateGroup(rows, targetCell, nearCell) {
        if (targetCell.stone === nearCell.stone) {
            if (nearCell.group !== -1) {
                if (targetCell.group === -1) {
                    targetCell.group = nearCell.group;
                } else {
                    for (let y = 0; y < banSize; y++) {
                        for (let x = 0; x < banSize; x++) {
                            if (rows[y][x].group === targetCell.group) {
                                rows[y][x].group = nearCell.group;
                            }
                        }
                    }
                }
            }
        }
    }

    // create group
    let nextGroupNo = 0;
    let lastResult = "";

    for (;;) {
        for (let y = 0; y < banSize; y++) {
            for (let x = 0; x < banSize; x++) {
                const cell = this.rows[y][x];
                if (!cell.stone) { continue; }
                // upper
                if (y > 0) {
                    const nearCell = this.rows[y-1][x];
                    updateGroup(this.rows, cell, nearCell);
                }
                // left
                if (x > 0) {
                    const nearCell = this.rows[y][x-1];
                    updateGroup(this.rows, cell, nearCell);
                }
                // right
                if (x < banSize - 1) {
                    const nearCell = this.rows[y][x+1];
                    updateGroup(this.rows, cell, nearCell);
                }
                // bottom
                if (y < banSize - 1) {
                    const nearCell = this.rows[y+1][x];
                    updateGroup(this.rows, cell, nearCell);
                }

                if (this.rows[y][x].group === -1) {
                    this.rows[y][x].group = nextGroupNo;
                    nextGroupNo += 1;
                }
            }
        }
        const result = JSON.stringify(this.rows);
        if (result === lastResult) {
            break;
        }
        lastResult = result;
    }

    // dameList[groupNo] = ["x,y"]
    let dameList = {};

    for (let y = 0; y < banSize; y++) {
        for (let x = 0; x < banSize; x++) {
            const cell = this.rows[y][x];
            if (!cell.stone) { continue; }
            if (!dameList[cell.group]) {
                dameList[cell.group] = [];
            }
            // upper
            if (y > 0) {
                if (!this.rows[y-1][x].stone) {
                    const dame = x + "," + (y - 1);
                    if (dameList[cell.group].indexOf(dame) === -1) {
                        dameList[cell.group].push(dame);
                    }
                }
            }
            // bottom
            if (y < banSize - 1) {
                if (!this.rows[y+1][x].stone) {
                    const dame = x + "," + (y + 1);
                    if (dameList[cell.group].indexOf(dame) === -1) {
                        dameList[cell.group].push(dame);
                    }
                }
            }
            // right
            if (x < banSize - 1) {
                if (!this.rows[y][x+1].stone) {
                    const dame = (x + 1) + "," + y;
                    if (dameList[cell.group].indexOf(dame) === -1) {
                        dameList[cell.group].push(dame);
                    }
                }
            }
            // left
            if (x > 0) {
                if (!this.rows[y][x-1].stone) {
                    const dame = (x - 1) + "," + y;
                    if (dameList[cell.group].indexOf(dame) === -1) {
                        dameList[cell.group].push(dame);
                    }
                }
            }
        }
    }

    // set dame
    for (let y = 0; y < banSize; y++) {
        for (let x = 0; x < banSize; x++) {
            const group = this.rows[y][x].group;
            if (group === -1) { continue; }
            this.rows[y][x].dame = dameList[group].length;
        }
    }
};


// -----------------

const Ban = function () {
    this.pages = [];

    const page = new Page();
    page.init();
    this.pages.push(page);

    this.kifuAll = null;
}

Ban.prototype.putHand = function (x, y) {

    if (!this.kifuAll.trySetNextHand({x: x, y: y})) { return false; };

    const color = this.getCurrentColor();
    const comment = this.kifuAll.getCurrentComment();

    const page = this.pages[this.pages.length - 1].copy();
    page.putHand({x: x, y: y, color: color, comment: comment});

    const nextHands = this.kifuAll.getNextHands();

    nextHands.forEach(function (nextHand) {
        page.setNextHand(nextHand);
    });

    page.nextHands = nextHands;

    this.pages.push(page);

    return true;
};

Ban.prototype.popHand = function () {
    if (!this.kifuAll.tryPopHand()) { return false; };
    this.pages.pop();
    return true;
};

Ban.prototype.getCurrentPage = function () {
    return this.pages[this.pages.length - 1];
};

Ban.prototype.getCurrentColor = function () {
    return (this.pages.length + 1) % 2 == 0 ? "B" : "W";
};

Ban.prototype.getCellsOnlyHasNextHand = function () {
    let cells = [];
    this.getCurrentPage().rows.forEach(function (row) {
        row.forEach(function (cell) {
            if (cell.nextHand) {
                cells.push(cell);
            }
        });
    })
    return cells;
};

Ban.prototype.readSGF = function () {
    const sgfTextList = [];

    document.getElementById("sgf").innerHTML.split("@@@").forEach(function(sgf) {
        sgfTextList.push(sgf);
    });

    const kifuList = [];

    for (var m = 0; m < sgfTextList.length; m++) {

        let hands = [];
        let winner = "?";
        let id = null;

        const parts = sgfTextList[m].replace(/\n|\r\n/g, "").split(";");

        for (var i = 0; i < parts.length; i++) {

            const p = parts[i].split(/\[|\]/);

            if (i === 1) {
                p.forEach(function (val, n) {
                    if (val === "RE") {
                        winner = p[n+1];
                    } else if (val === "GN") {
                        id = p[n+1];
                    } else if (val == "AB" || val == "AW") {
                        if (p[n+1] !== "tt") {
                            const x = p[n+1].toUpperCase().charCodeAt(0) - 65;
                            const y = p[n+1].toUpperCase().charCodeAt(1) - 65;
                            hands.push({x: x, y: y});
                        }
                    }
                });
                continue;
            }

            if (p[0] === "B" || p[0] === "W") {

                if (p[1] === "tt") { break; }

                const x = p[1].toUpperCase().charCodeAt(0) - 65;
                const y = p[1].toUpperCase().charCodeAt(1) - 65;

                if (p.length >= 4 && p[2] === "C") {
                    hands.push({x: x, y: y, comment: p[3]});
                } else {
                    hands.push({x: x, y: y, comment: null});
                }
            }
        }
        kifuList.push(new Kifu(hands, winner, id));
    }

    // varidate

    const stringHandList = [];
    for (let i = 0; i < kifuList.length; i++) {
        let targetHands = JSON.stringify(kifuList[i]._hands);
        targetHands = targetHands.slice(1);
        targetHands = targetHands.slice(0, -1);
        stringHandList.push(targetHands);
    }

    for (let i = 0; i < stringHandList.length; i++) {
        const targetHands = stringHandList[i];
        for (let ii = 0; ii < stringHandList.length; ii++) {
            if (i === ii) { continue; }
            if (stringHandList[ii].indexOf(targetHands) > -1) {
                alert("内部エラー：id=" + kifuList[i].ID + " は、id=" + kifuList[ii].ID + " と同一または id=" + kifuList[ii].ID + " に含まれます");
                return false;
            }
        }
    }

    this.kifuAll = new KifuAll(kifuList);

    return true;
}



function View() {
    const self = this;

    const firstX = 4;
    const firstY = 4;

    const firstMessage = "「進む」で１手ずつ進みます。";

    self.ready = ko.observable(false);
    self.started = ko.observable(false);
    self.kifuAllNum = 0;

    self.cells = [];

    self.showDame = ko.observable(false);

    const history = ko.observableArray();

    let saveData = ko.observable({bookmarks: []});
    self.lastKifuID = ko.observable(null);

    if (localStorage.getItem("kifuSaveData")) {
        saveData(JSON.parse(localStorage.getItem("kifuSaveData")));
    }

    self.addBookmark = function () {
        const newData = saveData();
        newData.bookmarks.push(self.lastKifuID());
        saveData(newData);
        localStorage.setItem("kifuSaveData", JSON.stringify(saveData()));
    };

    self.isBookmarked = ko.computed(function () {
        return saveData().bookmarks.includes(self.lastKifuID());
    });

    self.removeBookmark = function () {
        const id = self.lastKifuID();
        const newData = saveData().bookmarks.filter(function (n) {
            return n !== id;
        });
        saveData({bookmarks: newData});
        localStorage.setItem("kifuSaveData", JSON.stringify(saveData()));
    };

    self.isContainBookmark = function (ids) {
        if (ids.every(function(id) {
            return saveData().bookmarks.includes(id);
        })) { return 2;}
        return ids.some(function(id) {
            return saveData().bookmarks.includes(id);
        }) ? 1 : 0;
    };

    // init cells by null
    for (let y = 0; y < banSize; y++) {
        const cols = [];
        for (let x = 0; x < banSize; x++) {
            cols.push(null);
        }
        self.cells.push(cols);
    }

    const ban = new Ban();

    setTimeout(function () {
        if (!ban.readSGF()) { return; }
        self.kifuAllNum = ban.kifuAll.kifuList.length;
        refleshCells();
        self.ready(true);
        document.getElementsByClassName("app-wrapper")[0].style.display = "block";
        $("#loading").remove();
    }, 0);

    self.message = ko.observable(firstMessage);

    self.nextHands = ko.observableArray();

    self.canFoward = ko.observable(true);
    self.canBackward = ko.observable(false);

    self.nextColor = ko.observable();

    self.comment = ko.observable();

    function refleshCells() {
        const page = ban.getCurrentPage();
        const cells = page.rows;
        for (let y = 0; y < banSize; y++) {
            for (let x = 0; x < banSize; x++) {
                cells[y][x].error = false;
                if (!self.cells[y][x]) {
                    self.cells[y][x] = ko.observable(cells[y][x]);
                } else {
                    if (self.cells[y][x]() !== cells[y][x]) {
                        self.cells[y][x](cells[y][x]);
                    }
                }
            }
        }
        const nextHands = ban.getCellsOnlyHasNextHand();
        self.nextHands(nextHands);

        self.comment(page.comment);

        if (self.started() && nextHands.length !== 1) {
            self.canFoward(false);
        } else {
            self.canFoward(true);
        }

        if (ban.pages.length <= 2) {
            self.canBackward(false);
        } else {
            self.canBackward(true);
        }

        self.nextColor(getNextColor());

    }

    self.currentColor = function () {
        return ban.getCurrentColor();
    };


    self.choise = function (hand) {
        self.message("");
        self.lastKifuID(null);
        if (ban.putHand(hand.nextHand.x, hand.nextHand.y)) {
            refleshCells();
            const nextHands = ban.getCellsOnlyHasNextHand();
            if (nextHands.length > 1) {
                self.message(getNextColor() + "番です。");
            } else if (nextHands.length === 0) {
                const result = ban.kifuAll.getActiveKifuList()[0].result();
                self.message(parseResult(result));
            } else {
                if (ban.kifuAll.getActiveKifuList().length === 1) {
                    self.message("この先分岐はありません。");
                }
            }

            // push history
            history.push({x: hand.nextHand.x, y: hand.nextHand.y, c: ban.pages.length % 2 === 0 ? "B" : "W"});

            // debug
            const te = (ban.pages.length % 2 === 0 ? "B" : "W") + "[" + String.fromCharCode(97 + hand.nextHand.x) + String.fromCharCode(97 + hand.nextHand.y) + "]";
            console.log(ban.kifuAll.getActiveKifuList()[0].ID, te);
        }
    };

    self.quizeMode = ko.observable(true);

    self.quize = function (x, y) {
        if (!self.quizeMode()) { return false; }
        const nextHands = ban.getCellsOnlyHasNextHand();
        if (nextHands.length === 1) {
            if (nextHands[0].nextHand.x === x && nextHands[0].nextHand.y === y) {
                self.foward();
            } else {
                const cell = self.cells[y][x]();
                cell.error = true;
                self.cells[y][x](cell);
            }
        }
        return false;
    };

    self.foward = function () {
        if (!self.started()) {
            self.start();
            return true;
        }
        const nextHands = ban.getCellsOnlyHasNextHand();
        self.lastKifuID(null);
        if (nextHands.length == 1) {
            self.choise(nextHands[0]);
            return true;
        } else if (nextHands.length > 1) {
            return false;
        } else {
            const result = ban.kifuAll.getActiveKifuList()[0].result();
            self.message(parseResult(result));
            return false;
        }
    };

    self.fastFoward = function () {
        if (self.foward()) {
            setTimeout(function () {
                self.fastFoward();
            }, 10);
        }
    };

    self.backward = function () {
        self.message("");
        self.lastKifuID(null);

        if (ban.pages.length <= 2) {
            return;
        }
        if (ban.popHand()) {
            history.pop();
            refleshCells()
            const nextHands = ban.getCellsOnlyHasNextHand();
            if (nextHands.length > 1) {
                self.message(getNextColor() + "番です。");
                return false;
            }
            return true;
        }
        return false;
    };

    self.fastBackward = function () {
        if (self.backward()) {
            setTimeout(function () {
                self.fastBackward();
            }, 0);
        }
    };

    function getNextColor() {
        return ban.pages.length % 2 === 0 ? "白" : "黒";
    }

    function parseResult(result) {

        let message = "";

        if (result === "0") {
            message = "持碁";
        } else {
            const parts = result.split("+");

            message += parts[0] === "B" ? "黒の" : "白の";
            if (parts[1] === "R") {
                message += "中押し勝ち";
            } else if (parts[1] === "T") {
                message += "時間切れ勝ち";
            } else {
                message += " " + parts[1] + " 目勝ち";
            }
        }

        const id = ban.kifuAll.getActiveKifuList()[0].ID;
        message += "<br><small class='text-secondary'>最終棋譜ID : " + id + "</small>";

        self.lastKifuID(id);

        return message;
    }

    self.start = function () {
        self.started(true);
        self.choise({nextHand: {x: firstX, y: firstY}});
    };

    self.sgfString = ko.computed(function () {
        let sgf = "(;FF[1]CA[UTF-8]SZ[9]PB[?]PW[?]KM[7.0]RU[Chinese]";
        history().forEach(function(hand) {
            const x = String.fromCharCode(97 + hand.x);
            const y = String.fromCharCode(97 + hand.y);
            sgf += ";" + hand.c + "[" + x + y + "]";
        });
        return sgf + ")";
    });

    self.copySgfToClipboard = function () {
        if (!confirm("現在までの棋譜（SGF形式）をクリップボードにコピーします。\nよろしいですか？")) {
            return;
        }
        const el = document.createElement("textarea");
        el.value = self.sgfString();
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        alert("クリップボードにコピーしました。");
    };
}

const html = '\
        <!-- ko if:ready -->\
        <div class="app-wrapper shadow-sm" style="display:none">\
\
            <div>\
                <table cellpadding="0" cellspacing="0" border="0" style="margin: auto; border: 5px solid #dcb35d;background-color:#dcb35d;"\
                data-bind="click:function() {!quizeMode() && foward();}">\
                    <tbody>\
                        <!-- ko foreach: cells -->\
                        <tr>\
                            <!-- ko foreach: $data -->\
                                <!-- ko if:stone === "B" -->\
                                    <!-- ko if:!isLastHand -->\
                                        <!-- ko if:$parents[1].showDame -->\
                                            <td style="position: relative">\
                                                <img src="./img/b.png">\
                                                <div style="position:absolute;top:50%;left:50%;transform: translate(-50%,-50%);margin:0;padding:0;">\
                                                    <span data-bind="text:dame,visible:dame !== 1" style="color:#fff"></span>\
                                                    <b data-bind="text:dame,visible:dame === 1" style="color:red"></b>\
                                                </div>\
                                            </td>\
                                        <!-- /ko -->\
                                        <!-- ko if:!$parents[1].showDame() -->\
                                            <td>\
                                                <img src="./img/b.png">\
                                            </td>\
                                        <!-- /ko -->\
                                    <!-- /ko -->\
                                    <!-- ko if:isLastHand -->\
                                        <!-- ko if:$parents[1].showDame -->\
                                            <td style="position: relative">\
                                                <img src="./img/b-last.png">\
                                                <div style="position:absolute;top:50%;left:50%;transform: translate(-50%,-50%);margin:0;padding:0;">\
                                                    <span data-bind="text:dame,visible:dame !== 1" style="color:#fff"></span>\
                                                    <b data-bind="text:dame,visible:dame === 1" style="color:red"></b>\
                                                </div>\
                                            </td>\
                                        <!-- /ko -->\
                                        <!-- ko if:!$parents[1].showDame() -->\
                                            <td>\
                                                <img src="./img/b-last.png">\
                                            </td>\
                                        <!-- /ko -->\
                                    <!-- /ko -->\
                                <!-- /ko -->\
                                <!-- ko if:stone === "W" -->\
                                    <!-- ko if:!isLastHand -->\
                                        <!-- ko if:$parents[1].showDame -->\
                                            <td style="position: relative">\
                                                <img src="./img/w.png">\
                                                <div style="position:absolute;top:50%;left:50%;transform: translate(-50%,-50%);margin:0;padding:0;">\
                                                    <span data-bind="text:dame,visible:dame !== 1" style="color:#000"></span>\
                                                    <b data-bind="text:dame,visible:dame === 1" style="color:red"></b>\
                                                </div>\
                                            </td>\
                                        <!-- /ko -->\
                                        <!-- ko if:!$parents[1].showDame() -->\
                                            <td>\
                                                <img src="./img/w.png">\
                                            </td>\
                                        <!-- /ko -->\
                                    <!-- /ko -->\
                                    <!-- ko if:isLastHand -->\
                                        <!-- ko if:$parents[1].showDame -->\
                                            <td style="position: relative">\
                                                <img src="./img/w-last.png">\
                                                <div style="position:absolute;top:50%;left:50%;transform: translate(-50%,-50%);margin:0;padding:0;">\
                                                    <span data-bind="text:dame,visible:dame !== 1" style="color:#000"></span>\
                                                    <b data-bind="text:dame,visible:dame === 1" style="color:red"></b>\
                                                </div>\
                                            </td>\
                                        <!-- /ko -->\
                                        <!-- ko if:!$parents[1].showDame() -->\
                                            <td>\
                                                <img src="./img/w-last.png">\
                                            </td>\
                                        <!-- /ko -->\
                                    <!-- /ko -->\
                                <!-- /ko -->\
                                <!-- ko if:stone === null -->\
                                    <!-- ko if:(nextHand === null) || ((nextHand !== null) && ($parents[1].nextHands().length <= 1))-->\
                                        <td data-bind="click:$parents[1].quizeMode() && function() {$parents[1].quize($index(), $parentContext.$index())}, clickBubble: false">\
                                        <!-- ko if:type === "top-left" && !error -->\
                                            <img src="./img/top-left.png">\
                                        <!-- /ko -->\
                                        <!-- ko if:type === "top-middle" && !error -->\
                                            <img src="./img/top-middle.png">\
                                        <!-- /ko -->\
                                        <!-- ko if:type === "top-right" && !error -->\
                                            <img src="./img/top-right.png">\
                                        <!-- /ko -->\
                                        <!-- ko if:type === "middle-left" && !error -->\
                                            <img src="./img/middle-left.png">\
                                        <!-- /ko -->\
                                        <!-- ko if:type === "middle-middle" && !error -->\
                                            <img src="./img/middle-middle.png">\
                                        <!-- /ko -->\
                                        <!-- ko if:type === "middle-right" && !error -->\
                                            <img src="./img/middle-right.png">\
                                        <!-- /ko -->\
                                        <!-- ko if:type === "bottom-left" && !error -->\
                                            <img src="./img/bottom-left.png">\
                                        <!-- /ko -->\
                                        <!-- ko if:type === "bottom-middle" && !error -->\
                                            <img src="./img/bottom-middle.png">\
                                        <!-- /ko -->\
                                        <!-- ko if:type === "bottom-right" && !error -->\
                                            <img src="./img/bottom-right.png">\
                                        <!-- /ko -->\
                                        <!-- ko if:error -->\
                                            <img src="./img/ng.png">\
                                        <!-- /ko -->\
                                        </td>\
                                    <!-- /ko -->\
                                    <!-- ko if:(nextHand !== null) && ($parents[1].nextHands().length > 1) -->\
                                        <!-- ko if:$parents[1].currentColor() === "B" -->\
                                            <td style="color:#000;position: relative;cursor:pointer;font-size:0.88rem;" data-bind="click:$parents[1].choise, clickBubble: false">\
                                                <img src="./img/b-next.png">\
                                                <div style="text-align:center;position:absolute;top:50%;left:50%;transform: translate(-50%,-50%);margin:0;padding:0;">\
                                                    <span style="font-weight:500" data-bind="text:nextHand.predication($parents[1].nextColor()),style:{\'font-size\':nextHand.predication($parents[1].nextColor()) >= 100 ? \'0.75rem\' : \'0.88rem\'}"></span><span style="font-size:0.7rem">%</span>\
                                                </div>\
                                                <span style="color:yellow;position:absolute;bottom:-1px;right:0;font-size:0.6rem;line-height:1em;background-color:#dcb35d;" data-bind="text: nextHand.winColors.length"></span>\
                                                <span style="color:yellow;position:absolute;top:1px;right:0;font-size:0.6rem;line-height:1em;background-color:#dcb35d;"\
                                                data-bind="visible: $parents[1].isContainBookmark(nextHand.kifuIDs) === 1"><i class="fas fa-adjust"></i></span>\
                                                <span style="color:yellow;position:absolute;top:1px;right:0;font-size:0.6rem;line-height:1em;background-color:#dcb35d;"\
                                                data-bind="visible: $parents[1].isContainBookmark(nextHand.kifuIDs) === 2"><i class="fas fa-check-circle"></i></span>\
                                            </td>\
                                        <!-- /ko -->\
                                        <!-- ko if:$parents[1].currentColor() === "W" -->\
                                            <td style="color:#fff;position: relative;cursor:pointer;font-size:0.88rem;" data-bind="click:$parents[1].choise, clickBubble: false">\
                                                <img src="./img/w-next.png">\
                                                <div style="text-align:center;position:absolute;top:50%;left:50%;transform: translate(-50%,-50%);margin:0;padding:0;">\
                                                    <span style="font-weight:500" data-bind="text:nextHand.predication($parents[1].nextColor()),style:{\'font-size\':nextHand.predication($parents[1].nextColor()) >= 100 ? \'0.75rem\' : \'0.88rem\'}"></span><span style="font-size:0.7rem">%</span>\
                                                </div>\
                                                <span style="color:yellow;position:absolute;bottom:-1px;right:0;font-size:0.6rem;line-height:1em;background-color:#dcb35d;" data-bind="text: nextHand.winColors.length"></span>\
                                                <span style="color:yellow;position:absolute;top:1px;right:0;font-size:0.6rem;line-height:1em;background-color:#dcb35d;"\
                                                data-bind="visible: $parents[1].isContainBookmark(nextHand.kifuIDs) === 1"><i class="fas fa-adjust"></i></span>\
                                                <span style="color:yellow;position:absolute;top:1px;right:0;font-size:0.6rem;line-height:1em;background-color:#dcb35d;"\
                                                data-bind="visible: $parents[1].isContainBookmark(nextHand.kifuIDs) === 2"><i class="fas fa-check-circle"></i></span>\
                                            </td>\
                                        <!-- /ko -->\
                                    <!-- /ko -->\
                                <!-- /ko -->\
                            <!-- /ko -->\
                        </tr>\
                        <!-- /ko -->\
                    </tbody>\
                </table>\
            </div>\
\
            <div class="buttons-wrapper">\
                <button class="btn" data-bind="click:fastBackward, enable:canBackward, class: canBackward() ? \'btn-secondary\' : \'btn-outline-secondary\'" style="width:60px"><i class="fas fa-angle-double-left"></i></button>\
                <button class="btn" data-bind="click:backward, enable:canBackward, class: canBackward() ? \'btn-secondary\' : \'btn-outline-secondary\'" style="width:60px"><i class="fas fa-angle-left"></i></button>\
                <button class="btn" data-bind="click:foward, enable:canFoward, class: canFoward() ? \'btn-primary\' : \'btn-outline-primary\'" style="width:80px">進む</button>\
                <button class="btn" data-bind="click:fastFoward, enable:canFoward, class: canFoward() ? \'btn-secondary\' : \'btn-outline-secondary\'" style="width:60px"><i class="fas fa-angle-double-right"></i></button>\
            </div>\
\
            <div class="message-wrapper">\
                <div>\
                    <!-- ko if: message -->\
                    <span data-bind="html:message"></span>\
                    <!-- /ko -->\
                    <!-- ko if: lastKifuID -->\
                    <span style="margin-left:3px">\
                        <a href="#" data-bind="visible: !isBookmarked(), click: addBookmark"><i class="far fa-check-circle"></i></a>\
                        <a href="#" data-bind="visible: isBookmarked, click: removeBookmark"><i class="fas fa-check-circle"></i></a>\
                    </span>\
                    <!-- /ko -->\
                    <!-- ko if: comment -->\
                    <div class="text-left text-secondary border border-secondary rounded mt-1 p-1" data-bind="text: comment" style="font-size:0.9rem"></div>\
                    <!-- /ko -->\
                </div>\
            </div>\
\
            <div style="font-size:0.8rem;padding:0 15px 10px 15px;">\
                <span class="text-secondary">全棋譜数<span data-bind="text:kifuAllNum"></span>件</span>\
                <a href="#" style="margin-left:10px" data-bind="visible:!showDame(),click:function(){showDame(true)}">ダメ数表示OFF</a>\
                <a href="#" style="margin-left:10px" data-bind="visible:showDame(),click:function(){showDame(false)}">ダメ数表示ON</a>\
                <a href="#" style="margin-left:10px" data-bind="click:copySgfToClipboard">SGF</a>\
                <a href="#" class="float-right" data-toggle="modal" data-target="#help"><i class="fas fa-question-circle"></i></a>\
            </div>\
\
        </div>\
        <!-- /ko -->\
\
\
<div class="modal fade" id="help" tabindex="-1">\
    <div class="modal-dialog modal-lg">\
        <div class="modal-content">\
            <div class="modal-header">\
                <h5 class="modal-title" id="exampleModalLabel">操作説明</h5>\
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\
                    <span aria-hidden="true">&times;</span>\
                </button>\
            </div>\
            <div class="modal-body">\
                <p>\
                    <strong>パーセンテージの意味</strong>\
                    <br>\
                    　棋譜が枝分かれした時に表示されるパーセンテージの意味は、黒番であれば黒が勝つ確率、白番であれば白が勝つ確率を表します。\
                    なお「勝つ確率」といっても、なにかAI的な高度な形勢判断をしているのではなく、ただ単に棋譜の勝敗数を集計しただけです。\
                    全ての棋譜が最善手を指しているわけではありませんので（というより意図的に変な手も試しているので）、あまり気にしないでください。\
                </p>\
                <p>\
                    <strong>黄色い数値の意味</strong>\
                    <br>\
                    　パーセンテージの右下に小さく表示されている黄色い数値は、その手から続いている棋譜の数を表します。\
                    例えばこの数字が1であるなら、その手の先にはもう分岐が無いのだな、ということが分かります。\
                </p>\
                <p>\
                    <strong>ダメ数の表示</strong>\
                    <br>\
                    　下の方にある「ダメ数表示」をONにすると、石のダメの数（呼吸点の数）を表示します。\
                    攻め合いが複雑になってきた時、視覚的に分かりやすくなります。\
                    アタリの場合には赤字になります。\
                </p>\
                <p>\
                    <strong>棋譜に目印を付ける</strong>\
                    <br>\
                    　それぞれの棋譜に目印を付けておくことができます。\
                    目印を付けると、棋譜が枝分かれした時に右上に <i class="fas fa-check-circle"></i> マークまたは <i class="fas fa-adjust"></i> マークが付きます。\
                    目印を付けるには、棋譜の最終手までたどり着いた時に表示される <i class="far fa-check-circle"></i> マークを押します。\
                </p>\
                <p>\
                    <strong>次の１手を当てるクイズ機能</strong>\
                    <br>\
                    　「進む」ボタンではなく、盤上を押すことでも手を進めることができます。\
                    ただし、次の手を予想してその位置を押さなければ、進むことができません。\
                    次の手を予想するといってもコンピュータが打った手を予想するだけの話であり、それが最善手とは限りません。\
                    ちょっとした暇つぶしとして、割り切って遊んでいただけたらと思います。\
                    この機能が不要な場合は、下を押して無効にすることができます。\
                </p>\
                <p class="text-center">\
                    <a href="#" data-bind="visible:quizeMode,click:function(){quizeMode(false)}">クイズ機能を無効にする</a>\
                    <a href="#" data-bind="visible:!quizeMode(),click:function(){quizeMode(true)}">やっぱり有効にしとく</a>\
                </p>\
                <p>\
                    <strong>棋譜をコピーする</strong>\
                    <br>\
                    　下の方にある「SGF」を押すと、現在の盤上の状態をSFG形式の棋譜データとしてクリップボードにコピーできます。\
                </p>\
            </div>\
			<div class="modal-footer">\
				<button type="button" class="btn btn-light" data-dismiss="modal">閉じる</button>\
			</div>\
        </div>\
    </div>\
</div>\
';

ko.components.register("app", {
    viewModel: View,
    template: html
});

ko.applyBindings();

