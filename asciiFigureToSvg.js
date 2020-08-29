/*! Ascii Figure To SVG v1.0.5 | (c) 2020 Masakazu Yanai | https://crocro.com/ | https://twitter.com/ruten | Released under the MIT License */

'use strict';

let mod = {};
try {
	module.exports = mod;
} catch(e) {
	try {
		window.asciiFigureToSvg = mod;
	} catch(e) {
		throw(e);
	}
}

//------------------------------------------------------------
mod.version = '1.0.5';

// デフォルト値
mod.default = {
	txt: String.raw`
       ^＾     ^  ^  ^    +------+------+----------------+
    ^＾|｜      \ | /     | 名前 | 年齢 | 出身地         |
  +-+＋+＋-+     \|/      +------+------+----------------+
  |a|bcＤＥ|   <--+-->    | 太郎 | 16歳 | 福岡県北九州市 |
 <+ |fghi  +->   /|\      +------+------+----------------+
<-+-+------+>   / | \     
  |あいうえ|   v  v  v    vector /^aaa$/ |a| 1+1
  +-+＋+＋-+   -+   +->   
    |｜vｖ       \  |     +--+  +--+  +--+  +--+  +--+  +--+
    vｖ           +-+     |  +--+  +--+  +--+  +--+  +--+  |
  +----+    +---+         |                                |
 /あいう\  / abc \  +     |  castle <-------+              |
+えおかき+ \ def / / \    |                 +-------> お城 |
 \くけこ/   +---+  \ /    |                                |
  +----+            +     +--------------------------------+
  
  ＾  --＋    ＋    ＋--  ＾
    ＼    ＼／  ＼／    ／  
      ＼  ／＼｜／＼  ／    
        ＋  --＋--  ＋      
      ／  ＼  ｜  ／  ＼    
    ｖ      ｖ  ｖ      ｖ  
/*@({"y": [1, 1], "x": [17, 3], "isFig": false, "txtAttr": {"fill": "#f00"}})@*/
/*@({"y": [1, 1], "x": [39, 3], "isFig": false, "txtAttr": {"fill": "#f00"}})@*/
/*@({"y": [0, 3], "x": [15, 7], "figAttr": {"fill": "#00f", "stroke": "#00f"}})@*/
/*@({"y": [0, 3], "x": [37, 7], "figAttr": {"fill": "#0f0", "stroke": "#0f0"}})@*/
               +-----+               +-----+
インクリメント | i++ |  デクリメント | i-- |
               +-----+               +-----+
`.replace(/^\n|\n$/g, ''),
	opt: {
		prms: {
			unitW: 8,		// 半角文字1マスの横幅
			unitH: 20,		// 文字1マスの高さ
			lineW: 2		// 線の太さ
		},
		txtAttr: {			// テキスト部分のSVGの属性
			'font-family': 'Meiryo, sans-serif',
			'font-weight': 'normal',
			'font-size':   '16px',
			'fill':        '#000',
			'dominant-baseline': 'central',
			'text-anchor': 'middle',
			cond: {			// 条件分岐で属性を設定
				han: {
					'font-family': "MS Gothic, monospace",
				},
				zen: {
				}
			}
		},
		figAttr: {			// 作図部分のSVGの属性
			'fill':   '#000',
			'stroke': '#000',
			'stroke-width': '0.1px'
		}
	}
};

//------------------------------------------------------------
// 半角か確認
mod.isHan = function(c) {
	const code = c.charCodeAt(0);
	let res = false;
	if ((code >= 0x00 && code < 0x81)
	 ||	(code === 0xf8f0)
	 ||	(code >= 0xff61 && code < 0xffa0)
	 ||	(code >= 0xf8f1 && code < 0xf8f4)
	) {
		res = true;
	}
	return res;
};

