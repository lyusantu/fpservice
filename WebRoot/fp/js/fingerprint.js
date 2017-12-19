/**
 * ----------------------------------------------------------common
 * start--------------------------------------------------------------
 */
// 采集指纹次数
var FINGERPRINT_NUMBER = 3;
// 胁迫指纹数--胁迫指纹时，在普通指纹上加的数
var DURESS_FINGER_NUM = 16;
// 胁迫指纹标记
var duressFingerFlag = null;
// 是否显示胁迫指纹(用户登记指纹时，不需要胁迫指纹)，默认显示胁迫指纹
var duressFingerShowFlag = true;
// 手指标记数组
var fingerIdArray = new Array();// []
// 指纹模板数据数组
var templateDataArray = new Array();// []
// 定时器--关闭setTimeOut时用到
var timer = null;
// 定时器--验证
var verifyTimer = null;
// 判断当前手指是否正在采集中
var collectFlag = false;
// 当前点击的手指标记
var fpIdNum = null;
// 访问ISSOnline_server的ip
var serverIp = null;
// 访问的ISSOnline_server端口
var serverPort = null;
// ISSOnline_server的url的公共部分:http://127.0.0.1:22001/ZKBIOOnline
// var issOnlineUrl = null;
var issOnlineUrl = "http://127.0.0.1:22001/ZKBIOOnline";
// 是否是访客
var isVisPager = false;
// 定义驱动的版本号
var fpDriverVersion = "5.0.0.1";
// 是否为比对功能
var isComp = false;
// 图像地址
var imgUrl = "fp/image/base_fpVerify_clearImage.png";
//用户id
var currUserId = 1;
// 访问路径
var currPath = "http://127.0.0.1:8080/fpservice"

/**
 * 加载xml中ISSOnline_server的ip和port
 * 
 * @author wenxin
 * @create 2013-06-15 15:01:31 pm
 * @param url
 *            加载xml的url
 */
function loadXml(url) {
	$.ajax({
		type : "GET",
		url : url,
		dataType : "xml",
		async : false,
		success : function(xml) {
			$(xml).find('service').each(function() {
				var service = $(this);
				serverIp = service.find('ISSOnline_serverIp').text();
				serverPort = service.find('ISSOnline_serverPort').text();
			})
		},
		error : function(XMLHttpRequest, textStatus, errorThrown) {
			// 如果取配置文件出错，则设置默认
			serverIp = "127.0.0.1";
			serverPort = "22001";
		}
	});
	// 给issOnlineUrl赋值
	issOnlineUrl = "http://" + serverIp + ":" + serverPort + "/ZKBIOOnline";
}

/**
 * 获取编辑时，查询的数据库的指纹标记和指纹模板
 * 
 * @author wenxin
 * @create 2013-04-22 10:18:31 am
 * @param fingerIdList
 *            数据库查询的指纹标记
 * @param templateList
 *            数据库查询的指纹模板
 */
function loadFPDataTemplate(fingerIdList, templateList) {
	if (fingerIdList == "[]") {
		$("#fingerId").val(" ");
	} else {
		$("#fingerId").val(fingerIdList);
	}
	if (templateList == "[]") {
		$("#fingerTemplate10").val(" ");
	} else {
		$("#fingerTemplate10").val(templateList);
	}
}

/**
 * 获取浏览器类型
 * 
 * @author wenxin
 * @create 2013-08-09 17:24:31 pm
 */
function getBrowserType() {
	var browserFlag = "";
	// 是否支持html5的cors跨域
	if (typeof (Worker) !== "undefined") {
		browserFlag = "html5";
	}
	// 此处判断ie8、ie9
	else if (navigator.userAgent.indexOf("MSIE 8.0") > 0
			|| navigator.userAgent.indexOf("MSIE 9.0") > 0) {
		browserFlag = "simple";
	} else {
		browserFlag = "upgradeBrowser";// 当前浏览器不支持该功能,请升级浏览器
	}
	return browserFlag;
}

/**
 * 判断是否安装指纹驱动
 * 
 * @author wenxin
 * @create 2013-04-22 20:18:31 pm
 * @param browserFlag
 *            浏览器标记 simple:简易版本，表示是ie浏览器；html5:表示支持html5的浏览器
 * @param paramArray
 *            存放国际化元素的数组
 * @param isFPLogin
 *            是否是指纹登录 true:是；false:否
 */
function checkDriver(paramArray, browserFlag, isFPLogin) {
	var hrefStr = "";
	if (browserFlag == "html5") {
		// 发送一个请求，检查是否安装驱动
		getWebServerInfo(paramArray, isFPLogin, "0");
	} else if (browserFlag == "simple") {
		// 发送一个请求，检查是否安装驱动
		getWebServerInfoForSimple(paramArray, isFPLogin, "0");
	} else if (browserFlag == "upgradeBrowser") {
		if ($("#userLoginForm [name='fingerLogin']").val() != undefined) {
			$("#userLoginForm [name='fingerLogin']").attr("onclick", "");
			$("#userLoginForm [name='fingerLogin']").attr("title",
					"当前浏览器不支持改功能,请升级浏览器!");
		}
		if ($("#fpRegister").val() != undefined) {
			$("#fpRegister").attr("onclick", "");
			$("#fpRegister").attr("title", "当前浏览器不支持改功能,请升级浏览器!");
		}
	}
}

/**
 * 获取webserver的信息
 * 
 * @author wenxin
 * @param
 * @param paramArray
 *            存放国际化元素的数组
 * @param isFPLogin
 *            是否是指纹登录 true:是；false:否
 * @param type
 *            0 表示发送完请求后,还有别的操作。1 表示发送完请求后，没有其余的操作了
 * @create 2013-08-09 17:24:31 pm
 */
function getWebServerInfo(paramArray, isFPLogin, type) {
	$.ajax({
		type : "GET",
		url : issOnlineUrl + "/info",
		dataType : "json",
		async : true,
		// timeout:1000,
		success : function(result) {
			// 检查驱动
			if (type == "0") {
				getWebServerInfoCallBack(result, paramArray, isFPLogin);
			}
			// 检查动态库连接
			else if (type == "1") {
				getDLLConnectCallBack(result, isComp);
			}

		},
		error : function(XMLHttpRequest, textStatus, errorThrown) {
			// 未装驱动
			// $("#omparisonbtn").removeAttr("onclick");
			// $("#omparisonbtn").attr("onclick","fpVerificationMsg()");
			$("a.tablelinkfp").removeAttr("onclick");
			$("a.tablelinkfp").attr("href", "javascript:fpVerificationMsg()");
			$("#fploginbtn").removeAttr("onclick");
			$("#fploginbtn").attr("onclick", "fpVerificationMsg()");
		}
	});
}

/**
 * 获取webserver的信息
 * 
 * @author wenxin
 * @param paramArray
 *            存放国际化元素的数组
 * @param isFPLogin
 *            是否是指纹登录 true:是；false:否
 * @param type
 *            0 表示发送完请求后,还有别的操作。1 表示发送完请求后，没有其余的操作了
 * @create 2013-08-09 17:24:31 pm
 */
function getWebServerInfoForSimple(paramArray, isFPLogin, type) {
	// 创建XDomainRequest实例，用于ie8和ie9跨域访问
	var xDomainRequest = new XDomainRequest();
	// 如果xDomainRequest存在,则可以使用xDomainRequest函数，否则，说明不是ie浏览器
	if (xDomainRequest) {
		xDomainRequest.open('GET', issOnlineUrl + "/info?random="
				+ getRandomNum());
		xDomainRequest.onload = function() {
			// 检查驱动
			if (type == "0") {
				getInfoForSimpleCallBack(xDomainRequest, paramArray, isFPLogin);
			}
			// 检查动态库连接
			else if (type == "1") {
				getDLLConnectCallBack(xDomainRequest, isComp);
			}
		};
		xDomainRequest.onerror = function() {
			// 用完后，将对象置为空
			xDomainRequest = null;
		};
		xDomainRequest.send();
	}
}

/**
 * 获取webserver信息的回调函数
 * 
 * @author wenxin
 * @create 2013-08-09 17:24:31 pm
 */
