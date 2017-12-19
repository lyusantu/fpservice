var myCombos = new Array();

/**
 * @Description: 下面自定义dhtmlx的ajax错误提示（重写）
 * @Author: lynn.chen  陈立  
 * @Modified By:
 * @Date: 2013-01-23
 * @param: dhtmlx源码参数
 */ 
if(typeof(_dhtmlxError) != "undefined")
{
	_dhtmlxError.prototype.throwError = function(type, name, params){
		//alert(type + "---" + name + "---" + params[1]);
		//alert(type + "---" + name + "---" + params[0].status);
		if(typeof(params) != "undefined")
		{
			var status = params[0].status;
			dealAjaxError(status);
		}
		return null;
	};
}

/**
 * @Description: 此方法为表单操作页面如何显示的方法，其它需要弹出框的地方，请使用createWindow()方法
 * @Author: lynn.chen  陈立  
 * @Modified By:
 * @Date: 2013-01-23
 * @param: paramStr 打开页面或者弹出框的参数
 */ 
var winPath = "";//当前窗口界面的路径
function openWindow(paramStr, isWindow) {
	//persCustomFieldAction!getAllField.action^900^430^新增人员
	var params = paramStr.split("^");//获取参数值
	winPath = params[0];
	
	if(typeof(isWindow) != "undefined" && isWindow)
	{
		if(isWindow == "yes")
		{
		    createWindow(paramStr);
		}
		else
		{
			getAddTemplate(params[0]);
		}
		
	}
	else
	{
		if(system.isFormByWinOpen)
		{
		    createWindow(paramStr);
		}
		else
		{
			getAddTemplate(params[0],"");
		}
	}
}

/**
 * 创建顶层Top窗口，适用于iframe中需要将窗口弹在最外层时
 * 
 * @author lynn.chen
 * @since 2015年5月14日 下午1:51:05
 */
function createTopWindow(paramStr, html, confirmFun)
{
	//如果为iframe弹窗的话则调用top弹窗，显示在外层
	if(typeof(window.top.createWindow) != "undefined")
	{
		window.top.createWindow(paramStr, html, confirmFun);
	}
	else
	{
		createWindow(paramStr, html, confirmFun);
	}
}

/**
 * @Description: 创建窗口，窗口个数不受限制
 * @Author: lynn.chen  陈立  
 * @Modified By:
 * @Date: 2013-01-23
 * @param: paramStr 弹出框的参数(path^x^y^w^h^title-----persCustomFieldAction!getAllField.action^0^0^900^430^导入)
 */ 
var fixedCWinId = "userWin";
var dhxWins;
var newWin;
function createWindow(paramStr, html, confirmFun)
{
	paramStr = paramStr.replace("#","public_winTemplate.action");
	if(!dhxWins)
	{
		dhxWins = new dhtmlXWindows();
		//dhxWins.enableAutoViewport(false);
		//dhxWins.attachViewportTo(document.body);
		dhxWins.zIndexStep = 15;   //grid分栏后，左边的z-index=11  --zhangc 2014-6-13
		//dhxWins.setSkin((typeof(sysCfg) != "undefined" ? sysCfg.dhxSkin : "dhx_skyblue"));
		//dhxWins.setImagePath("/public/controls/dhtmlx/dhtmlxWindows/codebase/imgs/");
		dhxWins.attachEvent("onClose", function(win){
			
			
			//此函数为窗口关闭之后，如何存在下一级的窗口，则对下一级窗口进行屏蔽处理
			//win.setModal(false); //---将会导致下一个弹出框z-index每次增加zIndexStep(50),而当前窗口会关闭，没必要先屏蔽，lynn.chen 陈立
			
			/*窗口关闭回调函数
			 * getCurrentWindow().onClose = function(){
				return false;//返回false不关闭窗口
			};*/
			if($(".dhtmlx_window_active").size() == 0)
			{
				//$(window.top.document.body).removeClass("dhxwins_vp_dhx_web");
			}
			if(win.onClose)
			{
				var ret = win.onClose();
				if(ret == false)
				{
					return;
				}
			}
			
			if(win.onFormClose)//表单关闭回调函数
			{
				var ret = win.onFormClose();
				if(ret == false)
				{
					return;
				}
			}
			
			try
			{
				//销毁pagingToolbar
				$(".dhtmlx_window_active .gridbox").each(function(index,element){
					if(document.getElementById(this.id) && mygrids[this.id] && mygrids[this.id].pagingToolbar)
					{
						mygrids[this.id].pagingToolbar.unload();
					}
				});
				
				//判断函数destroyComboxTree是否存在；如果存在则执行
				if(typeof(destroyComboxTree) == "function")
				{
					destroyComboxTree();
				}
				
				$("div[class*='dhtmlxcalendar_in_input']").hide();//时间控件隐藏
				
				$("div[class^='dhx_popup_dhx_']").hide();//popup提示控件隐藏
				
			}
			catch(e)
			{
				//alert("not function);
			}
			
			var lastId = 0;
			dhxWins.forEachWindow(function(){
        		lastId++;
    		});
			
			win.setModal(false);//是否进行屏蔽
			if(lastId != 1)
			{
				var id = fixedCWinId + (lastId-1);
				newWin = dhxWins.window(id);
				newWin.setModal(true);//是否进行屏蔽
				/*var newWinZIndex = $(newWin).css("z-index") - dhxWins.zIndexStep;
				$(newWin).css("z-index", newWinZIndex);
				$(".dhx_modal_cover_ifr").css("z-index", newWinZIndex -2);
				$(".dhx_modal_cover_dv").css("z-index", newWinZIndex -2);*/
			}
			else
			{
				//视频ocx控件显示
				$("iframe[src*='.action']:eq(0)").contents().find(".current").css("visibility", "visible");
			}
			window.setTimeout(function(){
				$(".dhxwin_active input[type=text][readonly!=readonly][disabled!='disabled'],.dhxwin_active input[type=password][readonly!=readonly][disabled!='disabled']").eq(0).focus();
			}, 300);
			return true;
    	});
		//document.onkeydown=esckeydown;   //esc键关闭弹出框口
	}
	var title = "";
	var idPrefix = 0;
	dhxWins.forEachWindow(function() {
        idPrefix++;
        var oldId = fixedCWinId + idPrefix;
        getCurrentWindow().setModal(false);//是否进行屏蔽
    });
	idPrefix++;//每次进来就来原有的窗口个数下加1
	var id = fixedCWinId +idPrefix;
	//globalCWinId = createWinId ? createWinId : fixedCWinId;
	//path^x^y^w^h^title(persCustomFieldAction!getAllField.action^0^0^900^430^导入)
	var params = paramStr.split("^");//获取参数值
    newWin = dhxWins.createWindow(id, params[1]?params[1] : 0, params[2]?params[2] : 0, params[3]?params[3] : 750, params[4] ? params[4] : 300);
    newWin.setText(params[5]? params[5] : title);
    //添加“正在加载中……”功能
	var loadingHtml = "<div id='progressWin" + id + "' style='float: left;position: absolute;z-index: 999999999;height:100%; width:100%; background:#F4F7FF;text-align:center;'><img src='public/controls/dhtmlx/dhtmlxLayout/codebase/imgs/dhxlayout_dhx_web/dhxlayout_progress.gif' style='margin-top:"+ (params[4]/2-60) +"px'/></div>";
	newWin.attachHTMLString(loadingHtml);
	if(!params[1] && !params[2])
	{
    	newWin.center();
    }
	else if(params[1] == 0 && params[2] == 0)
	{
    	newWin.center();
    }
    newWin.setModal(true);//是否进行屏蔽
	newWin.denyResize();//是否可以放大
	newWin.button("park").hide();
	newWin.button("minmax1").hide();
	
	$(".dhxwin_button_close").attr("title", "${common_close}");
	
	newWin.bringToTop();
	newWin.path = params[0];
	//newWin.hideHeader();
	
	//视频ocx控件隐藏，避免其覆盖弹出框
	$("iframe[src*='.action']:eq(0)").contents().find(".current").css("visibility", "hidden");
	
	if(params[0] == "*")//表示直接使用html
	{
		if(html)
		{
			newWin.attachHTMLString(html);
		}
	}
	else
	{
		//添加“正在加载中……”功能
		var xmlHttpObj = createXMLHttpReuestObject();
		var url = params[0];
		
		var unParm = url.indexOf("?") != -1 ? "&" : "?";
		xmlHttpObj.open("get",url + unParm + "un=" + Math.round(Math.random()*100000));
		xmlHttpObj.url = url;
		xmlHttpObj.win = newWin;
		xmlHttpObj.onload = function(a){
			var status = 200;
			try
			{
				status = this.status;
			}
			catch(e)
			{
				
				status = 0;
			}
			try
			{
				if((this.readyState == 4 && status == 200) || status == 404 || status == 500)
				{
					var responseText = this.responseText;
					try
					{	//添加对返回结果的判断是否异常结果
						var tempText = this.responseText.substring(0,20);
						if(tempText.indexOf("ret") != -1 && (tempText.indexOf(sysCfg.warning) != -1 || tempText.indexOf(sysCfg.error) != -1))
						{
						    //格式化返回的字符为对象
							var responseJson = eval("("+this.responseText+")");
							if(responseJson.ret == 500)
							{
								messageBox({messageType:"alert", text:responseJson.msg,callback:closeWindow});
							}
							return;
						}
					}
					catch(e)
					{
		                
					}
					var repText = "<span></span>";
	                var text = (html ? html : "");
	                if(responseText.indexOf(repText) != -1)
	                {
	                    responseText = responseText.replace("<span></span>", text);
	                }
	                else
	                {
	                    responseText += text;
	                }
	                responseText = responseText.replace("confirmFun",confirmFun);
	                this.win.attachHTMLString(loadingHtml + responseText);
				}				
			}
			catch(e)
			{
				status = status;
				throw e;
			}
			finally
			{
				//去除转圈处理和获取焦点
				window.setTimeout(function(){
					$("#progressWin" + id).remove();
					$(".dhxwin_active input[type=text][readonly!=readonly][disabled!='disabled'],.dhxwin_active input[type=password][readonly!=readonly][disabled!='disabled']").eq(0).focus();
				}, 300);
				if(typeof(dealAjaxError) != "undefined")
				{
					status = status == 0 ? "${REQUEST_lOGIN_TIME_OUT!201}" : status;
					dealAjaxError(status);
				}
			}
			
		}
		/*
		xmlHttpObj.onreadystatechange = function()
		{
			alert("b");
			
		}*/
		xmlHttpObj.send(null);
	}
	//return newWin;
	
}
/**
 * @Description: 根据不同浏览器，动态创建XMLHttpRequest对象
 * @Author: 何朗 helang  
 * @Date: 2013-04-18
 * @return 创建成功的XMLHttpRequest对象
 */
