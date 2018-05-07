/**
 * 试算日志记录操作
 * 
 * @param _basePath
 *            应用
 * @param _productId
 *            产品信息页面主键
 * @param _tranBal
 *            交易金额
 * @param _tranFavRate
 *            优惠利率点差
 * @param _tranRate
 *            执行利率
 */
function calTranLogSave(_basePath, _productId, _tranBal, _tranFavRate,
		_tranRate) {
	var _prdCpdmBean = $(
			_productId + pbpmsCalculatorSearchProduct.$elementId.prdCpdm)
			.combotree('tree').tree('getSelected');
	var _prdCpdm = _prdCpdmBean.id;// 产品代码
	var _prdJgdmBean = $(
			_productId + pbpmsCalculatorSearchProduct.$elementId.prdJgdm)
			.combotree('tree').tree('getSelected');
	var _prdJgdm = _prdJgdmBean.id;// 机构代码
	var _prdBz = $(_productId + pbpmsCalculatorSearchProduct.$elementId.prdBz)
			.combobox('getValue');// 币种
	var _custType = $(
			_productId + pbpmsCalculatorSearchProduct.$elementId.custType)
			.combobox('getValue');// 客户类别
	var _custLvl = $(
			_productId + pbpmsCalculatorSearchProduct.$elementId.custLvl)
			.combobox('getValue');// 客户级别
	var _termQxbmId = _productId
			+ pbpmsCalculatorSearchProduct.$elementId.termQxbm;// 期限编码
	var _termQxbm = $(_termQxbmId).val();// 期限编码
	var _termId = _productId + pbpmsCalculatorSearchProduct.$elementId.termTs;
	var _termQxTs = $(_termId).combobox('getValue');// 获取期限天数
	var _rateBjrqId = _productId
			+ pbpmsCalculatorSearchProduct.$elementId.rateBjrq;// 报价日期
	var _rateBjrq = $(_rateBjrqId).datebox('getValue');// 报价日期
	var _url = _basePath + '/system/tranlog.shtml?action=save';
	var _data = {
		prdCpdm : _prdCpdm,
		prdJgdm : _prdJgdm,
		prdBz : _prdBz,
		tranDevType : '2',
		tranType : '2',
		custType : _custType,
		custLvl : _custLvl,
		termQxbm : _termQxbm,
		termTs : _termQxTs,
		tranBal : _tranBal,
		tranFavRate : _tranFavRate * 0.01,
		tranRate : _tranRate * 0.01,
		czrq : _rateBjrq
	};
	_$pbpmsGeneric.ajax(_url, _data, function(data) {
	}, function(data) {
	});
}

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
 */
