const { spawn } = require('child_process');

// 孕育子进程
const child = spawn('node', ['server.js']);

// 向子进程发送数据
child.stdin.write('Hello, server!');

// 监听子进程的输出
child.stdout.on('data', (data) => {
  console.log(`sever: ${data}`);
});

// 监听子进程的错误输出
child.stderr.on('data', (data) => {
  console.error(`sever: ${data}`);
});