import { spawn } from "child_process";

// 启动服务器进程
const serverProcess = spawn("node", ["server.js"]);

serverProcess.stdout.on("data", (data) => {
  console.log(data.toString());
});

const msg = ["你好", "你是谁", "再见"];

// 向模拟服务器发送数据
msg.forEach((item, index) => {
  setTimeout(() => {
    console.log(`-->客户端发送消息: ${item}<--`);
    serverProcess.stdin.write(item);

    if (index === msg.length - 1) {
      serverProcess.stdin.end();
    }
  }, index * 1000);
});
