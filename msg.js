const clientRequest_sum = {
  jsonrpc: "2.0",
  id: 1,
  method: "sum",
  params: { a: 1, b: 2 },
};

const clientRequest_readFile = {
  jsonrpc: "2.0",
  id: 2,
  method: "readFile",
  params: { filename: "test.txt" },
};

const clientRequest_writeFile = {
  jsonrpc: "2.0",
  id: 3,
  method: "writeFile",
  params: { filename: "test2.txt", content: "我是陈大帅2" },
};

export default {
  clientRequest_sum,
  clientRequest_readFile,
  clientRequest_writeFile,
};
