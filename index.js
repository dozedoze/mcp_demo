const { spawn } = require('child_process');

const child = spawn('node', ['server.js']);

child.stdin.write('Hello, server!');

child.stdout.on('data', (data) => {
  console.log(`sever: ${data}`);
});

child.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});