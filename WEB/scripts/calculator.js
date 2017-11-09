/**
 * 执行利率计算规则
 * 
 * @param baseRate
 *            我行挂牌基准利率
 * @param type
 *            计算类型 ------------- ------------- ------------- ------------- ----
 *            1: 存款类 活期、整存整取、通知存款、整存零取、零存整取、存本取息、理财------------- -------------
 *            2：贷款类 贷款、垫款、贴现、同业、票据、债券
 * @param rate
 *            实际上浮点/实际优惠点差 转换成百分数传入10BP=0.01% 例如：页面输入10BP时，传入 0.01
 * @param info
 *            计算raroc相关信息数据的JSON对象
 * @param initload
 *            初始化页面计算的执行利率参数信息数据函数
 * @param failFunc
 *            异常校验函数
 * @return returnInfo 返回信息数据参数 ZX_RATE 执行利率 RAROC RAROC值 EVA RAROC限额值
 *         ---------------STATUS ='1' 时正常，其他异常 ；MSG异常说明
 * 
 */
function CalculatorPdcs4calNetRate(baseRate, type, rate, info, initload,
		failFunc) {
	var returnInfo = {
		STATUS : '1'
	};
	if (failFunc) {// 如果函数存在,则进行数据校验
		if (!baseRate || '' == baseRate) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '我行基准挂牌利率为空';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (!rate || '' == rate) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '实际优惠点差或实际上浮点差为空';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
	}
	if (type == '1') { // 存款类计算器 我行挂牌基准利率+实际上浮点差
		var netRate = parseFloat(baseRate) + parseFloat(rate);
		returnInfo.ZX_RATE = netRate.toFixed(6);
	} else if (type == '2') { // 贷款类 我行挂牌基准利率-实际优惠点差
		var netRate = parseFloat(baseRate) - parseFloat(rate);
		returnInfo.ZX_RATE = netRate.toFixed(6);
		var isRaroc = info.IS_RAROC;
		if (info && "1" == isRaroc) {
			var ftpRate = (info.FTP_RATE || '' == info.FTP_RATE) ? info.FTP_RATE
					: 0;
			var op1Rate = (info.PRD_ZJYYCBL || '' == info.PRD_ZJYYCBL) ? info.PRD_ZJYYCBL
					: 0;
			var op2Rate = (info.PRD_JJYYCBL || '' == info.PRD_JJYYCBL) ? info.PRD_JJYYCBL
					: 0;
			var riskRate = (info.PRD_YQFXSSL || '' == info.PRD_YQFXSSL) ? info.PRD_YQFXSSL
					: 0;
			var sf1Rate = (info.PRD_SFL1 || '' == info.PRD_SFL1) ? info.PRD_SFL1
					: 0;
			var sf2Rate = (info.PRD_SFL2 || '' == info.PRD_SFL2) ? info.PRD_SFL2
					: 0;
			var jjzbRate = (info.PRD_JJZBL || '' == info.PRD_JJZBL) ? info.PRD_JJZBL
					: 0;
			var mblrlRate = (info.PRD_MBLRL || '' == info.PRD_MBLRL) ? info.PRD_MBLRL
					: 0;
			// 计算 RAROC限额值 目标利润率/(经济资本分配系数*资本的成本率）
			// 计算 RAROC值 （执行利率-FTP价格-费用成本分摊率-减值准备率-净税率）/(经济资本分配系数*资本的成本率）
			if (jjzbRate == 0) {
				returnInfo.RAROC = "";
				returnInfo.EVA = "";
			} else {
				var raroc = (parseFloat(netRate) - parseFloat(ftpRate)
						- parseFloat(op1Rate) - parseFloat(op2Rate)
						- parseFloat(riskRate) - parseFloat(sf1Rate) - parseFloat(sf2Rate))
						/ parseFloat(jjzbRate);
				returnInfo.RAROC = raroc.toFixed(6);
				var eva = parseFloat(mblrlRate) / parseFloat(jjzbRate);
				returnInfo.EVA = eva.toFixed(6);
			}
		} else {
			returnInfo.RAROC = "";
			returnInfo.EVA = "";
		}
	}

	if (initload) {
		initload.call(this, returnInfo);
	}
	return returnInfo;
}

