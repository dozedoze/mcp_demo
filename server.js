process.stdout.write('welcome to mcp demo');

process.stdin.on('data', (data) => {
  process.stdout.write(`Received: ${data}`);
});