function getWebServerInfoCallBack(result, paramArray, isFPLogin) {
	// 返回码
	var ret = null;
	ret = result.ret;
	// 接口调用成功返回时
	if (ret == 0) {
		if (isFPLogin) {
			// 显示指纹登录
			showFPVerify(paramArray);
		} else {
			// 显示登记--可以点击采集指纹
			showRegister(paramArray);
			// 计算指纹数量${pers_person_templateCount}:指纹数
			showFPCountInit(paramArray[5], paramArray[6]);
			// 鼠标over事件
			// mouseOverEvent();
			// 对比指纹驱动
			if (result.data && result.data.server_version) {
				compareFPDriver(result.data.server_version);
			}
		}

	}
}

/**
 * 显示指纹登录--点击进行指纹验证
 * 
 * @author wenxin
 * @create 2013-06-14 10:09:20 am
 * @param paramArray
 *            存放国际化元素的数组
 */
function showFPVerify(paramArray) {
	$("#userLoginForm .but_fing_disabled").hide();
	$("#userLoginForm .but_fing").show();
}

/**
 * 显示登记--点击采集指纹
 * 
 * @author wenxin
 * @create 2013-06-14 10:09:20 am
 * @param paramArray
 *            存放国际化元素的数组
 */
function showRegister(paramArray) {
	var hrefStr = "";
	var param = '"' + paramArray[0] + '", "' + paramArray[1] + '", "'
			+ paramArray[2] + '", ' + null + '';
	$("#fpRegister").remove();
	$("#downloadDriver").remove();
	// webservice接口调用成功，说明驱动已经安装
	hrefStr = "<a id='fpRegister' onclick='submitRegister(" + param + ", true"
			+ ")' title='" + paramArray[3] + "' class='linkStyle'>"
			+ paramArray[3] + "</a>";
	$("#fpRegisterDiv").append(hrefStr);
}

/**
 * 在页面初始化时，计算指纹数量
 * 
 * @author wenxin
 * @create 2013-04-25 11:31:20 am
 * 
 */
function showFPCountInit(fingerIdCount, text) {
	$("#fpCountMessage").text(text + " " + fingerIdCount);
}

/**
 * 对比指纹驱动版本
 * 
 * @author gordon.zhang
 * @param oldVersion
 *            旧驱动版本
 * @create 2015-01-28 17:24:31 pm
 */
function compareFPDriver(oldVersion) {
	var existVersion = fpDriverVersion
	var curVersion = oldVersion;// 3.5.2
	var existVersionArr = existVersion.split(".");
	var curVersionArr = curVersion.split(".");
	var isLast = true;
	var len = existVersionArr.length;
	for ( var i = len; i > 0; i--) {
		var existVersionTemp = parseInt(existVersionArr[i - 1]);
		var curVersionTemp = parseInt(curVersionArr[i - 1]);
		if (existVersionTemp < curVersionTemp) {
			isLast = false;
		} else if (existVersionTemp > curVersionTemp) {
			isLast = true;
		} else {
			// 等于 忽略
		}
	}
}
/**
 * 显示发现新驱动
 * 
 * @author gordon.zhang
 * @create 2015-01-28 17:24:31 pm
 */
function showNewDriver() {
	var hrefStr = "<a id='downloadDriver' href='base/middleware/zkbioonline.exe' title='下载新驱动'>下载新驱动</a>";
	$("#driverDownload").append(hrefStr);
}

/**
 * 获取webserver的信息--简易版
 * 
 * @author wenxin
 * @param paramArray
 *            存放国际化元素的数组
 * @param isFPLogin
 *            是否是指纹登录 true:是；false:否
 * @create 2013-08-09 17:43:31 pm
 */
function getInfoForSimpleCallBack(xDomainRequest, paramArray, isFPLogin) {
	// 获取接口返回值
	var resultData = xDomainRequest.responseText;
	// 转化为json对象
	var obj = jQuery.parseJSON(resultData);
	// 返回码
	var ret = null;
	if (obj != null && obj.ret != undefined) {
		ret = obj.ret;
	}
	// 接口调用成功返回时
	if (ret == 0) {
		if (isFPLogin) {
			// 显示指纹比对
			showFPVerify(paramArray);
		} else {
			// 显示登记--点击采集指纹
			showRegister(paramArray);
			// 计算指纹数量${pers_person_templateCount}:指纹数

			showFPCountInit(paramArray[5], paramArray[6]);
			// 鼠标over事件
			// mouseOverEvent();
		}
		// 用完后，将对象置为空
		xDomainRequest = null;
	}
}
// ------
/**
 * 点击登记，触发事件
 * 
 * @author wenxin
 * @create 2013-05-21 11:31:20 am
 * @param title
 *            页面标题国际化内容
 * @param fpCount
 *            指纹数国际化内容
 * @param saveText
 *            提示:是否保存国际化内容
 * @param downloadText
 *            驱动安装国际化内容
 * @param isDriverInstall
 *            是否安装了驱动
 */
function submitRegister(title, fpCount, saveText, downloadText, isDriverInstall) {
	// 支持html5
	if (typeof (Worker) !== "undefined" && isDriverInstall) {
		var box = document.getElementById("box");
		var bg = document.getElementById("bg");
		box.style.display = "block";// 显示内容层，显示覆盖层
		box.style.left = parseInt((document.documentElement.scrollWidth - box.offsetWidth) / 2)
				+ document.documentElement.scrollLeft + "px";
		box.style.top = Math
				.abs(parseInt((document.documentElement.clientHeight - box.offsetHeight) / 2))
				+ document.documentElement.scrollTop + "px"; // 为内容层设置位置
		bg.style.display = "block";
		bg.style.height = document.documentElement.scrollHeight + "px";
		isComp = false;
		dataInitReg();
		// 关闭页面时，提示保存数据
		// storeBeforeClose(fpCount, saveText);
	} else if (typeof (Worker) == "undefined" && isDriverInstall) {
		// createWindow('base_baseFPRegisterSimple.action?random=' +
		// getRandomNum() + '^0^0^465^460^' + title);//public/html/applet.html
		showModalDialog(
				'webapp/html/baseFPRegisterSimple.html',
				title,
				'dialogWidth:465px;dialogHeight:460px;dialogLeft:600px;dialogTop:150px;center:yes;resizable:no;status:yes');
		// 关闭页面时，提示保存数据
		// storeBeforeClose(fpCount, saveText);
	} else if (!isDriverInstall) {
		alert("请安装指纹驱动或启动该服务!");
		// messageBox({messageType: "alert", title: "提示", text:
		// "请安装指纹驱动或启动该服务!"});
		if (typeof ($("#downloadDriver").val()) == "undefined") {
			var hrefStr = "<a id='downloadDriver' href='webapp/middleware/zkbioonline.exe' title='"
					+ downloadText + "'>" + downloadText + "</a>";
			$("#driverDownload").append(hrefStr);
		}
	}
}

/**
 * 关闭页面时，如果有修改操作，则提示用户保存数据
 * 
 * @author wenxin
 * @create 2013-06-08 19:36:20 pm
 * @param fpCount
 *            指纹数国际化内容
 * @param saveText
 *            提示:是否保存国际化内容
 */
function storeBeforeClose(fpCount, saveText) {
	// 关闭页面时，监听关闭的onclick事件
	getCurrentWindow().button("close").attachEvent(
			"onClick",
			function() {
				// 判断是否修改了数据(包括新增和删除)
				if ($("#whetherModify").val() != undefined
						&& (fpModifyFlag != undefined && fpModifyFlag)) {
					// 获取指纹标记数据
					var fingerIdData = fingerIdArray;
					// 获取指纹模板数据
					var fingerTemplateData = templateDataArray;
					var flag = confirm(saveText);
					saveFPData(flag, fpCount);
				} else {
					// 取消采集
					cancelRegister();
					// 将定时器的递归调用关闭
					clearTimeout(timer);
					// closeWindow();
					close();
				}
			});
}

/**
 * 获取页面的指纹数据
 * 
 * @author wenxin
 * @create 2013-05-13 10:18:31 am
 * @param
 */