function CalculatorPdcs4calNetRate(baseRate, type, rate, info, initload,
		failFunc) {
	var returnInfo = {
		STATUS : '1'
	};
	if (failFunc) {// 如果函数存在,则进行数据校验
		if (('' != ('' + baseRate)) && !isNaN(baseRate)) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '我行基准挂牌利率为空';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if (('' != ('' + rate)) && !isNaN(rate)) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '实际优惠点差或实际上浮点差为空';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
	}
	if (type == '1') { // 存款类计算器 我行挂牌基准利率+实际上浮点差
		var netRate = parseFloat(rate) + parseFloat(baseRate);
		returnInfo.ZX_RATE = netRate;
	} else if (type == '2') { // 贷款类 我行挂牌基准利率-实际优惠点差
		var netRate = parseFloat(baseRate) - parseFloat(rate);
		returnInfo.ZX_RATE = netRate;
		var isRaroc = info.IS_RAROC;
		if (info && "1" == isRaroc) {
			var ftpRate = (('' + info.FTP_RATE) != '') && !isNaN(info.FTP_RATE) ? info.FTP_RATE
					: 0;// FTP利率
			var op1Rate = (('' + info.PRD_ZJYYCBL) != '')
					&& !isNaN(info.PRD_ZJYYCBL) ? info.PRD_ZJYYCBL : 0;// 直接运营成本率
			var op2Rate = (('' + info.PRD_JJYYCBL) != '')
					&& !isNaN(info.PRD_JJYYCBL) ? info.PRD_JJYYCBL : 0;// 间接分摊成本率
			var riskRate = (('' + info.PRD_YQFXSSL) != '')
					&& !isNaN(info.PRD_YQFXSSL) ? info.PRD_YQFXSSL : 0;// 预期风险损失成本率
			var sf1Rate = (('' + info.PRD_SFL1) != '') && !isNaN(info.PRD_SFL1) ? info.PRD_SFL1
					: 0;// 增值税税率
			var sf2Rate = (('' + info.PRD_SFL2) != '') && !isNaN(info.PRD_SFL2) ? info.PRD_SFL2
					: 0;// 增值税附加税率
			var jjzbRate = (('' + info.PRD_JJZBL) != '')
					&& !isNaN(info.PRD_JJZBL) ? info.PRD_JJZBL : 0;// 经济资本成本率
			var mblrlRate = (('' + info.PRD_MBLRL) != '')
					&& !isNaN(info.PRD_MBLRL) ? info.PRD_MBLRL : 0;// 目标利润率
			// 净税率 = 执行利率 /（1+增值税率）*（增值税+增值税*增值税附加）
			var jsl = 0;
			jsl = (parseFloat(netRate) / (1 + parseFloat(sf1Rate) * 0.01))
					* (parseFloat(sf1Rate) * 0.01 + parseFloat(sf1Rate) * 0.01
							* parseFloat(sf2Rate) * 0.01)
			// 计算 RAROC限额值 目标利润率/(经济资本分配系数*资本的成本率）
			// 计算 RAROC值 （执行利率-FTP价格-费用成本分摊率-减值准备率-净税率）/(经济资本分配系数*资本的成本率）
			if (jjzbRate == 0) {
				returnInfo.RAROC = "0";
				returnInfo.EVA = "0";
			} else {
				var raroc = (parseFloat(netRate) - parseFloat(ftpRate)
						- parseFloat(op1Rate) - parseFloat(op2Rate)
						- parseFloat(riskRate) - parseFloat(jsl))
						/ parseFloat(jjzbRate);
				returnInfo.RAROC = Math.floor(raroc * 100) / 100;
				var eva = parseFloat(mblrlRate) / parseFloat(jjzbRate);
				returnInfo.EVA = Math.floor(eva * 100) / 100;
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
 * 贷款、垫款、贴现 计算规则
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
 *         ------DQLJYE :剩余本金 -------------------------------------------------
 */
function CalculatorPdcs4calLoan(termTs, netRate, floatVaild, amountMoney,
		repayMentType, repayMentFreq, initload, failFunc) {
	var returnInfo = {
		STATUS : '1'
	};
	if (failFunc) {
		if ('' != termTs && !isNaN(termTs) && parseInt(termTs) > 0) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '合同期限天数格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != floatVaild && !isNaN(floatVaild)) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '实际优惠点差格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != netRate && !isNaN(netRate)) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '执行利率格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != amountMoney && !isNaN(amountMoney)
				&& parseFloat(amountMoney) > 0) {
		} else {
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
	var term = 1;
	// 将期限天数折算成月份
	term = Math.ceil(ts / 31);
	var mqts = 0;// 每期天数
	var cnt = 0;// 期数
	if (repayMentFreq == '1') { // 按月
		cnt = term;
		mqts = 31;
	} else if (repayMentFreq == '3') { // 按季
		cnt = Math.ceil(term / 3);
		mqts = 31 * 3;
	} else if (repayMentFreq == '6') { // 按半年
		cnt = Math.ceil(term / 6);
		mqts = 31 * 6;
	} else if (repayMentFreq == '12') { // 按年
		cnt = Math.ceil(term / 12);
		mqts = 31 * 12;
	}
	if (cnt == 0) {
		cnt = 1;
		mqts = ts;
	}
	var zflxze = 0; // 支付利息总额
	var yhlx = 0;// 优惠利息
	var hkze = 0; // 还款总额
	var mxlb = []; // 明细列表
	var zxlv = parseFloat(netRate); // 执行年利率
	var yhdc = parseFloat(floatVaild); // 实际优惠点差
	var dkje = parseFloat(amountMoney); // 贷款金额
	var hkpl = parseInt(repayMentFreq); // 还款频率
	var dqljye = dkje;// 当期累计余额，初始设置为贷款金额
	if (repayMentType == '1') {// 等额本息
		// 按照还款频率折算执行年利率
		var ylx = (zxlv * hkpl / 1200);
		var ljyhje = 0;// 累计已还本金
		for (var i = 0; i < cnt; i++) {// 循环期数
			var hkmx = {};
			var mylx = (dkje - ljyhje) * ylx;// 每期偿还利息
			zflxze = zflxze + mylx;// 计算利息总计
			// 每期优惠利息
			var myyhlx = (dkje - ljyhje) * (yhdc * hkpl / 1200);
			yhlx = yhlx + myyhlx;// 计算优惠利息总计
			var hbfxze = 0;// 每期月供金额
			var ratePow = Math.pow(ylx + 1, cnt);// 每期贷款利率
			// 每期还款月供金额
			hbfxze = (dkje * ylx * ratePow) / (ratePow - 1);
			var mybj = hbfxze - mylx;// 每月还款本金
			var sybj = dkje - ljyhje - mybj;// 剩余本金：贷款金额-已还款累计金额-当期还款本金
			if (sybj < 0) {
				sybj = 0;
			}
			hkmx.RN = (i + 1);// 期数
			// 偿还本金
			hkmx.CHBJ = Math.floor(mybj * 100) / 100;
			// 偿还利息
			hkmx.CHLX = Math.floor(mylx * 100) / 100;
			// 优惠利息
			hkmx.YHLX = Math.floor(myyhlx * 100) / 100;
			// 当期月供
			hkmx.DYYG = Math.floor(hbfxze * 100) / 100;
			// 剩余本金
			hkmx.SYBJ = Math.floor(sybj * 100) / 100;
			// 当期累计余额
			hkmx.DQLJYE = Math.floor(dqljye * mqts * 100) / 100;
			mxlb.push(hkmx);
			ljyhje = ljyhje + mybj;// 计算累计还款本金
			// 剩余贷款金额
			dqljye = dqljye - mybj;
		}
	} else if (repayMentType == '2') {// 等额本金
		var ljyhje = 0;// 累计已还本金
		// 按照还款频率折算执行年利率
		var ylx = zxlv * hkpl / 1200;
		// 每期偿还本金
		var bj = dkje / cnt;
		var ljyhje = 0; // 累计已还本金
		for (var i = 0; i < cnt; i++) {
			var mybj = bj;// 每月还款本金
			var mylx = (dkje - ljyhje) * ylx;// 每期偿还利息
			zflxze = zflxze + mylx;// 支付利息总额
			// 每期优惠利息
			var myyhlx = (dkje - ljyhje) * (yhdc * hkpl / 1200);
			yhlx = yhlx + myyhlx;// 优惠利息总额
			var hbfxze = mybj + mylx;// 每期月供金额
			var sybj = dkje - ljyhje - mybj;// 剩余本金：贷款金额-已还款累计金额-当期还款本金
			if (sybj < 0) {
				sybj = 0;
			}
			var hkmx = {};
			hkmx.RN = (i + 1);// 期数
			// 偿还本金
			hkmx.CHBJ = Math.floor(mybj * 100) / 100;
			// 偿还利息
			hkmx.CHLX = Math.floor(mylx * 100) / 100;
			// 优惠利息
			hkmx.YHLX = Math.floor(myyhlx * 100) / 100;
			// 当期月供
			hkmx.DYYG = Math.floor(hbfxze * 100) / 100;
			// 剩余本金
			hkmx.SYBJ = Math.floor(sybj * 100) / 100;
			// 当期累计余额
			hkmx.DQLJYE = Math.floor(dqljye * mqts * 100) / 100;
			mxlb.push(hkmx);
			ljyhje = ljyhje + mybj; // 累计已还本金
			// 剩余贷款金额
			dqljye = dqljye - mybj;
		}
	} else if (repayMentType == '3') {// 一次还本付息
		// 优惠利息
		yhlx = dkje * (yhdc * 0.01 * term / 12);
		// 支付利息总额
		zflxze = dkje * (zxlv * 0.01 * term / 12);
		var hbfxze = dkje + zflxze;// 月供金额
		var hkmx = {};
		hkmx.RN = 1;// 期数
		// 偿还本金
		hkmx.CHBJ = Math.floor(dkje * 100) / 100;
		// 偿还利息
		hkmx.CHLX = Math.floor(zflxze * 100) / 100;
		// 优惠利息
		hkmx.YHLX = Math.floor(yhlx * 100) / 100;
		// 当期月供
		hkmx.DYYG = Math.floor(hbfxze * 100) / 100;
		hkmx.SYBJ = 0;// 剩余本金
		// 当期累计余额
		hkmx.DQLJYE = Math.floor(dqljye * mqts * 100) / 100;
		mxlb.push(hkmx);
	} else if (repayMentType == '4') {// 分期还息、一次还本
		// 优惠利息
		yhlx = dkje * (yhdc * 0.01 * term / 12);
		// 支付利息总额
		zflxze = dkje * (zxlv * 0.01 * term / 12);
		// 每期偿还利息
		var mylx = zflxze / cnt;
		// 每期优惠利息
		var myyhlx = yhlx / cnt;
		for (var i = 0; i < cnt - 1; i++) {
			var hkmx = {};
			hkmx.RN = (i + 1); // 期数
			hkmx.CHBJ = 0; // 偿还本金
			// 偿还利息
			hkmx.CHLX = Math.floor(mylx * 100) / 100;
			// 优惠利息
			hkmx.YHLX = Math.floor(myyhlx * 100) / 100;
			// 当期月供
			hkmx.DYYG = Math.floor(mylx * 100) / 100;
			// 剩余本金
			hkmx.SYBJ = Math.floor(dkje * 100) / 100;
			// 当期累计余额
			hkmx.DQLJYE = Math.floor(dqljye * mqts * 100) / 100;
			mxlb.push(hkmx);
		}
		var hkmx = {};
		hkmx.RN = cnt;// 期数
		// 偿还本金
		hkmx.CHBJ = Math.floor(dkje * 100) / 100;
		// 偿还利息
		hkmx.CHLX = Math.floor(mylx * 100) / 100;
		// 优惠利息
		hkmx.YHLX = Math.floor(myyhlx * 100) / 100;
		// 当期月供
		hkmx.DYYG = Math.floor((dkje + mylx) * 100) / 100;
		// 剩余本金
		hkmx.SYBJ = 0;
		// 当期累计余额
		hkmx.DQLJYE = Math.floor(dqljye * mqts * 100) / 100;
		mxlb.push(hkmx);
	}
	hkze = dkje + zflxze;// 计算还款总额:贷款金额+支付利息
	returnInfo.LIST = mxlb; // 还款明细计划表
	// 还款总额
	returnInfo.HKZE = Math.floor(hkze * 100) / 100;
	// 支付利息
	returnInfo.ZFLX = Math.floor(zflxze * 100) / 100;
	// 优惠利息
	returnInfo.YHLX = Math.floor(yhlx * 100) / 100;
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
 *            执行利率%
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
		if ('' != termTs && !isNaN(termTs) && parseInt(termTs) > 0) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '天数格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != netRate && !isNaN(netRate)) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '执行利率格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != amountMoney || !isNaN(amountMoney)
				&& parseFloat(amountMoney) >= 0) {
		} else {
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
	// 利息金额 = 金额 * 期限天数 * 日利率【执行利率% * 0.01 / 365】
	var lxje = parseFloat(amountMoney) * parseInt(termTs)
			* (parseFloat(netRate) * 0.01 / 365);
	var bxhj = parseFloat(amountMoney) + lxje;// 本息合计
	// 利息金额
	returnInfo.SDLX = Math.floor(lxje * 100) / 100;
	returnInfo.LXSJE = 0;// 利息税金额
	// 本息合计
	returnInfo.BXHJ = Math.floor(bxhj * 100) / 100;
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
		if ('' != termTs && !isNaN(termTs) && parseInt(termTs) > 0) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '期限天数格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != periods && !isNaN(periods) && parseInt(periods) > 0) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '转存期数格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != netRate && !isNaN(netRate)) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '执行利率格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != amountMoney && !isNaN(amountMoney)
				&& parseFloat(amountMoney) > 0) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '初始存入金额格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
	}
	// ∑每期转存金额
	var zcjes = 0;
	var jyje = parseFloat(amountMoney); // 初始存入金额
	// 一期利息金额
	var lxje = jyje * (parseInt(termTs) * parseFloat(netRate) * 0.01 / 365);
	var bxhj = jyje + lxje;// 一期本息合计
	// 一期利息金额
	returnInfo.YQLXJE = Math.floor(lxje * 100) / 100;
	// 一期利息税金额
	returnInfo.YQLXSJ = 0;
	// 一期本息合计
	returnInfo.YQBXHJ = Math.floor(bxhj * 100) / 100;
	// 每期转存金额
	zcjes = parseFloat(zcjes) + parseFloat(jyje);

	var zcqs = parseInt(periods);
	var zcje = jyje;
	var zclx = 0;

	var sqje = jyje;// 上期本金
	var sqlx = lxje;// 上期利息
	for (var i = 0; i < zcqs; i++) {
		// 汇总数据 + 上期本金 + 上期利息
		zcjes = parseFloat(zcjes) + parseFloat(sqje) + parseFloat(sqlx);
		var lx = zcje * (parseInt(termTs) * parseFloat(netRate) * 0.01 / 365);
		sqje = zcje;// 当前期本金
		sqlx = lx;// 当前期利息

		zclx = zclx + lx; // 多期利息金额
		zcje = zcje + lx; // 多期转存本金
	}
	// 转存多期利息金额
	returnInfo.DQLXJE = Math.floor(zclx * 100) / 100;
	returnInfo.DQLXSJ = 0;// 转存多期利息税金额
	// 转存多期本息合计
	returnInfo.DQBXHJ = Math.floor((jyje + zclx) * 100) / 100;
	// ∑每期转存金额
	returnInfo.ZCJES = Math.floor(zcjes * 100) / 100;
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
		if ('' != termTs && !isNaN(termTs) && parseInt(termTs) > 0) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '天数格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != netRate && !isNaN(netRate)) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '执行利率格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != amountMoney && !isNaN(amountMoney)
				&& parseFloat(amountMoney) > 0) {
		} else {
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
	// 支取次数
	var cnt = Math.ceil(parseInt(termTs) / (31 * parseInt(drawFreq)));
	if (cnt == 0) {
		cnt = 1;
	}
	var jyje = parseFloat(amountMoney);// 初始存入金额
	// 执行年利率转换成日利率
	var dayRate = parseFloat(netRate) * 0.01 / 365;
	// 每次支取本金
	var zqbj = jyje / cnt;
	var lxje = 0;// 利息金额
	for (var i = 0; i < cnt; i++) {
		var bqbj = jyje - i * zqbj;// 本期本金
		var fsts = i * parseInt(drawFreq) * 31;// 已发生天数
		var lx;
		if (i == (cnt - 1)) {
			lx = bqbj * dayRate * (parseInt(termTs) - fsts); // 最后一期利息计算
		} else {
			lx = bqbj * dayRate * (parseInt(drawFreq) * 31);// 每期利息计算
		}
		lxje = lxje + lx;
	}
	var bxhj = jyje + lxje; // 本息合计
	// 利息金额
	returnInfo.SDLX = Math.floor(lxje * 100) / 100;
	returnInfo.LXSJE = 0;// 利息税金额
	// 本息合计
	returnInfo.BXHJ = Math.floor(bxhj * 100) / 100;
	// 每次支取本金
	returnInfo.ZQBJ = Math.floor(zqbj * 100) / 100;
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
		if ('' != termTs && !isNaN(termTs) && parseInt(termTs) > 0) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '天数格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != netRate && !isNaN(netRate)) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '执行利率格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != amountMoney && !isNaN(amountMoney)
				&& parseFloat(amountMoney) > 0) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '初始入金额格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != drawMoney && !isNaN(drawMoney) && parseFloat(drawMoney) > 0) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '月存入金额格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
	}
	var jyje = parseFloat(amountMoney);// 初始存入金额
	// 期限月数
	var cnt = Math.ceil(parseInt(termTs) / 31);
	if (cnt == 0) {
		cnt = 1;
	}
	// 执行年利率转换成日利率
	var dayRate = parseFloat(netRate) * 0.01 / 365;
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
	// 利息金额
	returnInfo.SDLX = Math.floor(lxje * 100) / 100;
	returnInfo.LXSJE = 0;// 利息税金额
	// 本息合计
	returnInfo.BXHJ = Math.floor(bxhj * 100) / 100;
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
 *         STATUS ='1' 时正常，其他异常 ；MSG异常说明 ； SDLX:利息金额, LXSJE:利息税金额,
 *         BXHJ:本息合计,ZQLX:每次支取利息
 */