/**
 * 贷款1、垫款2、贴现3 计算规则
 * 
 * @param termTs
 *            期限天数
 * @param netRate
 *            执行利率
 * @param floatVaild
 *            实际优惠点差
 * @param amountMoney
 *            交易金额
 * @param repayMentType
 *            还款方式 1：等额本息；2：等额本金；3：一次还本付息；4：分期还息、一次还本
 * @param repayMentFreq
 *            还款频率 1：按月；3：按季；6：按半年；12：按年
 * @param initload
 *            赋值页面信息参数信息
 * @param failFunc
 *            异常校验函数
 * @return returnInfo 返回计算的相关信息参数
 *         -----------------------------------------------------------------------------------------------------
 *         STATUS ='1' 时正常，其他异常 ；MSG异常说明 ；HKZE: 还款总额； ZFLX: 支付利息； YHLX: 优惠利息
 *         -----------------------------------------------------------------------------------------------------
 *         -----LIST:还款计划表明细-----------------------------------------------------------------------------
 *         ------RN :期数 --------------------------------------------------------
 *         ------CHBJ :偿还本金 ----------------------------------------------------
 *         ------CHLX :偿还利息 ----------------------------------------------------
 *         ------YHLX :优惠利息 ----------------------------------------------------
 *         ------DYYG :当期月供 ----------------------------------------------------
 *         ------SYBJ :剩余本金 ----------------------------------------------------
 */