function createXMLHttpReuestObject()
{
	var XMLHttpFactories = [
		function(){return new XMLHttpRequest()},
		function(){return new ActiveXObject("Msxml2.XMLHTTP")},
		function(){return new ActiveXObject("Msxml3.XMLHTTP")},
		function(){return new ActiveXObject("Microsoft.XMLHTTP")}
	];	
	var xmlHttp = false;
	for(var i=0; i<XMLHttpFactories.length; i++)
	{
		try
		{
			xmlHttp = XMLHttpFactories[i]();
		}
		catch(e)
		{
			continue;
		}
		break;
	}
	return xmlHttp;
}

/**
 * @Description: 修改窗口的属性
 * @Author: lynn.chen  陈立
 * @Modified By:
 * @Date: 2013-01-23
 * @param: width 宽
 * @param: height 高
 * @param: text 标题文本
 */ 
function updateWindow(width, height, text, type)
{
	var idPrefix = 0;
	dhxWins.forEachWindow(function() {
        idPrefix++;
    });
	var id = fixedCWinId + (idPrefix);
	var ob = dhxWins.window(id).getDimension();
	if(type == "+")
	{
		dhxWins.window(id).setDimension(ob[0]+width, ob[1]+height);
	}
	else if(type == "-")
	{
		dhxWins.window(id).setDimension(ob[0]-width, ob[1]-height);
	}
	else
	{
		dhxWins.window(id).setDimension(width, height);
		dhxWins.window(id).center();
	}
	
	if(text)
	{
		dhxWins.window(id).setText(text);	
	}
	$(".dhxwin_active .content_div").height(0);
	$(".dhxwin_active .content_div").height($(".dhxwin_active .content_td").height());
}
/**
 * @Description: 获取当前窗口对象
 * @Author: lynn.chen  陈立
 * @Modified By:
 * @Date: 2013-02-25
 */

function getCurrentWindow()
{
	var idPrefix = 0;
	dhxWins.forEachWindow(function() {
        idPrefix++;
    });
	var id = fixedCWinId + idPrefix;
	return dhxWins.window(id);
}

/**
 * @Description: 获取前某个打开的窗口对象
 * @Author: lynn.chen  陈立
 * @Modified By:
 * @Date: 2013-02-25
 */

function getPreWindow(index)
{
	var idPrefix = 0;
	dhxWins.forEachWindow(function() {
        idPrefix++;
    });
	var id = fixedCWinId + (idPrefix-index);
	return dhxWins.window(id);
}

/**
 * 得到第一个窗口对象
 * 
 * @author lynn.chen
 * @since 2014年12月17日 下午5:45:53
 * @returns dhxWins.window(id)
 */
function getFirstWindow()
{
	var idPrefix = 1;
	if(typeof(dhxWins) == "undefined")
	{
		return null;
	}
	return dhxWins.window(fixedCWinId + idPrefix);
}

/**
 * 刷新之前的某个window
 * @param index 
 */
function refreshPreWindow(index)
{
	var preWindow = getPreWindow(index);
	if(preWindow)
	{
		$.get(preWindow.path, function(result) {
			 preWindow.attachHTMLString(result);
		}, "html");
	}
}

/**
 * @Description: 刷新窗口，自动获取最前面的窗口进行刷新
 * @Author: lynn.chen  陈立
 * @Modified By:
 * @Date: 2013-01-23
 */
function refreshCurrentWindow()
{
	if(system.isFormByWinOpen && dhxWins)
	{
		var currentWindow = getCurrentWindow();
		$.get(currentWindow.path, function(result) {
			currentWindow.attachHTMLString(result)
		}, "html");
	}
	else
	{
		setIdHtmlByPath(winPath, "addBox");
	}
	
}

/**
 * @Description: 关闭窗口，自动获取最前面的窗口进行关闭
 * @Author: lynn.chen  陈立
 * @Modified By:
 * @Date: 2013-01-23
 */
