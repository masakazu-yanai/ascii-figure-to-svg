'use strict';

(function() {
	//------------------------------------------------------------
	// 引数
	const pNode = process.argv[0];	// console.log('pNode :', pNode);
	const pThis = process.argv[1];	// console.log('pThis :', pThis);
	const pArg  = process.argv[2];	// console.log('pArg  :', pArg);
	if (pArg === undefined) { return }

	// モジュールの読み込み
	const path = require('path');
	const fs = require('fs');
	const { execSync } = require('child_process');
	const af2s = require('./asciiFigureToSvg.js');

	//------------------------------------------------------------
	// 実行対象ファイルの初期化
	// rw - rewrite
	let pSrcArr = [];
	try {
		const stat = fs.statSync(pArg);

		if (stat.isFile()) {
			if (pArg.match(/\.aa\.txt$/)) {
				pSrcArr = [{p: pArg, rw: true}];
			}
		}
		if (stat.isDirectory()) {
			pSrcArr = fs.readdirSync(pArg);
			const dir  = pArg + path.sep;
			pSrcArr = pSrcArr
				.filter(x => x.match(/\.aa\.txt$/))
				.map(x => ({p: dir + x, rw: false}));
		}
	} catch(e) {
		console.log(e);
		return;
	}

	//------------------------------------------------------------
	// 実行処理
	const exec = function(arg) {
		// 変数の初期化
		const pSrc = arg.p;
		const ext  = path.extname(pSrc);
		const bsNm = path.basename(pSrc, ext).replace(/\.aa$/, '');
		const dir  = path.dirname(pSrc) + path.sep;
		const pDst = dir + bsNm + '.svg';

		// 上書き確認
		if (arg.rw === false) {
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
		const tDst = af2s.genSvg(tSrc).svg;			// 実行
		fs.writeFileSync(pDst, tDst, 'utf8');
	}

	// 各ファイルに実行
	pSrcArr.forEach(x => exec(x));	// 実行処理

})();
