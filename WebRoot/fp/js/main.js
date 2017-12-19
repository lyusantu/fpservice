//全局2d画笔
var globalContext = null;
// 页面右上角圆弧的背景色
var arcBgColor = "rgb(54, 100, 139)";
// 页面背景色
// var bgColor = "rgb(0, 0, 0)";
// 验证标记--是否已经进行验证 true:正在进行验证;false:否
var verifyFlag = false;
// 模式:1--1:1,2--1:N
var model = "2";
// 绘画双手的起点横坐标
var x = 28;
// 绘画双手的起点纵坐标
var y = 346;
// 存放画手指函数的数组
var fingerList = [];
// 保存当前正在采集的手指标记--删除时，消除当前正在采集的手指颜色时用到
var lastFPIdNum = null;
// 绘画手指的边框颜色
var fingerBorderColor = "rgb(71,75,79)";
// 页面右上角圆弧的背景色
// var arcBgColor = "rgb(243, 245,240)";
// 页面背景色
var bgColor = "rgb(243, 245,240)";
// 绘画的图形边框样式--边线绘图
var strokeStyle = "stroke";
// 绘画的图形填充样式--填充绘图
var fillStyle = "fill";
// 点击手指 的颜色
var fillFingerColor = "rgb(71,75,79)";
// 判断是否修改了数据(包括新增和删除)
var fpModifyFlag = false;

/**
 * 画椭圆 -- 给context添加绘画椭圆的属性
 * 
 * @author wenxin
 * @create 2013-05-15 10:11:21 am
 * @param x,
 *            y 椭圆定位的坐标
 * @param width,
 *            height 椭圆的宽度和高度
 */
CanvasRenderingContext2D.prototype.oval = function(x, y, width, height) {
	var k = (width / 0.75) / 2, w = width / 2, h = height / 2;
	this.strokeStyle = bgColor;
	this.beginPath();

	this.moveTo(x, y - h);
	this.bezierCurveTo(x + k, y - h, x + k, y + h, x, y + h);
	this.bezierCurveTo(x - k, y + h, x - k, y - h, x, y - h);
	this.closePath();
	this.stroke();
	return this;
}

/**
 * 查动态库连接回调函数
 * 
 * @author wenxin
 * @create 2013-05-15 17:12:21 pm
 * @param ${pers_person_templateCount}:指纹数
 */
function getDLLConnectCallBack(result, isComp) {
	if (globalContext == null) {
		if (isComp == true) {
			globalContext = document.getElementById("canvasComp").getContext(
					"2d");
		} else {
			globalContext = document.getElementById("canvas").getContext("2d");
		}
	}
	// 返回码
	var ret = null;
	ret = result.ret;
	// 接口调用成功返回时
	if (ret == 0) {
		// ${base_fp_connectFail}:连接指纹采集器失败
		collectTips(globalContext, "未检测到指纹采集器.", "verification");
	} else {
		// ${base_fp_loadFail}:加载ZKFinger10失败
		collectTips(globalContext, "加载动态库失败.", "verification");
	}
}
/**
 * 调用begincapture接口，开始采集指纹
 * 
 * @author wenxin
 * @create 2013-06-24 10:11:21 am
 * @param context
 *            2d画布上下文
 */
function beginCapture(context) {
	$.ajax({
		type : "GET",
		url : issOnlineUrl
				+ "/fingerprint/beginCapture?type=2&FakeFunOn=0&random="
				+ getRandomNum(),
		dataType : "json",
		async : true,
		success : function(result) {
			// 返回码
			var ret = null;
			ret = result.ret;
			// 接口调用成功返回时
			if (ret == 0) {
				verifyFlag = true;
				// 检查采集、显示图像
				checkColl();
			} else if (ret == -2001) {
				// ${base_fp_connectFail}:连接指纹采集器失败
				// 显示框--采集提示
				collectTips(context, "未检测到指纹采集器.", "verification");
			} else if (ret == -2002) {
				getWebServerInfo(null, null, "1");
			} else if (ret == -2005) {
				// 取消采集
				cancelCapture();
				// 开始采集
				beginCapture(globalContext);
			}
		},
		error : function(XMLHttpRequest, textStatus, errorThrown) {
			alert("请安装指纹驱动或启动该服务!");
			// messageBox({messageType: "alert", title:
			// "${common_prompt_title}", text: "${base_fp_connectPrompt}"});
		}
	});
}
/**
 * 检查采集--递归调用，如果有采集到指纹，显示图像，获取模板，进行比对
 * 
 * @author wenxin
 * @create 2013-06-24 10:11:21 am
 */
