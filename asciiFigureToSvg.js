/*! Ascii Figure To SVG v1.1.0 | (c) 2020 Masakazu Yanai | https://crocro.com/ | https://twitter.com/ruten | Released under the MIT License */

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
mod.version = '1.1.0';

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

	mod.render.setOfst(xOfst, yOfst);	// オフセットの設定

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
				const res = mod.genPth(cArrArr, c, x, y, uW, uH, lnW);
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
mod.genPth = function(cArrArr, c, x, y, uW, uH, lnW) {
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

	//------------------------------------------------------------
	// 罫線
	if (c.c === '-') {	// 横棒
		res.isFig = "-+＋<>.'".indexOf(arnd[0][-1].c) >= 0
				 || "-+＋<>.'".indexOf(arnd[0][ 1].c) >= 0;
		if (! res.isFig) {return res}

		res.pth = mod.render.horizontal(x * uW, y * uH, uW, uH, lnW);
	}
	if (c.c === '|') {	// 縦棒
		res.isFig = "|+^".indexOf(arnd[-1][0].c) >= 0
				 || "|+v".indexOf(arnd[ 1][0].c) >= 0;
		if (! res.isFig) {return res}

		res.pth = mod.render.vertical(x * uW, y * uH, uW, uH, lnW);
	}
	if (c.c === '+') {	// 中心
		let t = "|+^".indexOf(arnd[-1][0].c) >= 0;
		let b = "|+v".indexOf(arnd[ 1][0].c) >= 0;
		let l = "-+＋<.'".indexOf(arnd[0][-1].c) >= 0;
		let r = "-+＋>.'".indexOf(arnd[0][ 1].c) >= 0;

		let tl = "\\".indexOf(arnd[-1][-1].c) >= 0;
		let tr = "/".indexOf(arnd[-1][1].c) >= 0;
		let bl = "/".indexOf(arnd[1][-1].c) >= 0;
		let br = "\\".indexOf(arnd[1][1].c) >= 0;

		res.isFig = t || b || l || r || tl || tr || bl || br;
		if (! res.isFig) {return res}

		// 中心
		if (tl || tr || bl || br) {
			res.pth += mod.render.centerSlash(x * uW + uW / 2, y * uH + uH / 2, lnW);
		} else {
			res.pth += mod.render.centerSquare(x * uW + uW / 2, y * uH + uH / 2, lnW);
		}

		// 上下左右
		if (t) { res.pth += mod.render.vertical(
				x * uW, y * uH, uW, uH / 2, lnW) }
		if (b) { res.pth += mod.render.vertical(
				x * uW, y * uH + uH / 2, uW, uH / 2, lnW) }
		if (l) { res.pth += mod.render.horizontal(
				x * uW, y * uH, uW / 2, uH, lnW) }
		if (r) { res.pth += mod.render.horizontal(
				x * uW + uW / 2, y * uH, uW / 2, uH, lnW) }

		// 上左,上右,下左,下右
		if (tl) { res.pth += mod.render.backslash(
				x * uW, y * uH, uW / 2, uH / 2, lnW) }
		if (tr) { res.pth += mod.render.slash(
				x * uW + uW / 2, y * uH, uW / 2, uH / 2, lnW) }
		if (bl) { res.pth += mod.render.slash(
				x * uW, y * uH + uH / 2, uW / 2, uH / 2, lnW) }
		if (br) { res.pth += mod.render.backslash(
				x * uW + uW / 2, y * uH + uH / 2, uW / 2, uH / 2, lnW) }
	}
	if (c.c === '｜') {	// 全角縦棒
		res.isFig = "｜＋＾".indexOf(arnd[-1][0].c) >= 0
				 || "｜＋ｖ".indexOf(arnd[ 1][0].c) >= 0;
		if (! res.isFig) {return res}

		res.pth = mod.render.vertical(x * uW, y * uH, uW * 2, uH, lnW);
	}
	if (c.c === '＋') {	// 中心
		let t = "｜＋＾".indexOf(arnd[-1][0].c) >= 0;
		let b = "｜＋ｖ".indexOf(arnd[ 1][0].c) >= 0;
		let l = "-+＋<.'".indexOf(arnd[0][-1].c) >= 0;
		let r = "-+＋>.'".indexOf(arnd[0][ 2].c) >= 0;

		let tl = "＼".indexOf(arnd[-1][-1].c) >= 0;
		let tr = "／".indexOf(arnd[-1][2].c) >= 0;
		let bl = "／".indexOf(arnd[1][-1].c) >= 0;
		let br = "＼".indexOf(arnd[1][2].c) >= 0;

		res.isFig = t || b || l || r || tl || tr || bl || br;
		if (! res.isFig) {return res}

		// 中心
		if (tl || tr || bl || br) {
			res.pth += mod.render.centerSlash(x * uW + uW, y * uH + uH / 2, lnW);
		} else {
			res.pth += mod.render.centerSquare(x * uW + uW, y * uH + uH / 2, lnW);
		}

		// 上,下,左,右
		if (t) { res.pth += mod.render.vertical(
				x * uW, y * uH, uW * 2, uH / 2, lnW) }
		if (b) { res.pth += mod.render.vertical(
				x * uW, y * uH + uH / 2, uW * 2, uH / 2, lnW) }
		if (l) { res.pth += mod.render.horizontal(
				x * uW, y * uH, uW, uH, lnW) }
		if (r) { res.pth += mod.render.horizontal(
				x * uW + uW, y * uH, uW, uH, lnW) }

		// 上左,上右,下左,下右
		if (tl) { res.pth += mod.render.backslash(
				x * uW, y * uH, uW, uH / 2, lnW) }
		if (tr) { res.pth += mod.render.slash(
				x * uW + uW, y * uH, uW, uH / 2, lnW) }
		if (bl) { res.pth += mod.render.slash(
				x * uW, y * uH + uH / 2, uW, uH / 2, lnW) }
		if (br) { res.pth += mod.render.backslash(
				x * uW + uW, y * uH + uH / 2, uW, uH / 2, lnW) }
	}

	//------------------------------------------------------------
	// 矢印
	if (c.c === '^') {	// 上向き矢印
		let b = "|+".indexOf(arnd[1][0].c) >= 0;
		let br = "\\".indexOf(arnd[1][1].c) >= 0;
		let bl = "/".indexOf(arnd[1][-1].c) >= 0;
		res.isFig = b || br || bl;
		if (! res.isFig) {return res}

		if (b) {
			// 矢印（上方向）,縦棒
			res.pth += mod.render.arrow(
				x * uW + uW / 2, y * uH, x * uW + uW / 2, y * uH + uH / 2, uW);
			res.pth += mod.render.vertical(
				x * uW, y * uH + uH / 2, uW, uH / 2, lnW)
		} else
		if (br) {
			// 矢印（左斜め上方向）,左上斜め
			res.pth += mod.render.arrow(
				x * uW + uW * 0.2, y * uH + uH * 0.2,
				x * uW + uW * 0.7, y * uH + uH * 0.7, uW);
			res.pth += mod.render.backslash(
				x * uW + uW / 2, y * uH + uH / 2, uW / 2, uH / 2, lnW);
		} else
		if (bl) {
			// 矢印（右斜め上方向）,右上斜め
			res.pth += mod.render.arrow(
				x * uW + uW - uW * 0.2, y * uH + uH * 0.2,
				x * uW + uW - uW * 0.7, y * uH + uH * 0.7, uW);
			res.pth += mod.render.slash(
				x * uW, y * uH + uH / 2, uW / 2, uH / 2, lnW);
		}
	}
	if (c.c === '＾') {	// 上向き矢印
		let b = "｜＋".indexOf(arnd[1][0].c) >= 0;
		let br = "＼".indexOf(arnd[1][2].c) >= 0;
		let bl = "／".indexOf(arnd[1][-1].c) >= 0;
		res.isFig = b || br || bl;
		if (! res.isFig) {return res}

		if (b) {
			// 矢印（上方向）,縦棒
			res.pth += mod.render.arrow(
				x * uW + uW, y * uH, x * uW + uW, y * uH + uH / 2, uW);
			res.pth += mod.render.vertical(
				x * uW, y * uH + uH / 2, uW * 2, uH / 2, lnW);
		} else
		if (br) {
			// 矢印（左斜め上方向）,左上斜め
			res.pth += mod.render.arrow(
				x * uW + uW * 0.4, y * uH + uH * 0.2,
				x * uW + uW * 1.4, y * uH + uH * 0.7, uW);
			res.pth += mod.render.backslash(
				x * uW + uW, y * uH + uH / 2, uW, uH / 2, lnW);
		} else
		if (bl) {
			// 矢印（右斜め上方向）,右上斜め
			res.pth += mod.render.arrow(
				x * uW + uW * 2 - uW * 0.4, y * uH + uH * 0.2,
				x * uW + uW * 2 - uW * 1.4, y * uH + uH * 0.7, uW);
			res.pth += mod.render.slash(
				x * uW, y * uH + uH / 2, uW, uH / 2, lnW);
		}
	}
	if (c.c === 'v') {	// 下向き矢印
		let t = "|+".indexOf(arnd[-1][0].c) >= 0;
		let tl = "\\".indexOf(arnd[-1][-1].c) >= 0;
		let tr = "/".indexOf(arnd[-1][1].c) >= 0;

		res.isFig = t || tl || tr;
		if (! res.isFig) {return res}

		if (t) {
			// 矢印（下方向）,縦棒
			res.pth += mod.render.arrow(
				x * uW + uW / 2, y * uH + uH, x * uW + uW / 2, y * uH + uH / 2, uW);
			res.pth += mod.render.vertical(
				x * uW, y * uH, uW, uH / 2, lnW)
		} else
		if (tl) {
			// 矢印（右斜め下方向）,左上斜め
			res.pth += mod.render.arrow(
				x * uW + uW - uW * 0.2, y * uH + uH - uH * 0.2,
				x * uW + uW - uW * 0.7, y * uH + uH - uH * 0.7, uW);
			res.pth += mod.render.backslash(
				x * uW, y * uH, uW / 2, uH / 2, lnW);
		} else
		if (tr) {
			// 矢印（左斜め下方向）,右上斜め
			res.pth += mod.render.arrow(
				x * uW + uW * 0.2, y * uH + uH - uH * 0.2,
				x * uW + uW * 0.7, y * uH + uH - uH * 0.7, uW);
			res.pth += mod.render.slash(
				x * uW + uW / 2, y * uH, uW / 2, uH / 2, lnW);
		}
	}
	if (c.c === 'ｖ') {	// 下向き矢印
		let t = "｜＋".indexOf(arnd[-1][0].c) >= 0;
		let tl = "＼".indexOf(arnd[-1][-1].c) >= 0;
		let tr = "／".indexOf(arnd[-1][2].c) >= 0;

		res.isFig = t || tl || tr;
		if (! res.isFig) {return res}

		if (t) {
			// 矢印（下方向）,縦棒
			res.pth += mod.render.arrow(
				x * uW + uW, y * uH + uH, x * uW + uW, y * uH + uH / 2, uW);
			res.pth += mod.render.vertical(
				x * uW, y * uH, uW * 2, uH / 2, lnW)
		} else
		if (tl) {
			// 矢印（右斜め下方向）,左上斜め
			res.pth += mod.render.arrow(
				x * uW + uW * 2 - uW * 0.4, y * uH + uH - uH * 0.2,
				x * uW + uW * 2 - uW * 1.4, y * uH + uH - uH * 0.7, uW);
			res.pth += mod.render.backslash(
				x * uW, y * uH, uW, uH / 2, lnW);
		} else
		if (tr) {
			// 矢印（左斜め下方向）,右上斜め
			res.pth += mod.render.arrow(
				x * uW + uW * 0.4, y * uH + uH - uH * 0.2,
				x * uW + uW * 1.4, y * uH + uH - uH * 0.7, uW);
			res.pth += mod.render.slash(
				x * uW + uW, y * uH, uW, uH / 2, lnW);
		}
	}
	if (c.c === '<') {	// 左向き矢印
		let l = "-+＋".indexOf(arnd[0][1].c) >= 0;
		res.isFig = l;
		if (! res.isFig) {return res}

		res.pth += mod.render.arrow(
			x * uW, y * uH + uH / 2, x * uW + uW, y * uH + uH / 2, uH / 2);
	}
	if (c.c === '>') {	// 左向き矢印
		let r = "-+＋".indexOf(arnd[0][-1].c) >= 0;
		res.isFig = r;
		if (! res.isFig) {return res}

		res.pth += mod.render.arrow(
			x * uW + uW, y * uH + uH / 2, x * uW, y * uH + uH / 2, uH / 2);
	}

	//------------------------------------------------------------
	// 斜め
	if (c.c === '/') {	// 右上斜め
		res.isFig = "/^+".indexOf(arnd[-1][ 1].c) >= 0
				 || "/v+".indexOf(arnd[ 1][-1].c) >= 0;
		if (! res.isFig) {return res}

		res.pth = mod.render.slash(x * uW, y * uH, uW, uH, lnW);
	}
	if (c.c === '\\') {	// 左上斜め
		res.isFig = "\\^+".indexOf(arnd[-1][-1].c) >= 0
				 || "\\v+".indexOf(arnd[ 1][ 1].c) >= 0;
		if (! res.isFig) {return res}

		res.pth = mod.render.backslash(x * uW, y * uH, uW, uH, lnW);
	}
	if (c.c === '／') {	// 右上斜め
		res.isFig = "／＾＋".indexOf(arnd[-1][ 2].c) >= 0
				 || "／ｖ＋".indexOf(arnd[ 1][-1].c) >= 0;
		if (! res.isFig) {return res}

		res.pth = mod.render.slash(x * uW, y * uH, uW * 2, uH, lnW);
	}
	if (c.c === '＼') {	// 左上斜め
		res.isFig = "＼＾＋".indexOf(arnd[-1][-1].c) >= 0
				 || "＼ｖ＋".indexOf(arnd[ 1][ 2].c) >= 0;
		if (! res.isFig) {return res}

		res.pth = mod.render.backslash(x * uW, y * uH, uW * 2, uH, lnW);
	}

	// 戻り値を戻して終了
	return res;
};

