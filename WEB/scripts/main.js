//$(init);
window.COLOR_LIST = ["#46DFF4","#FF6C6C","#F25959",
                "#FFE466","#FFA147","#9B97F6","#FF7CB7","#26A9E7",
                "#A6DE61","#E96F5D","#EBB749","#F6C14F","#A478F3","#84F0AC","#CC8484",
              	"#A8FF24","#F9F900","#FFD306","#FFA042","#FF8040",
              	"#613030","#616130","#336666","#484891","#6C3365",
              	"#8E8E8E","#EA0000","#FF359A","#FF00FF","#9F35FF",
              	"#7D7DFF","#46A3FF","#4DFFFF","#4EFEB3","#53FF53",
              	"#9AFF02","#E1E100","#EAC100","#FF9224","#FF5809"]
function init(TabEvent) {
    initTab(TabEvent);
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
	$navbar.unbind("click").on("click",function(event){
		var $target = $(event.target).closest(".h-navbar__item");
		var index = $navitems.index($target);
		show(index);
		params.onChange(index, this) && params.onChange(index);
	});
}
function initTab(TabEvent) {
	$("[id=tab]").each(function(idx,item){
		tab($(item),{
			defaultIndex: 0,
			onChange: function (index, obj) {
			    if (TabEvent) {
			        TabEvent(index, obj);
			    }
		    }
		})
	});
}
function initMore(){
	var moreBtns = $("[id='moreBtn']");
	$.each(moreBtns, function(idx,btn){
		$(btn).unbind("click").on("click",function(){
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