function CalculatorPdcs4calDeposit5(termTs, netRate, amountMoney, drawFreq,
		initload, failFunc) {
	var returnInfo = {
		STATUS : '1'
	};
	if (failFunc) {
		if ('' != termTs && !isNaN(termTs) && parseInt(termTs) > 0) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '天数格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != netRate && !isNaN(netRate)) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '执行利率格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != amountMoney && !isNaN(amountMoney)
				&& parseFloat(amountMoney) > 0) {
		} else {
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
	// 支取期数
	var cnt = Math.ceil(parseInt(termTs) / (31 * parseInt(drawFreq)));
	if (cnt == 0) {
		cnt = 1;
	}
	var jyje = parseFloat(amountMoney); // 初始存入金额
	// 执行年利率转换成日利率
	var dayRate = parseFloat(netRate) * 0.01 / 365;
	var lxje = jyje * dayRate * parseInt(termTs);// 利息金额
	// 每次支取利息 利息金额/支取期数
	var zqlx = lxje / cnt;

	var bxhj = jyje + lxje;// 本息合计
	// 利息金额
	returnInfo.SDLX = Math.floor(lxje * 100) / 100;
	returnInfo.LXSJE = 0;// 利息税金额
	// 本息合计
	returnInfo.BXHJ = Math.floor(bxhj * 100) / 100;
	// 每次支取利息
	returnInfo.ZQLX = Math.floor(zqlx * 100) / 100;
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
 *         STATUS ='1' 时正常，其他异常 ；MSG异常说明 ； ZQLX:每次支取利息 LXJE:利息金额 BXHJ:本息合计
 */
function CalculatorPdcs4calTy(termTs, netRate, amountMoney, drawType, drawFreq,
		initload, failFunc) {
	var returnInfo = {
		STATUS : '1'
	};
	if (failFunc) {
		if ('' != termTs && !isNaN(termTs) && parseInt(termTs) > 0) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '合同期限天数格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != netRate && !isNaN(netRate)) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '执行利率格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != amountMoney && !isNaN(amountMoney)
				&& parseFloat(amountMoney) > 0) {
		} else {
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
	var cnt = 0;// 还息、付息期数

	if ('3' == drawType) {
		cnt = 1;
	} else {
		cnt = Math.ceil(parseInt(termTs) / (31 * parseInt(drawFreq)));
	}
	if (cnt == 0) {
		cnt = 1;
	}
	var jyje = parseFloat(amountMoney);// 交易金额
	// 执行年利率转换成日利率
	var dayRate = parseFloat(netRate) * 0.01 / 365;
	var lx = jyje * dayRate * parseInt(termTs);// 利息总额
	// 每次支取利息
	var mqlx = lx / cnt;
	var bxhj = jyje + lx;
	// 每次支取利息
	returnInfo.ZQLX = Math.floor(mqlx * 100) / 100;
	// 利息金额
	returnInfo.LXJE = Math.floor(lx * 100) / 100;
	// 本息合计
	returnInfo.BXHJ = Math.floor(bxhj * 100) / 100;
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
		if ('' != termTs && !isNaN(termTs) && parseInt(termTs) > 0) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '合同期限天数格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != netRate && !isNaN(netRate)) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '执行利率格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != receiptRate && !isNaN(receiptRate)) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '票面利率格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != amountMoney && !isNaN(amountMoney)
				&& parseFloat(amountMoney) > 0) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '交易金额格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != receiptMoney && !isNaN(receiptMoney)
				&& parseFloat(receiptMoney) > 0) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '票面金额格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
	}
	var jyje = parseFloat(amountMoney); // 交易金额
	var pmje = parseFloat(receiptMoney); // 票面金额
	var pmlv = parseFloat(receiptRate);// 票面利率
	// 持有期间票面利息 : 票面金额*票面利率/360*合同期限
	var zyqjpmlx = pmje * (pmlv * 0.01 / 365) * parseInt(termTs);
	// 持有期间收益 ： 交易金额*执行利率*合同期限，合同期限如果小于1年，执行利率转化为月利率或者日利率。
	var cyqjsy = jyje * (parseFloat(netRate) * 0.01 / 365) * parseInt(termTs);
	// 本息合计 : 交易金额+持有期间收益
	var bxhj = jyje + cyqjsy;
	// 持有期间票面利息
	returnInfo.ZYQJPMLX = Math.floor(zyqjpmlx * 100) / 100;
	// 持有期间收益
	returnInfo.CYQJSY = Math.floor(cyqjsy * 100) / 100;
	// 本息合计
	returnInfo.BXHJ = Math.floor(bxhj * 100) / 100;
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
		if ('' != termTs && !isNaN(termTs) && parseInt(termTs) > 0) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '合同期限天数格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != remainderTermTs && !isNaN(remainderTermTs)
				&& parseInt(remainderTermTs) > 0) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '合同期限剩余天数格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != netRate && !isNaN(netRate)) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '执行利率格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != nominalMoney && !isNaN(nominalMoney)) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '债券面值-单张格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != sellPrice && !isNaN(sellPrice)) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '卖出价格-单张格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != publishPrice && !isNaN(publishPrice)) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '发行价格-单张格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != nominalRate && !isNaN(nominalRate)) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '票面利率格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != buyPrice && !isNaN(buyPrice)) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '买入价格-单张格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != buyNum && !isNaN(buyNum) && parseInt(buyNum) > 0) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '购买数量数格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
	}
	// 剩余期限（年）= 合同期限剩余天数 / 365
	var synx = parseInt(remainderTermTs) / parseFloat(365);
	// 合同剩余期限(年)
	var qxnx = parseInt(termTs) / parseFloat(365);
	// 合同期限(年)
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
		returnInfo.MRFGZQCYQJSY = Math.floor(mrfgzqcyqjsy * 100) / 100;
	}
	// 卖出回购债券持有期间支付利息 当四级产品为3030201-债券正回购时该字段有值；卖出价格*购买数量*执行利率*合同期限
	if ('2' == flag) {
		var mchgzqcyqjzflx = parseFloat(sellPrice) * parseInt(buyNum)
				* parseFloat(netRate) * 0.01 * qxnx;
		returnInfo.MCHGZQCYQJZFLX = Math.floor(mchgzqcyqjzflx * 100) / 100;
	}
	// 本息合计 交易金额+持有期间收益
	var bxhj = parseFloat(buyPrice) * parseInt(buyNum) + cyqjsy;
	returnInfo.ZQGMSYL = Math.floor(zqgmsyl * 100) / 100;
	returnInfo.ZQCSSYL = Math.floor(zqcssyl * 100) / 100;
	returnInfo.CYQJSYL = Math.floor(cyqjsyl * 100) / 100;
	returnInfo.CYQJSY = Math.floor(cyqjsy * 100) / 100;
	returnInfo.CYQJPMLX = Math.floor(cyqjpmlx * 100) / 100;
	returnInfo.BXHJ = Math.floor(bxhj * 100) / 100;
	if (initload) {
		initload.call(this, returnInfo);
	}
	return returnInfo;
}