function closeWindow()
{
	if(system.isFormByWinOpen && dhxWins)
	{
		if(getCurrentWindow() != null){
			getCurrentWindow().close();
		}
		else
		{
			$("#listBox").show();
			$("#addBox").html("");
			$("#addBox").hide();
		}
	}
	else
	{
		$("#listBox").show();
		$("#addBox").html("");
		$("#addBox").hide();
	}
	
}

/**
 * @Description: 打开公共模版的进度条
 * @Author: lynn.chen 陈立
 * @Modified By:
 * @Date: 2013-06-15
 * @param: openProgressParams 窗体属性设置，参数前面加*的为必填项
 * 		var	openProgressParams =
			{
				"winTitle" : "处理进度",//窗口标题，默认为:处理进度
			*	"dealDataPath" : "dealDataPath.action?id=1,2,3",
				"getProgressPath" : "processAction!getProcess.action",
			*	"singleMode" : true/false,//true:为单进度条模式，false:双进度条模式
				"currentProgressTitle" : "当前设备进度",
				"totalProgressTitle" : "总体进度",
				"callback" : function(){//进度完成时的回调函数
					alert("进度已完成");
				}
			};
 * @param: selectFun 如果操作后右边选择框存在数据触发的函数
 * @param: noselectFun 如果操作后右边选择框不存在数据触发的函数
 * 说明：var selectedOptions = myForms[objId].getSelect("c_blocked").options;是获取其值的用法
 */
var openProgressParams = null;//全局进度处理参数
function openProgress(progressParams)
{
	openProgressParams = progressParams;
	//如果获取进度路径不存在，默认为：processAction!getProcess.action
	var getProgressPath = openProgressParams.getProgressPath;
	openProgressParams.getProgressPath = (!getProgressPath ||getProgressPath == null || getProgressPath == "" ? "processAction!getProcess.action" : getProgressPath);
	
	var winTitle = openProgressParams.winTitle ? openProgressParams.winTitle : "${common_op_deal}";//${common_op_deal}:处理进度
	var winParam = "public_opTemplate.action^0^0^600^285^" + winTitle;
	if(openProgressParams.singleMode == true)//这里主要是窗口高度不一样
	{
		winParam = "public_opTemplate.action^0^0^600^245^" + winTitle;
	}
	createWindow(winParam);
}

/**
 * @Description: 左右选择框控件函数
 * @Author: lynn.chen  陈立
 * @Modified By:
 * @Date: 2013-01-23
 * @param: leftOptions 左边需要进行备选的数据列，格式如：[{"value":"0","text":"人员编号"},{"value":"1","text":"姓名"},{"value":"2","text":"卡号"}]
 * @param: rightOptions 右边需要进行备选的数据列，格式如：[{"value":"0","text":"人员编号"},{"value":"1","text":"姓名"},{"value":"2","text":"卡号"}]
 * @param: obId 该窗体显示时相应对象的id,也就是它该在哪显示
 * @param: attributes 窗体属性设置
 * 			var attributes = {
				"leftLabel":"备选数据列",
				"rightLabel":"备选数据列",
				"size": 12,
				"buttonWidth" : 50,
				"isAllSelect" : true,
				"inputWidth" : 160,
				"labelWidth" : 160,
				"labelHeight" : 20
			};
 * @param: selectFun 如果操作后右边选择框存在数据触发的函数
 * @param: noselectFun 如果操作后右边选择框不存在数据触发的函数
 * 说明：var selectedOptions = myForms[objId].getSelect("c_blocked").options;是获取其值的用法
 */

var myForms = new Array();
function leftRightSelect(leftOptions, rightOptions, objId, attributes, selectFunc, noselectFunc)
{
	if (myForms[objId] && $("#" + objId + " select").size() > 0)
	{
		return;
	}
	else if(myForms[objId])
	{
		myForms[objId].unload();//清空之前的myForm，否则会new多次，出现多个
	}
	
	attributes = attributes? attributes : new Array();
	var size= attributes.size ? attributes.size : 22;
	var buttonWidth = attributes.buttonWidth ? attributes.buttonWidth : 50;
	buttonWidth = buttonWidth > 60 ? 60 : buttonWidth;
	var inputWidth = attributes.inputWidth? attributes.inputWidth : 210;
	var labelWidth = inputWidth;
	var labelHeight = attributes.labelHeight ? attributes.labelHeight : 20;
	var leftLabel = attributes.leftLabel ? attributes.leftLabel : "备选人员";
	var rightLabel = attributes.rightLabel ? attributes.rightLabel : "已选人员";
	
	if(attributes.isAllSelect == undefined)
	{
		var isAllSelect = true;
	}
	else
	{
		var isAllSelect = attributes.isAllSelect;
	}
	
	var allOffsetTop = size*6;
	var offsetTop = isAllSelect ? 0 : size*8;
	var allButtonType = isAllSelect ? "button" : "hidden";
	formData = [ 
		{
			type: "settings",
			position: "label-top",
			labelWidth: labelWidth,
			inputWidth: inputWidth,
			labelHeight: labelHeight
		}, 
		{
			type: "multiselect",
			label: leftLabel,
			name: "c_all",
			size: size,
			options: (leftOptions != null ? eval(leftOptions) : [])
		}, 
		{
			type: "newcolumn"
		}, 
		{
			type: "block",
			inputWidth:"auto",
			offsetLeft: 0,
			list: [{
				type: allButtonType,
				name: "addAll",
				value: ">>",
				offsetLeft: 0,//(60-buttonWidth)/2,
				offsetTop: allOffsetTop,
				inputWidth: buttonWidth
			}, {
				type: "button",
				name: "add",
				value: "&nbsp;>&nbsp;",
				offsetLeft: 0,//(60-buttonWidth)/2,
				offsetTop: offsetTop,
				inputWidth: buttonWidth
			}, {
				type: "button",
				name: "remove",
				value: "&nbsp;<&nbsp;",
				offsetLeft: 0,//(60-buttonWidth)/2,
				inputWidth : buttonWidth
			}, {
				type: allButtonType,
				name: "removeAll",
				value: "<<",
				offsetLeft: 0,//(60-buttonWidth)/2,
				inputWidth: buttonWidth
			}]
		}, 
		{
			type: "newcolumn"
		}, 
		{
			type: "multiselect",
			label: rightLabel,
			name: "c_blocked",
			size: size,
			options: (rightOptions != null ? eval(rightOptions) : [])
		} 
	];
	myForms[objId] = new dhtmlXForm(objId, formData);
	
	//按钮部分样式修复
	$("#"+ objId +" .in_block").css("padding", "0 5px");
	$("#"+ objId +" .dhxform_btn_txt").css("margin", "0 10px");
	//下面2句是解决ie下已下拉框显示的问题
	/* 暂时屏蔽，Occupancy有问题    $.browser.msie *******梁海波-20140410********* */
	//myForms[objId].getSelect("c_blocked").options.add(new Option("0" , ""));
	//$(myForms[objId].getSelect("c_blocked")).find('option').filter(':eq(0)').remove();
	myForms[objId].attachEvent("onButtonClick", function(name){
		if (name == "add" || name == "remove" || name == "addAll" || name == "removeAll") 
		{
			changeContactState(objId, name == "add" || name == "addAll", name, isAllSelect, selectFunc, noselectFunc);
		}
	});

	//双击
	$(".dhxform_select[name^='c_all']").dblclick(function(){
		changeContactState(objId, true, "add", isAllSelect,selectFunc, noselectFunc);
	});

	$(".dhxform_select[name^='c_blocked']").dblclick(function(){
		changeContactState(objId, false, "remove", isAllSelect, selectFunc, noselectFunc);
	});
	
	//获取当前值
	myForms[objId].getValue = function(){
		var optValue = "";
		var selectedOptions = myForms[objId].getSelect("c_blocked").options;
		for ( var i = 0; i < selectedOptions.length; i++) 
		{
			optValue += selectedOptions[i].value + ",";
		}
		return optValue != "" ? optValue.substring(0,optValue.length-1) : optValue;
	};
}

