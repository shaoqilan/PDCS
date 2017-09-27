//$(init);
function init(){
	initTab();
	initMore();
}
function tab(ele,params){
	var $navbar = ele.children(".h-navbar");
	var $navitems = $navbar.children(".h-navbar__item");
	var $panels = $navbar.next(".h-tab__panel").children(".h-tab__content");
	var show = function(idx){
		$navitems.removeClass("h-navbar__item_on");
		$navitems.eq(idx).addClass("h-navbar__item_on");
		$panels.css("display","none");
		$panels.eq(idx).css("display","block");
	};
	show(params.defaultIndex || 0);
	$navbar.on("click",function(event){
		var $target = $(event.target).closest(".h-navbar__item");
		var index = $navitems.index($target);
		show(index);
		params.onChange && params.onChange(index);
	});
}
function initTab(){
	$("[id=tab]").each(function(idx,item){
		tab($(item),{
			defaultIndex: 0,
		    onChange: function(index){
		        console.log(index);
		    }
		})
	});
}
function initMore(){
	var moreBtns = $("[id='moreBtn']");
	$.each(moreBtns, function(idx,btn){
		$(btn).on("click",function(){
			var parent = $(this).siblings(".chart-detail");
			parent.toggleClass("chart-detail-open");
		});
	});
}
function getChartOptions(){
	var dpr = document.documentElement.getAttribute("data-dpr");
	var textSize = 10 * Number(dpr);
	var option = {
		textStyle:{
			fontSize:textSize,
	        color:"#666",
		},
		backgroundColor:'#EDF5FA',
	    color:["#FFB71C","#FA7971","#40C69E"],         //全局色板，动态化时需更新
	    tooltip:{
	    	trigger:"axis",
	    	axisPointer:{
	    		type:"line",
	    		lineStyle:{
	    			type:"dashed"
	    		}
	    	}
	    },
	    grid: {
	    	show:false,
	        left: "5%",
	        right: "10%",
	        bottom: "5%",
	        top:"14%",
	        containLabel: true
	    },
	    xAxis: {
	        type: 'category',
	        boundaryGap: false,
	        data: ['1个月','12个月','24个月'],
	        axisLine:{
	        	show:false
	        },
	        axisTick:{
	        	show:false
	        },
	        splitLine:{
	        	show:false
	        },
	        axisLabel:{
	       		fontSize:textSize,
	       		color:"#333"
	       	},
	    },
	    yAxis: {
	        type: 'value',
	        min:2,              //临时数据，动态化后可使用下面注释的值
	        // min:"dataMin",
	        axisLine:{
	        	show:false
	        },
	        axisTick:{
	        	show:false
	        },
	        splitLine:{
	        	show:false
	        },
	       	axisLabel:{
	       		fontSize:textSize,
	       		color:"#333"
	       	}
	        
	    },
	    series: [
	        {
	            name:'挂牌利率',
	            type:'line',
	            data:[2.3, 2.4, 2.3333]
	        },
	        {
	            name:'市场利率',
	            type:'line',
	            data:[2.444, 2.232, 2.393]
	        },
	        {
	            name:'FTP利率',
	            type:'line',
	            data:[2.4, 2.45, 2.45555]
	        }
	    ]
	};
	return [option,option];        //临时数据，动态化时替换
}
//function drawCharts(){
//	var eles = $("[id='chart']");
//	var eles3 = $("[id='chart3']");
//	var eles4 = $("[id='chart4']");
//	var options = getChartOptions();
//	var dpr = document.documentElement.getAttribute("data-dpr");
//	var textSize = 10 * Number(dpr);
//	if(eles.length !== options.length){
//		console.log("数据长度与canvas容器个数不匹配");
//	}
//	if (eles.length) {
//	    $.HttpPost();
//		$.get("./aqi-beijing.json",function(data){
//			$.each(eles, function(idx , ele){
//				var myChart = echarts.init(ele);
//				myChart.setOption({
//					textStyle:{
//						fontSize:textSize,
//				        color:"#666",
//					},
//					backgroundColor:'#EDF5FA',
//				    color:["#FFB71C","#FA7971","#40C69E"],         //全局色板，动态化时需更新
//				    tooltip:{
//				    	trigger:"axis",
//				    	axisPointer:{
//				    		type:"line",
//				    		lineStyle:{
//				    			type:"dashed"
//				    		}
//				    	}
//				    },
//				    dataZoom: [
//			            {
//				        	type: 'inside',
//				            start: 95,
//				            end:100
//				        }, {
//				            type: 'slider',
//				            show:false,
//				            backgroundColor:"red",
//				            start: 95,
//				            end:100
//				        }
//			        ],
//				    grid: {
//				    	show:false,
//				        left: "5%",
//				        right: "5%",
//				        bottom: "5%",
//				        top:"14%",
//				        containLabel: true
//				    },
//				    xAxis: {
//				        type: 'category',
//				        boundaryGap: false,
//				        data: data.map(function(item){ return item[0]}),
//				        axisLine:{
//				        	show:false
//				        },
//				        axisTick:{
//				        	show:false
//				        },
//				        splitLine:{
//				        	show:false
//				        },
//				        axisLabel:{
//				       		fontSize:textSize,
//				       		color:"#333"
//				       	},
//				    },
//				    yAxis: {
//				        type: 'value',
//				        axisLine:{
//				        	show:false
//				        },
//				        axisTick:{
//				        	show:false
//				        },
//				        splitLine:{
//				        	show:false
//				        },
//				       	axisLabel:{
//				       		fontSize:textSize,
//				       		color:"#333"
//				       	}
				        