function CalculatorPdcs4calLoan(termTs, netRate, floatVaild, amountMoney,
		repayMentType, repayMentFreq, initload, failFunc) {
	var returnInfo = {
		STATUS : '1'
	};
	if (failFunc) {
		if (!termTs || '' == termTs || isNaN(termTs) || parseInt(termTs) <= 0) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '合同期限天数格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (!floatVaild || '' == floatVaild || isNaN(floatVaild)) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '实际优惠点差格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (!netRate || '' == netRate || isNaN(netRate)) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '执行利率格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (!amountMoney || '' == amountMoney || isNaN(amountMoney)
				|| parseFloat(amountMoney) <= 0) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '交易金额格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (repayMentType != '1' && repayMentType != '2'
				&& repayMentType != '3' && repayMentType != '4') {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '还款方式格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (repayMentFreq != '1' && repayMentFreq != '3'
				&& repayMentFreq != '6' && repayMentFreq != '12') {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '还款频率格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
	}
	var ts = parseInt(termTs);// 合同期限天数
	var term = 1;// 将期限天数折算成月份
	term = Math.ceil(ts / 31);
	var cnt = 0;// 期数
	if (repayMentFreq == '1') { // 按月
		cnt = term;
	} else if (repayMentFreq == '3') { // 按季
		cnt = Math.ceil(term / 3);
	} else if (repayMentFreq == '6') { // 按半年
		cnt = Math.ceil(term / 6);
	} else if (repayMentFreq == '12') { // 按年
		cnt = Math.ceil(term / 12);
	}
	if (cnt == 0) {
		cnt = 1;
	}
	var zflxze = 0;// 支付利息总额
	var yhlx = 0;// 优惠利息
	var hkze = 0;// 还款总额
	var mxlb = [];// 明细列表
	var zxlv = parseFloat(netRate);// 执行年利率
	var yhdc = parseFloat(floatVaild);// 实际优惠点差
	var dkje = parseFloat(amountMoney);// 贷款金额
	var hkpl = parseInt(repayMentFreq);// 还款频率
	if (repayMentType == '1') {// 等额本息
		var ylx = zxlv * hkpl / 1200;// 按照还款频率折算执行年利率
		var ljyhje = 0;// 累计已还本金
		for (var i = 0; i < cnt; i++) {// 循环期数
			var hkmx = {};
			var mylx = (dkje - ljyhje) * ylx;// 每期偿还利息
			zflxze = zflxze + mylx;// 计算利息总计
			var myyhlx = (dkje - ljyhje) * (yhdc * hkpl / 1200);// 每期优惠利息
			yhlx = yhlx + myyhlx;// 计算优惠利息总计
			var hbfxze = 0;// 每期月供金额
			var ratePow = Math.pow(ylx + 1, cnt);// 每期贷款利率
			hbfxze = (dkje * ylx * ratePow) / (ratePow - 1);// 每期还款月供金额
			var mybj = hbfxze - mylx;// 每月还款本金
			var sybj = dkje - ljyhje - mybj;// 剩余本金：贷款金额-已还款累计金额-当期还款本金
			if (sybj < 0) {
				sybj = 0;
			}
			hkmx.RN = (i + 1);// 期数
			hkmx.CHBJ = mybj.toFixed(2);// 偿还本金
			hkmx.CHLX = mylx.toFixed(2);// 偿还利息
			hkmx.YHLX = myyhlx.toFixed(2);// 优惠利息
			hkmx.DYYG = hbfxze.toFixed(2);// 当期月供
			hkmx.SYBJ = sybj.toFixed(2);// 剩余本金
			mxlb.push(hkmx);
			ljyhje = ljyhje + mybj;// 计算累计还款本金
		}
	} else if (repayMentType == '2') {// 等额本金
		var ljyhje = 0;// 累计已还本金
		var ylx = zxlv * hkpl / 1200;// 按照还款频率折算执行年利率
		var bj = dkje / cnt;// 每期偿还本金
		var ljyhje = 0;// 累计已还本金
		for (var i = 0; i < cnt; i++) {
			var mybj = bj;// 每月还款本金
			var mylx = (dkje - ljyhje) * ylx;// 每期偿还利息
			zflxze = zflxze + mylx;// 支付利息总额
			var myyhlx = (dkje - ljyhje) * (yhdc * hkpl / 1200);// 每期优惠利息
			yhlx = yhlx + myyhlx;// 优惠利息总额
			var hbfxze = mybj + mylx;// 每期月供金额
			var sybj = dkje - ljyhje - mybj;// 剩余本金：贷款金额-已还款累计金额-当期还款本金
			if (sybj < 0) {
				sybj = 0;
			}
			var hkmx = {};
			hkmx.RN = (i + 1);// 期数
			hkmx.CHBJ = mybj.toFixed(2);// 偿还本金
			hkmx.CHLX = mylx.toFixed(2);// 偿还利息
			hkmx.YHLX = myyhlx.toFixed(2);// 优惠利息
			hkmx.DYYG = hbfxze.toFixed(2);// 当期月供
			hkmx.SYBJ = sybj.toFixed(2);// 剩余本金
			mxlb.push(hkmx);
			ljyhje = ljyhje + mybj; // 累计已还本金
		}
	} else if (repayMentType == '3') {// 一次还本付息
		yhlx = dkje * (yhdc * 0.01 * term / 12);// 优惠利息
		zflxze = dkje * (zxlv * 0.01 * term / 12);// 支付利息总额
		var hbfxze = dkje + zflxze;// 月供金额
		var hkmx = {};
		hkmx.RN = 1;// 期数
		hkmx.CHBJ = dkje.toFixed(2);// 偿还本金
		hkmx.CHLX = zflxze.toFixed(2);// 偿还利息
		hkmx.YHLX = yhlx.toFixed(2);// 优惠利息
		hkmx.DYYG = hbfxze.toFixed(2);// 当期月供
		hkmx.SYBJ = 0;// 剩余本金
		mxlb.push(hkmx);
	} else if (repayMentType == '4') {// 分期还息、一次还本
		yhlx = dkje * (yhdc * 0.01 * term / 12);// 优惠利息
		zflxze = dkje * (zxlv * 0.01 * term / 12);// 支付利息总额
		var mylx = zflxze / cnt;// 每期偿还利息
		var myyhlx = yhlx / cnt; // 每期优惠利息
		for (var i = 0; i < cnt - 1; i++) {
			var hkmx = {};
			hkmx.RN = (i + 1);// 期数
			hkmx.CHBJ = 0;// 偿还本金
			hkmx.CHLX = mylx.toFixed(2);// 偿还利息
			hkmx.YHLX = myyhlx.toFixed(2);// 优惠利息
			hkmx.DYYG = mylx.toFixed(2);// 当期月供
			hkmx.SYBJ = dkje.toFixed(2);// 剩余本金
			mxlb.push(hkmx);
		}
		var hkmx = {};
		hkmx.RN = cnt;// 期数
		hkmx.CHBJ = dkje.toFixed(2);// 偿还本金
		hkmx.CHLX = mylx.toFixed(2);// 偿还利息
		hkmx.YHLX = myyhlx.toFixed(2);// 优惠利息
		hkmx.DYYG = (dkje + mylx).toFixed(2);// 当期月供
		hkmx.SYBJ = 0;// 剩余本金
		mxlb.push(hkmx);
	}
	hkze = dkje + zflxze;// 计算还款总额:贷款金额+支付利息
	returnInfo.LIST = mxlb;// 还款明细计划表Ï
	returnInfo.HKZE = hkze.toFixed(2);// 还款总额
	returnInfo.ZFLX = zflxze.toFixed(2);// 支付利息
	returnInfo.YHLX = yhlx.toFixed(2);// 优惠利息
	if (initload) {
		initload.call(this, returnInfo);
	}
	return returnInfo;
}
/**
 * 活期类、通知存款类、理财类计算规则
 * 
 * @param termTs
 *            期限天数 活期类、通知存款类 上送 （提取日期-存入日期间隔天数） ；理财类 上送期限天数
 * @param netRate
 *            执行利率
 * @param amountMoney
 *            初始存入金额 【通知存款：5万元起存。】
 * @param type
 *            计算器类型
 * @param initload
 *            赋值页面信息参数信息
 * @param failFunc
 *            异常校验函数
 * @return returnInfo 返回计算的相关信息参数
 *         -----------------------------------------------------------------------------------------------------
 *         STATUS ='1' 时正常，其他异常 ；MSG异常说明 ； SDLX:利息金额, LXSJE:利息税金额, BXHJ:本息合计
 */