function changeContactState(objId, block, name, isAllSelect, selectFunc, noselectFunc) 
{
	var ida = (block ? "c_all" : "c_blocked");
	var idb = (block ? "c_blocked" : "c_all");

	var sa = myForms[objId].getSelect(ida);
	var sb = myForms[objId].getSelect(idb);

	if(name == "addAll" || name == "removeAll") 
	{
		for ( var i = 0; i < sa.options.length; i++) 
		{
			sb.options.add(new Option(sa.options[i].text, sa.options[i].value));

		}
		for ( var i = 0; i < sa.options.length;) 
		{
			$(sa).find('option').filter(':eq(' + i + ')').remove();
		}
	} 
	else 
	{
		var t = myForms[objId].getItemValue(ida);
		if(t.length == 0)
		{
			return;
		}
		eval("var k={'" + t.join(":true,") + "':true};");
		var w = 0;
		var ind = -1;
		while(w < sa.options.length) 
		{
			if(k[sa.options[w].value]) 
			{
				sb.options.add(new Option(sa.options[w].text,
						sa.options[w].value));
				$(sa).find('option').filter(':eq(' + w + ')').remove();
				ind = w;
			}
			else
			{
				w++;
			}
		}
		if(sa.options.length > 0 && ind >= 0)
		{
			if(sa.options.length > 0)
			{
				sa.options[t.length > 1 ? 0 : Math.min(ind,
						sa.options.length - 1)].selected = true;
			}
		}

		//单选
		if(isAllSelect == false && block == true && sb.options.length > 1)
		{
			sa.options.add(new Option(sb.options[0].text, sb.options[0].value));
			$(sb).find('option').filter(':eq(0)').remove();
		}
	}
	
	//对已选数据列进行判断，是否已选数据
	if(myForms[objId].getSelect("c_blocked").options.length > 0)
	{
		if(selectFunc)
		{
			selectFunc();
		}
	}
	else
	{
		if(noselectFunc)
		{
			noselectFunc();
		}
	}
}

/**
 * @Description: 打开表单页面，只适用于操作栏中进行调用
 * @Author: lynn.chen  陈立
 * @Modified By:
 * @Date: 2013-03-06
 * @param: id 操作时的参数，
 * 形如persCustomFieldAction!getAllField.action^0^0^900^430为path^x^y^w^h^title
 */
function openWindowToForm(id)
{
	var objId = "operate";
	var winStr = id;
	if(id.split("^")[0].indexOf("]") > 0)
	{
		objId = id.split("^")[0].substring(1,id.split("^")[0].indexOf("]"));
		winStr = id.substring(id.split("^")[0].indexOf("]")+1);
	}
	if(operateToolbars[objId])
	{
		try
		{
			var isExistId = false;
			operateToolbars[objId].forEachItem( function(itemId){
		        if(itemId == id)
				{
					isExistId = true;
					return;
				}
		    });
			if(isExistId)
			{
				winStr += "^"+operateToolbars[objId].getItemText(id);
			}
			else
			{
				winStr += "^"+operateToolbars[objId].getListOptionText("moreActions",id);
			}
		}
		catch(e)
		{
			winStr += "^"+operateToolbars["leftOperate"].getItemText(id);
		}
	}
	openWindow(winStr);
}

/**
 * @Description: 专门为导出提供，弹出窗口
 * @Author: pokiz.xu
 * id 的格式为accTransactionAction!export.action(type=XLS|PDF)^0^0^500^190#rightGridbox#leftOperate
 * 				    ^前面的为导出的action路径，#后面接着哪个grid，与哪个操作区域
 * 					#后面的可以不填，如果填，需要两个一起填写
 *                  (type=...)为导出页面显示的导出格式
 * @Date: 2013-03-06
 * @modify: gordon.zhang@zkteco.com 2014-12-18
 */
function openWindowForExport(id)
{
	var winStr;
	var objId = "operate";
	var gridName;
	var sourceId = id;
	if(id.indexOf("#") >= 1)
	{
		gridName = id.substring(id.indexOf("#")+1, id.lastIndexOf("#"));
		objId = id.substring(id.lastIndexOf("#") + 1, id.length);
		id = id.substring(0, id.indexOf("#"));
	}
	var typeStr="";
	if (id.indexOf("(type=")>=1)
	{
	    var typeBegini = id.indexOf("(type=");
	    var typeEndi = id.substring(typeBegini).indexOf(")");
	    typeStr = id.substring(typeBegini,typeBegini+typeEndi);
	    typeStr = typeStr.split("=")[1];
	    id = id.substring(0,typeBegini)+id.substring(typeBegini+typeEndi+1);
	}
	var opStr;
	if(id.indexOf("(select") > 0)
	{
		var opParamStr = id.substring(id.indexOf("(select") + "(select".length + 1, id.lastIndexOf(")"));
		var val = $("input:hidden[name='"+opParamStr+"']").val();
		opStr = val;
	}
	var winHtml = "";
	if(operateToolbars[objId])
	{
		winHtml = operateToolbars[objId].getItemText(sourceId);
	}
	else
	{
		winHtml = "${common_op_export}";
	}
	winStr = "^"+winHtml;
	var actionName = id.split("^")[0];
	var size = id.substring(id.indexOf("^"));
	var actionInput = "<input style='display: none' id='actionName' value='"+ actionName +"'/>";
	var gridNameInput = "<input style='display: none' id='gridName' value='"+ gridName +"'/>";
	var custom = "<input style='display: none' id='cutomName' value='"+ opStr +"'/>";
	var typeStr = "<input style='display: none' id='typeStr' value='"+ typeStr +"'/>";
	createWindow("public_opExportRecord.action" + size +winStr, actionInput + gridNameInput + custom+typeStr);
}

/**
 * @Description: 已打开窗口的方式来进行操作，只适用于操作栏中进行调用
 * @Author: lynn.chen  陈立
 * @Modified By:
 * @Date: 2013-03-06
 * @param: id 操作时的参数，
 * 形如persCustomFieldAction!getAllField.action^0^0^900^430为path^x^y^w^h^title
 * 下面为需在弹窗前进行进行判断的配置
 * persCustomFieldAction!getAllField.action?
 * id=(id*{checkboxName:'ids',selectedNum:1,conditionMode:'!=',noSelectPrompt:'请选择你要操作的对象',noRightSelectPrompt:'只能选择一个对象进行操作',split:','})
 * ^0^0^900^430
 */
