const { spawn } = require('child_process');

const child = spawn('node', ['server.js']);
// 向子进程发送数据

const stringifyData = JSON.stringify({
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-06-18",
    "capabilities": {
      "elicitation": {}
    },
    "clientInfo": {
      "name": "example-client",
      "version": "1.0.0"
    }
  }
})

child.stdin.write(stringifyData);

// 监听子进程的输出
child.stdout.on('data', (data) => {
  const str = data.toString();
  const parseStr = JSON.parse(str);
  console.log("client receive:", parseStr);
  if (parseStr.id === 1) {
    const readyData = JSON.stringify({
      "jsonrpc": "2.0",
      "method": "notifications/initialized",
      "params": {
        "protocolVersion": "2025-06-18",
        "capabilities": {
          "elicitation": {}
        },
        "clientInfo": {
          "name": "example-client",
          "version": "1.0.0"
        }
      }
    })

    child.stdin.write(readyData);
  }


});




// 监听子进程的错误输出
child.stderr.on('data', (data) => {
  console.error(`client: ${data}`);
});