//------------------------------------------------------------
// SVGの作成
mod.genSvg = function(txt, opt) {
	// 文字を調整
	txt = txt.replace(/\r/g, '').replace(/^\uFEFF/, '');

	// 元文字列の計算
	const rawObj = {txt: txt, yMax: txt.split('\n').length};
	rawObj.xMax = Math.max.apply(null, txt.split('\n').map(y => {
		if (y === '') { return 0 }
		return y.split('').map(x => mod.isHan(x) ? 1 : 2).reduce((a, b) => a + b);
	}));

	// 制御領域の分離
	let lnCnt = 0;
	const controlArr = [];	// 制御配列
	txt = txt.replace(/\/\*@\(([\s\S]*?)\)@\*\/(?:\n|$)|\n/g, (s, s1) => {
		if (s === '\n') {
			// 改行
			lnCnt ++;
			return s;
		} else {
			// 制御領域
			try {
				const obj = JSON.parse(s1);
				obj.y[0] += lnCnt;
				if (obj.y[1] === undefined) { obj.y[1] = 1 }
				if (obj.x[1] === undefined) { obj.x[1] = 1 }
				controlArr.push(obj);
			} catch(e) {
				console.log(s1, e);
			}
			return '';
		}
	});
	//console.log(controlArr);
	//console.log(txt);

	// 文字を分解
	const cMrk = "+-|<>^v＋｜＾ｖ／＼/\\";	// 記号候補の文字
	let xMax = 0;
	const cArrArr = txt.split('\n').map(x => {
		const cArr = [];
		x.split('').forEach(c => {
			// 変数の初期化
			const isHan = mod.isHan(c);
			const isFig = cMrk.indexOf(c) >= 0;
			c = c.replace(/　/, ' ');

			// 文字の格納
			cArr.push({c: c, isHan: isHan, isFig: isFig, isFake: false});
			if (! isHan) {
				// ダミーのマス
				cArr.push({c: c, isHan: true, isFig: false, isFake: true});
			}
		});
		xMax = Math.max(xMax, cArr.length);
		return cArr;
	});
	const yMax = cArrArr.length;

	// 文字列のデフォルト値
	if (!txt) { txt = mod.default.txt }

	// 設定変数のデフォルト値
	if (opt === undefined) { opt = {} }
	Object.entries(mod.default.opt).forEach(([k1, v1]) => {
		if (opt[k1] === undefined) { opt[k1] = {} }
		Object.entries(v1).forEach(([k2, v2]) => {
			if (opt[k1][k2] === undefined) { opt[k1][k2] = v2 }
		});
	});
	//console.log(opt);

	// 設定変数の初期化
	const uW  = opt.prms.unitW;		// 単位サイズ横幅
	const uH  = opt.prms.unitH;		// 単位サイズ高さ
	const lnW = opt.prms.lineW;		// 線の幅
	//console.log('uW', uW, 'uH', uH, 'lnW', lnW, );

	// 変数の初期化
	const pthPrms = {'': {txt: '', attr: {}}};	// パス図形用
	const xOfst = 0;
	const yOfst = 0;
	const grp = [];

	// 各文字の処理
	for (let y = 0; y < cArrArr.length; y ++) {
		const cArr = cArrArr[y];
		for (let x = 0; x < cArr.length; x ++) {
			// 変数の初期化
			const c = cArr[x];
			if (c.isFake)    {continue}	// 空マスなので飛ばす
			if (c.c === ' ') {continue}	// 空マスなので飛ばす

			// 属性の取り出しと条件分岐
			let figAttrThis = {};
			let txtAttrThis = Object.assign({}, opt.txtAttr);
			const cond = opt.txtAttr.cond;
			delete txtAttrThis.cond

			if (c.isHan && cond.han) {
				txtAttrThis = Object.assign(txtAttrThis, cond.han);
			} else if (cond.zen) {
				txtAttrThis = Object.assign(txtAttrThis, cond.zen);
			}

			// 制御配列
			controlArr.forEach(cn => {
				// 範囲の判定
				if (y < cn.y[0]) { return }
				if (x < cn.x[0]) { return }
				if (cn.y[0] + cn.y[1] <= y) { return }
				if (cn.x[0] + cn.x[1] <= x) { return }

				// 設定の反映
				if (cn.isFig !== undefined) {
					c.isFig = cn.isFig;
				}
				if (cn.txtAttr !== undefined) {
					txtAttrThis = Object.assign(txtAttrThis, cn.txtAttr);
				}
				if (cn.figAttr !== undefined) {
					figAttrThis = Object.assign(figAttrThis, cn.figAttr);
				}
			});

			// 記号の場合
			if (c.isFig) {
				// 記号候補
				const res = mod.genPth(cArrArr, c,x,y, uW,uH,lnW, xOfst,yOfst);
				if (res.isFig) {
					if (Object.keys(figAttrThis).length === 0) {
						pthPrms[''].txt += res.pth;
					} else {
						const json = JSON.stringify(figAttrThis);
						if (pthPrms[json] === undefined) {
							pthPrms[json] = {txt: '', attr: figAttrThis};
						}
						pthPrms[json].txt += res.pth;
					}
					continue;
				}
			}

			// 記号でないと判断
			const posX = xOfst + (c.isHan ? (x + 0.5) * uW : (x + 1) * uW);
			const posY = yOfst + (y + 0.5) * uH;

			// タグの作成
			const o = Object.assign({x: posX, y: posY}, txtAttrThis);
			const attr = Object.keys(o).map(key => `${key}="${o[key]}"`).join(' ');
			const c2 = c.c
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
			const el = `<text ${attr}>${c2}</text>`;
			grp.push(el);
		}
	}

	// パス図形
	Object.keys(pthPrms).forEach(x => {
		const prms = pthPrms[x];
		let attr = opt.figAttr;
	 	attr = Object.assign({}, attr, prms.attr);
		const attrTxt = Object.keys(attr).map(k => `${k}="${attr[k]}"`).join(' ');
		const el = `<path d="${prms.txt}" ${attrTxt} />`;
		grp.push(el);
	});

	// SVG作成
	const svgIn = grp.map(x => `\t${x}`).join('\n');
	const svgW = xMax * uW;
	const svgH = yMax * uH;
	const svgTxt = `<?xml version="1.0"?>
<svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}"
    xmlns="http://www.w3.org/2000/svg" version="1.1">
${svgIn}
</svg>`;

	// 戻り値の作成
	const res = {
		svg: svgTxt,	// SVGのテキスト
		elArr: grp,		// SVGの各要素の配列
		xMax: xMax,		// 半角換算文字数の横幅最大値
		yMax: yMax,		// 行数
		svgW: svgW,		// SVGの横幅
		svgH: svgH,		// SVGの高さ
		rawTxt:  rawObj.txt,	// 生文字列
		rawXMax: rawObj.xMax,	// 生文字列の半角換算横幅最大値
		rawYMax: rawObj.xMax,	// 生文字列の行数
		opt: opt		// デフォルト値と合成した設定
	};
	return res;
};

