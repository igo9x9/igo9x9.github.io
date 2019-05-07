const Kifu = function (handArray /* [{x:1, y:1}, {x:2, y:3}] */, resultString /* "B+2" */) {
    this._hands = handArray;
    this._result = resultString;
    this._stoppedIndex = -1;
    this._currentIndex = -1;
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
    return this._stoppedIndex === -1 || (this._stoppedIndex === this._currentIndex - 1);
}

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
            return;
        }
        pickedHands.push({
            nextHandIndex: nextHandIndex,
            x: kifuHand.x,
            y: kifuHand.y,
            winColors: [kifu.winColor()],
            predication: function () {
                let blackWillWin = 0;
                this.winColors.forEach(function (item) {
                    if (item === "B") {
                        blackWillWin += 1;
                    } else if (item === "") {
                        blackWillWin += 0.5;
                    }
                });
                const blackWinPer = blackWillWin / this.winColors.length;
                if (blackWinPer === 1) { return "黒勝ち"; }
                if (blackWinPer === 0) { return "白勝ち"; }
                if (blackWinPer >= 0.6) { return "黒優勢"; }
                if (blackWinPer <= 0.4) { return "白優勢"; }
                return "互角";
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

KifuAll.prototype.getFirstActiveKifuIndex = function () {
    let index = -1;
    this.kifuList.find(function (kifu, i) {
        if (kifu.isActive()) {
            index = i;
            return true;
        }
        return false;
    });
    return index;
};


// -----------------

const banSize = 9;

const Cell = function (type) {
    this.type = type;
    this.isLive = true;
    this.nextHand = null;
    this.stone = null;
    this.isLastHand = false;
};

const Page = function () {
    this.rows = [];
    this.nextHands = 0;
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
        });
    });
    return page;
};

