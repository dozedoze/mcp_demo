

process.stdin.on('data', (data) => {

  // buffer to string
  const str = data.toString();

  const parseStr = JSON.parse(str);

  // 这里不能使用 console.log，因为 console.log 会输出到主进程，从而导致数据污染
  console.error("server receive:", parseStr);

  let stringifyData = '';
  if (parseStr.id === 1) {
    stringifyData = JSON.stringify({
      "jsonrpc": "2.0",
      "id": 1,
      "result": {
        "protocolVersion": "2025-06-18",
        "capabilities": {
          "tools": {
            "listChanged": true
          },
          "resources": {}
        },
        "serverInfo": {
          "name": "example-server",
          "version": "1.0.0"
        }
      }
    })
    process.stdout.write(stringifyData);
  }
})