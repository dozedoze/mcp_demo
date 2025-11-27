# Lilysilk MCP Server

一个用于测试 Lilysilk 网站稳定性的 MCP (Model Context Protocol) Server。支持自动化执行浏览、搜索、加购、填写地址等电商流程测试。

## 功能特性

- 🌐 **浏览器自动化**: 基于 Playwright，支持 Chrome/Chromium
- 🔍 **商品搜索**: 搜索任意关键词商品
- 📦 **商品浏览**: 浏览分类页面、查看商品详情
- 🛒 **购物车操作**: 添加商品到购物车、查看购物车
- 📝 **结账流程**: 进入结账页面、填写收货地址
- 📸 **截图功能**: 捕获测试过程截图
- ⚡ **完整流程测试**: 一键运行完整购物流程

## 安装

```bash
# 克隆项目
cd /home/chen1995/demo/mcp_demo

# 安装依赖
npm install

# 安装 Playwright 浏览器
npx playwright install chromium

# ⚠️ 重要：安装系统依赖（WSL2/Ubuntu/Debian）
# 运行安装脚本
./scripts/install-deps.sh

# 或手动安装
sudo apt-get update && sudo apt-get install -y \
  libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
  libxdamage1 libxfixes3 libxrandr2 libgbm1 \
  libpango-1.0-0 libcairo2 libasound2

# 构建项目
npm run build
```

### WSL2 环境特别说明

在 WSL2 环境中运行 Playwright 需要安装额外的系统依赖。如果遇到 `libnspr4.so` 等缺失库的错误，请运行：

```bash
./scripts/install-deps.sh
```

或者安装完整的 Google Chrome：

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt-get install -f
```

## 使用方法

### 1. 配置 MCP Server

在 Cursor 的 MCP 设置中添加此 Server：

**方式一：使用编译后的 JS 文件**

```json
{
  "mcpServers": {
    "lilysilk-tester": {
      "command": "node",
      "args": ["/home/chen1995/demo/mcp_demo/dist/index.js"]
    }
  }
}
```

**方式二：使用 tsx 直接运行 TypeScript**

```json
{
  "mcpServers": {
    "lilysilk-tester": {
      "command": "npx",
      "args": ["tsx", "/home/chen1995/demo/mcp_demo/src/index.ts"]
    }
  }
}
```

### 2. 可用工具

| 工具名称 | 描述 |
|---------|------|
| `launch_browser` | 启动浏览器并访问网站 |
| `close_browser` | 关闭浏览器 |
| `navigate_to_page` | 导航到指定页面 |
| `search_product` | 搜索商品 |
| `browse_category` | 浏览商品分类 |
| `view_product_detail` | 查看商品详情 |
| `select_product_options` | 选择商品选项（颜色、尺寸） |
| `add_to_cart` | 添加到购物车 |
| `view_cart` | 查看购物车 |
| `proceed_to_checkout` | 进入结账流程 |
| `fill_shipping_address` | 填写收货地址 |
| `take_screenshot` | 截取屏幕截图 |
| `get_page_info` | 获取当前页面信息 |
| `wait_for_element` | 等待元素出现 |
| `click_element` | 点击指定元素 |
| `run_test_flow` | 运行完整测试流程 |

### 3. 使用示例

#### 基础测试流程

```
1. 调用 launch_browser 启动浏览器
2. 调用 search_product 搜索 "silk pillowcase"
3. 调用 view_product_detail 查看第一个商品
4. 调用 add_to_cart 添加到购物车
5. 调用 view_cart 查看购物车
6. 调用 proceed_to_checkout 进入结账
7. 调用 fill_shipping_address 填写地址
8. 调用 take_screenshot 截图保存
9. 调用 close_browser 关闭浏览器
```

#### 一键测试

直接调用 `run_test_flow` 工具即可自动执行完整的购物流程测试。

## 工具参数说明

### launch_browser

```json
{
  "headless": true,          // 是否无头模式（默认 true）
  "baseUrl": "https://www.lilysilk.com"  // 网站地址
}
```

### search_product

```json
{
  "keyword": "silk pillowcase"  // 搜索关键词
}
```

### fill_shipping_address

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "address1": "123 Main Street",
  "address2": "Apt 4B",        // 可选
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "United States"
}
```

### run_test_flow

```json
{
  "searchKeyword": "silk pajamas",  // 搜索关键词
  "testAddress": {                   // 测试地址（可选）
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "phone": "1234567890",
    "address1": "123 Test Street",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  }
}
```

## 开发

```bash
# 开发模式运行
npm run dev

# 构建
npm run build

# 运行编译后的代码
npm start
```

## 注意事项

1. **首次运行**: 需要先安装 Playwright 浏览器 (`npx playwright install chromium`)
2. **无头模式**: 默认使用无头模式，如需看到浏览器界面，设置 `headless: false`
3. **网站变更**: 如果网站 UI 发生变化，可能需要更新选择器
4. **测试数据**: 请使用测试账户和虚假地址进行测试，不要使用真实支付信息
5. **截图目录**: 截图默认保存在 `./screenshots/` 目录下

## 目录结构

```
mcp_demo/
├── src/
│   ├── index.ts              # MCP Server 入口
│   └── lilysilk-tester.ts    # Lilysilk 测试器实现
├── dist/                     # 编译输出目录
├── screenshots/              # 截图保存目录
├── package.json
├── tsconfig.json
└── README.md
```

## License

MIT