var currentOperateId;
var operateObjId = "operate";
function openWindowByOperate(id)
{
	var winStr = id;
	if(id.split("^")[0].indexOf("]") > 0)
	{
		operateObjId = id.split("^")[0].substring(1,id.split("^")[0].indexOf("]"));
		winStr = id.substring(id.split("^")[0].indexOf("]")+1);
	}
	else
	{
		operateObjId = "operate";
	}
	if(operateToolbars[operateObjId] && id.split("^").length > 6)
	{
		winStr += "^"+operateToolbars[operateObjId].getItemText(id);
	}

	if(id.indexOf("(id")>0)
	{

		var checkboxName;
		var idStr = "(id)";
		var selectedNum = 1;
		var conditionMode = "!=";
		var noSelectPrompt = "${common_prompt_selectObj}";
		var noRightSelectPrompt = "${common_prompt_onlySelectOneObject}";
		var split = ",";
		var idNum = 0;
		if(id.indexOf("(id*")>0)
		{

			//(id*{checkboxName:'ids',selectedNum:1,conditionMode:'!=',noSelectPrompt:'请选择你要操作的角色',noRightSelectPrompt:'只能选择一个操作的角色',split:','})
			var opParamStr = id.substring(id.indexOf("(id*") + "(id*".length, id.lastIndexOf(")"));
			var opParams = eval("(" + opParamStr + ")");
			checkboxName = opParams.checkboxName ? opParams.checkboxName : checkboxName;
			selectedNum = opParams.selectedNum != undefined ? opParams.selectedNum : selectedNum;
			conditionMode = opParams.conditionMode ? opParams.conditionMode : conditionMode;
			noSelectPrompt = opParams.noSelectPrompt ? opParams.noSelectPrompt : noSelectPrompt;
			noRightSelectPrompt = opParams.noRightSelectPrompt ? opParams.noRightSelectPrompt : noRightSelectPrompt;
			split = opParams.split ? opParams.split : split;
			idStr = id.substring(id.indexOf("(id*"), id.lastIndexOf(")")+1);
		}

		var checkboxVlaues = getGridCheckboxValue(checkboxName, split);
		if(checkboxVlaues == "")
		{
			messageBox({messageType:"alert",text: noSelectPrompt});
			return;
		}
		else
		{
			idNum = checkboxVlaues.split(split).length;

			switch (conditionMode)
			{
				case "!=":
					if(idNum != selectedNum)
					{
						messageBox({messageType:"alert",text: noRightSelectPrompt.format(selectedNum)});
						return;
					}
					break;
				case "==":
					if(idNum == selectedNum)
					{
						messageBox({messageType:"alert",text: noRightSelectPrompt.format(selectedNum)});
						return;
					}
					break;
				case ">":
					if(idNum > selectedNum)
					{
						//noRightSelectPrompt = "已选择{0}，最多只能选择{1}个对象进行操作";
						messageBox({messageType:"alert",text: noRightSelectPrompt.format(idNum,selectedNum)});
						return;
					}
					break;
				case ">=":
					if(idNum >= selectedNum)
					{
						messageBox({messageType:"alert",text: noRightSelectPrompt.format(selectedNum)});
						return;
					}
					break;
				case "<":
					if(idNum < selectedNum)
					{
						messageBox({messageType:"alert",text: noRightSelectPrompt.format(selectedNum)});
						return;
					}
					break;
				case "<=":
					if(idNum > selectedNum)
					{
						var msg = "${common_prompt_noPass}";
						messageBox({messageType:"alert",text:  msg.format(selectedNum)});
						return;
					}
					break;
				default:
					messageBox({messageType:"alert",text: "条件运算符不合法,必须为'!=,==,>,>=,<,<='"});
					return;
					break;
			}
		}
		winStr = id.replace(idStr, checkboxVlaues);
	}
	
	var isExistId = false;
	operateToolbars[operateObjId].forEachItem( function(itemId){
        if(itemId == id)
		{
			isExistId = true;
			return;
		}
    });
	if(isExistId)
	{
		winStr += "^"+operateToolbars[operateObjId].getItemText(id);
	}
	else
	{
		winStr += "^" + operateToolbars[operateObjId].getListOptionText("moreActions",id);
	}
	currentOperateId = id;
	createWindow(winStr);
}

/**
 * @Description: 非打开窗口的方式来进行操作，非操作栏中同样可以进行调用
 * @Author: lynn.chen  陈立
 * @Modified By:
 * @Date: 2013-03-06
 * @param: id 操作时的参数，
 * 形如persCustomFieldAction!getAllField.action为path
 * 下面为需在弹窗前进行进行判断的配置
 * [operateId]persCustomFieldAction!getAllField.action?
 * id=(id*{checkboxName:'ids',selectedNum:1,conditionMode:'!=',noSelectPrompt:'请选择你要操作的对象',noRightSelectPrompt:'只能选择一个对象进行操作',split:',',gridName: 'gridbox'})^#自定义提示信息
 *
 */