function checkColl() {
	var base64FPImg = "";
	// 返回码
	var ret = null;
	$.ajax({
		type : "GET",
		url : issOnlineUrl + "/fingerprint/getImage?random=" + getRandomNum(),
		dataType : "json",
		async : true,
		success : function(result) {
			debugger;
			// alert(objToStr(data));
			// 指纹采集次数
			var collCount = 0;
			ret = result.ret;
			if (ret == 0) {
				collCount = result.data.enroll_index;
				base64FPImg = result.data.jpg_base64;
			}
			if (collCount == 0) {
				// 定时器
				timer = setTimeout("checkColl()", 200);// 比对失败重新开始
			} else {
				// 将定时器关闭
				clearTimeout(verifyTimer);
				// 显示指纹图像
				showImage(globalContext, base64FPImg, "verification");
				// 存放国际化元素数组
				var paramArray = new Array();
				paramArray[0] = '成功登记指纹';// ${base_fp_registerSuccess}:成功登记指纹
				paramArray[1] = '请重按手指';// ${base_fp_pressFingerAgain}:请重按手指
				paramArray[3] = '请检查网络连接';// ${base_fp_connectPrompt}:请检查网络连接
				// 获取指纹模板
				getFPTemplate(paramArray, "verification");
				$("#oneToMany").attr("disabled", false);
				$("#oneToOne").attr("disabled", false);
				setTimeout("beginCapture(null)", 200);
			}
		},
		error : function(XMLHttpRequest, textStatus, errorThrown) {
			alert("请安装指纹驱动或启动该服务!");
			// messageBox({messageType: "alert", title:
			// "${common_prompt_title}", text: "${base_fp_connectPrompt}"});
		}
	});
}
/**
 * 指纹比对
 * 
 * @author wenxin
 * @create 2013-06-24 17:41:21 pm
 * @param fpTemplate
 *            指纹模板
 */
function fpComparison(fpTemplate) {
	if (model == "1") {
		if ($("#persNumText").val() != "${pers_person_pin}") {
			$("#pin").val($("#persNumText").val());
		}
	}
	$("#verifyModel").val(model);
	$("#verifyTemplate").val(fpTemplate);
	// 表单提交
	// formSubmit("fpVerifyForm");

}
/**
 * 取消采集
 * 
 * @author wenxin
 * @create 2013-06-24 19:57:11 pm
 */
function cancelCapture() {
	// 将定时器的递归调用关闭
	clearTimeout(timer);
	// 取消采集
	$.ajax({
		type : "GET",
		url : issOnlineUrl + "/fingerprint/cancelCapture?random="
				+ getRandomNum(),
		dataType : "json",
		async : true,
		success : function(result) {
			verifyFlag = false;
		},
		error : function(XMLHttpRequest, textStatus, errorThrown) {
			alert("请安装指纹驱动或启动该服务!");
			// messageBox({messageType: "alert", title:
			// "${common_prompt_title}", text: "${base_fp_connectPrompt}"});
		}
	});
}
/**
 * 确定按钮事件
 * 
 * @author wenxin
 * @create 2013-06-26 16:57:11 pm
 */
function beginVerify() {
	if ($("#persNumText").val() == "${pers_person_pin}" && model == "1") {
		// ${base_fp_enterPin}:请输入人员编号
		// 显示框--采集提示
		collectTips(globalContext, "请输入人员编号", "verification");
		return;
	} else {
		// ${base_fp_verifyInfo}:请水平按压手指验证
		// 显示框--采集提示
		collectTips(globalContext, "请水平按压手指验证", "verification");
	}

	// 取消采集--如果当前正在采集
	cancelEvent();
	$("#oneToMany").attr("disabled", true);
	$("#oneToOne").attr("disabled", true);
	// 开始采集
	beginCapture(globalContext);
}

