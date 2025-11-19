import fs from "fs";
import path from "path";
import process from "process";

const dirname = process.cwd();

const sum = (params) => {
  const { a, b } = params;
  return a + b;
};

const readFile = (params) => {
  const { filename } = params;
  return fs.readFileSync(path.resolve(dirname, filename), "utf-8");
};

const writeFile = (params) => {
  const { filename, content } = params;
  try {
    fs.writeFileSync(path.resolve(dirname, filename), content);
    return true;
  } catch (error) {
    return false;
  }
};

export default { sum, readFile, writeFile };
