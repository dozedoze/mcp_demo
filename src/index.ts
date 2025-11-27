#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { LilySilkTester } from "./lilysilk-tester.js";

// 创建测试器实例
let tester: LilySilkTester | null = null;

// 创建 MCP Server 实例
const server = new McpServer({
  name: "lilysilk-tester",
  version: "1.0.0",
});

// 辅助函数：确保测试器已初始化
function ensureTesterInitialized(): LilySilkTester {
  if (!tester) {
    throw new Error("请先调用 launch_browser 启动浏览器");
  }
  return tester;
}

// 辅助函数：创建文本响应
function textResponse(text: string) {
  return {
    content: [
      {
        type: "text" as const,
        text,
      },
    ],
  };
}

// 注册工具：启动浏览器
server.registerTool(
  "launch_browser",
  {
    title: "启动浏览器",
    description: "启动浏览器并访问 Lilysilk 网站。可选择是否使用无头模式。",
    inputSchema: {
      headless: z.boolean().optional().default(true).describe("是否使用无头模式运行浏览器，默认为 true"),
      baseUrl: z.string().optional().default("https://www.lilysilk.com").describe("Lilysilk 网站的基础 URL"),
      storeCode: z.string().optional().default("us").describe("商店代码，如 'us', 'ca', 'uk', 'au' 等"),
    },
  },
  async ({ headless, baseUrl, storeCode }) => {
    const combineUrl = `${baseUrl}/${storeCode}` 
    tester = new LilySilkTester(combineUrl);
    await tester.launch(headless);
    return textResponse(`✅ 浏览器已启动，正在访问 ${combineUrl}`);
  }
);

// 注册工具：关闭浏览器
server.registerTool(
  "close_browser",
  {
    title: "关闭浏览器",
    description: "关闭浏览器，结束测试会话",
  },
  async () => {
    if (tester) {
      await tester.close();
      tester = null;
    }
    return textResponse("✅ 浏览器已关闭");
  }
);

// 注册工具：导航到指定页面
server.registerTool(
  "navigate_to_page",
  {
    title: "导航页面",
    description: "导航到指定页面",
    inputSchema: {
      url: z.string().describe("要访问的页面 URL（可以是相对路径或完整 URL）"),
    },
  },
  async ({ url }) => {
    const t = ensureTesterInitialized();
    await t.navigateTo(url);
    return textResponse(`✅ 已导航到: ${url}`);
  }
);

// 注册工具：搜索商品
server.registerTool(
  "search_product",
  {
    title: "搜索商品",
    description: "在网站上搜索商品",
    inputSchema: {
      keyword: z.string().describe("搜索关键词，如 'silk pillowcase', 'silk pajamas' 等"),
    },
  },
  async ({ keyword }) => {
    const t = ensureTesterInitialized();
    const result = await t.searchProduct(keyword);
    return textResponse(result);
  }
);

// 注册工具：浏览商品分类
server.registerTool(
  "browse_category",
  {
    title: "浏览分类",
    description: "浏览商品分类页面",
    inputSchema: {
      category: z.string().describe("商品分类，如 'women','bedding', 'pillowcases', 'pajamas', 'clothing' 等"),
    },
  },
  async ({ category }) => {
    const t = ensureTesterInitialized();
    const mergePath = '/category/' + category;
    const result = await t.browseCategory(mergePath);
    return textResponse(result);
  }
);

// 注册工具：查看商品详情
server.registerTool(
  "view_product_detail",
  {
    title: "查看商品详情",
    description: "查看商品详情页面",
    inputSchema: {
      productIndex: z.number().optional().default(0).describe("商品在列表中的索引（从 0 开始），默认为 0（第一个商品）"),
    },
  },
  async ({ productIndex }) => {
    const t = ensureTesterInitialized();
    const result = await t.viewProductDetail(productIndex);
    return textResponse(result);
  }
);

// 注册工具：选择商品选项
server.registerTool(
  "select_product_options",
  {
    title: "选择商品选项",
    description: "选择商品选项（颜色、尺寸等）",
    inputSchema: {
      color: z.string().optional().describe("颜色选项"),
      size: z.string().optional().describe("尺寸选项"),
      quantity: z.number().optional().default(1).describe("数量，默认为 1"),
    },
  },
  async ({ color, size, quantity }) => {
    const t = ensureTesterInitialized();
    const result = await t.selectProductOptions({ color, size, quantity });
    return textResponse(result);
  }
);