function executeOperate(id, callbackFun)
{
	var opStr = id.split("^")[0];
	if(id.indexOf("]") > 0)
	{
		operateObjId = id.substring(1,id.indexOf("]"));
		opStr = id.substring(id.indexOf("]")+1);
	}
	else
	{
		operateObjId = "operate";
	}
	
	var idNum = 0;
	var itemText = ""; 
	var gridName = null;
	if(id.indexOf("(id")>0)//判断是否是grid复选
	{
		var checkboxName;
		var idStr = "(id)";
		var selectedNum = 0;
		var conditionMode = "==";
		var noSelectPrompt = "${common_prompt_selectObj}";
		var noRightSelectPrompt = "${common_prompt_onlySelectOneObject}";
		var split = ",";
		var isOnline = false;
		if(id.indexOf("(id*")>0)//这里是判断是否存在提示信息参数
		{
			//(id*{checkboxName:'ids',selectedNum:1,conditionMode:'!=',noSelectPrompt:'请选择你要操作的角色',noRightSelectPrompt:'只能选择一个操作的角色',split:','})
			var opParamStr = id.substring(id.indexOf("(id*") + "(id*".length, id.lastIndexOf(")"));
			var opParams = eval("(" + opParamStr + ")");
			
			checkboxName = opParams.checkboxName ? opParams.checkboxName : checkboxName;
			
			selectedNum = opParams.selectedNum != undefined ? opParams.selectedNum : selectedNum;
			
			conditionMode = opParams.conditionMode ? opParams.conditionMode : conditionMode;
			noSelectPrompt = opParams.noSelectPrompt ? opParams.noSelectPrompt : noSelectPrompt;
			noRightSelectPrompt = opParams.noRightSelectPrompt ? opParams.noRightSelectPrompt : noRightSelectPrompt;
			isOnline = opParams.isOnline ? opParams.isOnline : isOnline ;
			split = opParams.split ? opParams.split : split;
			gridName = opParams.gridName ? opParams.gridName : gridName;

			idStr = id.substring(id.indexOf("(id*"), id.lastIndexOf(")")+1);
			
		}
		var checkboxVlaues = getGridCheckboxValue(checkboxName, split);
		if(checkboxVlaues == "")
		{
			messageBox({messageType:"alert",text: noSelectPrompt});
			return;
		}
		else
		{
			idNum = checkboxVlaues.split(split).length;

			switch (conditionMode)
			{
				case "!=":
					if(idNum != selectedNum)
					{
						messageBox({messageType:"alert",text: noRightSelectPrompt});
						return;
					}
					break;
				case "==":
					if(idNum == selectedNum)
					{
						messageBox({messageType:"alert",text: noRightSelectPrompt});
						return;
					}
					break;
				case ">":
					if(idNum > selectedNum)
					{
						messageBox({messageType:"alert",text: noRightSelectPrompt});
						return;
					}
					break;
				case ">=":
					if(idNum >= selectedNum)
					{
						messageBox({messageType:"alert",text: noRightSelectPrompt});
						return;
					}
					break;
				case "<":
					if(idNum < selectedNum)
					{
						messageBox({messageType:"alert",text: noRightSelectPrompt});
						return;
					}
					break;
				case "<=":
					if(idNum >= selectedNum)
					{
						messageBox({messageType:"alert",text: noRightSelectPrompt});
						return;
					}
					break;
				default:
					messageBox({messageType:"alert",text: "条件运算符不合法"});
					return;
					break;
			}
		}
		opStr = opStr.replace(idStr, checkboxVlaues);
	}
	else if(id.indexOf("(select") > 0)
	{
		var opParamStr = id.substring(id.indexOf("(select") + "(select".length + 1, id.lastIndexOf(")"));
		var val = $("input:hidden[name='"+opParamStr+"']").val();
		opStr = id.substring(0, id.indexOf("custom=") + "custom=".length) + (val == undefined ? "" : val);
	}
	var msg = "${common_prompt_executeOperate}";//你确定要执行{0}操作吗？
	if(id.split("^").length >= 2)//判断是否存在自定义文本
	{
		itemText = id.split("^")[1];
		if(itemText.indexOf("#") >= 0)
		{
			msg = itemText.replace("#","");
		}
	}
	else if(operateToolbars[operateObjId])//判断是否是Toolbar中的操作
	{
		var isExistId = false;
		operateToolbars[operateObjId].forEachItem( function(itemId){
	        if(itemId == id)
			{
				isExistId = true;
				return;
			}
	    });
		if(isExistId)//判断当前操作栏对象中是否存在该id，存在则直接获取文本(通过id来获取文本)
		{
			itemText = operateToolbars[operateObjId].getItemText(id);
		}
		else//不存在时从下来框中去获取，下拉框id统一使用moreActions
		{
			itemText += "^" + operateToolbars[operateObjId].getListOptionText("moreActions",id);
		}
	}
	msg = msg.format(itemText);
	
	var submit = function (result) {
	    if(result)
	    {
	    	//这里判断该操作是否为ajax操作
	    	if(opStr.indexOf(".action") > 0 || opStr.indexOf(".do") > 0)
	    	{
	    		var urlStr=opStr;
	    		if(opStr.indexOf("?")!=-1){
	    			urlStr=opStr.substr(0,opStr.indexOf("?"));
	    		}
		    	onLoading(function(){
		        	$.ajax({
						type: "POST",
						url: urlStr,
						data:parseURL2JSON(opStr),
						dataType:"json",
						async : true,
						success: function(result)
					    {
		        			if(callbackFun)
		        			{
		        				dealRetResult(result,callbackFun);
		        			}
		        			else
		        			{
		        				dealRetResult(result, undefined, gridName);
		        			}
						 	
						}
			        });
	       		});
	    	}
	    	else//不是ajax则为执行函数
	    	{
	    		eval(opStr + '()');
	    	}
	    }
	    return true; //close
	};
	messageBox({messageType:"confirm", text:msg, callback:submit});
	
	currentOperateId = id;
}

/**
 * @Description: 根据解析xml来创建操作栏,在list模版页面进行调用
 * @Author: lynn.chen  陈立
 * @Modified By:
 * @Date: 2013-01-23
 * @param: pageConfigXML 需要解析的xml路径
 * @param: obId 用于显示对象的id，也就是一个页面可以出现多个，默认为list模版中的operate
 * @param: callback 加载完回调函数
 */
var operateToolbars = new Array();
function createToolbar(pageConfigXML, obj, callback)
{
	var obId = "operate";
	
	pageConfigXML += (pageConfigXML.indexOf("?") > 0 ? "&" : "?") + "rootType=toolbars";
	if(typeof(obj) == "undefined" || typeof(obj) == "string")//判断是否是对象id字符串
	{
		obId = (obj ? obj : obId);
		operateToolbars[obId] = new dhtmlXToolbarObject(obId);
		$("#" + obId).addClass("dhxToolbar");
	}
	else
	{
		obId = (obj.id ? obj.id : obId);
		operateToolbars[obId] = obj;
	}
	//operateToolbars[obId].setSkin(sysCfg.dhxSkin);
	
	operateToolbars[obId].attachEvent("onClick", function(id){
		/****
		this.objPull[this.idPrefix + "input_1"];
		inputA = Toolbar.objPull[Toolbar.idPrefix+"input_1"].obj.firstChild;*/
	});
	
	operateToolbars[obId].setIconSize(18);
	operateToolbars[obId].setIconsPath(sysCfg.rootPath + "/public/images/opToolbar/");
	var path = pageConfigXML + (pageConfigXML.indexOf("?") == -1 ? "?" : "&") + "un=" + new Date().getTime() + "&" + $.param($.ajaxSetup().data);
	
	operateToolbars[obId].loadXML(path, function(){
		var $dhxToolbar = $(this.base);
		
		if($dhxToolbar.size() == 1)
		{
			
			var toolbarWidth = 0;
			$dhxToolbar.find("div.dhx_toolbar_btn").each(function(i){
				toolbarWidth +=  $(this).outerWidth();
			});
			//$(".dhx_cell_cont_layout .dhxToolbar .dhxtoolbar_float_left div.dhx_toolbar_btn").
			
			var left = $dhxToolbar.offset().left + 30;
			if(left < 50 && $("iframe[src*='.action'],iframe[src*='.do']:eq(0)", parent.document).size() > 0)
			{
				left = $("iframe[src*='.action'],iframe[src*='.do']:eq(0)", parent.document).parent().offset().left + 40;
			}
			
			if((left + toolbarWidth) > $(window.top.document.body).width())
			{
				$(window.top.document.body).css("min-width",left + toolbarWidth);
				window.top.resizeWindow();
			}

		}
		if(typeof(callback) != "undefined")
		{
			callback();
		}
		
	});
}

/**
 * @Description: 获取操作栏真实节点id
 * @Author: lynn.chen 陈立
 * @Date: 2015-01-22
 * @param:toolbarId 操作栏对象div id
 * @param:itemId 操作栏节点id
 */
function getToolbarRealItemId(toolbarId, itemId)
{
	return operateToolbars[toolbarId].idPrefix + itemId;
}

/**
 * @Description: 封装dhmlxmessage消息提示框
 * @Author: helang 何朗
 * @Date: 2013-04-22
 * @param:paramsJson  传入的配置参数
  	  下面是关于paramsJson格式的说明及实例，每个属性都有默认值：
	  confirmBox({
	  	title:"提示信息",
	  	type:"confirm-error dhtmlx-myCss",(dhtmlxmessage内置的三种type:confirm-warning confirm confirm-error)
	  	ok:"确定",
	  	cancel:"取消",
	  	expire:3000,
	  	text:"你确定要删除此条信息吗?",
	  	messageType:"confirm",
	  	callback:function(result){alert(11);},
	  	width:250
	  });
	  title ok cancel text 分别对应消息提示框上相应的文本内容；
	  messageType指的是消息提示框类型（有confirm message alert三种）；
	  callback是回调方法；
	  特别注意下type属性，这里可以自己定义样式,指定多个样式以空格分隔开，自定义的类样式中属性必须加!important标识且自定义样式必须用dhtmlx-xxxx这种格式类名。
	  expire当组件的messageType为message的时候，设定message提示框多少毫秒消失,width指当消息提示框类型为message的时候，所显示的提示框的宽度，默认250。
 */