//------------------------------------------------------------
// パスの生成
mod.render = {xOfst: 0, yOfst: 0};

// オフセットの設定
mod.render.setOfst = function(xOfst, yOfst) {
	this.xOfst = xOfst;
	this.yOfst = yOfst;
};

// オフセットの適用
mod.render.applyOfst = function(xArr, yArr) {
	xArr.forEach((n, i) => { xArr[i] = n + mod.render.xOfst });
	yArr.forEach((n, i) => { yArr[i] = n + mod.render.yOfst });
};

// 横棒
mod.render.horizontal = function(x, y, w, h, lnW) {
	const xA  = [], yA  = [];	// xArr, yArr
	xA[0] = x;		yA[0] = y + (h - lnW) / 2;	// 時計回り
	xA[1] = x + w;	yA[1] = y + (h - lnW) / 2;
	xA[2] = x + w;	yA[2] = y + (h + lnW) / 2;
	xA[3] = x;		yA[3] = y + (h + lnW) / 2;

	mod.render.applyOfst(xA, yA);

	const pth = `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} `
			  + `L${xA[2]},${yA[2]} L${xA[3]},${yA[3]} Z `;
	return pth;
};

// 縦棒
mod.render.vertical = function(x, y, w, h, lnW) {
	const xA  = [], yA  = [];		// xArr, yArr
	xA[0] = x + (w - lnW) / 2;	yA[0] = y;	// 時計回り
	xA[1] = x + (w + lnW) / 2;	yA[1] = y;
	xA[2] = x + (w + lnW) / 2;	yA[2] = y + h;
	xA[3] = x + (w - lnW) / 2;	yA[3] = y + h;

	mod.render.applyOfst(xA, yA);

	const pth = `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} `
			  + `L${xA[2]},${yA[2]} L${xA[3]},${yA[3]} Z `;
	return pth;
};