function CalculatorPdcs4calDeposit1(termTs, netRate, amountMoney, type,
		initload, failFunc) {
	var returnInfo = {
		STATUS : '1'
	};
	if (failFunc) {
		if (!termTs || '' == termTs || isNaN(termTs) || parseInt(termTs) <= 0) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '天数格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (!netRate || '' == netRate || isNaN(netRate)) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '执行利率格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (!amountMoney || '' == amountMoney || isNaN(amountMoney)
				|| parseFloat(amountMoney) <= 0) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '初始存入金额格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('9' == type && parseFloat(amountMoney) < 50000) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '5万元起存';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
	}
	var lxje = parseFloat(amountMoney)
			* (parseInt(termTs) * parseFloat(netRate) * 0.01 / 365);// 利息金额
	var bxhj = parseFloat(amountMoney) + lxje;// 本息合计
	returnInfo.SDLX = lxje.toFixed(2);// 利息金额
	returnInfo.LXSJE = 0;// 利息税金额
	returnInfo.BXHJ = bxhj.toFixed(2);// 本息合计
	if (initload) {
		initload.call(this, returnInfo);
	}
	return returnInfo;
}

/**
 * 整存整取类计算规则
 * 
 * @param termTs
 *            期限天数
 * @param netRate
 *            执行利率
 * @param amountMoney
 *            初始存入金额
 * @param periods
 *            转存期数
 * @param initload
 *            赋值页面信息参数信息
 * @param failFunc
 *            异常校验函数
 * @return returnInfo 返回计算的相关信息参数
 *         -----------------------------------------------------------------------------------------------------
 *         STATUS ='1' 时正常，其他异常 ；MSG异常说明 ； *
 *         -----------------------------------------------------------------------------------------------------
 *         YQLXJE:一期利息金额, YQLXSJ:一期利息税金额, YQBXHJ:一期本息合计,
 *         -----------------------------------------------------------------------------------------------------
 *         DQLXJE:转存多期利息金额, DQLXSJ:转存多期利息税金额,DQBXHJ:转存多期本息合计
 */
function CalculatorPdcs4calDeposit2(termTs, netRate, amountMoney, periods,
		initload, failFunc) {
	var returnInfo = {
		STATUS : '1'
	};
	if (failFunc) {
		if (!termTs || '' == termTs || isNaN(termTs) || parseInt(termTs) <= 0) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '期限天数格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (!periods || '' == periods || isNaN(periods)
				|| parseInt(periods) <= 0) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '转存期数格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (!netRate || '' == netRate || isNaN(netRate)) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '执行利率格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (!amountMoney || '' == amountMoney || isNaN(amountMoney)
				|| parseFloat(amountMoney) <= 0) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '初始存入金额格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
	}
	var jyje = parseFloat(amountMoney); // 初始存入金额
	var lxje = jyje * (parseInt(termTs) * parseFloat(netRate) * 0.01 / 365);// 一期利息金额
	var bxhj = jyje + lxje;// 一期本息合计
	returnInfo.YQLXJE = lxje.toFixed(2);// 一期利息金额
	returnInfo.YQLXSJ = 0;// 一期利息税金额
	returnInfo.YQBXHJ = bxhj.toFixed(2);// 一期本息合计
	var zcqs = parseInt(periods);
	var zcje = jyje;
	var zclx = 0;
	for (var i = 0; i < zcqs; i++) {
		var lx = zcje * (parseInt(termTs) * parseFloat(netRate) * 0.01 / 365);
		zclx = zclx + lx;// 多期利息金额
		zcje = zcje + lx;// 多期转存本金
	}
	returnInfo.DQLXJE = zclx.toFixed(2);// 转存多期利息金额
	returnInfo.DQLXSJ = 0;// 转存多期利息税金额
	returnInfo.DQBXHJ = (jyje + zclx).toFixed(2);// 转存多期本息合计
	if (initload) {
		initload.call(this, returnInfo);
	}
	return returnInfo;
}

/**
 * 整存零取类计算规则
 * 
 * @param termTs
 *            期限天数
 * @param netRate
 *            执行利率
 * @param amountMoney
 *            初始存入金额 1000元起存。
 * @param drawFreq
 *            支取频率 1：一个月；3：三个月；6：六个月
 * @param initload
 *            赋值页面信息参数信息
 * @param failFunc
 *            异常校验函数
 * @return returnInfo 返回计算的相关信息参数
 *         -----------------------------------------------------------------------------------------------------
 *         STATUS ='1' 时正常，其他异常 ；MSG异常说明 ； SDLX:利息金额, LXSJE:利息税金额,
 *         BXHJ:本息合计,ZQBJ:每次支取本金
 */
