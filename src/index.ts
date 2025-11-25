import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from 'zod';
import fs from 'fs';

const NWS_API_BASE = "https://restapi.amap.com";

// Create server instance
const server = new McpServer({
  name: "myToolServer",
  version: "1.0.0",
});


server.registerTool("get_weather", {
  title: "获取天气信息",
  description: "得到当前城市邮政编码对应的天气信息",
  inputSchema: z.object({
    location: z.string().describe('城市邮政编码（例如：100000）'),
  }),
}, async ({ location }: { location: string }) => {
  try {
    const data = await fetch(`${NWS_API_BASE}/v3/weather/weatherInfo?city=${location}&key=${"acfa80d98b7d720563be58e89c8ec67a"}`)
    const dataJSon = await data.json();
    // throw new Error(JSON.stringify(dataJSon));
    const { lives } = dataJSon

    if (Array.isArray(lives[0])) {
      throw new Error(`没有找到城市邮政编码为${location}的城市`);
    }

    const result = {
      city: lives[0].city,
      temperature: lives[0].temperature + "℃",
      description: lives[0].weather,
    }

    return {
      content: [
        {
          type: "text",
          text: `城市：${result.city}，天气温度：${result.temperature}，天气描述：${result.description}`,
        },
      ],
    }
  } catch (error) {
    throw new Error(`Failed to get weather for ${location}: ${error}`);
  }
}
);

server.registerTool("write_file", {
  title: "写入文件",
  description: "写入文件到指定路径",
  inputSchema: z.object({
    path: z.string().describe('文件路径'),
    content: z.string().describe('文件内容'),
  }),
}, ({ path, content }) => {
  try {
    fs.writeFileSync(path, content);
    return {
      content: [
        {
          type: "text",
          text: `文件写入成功：${path}`,
        }
      ]
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `文件写入失败：${path}，错误信息：${error}`,
        }
      ]
    }
  }
});

server.connect(new StdioServerTransport());