Page.prototype.putHand = function (hand) {
    const cell = this.rows[hand.y][hand.x];
    cell.stone = hand.color;
    cell.isLastHand = true;
    this._removeDeadStones(hand.color);
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
                    if (y < 8) {
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

    const page = this.pages[this.pages.length - 1].copy();
    page.putHand({x: x, y: y, color: color});

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
        let result = "?";

        const parts = sgfTextList[m].toUpperCase().replace(/\n|\r\n/g, "").split(";");

        for (var i = 0; i < parts.length; i++) {

            const p = parts[i].split(/\[|\]/);

            if (i === 1) {
                p.forEach(function (val, n) {
                    if (val === "RE") {
                        result = p[n+1];
                    } else if (val == "AB" || val == "AW") {
                        if (p[n+1] !== "TT") {
                            const x = p[n+1].charCodeAt(0) - 65;
                            const y = p[n+1].charCodeAt(1) - 65;
                            hands.push({x: x, y: y});
                        }
                    }
                });

            } else if ((p[0] === "B" || p[0] === "W") && p[1] != "") {
                if (p[1] !== "TT") {
                    const x = p[1].charCodeAt(0) - 65;
                    const y = p[1].charCodeAt(1) - 65;
                    hands.push({x: x, y: y});
                } else {
                    hands.push({x: -1, y: -1});
                }
            }
        }
        kifuList.push(new Kifu(hands, result));
    }

    this.kifuAll = new KifuAll(kifuList);
    console.log(kifuList);
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
        ban.readSGF();
        self.kifuAllNum = ban.kifuAll.kifuList.length;
        refleshCells();
        self.ready(true);
        self.start();
        document.getElementsByClassName("app-wrapper")[0].style.display = "block";
        $("#loading").remove();
    }, 0);

    self.message = ko.observable(firstMessage);

    self.nextHands = ko.observableArray();

    self.canFoward = ko.observable(true);
    self.canBackward = ko.observable(false);

    self.nextColor = ko.observable();

    function refleshCells() {
        const page = ban.getCurrentPage();
        const cells = page.rows;
        for (let y = 0; y < banSize; y++) {
            for (let x = 0; x < banSize; x++) {
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
        if (ban.putHand(hand.nextHand.x, hand.nextHand.y)) {
            refleshCells();
            const nextHands = ban.getCellsOnlyHasNextHand();
            if (nextHands.length > 1) {
                self.message(getNextColor() + "番です。");
        } else if (nextHands.length === 0) {
            const result = ban.kifuAll.getActiveKifuList()[0].result();
            self.message(parseResult(result));
            return false;
        }
        }
    };

    self.foward = function () {
        if (!self.started()) {
            self.start();
            return true;
        }
        const nextHands = ban.getCellsOnlyHasNextHand();
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

        if (ban.pages.length <= 2) {
            return;
        }
        if (ban.popHand()) {
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

        let message = result;

        message += "<br><small class='text-secondary'>最終棋譜ID : " + ban.kifuAll.getFirstActiveKifuIndex() + "</small>";

        return message;
    }

    self.start = function () {
        self.started(true);
        self.choise({nextHand: {x: ban.kifuAll.kifuList[0]._hands[0].x, y: ban.kifuAll.kifuList[0]._hands[0].y}});
        self.fastFoward();
    };

}

const html = '\
        <!-- ko if:ready -->\
        <div class="app-wrapper shadow-sm" style="display:none">\
\
            <div>\
                <table cellpadding="0" cellspacing="0" border="0" style="margin: auto; border: 5px solid #dcb35d;background-color:#dcb35d;">\
                    <tbody>\
                        <!-- ko foreach: cells -->\
                        <tr>\
                            <!-- ko foreach: $data -->\
                                <!-- ko if:stone === "B" -->\
                                    <!-- ko if:!isLastHand -->\
                                        <td><img src="./img/b.png"></td>\
                                    <!-- /ko -->\
                                    <!-- ko if:isLastHand -->\
                                        <td><img src="./img/b-last.png"></td>\
                                    <!-- /ko -->\
                                <!-- /ko -->\
                                <!-- ko if:stone === "W" -->\
                                    <!-- ko if:!isLastHand -->\
                                        <td><img src="./img/w.png"></td>\
                                    <!-- /ko -->\
                                    <!-- ko if:isLastHand -->\
                                        <td><img src="./img/w-last.png"></td>\
                                    <!-- /ko -->\
                                <!-- /ko -->\
                                <!-- ko if:stone === null -->\
                                    <!-- ko if:(nextHand === null) || ((nextHand !== null) && ($parents[1].nextHands().length <= 1))-->\
                                        <!-- ko if:type === "top-left" -->\
                                            <td><img src="./img/top-left.png"></td>\
                                        <!-- /ko -->\
                                        <!-- ko if:type === "top-middle" -->\
                                            <td><img src="./img/top-middle.png"></td>\
                                        <!-- /ko -->\
                                        <!-- ko if:type === "top-right" -->\
                                            <td><img src="./img/top-right.png"></td>\
                                        <!-- /ko -->\
                                        <!-- ko if:type === "middle-left" -->\
                                            <td><img src="./img/middle-left.png"></td>\
                                        <!-- /ko -->\
                                        <!-- ko if:type === "middle-middle" -->\
                                            <td><img src="./img/middle-middle.png"></td>\
                                        <!-- /ko -->\
                                        <!-- ko if:type === "middle-right" -->\
                                            <td><img src="./img/middle-right.png"></td>\
                                        <!-- /ko -->\
                                        <!-- ko if:type === "bottom-left" -->\
                                            <td><img src="./img/bottom-left.png"></td>\
                                        <!-- /ko -->\
                                        <!-- ko if:type === "bottom-middle" -->\
                                            <td><img src="./img/bottom-middle.png"></td>\
                                        <!-- /ko -->\
                                        <!-- ko if:type === "bottom-right" -->\
                                            <td><img src="./img/bottom-right.png"></td>\
                                        <!-- /ko -->\
                                    <!-- /ko -->\
                                    <!-- ko if:(nextHand !== null) && ($parents[1].nextHands().length > 1) -->\
                                        <!-- ko if:$parents[1].currentColor() === "B" -->\
                                            <td style="position: relative;">\
                                                <img src="./img/none.png">\
                                                <div style="color:#000;text-shadow: 0px 0px 5px silver;position:absolute;top:50%;left:50%;transform: translate(-50%,-50%);margin:0;padding:0;">\
                                                    <b data-bind="text:String.fromCharCode(nextHand.nextHandIndex + 65)"></b>\
                                                </div>\
                                            </td>\
                                        <!-- /ko -->\
                                        <!-- ko if:$parents[1].currentColor() === "W" -->\
                                            <td style="position: relative;">\
                                                <img src="./img/none.png">\
                                                <div style="color:#fff;position:absolute;top:50%;left:50%;transform: translate(-50%,-50%);margin:0;padding:0;">\
                                                    <b data-bind="text:String.fromCharCode(nextHand.nextHandIndex + 65)"></b>\
                                                </div>\
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
            <div class="message-wrapper">\
                <div data-bind="html:message"></div>\
            </div>\
\
            <!-- ko if:nextHands().length > 1 -->\
            <div class="bunki-wrapper">\
                <!-- ko foreach: nextHands().sort(function(a,b) { return a.nextHand.nextHandIndex - b.nextHand.nextHandIndex }) -->\
                    <button class="btn btn-info text-left" data-bind="click:$parent.choise">\
                        <b data-bind="text:$parent.nextColor() + String.fromCharCode(nextHand.nextHandIndex + 65)"></b>\
                    </button>\
                <!-- /ko -->\
            </div>\
            <!-- /ko -->\
\
            <div class="buttons-wrapper">\
                <button class="btn" data-bind="click:fastBackward, enable:canBackward, class: canBackward() ? \'btn-secondary\' : \'btn-outline-secondary\'" style="width:60px"><<</button>\
                <button class="btn" data-bind="click:backward, enable:canBackward, class: canBackward() ? \'btn-secondary\' : \'btn-outline-secondary\'" style="width:60px"><</button>\
                <button class="btn" data-bind="click:foward, enable:canFoward, class: canFoward() ? \'btn-primary btn-lg\' : \'btn-outline-primary\'" style="width:80px">進む</button>\
                <button class="btn" data-bind="click:fastFoward, enable:canFoward, class: canFoward() ? \'btn-secondary\' : \'btn-outline-secondary\'" style="width:60px">>></button>\
            </div>\
\
            <div style="font-size:0.8rem;padding:0 15px 10px 15px;">\
                <span class="text-secondary">全棋譜数：<span data-bind="text:kifuAllNum"></span>件</span>\
                <a href="#" class="float-right" data-toggle="modal" data-target="#help">ヘルプ</a>\
            </div>\
\
        </div>\
        <!-- /ko -->\
\
\
<div class="modal" id="help" tabindex="-1">\
    <div class="modal-dialog">\
        <div class="modal-content">\
            <div class="modal-header">\
                <h5 class="modal-title" id="exampleModalLabel">ヘルプ</h5>\
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\
                    <span aria-hidden="true">&times;</span>\
                </button>\
            </div>\
            <div class="modal-body">\
                <p>登録している棋譜のほとんどは、コンピュータ同士を中国ルール（コミ7目）で対戦させたものです。</p>\
                <p>棋譜が分岐した時に表示される優劣を表すコメントの意味は下記の通り、形勢判断によるものではなく、単に登録している棋譜がたまたまそういう結果になった、という点にご注意ください。</p>\
                <dl>\
                    <dt>黒勝ち or 白勝ち</dt>\
                    <dd>その手から続く棋譜の結果が、全て黒の勝ち、または白の勝ちであることを表します。</dd>\
                    <dt>黒優勢 or 白優勢</dt>\
                    <dd>その手から続く棋譜の結果が黒勝利と白勝利のどちらもある場合、どちらの色の勝率が高いかを表します。</dd>\
                    <dt>互角</dt>\
                    <dd>勝率の差が小さいか、持碁であることを表します。</dd>\
                </dl>\
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

