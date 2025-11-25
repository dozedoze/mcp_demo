import utils, { tools } from "./utils.js";

process.stdin.on("data", (data) => {
  const req = JSON.parse(data);
  let result;

  if (req.method === "tools/call") {
    result = tools[req.params.name](req.params.arguments);
  } else if (req.method in utils) {
    result = utils[req.method](req.params);
  } else {
    // 如果没有 id，说明是通知(notification)，不需要响应
    if (!req.id) {
      return;
    }
    // 如果有 id 但方法不存在，返回错误
    const errorRes = {
      jsonrpc: "2.0",
      error: {
        code: -32601,
        message: "Method not found",
      },
      id: req.id,
    };
    process.stdout.write(JSON.stringify(errorRes) + "\n");
    return;
  }

  const res = {
    jsonrpc: "2.0",
    result,
    id: req.id,
  };
  process.stdout.write(JSON.stringify(res) + "\n");
});
