// index.ts
interface IAnyObject {
  [key: string]: any
}

const DROP_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'

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
  },

  privateTimers: [] as any[],
  audioContext: null as any,

  onLoad() {
    this.initAudio()
    this.startPageAnimation()
    this.updateProgress()
  },

  onUnload() {
    this.clearAllTimers()
    if (this.audioContext) {
      this.audioContext.destroy()
    }
  },

  initAudio() {
    this.audioContext = wx.createInnerAudioContext()
    this.audioContext.src = DROP_SOUND_URL
    this.audioContext.volume = 0.3
  },

  playDropSound() {
    if (this.audioContext) {
      this.audioContext.stop()
      this.audioContext.play()
    }
  },

  updateProgress() {
    const progress = (this.data.currentStep / 13) * 100
    this.setData({ progressWidth: progress })
  },

  startPageAnimation() {
    setTimeout(() => {
      this.setData({ showContent: true })
      this.playDropSound()
    }, 300)
  },

  goToStep(step: number) {
    this.setData({
      currentStep: step,
      showContent: false
    })
    this.updateProgress()
    setTimeout(() => {
      this.setData({ showContent: true })
      this.playDropSound()
    }, 100)
  },

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
    })
    setTimeout(() => {
      this.startPageAnimation()
      this.updateProgress()
    }, 300)
  },

  clearAllTimers() {
    this.privateTimers.forEach(timer => clearTimeout(timer))
    this.privateTimers = []
  },
})