// 右上斜め ／
mod.render.slash = function(x, y, w, h, lnW) {
	const xA  = [], yA  = [];		// xArr, yArr
	xA[0] = x + w - lnW / 2;		yA[0] = y;	// 時計回り
	xA[1] = x + w + lnW / 2;		yA[1] = y;
	xA[2] = x + lnW / 2;			yA[2] = y + h;
	xA[3] = x - lnW / 2;			yA[3] = y + h;

	mod.render.applyOfst(xA, yA);

	const pth = `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} `
			  + `L${xA[2]},${yA[2]} L${xA[3]},${yA[3]} Z `;
	return pth;
};

// 左上斜め ＼
mod.render.backslash = function(x, y, w, h, lnW) {
	const xA  = [], yA  = [];		// xArr, yArr
	xA[0] = x - lnW / 2;			yA[0] = y;	// 時計回り
	xA[1] = x + lnW / 2;			yA[1] = y;
	xA[2] = x + w + lnW / 2;		yA[2] = y + h;
	xA[3] = x + w - lnW / 2;		yA[3] = y + h;

	mod.render.applyOfst(xA, yA);

	const pth = `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} `
			  + `L${xA[2]},${yA[2]} L${xA[3]},${yA[3]} Z `;
	return pth;
};

// 中心四角
mod.render.centerSquare = function(x, y, lnW) {
	const xA  = [], yA  = [];		// xArr, yArr
	xA[0] = x - lnW / 2;		yA[0] = y - lnW / 2;	// 時計回り
	xA[1] = x + lnW / 2;		yA[1] = y - lnW / 2;
	xA[2] = x + lnW / 2;		yA[2] = y + lnW / 2;
	xA[3] = x - lnW / 2;		yA[3] = y + lnW / 2;

	mod.render.applyOfst(xA, yA);

	const pth = `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} `
			  + `L${xA[2]},${yA[2]} L${xA[3]},${yA[3]} Z `;
	return pth;
};

