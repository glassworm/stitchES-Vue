<template>
<div>
  <NodePool
    :playlistId="id"
    :size="nodePoolSize"
  />
  <ul>
    <Track
      :id="`${id}|${index + 1}`"
      :key="index"
      :playlistId="id"
      :setCurrentTrack="setCurrentTrack"
      :url="t"
      v-for="(t, index) in trackList"
      :whilePlaying="whilePlaying"
    />
  </ul>
</div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'

import NodePool from './NodePool.vue'
import Track from './Track.vue'
import Log from '../../js/log.js'

export default {
  name: 'StitchES-Vue',
  data () {
    return {
      currentTrack: null,
      id: null,
      preloadIndex: 0,
      // eslint-disable-next-line
      whilePlaying: data => {
        // console.log(data)
      }
    }
  },
  components: {
    NodePool,
    Track
  },
  props: {
    nodePoolSize: Number,
    trackList: Array
  },
  computed: {
    ...mapGetters([
      'audioNodes',
      'globalLock',
      'tracks'
    ])
  },
  created () {
    this.id = this.uuidv4()
    this.addPlaylist(this.id)
  },
  mounted () {
    if (this.preloadIndex >= 0) this.tracks(this.id)[this.preloadIndex].preload()
    // this.$root.$on('track-ended', (trackId) => this.playNextTrack(trackId))
    // this.$root.$on('track-preloadNextTrack', (trackId) => this.preloadNextTrack(trackId))
    this.$root.$on('track-ended', (detail) => this.playNextTrack(detail.id))
    this.$root.$on('track-preloadNextTrack', (detail) => this.preloadNextTrack(detail.id))
    if (this.globalLock) {
      document.addEventListener('click', () => this.unlockAllAudioNodes(true), {
        once: true,
        capture: false
      })
    }
  },
  methods: {
    addPlaylist () {
      this.ADD_PLAYLIST(this.id)
    },

    ...mapMutations([
      'ADD_PLAYLIST',
      'UNLOCK_AUDIO'
    ]),

    nextTrack () {
      const currentTrackIndex = this.tracks(this.id).findIndex(
        track => this.currentTrack && track.id === this.currentTrack.id
      )
      return this.tracks(this.id)[currentTrackIndex + 1]
        ? this.tracks(this.id)[currentTrackIndex + 1]
        : undefined
    },

    async playNextTrack (evt) {
      if (!this.trackIsPartOfPlaylist(evt)) return
      const nextTrack = this.nextTrack()
      if (nextTrack) {
        await nextTrack.play()
        this.currentTrack = nextTrack
      }
    },

    preloadNextTrack (trackId) {
      if (!this.trackIsPartOfPlaylist(trackId)) return
      const nextTrack = this.nextTrack()
      if (nextTrack) {
        nextTrack.load()
      }
    },

    async setCurrentTrack (track) {
      if (this.currentTrack) {
        this.currentTrack.pause()
      }
      this.currentTrack = track
      await this.currentTrack.play()
    },

    trackIsPartOfPlaylist (trackId) {
      return this.tracks(this.id).some(track => track.id === trackId)
    },

    uuidv4 () {
      return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      )
    },

    unlockAllAudioNodes (delayPreloadingNodeUnlock = false) {
      Log.trigger('nonePool:unlockall')
      for (const audioNode of this.audioNodes(this.id)) {
        audioNode.unlock(delayPreloadingNodeUnlock)
      }
    },

    unlockAudio () {
      this.UNLOCK_AUDIO()
    }
  }
}
</script>
<style>
body {
  padding: 40px;
}
h2 {
  margin-top:1em;
  margin-bottom:.5em;
}
ul {
  padding:0;
}
li {
  display: block;
  width:300px;
  list-style-type: none;
  margin-bottom:10px;
  padding:5px;
  border: 1px solid #ccc;
  border-radius:3px;
}
li a {
  display:block;
  text-decoration:none;
}
</style>