//				    },
//				    series: [
//				        {
//				            name:'挂牌利率',
//				            type:'line',
//				            data:data.map(function(item){ return item[1]}),
//				        },
//				        {
//				            name:'市场利率',
//				            type:'line',
//				            data:data.map(function(item){ return item[1]}).reverse(),
//				        },
//				        {
//				            name:'FTP利率',
//				            type:'line',
//				            data:data.map(function(item){ return item[1]}),
//				        }
//				    ]
//				});
//				myChart.dispatchAction({
//					type:"showTip",
//					seriesIndex:0,
//					dataIndex:data.length -1
//				});
//			});
//		})
//	}
//	if(eles3.length){
//		$.get("./aqi-beijing.json",function(data){
//			$.each(eles3, function(idx, ele){
//				var myChart = echarts.init(ele);
//				myChart.setOption({
//					textStyle:{
//						fontSize:textSize,
//				        color:"#666",
//					},
//					backgroundColor:'#EDF5FA',
//				    color:["#FFB71C","#FA7971","#40C69E"],         //全局色板，动态化时需更新
//				    tooltip:{
//				    	trigger:"axis",
//				    	axisPointer:{
//				    		type:"line",
//				    		lineStyle:{
//				    			type:"dashed"
//				    		}
//				    	}
//	    			},
//	    			grid: {
//				    	show:false,
//				        left: "5%",
//				        right: "5%",
//				        bottom: "10%",
//				        top:"14%",
//				        containLabel: true
//				    },
//			        xAxis: {
//			            data: data.map(function (item) {
//			                return item[0];
//			            }),
//			            axisLine:{
//				        	show:false
//				        },
//				        axisTick:{
//				        	show:false
//				        },
//				        splitLine:{
//				        	show:false
//				        },
//				        axisLabel:{
//				       		fontSize:textSize,
//				       		color:"#333"
//				       	},
//			        },
//			        yAxis: {
//			            splitLine: {
//			                show: false
//			            },
//			            axisLine:{
//				        	show:false
//				        },
//				        axisTick:{
//				        	show:false
//				        },
//				        splitLine:{
//				        	show:false
//				        },
//				        axisLabel:{
//				       		fontSize:textSize,
//				       		color:"#333"
//				       	},
//			        },
//			        dataZoom: [
//			            {
//				        	type: 'inside',
//				            start: 95,
//				            end:100
//				        }, {
//				            type: 'slider',
//				            show:false,
//				            backgroundColor:"red",
//				            start: 95,
//				            end:100
//				        }
//			        ],
//			        series: {
//			            type: 'line',
//			            data: data.map(function (item) {
//			                return item[1];
//			            }),
//			        }
//				});
//				myChart.dispatchAction({
//					type:"showTip",
//					seriesIndex:0,
//					dataIndex:data.length -1
//				});
//			});
//		});
//	}
//	if(eles4.length){
//		$.get("./aqi-beijing.json",function(data){
//			$.each(eles4, function(idx, ele){
//				var myChart = echarts.init(ele);
//				myChart.setOption({
//					textStyle:{
//						fontSize:textSize,
//				        color:"#666",
//					},
//					backgroundColor:'#EDF5FA',
//				    color:["#FFB71C","#FA7971","#40C69E"],         //全局色板，动态化时需更新
//	    			grid: {
//				    	show:false,
//				        left: "5%",
//				        right: "5%",
//				        bottom: "10%",
//				        top:"30%",
//				        containLabel: true
//				    },
//			        xAxis: {
//			            data: data.map(function (item) {
//			                return item[0];
//			            }),
//			            axisLine:{
//				        	show:false
//				        },
//				        axisTick:{
//				        	show:false
//				        },
//				        splitLine:{
//				        	show:false
//				        },
//				        axisLabel:{
//				       		fontSize:textSize,
//				       		color:"#333"
//				       	},
//			        },
//			        yAxis: {
//			            splitLine: {
//			                show: false
//			            },
//			            axisLine:{
//				        	show:false
//				        },
//				        axisTick:{
//				        	show:false
//				        },
//				        splitLine:{
//				        	show:false
//				        },
//				        axisLabel:{
//				       		fontSize:textSize,
//				       		color:"#333"
//				       	},
//			        },
//			         tooltip:{
//				    	trigger:"axis",
//				    	axisPointer:{
//				    		type:"line",
//				    		lineStyle:{
//				    			type:"dashed"
//				    		}
//				    	},
//				    	alwaysShowContent:true,
//				    	backgroundColor:"#fff",
//						position: function (point, params, dom, rect, size) {
//						  // 固定在顶部
//						  $(dom).css({
//						  	'height':"0.906667rem",
//						  	'line-height':"0.906667rem",
//						  	'padding':"0px",
//						  	'fontSize':textSize + "px"
//						  });
//						  $(dom).find("span").css({
//						  	'width':"0.32rem",
//						  	'height':"0.106667rem",
//						  	'vertical-align':'middle',
//						  	'border-radius':'0',
//						  	'margin-left':'0.48rem',
//						  	'margin-right':' 0.106667rem',
//						  	'margin-top':'-1px'
//						  });
//						  $(dom).find("br").remove();
//						  return ['left', 'top'];
//						},
//				    	textStyle:{
//				    		color:"#000",
//				    		width:200
//				    	},
//				    	extraCssText:"width:100%",
//				    	confine:true,
//				    },
//			        dataZoom: [
//			            {
//				        	type: 'inside',
//				            start: 95,
//				            end:100
//				        }, {
//				            type: 'slider',
//				            show:false,
//				            backgroundColor:"red",
//				            start: 95,
//				            end:100
//				        }
//			        ],
//			        series: {
//			            type: 'line',
//			            data: data.map(function (item) {
//			                return item[1];
//			            }),
//			        }
//				});
//				myChart.dispatchAction({
//					type:"showTip",
//					dataIndex:data.length -1,
//					seriesIndex:0
//				});
//			});
//		});
//	}
	
//}
