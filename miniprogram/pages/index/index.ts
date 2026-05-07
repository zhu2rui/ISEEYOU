// index.ts
interface IAnyObject {
  [key: string]: any
}

interface ReleaseRecord {
  feeling: string
  desire: string  // 被认可 / 想要控制 / 想要安全
  desireText: string
  timestamp: number
}

const app = getApp<IAppOption>()

// ──────────────────────────────────────────────────
// 步骤配置：id, 类型, 文字, 描述
// type: text=纯展示  input-feeling=输入感受  input-desire=输入想要什么
//       choice-two=二选一  choice-three=三选一  reading=朗读页  end=结束
// ──────────────────────────────────────────────────
const STEPS = [
  // 0: 引导语
  { id: 0,  type: 'guide',         label: 'Step0-引导' },

  // 1: 拿小物件体验
  { id: 1,  type: 'text',          label: 'Step1-小物件' },

  // 2: 这就是放下 → 自动进入 I SEE YOU
  { id: 2,  type: 'auto-next',      label: 'Step2-这就是放下' },

  // 3: I SEE YOU → 自动进入 Step4
  { id: 3,  type: 'auto-next',      label: 'Step3-I SEE YOU' },

  // 4: 输入感受
  { id: 4,  type: 'input-feeling', label: 'Step4-有什么感受' },

  // 5: 允许存在？
  { id: 5,  type: 'choice-two',     label: 'Step5-允许存在' },

  // 6: 愿意放下？
  { id: 6,  type: 'choice-two',     label: 'Step6-愿意放下' },

  // 7: 现在就放下可以吗
  { id: 7,  type: 'choice-two',     label: 'Step7-现在就放下' },

  // 8: 变淡还是清晰
  { id: 8,  type: 'choice-two',     label: 'Step8-变淡还是清晰' },

  // 9: 深呼吸感受离开
  { id: 9,  type: 'auto-next',      label: 'Step9-深呼吸感受离开' },

  // 10: 读出来（允许一切）
  { id: 10, type: 'reading',        label: 'Step10-朗读' },

  // 11: 结束
  { id: 11, type: 'end',            label: 'Step11-结束' },

  // 12: 情绪底下想要什么（三选一）
  { id: 12, type: 'choice-three',   label: 'Step12-想要什么' },

  // 13: 能否允许自己就是想要被认可
  { id: 13, type: 'choice-two',     label: 'Step13-允许被认可' },
  // 14-17: 被认可路径（说三遍）
  { id: 14, type: 'speech',         label: 'Step14-说一遍被认可' },
  { id: 15, type: 'speech',         label: 'Step15-说二遍被认可' },
  { id: 16, type: 'speech',         label: 'Step16-说三遍被认可' },
  { id: 17, type: 'feel',           label: 'Step17-感受想要' },

  // 18: 能否允许自己就是想要控制
  { id: 18, type: 'choice-two',     label: 'Step18-允许想要控制' },
  // 19-21: 想要控制路径（说三遍）
  { id: 19, type: 'speech',         label: 'Step19-说一遍想要控制' },
  { id: 20, type: 'speech',         label: 'Step20-说二遍想要控制' },
  { id: 21, type: 'speech',         label: 'Step21-说三遍想要控制' },

  // 22: 能否允许自己就是想要安全
  { id: 22, type: 'choice-two',     label: 'Step22-允许想要安全' },
  // 23-25: 想要安全路径（说三遍）
  { id: 23, type: 'speech',         label: 'Step23-说一遍想要安全' },
  { id: 24, type: 'speech',         label: 'Step24-说二遍想要安全' },
  { id: 25, type: 'speech',         label: 'Step25-说三遍想要安全' },

  // 26: 不愿意底下想要什么
  { id: 26, type: 'input-desire',   label: 'Step26-不愿底下想要什么' },
  // 27: 能否允许自己就是想要这些
  { id: 27, type: 'choice-two',     label: 'Step27-允许想要这些' },
  // 28-30: 说三遍"我就是想要这样"
  { id: 28, type: 'speech',         label: 'Step28-说一遍想要这样' },
  { id: 29, type: 'speech',         label: 'Step29-说二遍想要这样' },
  { id: 30, type: 'speech',         label: 'Step30-说三遍想要这样' },

  // 31: 允许抗拒吗
  { id: 31, type: 'choice-two',     label: 'Step31-允许抗拒吗' },
  // 32: 不允许底下想要什么
  { id: 32, type: 'input-desire',   label: 'Step32-不允许底下想要什么' },

  // 33: 能不能现在就是不放下
  { id: 33, type: 'choice-two',     label: 'Step33-能不能不放下' },
  // 34: 深呼吸说出来
  { id: 34, type: 'auto-next',      label: 'Step34-深呼吸说出来' },
  // 35: 身体紧绷
  { id: 35, type: 'text',           label: 'Step35-身体紧绷' },
  // 36: 愿不愿意永远和紧绷待在一起
  { id: 36, type: 'choice-two',     label: 'Step36-愿不愿意紧绷' },
  // 37-38: 再问一遍/最后一遍
  { id: 37, type: 'text',           label: 'Step37-再问一遍' },
  { id: 38, type: 'text',           label: 'Step38-最后一遍' },
  // 39: 好，那我们就一起待着
  { id: 39, type: 'text',           label: 'Step39-一起待着' },
  // 40: 读出来（允许一切）→ 结束
  { id: 40, type: 'reading-end',    label: 'Step40-朗读结束' },
]