function CalculatorPdcs4calDeposit3(termTs, netRate, amountMoney, drawFreq,
		initload, failFunc) {
	var returnInfo = {
		STATUS : '1'
	};
	if (failFunc) {
		if (!termTs || '' == termTs || isNaN(termTs) || parseInt(termTs) <= 0) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '天数格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (!netRate || '' == netRate || isNaN(netRate)) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '执行利率格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (!amountMoney || '' == amountMoney || isNaN(amountMoney)
				|| parseFloat(amountMoney) <= 0) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '交易金额格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (parseFloat(amountMoney) < 1000) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = ' 初始存入金额1000元起存';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (drawFreq != '1' && drawFreq != '3' && drawFreq != '6') {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '支取频率格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
	}
	var cnt = Math.ceil(parseInt(termTs) / (31 * parseInt(drawFreq)));// 支取次数
	if (cnt == 0) {
		cnt = 1;
	}
	var jyje = parseFloat(amountMoney);// 初始存入金额
	var dayRate = parseFloat(netRate) * 0.01 / 365; // 执行年利率转换成日利率
	var zqbj = jyje / cnt;// 每次支取本金
	var lxje = 0;// 利息金额
	for (var i = 0; i < cnt; i++) {
		var bqbj = jyje - i * zqbj;// 本期本金
		var fsts = i * parseInt(drawFreq) * 31;// 已发生天数
		var lx;
		if (i == (cnt - 1)) {
			lx = bqbj * dayRate * (parseInt(termTs) - fsts);// 最后一期利息计算
		} else {
			lx = bqbj * dayRate * (parseInt(drawFreq) * 31);// 每期利息计算
		}
		lxje = lxje + lx;
	}
	var bxhj = jyje + lxje;// 本息合计
	returnInfo.SDLX = lxje.toFixed(2);// 利息金额
	returnInfo.LXSJE = 0;// 利息税金额
	returnInfo.BXHJ = bxhj.toFixed(2);// 本息合计
	returnInfo.ZQBJ = zqbj.toFixed(2);// 每次支取本金
	if (initload) {
		initload.call(this, returnInfo);
	}
	return returnInfo;
}

/**
 * 零存整取类计算规则
 * 
 * @param termTs
 *            期限天数
 * @param netRate
 *            执行利率
 * @param amountMoney
 *            初始入金额
 * @param drawMoney
 *            月存入金额
 * @param initload
 *            赋值页面信息参数信息
 * @param failFunc
 *            异常校验函数
 * @return returnInfo 返回计算的相关信息参数
 *         -----------------------------------------------------------------------------------------------------
 *         STATUS ='1' 时正常，其他异常 ；MSG异常说明 ； SDLX:利息金额, LXSJE:利息税金额, BXHJ:本息合计
 */
function CalculatorPdcs4calDeposit4(termTs, netRate, amountMoney, drawMoney,
		initload, failFunc) {
	var returnInfo = {
		STATUS : '1'
	};
	if (failFunc) {
		if (!termTs || '' == termTs || isNaN(termTs) || parseInt(termTs) <= 0) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '天数格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (!netRate || '' == netRate || isNaN(netRate)) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '执行利率格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (!amountMoney || '' == amountMoney || isNaN(amountMoney)
				|| parseFloat(amountMoney) <= 0) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '初始入金额格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (!drawMoney || '' == drawMoney || isNaN(drawMoney)
				|| parseFloat(drawMoney) <= 0) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '月存入金额格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
	}
	var jyje = parseFloat(amountMoney);// 初始存入金额
	var cnt = Math.ceil(parseInt(termTs) / 31);// 期限月数
	if (cnt == 0) {
		cnt = 1;
	}
	var dayRate = parseFloat(netRate) * 0.01 / 365; // 执行年利率转换成日利率
	var ljbj = 0;
	var lxje = 0;// 利息金额
	for (var i = 0; i < cnt; i++) {
		ljbj = jyje + i * parseFloat(drawMoney);// 本期本金
		var lx = 0;
		if (i == (cnt - 1)) {
			lx = ljbj * dayRate * (parseInt(termTs) - 31 * i);
		} else {
			lx = ljbj * dayRate * 31;
		}
		lxje = lxje + lx;
	}
	var bxhj = ljbj + lxje;// 本息合计
	returnInfo.SDLX = lxje.toFixed(2);// 利息金额
	returnInfo.LXSJE = 0;// 利息税金额
	returnInfo.BXHJ = bxhj.toFixed(2);// 本息合计
	if (initload) {
		initload.call(this, returnInfo);
	}
	return returnInfo;
}