// 注册工具：添加到购物车
server.registerTool(
  "add_to_cart",
  {
    title: "添加到购物车",
    description: "将当前商品添加到购物车",
  },
  async () => {
    const t = ensureTesterInitialized();
    const result = await t.addToCart();
    return textResponse(result);
  }
);

// 注册工具：查看购物车
server.registerTool(
  "view_cart",
  {
    title: "查看购物车",
    description: "查看购物车内容",
  },
  async () => {
    const t = ensureTesterInitialized();
    const result = await t.viewCart();
    return textResponse(result);
  }
);

// 注册工具：进入结账流程
server.registerTool(
  "proceed_to_checkout",
  {
    title: "进入结账",
    description: "进入结账流程",
  },
  async () => {
    const t = ensureTesterInitialized();
    const result = await t.proceedToCheckout();
    return textResponse(result);
  }
);

// 注册工具：填写收货地址
server.registerTool(
  "fill_shipping_address",
  {
    title: "填写收货地址",
    description: "填写收货地址信息",
    inputSchema: {
      firstName: z.string().describe("名"),
      lastName: z.string().describe("姓"),
      email: z.string().describe("电子邮箱"),
      phone: z.string().describe("电话号码"),
      address1: z.string().describe("地址行 1"),
      address2: z.string().optional().describe("地址行 2（可选）"),
      city: z.string().describe("城市"),
      state: z.string().describe("州/省"),
      zipCode: z.string().describe("邮政编码"),
      country: z.string().optional().default("United States").describe("国家，默认为 'United States'"),
    },
  },
  async ({ firstName, lastName, email, phone, address1, address2, city, state, zipCode, country }) => {
    const t = ensureTesterInitialized();
    const result = await t.fillShippingAddress({
      firstName,
      lastName,
      email,
      phone,
      address1,
      address2,
      city,
      state,
      zipCode,
      country,
    });
    return textResponse(result);
  }
);

// 注册工具：截取屏幕截图
server.registerTool(
  "take_screenshot",
  {
    title: "截取截图",
    description: "截取当前页面的屏幕截图",
    inputSchema: {
      filename: z.string().optional().default("screenshot").describe("截图文件名（不含扩展名）"),
      fullPage: z.boolean().optional().default(false).describe("是否截取整个页面，默认为 false"),
    },
  },
  async ({ filename, fullPage }) => {
    const t = ensureTesterInitialized();
    const result = await t.takeScreenshot(filename, fullPage);
    return textResponse(result);
  }
);

// 注册工具：获取页面信息
server.registerTool(
  "get_page_info",
  {
    title: "获取页面信息",
    description: "获取当前页面的信息（URL、标题等）",
  },
  async () => {
    const t = ensureTesterInitialized();
    const result = await t.getPageInfo();
    return textResponse(JSON.stringify(result, null, 2));
  }
);

// 注册工具：等待元素出现
server.registerTool(
  "wait_for_element",
  {
    title: "等待元素",
    description: "等待指定元素出现在页面上",
    inputSchema: {
      selector: z.string().describe("CSS 选择器或文本内容"),
      timeout: z.number().optional().default(30000).describe("超时时间（毫秒），默认为 30000"),
    },
  },
  async ({ selector, timeout }) => {
    const t = ensureTesterInitialized();
    const result = await t.waitForElement(selector, timeout);
    return textResponse(result);
  }
);

// 注册工具：点击元素
server.registerTool(
  "click_element",
  {
    title: "点击元素",
    description: "点击页面上的指定元素",
    inputSchema: {
      selector: z.string().optional().describe("CSS 选择器"),
      text: z.string().optional().describe("按文本内容查找元素（与 selector 二选一）"),
    },
  },
  async ({ selector, text }) => {
    const t = ensureTesterInitialized();
    const result = await t.clickElement(selector, text);
    return textResponse(result);
  }
);

// 注册工具：运行完整测试流程
server.registerTool(
  "run_test_flow",
  {
    title: "运行完整测试流程",
    description: "运行完整的测试流程：浏览 ->分页类-> 查看商品 -> 加购",
    inputSchema: {
      testAddress: z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        address1: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
      }).optional().describe("测试用的地址信息"),
    },
  },
  async ({  testAddress }) => {
    const t = ensureTesterInitialized();
    const result = await t.runTestFlow( testAddress);
    return textResponse(result);
  }
);

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Lilysilk MCP Server 已启动");
}

main().catch((error) => {
  console.error("服务器启动失败:", error);
  process.exit(1);
});
