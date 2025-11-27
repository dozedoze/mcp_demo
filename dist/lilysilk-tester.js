import { chromium } from "playwright";
import * as fs from "fs";
// Windows Chrome 浏览器可能的路径
const WINDOWS_CHROME_PATHS = [
    "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe",
    "/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/mnt/c/Users/*/AppData/Local/Google/Chrome/Application/chrome.exe",
];
// Linux Chrome 浏览器可能的路径
const LINUX_CHROME_PATHS = [
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/snap/bin/chromium",
];
const productSelectors = [
    '[class*="product-item"]',
    '[class*="group/productItem"]',
    '[class*="product-item"]',
    '[class*="product-card"]',
    '[data-testid="product"]',
    '.product',
    '[class*="ProductItem"]',
    'article[class*="product"]',
];
export class LilySilkTester {
    browser = null;
    context = null;
    page = null;
    baseUrl;
    constructor(baseUrl = "https://www.lilysilk.com/us") {
        this.baseUrl = baseUrl;
    }
    /**
     * 查找可用的 Chrome 浏览器路径
     */
    findChromePath() {
        const allPaths = [...WINDOWS_CHROME_PATHS, ...LINUX_CHROME_PATHS];
        for (const chromePath of allPaths) {
            // 处理通配符路径
            if (chromePath.includes("*")) {
                const basePath = chromePath.split("*")[0];
                if (fs.existsSync(basePath)) {
                    try {
                        const dirs = fs.readdirSync(basePath);
                        for (const dir of dirs) {
                            const fullPath = chromePath.replace("*", dir);
                            if (fs.existsSync(fullPath)) {
                                return fullPath;
                            }
                        }
                    }
                    catch {
                        continue;
                    }
                }
            }
            else if (fs.existsSync(chromePath)) {
                return chromePath;
            }
        }
        return null;
    }
    /**
     * 启动浏览器并访问网站首页
     */
    async launch(headless = true) {
        let launchError = null;
        // 方案1: 尝试使用 Playwright 内置的 Chromium
        try {
            this.browser = await chromium.launch({
                headless,
                args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
            });
        }
        catch (error) {
            launchError = error instanceof Error ? error : new Error(String(error));
            console.error("Playwright 内置 Chromium 启动失败，尝试使用系统浏览器...");
        }
        // 方案2: 尝试使用系统安装的 Chrome 浏览器
        if (!this.browser) {
            const chromePath = this.findChromePath();
            if (chromePath) {
                try {
                    console.error(`尝试使用系统 Chrome: ${chromePath}`);
                    this.browser = await chromium.launch({
                        headless,
                        executablePath: chromePath,
                        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
                    });
                }
                catch (error) {
                    const sysError = error instanceof Error ? error : new Error(String(error));
                    console.error(`系统 Chrome 启动失败: ${sysError.message}`);
                }
            }
        }
        // 方案3: 尝试使用 channel 选项启动已安装的 Chrome
        if (!this.browser) {
            const channels = ["chrome", "msedge", "chromium"];
            for (const channel of channels) {
                try {
                    console.error(`尝试使用 channel: ${channel}`);
                    this.browser = await chromium.launch({
                        headless,
                        channel: channel,
                        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
                    });
                    break;
                }
                catch {
                    continue;
                }
            }
        }
        // 如果所有方案都失败
        if (!this.browser) {
            const errorMsg = `
浏览器启动失败！请尝试以下解决方案：

1. 安装系统依赖（需要 sudo 权限）：
   sudo apt-get update && sudo apt-get install -y \\
     libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 \\
     libcups2 libdrm2 libxkbcommon0 libxcomposite1 \\
     libxdamage1 libxfixes3 libxrandr2 libgbm1 \\
     libpango-1.0-0 libcairo2 libasound2

2. 或者安装 Google Chrome：
   wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
   sudo dpkg -i google-chrome-stable_current_amd64.deb
   sudo apt-get install -f

原始错误: ${launchError?.message || "未知错误"}
`;
            throw new Error(errorMsg);
        }
        this.context = await this.browser.newContext({
            viewport: { width: 1920, height: 1080 },
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        });
        this.page = await this.context.newPage();
        // 设置默认超时时间
        this.page.setDefaultTimeout(30000);
        this.page.setDefaultNavigationTimeout(60000);
        // 访问首页
        await this.page.goto(this.baseUrl, { waitUntil: "domcontentloaded" });
        // 等待页面加载
        await this.page.waitForLoadState("networkidle").catch(() => {
            // 忽略超时，继续执行
        });
        // 尝试关闭可能出现的弹窗
        await this.closePopups();
    }
    /**
     * 关闭浏览器
     */
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.context = null;
            this.page = null;
        }
    }
    /**
     * 关闭可能出现的弹窗
     */
    async closePopups() {
        try {
            // 常见的弹窗关闭按钮选择器
            const popupSelectors = [
                '[aria-label="Close"]',
                '[class*="close"]',
                '[class*="Close"]',
                'button[class*="modal-close"]',
                '[data-dismiss="modal"]',
                '.popup-close',
                '#newsletter-popup-close',
                '.newsletter-close',
            ];
            for (const selector of popupSelectors) {
                const closeBtn = this.page.locator(selector).first();
                if (await closeBtn.isVisible().catch(() => false)) {
                    await closeBtn.click().catch(() => { });
                    await this.page.waitForTimeout(500);
                }
            }
            // 处理 cookie 同意弹窗
            const cookieSelectors = [
                '[id*="cookie"] button',
                '[class*="cookie"] button',
                'button:has-text("Accept")',
                'button:has-text("Accept All")',
                'button:has-text("I Accept")',
            ];
            for (const selector of cookieSelectors) {
                const acceptBtn = this.page.locator(selector).first();
                if (await acceptBtn.isVisible().catch(() => false)) {
                    await acceptBtn.click().catch(() => { });
                    await this.page.waitForTimeout(500);
                }
            }
        }
        catch (error) {
            // 忽略弹窗关闭错误
        }
    }
    /**
     * 导航到指定页面
     */
    async navigateTo(url) {
        this.ensurePageInitialized();
        const fullUrl = url.startsWith("http") ? url : `${this.baseUrl}${url}`;
        await this.page.goto(fullUrl, { waitUntil: "domcontentloaded" });
        await this.closePopups();
    }
    /**
     * 搜索商品
     */
    async searchProduct(keyword) {
        this.ensurePageInitialized();
        try {
            // 查找搜索框的常见选择器
            const searchSelectors = [
                'input[type="search"]',
                'input[name="q"]',
                'input[name="search"]',
                'input[placeholder*="Search"]',
                'input[placeholder*="搜索"]',
                '.search-input',
                '#search',
                '[data-testid="search-input"]',
            ];
            let searchInput = null;
            for (const selector of searchSelectors) {
                const input = this.page.locator(selector).first();
                if (await input.isVisible().catch(() => false)) {
                    searchInput = input;
                    break;
                }
            }
            // 如果搜索框不可见，尝试点击搜索图标
            if (!searchInput) {
                const searchIconSelectors = [
                    '[class*="search-icon"]',
                    '[class*="search"] svg',
                    'a[href*="search"]',
                    'button[aria-label*="search"]',
                    '.header-search',
                ];
                for (const selector of searchIconSelectors) {
                    const icon = this.page.locator(selector).first();
                    if (await icon.isVisible().catch(() => false)) {
                        await icon.click();
                        await this.page.waitForTimeout(1000);
                        break;
                    }
                }
                // 再次查找搜索框
                for (const selector of searchSelectors) {
                    const input = this.page.locator(selector).first();
                    if (await input.isVisible().catch(() => false)) {
                        searchInput = input;
                        break;
                    }
                }
            }
            if (!searchInput) {
                return "❌ 未找到搜索框";
            }
            // 输入搜索关键词
            await searchInput.fill(keyword);
            await this.page.waitForTimeout(500);
            // 按回车搜索
            await searchInput.press("Enter");
            // 等待搜索结果加载
            await this.page.waitForLoadState("domcontentloaded");
            await this.page.waitForTimeout(2000);
            // 获取搜索结果数量
            const productCount = await this.getProductCount();
            return `✅ 搜索 "${keyword}" 完成，找到约 ${productCount} 个商品\n当前页面: ${this.page.url()}`;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return `❌ 搜索失败: ${errorMessage}`;
        }
    }
    /**
     * 浏览商品分类
     */
    async browseCategory(category = 'women') {
        this.ensurePageInitialized();
        try {
            // 尝试通过导航菜单访问分类
            const categoryUrl = `${this.baseUrl}/${category.toLowerCase().replace(/\s+/g, "-")}`;
            await this.page.goto(categoryUrl, { waitUntil: "domcontentloaded" });
            await this.closePopups();
            await this.page.waitForTimeout(2000);
            const productCount = await this.getProductCount();
            return `✅ 已进入 "${category}" 分类页面\n找到约 ${productCount} 个商品\n当前页面: ${this.page.url()}`;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return `❌ 浏览分类失败: ${errorMessage}`;
        }
    }
    /**
     * 获取商品数量
     */
    async getProductCount() {
        for (const selector of productSelectors) {
            const products = this.page.locator(selector);
            const count = await products.count();
            if (count > 0) {
                return count;
            }
        }
        return 0;
    }
    /**
     * 查看商品详情
     */
    async viewProductDetail(productIndex = 0) {
        this.ensurePageInitialized();
        try {
            let productLink = null;
            for (const selector of productSelectors) {
                const products = this.page.locator(selector);
                const count = await products.count();
                if (count > productIndex) {
                    productLink = products.nth(productIndex);
                    break;
                }
            }
            if (!productLink) {
                return `❌ 未找到第 ${productIndex + 1} 个商品`;
            }
            await productLink.click();
            await this.page.waitForLoadState("domcontentloaded");
            await this.closePopups();
            await this.page.waitForTimeout(2000);
            // 获取商品信息
            const title = await this.page.title();
            const url = this.page.url();
            // 尝试获取价格
            let price = "未知";
            const priceSelectors = [
                '[class*="price"]',
                '[data-testid="price"]',
                '.product-price',
                '[itemprop="price"]',
            ];
            for (const selector of priceSelectors) {
                const priceEl = this.page.locator(selector).first();
                if (await priceEl.isVisible().catch(() => false)) {
                    price = await priceEl.textContent() || "未知";
                    break;
                }
            }
            return `✅ 已进入商品详情页\n标题: ${title}\n价格: ${price.trim()}\n链接: ${url}`;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return `❌ 查看商品详情失败: ${errorMessage}`;
        }
    }
    /**
     * 选择商品选项
     */
    async selectProductOptions(options) {
        this.ensurePageInitialized();
        const results = [];
        try {
            // 选择颜色
            if (options.color) {
                const colorSelectors = [
                    `[data-color="${options.color}"]`,
                    `[title="${options.color}"]`,
                    `[aria-label*="${options.color}"]`,
                    `button:has-text("${options.color}")`,
                    `[class*="color"] [title*="${options.color}"]`,
                ];
                let colorSelected = false;
                for (const selector of colorSelectors) {
                    const colorBtn = this.page.locator(selector).first();
                    if (await colorBtn.isVisible().catch(() => false)) {
                        await colorBtn.click();
                        colorSelected = true;
                        results.push(`✅ 已选择颜色: ${options.color}`);
                        await this.page.waitForTimeout(500);
                        break;
                    }
                }
                if (!colorSelected) {
                    results.push(`⚠️ 未找到颜色选项: ${options.color}`);
                }
            }
            // 选择尺寸
            if (options.size) {
                // const sizeSelectors = [
                //   `[data-size="${options.size}"]`,
                //   `[title="${options.size}"]`,
                //   `[aria-label*="${options.size}"]`,
                //   `button:has-text("${options.size}")`,
                //   `select[name*="size"] option[value="${options.size}"]`,
                //   `[class*="size"] button:has-text("${options.size}")`,
                // ];
                const sizeSelectors = ['[class*="flex h-[32px] min-w-[40px] cursor-pointer items-center justify-center border-b-[1.5px] border-transparent px-[4px] font-fm text-[15px] leading-[20px]"]'];
                let sizeSelected = false;
                for (const selector of sizeSelectors) {
                    const sizeEl = this.page.locator(selector).first();
                    if (await sizeEl.isVisible().catch(() => false)) {
                        await sizeEl.click();
                        sizeSelected = true;
                        results.push(`✅ 已选择尺寸: ${options.size}`);
                        await this.page.waitForTimeout(500);
                        break;
                    }
                }
                if (!sizeSelected) {
                    results.push(`⚠️ 未找到尺寸选项: ${options.size}`);
                }
            }
            // // 设置数量
            // if (options.quantity && options.quantity > 1) {
            //   const qtySelectors = [
            //     'input[name="quantity"]',
            //     'input[type="number"]',
            //     '[class*="quantity"] input',
            //     '#quantity',
            //   ];
            //   for (const selector of qtySelectors) {
            //     const qtyInput = this.page!.locator(selector).first();
            //     if (await qtyInput.isVisible().catch(() => false)) {
            //       await qtyInput.fill(String(options.quantity));
            //       results.push(`✅ 已设置数量: ${options.quantity}`);
            //       break;
            //     }
            //   }
            // }
            return results.length > 0 ? results.join("\n") : "⚠️ 未进行任何选项设置";
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return `❌ 选择选项失败: ${errorMessage}`;
        }
    }
    /**
     * 添加到购物车
     */
    async addToCart() {
        this.ensurePageInitialized();
        try {
            // const addToCartSelectors = [
            //   'button:has-text("Add to Cart")',
            //   'button:has-text("ADD TO CART")',
            //   'button:has-text("加入购物车")',
            //   '[data-testid="add-to-cart"]',
            //   '#add-to-cart',
            //   '[class*="add-to-cart"]',
            //   'button[name="add"]',
            //   'form[action*="cart"] button[type="submit"]',
            // ];
            const addToCartSelectors = ['[class*="font-fd text-[14px] uppercase leading-[18px] tracking-[1.12px] text-lilyWhite"]'];
            let addButton = null;
            for (const selector of addToCartSelectors) {
                const btn = this.page.locator(selector).first();
                if (await btn.isVisible().catch(() => false)) {
                    addButton = btn;
                    break;
                }
            }
            if (!addButton) {
                return "❌ 未找到 '添加到购物车' 按钮";
            }
            await addButton.click();
            await this.page.waitForTimeout(2000);
            // 检查是否添加成功（查找购物车数量变化或成功提示）
            // const successIndicators = [
            //   '[class*="cart-count"]',
            //   '[class*="cart-badge"]',
            //   ':has-text("Added to cart")',
            //   ':has-text("已添加到购物车")',
            //   '[class*="success"]',
            // ];
            const successIndicators = ['class*="fixed right-0 top-0 z-[302] h-[100%] w-[90%] max-w-[400px] translate-x-[100%] duration-[300ms] large:right-[3%] large:hidden large:h-auto large:translate-x-0 large:pt-[18px] large:duration-0"'];
            for (const selector of successIndicators) {
                const indicator = this.page.locator(selector).first();
                if (await indicator.isVisible().catch(() => false)) {
                    return "✅ 商品已成功添加到购物车";
                }
            }
            return "✅ 已点击添加到购物车按钮";
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return `❌ 添加到购物车失败: ${errorMessage}`;
        }
    }
    /**
     * 查看购物车
     */
    async viewCart() {
        this.ensurePageInitialized();
        try {
            // 尝试点击购物车图标或直接访问购物车页面
            // const cartSelectors = [
            //   '[class*="relative p-[4px] large:p-[8px]"]',
            // ];
            // let cartClicked = false;
            // for (const selector of cartSelectors) {
            //   const cartEl = this.page!.locator(selector).first();
            //   // if (await cartEl.isVisible().catch(() => false)) {
            //   //   await cartEl.click();
            //   //   cartClicked = true;
            //   //   break;
            //   // }
            //   await cartEl.click();
            //   cartClicked = true;
            //   break;
            // }
            // if (!cartClicked) {
            //   // 直接访问购物车页面
            //   await this.page!.goto(`${this.baseUrl}/cart`, { waitUntil: "domcontentloaded" });
            // }
            await this.page.goto(`${this.baseUrl}/cart`, { waitUntil: "domcontentloaded" });
            await this.page.waitForLoadState("domcontentloaded");
            await this.closePopups();
            await this.page.waitForTimeout(2000);
            // 获取购物车商品数量
            const itemSelectors = [
                '[class*="flex-row text-[14px] xsmall:block xsmall:py-[24px] small:flex  small:py-[16px] medium:flex medium:py-[16px] large:flex large:py-[16px]"]',
            ];
            let itemCount = 0;
            for (const selector of itemSelectors) {
                const items = this.page.locator(selector);
                const count = await items.count();
                if (count > 0) {
                    itemCount = count;
                    break;
                }
            }
            // 获取总价
            let total = "未知";
            const totalSelectors = [
                '[class*="total"]',
                '[class*="subtotal"]',
                '[data-testid="cart-total"]',
            ];
            for (const selector of totalSelectors) {
                const totalEl = this.page.locator(selector).first();
                if (await totalEl.isVisible().catch(() => false)) {
                    total = await totalEl.textContent() || "未知";
                    break;
                }
            }
            return `✅ 购物车页面\n商品数量: ${itemCount} 件\n总计: ${total.trim()}\n当前页面: ${this.page.url()}`;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return `❌ 查看购物车失败: ${errorMessage}`;
        }
    }
    /**
     * 进入结账流程
     */
    async proceedToCheckout() {
        this.ensurePageInitialized();
        try {
            const checkoutSelectors = [
                'button:has-text("Checkout")',
                '[class*="font-fd text-[12px] tracking-[1.12px] text-[#FCFBF0] "]',
                'button:has-text("CHECKOUT")',
                'button:has-text("结账")',
                'a:has-text("Checkout")',
                'a[href*="/checkout"]',
                '[data-testid="checkout-button"]',
                '[class*="checkout-btn"]',
                'button:has-text("Proceed to Checkout")',
            ];
            let checkoutBtn = null;
            for (const selector of checkoutSelectors) {
                const btn = this.page.locator(selector).first();
                if (await btn.isVisible().catch(() => false)) {
                    checkoutBtn = btn;
                    break;
                }
            }
            if (!checkoutBtn) {
                // 尝试直接访问结账页面
                await this.page.goto(`${this.baseUrl}/checkout`, { waitUntil: "domcontentloaded" });
            }
            else {
                await checkoutBtn.click();
                await this.page.waitForLoadState("domcontentloaded");
            }
            await this.closePopups();
            await this.page.waitForTimeout(2000);
            return `✅ 已进入结账页面\n当前页面: ${this.page.url()}`;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return `❌ 进入结账失败: ${errorMessage}`;
        }
    }
    /**
     * 填写收货地址
     */
    async fillShippingAddress(address) {
        this.ensurePageInitialized();
        try {
            const results = [];
            // 地址字段映射
            const fieldMappings = [
                { value: address.firstName, selectors: ['[name*="firstName"]', '[name*="first_name"]', '#firstName', '[placeholder*="First"]'] },
                { value: address.lastName, selectors: ['[name*="lastName"]', '[name*="last_name"]', '#lastName', '[placeholder*="Last"]'] },
                { value: address.email, selectors: ['[name*="email"]', '#email', '[type="email"]', '[placeholder*="Email"]'] },
                { value: address.phone, selectors: ['[name*="phone"]', '[name*="tel"]', '#phone', '[type="tel"]', '[placeholder*="Phone"]'] },
                { value: address.address1, selectors: ['[name*="address1"]', '[name*="street"]', '#address1', '[placeholder*="Address"]'] },
                { value: address.address2, selectors: ['[name*="address2"]', '#address2', '[placeholder*="Apt"]'] },
                { value: address.city, selectors: ['[name*="city"]', '#city', '[placeholder*="City"]'] },
                { value: address.state, selectors: ['[name*="state"]', '[name*="province"]', '#state', 'select[name*="state"]'] },
                { value: address.zipCode, selectors: ['[name*="zip"]', '[name*="postal"]', '#zip', '[placeholder*="ZIP"]', '[placeholder*="Postal"]'] },
                { value: address.country, selectors: ['[name*="country"]', '#country', 'select[name*="country"]'] },
            ];
            for (const field of fieldMappings) {
                if (!field.value)
                    continue;
                for (const selector of field.selectors) {
                    const element = this.page.locator(selector).first();
                    if (await element.isVisible().catch(() => false)) {
                        const tagName = await element.evaluate((el) => el.tagName.toLowerCase());
                        if (tagName === "select") {
                            await element.selectOption({ label: field.value }).catch(async () => {
                                await element.selectOption({ value: field.value }).catch(() => { });
                            });
                        }
                        else {
                            await element.fill(field.value);
                        }
                        results.push(`✅ 已填写: ${field.value}`);
                        await this.page.waitForTimeout(300);
                        break;
                    }
                }
            }
            return results.length > 0
                ? `地址信息填写完成:\n${results.join("\n")}`
                : "⚠️ 未找到地址表单字段";
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return `❌ 填写地址失败: ${errorMessage}`;
        }
    }
    /**
     * 截取屏幕截图
     */
    async takeScreenshot(filename = "screenshot", fullPage = false) {
        this.ensurePageInitialized();
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const filepath = `./screenshots/${filename}_${timestamp}.png`;
            await this.page.screenshot({
                path: filepath,
                fullPage,
            });
            return `✅ 截图已保存: ${filepath}`;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return `❌ 截图失败: ${errorMessage}`;
        }
    }
    /**
     * 获取页面信息
     */
    async getPageInfo() {
        this.ensurePageInitialized();
        return {
            url: this.page.url(),
            title: await this.page.title(),
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * 等待元素出现
     */
    async waitForElement(selector, timeout = 30000) {
        this.ensurePageInitialized();
        try {
            await this.page.waitForSelector(selector, { timeout });
            return `✅ 元素 "${selector}" 已出现`;
        }
        catch (error) {
            return `❌ 等待元素 "${selector}" 超时`;
        }
    }
    /**
     * 点击元素
     */
    async clickElement(selector, text) {
        this.ensurePageInitialized();
        try {
            if (selector) {
                await this.page.click(selector);
                return `✅ 已点击元素: ${selector}`;
            }
            else if (text) {
                await this.page.click(`text="${text}"`);
                return `✅ 已点击包含文本 "${text}" 的元素`;
            }
            else {
                return "❌ 请提供 selector 或 text 参数";
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return `❌ 点击失败: ${errorMessage}`;
        }
    }
    /**
     * 填写邮箱
     */
    async fillEmail(email) {
        this.ensurePageInitialized();
        try {
            const emailInput = this.page.locator('[id*="email"]').first();
            if (await emailInput.isVisible().catch(() => false)) {
                await emailInput.fill(email);
                return `✅ 已填写邮箱: ${email}`;
            }
            return `✅ 已填写邮箱: ${email}`;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return `❌ 填写邮箱失败: ${errorMessage}`;
        }
    }
    /**
     * 运行完整测试流程
     */
    async runTestFlow(testAddress) {
        this.ensurePageInitialized();
        const results = [];
        results.push("🚀 开始运行完整测试流程...\n");
        try {
            // 1. 浏览商品分类
            results.push("📝 步骤 1: 浏览商品分类");
            const categoryResult = await this.browseCategory("women");
            results.push(categoryResult);
            results.push("");
            // 2. 查看第一个商品详情
            results.push("📝 步骤 2: 查看商品详情");
            const detailResult = await this.viewProductDetail(0);
            results.push(detailResult);
            results.push("");
            // 3. 添加尺码
            results.push("📝 步骤 3: 添加尺码");
            const sizeResult = await this.selectProductOptions({ size: "XS" });
            results.push(sizeResult);
            results.push("");
            // 4. 添加到购物车
            results.push("📝 步骤 4: 添加到购物车");
            const addResult = await this.addToCart();
            results.push(addResult);
            results.push("");
            // 4. 查看购物车
            results.push("📝 步骤 5: 查看购物车");
            const cartResult = await this.viewCart();
            results.push(cartResult);
            results.push("");
            // 5. 进入结账
            results.push("📝 步骤 6: 进入结账流程");
            const checkoutResult = await this.proceedToCheckout();
            results.push(checkoutResult);
            results.push("");
            // 6.填写邮箱
            results.push("📝 步骤 7: 填写邮箱");
            const emailResult = await this.fillEmail("test@example.com");
            results.push(emailResult);
            results.push("");
            // 7. 点击CONTINUE TO SHIPPING
            results.push("📝 步骤 8: 点击CONTINUE TO SHIPPING");
            const clickResult = await this.clickElement('', "CONTINUE TO SHIPPING");
            results.push(clickResult);
            results.push("");
            // 8点击Continue As Guest
            results.push("📝 步骤 9: 点击Continue As Guest");
            const guestClickResult = await this.clickElement('', "Continue As Guest");
            results.push(guestClickResult);
            results.push("");
            throw new Error(results.join("\n"));
            // 6. 填写地址（如果提供）
            // if (testAddress) {
            //   results.push("📝 步骤 6: 填写收货地址");
            //   const defaultAddress: ShippingAddress = {
            //     firstName: testAddress.firstName || "Test",
            //     lastName: testAddress.lastName || "User",
            //     email: testAddress.email || "test@example.com",
            //     phone: testAddress.phone || "1234567890",
            //     address1: testAddress.address1 || "123 Test Street",
            //     city: testAddress.city || "New York",
            //     state: testAddress.state || "NY",
            //     zipCode: testAddress.zipCode || "10001",
            //     country: testAddress.country || "United States",
            //   };
            //   const addressResult = await this.fillShippingAddress(defaultAddress);
            //   results.push(addressResult);
            //   results.push("");
            // }
            // 7. 截图
            results.push("📝 最后: 截取测试结果截图");
            const screenshotResult = await this.takeScreenshot("test_flow_complete", true);
            results.push(screenshotResult);
            results.push("\n✅ 测试流程完成!");
            return results.join("\n");
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            results.push(`\n❌ 测试流程中断: ${errorMessage}`);
            return results.join("\n");
        }
    }
    ensurePageInitialized() {
        if (!this.page) {
            throw new Error("页面未初始化，请先调用 launch() 方法");
        }
    }
}
//# sourceMappingURL=lilysilk-tester.js.map