function getDataFromPage() {
	var fingerId = $("#fingerId").val();
	var fingerTemplate = $("#fingerTemplate10").val();
	// 如果有数据
	// if($.trim(fingerId) != "")
	// {
	// fingerId = fingerId.substr(1, fingerId.length-2);
	// fingerTemplate = fingerTemplate.substr(1, fingerTemplate.length-2);
	// fingerIdArray = fingerId.split(",");
	// templateDataArray = fingerTemplate.split(",");
	// }else{
	fingerIdArray = new Array();
	templateDataArray = new Array();
	var url = currPath + "/getUserFingers";
	// 上色
	$
			.ajax({
				type : "GET",
				url : url,
				data : {
					uid : currUserId
				},
				dataType : "json",
				async : false,
				success : function(json) {
					fingerIdArray = json.fingers;
					if ((fingerIdArray == "" || fingerIdArray == undefined || fingerIdArray == null))
						fingerIdArray = new Array();
				},
				error : function(XMLHttpRequest, textStatus, errorThrown) {
					collectTips(context, "error", "verification");
				}
			});
	// }
}

/**
 * 初始化绘画手指、手掌、圆弧的起始坐标,并做成json格式
 * 
 * @author wenxin
 * @create 2013-06-15 15:40:31 pm
 */
function initCoordJson() {
	var coordJson = [ {
		"num" : 0,
		"coord" : {
			"x" : x + 3,
			"y" : y - 37
		}
	}, {
		"num" : 1,
		"coord" : {
			"x" : x + 25,
			"y" : y - 37
		}
	}, {
		"num" : 2,
		"coord" : {
			"x" : x + 47,
			"y" : y - 34
		}
	}, {
		"num" : 3,
		"coord" : {
			"x" : x + 67,
			"y" : y - 26
		}
	}, {
		"num" : 4,
		"coord" : {
			"x" : x + 77,
			"y" : y + 18
		}
	}, {
		"num" : 5,
		"coord" : {
			"x" : x + 153,
			"y" : y + 34
		}
	}, {
		"num" : 6,
		"coord" : {
			"x" : x + 159,
			"y" : y - 19
		}
	}, {
		"num" : 7,
		"coord" : {
			"x" : x + 177,
			"y" : y - 30
		}
	}, {
		"num" : 8,
		"coord" : {
			"x" : x + 198,
			"y" : y - 36
		}
	}, {
		"num" : 9,
		"coord" : {
			"x" : x + 220,
			"y" : y - 36
		}
	}, {
		"num" : 10,
		"coord" : {
			"x" : x,
			"y" : y
		}
	}, {
		"num" : 11,
		"coord" : {
			"x" : x + 170,
			"y" : y + 12
		}
	}, {
		"num" : 12,
		"coord" : {
			"x" : x + 210,
			"y" : y - 346
		}
	} ];
	return coordJson;
}

/**
 * 将绘画的坐标点放入数组
 * 
 * @author wenxin
 * @create 2013-05-31 18:01:33 pm
 * @param coordArray
 *            传入的数组，放入坐标后，返回
 * @param x,
 *            y 绘画手指的起点的坐标
 * @param num
 *            手指、手掌编号0-9：手指编号；10：左手掌，11：右手掌,12:圆弧。
 */
function initCoordArray(coordArray, x, y, num) {
	if (num == 0) {
		coordArray[0] = new Coord(x, y);
		coordArray[1] = new Coord(x + 2, y - 35);
		coordArray[2] = new Coord(x + 5, y - 40);
		coordArray[3] = new Coord(x + 11, y - 42);
		coordArray[4] = new Coord(x + 16, y - 40);
		coordArray[5] = new Coord(x + 18, y - 35);
		coordArray[6] = new Coord(x + 18, y + 1);
		coordArray[7] = new Coord(x + 15, y + 5);
		coordArray[8] = new Coord(x + 9, y + 7);
		coordArray[9] = new Coord(x + 3, y + 5);
		coordArray[10] = new Coord(x, y);
	} else if (num == 1) {
		coordArray[0] = new Coord(x, y);
		coordArray[1] = new Coord(x + 8, y - 50);
		coordArray[2] = new Coord(x + 12, y - 54);
		coordArray[3] = new Coord(x + 19, y - 55);
		coordArray[4] = new Coord(x + 22, y - 53);
		coordArray[5] = new Coord(x + 24, y - 49);
		coordArray[6] = new Coord(x + 18, y + 1);
		coordArray[7] = new Coord(x + 15, y + 6);
		coordArray[8] = new Coord(x + 8, y + 7);
		coordArray[9] = new Coord(x + 3, y + 4);
		coordArray[10] = new Coord(x, y);
	} else if (num == 2) {
		coordArray[0] = new Coord(x, y);
		coordArray[1] = new Coord(x + 14, y - 54);
		coordArray[2] = new Coord(x + 16, y - 57);
		coordArray[3] = new Coord(x + 23, y - 58);
		coordArray[4] = new Coord(x + 28, y - 55);
		coordArray[5] = new Coord(x + 29, y - 50);
		coordArray[6] = new Coord(x + 17, y + 4);
		coordArray[7] = new Coord(x + 13, y + 8);
		coordArray[8] = new Coord(x + 6, y + 9);
		coordArray[9] = new Coord(x + 1, y + 5);
		coordArray[10] = new Coord(x, y);
	} else if (num == 3) {
		coordArray[0] = new Coord(x, y);
		coordArray[1] = new Coord(x + 19, y - 37);
		coordArray[2] = new Coord(x + 21, y - 39);
		coordArray[3] = new Coord(x + 28, y - 39);
		coordArray[4] = new Coord(x + 32, y - 36);
		coordArray[5] = new Coord(x + 33, y - 31);
		coordArray[6] = new Coord(x + 17, y + 6);
		coordArray[7] = new Coord(x + 12, y + 10);
		coordArray[8] = new Coord(x + 6, y + 10);
		coordArray[9] = new Coord(x + 1, y + 6);
		coordArray[10] = new Coord(x, y);
	} else if (num == 4) {
		coordArray[0] = new Coord(x, y);
		coordArray[1] = new Coord(x + 30, y - 18);
		coordArray[2] = new Coord(x + 34, y - 17);
		coordArray[3] = new Coord(x + 37, y - 14);
		coordArray[4] = new Coord(x + 39, y - 11);
		coordArray[5] = new Coord(x + 39, y - 8);
		coordArray[6] = new Coord(x + 38, y - 6);
		coordArray[7] = new Coord(x + 12, y + 15);
		coordArray[8] = new Coord(x + 8, y + 17);
		coordArray[9] = new Coord(x + 2, y + 14);
		coordArray[10] = new Coord(x - 2, y + 8);
		coordArray[11] = new Coord(x, y);
	} else if (num == 5) {
		coordArray[0] = new Coord(x, y);
		coordArray[1] = new Coord(x - 26, y - 21);
		coordArray[2] = new Coord(x - 27, y - 24);
		coordArray[3] = new Coord(x - 26, y - 30);
		coordArray[4] = new Coord(x - 21, y - 34);
		coordArray[5] = new Coord(x - 16, y - 34);
		coordArray[6] = new Coord(x + 12, y - 18);
		coordArray[7] = new Coord(x + 15, y - 10);
		coordArray[8] = new Coord(x + 13, y - 3);
		coordArray[9] = new Coord(x + 7, y + 1);
		coordArray[10] = new Coord(x, y);
	} else if (num == 6) {
		coordArray[0] = new Coord(x, y);
		coordArray[1] = new Coord(x - 17, y - 46);
		coordArray[2] = new Coord(x - 17, y - 50);
		coordArray[3] = new Coord(x - 13, y - 56);
		coordArray[4] = new Coord(x - 6, y - 56);
		coordArray[5] = new Coord(x - 3, y - 54);
		coordArray[6] = new Coord(x + 15, y - 11);
		coordArray[7] = new Coord(x + 15, y - 4);
		coordArray[8] = new Coord(x + 11, y + 2);
		coordArray[9] = new Coord(x + 4, y + 2);
		coordArray[10] = new Coord(x, y);
	} else if (num == 7) {
		coordArray[0] = new Coord(x, y);
		coordArray[1] = new Coord(x - 12, y - 54);
		coordArray[2] = new Coord(x - 10, y - 58);
		coordArray[3] = new Coord(x - 5, y - 62);
		coordArray[4] = new Coord(x + 1, y - 61);
		coordArray[5] = new Coord(x + 4, y - 58);
		coordArray[6] = new Coord(x + 18, y - 4);
		coordArray[7] = new Coord(x + 16, y + 1);
		coordArray[8] = new Coord(x + 11, y + 5);
		coordArray[9] = new Coord(x + 5, y + 4);
		coordArray[10] = new Coord(x, y);
	} else if (num == 8) {
		coordArray[0] = new Coord(x, y);
		coordArray[1] = new Coord(x - 5, y - 50);
		coordArray[2] = new Coord(x - 2, y - 54);
		coordArray[3] = new Coord(x + 3, y - 57);
		coordArray[4] = new Coord(x + 9, y - 55);
		coordArray[5] = new Coord(x + 11, y - 52);
		coordArray[6] = new Coord(x + 18, y - 1);
		coordArray[7] = new Coord(x + 14, y + 4);
		coordArray[8] = new Coord(x + 9, y + 6);
		coordArray[9] = new Coord(x + 4, y + 5);
		coordArray[10] = new Coord(x, y);
	} else if (num == 9) {
		coordArray[0] = new Coord(x, y);
		coordArray[1] = new Coord(x, y - 37);
		coordArray[2] = new Coord(x + 3, y - 41);
		coordArray[3] = new Coord(x + 7, y - 43);
		coordArray[4] = new Coord(x + 13, y - 41);
		coordArray[5] = new Coord(x + 15, y - 37);
		coordArray[6] = new Coord(x + 17, y + 1);
		coordArray[7] = new Coord(x + 15, y + 3);
		coordArray[8] = new Coord(x + 10, y + 6);
		coordArray[9] = new Coord(x + 3, y + 4);
		coordArray[10] = new Coord(x, y);
	} else if (num == 10) {
		coordArray[0] = new Coord(x, y);
		coordArray[1] = new Coord(x + 2, y - 8);
		coordArray[2] = new Coord(x + 6, y - 16);
		coordArray[3] = new Coord(x + 13, y - 23);
		coordArray[4] = new Coord(x + 27, y - 27);
		coordArray[5] = new Coord(x + 37, y - 25);
		coordArray[6] = new Coord(x + 43, y - 23);
		coordArray[7] = new Coord(x + 64, y - 16);
		coordArray[8] = new Coord(x + 69, y - 11);
		coordArray[9] = new Coord(x + 73, y - 3);

		coordArray[10] = new Coord(x + 73, y + 10);
		coordArray[11] = new Coord(x + 71, y + 18);
		coordArray[12] = new Coord(x + 57, y + 40);
		coordArray[13] = new Coord(x + 50, y + 46);
		coordArray[14] = new Coord(x + 41, y + 49);
		coordArray[15] = new Coord(x + 34, y + 49);
		coordArray[16] = new Coord(x + 14, y + 43);
		coordArray[17] = new Coord(x + 10, y + 41);
		coordArray[18] = new Coord(x + 6, y + 36);
		coordArray[19] = new Coord(x + 2, y + 29);
		coordArray[20] = new Coord(x, y);
	} else if (num == 11) {
		coordArray[0] = new Coord(x, y);
		coordArray[1] = new Coord(x - 2, y - 10);
		coordArray[2] = new Coord(x + 1, y - 20);
		coordArray[3] = new Coord(x + 14, y - 31);
		coordArray[4] = new Coord(x + 47, y - 39);
		coordArray[5] = new Coord(x + 55, y - 38);
		coordArray[6] = new Coord(x + 61, y - 34);
		coordArray[7] = new Coord(x + 68, y - 26);
		coordArray[8] = new Coord(x + 72, y - 16);
		coordArray[9] = new Coord(x + 72, y + 13);

		coordArray[10] = new Coord(x + 68, y + 22);
		coordArray[11] = new Coord(x + 62, y + 29);
		coordArray[12] = new Coord(x + 60, y + 30);
		coordArray[13] = new Coord(x + 39, y + 36);
		coordArray[14] = new Coord(x + 34, y + 36);
		coordArray[15] = new Coord(x + 20, y + 33);
		coordArray[16] = new Coord(x + 16, y + 29);
		coordArray[17] = new Coord(x, y);
	} else if (num == 12) {
		coordArray[0] = new Coord(x - 10, y);
		coordArray[1] = new Coord(x + 212, y);
		coordArray[2] = new Coord(x + 212, y + 129);
		coordArray[3] = new Coord(x + 201, y + 130);
		coordArray[4] = new Coord(x + 191, y + 131);
		coordArray[5] = new Coord(x + 174, y + 131);
		coordArray[6] = new Coord(x + 159, y + 129);
		coordArray[7] = new Coord(x + 142, y + 127);
		coordArray[8] = new Coord(x + 133, y + 125);
		coordArray[9] = new Coord(x + 114, y + 120);

		coordArray[10] = new Coord(x + 97, y + 113);
		coordArray[11] = new Coord(x + 86, y + 108);
		coordArray[12] = new Coord(x + 72, y + 100);
		coordArray[13] = new Coord(x + 52, y + 87);
		coordArray[14] = new Coord(x + 40, y + 76);
		coordArray[15] = new Coord(x + 29, y + 64);
		coordArray[16] = new Coord(x + 16, y + 48);
		coordArray[17] = new Coord(x + 5, y + 30);
		coordArray[18] = new Coord(x - 10, y);
	}
	return coordArray;
}