/**
 * 清空
 * 
 * @author wenxin
 * @create 2013-09-05 16:57:11 pm
 */
function clearImageData() {

	if (isComp) {
		// 清空指纹图像
		clearFPImage(globalContext, "verification");
		// 显示框--采集提示
		collectTips(globalContext, "请水平按压手指验证", "verification");
	} else {
		// 清空指纹图像
		clearFPImage(globalContext, "register");
	}
}
/**
 * 表单提交回调函数
 * 
 * @author wenxin
 * @create 2013-06-26 16:57:11 pm
 */
function callBackFormSubmit(msg) {
	if (msg.ret == "ok")// 成功
	{
		collectTips(globalContext, "验证通过", "verification");
		setTimeout("closeVerify()", 1000);
		setTimeout(_callBackFunction("dashboard.action"), 1000);
	} else if (msg.msg == "disabled") {
		collectTips(globalContext, "${auth_login_disabled}", "verification");
		setTimeout("closeVerify()", 1000);
		$(".errorTip").html("${auth_login_disabled}");
		$(".errorTip").show();
	} else if (msg.msg == "notExist") {
		collectTips(globalContext, "验证失败", "verification");
		setTimeout("clearImageData()", 1000);
		beginCapture(globalContext);
	}

}
/**
 * 关闭比对页面
 * 
 * @author wenxin
 * @create 2013-06-21 14:57:11 pm
 */
function closeVerify() {
	// 正在进行验证，还没有关闭指纹采集
	if (verifyFlag) {
		// 取消采集
		cancelCapture();
	}
	close();
}
/**
 * 页面加载时，初始化数据
 * 
 * @author wenxin
 * @create 2013-07-09 15:18:31 pm
 */
function dataInitComp() {
	var canvas = document.getElementById("canvasComp");
	var context = canvas.getContext("2d");
	globalContext = context;
	// 文本框内提示信息并清空
	// checkText();

	// ${base_fp_verifyInfo}:请水平按压手指验证
	// 显示框--采集提示
	collectTips(context, "请水平按压手指进行登录验证", "verification");

	// 开始采集
	beginCapture(context);
	// 定时器
	verifyTimer = setTimeout("closeVerify()", 500000);
}
// 初始化数据
// dataInit();
/**
 * 点击确定按钮时，触发事件
 * 
 * @author wenxin
 * @create 2013-05-15 17:12:21 pm
 * @param ${pers_person_templateCount}:指纹数
 */
function submitEvent() {
	fpModifyFlag = false;
	storeDataToHtml();
	showFPCount('指纹数:');
	// closeWindow();
	close();
}

/**
 * 采集指纹
 * 
 * @author wenxin
 * @create 2013-05-13 10:18:31 am
 * @param context
 *            2d画布上下文
 */
function fpCollection(context) {
	$.ajax({
		type : "GET",
		url : issOnlineUrl
				+ "/fingerprint/beginCapture?type=1&FakeFunOn=0&random="
				+ getRandomNum(),
		dataType : "json",
		async : true,
		success : function(result) {
			// 返回码
			var ret = null;
			ret = result.ret;
			// 接口调用成功返回时
			if (ret == 0) {
				// 检查采集次数、显示图像
				checkCollCount();
			} else if (ret == -2001) {
				// ${base_fp_connectFail}:连接指纹采集器失败
				// 显示框--采集提示
				collectTips(globalContext, "未检测到指纹采集器.", "html5");
			} else if (ret == -2002) {
				getWebServerInfo(null, null, "1");
			} else if (ret == -2005) {
				// 取消采集
				cancelRegister();
				// 切换手指后，渲染手指(消除原来手指的颜色)
				renderAfterColl(globalContext, fpIdNum, bgColor, false);
				// ${base_fp_pressFinger}:请选择手指
				// 显示框--采集提示
				collectTips(globalContext, "请选择手指.", "html5");
			}
		},
		error : function(XMLHttpRequest, textStatus, errorThrown) {
			alert("请安装指纹驱动或启动该服务!");
			// messageBox({messageType: "alert", title: "提示", text:
			// "请安装指纹驱动或启动该服务!"});
		}
	});
}
/**
 * 检查采集次数
 * 
 * @author wenxin
 * @create 2013-05-22 09:24:31 am
 * @param collCount
 *            采集次数
 */
