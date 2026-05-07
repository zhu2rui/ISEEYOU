// app.ts
App<IAppOption>({
  globalData: {
    bgmManager: null as any,
  },

  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 初始化全局 BGM 管理器
    this.initBgmManager()

    // 登录
    wx.login({
      success: res => {
        console.log(res.code)
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      },
    })
  },

  initBgmManager() {
    const audioContext = wx.createInnerAudioContext()
    audioContext.src = 'audio/bgm.mp3'
    audioContext.loop = true
    audioContext.volume = 0.4

    const bgmEnabled = wx.getStorageSync('bgmEnabled')
    if (bgmEnabled === '' || bgmEnabled === true) {
      // 默认开启，或用户未设置过
      wx.setStorageSync('bgmEnabled', true)
      audioContext.play()
    } else {
      audioContext.pause()
    }

    const manager = {
      audioContext,
      toggle(enabled: boolean) {
        wx.setStorageSync('bgmEnabled', enabled)
        if (enabled) {
          audioContext.play()
        } else {
          audioContext.pause()
        }
      },
      play() {
        audioContext.play()
      },
      pause() {
        audioContext.pause()
      },
    }

    this.globalData.bgmManager = manager
  },
})
