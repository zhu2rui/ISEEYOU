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
    // BGM 状态（由 navigation-bar 同步）
    bgmEnabled: true,
    // 入场引导阶段：0=等待动画, 1=引导语浮现中, 2=引导语出现完毕
    introPhase: 0,
    // 释放记录
    releaseRecords: [] as ReleaseRecord[],
    showRecordsPanel: false,
  },

  privateTimers: [] as number[],

  onLoad() {
    this.initBgmState()
    this.initReleaseRecords()
    this.startIntroAnimation()
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
    // 如果在 Step 0，直接跳到 Step 1
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

  // ── 入场动画 ───────────────────────────────────────────
  startIntroAnimation() {
    // Phase 0: 纯色背景等待 500ms
    const t0 = setTimeout(() => {
      this.setData({ introPhase: 1 })
      // Phase 1: 引导语"浮出水面"动画（1200ms），完成后进入 Phase 2
      const t1 = setTimeout(() => {
        this.setData({ introPhase: 2 })
        // Phase 2: 再等 800ms，显示完整 Step 0 内容
        const t2 = setTimeout(() => {
          this.setData({
            showContent: true,
            introPhase: 3,
          })
        }, 800)
        this.privateTimers.push(t2)
      }, 1200)
      this.privateTimers.push(t1)
    }, 500)
    this.privateTimers.push(t0)
  },

  goToStep(step: number) {
    // 每次进入 Step 12 时保存释放记录
    if (step === 12 && this.data.currentStep !== 12) {
      this.saveReleaseRecord()
    }
    this.setData({
      currentStep: step,
      showContent: false,
      introPhase: 0,
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
    // 可以添加点击屏幕继续的功能
  },

  restartPractice() {
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
      introPhase: 0,
    })
    setTimeout(() => {
      this.startIntroAnimation()
      this.updateProgress()
    }, 300)
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
