<template>
  <audio/>
</template>

<script>
import Log from '../../js/log.js'

const blankMP3 =
  'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjM2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU2LjQxAAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hvAAAAAAAAAAAAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAATEFN//MUZAMAAAGkAAAAAAAAA0gAAAAARTMu//MUZAYAAAGkAAAAAAAAA0gAAAAAOTku//MUZAkAAAGkAAAAAAAAA0gAAAAANVVV'

export default {
  name: 'StitchES-Vue-AudioNode',
  data () {
    return {
      audio: null,
      fileName: null,
      isLoaded: false,
      isLoading: Boolean(this.preloadSrc),
      loadNext: null,
      unlocked: !this.lock,
      whilePlayingCallback: null
    }
  },
  components: {
  },
  props: {
    lock: Boolean,
    playlistId: String,
    preloadSrc: String
  },
  computed: {
    blank () {
      return this.src === blankMP3
    },

    duration () {
      return this.audio.duration
    },

    src: {
      get () {
        return this.audio.src
      },
      set (url) {
        this.isLoaded = false
        this.isLoading = false
        this.audio.src = url
        this.fileName = url.startsWith('data:audio') ? 'data' : url.split('/').pop()
        Log.trigger('audioNode:srcchanged', { fileName: this.fileName })
      }
    }
  },
  mounted () {
    Log.trigger('audioNode:create')
    this.audio = this.$el
    this.audio.autoplay = false
    this.audio.onprogress = this.whileLoading
    this.audio.ontimeupdate = this.whilePlaying
    this.audio.oncanplaythrough = this.loaded
    this.audio.onloadeddata = this.onloading
    this.audio.preload = this.preloadSrc ? 'auto' : 'none'
    this.src = this.preloadSrc || blankMP3
    this.isLoaded = false
    this.isLoading = Boolean(this.preloadSrc)
  },
  methods: {
    load () {
      this.audio.load()
    },

    loaded () {
      this.isLoaded = true
      // don't care about notifying on the blank mp3 loading since it's local
      if (!this.blank) {
        Log.trigger('audioNode:loaded', {
          fileName: this.fileName
        })
      }
    },

    onloading () {
      this.isLoading = true
    },

    pause () {
      this.audio.pause()
    },

    async play (whilePlayingCallback) {
      while (this.unlocked === false) {
        // Waiting for audio element to be unlocked, because we decided to not
        // go further with playing it until it's available.
        // This is done by leveraging the non-blocking nature of Promises.
        // eslint-disable-next-line no-await-in-loop
        await new Promise(resolve => setTimeout(resolve, 0))
      }
      // ideally this only fires on real playback, not when we are unlocking
      this.whilePlayingCallback = whilePlayingCallback
      return this.audio.play()
    },

    ready () {
      return this.audio.readyState >= 3
    },

    seek (position) {
      Log.trigger('audioNode:seek')
      this.audio.currentTime = this.audio.duration * position
    },

    // this can *only* be called via an interaction event like a click/touch
    // eslint-disable-next-line
    async unlock (delayPreloadingNodeUnlock) {
      // https://developers.google.com/web/updates/2016/03/play-returns-promise
      try {
        // if we've preloaded another src, switch src to unlock w/ blank
        if (!this.blank && !this.unlocked) {
          // if we clicked play directly, we might be in a race condition where unlock()
          // is called twice, once from the play interaction and once from general unlockAll()
          const preloadSrc = this.src
          this.src = blankMP3
          await this.audio.play()
          this.audio.pause()
          this.unlocked = true
          this.src = preloadSrc
          Log.trigger('audioNode:unlockedpreloaded')
        } else if (!this.unlocked) {
          await this.audio.play()
          Log.trigger('audioNode:unlocked')
          this.unlocked = true
        } else {
          Log.trigger('audioNode:nodealreadyunlocked')
        }
      } catch (err) {
        console.error('audioNode:unlockfailed')
      }
    },

    // https://dev.w3.org/html5/spec-author-view/spec.html#mediaerror
    whileLoading () {
      if (this.audio.b) {
        Log.trigger(`audioNode:whileLoading: ${this.audio.buffered.end(0)}`)
      }
    },

    whilePlaying () {
      // Updating the src seems to fire ontimeupdate and we ignore it to avoid
      // triggering the event for tracks that actually aren't playing
      if (this.audio.currentTime === 0) return

      if (this.whilePlayingCallback) {
        Log.trigger('audioNode:whilePlaying', {
          currentTime: this.audio.currentTime,
          fileName: this.fileName
        })
        this.whilePlayingCallback({
          currentTime: this.audio.currentTime,
          fileName: this.fileName
        })
      }
    }
  }
}
</script>
<style>
</style>