function checkCollCount() {
	var base64FPImg = "";
	// 返回码
	var ret = null;
	$.ajax({
		type : "GET",
		url : issOnlineUrl + "/fingerprint/getImage?random=" + getRandomNum(),
		dataType : "json",
		async : false,
		success : function(result) {
			// alert(objToStr(data));
			// 指纹采集次数
			var collCount = 0;
			ret = result.ret;
			if (ret == 0) {
				collCount = result.data.enroll_index;
				base64FPImg = result.data.jpg_base64;
			}
			if (collCount != 3) {
				// 第一次和第二次采集，显示采集次数、指纹图像、进度条
				if (collCount == 1 || collCount == 2) {
					// ${base_fp_collCount}:按压指纹剩余次数:
					var text = "按压剩余次数:" + (FINGERPRINT_NUMBER - collCount);
					// 显示框--采集提示
					collectTips(globalContext, text, "html5");
					// 进度条
					drawProgressBar(globalContext, collCount);
					// 显示指纹图像
					showImage(globalContext, base64FPImg, "html5");
					// 清空图像
					setTimeout("clearImageData()", 200);
				}
				// 定时器
				timer = setTimeout("checkCollCount()", 200);
			} else {
				// 显示指纹图像
				showImage(globalContext, base64FPImg, "html5");
				// 清空图像
				setTimeout("clearImageData()", 200);
				// 存放国际化元素数组
				var paramArray = new Array();
				paramArray[0] = "成功登记指纹.";// base_fp_registerSuccess:成功登记指纹
				paramArray[1] = "采集失败，请重新登记.";// base_fp_pressFingerAgain:请重按手指
				paramArray[2] = "请不要重复录入指纹!";// base_fp_repeatCollection:请不要重复录入指纹!
				paramArray[3] = "请安装指纹驱动或启动该服务!";// base_fp_connectPrompt:请检查网络连接
				// 进度条
				drawProgressBar(globalContext, collCount);
				// 获取指纹模板
				if (!getFPTemplate(paramArray, "register")) {
					drawProgressBar(globalContext, 0);// 进度条灰显
				}

				// 如果胁迫指纹选中，则取消选中
				if (duressFingerFlag) {
					$("#duressFinger").attr("checked", false);
				}
				$("#duressFinger").attr("disabled", false);
				$("#submitButtonId").attr("disabled", false);
				collectFlag = false;
				fpIdNum = -1;
				return collCount;
			}
		},
		error : function(XMLHttpRequest, textStatus, errorThrown) {
			alert("请安装指纹驱动或启动该服务!");
			// messageBox({messageType: "alert", title: "提示", text:
			// "请安装指纹驱动或启动该服务!"});
		}
	});

}

/**
 * 取消采集，当采集中断时
 * 
 * @author wenxin
 * @create 2013-05-27 17:46:31 pm
 */
function cancelRegister() {
	// 当前有手指在采集指纹
	if (collectFlag) {
		// 将定时器的递归调用关闭
		clearTimeout(timer);
		// 取消采集
		$
				.ajax({
					type : "GET",
					url : issOnlineUrl + "/fingerprint/cancelCapture?random="
							+ getRandomNum(),
					dataType : "json",
					async : false,
					success : function(result) {
						// 如果胁迫指纹选中，则取消选中
						if (duressFingerFlag) {
							$("#duressFinger").attr("checked", false);
						}
						if (fpModifyFlag) {
							$("#submitButtonId").attr("disabled", false);
						}
						$("#duressFinger").attr("disabled", false);
						if (fpIdNum != null) {
							// 消除原来手指的颜色

							renderAfterColl(globalContext, lastFPIdNum,
									bgColor, false);
						}
						collectFlag = false;
					},
					error : function(XMLHttpRequest, textStatus, errorThrown) {
						alert("请安装指纹驱动或启动该服务!");
						// messageBox({messageType: "alert", title: "提示", text:
						// "请安装指纹驱动或启动该服务!"});
					}
				});
	}
}

