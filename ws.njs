(function () {

  var banner_html = '';
  var banner = null;
  var editor = null;

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
      }

      sendJsonToBanner(json);
    });

    conn.on('close', function (conn) {
      log(request.key + ' closed...');
    });
  });
})();
