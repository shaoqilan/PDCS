var LOGINUSERSESSION = { "ROLE_ID": "123123", "USER_ID": "heyi001" };//测试用
(function ($) {
    $.extend({
        HttpPost: function (url, reqJson, type, success) {
            //默认用户
            var userSession = LOGINUSERSESSION;
            var HttpObject = $.extend({}, reqJson, userSession);
            $.ajax({
                url: url,
                data: { "reqJson": $.base64.encode(JSON.stringify(HttpObject), true) },
                type: type,
                success: function (ret) {
                    if (success) {
                        if (ret) {
                            success({ ec: 0, em: "数据返回错误" });
                        }
                        try {
                            success(eval("(" + $.base64.decode(ret, true) + ")"));
                        } catch (e) {
                            success({ec:0,em:"数据返回错误"});
                        }
                    }
                }
            });
        },
    });
}(jQuery));