/**
 * 存本取息类计算规则
 * 
 * @param termTs
 *            期限天数
 * @param netRate
 *            执行利率
 * @param amountMoney
 *            初始存入金额 5000元起存
 * @param drawFreq
 *            支取频率 1：一个月；3：三个月；6：六个月
 * @param initload
 *            赋值页面信息参数信息
 * @param failFunc
 *            异常校验函数
 * @return returnInfo 返回计算的相关信息参数
 *         -----------------------------------------------------------------------------------------------------
 *         STATUS ='1' 时正常，其他异常 ；MSG异常说明 ； 
            SDLX:利息金额, LXSJE:利息税金额,
 *         BXHJ:本息合计,ZQLX:每次支取利息
 */
function CalculatorPdcs4calDeposit5(termTs, netRate, amountMoney, drawFreq,
		initload, failFunc) {
	var returnInfo = {
		STATUS : '1'
	};
	if (failFunc) {
		if (!termTs || '' == termTs || isNaN(termTs) || parseInt(termTs) <= 0) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '天数格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (!netRate || '' == netRate || isNaN(netRate)) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '执行利率格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (!amountMoney || '' == amountMoney || isNaN(amountMoney)
				|| parseFloat(amountMoney) <= 0) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '初始存入金额格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (parseFloat(amountMoney) < 5000) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = ' 初始存入金额5000元起存';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (drawFreq != '1' && drawFreq != '3' && drawFreq != '6') {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '支取频率格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
	}
	var cnt = Math.ceil(parseInt(termTs) / (31 * parseInt(drawFreq)));// 支取期数
	if (cnt == 0) {
		cnt = 1;
	}
	var jyje = parseFloat(amountMoney);// 初始存入金额
	var dayRate = parseFloat(netRate) * 0.01 / 365; // 执行年利率转换成日利率
	var lxje = jyje * dayRate * parseInt(termTs);// 利息金额
	var zqlx = lxje / cnt;// 每次支取利息 利息金额/支取期数
	var bxhj = jyje + lxje;// 本息合计
	returnInfo.SDLX = lxje.toFixed(2);// 利息金额
	returnInfo.LXSJE = 0;// 利息税金额
	returnInfo.BXHJ = bxhj.toFixed(2);// 本息合计
	returnInfo.ZQLX = zqlx.toFixed(2);// 每次支取利息
	if (initload) {
		initload.call(this, returnInfo);
	}
	return returnInfo;
}

/**
 * 同业类计算规则
 * 
 * @param termTs
 *            期限天数
 * @param netRate
 *            执行利率
 * @param amountMoney
 *            交易金额
 * @param drawType
 *            还息方式/付息方式 3：一次还本付息；4：分期还息、一次还本
 * @param drawFreq
 *            还息频率/付息频率 1:0个月;1：一个月；3：三个月；6：六个月
 * @param initload
 *            赋值页面信息参数信息
 * @param failFunc
 *            异常校验函数
 * @return returnInfo 返回计算的相关信息参数
 *         -----------------------------------------------------------------------------------------------------
 *         STATUS ='1' 时正常，其他异常 ；MSG异常说明 ； 
 ZQLX:每次支取利息 
 LXJE:利息金额 
 BXHJ:本息合计
 */
