// index.ts
interface IAnyObject {
  [key: string]: any
}

interface ReleaseRecord {
  feeling: string
  emotion: string
  want: string
  timestamp: number
}

const app = getApp<IAppOption>()

Page({
  data: {
    currentStep: 0,
    showContent: false,
    feelingText: '',
    emotionName: '',
    wantText: '',
    changeType: '',
    allowType: '',
    releaseChoice: '',
    progressWidth: 0,
    // BGM 状态
    bgmEnabled: true,
    // 入场引导：
    //   0 = 隐藏（正常流程）
    //   1 = 引导语浮现中（CSS动画）
    //   2 = 引导语已浮现，等待用户点击
    //   3 = 引导语淡出中
    introPhase: 1,
    // 释放记录
    releaseRecords: [] as ReleaseRecord[],
    showRecordsPanel: false,
  },

  privateTimers: [] as number[],

  onLoad() {
    this.initBgmState()
    this.initReleaseRecords()
    // 初始 introPhase 已是 1，立即触发引导动画（不需要等）
    this.triggerGuideAnimation()
    this.updateProgress()
  },

  onUnload() {
    this.clearAllTimers()
  },

  // ── BGM ────────────────────────────────────────────────
  initBgmState() {
    const bgmEnabled = wx.getStorageSync('bgmEnabled')
    this.setData({ bgmEnabled: bgmEnabled !== false })
  },

  onBgmToggle(e: IAnyObject) {
    const enabled = e.detail.enabled
    this.setData({ bgmEnabled: enabled })
    if (app.globalData.bgmManager) {
      app.globalData.bgmManager.toggle(enabled)
    }
  },

  // ── 释放记录 ───────────────────────────────────────────
  initReleaseRecords() {
    const records = wx.getStorageSync('releaseRecords') || []
    this.setData({ releaseRecords: records })
  },

  saveReleaseRecord() {
    const { feelingText, emotionName, wantText } = this.data
    if (!feelingText && !emotionName) return
    const record: ReleaseRecord = {
      feeling: feelingText,
      emotion: emotionName,
      want: wantText,
      timestamp: Date.now(),
    }
    const records = [record, ...this.data.releaseRecords].slice(0, 10)
    this.setData({ releaseRecords: records })
    wx.setStorageSync('releaseRecords', records)
  },

  loadRecord(e: IAnyObject) {
    const record = e.currentTarget.dataset.record as ReleaseRecord
    this.setData({
      feelingText: record.feeling,
      emotionName: record.emotion,
      wantText: record.want,
      showRecordsPanel: false,
    })
    if (this.data.currentStep === 0) {
      this.goToStep(1)
    }
  },

  toggleRecordsPanel() {
    this.setData({ showRecordsPanel: !this.data.showRecordsPanel })
  },

  // ── 进度 ──────────────────────────────────────────────
  updateProgress() {
    const progress = (this.data.currentStep / 13) * 100
    this.setData({ progressWidth: progress })
  },

  // ── 入场引导动画 ────────────────────────────────────────
  // introPhase: 0=隐藏 1=浮现中(CSS) 2=浮现完毕(等待点击) 3=淡出中
  triggerGuideAnimation() {
    // 500ms 后，引导语"浮出水面"动画完成，进入可点击状态
    const t = setTimeout(() => {
      this.setData({ introPhase: 2 })
    }, 1200)
    this.privateTimers.push(t)
  },

  // 用户点击屏幕 → 引导语淡出，Step 0 内容淡入
  onGuideTap() {
    if (this.data.introPhase === 2) {
      this.setData({ introPhase: 3 })
      const t = setTimeout(() => {
        this.setData({ introPhase: 0 })
        this.setData({ showContent: true })
      }, 500)
      this.privateTimers.push(t)
    }
  },

  goToStep(step: number) {
    // 每次进入 Step 12 时保存释放记录
    if (step === 12 && this.data.currentStep !== 12) {
      this.saveReleaseRecord()
    }
    this.setData({
      currentStep: step,
      showContent: false,
    })
    this.updateProgress()
    setTimeout(() => {
      this.setData({ showContent: true })
    }, 100)
  },

  // ── 输入 ──────────────────────────────────────────────
  onFeelingInput(e: IAnyObject) {
    this.setData({ feelingText: e.detail.value })
  },

  onEmotionNameInput(e: IAnyObject) {
    this.setData({ emotionName: e.detail.value })
  },

  onWantInput(e: IAnyObject) {
    this.setData({ wantText: e.detail.value })
  },

  nextStep() {
    const next = this.data.currentStep + 1
    this.goToStep(next)
  },

  selectChange(e: IAnyObject) {
    const value = e.currentTarget.dataset.value
    this.setData({ changeType: value })
    if (value === '变淡') {
      this.goToStep(3)
    } else {
      this.goToStep(4)
    }
  },

  selectAllow(e: IAnyObject) {
    const value = e.currentTarget.dataset.value
    this.setData({ allowType: value })
    if (value === '能') {
      this.goToStep(6)
    } else {
      this.goToStep(7)
    }
  },

  selectAllowDeny(e: IAnyObject) {
    const value = e.currentTarget.dataset.value
    if (value === '允许') {
      this.goToStep(6)
    } else {
      this.goToStep(8)
    }
  },

  goToWant() {
    this.goToStep(5)
  },

  goToRelease() {
    this.goToStep(9)
  },

  goToObserve() {
    this.goToStep(2)
  },

  selectRelease(e: IAnyObject) {
    const value = e.currentTarget.dataset.value
    if (value === '愿意') {
      this.goToStep(10)
    } else {
      this.goToStep(11)
    }
  },

  selectReleaseTime(e: IAnyObject) {
    this.goToStep(12)
  },

  goToEnd() {
    this.goToStep(13)
  },

  handleTap() {
    if (this.data.introPhase === 2) {
      this.onGuideTap()
      return
    }
  },

  restartPractice() {
    this.clearAllTimers()
    this.setData({
      currentStep: 0,
      showContent: false,
      feelingText: '',
      emotionName: '',
      wantText: '',
      changeType: '',
      allowType: '',
      releaseChoice: '',
      progressWidth: 0,
      // 立即进入引导阶段，不走 0 → 避免 Step 0 闪烁
      introPhase: 1,
    })
    // 等 Step 0 淡出动画完成后，重新触发引导动画
    setTimeout(() => {
      this.triggerGuideAnimation()
      this.updateProgress()
    }, 100)
  },

  clearAllTimers() {
    this.privateTimers.forEach(t => clearTimeout(t))
    this.privateTimers = []
  },

  formatDate(ts: number) {
    const d = new Date(ts)
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    const h = d.getHours().toString().padStart(2, '0')
    const m = d.getMinutes().toString().padStart(2, '0')
    return `${month}/${day} ${h}:${m}`
  },
})
