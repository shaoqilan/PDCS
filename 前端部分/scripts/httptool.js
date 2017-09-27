//导出表格数据文件
(function ($) {
    $.extend({
        HttpPost: function (url, reqJson, type, success) {
            //默认用户
            var userSession = { "ROLE_ID": "123123", "USER_ID": "heyi001" };
            var HttpObject = $.extend({}, reqJson, userSession);
            $.ajax({
                url: url,
                data: { "reqJson": $.base64.encode(JSON.stringify(HttpObject), true) },
                type: type,
                success: function (ret) {
                    if (success) {
                        success(eval("(" + $.base64.decode(ret, true) + ")"));
                    }
                }
            });
        },
    });
}(jQuery));