function CalculatorPdcs4calTy(termTs, netRate, amountMoney, drawType, drawFreq,
		initload, failFunc) {
	var returnInfo = {
		STATUS : '1'
	};
	if (failFunc) {
		if (!termTs || '' == termTs || isNaN(termTs) || parseInt(termTs) <= 0) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '合同期限天数格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (!netRate || '' == netRate || isNaN(netRate)) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '执行利率格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (!amountMoney || '' == amountMoney || isNaN(amountMoney)
				|| parseFloat(amountMoney) <= 0) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '交易金额格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (drawType != '3' && drawType != '4') {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '还息方式/付息方式格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (drawFreq != '1' && drawFreq != '3' && drawFreq != '6') {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '还息频率/付息频率格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
	}
	var cnt = 0;// 还息/付息期数
	if ('3' == drawType) {
		cnt = 1;
	} else {
		cnt = Math.ceil(parseInt(termTs) / (31 * parseInt(drawFreq)));
	}
	if (cnt == 0) {
		cnt = 1;
	}
	var jyje = parseFloat(amountMoney);// 交易金额
	var dayRate = parseFloat(netRate) * 0.01 / 365; // 执行年利率转换成日利率
	var lx = jyje * dayRate * parseInt(termTs);// 利息总额
	var mqlx = lx / cnt;// 每次支取利息
	var bxhj = jyje + lx;
	returnInfo.ZQLX = mqlx.toFixed(2);// 每次支取利息
	returnInfo.LXJE = lx.toFixed(2);// 利息金额
	returnInfo.BXHJ = bxhj.toFixed(2);// 本息合计
	if (initload) {
		initload.call(this, returnInfo);
	}
	return returnInfo;
}

/**
 * 票据类计算规则
 * 
 * @param termTs
 *            期限天数
 * @param netRate
 *            执行利率
 * @param amountMoney
 *            交易金额
 * @param receiptMoney
 *            票面金额
 * @param receiptRate
 *            票面利率
 * @param initload
 *            赋值页面信息参数信息
 * @param failFunc
 *            异常校验函数
 * @return returnInfo 返回计算的相关信息参数
 *         -----------------------------------------------------------------------------------------------------
 *         STATUS ='1' 时正常，其他异常 ；MSG异常说明 ；
 *         ZYQJPMLX:持有期间票面利息;CYQJSY:持有期间收益;BXHJ:本息合计
 */
function CalculatorPdcs4calPj(termTs, netRate, amountMoney, receiptMoney,
		receiptRate, initload, failFunc) {
	var returnInfo = {
		STATUS : '1'
	};
	if (failFunc) {
		if (!termTs || '' == termTs || isNaN(termTs) || parseInt(termTs) <= 0) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '合同期限天数格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (!netRate || '' == netRate || isNaN(netRate)) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '执行利率格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (!receiptRate || '' == receiptRate || isNaN(receiptRate)) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '票面利率格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (!amountMoney || '' == amountMoney || isNaN(amountMoney)
				|| parseFloat(amountMoney) <= 0) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '交易金额格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (!receiptMoney || '' == receiptMoney || isNaN(receiptMoney)
				|| parseFloat(receiptMoney) <= 0) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '票面金额格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
	}
	var jyje = parseFloat(amountMoney);// 交易金额
	var pmje = parseFloat(receiptMoney);// 票面金额
	var pmlv = parseFloat(receiptRate);// 票面利率
	// 持有期间票面利息 : 票面金额*票面利率/360*合同期限
	var zyqjpmlx = pmje * (pmlv * 0.01 / 365) * parseInt(termTs);
	// 持有期间收益 ： 交易金额*执行利率*合同期限，合同期限如果小于1年，执行利率转化为月利率或者日利率。
	var cyqjsy = jyje * (parseFloat(netRate) * 0.01 / 365) * parseInt(termTs);
	// 本息合计 : 交易金额+持有期间收益
	var bxhj = jyje + cyqjsy;
	returnInfo.ZYQJPMLX = zyqjpmlx.toFixed(2);// 持有期间票面利息
	returnInfo.CYQJSY = cyqjsy.toFixed(2);// 持有期间收益
	returnInfo.BXHJ = bxhj.toFixed(2);// 本息合计
	if (initload) {
		initload.call(this, returnInfo);
	}
	return returnInfo;
}

/**
 * 债券类计算规则
 * 
 * @param termTs
 *            期限天数
 * @param remainderTermTs
 *            合同期限剩余天数 债券到期日-交易日期
 * @param netRate
 *            执行利率 %
 * @param nominalMoney
 *            债券面值（单张）
 * @param sellPrice
 *            卖出价格（单张）
 * @param publishPrice
 *            发行价格（单张）
 * @param buyNum
 *            购买数量
 * @param nominalRate
 *            票面利率 %
 * @param buyPrice
 *            买入价格（单张）
 * @param flag
 *            标志 1显示买入返售债券持有期间收益;2显示卖出回购债券持有期间支付利息
 * @param initload
 *            赋值页面信息参数信息
 * @param failFunc
 *            异常校验函数
 * @return returnInfo 返回计算的相关信息参数
 *         -----------------------------------------------------------------------------------------------------
 *         STATUS ='1' 时正常，其他异常 ；MSG异常说明 ；-----------------------------------
 *         ---------- ZQGMSYL:债券购买收益率%-----------------------------------------
 *         ---------- ZQCSSYL:债券出售收益率%-----------------------------------------
 *         ---------- CYQJSYL:持有期间收益率%-----------------------------------------
 *         ---------- CYQJSY:持有期间收益-----------------------------------------
 *         ---------- CYQJPMLX:持有期间票面利息-----------------------------------------
 *         ---------- MRFGZQCYQJSY:买入返售债券持有期间收益-----------------------------
 *         ---------- MCHGZQCYQJZFLX:卖出回购债券持有期间支付利息----------------------
 *         ---------- BXHJ:本息合计-----------------------------------------
 */
