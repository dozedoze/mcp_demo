


// step 1 
process.stdout.write('welcome to mcp demo \n');


// step 2
process.stdin.on('data', (data) => {
  process.stdout.write(`Received: ${data}`);
});