/**
 * 坐标点对象
 * 
 * @author wenxin
 * @create 2013-05-31 18:01:33 pm
 */
var Coord = function(x, y) {
	this.x = x;
	this.y = y;
}

/**
 * 绘画手指
 * 
 * @author wenxin
 * @create 2013-05-31 18:01:33 pm
 * @param context
 *            2d画布上下文
 * @param pointArray
 *            坐标点数组
 * @param renderFlag
 *            渲染标记 stroke:绘画边线；fill:填充
 * @param color
 *            渲染颜色
 */
var renderFinger = function(context, pointArray) {
	this.context = context;
	this.pointArray = pointArray;
	this.isClick = false;
	this.drawFinger = function(renderFlag, color) {
		if (renderFlag == "stroke") {
			this.context.strokeStyle = color;
		} else if (renderFlag == "fill") {
			this.context.fillStyle = color;
		}
		this.context.lineWidth = 1;
		this.context.beginPath();
		for ( var i = 0; i < this.pointArray.length; i++) {
			if (i == 0) {
				this.context.moveTo(this.pointArray[0].x, this.pointArray[0].y);
			} else {
				this.context.lineTo(this.pointArray[i].x, this.pointArray[i].y);
			}
		}
		if (renderFlag == "stroke") {
			this.context.stroke();
		} else if (renderFlag == "fill") {
			this.context.fill();
		}
	};
};

/**
 * 页面加载和重画时渲染手指
 * 
 * @author wenxin
 * @create 2013-05-13 15:26:31 pm
 * @param context
 *            2d画布上下文
 * @param num
 *            当前需要渲染的手指编号
 * @param browserFlag
 *            浏览器标记 simple:简易版本，表示是ie浏览器；html5:表示支持html5的浏览器
 */
function renderInit(context, num, browserFlag) {
	var fingerId;
	for ( var i = 0; i < fingerIdArray.length; i++) {
		fingerId = eval(fingerIdArray[i]);
		if (fingerId >= DURESS_FINGER_NUM) {
			fingerId = fingerId - DURESS_FINGER_NUM;
			if (browserFlag == "html5") {
				if (fingerId == num) {
					context.fillStyle = "red";
					context.fill();
				}
			}
		} else {
			if (browserFlag == "html5") {
				if (fingerId == num) {
					context.fillStyle = "rgb(122,193,66)";
					context.fill();
				}
			}
		}
		if (browserFlag == "simple") {
			document.getElementById("finger" + fingerId).checked = true;
		}
	}
}

/**
 * 显示指纹图像
 * 
 * @author wenxin
 * @create 2013-05-18 11:22:31 am
 * @param context
 *            2d画布上下文
 * @param browserFlag
 *            浏览器标记 simple:简易版本，表示是ie浏览器；html5:表示支持html5的浏览器
 */