/**
 * 绘画
 * 
 * @author wenxin
 * @create 2013-05-13 10:18:31 am
 * @param context
 *            2d画布上下文
 * @param x,
 *            y 绘画左手掌的第一个点的坐标，后面的绘画手指和右手掌的坐标都是相对于此点坐标来计算
 * @param color
 *            绘画手指和手掌的边框颜色
 */
function draw(context, x, y, color) {
	var coordArray = new Array();
	// 初始化起始坐标,并返回json格式数据
	var coordJson = initCoordJson();
	for ( var i = 0; i < coordJson.length; i++) {
		// 绘画双手和圆弧
		drawHandAndArc(context, coordArray, color, coordJson[i].coord.x,
				coordJson[i].coord.y, coordJson[i].num);
		// drawHandAndArc(context, coordArray, color, coordJson[i].coord.x,
		// coordJson[i].coord.y, i);
		coordArray = null;
		coordArray = new Array();
	}
	// 存放国际化元素数组
	var paramArray = new Array();
	paramArray[0] = "请选择手指.";
	paramArray[1] = "未检测到指纹采集器.";
	paramArray[2] = "加载动态库失败.";
	paramArray[3] = "请选择手指.";

	// 检查指纹采集器
	checkFPReader(context, paramArray, "html5");

	// 进度条
	drawProgressBar(context, 0);
	// 将确定按钮置灰
	$("#submitButtonId").attr("disabled", true);
}
/**
 * 绘画双手和圆弧
 * 
 * @author wenxin
 * @create 2013-06-17 10:18:31 am
 * @param context
 *            2d画布上下文
 * @param coordArray
 *            坐标数组
 * @param x,
 *            y 绘画左手掌的第一个点的坐标，后面的绘画手指和右手掌的坐标都是相对于此点坐标来计算
 * @param color
 *            绘画手指和手掌的边框颜色
 * @param num
 *            当前会话对象编号
 */
function drawHandAndArc(context, coordArray, color, x, y, num) {
	// 初始化坐标
	coordArray = initCoordArray(coordArray, x, y, num);
	var drawObj = null;
	// 绘画手指
	if (num < 10) {
		drawObj = "finger" + num;
		drawObj = new renderFinger(context, coordArray);
		drawObj.drawFinger(strokeStyle, color);
		// 初始化时，渲染手指
		renderInit(context, num, "html5");
		// 将绘画的手指实例放入数组，方便重画时用
		if (fingerList.length < 10) {
			fingerList.push(drawObj);
		}
	}
	// 绘画双手掌心
	else if (num < 12) {
		new renderHand(context, coordArray).drawHand(color);
	}
	// 绘画圆圈
	showImage(context, imgUrl, "clearForRegister");
	// 绘画圆弧
	// else if(num == 12)
	// {
	// new FillArc(context, coordArray).drawArc(arcBgColor);
	// }
}
/**
 * 重画
 * 
 * @author wenxin
 * @create 2013-05-13 10:18:31 am
 * @param x,
 *            y 鼠标点击处的坐标
 */
