import { chromium } from 'playwright';

const html = `<!DOCTYPE html>
<html>
<head>
<style>
page { height: 100vh; margin: 0; background: #f8faf6; font-family: -apple-system, sans-serif; }
.scrollarea { height: 100vh; overflow-y: hidden; display: flex; flex-direction: column; }
.container { display: flex; flex-direction: column; align-items: center; min-height: 100vh; padding: 0 32px; box-sizing: border-box; }

/* 入场引导 */
.intro-guide { position: fixed; top: 0; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8faf6; z-index: 50; opacity: 0; pointer-events: none; transition: opacity 0.5s; }
.intro-guide.visible { opacity: 1; pointer-events: auto; }
.intro-guide.fading { opacity: 0; }
.guide-text { font-size: 24px; color: #6b7d66; text-align: center; padding: 0 40px; line-height: 1.8; opacity: 0; filter: blur(8px); transform: translateY(30px); transition: all 1.2s; }
.guide-text.done { opacity: 1; filter: none; transform: none; }
.guide-buttons { display: flex; gap: 20px; margin-top: 60px; opacity: 0; transition: opacity 0.8s; }
.guide-buttons.show { opacity: 1; }
.guide-btn { padding: 14px 40px; background: #a8b5a0; border-radius: 28px; cursor: pointer; }
.guide-btn.secondary { background: #fff; border: 1px solid #d4dcd0; }
.guide-btn text { font-size: 16px; color: #fff; font-weight: 400; }
.guide-btn.secondary text { color: #5a5a5a; }

/* Step 内容区 */
.content-area { flex: 1; display: none; flex-direction: column; align-items: center; justify-content: center; width: 100%; padding: 60px 0; box-sizing: border-box; }
.content-area.active { display: flex; }
.step-content { display: flex; flex-direction: column; align-items: center; text-align: center; opacity: 0; width: 100%; }
.step-content.fade-in { animation: fadeInFloat 1s ease-out forwards; }
.main-text { font-size: 22px; color: #4a4a4a; line-height: 1.8; text-align: center; width: 100%; }
.sub-text { font-size: 16px; color: #8a8a8a; margin-top: 12px; text-align: center; width: 100%; }
.highlight-i { font-size: 36px; color: #6b7d66; letter-spacing: 4px; font-weight: 600; text-align: center; width: 100%; }
.btn-group-vertical { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-top: 48px; opacity: 0; width: 100%; }
.btn-group-vertical.fade-in { animation: fadeInFloat 1s ease-out forwards; }
.action-btn { padding: 14px 32px; background: #fff; border: 1px solid #d4dcd0; border-radius: 24px; cursor: pointer; text-align: center; }
.action-btn text { font-size: 15px; color: #5a5a5a; }
.action-btn:active { background: #f0f4ed; transform: scale(0.98); }
@keyframes fadeInFloat { 0% { opacity: 0; filter: blur(4px); } 100% { opacity: 1; filter: none; } }
</style>
</head>
<body>
<scroll-view class="scrollarea" scroll-y type="list">
  <view class="container" id="container">

    <!-- 入场引导 -->
    <view class="intro-guide visible" id="intro-guide">
      <text class="guide-text done" id="guide-text">你知道「放下」是什么意思吗？</text>
      <view class="guide-buttons show" id="guide-buttons">
        <view class="guide-btn" id="btn-yes"><text>是</text></view>
        <view class="guide-btn secondary" id="btn-no"><text>否</text></view>
      </view>
    </view>

    <!-- Step 0 -->
    <view class="content-area" id="step-0">
      <view class="step-content fade-in">
        <text class="main-text">你现在有什么感受？</text>
      </view>
    </view>

    <!-- Step 1 -->
    <view class="content-area" id="step-1">
      <view class="step-content fade-in">
        <text class="main-text">拿一个小物件</text>
        <text class="sub-text">感受"握住"（约5秒）</text>
        <text class="sub-text">再松手，任其掉落</text>
        <text class="sub-text">这就是「放下」</text>
      </view>
      <view class="btn-group-vertical fade-in">
        <view class="action-btn" id="step1-next"><text>继续</text></view>
      </view>
    </view>

    <!-- Step 2 -->
    <view class="content-area" id="step-2">
      <view class="step-content fade-in">
        <text class="main-text">这就是「放下」</text>
      </view>
      <view class="btn-group-vertical fade-in">
        <view class="action-btn" id="step2-next"><text>继续</text></view>
      </view>
    </view>

    <!-- Step 3: I SEE YOU -->
    <view class="content-area" id="step-3">
      <view class="step-content" id="step3-content">
        <text class="main-text highlight-i">I SEE YOU</text>
        <text class="sub-text">我看见你了</text>
      </view>
      <view class="btn-group-vertical" id="step3-btns">
        <view class="action-btn" id="step3-next"><text>继续</text></view>
      </view>
    </view>

    <!-- Step 4 -->
    <view class="content-area" id="step-4">
      <view class="step-content">
        <text class="main-text">你现在有什么感受</text>
      </view>
    </view>

  </view>
</scroll-view>

<script>
// 模拟小程序状态
const state = {
  currentStep: 0,
  showContent: false,
  introPhase: 1,
};

function log(msg) {
  console.log('[STATE]', msg, JSON.stringify({
    currentStep: state.currentStep,
    showContent: state.showContent,
    introPhase: state.introPhase
  }));
}

// goToStep 实现
function goToStep(step) {
  log('goToStep(' + step + ') START');
  state.currentStep = step;
  state.showContent = false;
  updateUI();

  setTimeout(() => {
    state.showContent = true;
    log('showContent=true, Step' + step + ' fades in');
    updateUI();
    log('goToStep(' + step + ') DONE');
  }, 100);
}

// onGuideChoice 实现 - 修复后的版本（先清除introPhase）
function onGuideChoice(choice) {
  log('onGuideChoice(' + choice + ')');
  // 先清除引导
  state.introPhase = 0;
  updateUI();
  log('introPhase=0, guide should hide');

  if (choice === '是') {
    goToStep(3);
  } else {
    goToStep(1);
  }
}

// handleTap
function handleTap() {
  log('handleTap() called, introPhase=' + state.introPhase);
  if (state.introPhase === 2) {
    log('handleTap: introPhase==2, calling onGuideTap');
    onGuideTap();
  }
}

// onGuideTap
function onGuideTap() {
  state.introPhase = 3;
  updateUI();
  setTimeout(() => {
    state.introPhase = 0;
    state.showContent = true;
    updateUI();
    log('guide fade-out done, showContent=true');
  }, 500);
}

// 更新 UI
function updateUI() {
  // intro guide
  const guide = document.getElementById('intro-guide');
  const guideBtns = document.getElementById('guide-buttons');

  if (state.introPhase > 0) {
    guide.className = 'intro-guide visible' + (state.introPhase === 3 ? ' fading' : '');
    guideBtns.className = 'guide-buttons show';
  } else {
    guide.className = 'intro-guide';
  }

  // steps
  for (let i = 0; i <= 4; i++) {
    const el = document.getElementById('step-' + i);
    if (el) el.className = 'content-area' + (state.currentStep === i ? ' active' : '');
  }

  // step content fade-in
  if (state.currentStep === 3) {
    const content = document.getElementById('step3-content');
    const btns = document.getElementById('step3-btns');
    if (state.showContent) {
      content.className = 'step-content fade-in';
      btns.className = 'btn-group-vertical fade-in';
    } else {
      content.className = 'step-content';
      btns.className = 'btn-group-vertical';
    }
  }
}

// 初始化
log('onLoad: init');
setTimeout(() => {
  log('triggerGuideAnimation: 1200ms fired, setting introPhase=2');
  state.introPhase = 2;
  updateUI();
  log('guide text and buttons should now be visible');

  // 用户点击"是"
  setTimeout(() => {
    log('USER CLICKS "是" button');
    onGuideChoice('是');
  }, 500);

}, 100);

document.getElementById('btn-yes').addEventListener('click', () => {
  log('btn-yes clicked');
  onGuideChoice('是');
});
document.getElementById('btn-no').addEventListener('click', () => {
  onGuideChoice('否');
});
</script>
</body>
</html>`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Collect console logs
const logs = [];
page.on('console', msg => {
  if (msg.type() === 'log') {
    logs.push(msg.text());
  }
});

// Navigate to the HTML
await page.goto('data:text/html;charset=utf-8,' + encodeURIComponent(html));

// Wait for the simulation to complete
await page.waitForTimeout(3000);

console.log('\n=== SIMULATION LOGS ===\n');
for (const log of logs) {
  console.log(log);
}

// Check final state
const step3Visible = await page.evaluate(() => {
  const el = document.getElementById('step-3');
  return el && el.className.includes('active');
});
const step4Visible = await page.evaluate(() => {
  const el = document.getElementById('step-4');
  return el && el.className.includes('active');
});
const guideHidden = await page.evaluate(() => {
  const el = document.getElementById('intro-guide');
  return el && !el.className.includes('visible');
});

console.log('\n=== FINAL STATE ===');
console.log('Step3 visible:', step3Visible);
console.log('Step4 visible:', step4Visible);
console.log('Intro guide hidden:', guideHidden);

if (!step3Visible && step4Visible) {
  console.log('\n!!! BUG CONFIRMED: Step3 never showed, Step4 is visible instead !!!');
} else if (step3Visible) {
  console.log('\n✓ Step3 is correctly visible after clicking "是"');
}

await browser.close();