// 中心斜め
mod.render.centerSlash = function(x, y, lnW) {
	const xA  = [], yA  = [];		// xArr, yArr
	xA[0] = x;				yA[0] = y - lnW / 2;
	xA[1] = x + lnW / 2;	yA[1] = y;
	xA[2] = x;				yA[2] = y + lnW / 2;
	xA[3] = x - lnW / 2;	yA[3] = y;

	mod.render.applyOfst(xA, yA);

	const pth = `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} `
			  + `L${xA[2]},${yA[2]} L${xA[3]},${yA[3]} Z `;
	return pth;
};

// 矢印の矢
mod.render.arrow = function(xTo, yTo, xFrom, yFrom, baseW) {
	const distance = Math.sqrt(Math.pow(xTo - xFrom, 2) + Math.pow(yTo - yFrom, 2));
	const rate = (baseW / 2) / distance;
	const xBs = (xTo - xFrom) * rate;
	const yBs = (yTo - yFrom) * rate;
	const xRtt1 = xBs * Math.cos(Math.PI *  0.5) - yBs * Math.sin(Math.PI *  0.5);
	const yRtt1 = xBs * Math.sin(Math.PI *  0.5) + yBs * Math.cos(Math.PI *  0.5);
	const xRtt2 = xBs * Math.cos(Math.PI * -0.5) - yBs * Math.sin(Math.PI * -0.5);
	const yRtt2 = xBs * Math.sin(Math.PI * -0.5) + yBs * Math.cos(Math.PI * -0.5);

	const xA  = [], yA  = [];		// xArr, yArr
	xA[0] = xTo;				yA[0] = yTo;
	xA[1] = xFrom + xRtt1;		yA[1] = yFrom + yRtt1;
	xA[2] = xFrom + xRtt2;		yA[2] = yFrom + yRtt2;

	mod.render.applyOfst(xA, yA);

	const pth = `M${xA[0]},${yA[0]} L${xA[1]},${yA[1]} L${xA[2]},${yA[2]} Z `;
	return pth;
};