function messageBox(paramsJson)
{
	
	this.messageType = paramsJson.messageType ? $.trim(paramsJson.messageType) : "confirm";
	this.types = "";
  	if(paramsJson.type)
  	{
  		this.typeArray = paramsJson.type.split(" ");
	  	for(var i=0; i<this.typeArray.length; i++)
	  	{
  			this.types += this.typeArray[i]+" ";
	  	}
  	}
	switch(this.messageType)
	{
		case "confirm":
		  	this.title = paramsJson.title ? $.trim(paramsJson.title) : "${common_prompt_title}";
		  	this.type = this.types ? $.trim(this.types) : "confirm";
		  	this.ok = paramsJson.ok ? $.trim(paramsJson.ok) : "${common_edit_ok}";
		  	this.cancel = paramsJson.cancel ? $.trim(paramsJson.cancel) : "${common_edit_cancel}";
		  	this.text = paramsJson.text ? $.trim(paramsJson.text) : "${common_prompt_sureToDel}";
		  	this.width = paramsJson.width ? $.trim(paramsJson.width) : "300px";
		  	this.callback = paramsJson.callback;
			dhtmlx.confirm({
			    title:this.title,
			    type:this.type,
			    ok:this.ok,
			    cancel:this.cancel,
			    width: this.width,
			    text:this.text,
			    callback:this.callback
			});
			break;
		case "confirm-warning":
		  	this.title = paramsJson.title ? $.trim(paramsJson.title) : "${common_prompt_title}";
		  	this.type = this.types ? $.trim(this.types) : "confirm-warning";
		  	this.ok = paramsJson.ok ? $.trim(paramsJson.ok) : "${common_edit_ok}";
		  	this.cancel = paramsJson.cancel ? $.trim(paramsJson.cancel) : "${common_edit_cancel}";
		  	this.text = paramsJson.text ? $.trim(paramsJson.text) : "${common_prompt_sureToDel}";
		  	this.width = paramsJson.width ? $.trim(paramsJson.width) : "300px";
		  	this.callback = paramsJson.callback;
			dhtmlx.confirm({
			    title:this.title,
			    type:this.type,
			    ok:this.ok,
			    width: this.width,
			    cancel:this.cancel,
			    text:this.text,
			    callback:this.callback
			});
			break;
		/*case "message":
			//添加当两次message提示框间隔很小出现时，导致提示框样式干扰问题
			if($("#messageIconId").parent().parent().parent())
			{
				$("#messageIconId").parent().parent().empty();
			}
			this.width = paramsJson.width ? paramsJson.width : 250;
			this.type = this.types ? $.trim(this.types) : "warning";
			this.text = paramsJson.text ? $.trim(paramsJson.text) : "";
			this.expire = paramsJson.expire ? $.trim(paramsJson.expire) : 1200;
			dhtmlx.message({
				id:"messageBoxId",
				type:"info",
				text:"<img id='messageIconId' src=''/>&nbsp;&nbsp;"+this.text,
				expire:this.expire
			});
			//动态计算message的显示位置
			//$($(".dhtmlx_message_area")[0]).css("left",(document.body.offsetWidth)/2-40);
			//$($(".dhtmlx_message_area")[0]).css("top",(document.body.offsetHeight)/2);
			//添加icon图片，并动态更新样式
			var messageIconObj = $("#messageIconId");
			messageIconObj.parent().css("text-align","center");
			messageIconObj.parent().css("line-height","38px");
			messageIconObj.parent().css("overflow","hidden");
			messageIconObj.parent().css("height","38px");
			messageIconObj.parent().css("padding-left","8px");
			messageIconObj.parent().css("padding-right","8px");
			messageIconObj.parent().parent().parent().css("width","auto");
			messageIconObj.parent().parent().parent().css("display","inline-table");
			
			var messageIconPath = "public/controls/dhtmlx/dhtmlxMessage/codebase/icons/";
			//为message框动态指图标,succsee error loading warning 四种不同图标
			switch (this.type)
			{
				case "success" :
					messageIconObj.attr("src",messageIconPath+"message_success.png");
					break;
				case "error" :
					messageIconObj.attr("src",messageIconPath+"message_error.png");
					break;
				case "loading" :
					messageIconObj.attr("src",messageIconPath+"message_loading.gif");
					break;
				case "warning" :
					messageIconObj.attr("src",messageIconPath+"message_warning.png");
					break;
			}
			messageIconObj.css("vertical-align","middle");
			break;*/
		case "alert":
			this.title = paramsJson.title ? $.trim(paramsJson.title) : "${common_prompt_title}";
			this.type = this.types ? $.trim(this.types) : "alert";	//'alert', 'alert-warning', 'alert-error
			this.text = paramsJson.text ? $.trim(paramsJson.text) : "";
			this.ok = paramsJson.ok ? $.trim(paramsJson.ok) : "${common_edit_ok}";
			this.callback = paramsJson.callback;
			dhtmlx.alert({
					title:this.title,
					type:this.type,
					text:this.text,
					ok:this.ok,
					callback:this.callback
			})
			break;
		case "alert-warning":
			this.title = paramsJson.title ? $.trim(paramsJson.title) : "${common_prompt_title}";
			this.type = this.types ? $.trim(this.types) : "alert";	//'alert', 'alert-warning', 'alert-error
			this.text = paramsJson.text ? $.trim(paramsJson.text) : "";
			this.ok = paramsJson.ok ? $.trim(paramsJson.ok) : "${common_edit_ok}";
			this.callback = paramsJson.callback;
			dhtmlx.alert({
					title:this.title,
					type:this.messageType,
					text:this.text,
					ok:this.ok,
					callback:this.callback
			})
			break;
	}
	//添加样式切换功能
	/*$(".dhtmlx_popup_button").each(function(b){
		$(this).hover(function(){
			$(this).css("background","url(public/images/btn_bg_hover.jpg) repeat scroll 0 0 transparent");
		},
		function(){
			$(this).css("background","url(public/images/btn_bg.jpg) repeat scroll 0 0 transparent");
		});
	});*/
	
}
/**
 * 限制startTimeId和endTimeId不能大于当前时间
 * startTimeId不能大于endTimeId
 * @author colin.yao 2014-4-16 17:42:14
 * @param mCal new出来的日期控件对象
 * @param startTimeId
 * @param endTimeId
 * @param timeType 日期格式类型
 * @param type 类型（1为开始，2为结束）
 * @return
 */
function limitTime(mCal, startTimeId, endTimeId, timeType, type){
	//获取当前日期
    var myDate = new Date();
	var oneYear = myDate.getFullYear();
    var oneMonth = myDate.getMonth()+1;
	var oneDay = myDate.getDate(); 
	myDate = oneYear+"-"+oneMonth+"-"+oneDay; 
	var startTime = $("#"+startTimeId).val();
	var endTime = $("#"+endTimeId).val();
	if(timeType == 0)
	{
		mCal.setDateFormat(sysCfg.dhxShortDateFmt);		
		mCal.hideTime();	
	}	
	else	
	{		
		mCal.setDateFormat(sysCfg.dhxLongDateFmt);
	}	
	if(type == 1)
	{
		if(endTime == "" || endTime == null)
		{
			mCal.setSensitiveRange(null, myDate);
		}
		else
		{
			mCal.setSensitiveRange(null, endTime);
		}
	}
	else
	{
		if(startTime == "" || startTime == null)
		{
			mCal.setSensitiveRange(null, myDate);
		}
		else
		{
			mCal.setSensitiveRange(startTime, myDate);
		}
	}
}