/**
 * 整存零取类计算规则
 * 
 * @param _rateBjrq
 *            报价日期
 * @param _termQxbm
 *            期限编码
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
function CalculatorPdcs4calLumpZero(_rateBjrq, _termQxbm, netRate, amountMoney,
		drawFreq, initload, failFunc) {
	var returnInfo = {
		STATUS : '1'
	};
	if (failFunc) {
		if ('' != _rateBjrq) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '报价日期信息格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != termTs && !isNaN(_termQxbm) && parseInt(_termQxbm) > 0) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '期限信息格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != netRate && !isNaN(netRate)) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '执行利率格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != amountMoney && !isNaN(amountMoney)
				&& parseFloat(amountMoney) > 0) {
		} else {
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
	var termQxbm = parseInt(_termQxbm);

	var _year = 0;
	var _month = 0;
	var _day = 0;
	var cnt = 0;// 支取次数
	// 计算期限的年数月数天数以及支取次数
	if (termQxbm >= 300) {// 年
		_year = termQxbm % 300;
		cnt = _year * 12 / parseInt(drawFreq);
	} else if (termQxbm >= 200) {// 月
		_month = termQxbm % 200;
		if (_month % parseInt(drawFreq) == 0) {
			cnt = _month / parseInt(drawFreq);
		} else {
			cnt = _month / parseInt(drawFreq) + 1;
		}
	} else if (termQxbm >= 100) {// 日
		_day = termQxbm % 100;
		cnt = 1;
	} else {
		_day = termQxbm;
		cnt = 1;
	}
	if (cnt == 0) {
		cnt = 1;
	}
	var _rateBjrqDate = new Date(Date.parse(_rateBjrq));// 报价日期
	var _dqrq = new Date();// 到期日期
	_dqrq.setFullYear(_rateBjrqDate.getFullYear() + parseInt(_year));
	_dqrq.setMonth(_rateBjrqDate.getMonth() + parseInt(_month));
	_dqrq.setDate(_rateBjrqDate.getDate() + parseInt(_day));
	_dqrq.setHours(0);
	_dqrq.setMinutes(0);
	_dqrq.setSeconds(0);
	_dqrq.setMilliseconds(0);
	var jyje = parseFloat(amountMoney);// 初始存入金额
	// 执行年利率转换成日利率
	var dayRate = parseFloat(netRate) * 0.01 / 365;
	// 每次支取本金
	var zqbj = jyje / cnt;
	var lxje = 0;// 利息金额
	// 分期开始日
	var _mqksr = _rateBjrqDate;
	// 分期到期日
	var _mqdqr = new Date();
	_mqdqr.setFullYear(_mqksr.getFullYear());
	_mqdqr.setMonth(_mqksr.getMonth() + parseInt(drawFreq));
	_mqdqr.setDate(_mqksr.getDate());
	_mqdqr.setHours(0);
	_mqdqr.setMinutes(0);
	_mqdqr.setSeconds(0);
	_mqdqr.setMilliseconds(0);
	for (var i = 0; i < cnt; i++) {
		var bqbj = jyje - i * zqbj;// 本期本金
		var bqts = 0;// 本期天数
		var bqlx = 0;// 本期利息
		if (i == (cnt - 1)) {// 最后一期
			bqts = Math.ceil(Math.abs(_dqrq.getTime() - _mqksr.getTime())
					/ (1000 * 60 * 60 * 24));
		} else {
			bqts = Math.ceil(Math.abs(_mqdqr.getTime() - _mqksr.getTime())
					/ (1000 * 60 * 60 * 24));
		}
		bqlx = bqbj * dayRate * bqts;
		lxje = lxje + bqlx;
		// 将上期到期日赋值给下期开始日
		_mqksr = _mqdqr;
		_mqdqr = new Date();
		_mqdqr.setFullYear(_mqksr.getFullYear());
		_mqdqr.setMonth(_mqksr.getMonth() + parseInt(drawFreq));
		_mqdqr.setDate(_mqksr.getDate());
		_mqdqr.setHours(0);
		_mqdqr.setMinutes(0);
		_mqdqr.setSeconds(0);
	}
	var bxhj = jyje + lxje; // 本息合计
	// 利息金额
	returnInfo.SDLX = Math.floor(lxje * 100) / 100;
	returnInfo.LXSJE = 0;// 利息税金额
	// 本息合计
	returnInfo.BXHJ = Math.floor(bxhj * 100) / 100;
	// 每次支取本金
	returnInfo.ZQBJ = Math.floor(zqbj * 100) / 100;
	if (initload) {
		initload.call(this, returnInfo);
	}
	return returnInfo;
}

/**
 * 整存整取类计算规则
 * 
 * @param _rateBjrq
 *            报价日期
 * @param _termQxbm
 *            期限编码
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
function CalculatorPdcs4calLumpSum(_rateBjrq, _termQxbm, netRate, amountMoney,
		periods, initload, failFunc) {
	var returnInfo = {
		STATUS : '1'
	};
	if (failFunc) {
		if ('' != _rateBjrq) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '报价日期信息格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != _termQxbm && !isNaN(_termQxbm) && parseInt(_termQxbm) > 0) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '期限信息格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != periods && !isNaN(periods) && parseInt(periods) > 0) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '转存期数格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != netRate && !isNaN(netRate)) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '执行利率格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != amountMoney && !isNaN(amountMoney)
				&& parseFloat(amountMoney) > 0) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '初始存入金额格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
	}
	var termQxbm = parseInt(_termQxbm);
	var _year = 0;
	var _month = 0;
	var _day = 0;
	if (termQxbm >= 300) {// 年
		_year = termQxbm % 300;
	} else if (termQxbm >= 200) {// 月
		_month = termQxbm % 200;
	} else if (termQxbm >= 100) {// 日
		_day = termQxbm % 100;
	} else {
		_day = termQxbm;
	}
	// 执行年利率转换成日利率
	var dayRate = parseFloat(netRate) * 0.01 / 365;
	// 本期开始日期
	var _bqksrq = new Date(Date.parse(_rateBjrq));
	// 本期到期日期
	var _bqdqrq = new Date();
	_bqdqrq.setFullYear(_bqksrq.getFullYear() + parseInt(_year));
	_bqdqrq.setMonth(_bqksrq.getMonth() + parseInt(_month));
	_bqdqrq.setDate(_bqksrq.getDate() + parseInt(_day));
	_bqdqrq.setHours(0);
	_bqdqrq.setMinutes(0);
	_bqdqrq.setSeconds(0);
	_bqdqrq.setMilliseconds(0);
	// 本期天数
	var _termTs = Math.ceil(Math.abs((_bqdqrq.getTime() - _bqksrq.getTime()))
			/ (1000 * 60 * 60 * 24));
	var jyje = parseFloat(amountMoney); // 初始存入金额
	// 一期利息金额
	var lxje = jyje * dayRate * _termTs;
	var bxhj = jyje + lxje;// 一期本息合计
	// 一期利息金额
	returnInfo.YQLXJE = Math.floor(lxje * 100) / 100;
	// 一期利息税金额
	returnInfo.YQLXSJ = 0;
	// 一期本息合计
	returnInfo.YQBXHJ = Math.floor(bxhj * 100) / 100;
	// ∑每期转存金额
	var zcjes = 0;
	// 每期转存金额
	zcjes = parseFloat(zcjes) + parseFloat(jyje);

	// 转存期数
	var zcqs = parseInt(periods);
	var zcje = jyje;// 多期转存金额
	var zclx = lxje;// 多期转存利息

	var sqje = jyje;// 上期本金
	var sqlx = lxje;// 上期利息
	for (var i = 0; i < zcqs; i++) {
		// 汇总数据 + 上期本金 + 上期利息
		zcjes = parseFloat(zcjes) + parseFloat(sqje) + parseFloat(sqlx);
		// 当期本金 = 上期本金 + 上期利息
		var bqbj = parseFloat(sqje) + parseFloat(sqlx);
		// 本期天数 = 本期到期日-本期开始日
		var bqts = 0;
		// 本期开始日期 = 上期到日期
		_bqksrq = _bqdqrq;
		_bqdqrq = new Date();
		_bqdqrq.setFullYear(_bqksrq.getFullYear() + parseInt(_year));
		_bqdqrq.setMonth(_bqksrq.getMonth() + parseInt(_month));
		_bqdqrq.setDate(_bqksrq.getDate() + parseInt(_day));
		_bqdqrq.setHours(0);
		_bqdqrq.setMinutes(0);
		_bqdqrq.setSeconds(0);
		_bqdqrq.setMilliseconds(0);
		bqts = Math.ceil(Math.abs((_bqdqrq.getTime() - _bqksrq.getTime()))
				/ (1000 * 60 * 60 * 24));
		// 本期利息 = 本期金额 * 日利率 * 天数
		var bqlx = bqbj * dayRate * bqts;
		sqje = bqbj;
		sqlx = bqlx;
		zcje = zcje + bqlx; // 多期转存本金
		zclx = zclx + bqlx; // 多期利息金额
	}
	// 转存多期利息金额
	returnInfo.DQLXJE = Math.floor(zclx * 100) / 100;
	returnInfo.DQLXSJ = 0;// 转存多期利息税金额
	// 转存多期本息合计
	returnInfo.DQBXHJ = Math.floor((jyje + zclx) * 100) / 100;
	// ∑每期转存金额
	returnInfo.ZCJES = Math.floor(zcjes * 100) / 100;
	if (initload) {
		initload.call(this, returnInfo);
	}
	return returnInfo;
}

/**
 * 零存整取类计算规则
 * 
 * @param _rateBjrq
 *            报价日期
 * @param _termQxbm
 *            期限编码
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
function CalculatorPdcs4calZeroLump(_rateBjrq, _termQxbm, netRate, amountMoney,
		drawMoney, initload, failFunc) {
	var returnInfo = {
		STATUS : '1'
	};
	if (failFunc) {
		if ('' != _rateBjrq) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '报价日期信息格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != _termQxbm && !isNaN(_termQxbm) && parseInt(_termQxbm) > 0) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '期限信息格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != netRate && !isNaN(netRate)) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '执行利率格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != amountMoney && !isNaN(amountMoney)
				&& parseFloat(amountMoney) > 0) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '初始入金额格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != drawMoney && !isNaN(drawMoney) && parseFloat(drawMoney) > 0) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '月存入金额格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
	}
	var termQxbm = parseInt(_termQxbm);
	var _year = 0;
	var _month = 0;
	var _day = 0;
	var cnt = 0;
	if (termQxbm >= 300) {// 年
		_year = termQxbm % 300;
		cnt = _year * 12;
	} else if (termQxbm >= 200) {// 月
		_month = termQxbm % 200;
		cnt = _month;
	} else if (termQxbm >= 100) {// 日
		_day = termQxbm % 100;
		cnt = 1;
	} else {
		_day = termQxbm;
		cnt = 1;
	}
	if (cnt == 0) {
		cnt = 1;
	}
	// 执行年利率转换成日利率
	var dayRate = parseFloat(netRate) * 0.01 / 365;
	var jyje = parseFloat(amountMoney);// 初始存入金额
	var lxje = 0;// 利息金额
	var ljbj = 0;// 累计本金
	// 本期开始日期
	var _bqksrq = new Date(Date.parse(_rateBjrq));
	_bqksrq.setHours(0);
	_bqksrq.setMinutes(0);
	_bqksrq.setSeconds(0);
	_bqksrq.setMilliseconds(0);
	for (var i = 0; i < cnt; i++) {
		var _bqdqrq = new Date();
		_bqdqrq.setFullYear(_bqksrq.getFullYear());
		_bqdqrq.setMonth(_bqksrq.getMonth() + 1);
		_bqdqrq.setDate(_bqksrq.getDate());
		_bqdqrq.setHours(0);
		_bqdqrq.setMinutes(0);
		_bqdqrq.setSeconds(0);
		_bqdqrq.setMilliseconds(0);
		var bqts = 0;// 本期天数
		var bqlx = 0;
		if (i == (cnt - 1)) {// 最后一期 到期日-本期开始日期
			// 到期日期
			var _dqrq = new Date();
			_dqrq.setFullYear(_bqksrq.getFullYear() + parseInt(_year));
			_dqrq.setMonth(_bqksrq.getMonth() + parseInt(_month));
			_dqrq.setDate(_bqksrq.getDate() + parseInt(_day));
			_dqrq.setHours(0);
			_dqrq.setMinutes(0);
			_dqrq.setSeconds(0);
			_dqrq.setMilliseconds(0);
			bqts = Math.ceil(Math.abs((_dqrq.getTime() - _bqksrq.getTime()))
					/ (1000 * 60 * 60 * 24));
		} else {// 本期结束日期-本期开始日期
			bqts = Math.ceil(Math.abs((_bqdqrq.getTime() - _bqksrq.getTime()))
					/ (1000 * 60 * 60 * 24));
		}
		ljbj = jyje + i * parseFloat(drawMoney);// 本期本金
		var lx = ljbj * dayRate * bqts;// 本期利息
		lxje = lxje + lx;
		_bqksrq = _bqdqrq;// 赋值当前期到期日为下一期的开始日期
	}
	var bxhj = ljbj + lxje;// 本息合计
	// 利息金额
	returnInfo.SDLX = Math.floor(lxje * 100) / 100;
	returnInfo.LXSJE = 0;// 利息税金额
	// 本息合计
	returnInfo.BXHJ = Math.floor(bxhj * 100) / 100;
	if (initload) {
		initload.call(this, returnInfo);
	}
	return returnInfo;
}

/**
 * 存本取息类计算规则
 * 
 * @param _rateBjrq
 *            报价日期
 * @param _termQxbm
 *            期限编码
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
 *         STATUS ='1' 时正常，其他异常 ；MSG异常说明 ； SDLX:利息金额, LXSJE:利息税金额,
 *         BXHJ:本息合计,ZQLX:每次支取利息
 */
