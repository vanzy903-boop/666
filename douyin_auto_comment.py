"""
抖音自动化留言/互动脚本示例 (基于 Python + Playwright)

【重要提示与合规声明】：
1. 本代码仅用于自动化测试、个人创作者评论管理学习。
2. 抖音平台对批量/频繁留言有严格风控（频次过快会导致封号或触发验证码）。
3. 请合理设置留言间隔时间（例如 10~30 秒），切勿用于发送违规营销或垃圾广告。

依赖安装命令:
    pip install playwright
    playwright install chromium
"""

import time
import random
from playwright.sync_api import sync_playwright

# 1. 目标视频 URL
TARGET_VIDEO_URL = "https://www.douyin.com/video/7000000000000000000"  # 替换为实际视频地址

# 2. 预设留言库（随机抽取避免重复内容触发风控）
COMMENT_LIST = [
    "非常棒的分享，收获满满！👍",
    "讲得很有条理，支持一下！",
    "太牛了，期待更新下一期！",
    "很有启发，感谢分享！✨"
]

def run_auto_comment():
    with sync_playwright() as p:
        # 启动 Chromium 浏览器（headless=False 可实时观察操作过程）
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        print("正在打开抖音页面...")
        page.goto("https://www.douyin.com", wait_until="networkidle")

        # 提示用户在打开的浏览器中扫码登录抖音（首次需要）
        print("💡 请在弹出的浏览器中手动扫码登录抖音账号...")
        print("等待 20 秒以便完成登录...")
        time.sleep(20)

        print(f"正在跳转至目标视频: {TARGET_VIDEO_URL}")
        page.goto(TARGET_VIDEO_URL)
        time.sleep(3)

        # 随机选择一条评论
        comment_text = random.choice(COMMENT_LIST)
        print(f"准备发送留言内容: {comment_text}")

        try:
            # 定位评论输入框区域 (抖音网页端评论框元素)
            comment_input = page.locator('div[contenteditable="true"]').first
            if comment_input.is_visible():
                comment_input.click()
                time.sleep(1)
                
                # 模拟人工逐字输入
                for char in comment_text:
                    comment_input.type(char)
                    time.sleep(random.uniform(0.1, 0.3))

                time.sleep(1.5)

                # 点击发送按钮
                send_button = page.locator('button:has-text("发送")').first
                if send_button.is_visible():
                    send_button.click()
                    print("✅ 留言发送成功！")
                else:
                    print("⚠️ 未找到发送按钮，尝试按 Enter 发送...")
                    page.keyboard.press("Enter")
            else:
                print("❌ 未找到评论输入框，请检查视频是否开启评论控制或是否需要完成登录。")

        except Exception as e:
            print(f"❌ 发生异常: {e}")

        # 模拟人工浏览停顿
        time.sleep(random.uniform(3, 6))
        browser.close()

if __name__ == "__main__":
    run_auto_comment()
