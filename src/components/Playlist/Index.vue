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
      :tracks="tracks"
      :url="t"
      v-for="(t, index) in trackList"
      :whilePlaying="whilePlaying"
    />
  </ul>
</div>
</template>

<script>
import NodePool from './NodePool.vue'
import Track from './Track.vue'

export default {
  name: 'StitchES-Vue',
  data () {
    return {
      currentTrack: null,
      id: null,
      preloadIndex: 0,
      tracks: [],
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
  created () {
    this.id = this.uuidv4()
  },
  mounted () {
    if (this.preloadIndex >= 0) this.tracks[this.preloadIndex].preload()
    this.$root.$on('track-ended', (detail) => this.playNextTrack(detail.id))
    this.$root.$on('track-preloadNextTrack', (detail) => this.preloadNextTrack(detail.id))
  },
  methods: {
    nextTrack () {
      const currentTrackIndex = this.tracks.findIndex(
        track => this.currentTrack && track.id === this.currentTrack.id
      )
      return this.tracks[currentTrackIndex + 1]
        ? this.tracks[currentTrackIndex + 1]
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
      return this.tracks.some(track => track.id === trackId)
    },

    uuidv4 () {
      return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      )
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