function showImage(context, base64FPImg, browserFlag) {
	var img;
	var imgSrc = "data:image/jpg;base64," + base64FPImg;
	if (browserFlag == "html5") {
		img = new Image();
		// img.src = sysCfg.rootPath + "/public/html/bmpFile1.jpg";
		img.src = "";
		img.src = imgSrc;
		img.onload = function() {
			// 保存当前的绘图状态
			context.save();
			// 开始创建路径
			context.beginPath();
			// 画一个椭圆
			context.oval(125, 142, 112, 145);
			// 关闭路径
			context.closePath();
			// 剪切路径
			context.clip();
			// 将图片画到画布上
			context.drawImage(img, 70, 70, 112, 145);
			// 调用restore最后一次存储的状态会被恢复
			context.restore();
		}
	} else if (browserFlag == "verification") {
		img = new Image();
		img.src = "";
		img.src = imgSrc;
		img.onload = function() {
			// 保存当前的绘图状态
			context.save();
			// 开始创建路径
			context.beginPath();
			// 画一个椭圆
			context.oval(92, 159, 100, 128);
			// 关闭路径
			context.closePath();
			// 剪切路径
			context.clip();
			// 将图片画到画布上
			context.drawImage(img, 37, 90, 112, 145);
			// 调用restore最后一次存储的状态会被恢复
			context.restore();
		}
	} else if (browserFlag == "clearForVerify"
			|| browserFlag == "clearForRegister") {
		img = new Image();
		img.src = "";
		img.src = base64FPImg;
		img.onload = function() {
			// 保存当前的绘图状态
			context.save();
			// 开始创建路径
			context.beginPath();
			// 画一个椭圆
			if (browserFlag == "clearForVerify") {
				context.oval(91, 160, 112, 145);
			} else if (browserFlag == "clearForRegister") {
				context.oval(125, 142, 132, 165);
			}
			// 关闭路径
			context.closePath();
			// 剪切路径
			context.clip();
			// 将图片画到画布上
			if (browserFlag == "clearForVerify") {
				context.drawImage(img, 12, 54, 160, 213);
			} else if (browserFlag == "clearForRegister") {
				context.drawImage(img, 60, 60, 132, 165);
			}
			// 调用restore最后一次存储的状态会被恢复
			context.restore();
		}
	} else if (browserFlag == "simple") {
		$("#showFPImageDiv").html(
				"<img src=" + imgSrc + " width='112' height='145' />");
	} else if (browserFlag == "verifySimple") {
		$("#showSeachingDiv").show();
		$("#showSeachingDiv")
				.html(
						"&nbsp;&nbsp;<img src=\"/public/images/searching.gif\" width='20' height='20'/></br><label style='color:yellow;align:center;font-size: 14px;'>处理中...</label>");
	} else if (browserFlag == "clearForSimple") {
		$("#showFPImageDiv").html("");
	}
}

/**
 * 绘画手掌
 * 
 * @author wenxin
 * @create 2013-06-01 09:01:33 am
 * @param context
 *            2d画布上下文
 * @param pointArray
 *            坐标点数组
 * @param color
 *            渲染颜色
 */
var renderHand = function(context, pointArray) {
	this.context = context;
	this.pointArray = pointArray;
	this.isClick = false;
	this.drawHand = function(color) {
		this.context.strokeStyle = color;
		this.context.lineWidth = 1;
		this.context.beginPath();
		for ( var i = 0; i < this.pointArray.length; i++) {
			if (i == 0) {
				this.context.moveTo(this.pointArray[0].x, this.pointArray[0].y);
			} else {
				this.context.lineTo(this.pointArray[i].x, this.pointArray[i].y);
			}
		}
		this.context.stroke();
	};
};

/**
 * 检查指纹采集器
 * 
 * @author wenxin
 * @create 2013-06-17 20:18:31 pm
 * @param context
 *            2d画布上下文
 * @param paramArray
 *            存放国际化元素的数组
 * @param browserFlag
 *            浏览器标记 simple:简易版本，表示是ie浏览器；html5:表示支持html5的浏览器
 */
function checkFPReader(context, paramArray, browserFlag) {
	if (browserFlag == "html5") {
		$.ajax({
			type : "GET",
			url : issOnlineUrl
					+ "/fingerprint/beginCapture?type=1&FakeFunOn=0&random="
					+ getRandomNum(),
			dataType : "json",
			async : false,
			// timeout:1000,
			success : function(result) {
				// 返回码
				var ret = null;
				ret = result.ret;
				// 接口调用成功返回时
				if (ret == 0) {
					// 显示框--采集提示
					collectTips(context, paramArray[0], "html5");
				} else if (ret == -2001) {
					// 显示框--采集提示
					collectTips(context, paramArray[1], "html5");
				} else if (ret == -2002) {
					getWebServerInfo(null, null, "1");
				} else if (ret == -2005) {
					// 显示框--采集提示
					collectTips(context, paramArray[3], "html5");
				}
				collectFlag = true;
				// 取消采集
				cancelRegister();
			},
			error : function(XMLHttpRequest, textStatus, errorThrown) {
				alert("请安装指纹驱动或启动该服务!");
				// messageBox({messageType: "alert", title:
				// "${common_prompt_title}", text: "${base_fp_connectPrompt}"});
			}
		});
	} else if (browserFlag == "simple") {
		// 创建XDomainRequest实例，用于ie8和ie9跨域访问
		var xDomainRequest = new XDomainRequest();
		// 如果xDomainRequest存在,则可以使用xDomainRequest函数，否则，说明不是ie浏览器
		if (xDomainRequest) {
			xDomainRequest.open('GET', issOnlineUrl
					+ "/fingerprint/beginCapture?type=1&FakeFunOn=0&random="
					+ getRandomNum());
			xDomainRequest.onload = function() {
				// 获取接口返回值
				var resultData = xDomainRequest.responseText;
				// 转化为json对象
				var obj = jQuery.parseJSON(resultData);
				// 返回码
				var ret = null;
				if (obj != null && obj.ret != undefined) {
					ret = obj.ret;
				}
				// 接口调用成功返回时
				if (ret == 0) {
					// 显示框--采集提示
					collectTips(null, paramArray[0], "simple");
				} else if (ret == -2001) {
					// 显示框--采集提示
					collectTips(null, paramArray[1], "simple");
				} else if (ret == -2002) {
					getWebServerInfoForSimple(null, null, "1");
				}
				collectFlag = true;
				// 取消采集
				cancelRegister();
			};
			xDomainRequest.onerror = function() {
				// 用完后，将对象置为空
				xDomainRequest = null;
			};
			xDomainRequest.send();
		}
	}
}

/**
 * 显示框--显示采集次数、采集成功、失败等信息
 * 
 * @author wenxin
 * @create 2013-05-16 16:56:31 pm
 * @param context
 *            2d画布上下文
 * @param text
 *            显示信息内容
 * @param browserFlag
 *            浏览器标记或比对验证标记 simple:简易版本，表示是ie浏览器；html5:表示支持html5的浏览器
 *            --verification:指纹验证标记
 */
function collectTips(context, text, browserFlag) {
	if (browserFlag == "simple") {
		$("#showCollInfoDiv")
				.html(
						"<span style='color:rgb(122,193,66); font-size: 12px;word-break: break-all; word-wrap: break-word;'>"
								+ text + "</span>");
	} else if (browserFlag == "html5") {
		context.fillStyle = bgColor;// bgColor;
		context.fillRect(205, 18, 240, 16);

		// 文字右对齐
		context.fillStyle = "rgb(122,193,66)";
		context.font = "12px Arial,微软雅黑";
		// context.shadowColor = 'white';
		// context.shadowBlur = 10;
		// context.strokeText(text, 230, 30);
		context.textAlign = "end";
		context.fillText(text, 400, 30);
	} else if (browserFlag == "verification") {
		// #6BA5D7
		context.fillStyle = "#F3F5F0";// #6BA5D7
		context.fillRect(2, 8, 600, 30);
		// 获取canvas对象
		var canvas = "";
		if (isComp) {
			canvas = document.getElementById("canvasComp");
		} else {
			canvas = document.getElementById("canvas");
		}
		// canvas.width = canvas.width;
		// 返回一个文本的度量信息对象metrics
		var metrics = context.measureText(text);
		// 文本宽度
		var textWidth = metrics.width;
		// canvas宽度
		canvas != null ? canvasWidth = canvas.width : canvasWidth = 450;
		// 文本开始x坐标
		var x = textWidth / 2 + (canvasWidth - textWidth) / 2;

		// context.fillStyle = bgColor;
		// context.fillRect(0, 18, 445, 16);

		// 文字右对齐
		context.fillStyle = "rgb(122,193,66)";
		context.font = "24px Arial,微软雅黑";
		context.textAlign = "center";
		// 自动换行
		autoWordBreak(context, text, canvasWidth, x);
		context.restore();
	} else if (browserFlag == "verifyForSimple") {
		$("#showCollInfoDiv")
				.html(
						"<span style='color:yellow;align:center;font-size: 18px;word-break: break-all; word-wrap: break-word;'>"
								+ text + "</span>");
	}
}