function CalculatorPdcs4calZq(termTs, remainderTermTs, netRate, nominalMoney,
		sellPrice, publishPrice, buyNum, nominalRate, buyPrice, flag, initload,
		failFunc) {
	var returnInfo = {
		STATUS : '1'
	};
	if (failFunc) {
		if (!termTs || '' == termTs || isNaN(termTs) || parseInt(termTs) <= 0) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '合同期限天数格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (!remainderTermTs || '' == remainderTermTs || isNaN(remainderTermTs)
				|| parseInt(remainderTermTs) <= 0) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '合同期限剩余天数格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (!netRate || '' == netRate || isNaN(netRate)) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '执行利率格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (!nominalMoney || '' == nominalMoney || isNaN(nominalMoney)) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '债券面值-单张格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (!sellPrice || '' == sellPrice || isNaN(sellPrice)) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '卖出价格-单张格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (!publishPrice || '' == publishPrice || isNaN(publishPrice)) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '发行价格-单张格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (!nominalRate || '' == nominalRate || isNaN(nominalRate)) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '票面利率格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (!buyPrice || '' == buyPrice || isNaN(buyPrice)) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '买入价格-单张格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (!buyNum || '' == buyNum || isNaN(buyNum) || parseInt(buyNum) <= 0) {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '购买数量数格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
	}
	// 剩余期限（年）= 合同期限剩余天数 / 365
	var synx = parseInt(remainderTermTs) / parseFloat(365);// 合同剩余期限(年)
	var qxnx = parseInt(termTs) / parseFloat(365); // 合同期限(年)
	// 债券购买收益率 【（面值+面值*票面利率*剩余期限（年）-（买入价格））/(（买入价格)*剩余期限（年）)】*100
	var zqgmsyl = ((parseFloat(nominalMoney) + parseFloat(nominalMoney)
			* parseFloat(nominalRate) * 0.01 * synx - parseFloat(buyPrice))
			/ parseFloat(buyPrice) * synx) * 100;
	// 债券出售收益率 【（卖出价格-发行价格+面值*票面利率*合同期限）/(发行价格*合同期限)】*100
	var zqcssyl = ((parseFloat(sellPrice) - parseFloat(publishPrice) + parseFloat(nominalMoney)
			* parseFloat(nominalRate) * 0.01 * qxnx) / (parseFloat(publishPrice) * qxnx)) * 100;
	// 持有期间收益率 【（卖出价格-买入价格+面值*票面利率*合同期限）/(买入价格*合同期限)】*100
	var cyqjsyl = ((parseFloat(sellPrice) - parseFloat(buyPrice) + parseFloat(nominalMoney)
			* parseFloat(nominalRate) * 0.01 * qxnx) / (parseFloat(buyPrice) * qxnx)) * 100;
	// 持有期间收益 【（卖出价格-买入价格+面值*票面利率*合同期限）】*购买数量
	var cyqjsy = (parseFloat(sellPrice) - parseFloat(buyPrice) + parseFloat(nominalMoney)
			* parseFloat(nominalRate) * 0.01 * qxnx)
			* parseInt(buyNum);
	// 持有期间票面利息 债券票面*票面利率*合同期限*购买数量，如果合同期限不满1年，请注意合同期限与票面利率相匹配。
	var cyqjpmlx = parseFloat(nominalMoney) * parseFloat(nominalRate) * 0.01
			* qxnx * parseInt(buyNum);
	returnInfo.MRFGZQCYQJSY = '';
	returnInfo.MCHGZQCYQJZFLX = '';
	// 买入返售债券持有期间收益 当四级产品为3030104-债券逆回购时，该字段有值；买入价格*购买数量*执行利率*合同期限
	if ('1' == flag) {
		var mrfgzqcyqjsy = parseFloat(buyPrice) * parseInt(buyNum)
				* parseFloat(netRate) * 0.01 * qxnx;
		returnInfo.MRFGZQCYQJSY = mrfgzqcyqjsy.toFixed(2);
	}
	// 卖出回购债券持有期间支付利息 当四级产品为3030201-债券正回购时该字段有值；卖出价格*购买数量*执行利率*合同期限
	if ('2' == flag) {
		var mchgzqcyqjzflx = parseFloat(sellPrice) * parseInt(buyNum)
				* parseFloat(netRate) * 0.01 * qxnx;
		returnInfo.MCHGZQCYQJZFLX = mchgzqcyqjzflx.toFixed(2);
	}
	// 本息合计 交易金额+持有期间收益
	var bxhj = parseFloat(buyPrice) * parseInt(buyNum) + cyqjsy;
	returnInfo.ZQGMSYL = zqgmsyl.toFixed(2);
	returnInfo.ZQCSSYL = zqcssyl.toFixed(2);
	returnInfo.CYQJSYL = cyqjsyl.toFixed(2);
	returnInfo.CYQJSY = cyqjsy.toFixed(2);
	returnInfo.CYQJPMLX = cyqjpmlx.toFixed(2);
	returnInfo.BXHJ = bxhj.toFixed(2);
	if (initload) {
		initload.call(this, returnInfo);
	}
	return returnInfo;
}
