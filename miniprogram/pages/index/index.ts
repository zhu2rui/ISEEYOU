// index.ts
interface IAnyObject {
  [key: string]: any
}

interface ReleaseRecord {
  feeling: string
  desire: string
  desireText: string
  timestamp: number
}

const app = getApp<IAppOption>()

// ──────────────────────────────────────────────────
// 步骤配置（与网页 S[] 一一对应）
// 小程序步骤 = 网页步骤 - 2
// 网页: 引导=0, 物件=1, I SEE YOU=2, 输入=3, ...
// 小程序: 物件=1, I SEE YOU=3, 输入=4, 允许=5, ...
// ──────────────────────────────────────────────────
Page({
  data: {
    currentStep: -1,          // -1 = 显示引导层
    showContent: false,
    feelingText: '',
    desireType: '',
    desireText: '',
    bgmEnabled: true,
    // 引导层阶段: -1=隐藏, 0=显示文字(浮现动画), 1=显示按钮
    introPhase: -1,
    // 释放记录
    releaseRecords: [] as ReleaseRecord[],
    showRecordsPanel: false,
  },

  privateTimers: [] as number[],

  onLoad() {
    this.initBgmState()
    this.initReleaseRecords()
    this.triggerGuideAnimation()
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
    const { feelingText, desireType, desireText } = this.data
    if (!feelingText && !desireType) return
    const record: ReleaseRecord = {
      feeling: feelingText,
      desire: desireType,
      desireText: desireText,
      timestamp: Date.now(),
    }
    const records = [record, ...this.data.releaseRecords].slice(0, 20)
    this.setData({ releaseRecords: records })
    wx.setStorageSync('releaseRecords', records)
  },

  loadRecord(e: IAnyObject) {
    const record = e.currentTarget.dataset.record as ReleaseRecord
    this.setData({
      feelingText: record.feeling,
      desireType: record.desire,
      desireText: record.desireText,
      showRecordsPanel: false,
    })
  },

  deleteRecord(e: IAnyObject) {
    e.stopPropagation()
    const index = parseInt(e.currentTarget.dataset.index)
    const records = [...this.data.releaseRecords]
    records.splice(index, 1)
    this.setData({ releaseRecords: records })
    wx.setStorageSync('releaseRecords', records)
  },

  toggleRecordsPanel() {
    this.setData({ showRecordsPanel: !this.data.showRecordsPanel })
  },

  formatDate(ts: number) {
    const d = new Date(ts)
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    const h = d.getHours().toString().padStart(2, '0')
    const m = d.getMinutes().toString().padStart(2, '0')
    return `${month}/${day} ${h}:${m}`
  },

  // ── 入场引导动画 ────────────────────────────────────────
  triggerGuideAnimation() {
    // 0ms: 引导层出现（opacity:1）
    // 300ms: 文字开始浮现（blur消散 + translateY上移）
    const t0 = setTimeout(() => {
      this.setData({ introPhase: 0 })
    }, 100)
    this.privateTimers.push(t0)

    // 1800ms: 按钮淡入
    const t1 = setTimeout(() => {
      this.setData({ introPhase: 1 })
    }, 1800)
    this.privateTimers.push(t1)
  },

  // ── 通用跳转 ───────────────────────────────────────────
  goToStep(step: number) {
    this.setData({ currentStep: step, showContent: false })
    setTimeout(() => {
      this.setData({ showContent: true })
    }, 580)
  },

  // ── 输入 ──────────────────────────────────────────────
  onFeelingInput(e: IAnyObject) {
    this.setData({ feelingText: e.detail.value })
  },

  onDesireInput(e: IAnyObject) {
    this.setData({ desireText: e.detail.value })
  },

  // ── 引导页点击"是/否" ────────────────────────────────
  onGuideChoice(e: IAnyObject) {
    const choice = e.currentTarget.dataset.value
    // 是 → I SEE YOU (step=3)，否 → 物件 (step=1)
    const nextStep = choice === '是' ? 3 : 1
    this.setData({ introPhase: -1, currentStep: nextStep, showContent: false })
    setTimeout(() => {
      this.setData({ showContent: true })
    }, 580)
  },

  // ── Step 4: 输入感受 ──────────────────────────────────
  onFeelingConfirm() {
    const text = this.data.feelingText.trim()
    if (text) {
      this.saveReleaseRecord()
    }
    this.goToStep(5)  // 网页 S[4] = 小程序 step[5]
  },

  // ── Step 5: 允许存在？ ────────────────────────────────
  // S[4]: 允许→5, 不允许→30
  onAllowExist(e: IAnyObject) {
    if (e.currentTarget.dataset.value === '允许') {
      this.goToStep(6)
    } else {
      this.goToStep(30)
    }
  },

  // ── Step 6: 愿意放下？ ────────────────────────────────
  // S[5]: 愿意→6, 不愿意→25
  onWantRelease(e: IAnyObject) {
    if (e.currentTarget.dataset.value === '愿意') {
      this.goToStep(7)
    } else {
      this.goToStep(25)
    }
  },

  // ── Step 7: 现在就放下？ ─────────────────────────────
  // S[6]: 都可以→7
  onCanReleaseNow() {
    this.goToStep(8)
  },

  // ── Step 8: 变淡还是清晰 ──────────────────────────────
  // S[7]: 变淡→8, 清晰→11
  onFeelChange(e: IAnyObject) {
    if (e.currentTarget.dataset.value === '变淡') {
      this.goToStep(9)
    } else {
      this.goToStep(12)
    }
  },

  // ── Step 9: 深呼吸（← → 导航）─────────────────────
  // S[8]: nav, next=9
  onStep9Back() {
    this.goToStep(8)
  },

  onStep9Next() {
    this.goToStep(10)
  },

  // ── Step 10: 读出来 → 结束 ──────────────────────────
  // S[9]: nav, next=10
  onReadingDone() {
    this.goToStep(11)
  },

  // ── Step 12: 三选一 ────────────────────────────────
  // S[11]: desireGrid → 被认可=13, 控制=18, 安全=22
  onChooseDesire(e: IAnyObject) {
    const value = e.currentTarget.dataset.value
    this.setData({ desireType: value })
    if (value === '被认可') {
      this.goToStep(13)
    } else if (value === '想要控制') {
      this.goToStep(18)
    } else {
      this.goToStep(22)
    }
  },

  // ── Step 13/18/22: 能否允许想要？ ────────────────────
  // S[12/17/21]: 能→14/19/23, 不能→31
  onAllowDesire(e: IAnyObject) {
    if (e.currentTarget.dataset.value === '能') {
      const step = this.data.currentStep
      if (step === 13) this.goToStep(14)
      else if (step === 18) this.goToStep(19)
      else this.goToStep(23)
    } else {
      this.goToStep(31)
    }
  },

  // ── Step 14/15/16: 说三遍 ────────────────────────────
  // S[13/14/15]: nav, next=15/16/17
  // Step 17: 感受想要 → S[9]
  // S[19/20/21]: nav → 20/21/17
  onSpeechDone() {
    const step = this.data.currentStep
    if (step === 14) this.goToStep(15)
    else if (step === 15) this.goToStep(16)
    else if (step === 16) this.goToStep(17)
    else if (step === 19) this.goToStep(20)
    else if (step === 20) this.goToStep(21)
    else if (step === 21) this.goToStep(17)
    else if (step === 23) this.goToStep(24)
    else if (step === 24) this.goToStep(25)
    else if (step === 25) this.goToStep(17)
    else if (step === 28) this.goToStep(29)
    else if (step === 29) this.goToStep(30)
    else if (step === 30) this.goToStep(17)
  },

  // ── Step 17: 感受想要 → 读出来 ──────────────────────
  // S[16]: nav, next=9
  onFeelDone() {
    this.saveReleaseRecord()
    this.goToStep(10)
  },

  // ── Step 1/2/3 (物件/I SEE YOU/感受输入) ──────────
  onStep1Next() { this.goToStep(2) }    // S[1]: nav, next=2
  onStep2Next() { this.goToStep(3) }    // S[2]: nav, next=3
  onStep3Next() { this.goToStep(4) }    // S[3]: input, next=4

  // ── Step 26: 不愿意底下想要什么 ──────────────────────
  // S[25]: nav, next=26
  onDesireConfirm() {
    this.goToStep(27)
  },

  // ── Step 27: 能否允许想要这些？ ─────────────────────
  // S[26]: 能→28, 不能→32
  onAllowThese(e: IAnyObject) {
    if (e.currentTarget.dataset.value === '能') {
      this.goToStep(28)
    } else {
      this.goToStep(32)
    }
  },

  // ── Step 30: 允许抗拒？ ──────────────────────────────
  // S[29]: 允许→30, 不允许→31
  // 小程序 step 30 = S[29]
  onAllowResistance(e: IAnyObject) {
    if (e.currentTarget.dataset.value === '允许') {
      this.goToStep(30)
    } else {
      this.goToStep(31)
    }
  },

  // ── Step 31: 不允许底下想要什么 ──────────────────────
  // S[30]: nav, next=32
  // Step 32: 能→33, 不能→34
  // S[31]: choice
  onCanNotRelease(e: IAnyObject) {
    if (e.currentTarget.dataset.value === '能') {
      this.goToStep(33)
    } else {
      this.goToStep(34)
    }
  },

  // ── Step 33: 深呼吸说出来 → S[9] ──────────────────
  // S[32]: nav, next=9
  onBreatheDone() {
    this.saveReleaseRecord()
    this.goToStep(10)
  },

  // ── Step 34: 身体紧绷 ──────────────────────────────
  // S[33]: nav, next=35
  onTensionNext() {
    this.goToStep(35)
  },

  // ── Step 35: 愿不愿意和紧绷待在一起 ─────────────────
  // S[34]: choice, 愿意→36, 不愿意→6
  onStayWithTension(e: IAnyObject) {
    if (e.currentTarget.dataset.value === '愿意') {
      this.goToStep(36)
    } else {
      this.goToStep(7)
    }
  },

  // ── Step 36/37/38 ───────────────────────────────────
  onTensionAgain() { this.goToStep(37) }
  onTensionFinal() { this.goToStep(38) }
  onStayTogether() { this.goToStep(39) }

  // ── Step 39: 读出来 → 结束 ──────────────────────────
  onFinalReadingDone() {
    this.goToStep(11)
  },

  // ── ← 返回引导页 ────────────────────────────────────
  onBackToGuide() {
    this.clearAllTimers()
    this.setData({
      currentStep: -1,
      showContent: false,
      feelingText: '',
      desireType: '',
      desireText: '',
      introPhase: -1,
    })
    setTimeout(() => {
      this.triggerGuideAnimation()
    }, 100)
  },

  // ── 重新开始 ──────────────────────────────────────────
  restartPractice() {
    this.clearAllTimers()
    this.setData({
      currentStep: -1,
      showContent: false,
      feelingText: '',
      desireType: '',
      desireText: '',
      introPhase: -1,
    })
    setTimeout(() => {
      this.triggerGuideAnimation()
    }, 100)
  },

  clearAllTimers() {
    this.privateTimers.forEach(t => clearTimeout(t))
    this.privateTimers = []
  },
})