function CalculatorPdcs4calCorpus(_rateBjrq, _termQxbm, netRate, amountMoney,
		drawFreq, initload, failFunc) {
	var returnInfo = {
		STATUS : '1'
	};
	if (failFunc) {
		if ('' != _rateBjrq) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '报价日期信息格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != _termQxbm && !isNaN(_termQxbm) && parseInt(_termQxbm) > 0) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '期限信息格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != netRate && !isNaN(netRate)) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '执行利率格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != amountMoney && !isNaN(amountMoney)
				&& parseFloat(amountMoney) > 0) {
		} else {
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
	var termQxbm = parseInt(_termQxbm);
	var _year = 0;
	var _month = 0;
	var _day = 0;
	var cnt = 0;// 支取期数
	if (termQxbm >= 300) {// 年
		_year = termQxbm % 300;
		cnt = _year * 12 / parseInt(drawFreq);
	} else if (termQxbm >= 200) {// 月
		_month = termQxbm % 200;
		if (_month % parseInt(drawFreq) == 0) {
			cnt = _month / parseInt(drawFreq);
		} else {
			cnt = _month / parseInt(drawFreq) + 1;
		}
	} else if (termQxbm >= 100) {// 日
		_day = termQxbm % 100;
		cnt = 1;
	} else {
		_day = termQxbm;
		cnt = 1;
	}
	if (cnt == 0) {
		cnt = 1;
	}
	// 开始日期
	var _bqksrq = new Date(Date.parse(_rateBjrq));
	_bqksrq.setHours(0);
	_bqksrq.setMinutes(0);
	_bqksrq.setSeconds(0);
	_bqksrq.setMilliseconds(0);
	// 到期日期
	var _bqdqrq = new Date();
	_bqdqrq.setFullYear(_bqksrq.getFullYear() + parseInt(_year));
	_bqdqrq.setMonth(_bqksrq.getMonth() + parseInt(_month));
	_bqdqrq.setDate(_bqksrq.getDate() + parseInt(_day));
	_bqdqrq.setHours(0);
	_bqdqrq.setMinutes(0);
	_bqdqrq.setSeconds(0);
	_bqdqrq.setMilliseconds(0);
	var termTs = Math.ceil(Math.abs((_bqdqrq.getTime() - _bqksrq.getTime()))
			/ (1000 * 60 * 60 * 24));
	// 执行年利率转换成日利率
	var dayRate = parseFloat(netRate) * 0.01 / 365;
	var jyje = parseFloat(amountMoney); // 初始存入金额
	var lxje = jyje * dayRate * parseInt(termTs);// 利息金额
	// 每次支取利息 利息金额/支取期数
	var zqlx = lxje / cnt;
	var bxhj = jyje + lxje;// 本息合计
	// 利息金额
	returnInfo.SDLX = Math.floor(lxje * 100) / 100;
	returnInfo.LXSJE = 0;// 利息税金额
	// 本息合计
	returnInfo.BXHJ = Math.floor(bxhj * 100) / 100;
	// 每次支取利息
	returnInfo.ZQLX = Math.floor(zqlx * 100) / 100;
	if (initload) {
		initload.call(this, returnInfo);
	}
	return returnInfo;
}

