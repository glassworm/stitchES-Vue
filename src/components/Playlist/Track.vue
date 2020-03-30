<template>
<li>
  <span
    @click="togglePlay"
    :id="id"
  >
    <div
      :class="playClass"
      style="width: 100%;"
    >
      &#9658; Play Track {{ id.split('|')[1] }}
    </div>
    <progress
      class="stitches-progress"
      @click="updatePosition"
      :id="`${id}progress`"
      :ref="`${id}progress`"
      :value="progressValue"
    >
    </progress>
  </span>
</li>
</template>

<script>
import { mapGetters } from 'vuex'

import Log from '../../js/log.js'

export default {
  name: 'StitchES-Vue-Track',
  data () {
    return {
      audioNode: null,
      displayPauseButton: false,
      hasEnded: false,
      playClass: 'track',
      playlistSetCurrentTrack: this.setCurrentTrack,
      position: 0,
      progressValue: 0,
      paused: true,
      timeFromEnd: NaN,
      whilePlayingCallback: this.whilePlaying
    }
  },
  props: {
    id: String,
    playlistId: String,
    setCurrentTrack: Function,
    tracks: Array,
    url: String,
    whilePlaying: Function
  },
  computed: {
    ...mapGetters([
      'nodePools'
    ])
  },
  mounted () {
    this.tracks.push(this)
    Log.trigger('track:create')
  },
  methods: {
    cleanupAudioNode () {
      this.audioNode = null
    },

    async grabNode () {
      Log.trigger('track:grabNodeAndSetSrc')
      this.audioNode = await this.nodePools[this.playlistId].nextAvailableNode(
        this.cleanupAudioNode
      )
    },

    async load () {
      if (!this.audioNode) {
        await this.grabNode()
        this.audioNode.src = this.url
        await this.audioNode.load()
      } else if (this.audioNode && !this.audioNode.isLoading) {
        await this.audioNode.load()
      }
    },

    pause () {
      this.audioNode.pause()
      this.paused = true
      this.displayPauseButton = false
      Log.trigger('track:pause')
    },

    // https://developers.google.com/web/updates/2016/03/play-returns-promise
    async play () {
      Log.trigger('track:play')
      try {
        if (this.audioNode) {
          // No need to check for unlocked audio nodes, since hasEnded means the audio node have been unlocked before
          if (this.hasEnded) {
            this.seek(0)
          }
        } else {
          // grabbing a new node automatically results in position 0 for it and no seek(0) is needed
          // TODO we should set the old position if it was partially played
          await this.grabNode()
          this.audioNode.src = this.url
        }

        await this.audioNode.play(this.whilePlayingLocal)

        // TODO: this needs to happen via callbacks
        if (this.audioNode.isLoaded) {
          this.playClass = 'stitches-playing'
        } else {
          this.playClass = 'stitches-loading'
        }

        this.hasEnded = false
        this.paused = false
        Log.trigger('track:playing')
      } catch (err) {
        Log.trigger('track:notplaying')
        Log.trigger(err)
      }
    },

    async preload () {
      // grab node from list
      // make sure this one is last to be unlocked
      Log.trigger('track:preload')
      this.audioNode = this.nodePools[this.playlistId].makePreloadingNode(
        this.url,
        this.cleanupAudioNode
      )
    },

    seek (position) {
      if (this.hasEnded) {
        this.hasEnded = false
        this.preloadNextTrackDispatched = false
      }
      this.audioNode.seek(position)
    },

    togglePlay (evt) {
      evt.preventDefault()
      if (this.audioNode && !this.paused) {
        this.pause()
        this.playClass = 'stitches-paused'
      } else {
        this.playlistSetCurrentTrack(this)
      }
    },

    async updatePosition (evt) {
      const offset = evt.clientX - this.$refs[`${this.id}progress`].getBoundingClientRect().left
      const newPosition = offset / this.$refs[`${this.id}progress`].offsetWidth
      await this.playlistSetCurrentTrack(this)
      this.seek(newPosition)
    },

    whilePlayingLocal (data) {
      this.position = data.currentTime / this.audioNode.duration
      this.timeFromEnd = this.audioNode.duration - data.currentTime
      console.log('audioNode.duration %s', this.audioNode.duration)
      if (!this.hasEnded && this.timeFromEnd < 0.2) {
        this.hasEnded = true
        this.paused = true
        Log.trigger('track-ended', { fileName: this.url, id: this.id, vue: this })
      }
      if (!this.preloadNextTrackDispatched && this.timeFromEnd < 10) {
        this.preloadNextTrackDispatched = true
        Log.trigger('track-preloadNextTrack', { id: this.id, vue: this })
      }

      if (!Number.isNaN(this.position)) {
        this.progressValue = this.position
      }

      if (!this.displayPauseButton) {
        this.playClass = 'stitches-playing'
        this.displayPauseButton = true
      }

      if (typeof this.whilePlayingCallback === 'function') {
        this.whilePlayingCallback({
          timeFromEnd: this.timeFromEnd,
          fileName: this.url
        })
      }
    }
  }
}
</script>
<style>
.stitches-progress {
  width:300px;
}
.stitches-loading {
  border: 3px solid red;
}
.stitches-playing {
  border: 3px solid green;
}
.stitches-paused {
  border: 3px solid blue;
}
</style>
