const Vm = function () {
	const self = this;

	self.rows = [];

	function getType(x, y) {
	    let type = "middle";
	    if (y === 0) {
	        type = "top";
	    } else if (y === 9 - 1) {
	        type = "bottom";
	    }
	    if (x === 0) {
	        type += "-left";
	    } else if (x === 9 - 1) {
	        type += "-right";
	    } else {
	        type += "-middle";
	    }
	    return type;
	};

    for (let y = 0; y < 9; y++) {
        let cols = [];
        for (let x = 0; x < 9; x++) {
            let type = getType(x, y);
            cols.push({type: type});
        }
        self.rows.push(cols);
    }

	const today = list[String(new Date().getDate()).slice(-1)];

	for (let i = 0; i < today.hands.length; i++) {
		const hand = today.hands[i];
		self.rows[hand.y][hand.x].type = "";
		self.rows[hand.y][hand.x].filename = "./img2/" + hand.c + ".png";
	}

	self.message = today.msg;
};

const list = [
	{hands:[{c:"b1",x:4,y:4},{c:"w2",x:8,y:0}], msg:"投了するかも"}
	,
	{hands:[{c:"b1",x:8,y:0},{c:"w2",x:0,y:0},{c:"b3",x:8,y:1},{c:"w4",x:0,y:1},{c:"b5",x:8,y:2},{c:"w6",x:0,y:2},{c:"b7",x:8,y:3},{c:"w8",x:0,y:3},{c:"b9",x:8,y:4}], msg:"黒よし"}
	,
	{hands:[{c:"b1",x:3,y:3},{c:"w2",x:4,y:5},{c:"b3",x:5,y:3}], msg:"犬好きかも"}
	,
	{hands:[{c:"b1",x:6,y:2},{c:"w2",x:7,y:1}], msg:"地に辛い棋風かも"}
	,
	{hands:[{c:"b1",x:4,y:4}], msg:"このまま時間切れ勝ちかも"}
	,
	{hands:[{c:"b1",x:4,y:4},{c:"b3",x:2,y:2},{c:"b5",x:6,y:2},{c:"b7",x:6,y:6},{c:"b9",x:2,y:6}], msg:"ずっとパスなのかも"}
	,
	{hands:[{c:"b1",x:4,y:4},{c:"w2",x:4,y:8}], msg:"新定石かも"}
	,
	{hands:[{c:"b1",x:4,y:4},{c:"w2",x:0,y:8}], msg:"穴熊かも"}
	,
	{hands:[{c:"b1",x:8,y:0},{c:"w2",x:7,y:0},{c:"b3",x:8,y:1},{c:"w4",x:7,y:1},{c:"b5",x:8,y:2},{c:"w6",x:7,y:2},{c:"b7",x:8,y:3}], msg:"そろそろ許してくれるかも"}
	,
	{hands:[{c:"b1",x:0,y:0},{c:"w2",x:8,y:8}], msg:"意気投合したかも"}
];

ko.applyBindings(new Vm());
document.getElementById("uranai").style.display = "block";
