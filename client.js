import { spawn } from "child_process";

import msg from "./msg.js";

// 启动服务器进程
const serverProcess = spawn("node", ["server.js"]);

serverProcess.stdout.on("data", (data) => {
  console.log(data.toString() + "\n\n");
});

// 向模拟服务器发送数据
Object.values(msg).forEach((content, index) => {
  setTimeout(() => {
    // 序列化对象为 JSON 字符串
    const stringifyContent = JSON.stringify(content);
    console.log(`-->客户端发送消息: ${stringifyContent}<--`);

    serverProcess.stdin.write(stringifyContent);
  }, index * 1000);
});
