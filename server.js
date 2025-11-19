import utils from "./utils.js";

process.stdin.setEncoding("utf-8");

process.stdin.on("data", (data) => {
  const msg = JSON.parse(data);

  const { method, params, id, jsonrpc } = msg;

  if (jsonrpc !== "2.0") {
    return;
  }

  const result = utils[method](params);

  const response = getFormatResponse({ id, result });

  process.stdout.write(`--->服务器返回参数: ${JSON.stringify(response)}<--\n`);
});

const getFormatResponse = ({ id, result }) => {
  try {
    return {
      jsonrpc: "2.0",
      id, // 需要与 clientRequest 的 id 一致
      result: {
        data: result,
      },
    };
  } catch (error) {
    return {
      jsonrpc: "2.0",
      id, // 需要与 clientRequest 的 id 一致
      error: {
        code: -32602, // 错误码
        message: "Invalid params", // 错误消息
      },
    };
  }
};