//------------------------------------------------------------
// 文字図形パスの作成
mod.genPth = function(cArrArr, c, x, y, uW, uH, lnW, xOfst, yOfst) {
	// 変数の初期化
	const res = {isFig: false, pth: ''};		// 戻り値用変数

	// 4x3マス分の配列を作成
	const blnk = {c: ' ', isHan: true, isFig: false, isFake: true};
	const arnd = {'-1': {}, '0': {}, '1': {}};	// [y][x]
	arnd[-1][-1] = cArrArr[y - 1] ? cArrArr[y - 1][x - 1] : blnk;
	arnd[-1][ 0] = cArrArr[y - 1] ? cArrArr[y - 1][x    ] : blnk;
	arnd[-1][ 1] = cArrArr[y - 1] ? cArrArr[y - 1][x + 1] : blnk;
	arnd[-1][ 2] = cArrArr[y - 1] ? cArrArr[y - 1][x + 2] : blnk;
	arnd[ 0][-1] = cArrArr[y    ] ? cArrArr[y    ][x - 1] : blnk;
	arnd[ 0][ 0] = cArrArr[y    ] ? cArrArr[y    ][x    ] : blnk;
	arnd[ 0][ 1] = cArrArr[y    ] ? cArrArr[y    ][x + 1] : blnk;
	arnd[ 0][ 2] = cArrArr[y    ] ? cArrArr[y    ][x + 2] : blnk;
	arnd[ 1][-1] = cArrArr[y + 1] ? cArrArr[y + 1][x - 1] : blnk;
	arnd[ 1][ 0] = cArrArr[y + 1] ? cArrArr[y + 1][x    ] : blnk;
	arnd[ 1][ 1] = cArrArr[y + 1] ? cArrArr[y + 1][x + 1] : blnk;
	arnd[ 1][ 2] = cArrArr[y + 1] ? cArrArr[y + 1][x + 2] : blnk;

	(function() {
		for (const y in arnd) {
			for (const x in arnd[y]) {
				arnd[y][x] = arnd[y][x] ? arnd[y][x] : blnk;
			}
		}
	})();

	// 変数の初期化
	let xA  = [], yA  = [],		// xArr, yArr
		xA2 = [], yA2 = [];
	const doOfst = function(xArr, yArr) {
		xArr = xArr.map(n => n + xOfst);
		yArr = yArr.map(n => n + yOfst);
	};

	//------------------------------------------------------------
	// 罫線
	if (c.c === '-') {
		res.isFig = "-+＋<>.'".indexOf(arnd[0][-1].c) >= 0
				 || "-+＋<>.'".indexOf(arnd[0][ 1].c) >= 0;
		if (! res.isFig) {return res}

		// 横棒
		xA[0] = x * uW;			yA[0] = y * uH + (uH - lnW) / 2;
		xA[1] = x * uW + uW;	yA[1] = y * uH + (uH + lnW) / 2;
		doOfst(xA, yA);
		res.pth = `M${xA[0]},${yA[0]} L${xA[0]},${yA[1]} `
			+ `L${xA[1]},${yA[1]} L${xA[1]},${yA[0]} Z `;
	}
	if (c.c === '|') {
		res.isFig = "|+^".indexOf(arnd[-1][0].c) >= 0
				 || "|+v".indexOf(arnd[ 1][0].c) >= 0;
		if (! res.isFig) {return res}

		// 縦棒
		xA[0] = x * uW + (uW - lnW) / 2;	yA[0] = y * uH;
		xA[1] = x * uW + (uW + lnW) / 2;	yA[1] = y * uH + uH;
		doOfst(xA, yA);
		res.pth = `M${xA[0]},${yA[0]} L${xA[0]},${yA[1]} `
			+ `L${xA[1]},${yA[1]} L${xA[1]},${yA[0]} Z `;
	}
	if (c.c === '+') {
		let t = "|+^".indexOf(arnd[-1][0].c) >= 0;
		let b = "|+v".indexOf(arnd[ 1][0].c) >= 0;
		let l = "-+＋<>.'".indexOf(arnd[0][-1].c) >= 0;
		let r = "-+＋<>.'".indexOf(arnd[0][ 1].c) >= 0;

		let tl = "\\".indexOf(arnd[-1][-1].c) >= 0;
		let tr = "/".indexOf(arnd[-1][1].c) >= 0;
		let bl = "/".indexOf(arnd[1][-1].c) >= 0;
		let br = "\\".indexOf(arnd[1][1].c) >= 0;

		res.isFig = t || b || l || r || tl || tr || bl || br;
		if (! res.isFig) {return res}

		// 中心
		if (tl || tr || bl || br) {
			xA[0] = x * uW + uW / 2;			yA[0] = y * uH + (uH - lnW) / 2;
			xA[1] = x * uW + (uW - lnW) / 2;	yA[1] = y * uH + uH / 2;
			xA[2] = x * uW + uW / 2;			yA[2] = y * uH + (uH + lnW) / 2;
			xA[3] = x * uW + (uW + lnW) / 2;	yA[3] = y * uH + uH / 2;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} `
				+ `L${xA[2]},${yA[2]} L${xA[3]},${yA[3]} Z `;
		} else {
			xA[0] = x * uW + (uW - lnW) / 2;	yA[0] = y * uH + (uH - lnW) / 2;
			xA[1] = x * uW + (uW + lnW) / 2;	yA[1] = y * uH + (uH + lnW) / 2;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[0]},${yA[1]} `
				+ `L${xA[1]},${yA[1]} L${xA[1]},${yA[0]} Z `;
		}

		// 上
		if (t) {
			xA[0] = x * uW + (uW - lnW) / 2;	yA[0] = y * uH;
			xA[1] = x * uW + (uW + lnW) / 2;	yA[1] = y * uH + uH / 2;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[0]},${yA[1]} `
				+ `L${xA[1]},${yA[1]} L${xA[1]},${yA[0]} Z `;
		}
		// 下
		if (b) {
			xA[0] = x * uW + (uW - lnW) / 2;	yA[0] = y * uH + uH / 2;
			xA[1] = x * uW + (uW + lnW) / 2;	yA[1] = y * uH + uH;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[0]},${yA[1]} `
				+ `L${xA[1]},${yA[1]} L${xA[1]},${yA[0]} Z `;
		}
		// 左
		if (l) {
			xA[0] = x * uW;				yA[0] = y * uH + (uH - lnW) / 2;
			xA[1] = x * uW + uW / 2;	yA[1] = y * uH + (uH + lnW) / 2;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[0]},${yA[1]} `
				+ `L${xA[1]},${yA[1]} L${xA[1]},${yA[0]} Z `;
		}
		// 右
		if (r) {
			xA[0] = x * uW + uW / 2;	yA[0] = y * uH + (uH - lnW) / 2;
			xA[1] = x * uW + uW;		yA[1] = y * uH + (uH + lnW) / 2;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[0]},${yA[1]} `
				+ `L${xA[1]},${yA[1]} L${xA[1]},${yA[0]} Z `;
		}

		// 上左
		if (tl) {
			xA[0] = x * uW - lnW / 2;			yA[0] = y * uH;
			xA[1] = x * uW + (uW - lnW) / 2;	yA[1] = y * uH + uH / 2;
			xA[2] = x * uW + (uW + lnW) / 2;	yA[2] = y * uH + uH / 2;
			xA[3] = x * uW + lnW / 2;			yA[3] = y * uH;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} `
				+ `L${xA[2]},${yA[2]} L${xA[3]},${yA[3]} Z `;
		}
		// 上右
		if (tr) {
			xA[0] = x * uW + uW - lnW / 2;		yA[0] = y * uH;
			xA[1] = x * uW + (uW - lnW) / 2;	yA[1] = y * uH + uH / 2;
			xA[2] = x * uW + (uW + lnW) / 2;	yA[2] = y * uH + uH / 2;
			xA[3] = x * uW + uW + lnW / 2;		yA[3] = y * uH;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} `
				+ `L${xA[2]},${yA[2]} L${xA[3]},${yA[3]} Z `;
		}
		// 下左
		if (bl) {
			xA[0] = x * uW + (uW - lnW) / 2;	yA[0] = y * uH + uH / 2;
			xA[1] = x * uW - lnW / 2;			yA[1] = y * uH + uH;
			xA[2] = x * uW + lnW / 2;			yA[2] = y * uH + uH;
			xA[3] = x * uW + (uW + lnW) / 2;	yA[3] = y * uH + uH / 2;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} `
				+ `L${xA[2]},${yA[2]} L${xA[3]},${yA[3]} Z `;
		}
		// 下右
		if (br) {
			xA[0] = x * uW + (uW - lnW) / 2;	yA[0] = y * uH + uH / 2;
			xA[1] = x * uW + uW - lnW / 2;		yA[1] = y * uH + uH;
			xA[2] = x * uW + uW + lnW / 2;		yA[2] = y * uH + uH;
			xA[3] = x * uW + (uW + lnW) / 2;	yA[3] = y * uH + uH / 2;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} `
				+ `L${xA[2]},${yA[2]} L${xA[3]},${yA[3]} Z `;
		}
	}
	if (c.c === '｜') {
		res.isFig = "｜＋＾".indexOf(arnd[-1][0].c) >= 0
				 || "｜＋ｖ".indexOf(arnd[ 1][0].c) >= 0;
		if (! res.isFig) {return res}

		// 全角縦棒
		xA[0] = x * uW + uW - lnW / 2;		yA[0] = y * uH;
		xA[1] = x * uW + uW + lnW / 2;		yA[1] = y * uH + uH;
		doOfst(xA, yA);
		res.pth = `M${xA[0]},${yA[0]} L${xA[0]},${yA[1]} `
			+ `L${xA[1]},${yA[1]} L${xA[1]},${yA[0]} Z `;
	}
	if (c.c === '＋') {
		let t = "｜＋＾".indexOf(arnd[-1][0].c) >= 0;
		let b = "｜＋ｖ".indexOf(arnd[ 1][0].c) >= 0;
		let l = "-+＋<>.'".indexOf(arnd[0][-1].c) >= 0;
		let r = "-+＋<>.'".indexOf(arnd[0][ 2].c) >= 0;

		let tl = "＼".indexOf(arnd[-1][-1].c) >= 0;
		let tr = "／".indexOf(arnd[-1][2].c) >= 0;
		let bl = "／".indexOf(arnd[1][-1].c) >= 0;
		let br = "＼".indexOf(arnd[1][2].c) >= 0;

		res.isFig = t || b || l || r || tl || tr || bl || br;
		if (! res.isFig) {return res}

		// 中心
		if (tl || tr || bl || br) {
			xA[0] = x * uW + uW;			yA[0] = y * uH + (uH - lnW) / 2;
			xA[1] = x * uW + uW - lnW / 2;	yA[1] = y * uH + uH / 2;
			xA[2] = x * uW + uW;			yA[2] = y * uH + (uH + lnW) / 2;
			xA[3] = x * uW + uW + lnW / 2;	yA[3] = y * uH + uH / 2;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} `
				+ `L${xA[2]},${yA[2]} L${xA[3]},${yA[3]} Z `;
		} else {
			xA[0] = x * uW + uW - lnW / 2;	yA[0] = y * uH + (uH - lnW) / 2;
			xA[1] = x * uW + uW + lnW / 2;	yA[1] = y * uH + (uH + lnW) / 2;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[0]},${yA[1]} `
				+ `L${xA[1]},${yA[1]} L${xA[1]},${yA[0]} Z `;
		}

		// 上
		if (t) {
			xA[0] = x * uW + uW - lnW / 2;	yA[0] = y * uH;
			xA[1] = x * uW + uW + lnW / 2;	yA[1] = y * uH + uH / 2;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[0]},${yA[1]} `
				+ `L${xA[1]},${yA[1]} L${xA[1]},${yA[0]} Z `;
		}
		// 下
		if (b) {
			xA[0] = x * uW + uW - lnW / 2;	yA[0] = y * uH + uH / 2;
			xA[1] = x * uW + uW + lnW / 2;	yA[1] = y * uH + uH;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[0]},${yA[1]} `
				+ `L${xA[1]},${yA[1]} L${xA[1]},${yA[0]} Z `;
		}
		// 左
		if (l) {
			xA[0] = x * uW;			yA[0] = y * uH + (uH - lnW) / 2;
			xA[1] = x * uW + uW;	yA[1] = y * uH + (uH + lnW) / 2;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[0]},${yA[1]} `
				+ `L${xA[1]},${yA[1]} L${xA[1]},${yA[0]} Z `;
		}
		// 右
		if (r) {
			xA[0] = x * uW + uW;		yA[0] = y * uH + (uH - lnW) / 2;
			xA[1] = x * uW + uW * 2;	yA[1] = y * uH + (uH + lnW) / 2;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[0]},${yA[1]} `
				+ `L${xA[1]},${yA[1]} L${xA[1]},${yA[0]} Z `;
		}

		// 上左
		if (tl) {
			xA[0] = x * uW - lnW / 2;		yA[0] = y * uH;
			xA[1] = x * uW + uW - lnW / 2;	yA[1] = y * uH + uH / 2;
			xA[2] = x * uW + uW + lnW / 2;	yA[2] = y * uH + uH / 2;
			xA[3] = x * uW + lnW / 2;		yA[3] = y * uH;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} `
				+ `L${xA[2]},${yA[2]} L${xA[3]},${yA[3]} Z `;
		}
		// 上右
		if (tr) {
			xA[0] = x * uW + uW * 2 - lnW / 2;	yA[0] = y * uH;
			xA[1] = x * uW + uW - lnW / 2;		yA[1] = y * uH + uH / 2;
			xA[2] = x * uW + uW + lnW / 2;		yA[2] = y * uH + uH / 2;
			xA[3] = x * uW + uW* 2 + lnW / 2;	yA[3] = y * uH;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} `
				+ `L${xA[2]},${yA[2]} L${xA[3]},${yA[3]} Z `;
		}
		// 下左
		if (bl) {
			xA[0] = x * uW + uW - lnW / 2;	yA[0] = y * uH + uH / 2;
			xA[1] = x * uW - lnW / 2;		yA[1] = y * uH + uH;
			xA[2] = x * uW + lnW / 2;		yA[2] = y * uH + uH;
			xA[3] = x * uW + uW + lnW / 2;	yA[3] = y * uH + uH / 2;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} `
				+ `L${xA[2]},${yA[2]} L${xA[3]},${yA[3]} Z `;
		}
		// 下右
		if (br) {
			xA[0] = x * uW + uW - lnW / 2;		yA[0] = y * uH + uH / 2;
			xA[1] = x * uW + uW * 2 - lnW / 2;	yA[1] = y * uH + uH;
			xA[2] = x * uW + uW * 2 + lnW / 2;	yA[2] = y * uH + uH;
			xA[3] = x * uW + uW + lnW / 2;		yA[3] = y * uH + uH / 2;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} `
				+ `L${xA[2]},${yA[2]} L${xA[3]},${yA[3]} Z `;
		}
	}

	//------------------------------------------------------------
	// 矢印
	if (c.c === '^') {
		let b = "|+".indexOf(arnd[1][0].c) >= 0;
		let br = "\\".indexOf(arnd[1][1].c) >= 0;
		let bl = "/".indexOf(arnd[1][-1].c) >= 0;
		res.isFig = b || br || bl;
		if (! res.isFig) {return res}

		// 上向き矢印
		if (b) {
			// 矢印
			xA[0] = x * uW + uW / 2;	yA[0] = y * uH;
			xA[1] = x * uW;				yA[1] = y * uH + uH / 2;
			xA[2] = x * uW + uW;		yA[2] = y * uH + uH / 2;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} L${xA[2]},${yA[2]} Z `;

			// 縦棒
			xA = [], yA = [];
			xA[0] = x * uW + (uW - lnW) / 2;	yA[0] = y * uH + uH / 2;
			xA[1] = x * uW + (uW + lnW) / 2;	yA[1] = y * uH + uH;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[0]},${yA[1]} `
				+ `L${xA[1]},${yA[1]} L${xA[1]},${yA[0]} Z `;
		} else
		if (br) {
			// 矢印
			xA[0] = x * uW + uW * 0.2;			yA[0] = y * uH + uH * 0.2;
			xA[1] = x * uW + uW * 0.2 + uW / 2;	yA[1] = y * uH + uH * 0.2 + uH / 2;
			xA[2] = x * uW + uW * 0.2 + uW / 2;	yA[2] = y * uH + uH * 0.2 + uH / 2;

			const radian = -Math.atan2(uH, uW / 2);
			xA[1] -= Math.sin(radian * Math.PI / 2) * uW * 0.5
			xA[2] += Math.sin(radian * Math.PI / 2) * uW * 0.5
			yA[1] += Math.cos(radian * Math.PI / 2) * uW * 0.5
			yA[2] -= Math.cos(radian * Math.PI / 2) * uW * 0.5
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} L${xA[2]},${yA[2]} Z `;

			// 縦棒
			xA = [], yA = [];
			xA[0] = x * uW + uW / 2 - lnW / 2;	yA[0] = y * uH + uH / 2;
			xA[1] = x * uW + uW / 2 + lnW / 2;	yA[1] = y * uH + uH / 2;
			xA[2] = x * uW + uW + lnW / 2;		yA[2] = y * uH + uH;
			xA[3] = x * uW + uW - lnW / 2;		yA[3] = y * uH + uH;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} `
				+ `L${xA[2]},${yA[2]} L${xA[3]},${yA[3]} Z `;
		} else
		if (bl) {
			// 矢印
			xA[0] = x * uW - uW * 0.2 + uW;		yA[0] = y * uH + uH * 0.2;
			xA[1] = x * uW - uW * 0.2 + uW / 2;	yA[1] = y * uH + uH * 0.2 + uH / 2;
			xA[2] = x * uW - uW * 0.2 + uW / 2;	yA[2] = y * uH + uH * 0.2 + uH / 2;

			const radian = Math.atan2(uH, uW / 2);
			xA[1] += Math.sin(radian * Math.PI / 2) * uW * 0.5
			xA[2] -= Math.sin(radian * Math.PI / 2) * uW * 0.5
			yA[1] -= Math.cos(radian * Math.PI / 2) * uW * 0.5
			yA[2] += Math.cos(radian * Math.PI / 2) * uW * 0.5
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} L${xA[2]},${yA[2]} Z `;

			// 縦棒
			xA = [], yA = [];
			xA[0] = x * uW + uW / 2 - lnW / 2;	yA[0] = y * uH + uH / 2;
			xA[1] = x * uW + uW / 2 + lnW / 2;	yA[1] = y * uH + uH / 2;
			xA[2] = x * uW + lnW / 2;			yA[2] = y * uH + uH;
			xA[3] = x * uW - lnW / 2;			yA[3] = y * uH + uH;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} `
				+ `L${xA[2]},${yA[2]} L${xA[3]},${yA[3]} Z `;
		}
	}
	if (c.c === '＾') {
		let b = "｜＋".indexOf(arnd[1][0].c) >= 0;
		let br = "＼".indexOf(arnd[1][2].c) >= 0;
		let bl = "／".indexOf(arnd[1][-1].c) >= 0;
		res.isFig = b || br || bl;
		if (! res.isFig) {return res}

		// 上向き矢印
		if (b) {
			// 矢印
			xA[0] = x * uW + uW;		yA[0] = y * uH;
			xA[1] = x * uW;				yA[1] = y * uH + uH / 2;
			xA[2] = x * uW + uW * 2;	yA[2] = y * uH + uH / 2;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} L${xA[2]},${yA[2]} Z `;

			// 縦棒
			xA = [], yA = [];
			xA[0] = x * uW + uW - lnW / 2;	yA[0] = y * uH + uH / 2;
			xA[1] = x * uW + uW + lnW / 2;	yA[1] = y * uH + uH;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[0]},${yA[1]} `
				+ `L${xA[1]},${yA[1]} L${xA[1]},${yA[0]} Z `;
		} else
		if (br) {
			// 矢印（左斜め上方向）
			xA[0] = x * uW + uW * 0.4;			yA[0] = y * uH + uH * 0.2;
			xA[1] = x * uW + uW * 0.4 + uW;		yA[1] = y * uH + uH * 0.2 + uH / 2;
			xA[2] = x * uW + uW * 0.4 + uW;		yA[2] = y * uH + uH * 0.2 + uH / 2;

			const radian = -Math.atan2(uH, uW * 0.33);
			xA[1] -= Math.sin(radian * Math.PI / 2) * uW * 0.5
			xA[2] += Math.sin(radian * Math.PI / 2) * uW * 0.5
			yA[1] += Math.cos(radian * Math.PI / 2) * uW * 0.5
			yA[2] -= Math.cos(radian * Math.PI / 2) * uW * 0.5
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} L${xA[2]},${yA[2]} Z `;

			// 縦棒
			xA = [], yA = [];
			xA[0] = x * uW + uW - lnW / 2;		yA[0] = y * uH + uH / 2;
			xA[1] = x * uW + uW + lnW / 2;		yA[1] = y * uH + uH / 2;
			xA[2] = x * uW + uW * 2 + lnW / 2;	yA[2] = y * uH + uH;
			xA[3] = x * uW + uW * 2 - lnW / 2;	yA[3] = y * uH + uH;

			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} `
				+ `L${xA[2]},${yA[2]} L${xA[3]},${yA[3]} Z `;
		} else
		if (bl) {
			// 矢印（右斜め上方向）
			xA[0] = x * uW - uW * 0.4 + uW * 2;	yA[0] = y * uH + uH * 0.2;
			xA[1] = x * uW - uW * 0.4 + uW;		yA[1] = y * uH + uH * 0.2 + uH / 2;
			xA[2] = x * uW - uW * 0.4 + uW;		yA[2] = y * uH + uH * 0.2 + uH / 2;

			const radian = Math.atan2(uH, uW * 0.33);
			xA[1] += Math.sin(radian * Math.PI / 2) * uW * 0.5
			xA[2] -= Math.sin(radian * Math.PI / 2) * uW * 0.5
			yA[1] -= Math.cos(radian * Math.PI / 2) * uW * 0.5
			yA[2] += Math.cos(radian * Math.PI / 2) * uW * 0.5
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} L${xA[2]},${yA[2]} Z `;

			// 縦棒
			xA = [], yA = [];
			xA[0] = x * uW + uW - lnW / 2;	yA[0] = y * uH + uH / 2;
			xA[1] = x * uW + uW + lnW / 2;	yA[1] = y * uH + uH / 2;
			xA[2] = x * uW + lnW / 2;		yA[2] = y * uH + uH;
			xA[3] = x * uW - lnW / 2;		yA[3] = y * uH + uH;

			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} `
				+ `L${xA[2]},${yA[2]} L${xA[3]},${yA[3]} Z `;
		}
	}
	if (c.c === 'v') {
		let t = "|+".indexOf(arnd[-1][0].c) >= 0;
		let tl = "\\".indexOf(arnd[-1][-1].c) >= 0;
		let tr = "/".indexOf(arnd[-1][1].c) >= 0;

		res.isFig = t || tl || tr;
		if (! res.isFig) {return res}

		// 下向き矢印
		if (t) {
			// 矢印
			xA[0] = x * uW + uW / 2;	yA[0] = y * uH + uH;
			xA[1] = x * uW;				yA[1] = y * uH + uH / 2;
			xA[2] = x * uW + uW;		yA[2] = y * uH + uH / 2;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} L${xA[2]},${yA[2]} Z `;

			// 縦棒
			xA = [], yA = [];
			xA[0] = x * uW + (uW - lnW) / 2;	yA[0] = y * uH;
			xA[1] = x * uW + (uW + lnW) / 2;	yA[1] = y * uH + uH / 2;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[0]},${yA[1]} `
				+ `L${xA[1]},${yA[1]} L${xA[1]},${yA[0]} Z `;
		} else
		if (tl) {
			// 矢印
			xA[0] = x * uW - uW * 0.2 + uW;		yA[0] = y * uH - uH * 0.2 + uH;
			xA[1] = x * uW - uW * 0.2 + uW / 2;	yA[1] = y * uH - uH * 0.2 + uH / 2;
			xA[2] = x * uW - uW * 0.2 + uW / 2;	yA[2] = y * uH - uH * 0.2 + uH / 2;

			const radian = -Math.atan2(uH, uW / 2);
			xA[1] += Math.sin(radian * Math.PI / 2) * uW * 0.5
			xA[2] -= Math.sin(radian * Math.PI / 2) * uW * 0.5
			yA[1] -= Math.cos(radian * Math.PI / 2) * uW * 0.5
			yA[2] += Math.cos(radian * Math.PI / 2) * uW * 0.5
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} L${xA[2]},${yA[2]} Z `;

			// 縦棒
			xA = [], yA = [];
			xA[0] = x * uW - lnW / 2;		yA[0] = y * uH;
			xA[1] = x * uW + lnW / 2;		yA[1] = y * uH;
			xA[2] = x * uW + uW / 2 + lnW / 2;	yA[2] = y * uH + uH / 2;
			xA[3] = x * uW + uW / 2 - lnW / 2;	yA[3] = y * uH + uH / 2;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} `
				+ `L${xA[2]},${yA[2]} L${xA[3]},${yA[3]} Z `;
		} else
		if (tr) {
			// 矢印
			xA[0] = x * uW + uW * 0.2;			yA[0] = y * uH - uH * 0.2 + uH;
			xA[1] = x * uW + uW * 0.2 + uW / 2;	yA[1] = y * uH - uH * 0.2 + uH / 2;
			xA[2] = x * uW + uW * 0.2 + uW / 2;	yA[2] = y * uH - uH * 0.2 + uH / 2;

			const radian = Math.atan2(uH, uW / 2);
			xA[1] -= Math.sin(radian * Math.PI / 2) * uW * 0.5
			xA[2] += Math.sin(radian * Math.PI / 2) * uW * 0.5
			yA[1] += Math.cos(radian * Math.PI / 2) * uW * 0.5
			yA[2] -= Math.cos(radian * Math.PI / 2) * uW * 0.5
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} L${xA[2]},${yA[2]} Z `;

			// 縦棒
			xA = [], yA = [];
			xA[0] = x * uW + uW - lnW / 2;		yA[0] = y * uH;
			xA[1] = x * uW + uW + lnW / 2;		yA[1] = y * uH;
			xA[2] = x * uW + uW / 2 + lnW / 2;	yA[2] = y * uH + uH / 2;
			xA[3] = x * uW + uW / 2 - lnW / 2;	yA[3] = y * uH + uH / 2;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} `
				+ `L${xA[2]},${yA[2]} L${xA[3]},${yA[3]} Z `;
		}
	}
	if (c.c === 'ｖ') {
		let t = "｜＋".indexOf(arnd[-1][0].c) >= 0;
		let tl = "＼".indexOf(arnd[-1][-1].c) >= 0;
		let tr = "／".indexOf(arnd[-1][2].c) >= 0;

		res.isFig = t || tl || tr;
		if (! res.isFig) {return res}

		// 下向き矢印
		if (t) {
			// 矢印
			xA[0] = x * uW + uW;		yA[0] = y * uH + uH;
			xA[1] = x * uW;				yA[1] = y * uH + uH / 2;
			xA[2] = x * uW + uW * 2;	yA[2] = y * uH + uH / 2;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} L${xA[2]},${yA[2]} Z `;

			// 縦棒
			xA = [], yA = [];
			xA[0] = x * uW + uW - lnW / 2;	yA[0] = y * uH;
			xA[1] = x * uW + uW + lnW / 2;	yA[1] = y * uH + uH / 2;
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[0]},${yA[1]} `
				+ `L${xA[1]},${yA[1]} L${xA[1]},${yA[0]} Z `;
		} else
		if (tl) {
			// 矢印
			xA[0] = x * uW - uW * 0.4 + uW * 2;	yA[0] = y * uH - uH * 0.2 + uH;
			xA[1] = x * uW - uW * 0.4 + uW;		yA[1] = y * uH - uH * 0.2 + uH / 2;
			xA[2] = x * uW - uW * 0.4 + uW;		yA[2] = y * uH - uH * 0.2 + uH / 2;

			const radian = -Math.atan2(uH, uW * 0.25);
			xA[1] += Math.sin(radian * Math.PI / 2) * uW * 0.5
			xA[2] -= Math.sin(radian * Math.PI / 2) * uW * 0.5
			yA[1] -= Math.cos(radian * Math.PI / 2) * uW * 0.5
			yA[2] += Math.cos(radian * Math.PI / 2) * uW * 0.5
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} L${xA[2]},${yA[2]} Z `;

			// 縦棒
			xA = [], yA = [];
			xA[0] = x * uW - lnW / 2;		yA[0] = y * uH;
			xA[1] = x * uW + lnW / 2;		yA[1] = y * uH;
			xA[2] = x * uW + uW + lnW / 2;	yA[2] = y * uH + uH / 2;
			xA[3] = x * uW + uW - lnW / 2;	yA[3] = y * uH + uH / 2;

			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} `
				+ `L${xA[2]},${yA[2]} L${xA[3]},${yA[3]} Z `;
		} else
		if (tr) {
			// 矢印
			xA[0] = x * uW + uW * 0.4;		yA[0] = y * uH - uH * 0.2 + uH;
			xA[1] = x * uW + uW * 0.4 + uW;	yA[1] = y * uH - uH * 0.2 + uH / 2;
			xA[2] = x * uW + uW * 0.4 + uW;	yA[2] = y * uH - uH * 0.2 + uH / 2;

			const radian = Math.atan2(uH, uW * 0.33);
			xA[1] -= Math.sin(radian * Math.PI / 2) * uW * 0.5
			xA[2] += Math.sin(radian * Math.PI / 2) * uW * 0.5
			yA[1] += Math.cos(radian * Math.PI / 2) * uW * 0.5
			yA[2] -= Math.cos(radian * Math.PI / 2) * uW * 0.5
			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} L${xA[2]},${yA[2]} Z `;

			// 縦棒
			xA = [], yA = [];
			xA[0] = x * uW + uW * 2 - lnW / 2;		yA[0] = y * uH;
			xA[1] = x * uW + uW * 2 + lnW / 2;		yA[1] = y * uH;
			xA[2] = x * uW + uW + lnW / 2;	yA[2] = y * uH + uH / 2;
			xA[3] = x * uW + uW - lnW / 2;	yA[3] = y * uH + uH / 2;

			doOfst(xA, yA);
			res.pth += `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} `
				+ `L${xA[2]},${yA[2]} L${xA[3]},${yA[3]} Z `;
		}


	}
	if (c.c === '<') {
		let l = "-+＋".indexOf(arnd[0][1].c) >= 0;
		res.isFig = l;
		if (! res.isFig) {return res}

		// 左向き矢印
		xA[0] = x * uW;			yA[0] = y * uH + uH * 0.5;
		xA[1] = x * uW + uW;	yA[1] = y * uH + uH * 0.75;
		xA[2] = x * uW + uW;	yA[2] = y * uH + uH * 0.25;
		doOfst(xA, yA);
		res.pth = `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} L${xA[2]},${yA[2]} Z `;
	}
	if (c.c === '>') {
		let r = "-+＋".indexOf(arnd[0][-1].c) >= 0;
		res.isFig = r;
		if (! res.isFig) {return res}

		// 左向き矢印
		xA[0] = x * uW + uW;	yA[0] = y * uH + uH * 0.5;
		xA[1] = x * uW;			yA[1] = y * uH + uH * 0.75;
		xA[2] = x * uW;			yA[2] = y * uH + uH * 0.25;
		doOfst(xA, yA);
		res.pth = `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} L${xA[2]},${yA[2]} Z `;
	}

	//------------------------------------------------------------
	// 斜め
	if (c.c === '/') {
		res.isFig = "/^+".indexOf(arnd[-1][1].c) >= 0
				 || "/v+".indexOf(arnd[ 1][-1].c) >= 0;
		if (! res.isFig) {return res}

		// 右上斜め
		xA[0] = x * uW + uW - lnW / 2;		yA[0] = y * uH;
		xA[1] = x * uW + uW + lnW / 2;		yA[1] = y * uH;
		xA[2] = x * uW + lnW / 2;			yA[2] = y * uH + uH;
		xA[3] = x * uW - lnW / 2;			yA[3] = y * uH + uH;
		doOfst(xA, yA);
		res.pth = `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} `
			+ `L${xA[2]},${yA[2]} L${xA[3]},${yA[3]} Z `;
	}
	if (c.c === '\\') {
		res.isFig = "\\^+".indexOf(arnd[-1][-1].c) >= 0
				 || "\\v+".indexOf(arnd[ 1][1].c) >= 0;
		if (! res.isFig) {return res}

		// 左上斜め
		xA[0] = x * uW - lnW / 2;			yA[0] = y * uH;
		xA[1] = x * uW + lnW / 2;			yA[1] = y * uH;
		xA[2] = x * uW + uW + lnW / 2;		yA[2] = y * uH + uH;
		xA[3] = x * uW + uW - lnW / 2;		yA[3] = y * uH + uH;
		doOfst(xA, yA);
		res.pth = `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} `
			+ `L${xA[2]},${yA[2]} L${xA[3]},${yA[3]} Z `;
	}
	if (c.c === '／') {
		res.isFig = "／＾＋".indexOf(arnd[-1][2].c) >= 0
				 || "／ｖ＋".indexOf(arnd[ 1][-1].c) >= 0;
		if (! res.isFig) {return res}

		// 右上斜め
		xA[0] = x * uW + uW * 2 - lnW / 2;	yA[0] = y * uH;
		xA[1] = x * uW + uW * 2 + lnW / 2;	yA[1] = y * uH;
		xA[2] = x * uW + lnW / 2;			yA[2] = y * uH + uH;
		xA[3] = x * uW - lnW / 2;			yA[3] = y * uH + uH;
		doOfst(xA, yA);
		res.pth = `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} `
			+ `L${xA[2]},${yA[2]} L${xA[3]},${yA[3]} Z `;
	}
	if (c.c === '＼') {
		res.isFig = "＼＾＋".indexOf(arnd[-1][-1].c) >= 0
				 || "＼ｖ＋".indexOf(arnd[ 1][2].c) >= 0;
		if (! res.isFig) {return res}

		// 左上斜め
		xA[0] = x * uW - lnW / 2;			yA[0] = y * uH;
		xA[1] = x * uW + lnW / 2;			yA[1] = y * uH;
		xA[2] = x * uW + uW * 2 + lnW / 2;	yA[2] = y * uH + uH;
		xA[3] = x * uW + uW * 2 - lnW / 2;	yA[3] = y * uH + uH;
		doOfst(xA, yA);
		res.pth = `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} `
			+ `L${xA[2]},${yA[2]} L${xA[3]},${yA[3]} Z `;
	}

	// 戻り値を戻して終了
	return res;
};

