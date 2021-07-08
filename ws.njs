(function () {

  var fs = require('fs')
  var db_file = '/root/banner.db';

  var banner_html = '';

  fs.readFile(db_file, function (error, data) {
    if (error) {
      console.log('读取' + db_file + '文件失败了');
    } else {

      banner_html = data.toString();
      console.log(data.toString())
    }
  });

  var banner = null;

  var ws_port = 49999;
  var webSocketServer = require('websocket').server;
  var http = require('http'); 
  var log = function (str) {
    console.log(new Date() + " " + str);
  };

  var httpServer = http.createServer(function () {});
  httpServer.listen(ws_port, function () {
    log("Listening on ws_port " + ws_port);
  });

  server.on('request', function (request, response) {
    // http://127.0.0.1:3000/ /
    // http://127.0.0.1:3000/a /a
    // http://127.0.0.1:3000/foo/b /foo/b
    console.log('收到客户端的请求了，请求路径是：' + request.url)
    // response 对象有一个方法：write 可以用来给客户端发送响应数据
    // write 可以使用多次，但是最后一定要使用 end 来结束响应，否则客户端会一直等待
    response.write('hello')
    response.write(' nodejs')
    // 告诉客户端，我的话说完了，你可以呈递给用户了
    response.end()
  });

  var wsServer = new webSocketServer({
    httpServer: httpServer
  });

  wsServer.on('request', function (request) {
    var conn = request.accept(null, request.origin); 
    var guid, rand = request.resource;
    log(request.key + ' connected...');

    var sendJsonToBanner = function (json) {
      var msg = JSON.stringify(json);
      banner_html = json.content;

      fs.writeFile(db_file, banner_html, function (error) {
        if (error) {
          console.log('写入'+db_file+'失败');
        } else {
          console.log('写入'+db_file+'成功了');
        }
      });

      if (banner) {
        banner.sendUTF(msg);
        log('banner sync: ' + msg);
      }
    };

    var receive = function (e) {
      return JSON.parse(e.utf8Data);
    };

    conn.on('message', function (m) {
      if (m.type !== 'utf8') {
        return;
      }

      var json = receive(m);

      if (json.banner) {
        banner = conn;
        json.content = banner_html;
      }

      if (json.editor) {
        json.content = banner_html;
        var msg = JSON.stringify({content:banner_html});
        conn.sendUTF(msg);
        log('editor init: ' + msg);
      }

      sendJsonToBanner(json);
    });

    conn.on('close', function (conn) {
      log(request.key + ' closed...');
    });
  });
})();
