'use strict';

(function() {
	//------------------------------------------------------------
	// 引数
	const argv = Array.from(process.argv);
	argv._node = argv.shift();
	argv._this = argv.shift();
	if (argv[0] === undefined) { return }

	argv.pSrc = argv[0];
	argv.pOpt = argv[1];

	// console.log('argv :', argv);

	// モジュールの読み込み
	const path = require('path');
	const fs = require('fs');
	const { execSync } = require('child_process');
	const af2s = require('./asciiFigureToSvg.js');

	//------------------------------------------------------------
	// 実行対象ファイルの初期化
	// rw - rewrite
	const srcArray = (p => {
		try {
			const re = /\.aa\.txt$/;
			const stat = fs.statSync(p);

			if (stat.isFile()) {
				if (p.match(re)) {
					return [{p: p, rw: true}];
				}
			}
			if (stat.isDirectory()) {
				return fs.readdirSync(p)
					.filter(x => x.match(re))
					.map(x => ({p: path.resolve(p, x), rw: false}));
			}
		} catch(e) {
			console.log(e);
		}
		return [];
	})(argv.pSrc);

	//console.log({srcArray});

	//------------------------------------------------------------
	// 設定の読み込み
	const opt = (p => {
		if (p) {
			try {
				return require(p);
			} catch(e) {
				console.log(e);
			}
		}
		return {};
	})(argv.pOpt);

	//------------------------------------------------------------
	// 実行処理
	const exec = function(src, opt) {
		// 変数の初期化
		const pSrc = src.p;
		const ext = path.extname(pSrc);
		const basename = path.basename(pSrc, ext).replace(/\.aa$/, '');
		const dir = path.dirname(pSrc) + path.sep;
		const fnmDst = `${basename}.svg`;
		const pDst = dir + fnmDst;

		// 上書き確認
		if (src.rw === false) {
			try {
				const stat = fs.statSync(pDst);
				if (stat.isFile()) {
					console.log('[skip]', pDst);
					return;
				}
			} catch(e) {}
		}

		// 変換処理
		console.log('[dst]', pDst);
		const tSrc = fs.readFileSync(pSrc, 'utf8');	// ファイル読み込み
		const tDst = af2s.genSvg(tSrc, opt).svg;	// 実行
		fs.writeFileSync(pDst, tDst, 'utf8');
	}

	// 各ファイルに実行
	srcArray.forEach(x => exec(x, opt));	// 実行処理

})();