/**
 * 函数主要用于有开始时间和结束时间需要输入的情况
 * @author liangm 20130427
 * @param mCal 日期控件
 * @param startTimeId 开始时间输入框id
 * @param referTimeId 参照时间id（即当填写开始时间时，那么它的参照时间id即为结束时间输入框id，反之，亦然）
 * @return
 */
function inputTime(mCal, startTimeId, referTimeId, timeType)
{
	if(timeType == 0)
	{
		mCal.setDateFormat(sysCfg.dhxShortDateFmt);		
		mCal.hideTime();	
	}	
	else	
	{		
		mCal.setDateFormat(sysCfg.dhxLongDateFmt);
	}	
	if (referTimeId == startTimeId)
	{
        mCal.setSensitiveRange($("#"+referTimeId).val() == "" ? null : $("#"+referTimeId).val(), null);
    }
    else
	{
        mCal.setSensitiveRange(null, $("#"+referTimeId).val() == "" ? null : $("#"+referTimeId).val());
    }
}

/**
 * 限制开始时间不能大于结束时间、结束时间不能小于开始时间
 * @author Jason 20130620
 * @param myCalendar new出来的日期控件对象
 * @param startTimeId 开始时间输入框id
 * @param referTimeId 参照时间id（即当填写开始时间时，那么它的参照时间id即为结束时间输入框id，反之，亦然）
 * @return
 */
function inputDateTime(myCalendar, startTimeId, referTimeId)
{
	if (referTimeId == startTimeId)
	{
        myCalendar.setSensitiveRange($("#"+referTimeId).val(), null);
    }
    else
	{
        myCalendar.setSensitiveRange(null, $("#"+referTimeId).val());
    }
}

/**
 * @Description: 创建长日期格式的dhx日历控件（格式如：2013-5-20 18:00:00）
 * @Author: lynn.chen  陈立
 * @Modified By:
 * @Date: 2013-09-03
 * @param: object 需要解析的xml路径
 */
var myCalendars = new Array();
function createLongDhxCalendar(object, startTime)
{
	var longCalendar;
	var objArray = object.toString().split(",");//保存id值
	//下面是同过ajax请求加载到相应控件中
	longCalendar = new dhtmlXCalendarObject(object);
	longCalendar.setDateFormat(sysCfg.dhxLongDateFmt);
	if(startTime)
	{
		longCalendar.setSensitiveRange(startTime);
	}
	//longCalendar._strToDate(new Date(), sysCfg.dhxShortDateFmt);
	setCalendarTopPosition(longCalendar,objArray);
	myCalendars[object] = longCalendar;
	return longCalendar;
}

/**
 * @Description: 创建短日期格式的dhx日历控件（格式如：2013-5-20）
 * @Author: lynn.chen  陈立
 * @Modified By:
 * @Date: 2013-09-03
 * @param: object 
 */
function createShortDhxCalendar(object, startDate)
{
	var shortCalendar;
	var objArray = object.toString().split(",");//保存id值
	//下面是同过ajax请求加载到相应控件中
	shortCalendar = new dhtmlXCalendarObject(object);
	shortCalendar.setDateFormat(sysCfg.dhxShortDateFmt);
	if(startDate)
	{
		shortCalendar.setSensitiveRange(startDate);
	}
	shortCalendar.hideTime();//隐藏时间
	setCalendarTopPosition(shortCalendar, objArray);
	myCalendars[object] = shortCalendar;
	return shortCalendar;
}

/**
 * @Description: 自动判断给Calendar设置Position为Top
 * @Author: lynn.chen  陈立
 * @Modified By:
 * @Date: 2013-09-03
 * @param: calendar 日期控件对象
 * @param: objArray 对象id数组
 * @param: autoJudge 自动判断，false则是一定设置为top
 */
function setCalendarTopPosition(calendar, objArray, autoJudge)
{
	autoJudge = typeof(autoJudge) == "undefined" || autoJudge == null || autoJudge ? true : false;
	function doOnInpClick()
	{
		if(!autoJudge)//非自动，必须使用
		{
			this.calendar.setPosition($(this).offset().left, ($(this).offset().top - $(this.calendar.base).height()));
		}
		else if(($(this).offset().top + $(this.calendar.base).height()) > $(document.body).height() && $(this).offset().top > $(this.calendar.base).height())//动态判断位置
		{
			this.calendar.setPosition($(this).offset().left, ($(this).offset().top - $(this.calendar.base).height()));
		}
	};
	var objectArray = (typeof(objArray) == "string" ? new Array([objArray]) : objArray);
	for(var i = 0; i < objectArray.length; i++)
	{
		var obj = document.getElementById(objectArray[i]);
		if(obj == null || !obj)
		{
			break;
		}
		if(String(obj.tagName).toLowerCase() == "input")
		{
			$(obj).bind("blur", function(){
				if(this.calendar.isVisible())
				{
					var inputObj = this;
					var t = window.setTimeout(function(){
						inputObj.calendar.hide();
						window.clearTimeout(t);
					},50);
				}
			});
			
			$(obj).bind("click", doOnInpClick);
			
			obj.calendar = calendar;
			obj.autoJudge = autoJudge;
		}
	}
	objArray = null;
}

/**
 * @Description: 给Layout设置Resize自动适应大小变化
 * @Author: lynn.chen  陈立
 * @Modified By:
 * @Date: 2014-3-20
 * @param: layout dhtmlXLayoutObject对象
 */
function setLayoutResize(layout)
{
	layout.attachEvent("onPanelResizeFinish", setSizesGrid);//内部拖动
    layout.attachEvent("onResize", setSizesGrid); //外部缩放
    layout.attachEvent("onCollapse", setSizesGrid); //按钮缩
    layout.attachEvent("onExpand", setSizesGrid);//按钮展开
    layout.setSizes(false);
}

/**
 * @Description: 重置grid大小
 * @Author: lynn.chen  陈立  
 * @Modified By:
 * @Date: 201312-27
 * @param: girdName
 */ 
function resizeLayout(layoutName)
{
	if(document.getElementById(layoutName))
	{
		var height = $("#" + layoutName).outerHeight() - $("#" + layoutName).position().top;
		$("#" + layoutName).height(height);
	}
}

/**
 * @Description: 按钮操作模板高度重置方法
 * @Author: lynn.chen  陈立
 * @Modified By:
 * @Date: 2015-01-23
 */ 
function opTemplateHeightResize()
{
	if($(".dhxwin_active").size() > 0)
	{
		var $contentDiv = $(".dhxwin_active .content_div");
		$contentDiv.height($(".dhxwin_active .content_td").height());
		$contentDiv.css("overflow", "auto");
	}
	else
	{
		var $contentDiv = $(".dhx_cell_cont_layout .content_div");
		$contentDiv.height($(".dhx_cell_cont_layout .content_td").height());
		$contentDiv.css("overflow", "auto");
	}
}
