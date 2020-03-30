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
      return this.$el.duration
    },

    src: {
      get () {
        return this.$el.src
      },
      set (url) {
        this.isLoaded = false
        this.isLoading = false
        this.$el.src = url
        this.fileName = url.startsWith('data:audio') ? 'data' : url.split('/').pop()
        Log.trigger('audioNode:srcchanged', { fileName: this.fileName })
      }
    }
  },
  mounted () {
    Log.trigger('audioNode:create')
    this.$el.autoplay = false
    this.$el.onprogress = this.whileLoading
    this.$el.ontimeupdate = this.whilePlaying
    this.$el.oncanplaythrough = this.loaded
    this.$el.onloadeddata = this.onloading
    this.$el.preload = this.preloadSrc ? 'auto' : 'none'
    this.src = this.preloadSrc || blankMP3
    this.isLoaded = false
    this.isLoading = Boolean(this.preloadSrc)
  },
  methods: {
    load () {
      this.$el.load()
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
      this.$el.pause()
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
      return this.$el.play()
    },

    ready () {
      return this.$el.readyState >= 3
    },

    seek (position) {
      Log.trigger('audioNode:seek')
      this.$el.currentTime = this.$el.duration * position
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
          await this.$el.play()
          this.$el.pause()
          this.unlocked = true
          this.src = preloadSrc
          Log.trigger('audioNode:unlockedpreloaded')
        } else if (!this.unlocked) {
          await this.$el.play()
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
      if (this.$el.b) {
        Log.trigger(`audioNode:whileLoading: ${this.$el.buffered.end(0)}`)
      }
    },

    whilePlaying () {
      // Updating the src seems to fire ontimeupdate and we ignore it to avoid
      // triggering the event for tracks that actually aren't playing
      if (this.$el.currentTime === 0) return

      if (this.whilePlayingCallback) {
        Log.trigger('audioNode:whilePlaying', {
          currentTime: this.$el.currentTime,
          fileName: this.fileName
        })
        this.whilePlayingCallback({
          currentTime: this.$el.currentTime,
          fileName: this.fileName
        })
      }
    }
  }
}
</script>
<style>
</style>