/**
 * 画进度条
 * 
 * @author wenxin
 * @create 2013-05-16 16:56:31 pm
 * @param context
 *            2d画布上下文
 * @param x,y,width,height
 *            进度条底框的坐标和宽度、高度
 */
function drawProgressBar(context, collCount) {
	var x = 300;
	var y = 60;
	var width = 90;
	var height = 20;
	context.fillStyle = bgColor;
	context.fillRect(x, y, width, height);
	if (collCount == 0) {
		context.fillStyle = "rgb(175,181,185)";
		context.fillRect(x + 4, y + 2, width - 52, height - 4);
		context.fillRect(x + 46, y + 2, width - 52, height - 4);
		context.fillRect(x + 86, y + 2, width - 52, height - 4);
	} else if (collCount == 1) {
		context.fillStyle = "rgb(122,193,66)";
		context.fillRect(x + 4, y + 2, width - 52, height - 4);
		context.fillStyle = "rgb(175,181,185)";
		context.fillRect(x + 46, y + 2, width - 52, height - 4);
		context.fillRect(x + 86, y + 2, width - 52, height - 4);
	} else if (collCount == 2) {
		context.fillStyle = "rgb(122,193,66)";
		context.fillRect(x + 4, y + 2, width - 52, height - 4);
		context.fillRect(x + 46, y + 2, width - 52, height - 4);
		context.fillStyle = "rgb(175,181,185)";
		context.fillRect(x + 86, y + 2, width - 52, height - 4);
	} else if (collCount == 3) {
		context.fillStyle = "rgb(122,193,66)";
		context.fillRect(x + 4, y + 2, width - 52, height - 4);
		context.fillRect(x + 46, y + 2, width - 52, height - 4);
		context.fillRect(x + 86, y + 2, width - 52, height - 4);
	}
}

/**
 * 判断当前手指是否在fingerIdArray中，如果在，则说明此手指已经采集指纹
 * 
 * @author wenxin
 * @create 2013-05-15 16:26:31 pm
 * @param num
 *            手指编号
 * @param fingerIdArray
 *            存放手指编号的数组
 * @return 返回boolean值 true:num包含在fingerIdArray中；false:没有包含
 */
function isContains(fingerIdArray, num) {
	var fingerId;
	var isCollected = false;
	for ( var j = 0; j < fingerIdArray.length; j++) {
		fingerId = eval(fingerIdArray[j]);
		if (fingerId >= DURESS_FINGER_NUM) {
			fingerId = fingerId - DURESS_FINGER_NUM;
		}
		if (fingerId == num) {
			isCollected = true;
		}
	}
	return isCollected;
}

/**
 * 清空指纹图像
 * 
 * @author wenxin
 * @create 2013-09-05 15:15:11 pm
 */
function clearFPImage(context, browserFlag) {
	if (browserFlag == "verification") {
		// showImage(context,
		// "${base}/base/images/base_fpVerify_clearImage.png",
		// "clearForVerify");
	} else if (browserFlag == "register") {
		showImage(context, imgUrl, "clearForRegister");
	} else if (browserFlag == "verifyForSimple"
			|| browserFlag == "registerForSimple") {
		showImage(null, "", "clearForSimple");
	}
}

/**
 * 获取指纹模板
 * 
 * @author wenxin
 * @create 2013-05-22 19:51:31 pm
 * @param paramArray
 *            存放国际化元素的数组
 * @param flag
 *            判断是登记和验证标记 register:登记；verification:验证
 */
function getFPTemplate(paramArray, flag) {
	var fpTemplate = "";
	var collectSuccessFlag = false;
	$
			.ajax({
				type : "GET",
				url : issOnlineUrl + "/fingerprint/getTemplate?random="
						+ getRandomNum(),
				dataType : "json",
				async : false,
				success : function(result) {
					// 返回码
					var ret = null;
					ret = result.ret;
					if (ret == 0) {
						fpTemplate = result.data.template;
					}
					// 成功
					if (ret == 0) {
						collectSuccessFlag = true;
						if (flag == "register") {
							// 判断手指是否已经采集指纹
							var compareRet = "";
							// 如果前面已经录入指纹
							if (templateDataArray.length > 0) {
								// 发送请求，进行后台指纹比对yls
								// compareRet = fpComparision(fpTemplate,
								// templateDataArray, paramArray[3]);
							}
							if ($.trim(compareRet) == "dllNotExist") {
								// 采集完指纹，渲染手指
								renderAfterColl(globalContext, fpIdNum,
										bgColor, false);// bgColor判断
								// 显示框--采集提示
								collectTips(globalContext, "动态库加载失败", "html5");
							} else {
								if (compareRet == "noFingerServer") {
									// 采集完指纹，渲染手指
									renderAfterColl(globalContext, fpIdNum,
											bgColor, false);// bgColor判断
									// 显示框--采集提示
									collectTips(globalContext, "未启动比对服务",
											"html5");
								} else {
									// 此手指未采集指纹
									if (compareRet != "ok") {
										// 采集完指纹，渲染手指
										// renderAfterColl(globalContext,
										// fpIdNum, bgColor, true);// bgColor判断
										// 显示框--采集提示
										/*
										 * collectTips(globalContext,
										 * paramArray[0], "html5"); // 胁迫指纹
										 * if(duressFingerFlag) { // 将手指标记保存到数组中
										 * fingerIdArray[fingerIdArray.length] =
										 * fpIdNum + DURESS_FINGER_NUM; } else { //
										 * 将手指标记保存到数组中
										 * fingerIdArray[fingerIdArray.length] =
										 * fpIdNum; } // 将指纹模板保存到数组中
										 * templateDataArray[templateDataArray.length] =
										 * fpTemplate;
										 */
										// 录入指纹
										fpenroll(fpTemplate, fpIdNum, bgColor,
												globalContext);
									} else {
										// 采集完指纹，渲染手指
										renderAfterColl(globalContext, fpIdNum,
												bgColor, false);// bgColor判断
										// Please don't repeat input
										// fingerprint!
										// 显示框--采集提示
										collectTips(globalContext,
												paramArray[2], "html5");
									}
								}
							}
						} else if (flag == "verification") {
							verifyFlag = false;
							// 指纹比对
							fpverify(fpTemplate);
							// fpComparison(fpTemplate);
						}
					} else if (ret == -2003) {
						// 采集完指纹，渲染手指
						renderAfterColl(globalContext, fpIdNum, bgColor, false);
						// 显示框--采集提示
						collectTips(globalContext, paramArray[1], "html5");
					}
				},
				error : function(XMLHttpRequest, textStatus, errorThrown) {
					alert(paramArray[3]);
					// messageBox({messageType: "alert", title:
					// "${common_prompt_title}", text: paramArray[3]});
				}
			});
	return collectSuccessFlag;
}

/**
 * 发送请求到后台，进行比对
 * 
 * @author wenxin
 * @create 2013-08-05 16:20:31 pm
 * @param fpTemplate
 *            指纹模板
 * @param templateArray
 *            指纹模板数组
 * @param errorMsg
 *            ajax请求报错，错误信息
 */
