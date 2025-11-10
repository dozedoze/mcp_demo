// 这里的字典只做演示，通常不推荐使用中文作为 key
const MSG_MAPPING = {
  你好: "你好，我是陈大帅 AI",
  你是谁: "我是陈大帅 AI，很高兴认识你",
  再见: "再见，我是陈大帅 AI",
};

// 方式1：
// 设置编码
// 如果不设置 UTF-8 编码，Node.js 可能会以 Buffer 或其他编码方式读取数据，导致中文字符无法正确识别和匹配
process.stdin.setEncoding("utf-8");

// 监听客户端输入
process.stdin.on("data", (data) => {
  const msg = data.trim();

  // 方式2：
  // 不设置编码，
  // toString() 会自动转换为字符串
  // const msg = data.toString().trim();

  const response = MSG_MAPPING[msg] || "对不起，我不明白你的意思";
  process.stdout.write(`--->模拟服务器返回的数据: ${response}<--\n`);
});
