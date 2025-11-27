export interface ShippingAddress {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}
export interface ProductOptions {
    color?: string;
    size?: string;
    quantity?: number;
}
export interface PageInfo {
    url: string;
    title: string;
    timestamp: string;
}
export declare class LilySilkTester {
    private browser;
    private context;
    private page;
    private baseUrl;
    constructor(baseUrl?: string);
    /**
     * 查找可用的 Chrome 浏览器路径
     */
    private findChromePath;
    /**
     * 启动浏览器并访问网站首页
     */
    launch(headless?: boolean): Promise<void>;
    /**
     * 关闭浏览器
     */
    close(): Promise<void>;
    /**
     * 关闭可能出现的弹窗
     */
    private closePopups;
    /**
     * 导航到指定页面
     */
    navigateTo(url: string): Promise<void>;
    /**
     * 搜索商品
     */
    searchProduct(keyword: string): Promise<string>;
    /**
     * 浏览商品分类
     */
    browseCategory(category?: string): Promise<string>;
    /**
     * 获取商品数量
     */
    private getProductCount;
    /**
     * 查看商品详情
     */
    viewProductDetail(productIndex?: number): Promise<string>;
    /**
     * 选择商品选项
     */
    selectProductOptions(options: ProductOptions): Promise<string>;
    /**
     * 添加到购物车
     */
    addToCart(): Promise<string>;
    /**
     * 查看购物车
     */
    viewCart(): Promise<string>;
    /**
     * 进入结账流程
     */
    proceedToCheckout(): Promise<string>;
    /**
     * 填写收货地址
     */
    fillShippingAddress(address: ShippingAddress): Promise<string>;
    /**
     * 截取屏幕截图
     */
    takeScreenshot(filename?: string, fullPage?: boolean): Promise<string>;
    /**
     * 获取页面信息
     */
    getPageInfo(): Promise<PageInfo>;
    /**
     * 等待元素出现
     */
    waitForElement(selector: string, timeout?: number): Promise<string>;
    /**
     * 点击元素
     */
    clickElement(selector?: string, text?: string): Promise<string>;
    /**
     * 填写邮箱
     */
    fillEmail(email: string): Promise<string>;
    /**
     * 运行完整测试流程
     */
    runTestFlow(testAddress?: Partial<ShippingAddress>): Promise<string>;
    private ensurePageInitialized;
}
//# sourceMappingURL=lilysilk-tester.d.ts.map