Page({
  data: {
    currentStep: 0,
    showContent: false,
    // 用户输入
    feelingText: '',
    desireType: '',     // 被认可 / 想要控制 / 想要安全
    desireText: '',
    // BGM
    bgmEnabled: true,
    // 入场引导
    introPhase: 1,
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
    const records = [record, ...this.data.releaseRecords].slice(0, 10)
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
    const t = setTimeout(() => {
      this.setData({ introPhase: 2 })
    }, 1200)
    this.privateTimers.push(t)
  },

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

  // ── 通用跳转 ───────────────────────────────────────────
  goToStep(step: number) {
    // 单次 setData，避免微信批处理延迟
    this.setData({ currentStep: step, showContent: false })
    setTimeout(() => {
      this.setData({ showContent: true })
    }, 100)
  },

  // ── 输入 ──────────────────────────────────────────────
  onFeelingInput(e: IAnyObject) {
    this.setData({ feelingText: e.detail.value })
  },

  onDesireInput(e: IAnyObject) {
    this.setData({ desireText: e.detail.value })
  },

  // ── 引导页点击 → 进入流程 ──────────────────────────────
  onGuideChoice(e: IAnyObject) {
    const choice = e.currentTarget.dataset.value
    // 合并为一次 setData: 清除引导 + 跳转步骤 + 隐藏内容（等100ms再显示）
    this.setData({ introPhase: 0, currentStep: choice === '是' ? 3 : 1, showContent: false })
    setTimeout(() => {
      this.setData({ showContent: true })
    }, 100)
  },

  // ── Step 4 → Step 5 ──────────────────────────────────
  onFeelingConfirm() {
    this.goToStep(5)
  },

  // ── Step 5: 允许存在？ ────────────────────────────────
  onAllowExist(e: IAnyObject) {
    if (e.currentTarget.dataset.value === '允许') {
      this.goToStep(6)
    } else {
      this.goToStep(31)
    }
  },

  // ── Step 6: 愿意放下？ ────────────────────────────────
  onWantRelease(e: IAnyObject) {
    if (e.currentTarget.dataset.value === '愿意') {
      this.goToStep(7)
    } else {
      this.goToStep(26)
    }
  },

  // ── Step 7: 现在就放下？ ──────────────────────────────
  onCanReleaseNow(e: IAnyObject) {
    this.goToStep(8)
  },

  // ── Step 8: 变淡还是清晰 ──────────────────────────────
  onFeelChange(e: IAnyObject) {
    if (e.currentTarget.dataset.value === '变淡') {
      this.goToStep(9)
    } else {
      this.goToStep(12)
    }
  },

  // ── Step 9: 深呼吸 → 自动读出来 ──────────────────────
  goToReading() {
    this.saveReleaseRecord()
    this.goToStep(10)
  },

  // ── Step 10: 读出来 → 结束 ──────────────────────────
  onReadingDone() {
    this.goToStep(11)
  },

  // ── Step 12: 想要什么（三选一）───────────────────────
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
  onAllowDesire(e: IAnyObject) {
    if (e.currentTarget.dataset.value === '能') {
      const step = this.data.currentStep
      if (step === 13) this.goToStep(14)
      else if (step === 18) this.goToStep(19)
      else this.goToStep(23)
    } else {
      this.goToStep(33)
    }
  },

  // ── Step 1: 拿小物件 → Step 2 ──────────────────────
  onStep1Next() {
    this.goToStep(2)
  },

  // ── Step 2: 这就是放下 → Step 3 ───────────────────
  onStep2Next() {
    this.goToStep(3)
  },

  // ── Step 3: I SEE YOU → Step 4 ───────────────────
  onStep3Next() {
    this.goToStep(4)
  },

  // ── Step 14/15/16: 说三遍 ────────────────────────────
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
  onFeelDone() {
    this.saveReleaseRecord()
    this.goToStep(10)
  },

  // ── Step 26/32: 输入想要什么 ─────────────────────────
  onDesireConfirm() {
    this.goToStep(27)
  },

  // ── Step 27: 能否允许想要这些？ ─────────────────────
  onAllowThese(e: IAnyObject) {
    if (e.currentTarget.dataset.value === '能') {
      this.goToStep(28)
    } else {
      this.goToStep(33)
    }
  },

  // ── Step 31: 允许抗拒？ ──────────────────────────────
  onAllowResistance(e: IAnyObject) {
    if (e.currentTarget.dataset.value === '允许') {
      this.goToStep(33)
    } else {
      this.goToStep(32)
    }
  },

  // ── Step 33: 能不能不放下 ───────────────────────────
  onCanNotRelease(e: IAnyObject) {
    if (e.currentTarget.dataset.value === '能') {
      this.goToStep(34)
    } else {
      this.goToStep(35)
    }
  },

  // ── Step 34: 深呼吸说出来 → 读出来 ──────────────────
  onBreatheDone() {
    this.saveReleaseRecord()
    this.goToStep(10)
  },

  // ── Step 35: 身体紧绷 → Step 36 ────────────────────
  onTensionNext() {
    this.goToStep(36)
  },

  // ── Step 36: 愿不愿意和紧绷待在一起 ─────────────────
  onStayWithTension(e: IAnyObject) {
    if (e.currentTarget.dataset.value === '愿意') {
      this.goToStep(37)
    } else {
      this.goToStep(6)  // 循环回去
    }
  },

  // ── Step 37: 再问一遍 → Step 38 ────────────────────
  onTensionAgain() {
    this.goToStep(38)
  },

  // ── Step 38: 最后一遍 → Step 39 ────────────────────
  onTensionFinal() {
    this.goToStep(39)
  },

  // ── Step 39: 好，我们一起待着 → Step 40 ─────────────
  onStayTogether() {
    this.goToStep(40)
  },

  // ── Step 40: 朗读 → 结束 ────────────────────────────
  onFinalReadingDone() {
    this.goToStep(11)
  },

  // ── 点击屏幕（引导阶段） ──────────────────────────────
  handleTap() {
    if (this.data.introPhase === 2) {
      this.onGuideTap()
      return
    }
  },

  // ── 重新开始 ──────────────────────────────────────────
  restartPractice() {
    this.clearAllTimers()
    this.setData({
      currentStep: 0,
      showContent: false,
      feelingText: '',
      desireType: '',
      desireText: '',
      introPhase: 1,
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
