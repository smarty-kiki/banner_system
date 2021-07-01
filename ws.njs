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

  var port = 49999;
  var webSocketServer = require('websocket').server;
  var http = require('http'); 
  var log = function (str) {
    console.log(new Date() + " " + str);
  };

  var httpServer = http.createServer(function () {});
  httpServer.listen(port, function () {
    log("Listening on port " + port);
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