/**
 * 贷款、垫款、贴现 计算规则
 * 
 * @param _rateBjrq
 *            报价日期
 * @param _termQxbm
 *            期限编码
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
 *         ------DQLJYE :当期累计余额 -----------------------------------------------
 */
function CalculatorPdcs4calLoanBuss(_rateBjrq, _termQxbm, netRate, floatVaild,
		amountMoney, repayMentType, repayMentFreq, initload, failFunc) {
	var returnInfo = {
		STATUS : '1'
	};
	if (failFunc) {
		if ('' != _rateBjrq) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '报价日期信息格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != _termQxbm && !isNaN(_termQxbm) && parseInt(_termQxbm) > 0) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '期限信息格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != floatVaild && !isNaN(floatVaild)) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '实际优惠点差格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != netRate && !isNaN(netRate)) {
		} else {
			returnInfo.STATUS = '2';
			returnInfo.MSG = '执行利率格式错误';
			failFunc.call(this, returnInfo);
			return returnInfo;
		}
		if ('' != amountMoney && !isNaN(amountMoney)
				&& parseFloat(amountMoney) > 0) {
		} else {
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
	var termQxbm = parseInt(_termQxbm);
	var _year = 0;
	var _month = 0;
	var _day = 0;
	var _termMonths = 0;// 合同总月份
	if (termQxbm >= 300) {// 年
		_year = termQxbm % 300;
		_termMonths = _year * 12;
	} else if (termQxbm >= 200) {// 月
		_month = termQxbm % 200;
		_termMonths = _month;
	} else if (termQxbm >= 100) {// 日
		_day = termQxbm % 100;
		_termMonths = 1;
	} else {
		_day = termQxbm;
		_termMonths = 1;
	}
	// 合同开始日期
	var _ksrq = new Date(Date.parse(_rateBjrq));
	// 合同到期日期
	var _dqrq = new Date();
	_dqrq.setFullYear(_ksrq.getFullYear() + parseInt(_year));
	_dqrq.setMonth(_ksrq.getMonth() + parseInt(_month));
	_dqrq.setDate(_ksrq.getDate() + parseInt(_day));
	_dqrq.setHours(0);
	_dqrq.setMinutes(0);
	_dqrq.setSeconds(0);
	_dqrq.setMilliseconds(0);
	// 合同期限天数
	var _termTs = Math.ceil(Math.abs((_dqrq.getTime() - _ksrq.getTime()))
			/ (1000 * 60 * 60 * 24));
	var cnt = 0;// 合同期数
	if (repayMentFreq == '1') { // 按月
		cnt = _termMonths;
	} else if (repayMentFreq == '3') { // 按季
		if (_termMonths % 3 == 0) {
			cnt = _termMonths / 3;
		} else {
			cnt = _termMonths / 3 + 1;
		}
	} else if (repayMentFreq == '6') { // 按半年
		if (_termMonths % 6 == 0) {
			cnt = _termMonths / 6;
		} else {
			cnt = _termMonths / 6 + 1;
		}
	} else if (repayMentFreq == '12') { // 按年
		if (_termMonths % 12 == 0) {
			cnt = _termMonths / 12;
		} else {
			cnt = _termMonths / 12 + 1;
		}
	}
	if (cnt == 0) {
		cnt = 1;
	}
	var zflxze = 0; // 支付利息总额
	var yhlx = 0;// 优惠利息
	var hkze = 0; // 还款总额
	var mxlb = []; // 明细列表
	var zxlv = parseFloat(netRate); // 执行年利率
	var yhdc = parseFloat(floatVaild); // 实际优惠点差
	var dkje = parseFloat(amountMoney); // 贷款金额
	var hkpl = parseInt(repayMentFreq); // 还款频率
	var dqljye = dkje;// 当期累计余额，初始设置为贷款金额
	var _bqksrq = _ksrq;// 本期开始日期
	if (repayMentType == '1') {// 等额本息
		// 按照还款频率折算执行年利率
		var ylx = (zxlv * hkpl / 1200);
		var ljyhje = 0;// 累计已还本金
		for (var i = 0; i < cnt; i++) {// 循环期数
			var hkmx = {};
			var mylx = (dkje - ljyhje) * ylx;// 每期偿还利息
			zflxze = zflxze + mylx;// 计算利息总计
			// 每期优惠利息
			var myyhlx = (dkje - ljyhje) * (yhdc * hkpl / 1200);
			yhlx = yhlx + myyhlx;// 计算优惠利息总计
			var hbfxze = 0;// 每期月供金额
			var ratePow = Math.pow(ylx + 1, cnt);// 每期贷款利率
			// 每期还款月供金额
			hbfxze = (dkje * ylx * ratePow) / (ratePow - 1);
			var mybj = hbfxze - mylx;// 每月还款本金
			var sybj = dkje - ljyhje - mybj;// 剩余本金：贷款金额-已还款累计金额-当期还款本金
			if (sybj < 0) {
				sybj = 0;
			}
			hkmx.RN = (i + 1);// 期数
			// 偿还本金
			hkmx.CHBJ = Math.floor(mybj * 100) / 100;
			// 偿还利息
			hkmx.CHLX = Math.floor(mylx * 100) / 100;
			// 优惠利息
			hkmx.YHLX = Math.floor(myyhlx * 100) / 100;
			// 当期月供
			hkmx.DYYG = Math.floor(hbfxze * 100) / 100;
			// 剩余本金
			hkmx.SYBJ = Math.floor(sybj * 100) / 100;
			// 当期累计余额
			var _mqts = 0;
			// 计算每期天数
			if (i == (cnt - 1)) {// 最后一期
				_mqts = Math.ceil(Math
						.abs((_dqrq.getTime() - _bqksrq.getTime()))
						/ (1000 * 60 * 60 * 24));
			} else {
				var _bqdqrq = new Date();// 本期结束日期
				_bqdqrq.setFullYear(_bqksrq.getFullYear());
				_bqdqrq.setMonth(_bqksrq.getMonth() + parseInt(hkpl));
				_bqdqrq.setDate(_bqksrq.getDate());
				_bqdqrq.setHours(0);
				_bqdqrq.setMinutes(0);
				_bqdqrq.setSeconds(0);
				_bqdqrq.setMilliseconds(0);
				_mqts = Math.ceil(Math.abs((_bqdqrq.getTime() - _bqksrq
						.getTime()))
						/ (1000 * 60 * 60 * 24));
				_bqksrq = _bqdqrq;// 将当期的到期日赋值于下期的开始日期
			}
			hkmx.DQLJYE = Math.floor(dqljye * _mqts * 100) / 100;
			mxlb.push(hkmx);
			ljyhje = ljyhje + mybj;// 计算累计还款本金
			// 剩余贷款金额
			dqljye = dqljye - mybj;
		}
	} else if (repayMentType == '2') {// 等额本金
		var ljyhje = 0;// 累计已还本金
		// 按照还款频率折算执行年利率
		var ylx = zxlv * hkpl / 1200;
		// 每期偿还本金
		var bj = dkje / cnt;
		var ljyhje = 0; // 累计已还本金
		for (var i = 0; i < cnt; i++) {
			var mybj = bj;// 每月还款本金
			var mylx = (dkje - ljyhje) * ylx;// 每期偿还利息
			zflxze = zflxze + mylx;// 支付利息总额
			// 每期优惠利息
			var myyhlx = (dkje - ljyhje) * (yhdc * hkpl / 1200);
			yhlx = yhlx + myyhlx;// 优惠利息总额
			var hbfxze = mybj + mylx;// 每期月供金额
			var sybj = dkje - ljyhje - mybj;// 剩余本金：贷款金额-已还款累计金额-当期还款本金
			if (sybj < 0) {
				sybj = 0;
			}
			var hkmx = {};
			hkmx.RN = (i + 1);// 期数
			// 偿还本金
			hkmx.CHBJ = Math.floor(mybj * 100) / 100;
			// 偿还利息
			hkmx.CHLX = Math.floor(mylx * 100) / 100;
			// 优惠利息
			hkmx.YHLX = Math.floor(myyhlx * 100) / 100;
			// 当期月供
			hkmx.DYYG = Math.floor(hbfxze * 100) / 100;
			// 剩余本金
			hkmx.SYBJ = Math.floor(sybj * 100) / 100;
			// 当期累计余额
			var _mqts = 0;
			// 计算每期天数
			if (i == (cnt - 1)) {// 最后一期
				_mqts = Math.ceil(Math
						.abs((_dqrq.getTime() - _bqksrq.getTime()))
						/ (1000 * 60 * 60 * 24));
			} else {
				var _bqdqrq = new Date();// 本期结束日期
				_bqdqrq.setFullYear(_bqksrq.getFullYear());
				_bqdqrq.setMonth(_bqksrq.getMonth() + parseInt(hkpl));
				_bqdqrq.setDate(_bqksrq.getDate());
				_bqdqrq.setHours(0);
				_bqdqrq.setMinutes(0);
				_bqdqrq.setSeconds(0);
				_bqdqrq.setMilliseconds(0);
				_mqts = Math.ceil(Math.abs((_bqdqrq.getTime() - _bqksrq
						.getTime()))
						/ (1000 * 60 * 60 * 24));
				_bqksrq = _bqdqrq;// 将当期的到期日赋值于下期的开始日期
			}
			hkmx.DQLJYE = Math.floor(dqljye * _mqts * 100) / 100;
			mxlb.push(hkmx);
			ljyhje = ljyhje + mybj; // 累计已还本金
			// 剩余贷款金额
			dqljye = dqljye - mybj;
		}
	} else if (repayMentType == '3') {// 一次还本付息
		// 优惠利息
		yhlx = dkje * (yhdc * 0.01 / 365) * _termTs;
		// 支付利息总额
		zflxze = dkje * (zxlv * 0.01 / 365) * _termTs;
		var hbfxze = dkje + zflxze;// 月供金额
		var hkmx = {};
		hkmx.RN = 1;// 期数
		// 偿还本金
		hkmx.CHBJ = Math.floor(dkje * 100) / 100;
		// 偿还利息
		hkmx.CHLX = Math.floor(zflxze * 100) / 100;
		// 优惠利息
		hkmx.YHLX = Math.floor(yhlx * 100) / 100;
		// 当期月供
		hkmx.DYYG = Math.floor(hbfxze * 100) / 100;
		hkmx.SYBJ = 0;// 剩余本金
		// 当期累计余额
		hkmx.DQLJYE = Math.floor(dqljye * _termTs * 100) / 100;
		mxlb.push(hkmx);
	} else if (repayMentType == '4') {// 分期还息、一次还本
		// 优惠利息
		yhlx = dkje * (yhdc * 0.01 / 365) * _termTs;
		// 支付利息总额
		zflxze = dkje * (zxlv * 0.01 / 365) * _termTs;
		// 每期偿还利息
		var mylx = zflxze / cnt;
		// 每期优惠利息
		var myyhlx = yhlx / cnt;
		for (var i = 0; i < cnt - 1; i++) {
			var hkmx = {};
			hkmx.RN = (i + 1); // 期数
			hkmx.CHBJ = 0; // 偿还本金
			// 偿还利息
			hkmx.CHLX = Math.floor(mylx * 100) / 100;
			// 优惠利息
			hkmx.YHLX = Math.floor(myyhlx * 100) / 100;
			// 当期月供
			hkmx.DYYG = Math.floor(mylx * 100) / 100;
			// 剩余本金
			hkmx.SYBJ = Math.floor(dkje * 100) / 100;
			// 当期累计余额
			var _bqdqrq = new Date();// 本期结束日期
			_bqdqrq.setFullYear(_bqksrq.getFullYear());
			_bqdqrq.setMonth(_bqksrq.getMonth() + parseInt(hkpl));
			_bqdqrq.setDate(_bqksrq.getDate());
			_bqdqrq.setHours(0);
			_bqdqrq.setMinutes(0);
			_bqdqrq.setSeconds(0);
			_bqdqrq.setMilliseconds(0);
			var _mqts = Math.ceil(Math.abs((_bqdqrq.getTime() - _bqksrq
					.getTime()))
					/ (1000 * 60 * 60 * 24));
			_bqksrq = _bqdqrq;// 将当期的到期日赋值于下期的开始日期
			hkmx.DQLJYE = Math.floor(dqljye * _mqts * 100) / 100;
			mxlb.push(hkmx);
		}
		var hkmx = {};
		hkmx.RN = cnt;// 期数
		// 偿还本金
		hkmx.CHBJ = Math.floor(dkje * 100) / 100;
		// 偿还利息
		hkmx.CHLX = Math.floor(mylx * 100) / 100;
		// 优惠利息
		hkmx.YHLX = Math.floor(myyhlx * 100) / 100;
		// 当期月供
		hkmx.DYYG = Math.floor((dkje + mylx) * 100) / 100;
		// 剩余本金
		hkmx.SYBJ = 0;
		// 当期累计余额
		var _mqts = Math.ceil(Math.abs((_dqrq.getTime() - _bqksrq.getTime()))
				/ (1000 * 60 * 60 * 24));
		hkmx.DQLJYE = Math.floor(dqljye * _mqts * 100) / 100;
		mxlb.push(hkmx);
	}
	hkze = dkje + zflxze;// 计算还款总额:贷款金额+支付利息
	returnInfo.LIST = mxlb; // 还款明细计划表
	// 还款总额
	returnInfo.HKZE = Math.floor(hkze * 100) / 100;
	// 支付利息
	returnInfo.ZFLX = Math.floor(zflxze * 100) / 100;
	// 优惠利息
	returnInfo.YHLX = Math.floor(yhlx * 100) / 100;
	if (initload) {
		initload.call(this, returnInfo);
	}
	return returnInfo;
}