function fpComparision(fpTemplate, templateArray, errorMsg) {
	var ret = "";
	var templates = templateArray.toString();
	// 特殊字符转义
	fpTemplate = transferredMeaning(fpTemplate);
	templates = transferredMeaning(templates);
	$.ajax({
		type : "POST",
		url : "baseBioVerifyAction!fpComparison.action",
		contentType : "application/x-www-form-urlencoded;charset=UTF-8",
		data : "verifyTemplate=" + fpTemplate + "&templates=" + templates,
		dataType : "json",
		async : false,
		success : function(result) {
			if (result.ret == "ok") {
				ret = "ok";
			}
			if (result.msg == "noFingerServer") {
				ret = "noFingerServer";
			}
			if (result.msg == "dllNotExist") {
				ret = "dllNotExist";
			}
		},
		error : function(XMLHttpRequest, textStatus, errorThrown) {
			alert("服务器处理数据失败，请重试！错误码：");
			// messageBox({messageType: "alert", title:
			// "${common_prompt_title}", text: "${common_prompt_serverError}"});
		}
	});
	return ret;
}

/**
 * 采集完指纹后渲染手指
 * 
 * @author wenxin
 * @create 2013-05-18 11:33:31 am
 * @param context
 *            2d画布上下文
 * @param num
 *            当前需要渲染的手指编号
 * @param fillColor
 *            采集完后填充颜色
 * @param successOrNot
 *            采集是否成功--布尔值 true:采集成功；false:采集失败
 */
function renderAfterColl(context, num, fillColor, successOrNot) {
	var canvas = "";
	if (isComp) {
		canvas = document.getElementById("canvasComp");
	} else {
		canvas = document.getElementById("canvas");
	}
	var localContext = canvas.getContext("2d");
	var coordArray = new Array();
	// 初始化起始坐标,并返回json格式数据
	var coordJson = initCoordJson();
	// 进来页面，点击删除
	if (num == null) {
		num = fpIdNum;
	}
	// 点击的手指编号和json中num相等
	if (coordJson[num].num == num) {
		// 初始化坐标数组和绘画手指
		initCoordAndDrawFinger(context, coordArray, coordJson[num].coord.x,
				coordJson[num].coord.y, num);
	}

	// 采集成功，填充颜色(红、绿)
	if (successOrNot) {
		if (duressFingerFlag) {
			localContext.fillStyle = "red";// fillColor
			localContext.fill();
			fpModifyFlag = true;
		} else {
			localContext.fillStyle = "rgb(122,193,66)";// fillColor
			localContext.fill();
			fpModifyFlag = true;
		}
	} else {
		// 采集失败，填充背景色--消除颜色(黄)
		localContext.fillStyle = fillColor;
		localContext.fill();
	}
}

/**
 * 初始化坐标数组和绘画手指--获取当前的context
 * 
 * @author wenxin
 * @create 2013-05-31 18:01:33 pm
 * @param context
 *            2d画布上下文
 * @param pointArray
 *            坐标点数组
 * @param x,y
 *            绘画当前手指的起始坐标
 * @param num
 *            手指标记
 */
function initCoordAndDrawFinger(context, coordArray, x, y, num) {
	coordArray = initCoordArray(coordArray, x, y, num);
	new renderFinger(context, coordArray).drawFinger(strokeStyle,
			fingerBorderColor);
}

/**
 * 点击取消按钮时，触发事件
 * 
 * @author wenxin
 * @create 2013-05-15 17:21:13 pm
 * @param "${base_fp_save}":确认保存当前修改吗?
 */
function cancelEvent(saveText, fpCountText) {
	// 如果没有修改数据
	if (!fpModifyFlag) {
		// 如果正在采集中
		if (collectFlag) {
			// 取消采集
			cancelRegister();
			// 将定时器的递归调用关闭
			clearTimeout(timer);
		}
		// closeWindow();
		close();
	} else {
		var flag = confirm(saveText);
		if (flag) {
			// 保存数据
			fpModifyFlag = false;
			storeDataToHtml();
			saveFPData(flag, fpCountText);
		} else {
			// 撤销数据
			fpModifyFlag = false;
			rollbackData();
			close();
		}

	}

}

/**
 * 点击取消按钮和关闭页面时，弹出框保存数据 cancelEvent()和submitRegister()函数中回调用到
 * 
 * @author wenxin
 * @create 2013-05-14 15:11:31 pm
 * @param result
 *            弹出框选择确定还是取消
 * @param fpCount
 *            指纹数国际化内容
 * @param ${pers_person_templateCount}:指纹数
 */
var saveFPData = function(result, fpCount) {
	if (collectFlag) {
		// 取消采集
		cancelRegister();
		// 将定时器的递归调用关闭
		clearTimeout(timer);
	}
	if (result) {
		showFPCount(fpCount);
		// closeWindow();
		close();
	} else {
		clearImageData();
		// closeWindow();
		close();
	}
}

/**
 * 判断指纹数量--页面加载时，没有计算。只是在采集完指纹后计算指纹数量
 * 
 * @author wenxin
 * @create 2013-04-22 21:26:31 pm
 */
function showFPCount(text) {
	var fingerId = $("#fingerId").val();
	if ($.trim(fingerId) == "") {
		$("#fpCountMessage").text(text + " " + 0);
	} else {
		fingerId = fingerId.substr(1, fingerId.length - 2);
		var fingerIdArray = new Array();
		fingerIdArray = fingerId.split(",");
		$("#fpCountMessage").text(text + " " + fingerIdArray.length);
	}
}

/**
 * 将指纹数据保存到页面
 * 
 * @author wenxin
 * @create 2013-05-24 16:12:21 pm
 */
function storeDataToHtml() {
	var url = currPath + "/commitUserFingers";
	$.ajax({
		type : "POST",
		url : url,
		data : {
			uid : currUserId
		},
		dataType : "json",
		success : function(json) {
			if (json.flag == '0') {
				alert('指纹提交失败');
			}
		},
		error : function(json) {
			 alert('接口错误'); 
		}
	});
	// //没有手指标记数据
	// if(fingerIdArray.length == 0)
	// {
	// $("#fingerId").val(" ");
	// }
	// else
	// {
	// //将手指标记数据保存到页面
	// $("#fingerId").val("["+fingerIdArray.toString()+"]");
	// }
	// //没有指纹模板数据
	// if(templateDataArray.length == 0)
	// {
	// $("#fingerTemplate10").val(" ");
	// }
	// else
	// {
	// //将指纹模板数据保存到页面
	// $("#fingerTemplate10").val("["+templateDataArray.toString()+"]");
	// }
}

// 关闭窗体
function close() {
	$("#bg").css("display", "none");
	$("#box").css("display", "none");
	$("#comparisonDiv").css("display", "none");
	globalContext = "";
}

/**
 * 点击已经采集指纹的手指时，弹出框删除数据 删除时的回调函数
 * 
 * @author wenxin
 * @create 2013-05-14 17:12:21 pm
 * @param result
 *            弹出框选择确定还是取消
 * @param context
 *            2d画布上下文
 * @param browserFlag
 *            浏览器标记 simple:简易版本，表示是ie浏览器；html5:表示支持html5的浏览器
 */
var delFPData = function(result, context, browserFlag) {
	var fingerId;
	if (result) {
		// 将数组中的指定元素删除
		for ( var i = 0; i < fingerIdArray.length; i++) {
			fingerId = eval(fingerIdArray[i]);
			if (fingerId >= DURESS_FINGER_NUM) {
				fingerId = fingerId - DURESS_FINGER_NUM;
				if (fingerId == fpIdNum) {
					removeItem(fingerIdArray, i);
					removeItem(templateDataArray, i);
				}
			} else {
				// 删除用户已登记指纹
				var url = currPath + "/delUserFinger";
				if (fingerId == fpIdNum) {
					$.ajax({
						type : "POST",
						url : url,
						data : {
							fingerNum : fpIdNum,
							uid : currUserId
						},
						dataType : "json",
						async : false,
						success : function(json) {
							if (json.flag == '0') {
								 alert("删除失败");
							} else {
								removeItem(fingerIdArray, i);
								removeItem(templateDataArray, i);
							}
						},
						error : function(XMLHttpRequest, textStatus,
								errorThrown) {
							collectTips(context, "error", "verification");
						}
					});
				}
			}
		}
		if (browserFlag == "simple") {
			document.getElementById("finger" + fingerId).checked = false;
		} else if (browserFlag == "html5") {
			// 将手指颜色改变--重画时也要判断
			context.fillStyle = bgColor;
			context.fill();
			if (lastFPIdNum != null && lastFPIdNum != lastFPIdNum) {
				// 消除原来手指的颜色
				renderAfterColl(globalContext, lastFPIdNum, bgColor, false);
			}
			// 消除需要删除的手指颜色
			renderAfterColl(globalContext, fpIdNum, bgColor, false);
		}
		fpModifyFlag = true;
		$("#duressFinger").attr("disabled", false);
		$("#submitButtonId").attr("disabled", false);
	} else {
		if (browserFlag == "simple") {
			document.getElementById("finger" + fpIdNum).checked = true
			collectFlag = true;
		} else if (browserFlag == "html5") {
			// 消除原来手指的颜色--有问题，如果原来手指和现在的一样，有问题
			// renderAfterColl(globalContext, lastFPIdNum, bgColor, false);
		}
	}
}