function redraw(x, y) {
	var canvas = document.getElementById("canvas");
	if (canvas.getContext) {
		var context = canvas.getContext("2d");

		// 是否点击在手指区域
		var isInFingerArea = false;
		// 判断当前点击是否在手指区域
		for ( var i = 0; i < fingerList.length; i++) {
			var finger = fingerList[i];
			finger.drawFinger(strokeStyle, fingerBorderColor);
			if (context.isPointInPath(x, y)) {
				isInFingerArea = true;
				break;
			}
		}

		outerloop: for ( var i = 0; i < fingerList.length; i++) {
			if (collectFlag) {
				// 当点击的是同一个手指时，如何判断?(编辑指纹时，有问题)
				if (fpIdNum == i) {
					// 切换手指后，渲染手指(消除原来手指的颜色)
					renderAfterColl(globalContext, fpIdNum, bgColor, false);
				}
			}
			var finger = fingerList[i];
			finger.drawFinger(strokeStyle, fingerBorderColor);
			// currentContext = context;
			if (context.isPointInPath(x, y)) {
				globalContext = context;
				// 两次是否点击的同一个手指进行采集。如果是，则第二次点击时取消采集。
				var iaSameFinger = false;
				if (fpIdNum == i && collectFlag) {
					iaSameFinger = true;
				}
				var fingerId;
				// 判断该手指是否已经有指纹
				var isCollected = false;
				isCollected = isContains(fingerIdArray, i);
				fpIdNum = i;
				if (!isCollected) {
					// 保存当前正在采集的手指标记
					lastFPIdNum = fpIdNum;
				}
				// 如果已经有指纹
				if (isCollected) {
					// 取消采集
					cancelRegister();
					var flag = confirm("删除当前选中的指纹吗?");
					if (flag) {
						delFPData(flag, context, "html5");
						collectTips(globalContext, "请选择手指.", "html5");
						// 进度条
						drawProgressBar(globalContext, 0);
					}

					break outerloop;
				} else {
					// 两次点击的同一个手指进行采集，则第二次取消采集。
					if (iaSameFinger) {
						// 取消采集
						cancelRegister();
						// 取消采集后重新提示请选择手指
						collectTips(globalContext, "请选择手指.", "html5");
						// 取消采集后重新绘制进度条
						drawProgressBar(context, 0);
						fpIdNum = -1;
					} else {
						// 取消采集
						cancelRegister();
						context.fillStyle = fillFingerColor;
						context.fill();
						// globalContext = context;
						collectFlag = true;// 需要判断，当重复点击时，颜色改变
						$("#duressFinger").attr("disabled", true);
						$("#submitButtonId").attr("disabled", true);
						// ${base_fp_collCount}:按压指纹剩余次数:
						var text = "按压剩余次数:" + FINGERPRINT_NUMBER;
						// 进度条
						drawProgressBar(globalContext, 0);
						// 显示框--采集提示
						collectTips(globalContext, text, "html5");
						// 指纹采集
						fpCollection(context);
					}
				}
			} else {
				context.fillStyle = bgColor;
				context.fill();
				renderInit(context, i, "html5");
				if (collectFlag) {
					if (fpIdNum == i && !isInFingerArea) {
						context.fillStyle = fillFingerColor;
						context.fill();
					}
				}
			}
		}
	}
}

/**
 * 页面加载时，初始化数据
 * 
 * @author wenxin
 * @create 2013-07-09 15:18:31 pm
 */
function dataInitReg() {
	if (!duressFingerShowFlag) {
		$("#duressFingerDiv").hide();
	}
	var canvas = document.getElementById("canvas");
	var context = canvas.getContext("2d");

	fpIdNum = null;
	// 获取页面的指纹数据
	getDataFromPage();
	// 绘画
	draw(context, x, y, fingerBorderColor);
	// 重画
	redraw(x, y);
	// jquery在ie下实现cors跨域请求
	jQuery.support.cors = true;
	// 鼠标事件
	canvas.onmousedown = function(event) {
		// event.which == 1--鼠标左键
		if (event.which == 1) {
			var pageInfo = canvas.getBoundingClientRect();
			var x = event.clientX - pageInfo.left;
			var y = event.clientY - pageInfo.top;
			// 重画
			redraw(x, y);
		}
	}
}

function myfunction() {
	// 加载xml中ISSOnline_server的ip和port
	// loadXml("<%=basePath%>"+"webapp/xml/BaseISSOnlineServer.xml");
	// 加载指纹标记和指纹模板数据到页面
	loadFPDataTemplate("[]", "[]");
	var browserFlag = "";
	// 存放国际化元素数组
	var paramArray = new Array();
	// 获取浏览器类型
	browserFlag = getBrowserType();
	paramArray[0] = '指纹';
	paramArray[1] = '指纹数:';
	paramArray[2] = '确认保存当前修改吗?';
	paramArray[3] = '登记';
	paramArray[4] = '请安装指纹驱动或启动该服务!';
	paramArray[5] = '0';
	paramArray[6] = '指纹数:';
	paramArray[7] = '验证';
	// 检查驱动
	checkDriver(paramArray, browserFlag, false);
}

