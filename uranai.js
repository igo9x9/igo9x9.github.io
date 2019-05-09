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
	{hands:[{c:"b1",x:8,y:0},{c:"w2",x:0,y:0},{c:"b3",x:8,y:1},{c:"w4",x:0,y:1},{c:"b5",x:8,y:2},{c:"w6",x:0,y:2},{c:"b7",x:8,y:3},{c:"w8",x:0,y:3}], msg:"この調子なら勝てるかも"}
	,
	{hands:[{c:"b1",x:3,y:3},{c:"w2",x:4,y:5},{c:"b3",x:5,y:3}], msg:"犬好きかも"}
	,
	{hands:[{c:"b1",x:6,y:2},{c:"w2",x:7,y:1}], msg:"隅っこが好きなのかも"}
	,
	{hands:[{c:"b1",x:4,y:4},{c:"w2",x:4,y:5}], msg:"仲良くしたいのかも"}
	,
	{hands:[{c:"b1",x:4,y:4},{c:"w2",x:3,y:5},{c:"b3",x:4,y:5},{c:"w4",x:5,y:4}], msg:"おもてなしかも"}
	,
	{hands:[{c:"b1",x:4,y:4},{c:"w2",x:4,y:8}], msg:"初めて見る定石かも"}
	,
	{hands:[{c:"b1",x:5,y:3},{c:"w2",x:3,y:5},{c:"b3",x:5,y:5},{c:"w4",x:3,y:3},{c:"b5",x:3,y:2},{c:"w6",x:5,y:6}], msg:"リスペクトされてるのかも"}
	,
	{hands:[{c:"b1",x:4,y:4},{c:"w2",x:8,y:8}], msg:"人見知りなだけかも"}
	,
	{hands:[{c:"b1",x:8,y:0},{c:"w2",x:7,y:0},{c:"b3",x:8,y:1},{c:"w4",x:7,y:1},{c:"b5",x:8,y:2},{c:"w6",x:7,y:2}], msg:"行きたい方向が一緒なのかも"}
	,
	{hands:[{c:"b1",x:0,y:0},{c:"w2",x:8,y:8}], msg:"いいひとなのかも"}
];

ko.applyBindings(new Vm());
document.getElementById("uranai").style.display = "block";