/**
 * 删除数组元素 -- 从dx下标开始，删除一个元素
 * 
 * @author wenxin
 * @create 2013-05-15 11:11:31 am
 * @param dx
 *            要删除元素的下标
 */
function removeItem(array, dx) {
	array.splice(dx, 1);
}

/**
 * 指纹验证
 * 
 * @author wenxin
 * @create 2013-06-21 11:09:20 am
 * @param title
 *            页面标题国际化内容
 * @param isDriverInstall
 *            是否安装了驱动
 * @param downloadPrompt
 *            提示安装驱动国际化内容
 */
function fpVerification(title, downloadPrompt, isDriverInstall, context) {
	// 安装驱动
	if (isDriverInstall) {
		// 支持html5
		if (typeof (Worker) != "undefined") {
			// createWindow('base_baseFPVerify.do?random=' + getRandomNum() +
			// '^0^0^465^320^'+title);
			var comparisonDiv = document.getElementById("comparisonDiv");
			var bg = document.getElementById("bg");
			comparisonDiv.style.display = "block";// 显示内容层，显示覆盖层
			comparisonDiv.style.left = parseInt((document.documentElement.scrollWidth - comparisonDiv.offsetWidth) / 2)
					+ document.documentElement.scrollLeft + "px";
			comparisonDiv.style.top = Math
					.abs(parseInt((document.documentElement.clientHeight - comparisonDiv.offsetHeight) / 2))
					+ document.documentElement.scrollTop + "px"; // 为内容层设置位置
			bg.style.display = "block";
			bg.style.height = document.documentElement.scrollHeight + "px";
			isComp = true;

			// ????? img
			var currPath = window.location.pathname;
			if (currPath.indexOf("/admin/") > 0) {
				$("#canvasComp").css("background",
						"url('fp/image/base_fpVerify.jpg') rgb(243, 245, 240)");
			}
			// 开始采集
			// beginCapture(context);
			dataInitComp();
			// 关闭页面前，取消采集
			// cancelCaptureBeforeClose("html5");
		} else {
			createWindow('base_baseFPVerifySimple.do?random=' + getRandomNum()
					+ '^0^0^465^320^' + title);
			// 关闭页面前，取消采集
			// cancelCaptureBeforeClose("simple");
		}
	} else {
		alert(downloadPrompt);
		// messageBox({messageType: "alert", title: "提示", text:
		// downloadPrompt});
	}
}

/**
 * 画布文本自动换行
 * 
 * @author chenpf
 * @create 2015-03-10 16:56:31 pm
 * @param context
 *            2d画布上下文
 * @param text
 *            显示信息内容
 * @param CWidth
 *            画布宽度
 * @param x
 *            文本X坐标值
 * 
 */
function autoWordBreak(context, text, CWidth, x) {
	context.clear();
	var rownum = CWidth / 10;
	var len = strlen(text);
	if (rownum > len) {
		context.fillText(text, x, 30);
	} else {
		var endInd = rownum < text.length ? rownum : text.length;
		var beginInd = 0;
		var endTemp = 0;
		for ( var i = 0; i <= text.length / rownum; i++) {
			endTemp = text.substr(beginInd, endInd).lastIndexOf(" ");
			if (endTemp != -1)
				endInd = beginInd + endTemp;
			context.fillText(text.substr(beginInd, endInd), x, (i + 1) * 30);
			beginInd = endInd + 1;
			if (beginInd >= text.length)
				break;
			endInd = beginInd + rownum;
		}
	}
}

// 清除画布内容
CanvasRenderingContext2D.prototype.clear = CanvasRenderingContext2D.prototype.clear
		|| function(preserveTransform) {
			if (preserveTransform) {
				this.save();
				this.setTransform(1, 0, 0, 1, 0, 0);
			}

			this.clearRect(0, 0, this.canvas.width, this.canvas.height);

			if (preserveTransform) {
				this.restore();
			}
		};

/**
 * 关闭页面前，如果正在进行验证，则先取消采集
 * 
 * @author wenxin
 * @create 2013-06-24 19:57:11 pm
 * @param browserFlag
 *            浏览器标记 simple:简易版本，表示是ie浏览器；html5:表示支持html5的浏览器
 */
function cancelCaptureBeforeClose(browserFlag) {
	// 关闭页面时，监听关闭的onclick事件
	getCurrentWindow().button("close").attachEvent("onClick", function() {
		clearTimeout(verifyTimer);
		if (browserFlag == "html5") {
			// 正在进行验证，还没有关闭指纹采集
			if (verifyFlag) {
				// 取消采集
				cancelCapture();
			}
			// 关闭页面
			closeWindow();
		} else if (browserFlag == "simple") {
			// alert("cancel capture before close window!");
			// 将定时器的递归调用关闭
			clearTimeout(timer);
			// 取消采集
			cancelRegister();
			// 此处应该在取消结束后，再关闭窗口
			closeWindow();
		}
	});
}

/**
 * 表单提交
 * 
 * @author wenxin
 * @create 2013-08-05 15:19:11 pm
 */
function formSubmit(id) {

	$('#' + id).serialize();
	$('#' + id).ajaxForm(function(data) {
		callBackFormSubmit(data);
	});
	$('#' + id).submit(); // 表单提交。
}

/**
 * 指纹登录
 * 
 * @param fpTemplate
 */
function fpverify(fpTemplate) {
	var url = currPath + "/login";

	$.ajax({
		type : "POST",
		url : url,
		data : {
			fingerprint : fpTemplate
		},
		dataType : "json",
		async : false,
		success : function(json) {
			if (json.flag == '0') {
				alert("验证失败");
			} else {
				alert("验证指纹成功. " + json.msg);
			}
		},
		error : function(XMLHttpRequest, textStatus, errorThrown) {
			collectTips(context, "验证指纹失败", "verification");
		}
	});
}

function fpenroll(fpTemplate, fingerId) {
	var url = currPath + "/register";
	$.ajax({
		type : "POST",
		url : url,
		data : {
			fingerprint : fpTemplate,
			fingerNum : fingerId,
			uid : currUserId
		},
		dataType : "json",
		async : false,
		success : function(json) {
			if (json.flag == '0') {
				 renderAfterColl(globalContext, fpIdNum, bgColor, false);
				 collectTips(globalContext, "指纹登记失败", "html5");
			} else if (json.flag == '1') {
				 collectTips(globalContext, "指纹登记成功", "html5");
				 renderAfterColl(globalContext, fingerId, bgColor, true);
				// 将手指标记保存到数组中
				 fingerIdArray[fingerIdArray.length] = fpIdNum;
				// 将指纹模板保存到数组中
				 templateDataArray[templateDataArray.length] = fpTemplate;
			} else if (json.flag == '2') {
				 renderAfterColl(globalContext, fpIdNum, bgColor, false);
				 collectTips(globalContext, "指纹已存在", "html5");
			}
		},
		error : function(XMLHttpRequest, textStatus, errorThrown) {
			alert("添加失败");
		}
	});
}

function rollbackData() {
	var url = currPath + "/rollBackUserFingers";
	$.ajax({
		type : "POST",
		url : url,
		data : {
			uid : currUserId
		},
		dataType : "json",
		async : false,
		success : function(json) {
			//
		},
		error : function(XMLHttpRequest, textStatus, errorThrown) {
			alert("取消操作失败");
		}
	});
}

function fpVerificationMsg() {
	alert("请安装指纹驱动或启动该服务");
}

function fpoper(userid, oper) {
	currUserId = userid;
	switch (oper) {
	case 'enroll':
		submitRegister('指纹', '指纹数:', '确认保存当前修改吗?', null, true);
		break;
	}
}