function closeCompa() {
	$("#bg").css("display", "none");
	$("#box").css("display", "none");
	$("#comparisonDiv").css("display", "none");
	cancelCapture();
}

// 初始化界面数据，即清除指纹记录。
function cleanData() {
	var canvas = document.getElementById("canvas");
	var context = canvas.getContext("2d");
	fpIdNum = null;
	getDataFromPage();
	draw(context, x, y, fingerBorderColor);
	jQuery.support.cors = true;
	redraw(x, y);
}

function doVerify() {
	var regTemplate = "TVFTUjIyAAAEEhAFBQUHCc7QAAAcE2kAAAAAgyEgiBKiAacPlQABAIIdnAHcAH4PagBlEmYN6ACJAA0PLhKrAaoPSADAAZcdEQGWACsONgA8EqwMzQAYAEYPZBJMAIMOhAB3AJodXgGdALIPeAB5EmQPqQBZADAMNxKXAbMPRACKAMIdAABwAM4PYQAbEvkOoQA9Ab0PAhMXAFMOtQCeAfAdlwGIAM0PZABvEucMcgDfAEoPyBJqAUgOngDAAX0dcAEyANkPUAAnE/cOIwBXAH8PAxMHAFMMGQDiAMEdLAmp3xIhWOopGLPgtfpCBkfzxGWAgSogmv2fgkJ1qPtygM/6FgYnAf6ecoBWeeZzdz8K4i9neo/e2VeB9g7jj7PzfPgBCHvu5hdWAxMP/QzLAbaAsJMYEaa8IAtOidYD9w2j/FoCFgk3ia4jhmX6I8cHuYf3hcMQ8AG335Nj830/ERZyASuC6G9qhZJs8OoY8hMfC8filOfG4M5Wk4TO7EYDExab4gbnvZFXfbcHvvW69PsZcAGv37/XMgzfEcLuzLf4/cQJBBIDMVlMFw+e9VYh1l1f/06bOqskIQADRB4qBMUsBEicDQA4AFoBwIJDgiUARABXVXhw7cCVw4DDb0fAf9CGxRQAVACnosXSwkSEwsDCBosDEmABXpNcDsWHBHvCgWd4eAbFngRlx8HAwwUAHwAN7P7ZDAAOAoZ4+9FSbgMAGQWJwwgSYhNTwVyABYgZEswVj6lpwkl6ldSDocPBSQnF1R0dwf/9/f4kwQDJCIGOBAAbLviECxMNL6mZfsUFwcDSwcMRAO83WcPFgJONkMQLAKs4SNLDcMHClhbFp0r7/P3A+fjAm/767PzB/f/9wOMDBNtTgcMJAJmlU6XUyMLDDQELoEkyVMHB+10GAMtrOYHBDQAUazAFc4BuBQG8b3Cn3gDPYEf//vz9/D76+u38//7///w7/vns//v9wP3A3gEPb0j///9HwDhU++3+/ztE/0beAQiBSP/+PlP+Ov/7UsH8///AwDv/xewLARSXKXivhQ4SNp0peIOJzgEPvVIqV8AzDsUMvznDdcFsb8HdARSuXVVTPsDA7v867f9LBwAMyvWZaB4ADsta/0eQ/kkeABDZXP/COcFP0zMHAAveJwbAxNECAZ3fdP3QAQTsZUZM//5bBf/60j/BChAXC9N0emUGEZ8Icf6F/w0DAgtiPkr/yBEGC2ZL/8D+wzr+XRYRWVt9MgrUAiJ1RcH/ZAwQyynz63PD/8PAasIQED0XwMDCagjVDjU7n8GNBRChhXTEKgQR5kNtRcEQ511sRVJCABmGAQYTAccAWl8AxACmEoXUAAAZRZcAQFAAAAAAABbFAAQSAzIAAAAAxQBBUA==";
	var fpTemplate = "TVFTUjIyAAAEEhAFBQUHCc7QAAAcE2kAAAAAgyEgiBKiAacPlQABAIIdnAHcAH4PagBlEmYN6ACJAA0PLhKrAaoPSADAAZcdEQGWACsONgA8EqwMzQAYAEYPZBJMAIMOhAB3AJodXgGdALIPeAB5EmQPqQBZADAMNxKXAbMPRACKAMIdAABwAM4PYQAbEvkOoQA9Ab0PAhMXAFMOtQCeAfAdlwGIAM0PZABvEucMcgDfAEoPyBJqAUgOngDAAX0dcAEyANkPUAAnE/cOIwBXAH8PAxMHAFMMGQDiAMEdLAmp3xIhWOopGLPgtfpCBkfzxGWAgSogmv2fgkJ1qPtygM/6FgYnAf6ecoBWeeZzdz8K4i9neo/e2VeB9g7jj7PzfPgBCHvu5hdWAxMP/QzLAbaAsJMYEaa8IAtOidYD9w2j/FoCFgk3ia4jhmX6I8cHuYf3hcMQ8AG335Nj830/ERZyASuC6G9qhZJs8OoY8hMfC8filOfG4M5Wk4TO7EYDExab4gbnvZFXfbcHvvW69PsZcAGv37/XMgzfEcLuzLf4/cQJBBIDMVlMFw+e9VYh1l1f/06bOqskIQADRB4qBMUsBEicDQA4AFoBwIJDgiUARABXVXhw7cCVw4DDb0fAf9CGxRQAVACnosXSwkSEwsDCBosDEmABXpNcDsWHBHvCgWd4eAbFngRlx8HAwwUAHwAN7P7ZDAAOAoZ4+9FSbgMAGQWJwwgSYhNTwVyABYgZEswVj6lpwkl6ldSDocPBSQnF1R0dwf/9/f4kwQDJCIGOBAAbLviECxMNL6mZfsUFwcDSwcMRAO83WcPFgJONkMQLAKs4SNLDcMHClhbFp0r7/P3A+fjAm/767PzB/f/9wOMDBNtTgcMJAJmlU6XUyMLDDQELoEkyVMHB+10GAMtrOYHBDQAUazAFc4BuBQG8b3Cn3gDPYEf//vz9/D76+u38//7///w7/vns//v9wP3A3gEPb0j///9HwDhU++3+/ztE/0beAQiBSP/+PlP+Ov/7UsH8///AwDv/xewLARSXKXivhQ4SNp0peIOJzgEPvVIqV8AzDsUMvznDdcFsb8HdARSuXVVTPsDA7v867f9LBwAMyvWZaB4ADsta/0eQ/kkeABDZXP/COcFP0zMHAAveJwbAxNECAZ3fdP3QAQTsZUZM//5bBf/60j/BChAXC9N0emUGEZ8Icf6F/w0DAgtiPkr/yBEGC2ZL/8D+wzr+XRYRWVt9MgrUAiJ1RcH/ZAwQyynz63PD/8PAasIQED0XwMDCagjVDjU7n8GNBRChhXTEKgQR5kNtRcEQ511sRVJCABmGAQYTAccAWl8AxACmEoXUAAAZRZcAQFAAAAAAABbFAAQSAzIAAAAAxQBBUA==";
	$.ajax({
		type : "POST",
		url : "http://127.0.0.1:22001/ZKBIOOnline/fingerprint/verify",
		dataType : "json",
		data : JSON.stringify({
			'reg' : regTemplate,
			'ver' : fpTemplate
		}),
		async : true,
		success : function(data) {
			// 返回码
			var ret = null;
			ret = data.ret;
			// 接口调用成功返回时
			if (ret == 0) {
				alert("score:" + data.score);
			} else {
				alert("ret:" + data.ret);
			}
		},
		error : function(XMLHttpRequest, textStatus, errorThrown) {
			alert("请安装指纹驱动或启动该服务!");
		}
	});
}