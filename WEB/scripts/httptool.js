var LOGINUSERSESSION = { "ROLE_ID": "123123", "USER_ID": "heyi001" };//测试用
var HTTPBASEURL = "http://60.205.113.66:8080/";

//设置登录的用户信息
function APPSetLoginUser(ROLE_ID, USER_ID) {
    LOGINUSERSESSION.ROLE_ID = ROLE_ID;
    LOGINUSERSESSION.USER_ID = USER_ID;
}
(function ($) {
    $.extend({
        HttpPost: function (url, reqJson, type, success) {
            //默认用户
            //开始请求
            $.ShowLoad("正在加载");
            var userSession = LOGINUSERSESSION;
            var HttpObject = $.extend({}, reqJson, userSession);
            $.ajax({
                url: HTTPBASEURL+url,
                data: { "reqJson": $.base64.encode(JSON.stringify(HttpObject), true) },
                type: type,
                success: function (ret) {
                    $.HideLoad();
                    if (success) {
                        success(eval("(" + $.base64.decode(ret, true) + ")"));
                    }
                }
            });
        },
        ShowLoad: function (txt) {
            //显示load加载动画
            //alert("调用APP 显示Load动画");
            try {
                if (/(iPhone|iPad|iPod|iOS)/i.test(navigator.userAgent)) {
                    aPPIOS.showLoad(txt);
                } else if (/(Android)/i.test(navigator.userAgent)) {
                    aPPAndroid.showLoad(txt);
                }
            } catch (e) {

            }
        },
        HideLoad: function () {
            //隐藏动画
            //alert("调用APP 隐藏Load动画");
            try {
                if (/(iPhone|iPad|iPod|iOS)/i.test(navigator.userAgent)) {
                    aPPIOS.hideLoad();
                } else if (/(Android)/i.test(navigator.userAgent)) {
                    aPPAndroid.hideLoad();
                }
            } catch (e) {

            }
        }
    });
}(jQuery));