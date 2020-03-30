<template>
<div>
  <AudioNode
    :key="s"
    :lock="true"
    :playlistId="playlistId"
    ref="audioNodes"
    v-for="s in size"
  />
</div>
</template>

<script>
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'

import AudioNode from './AudioNode.vue'
import Log from '../../js/log.js'

// auto play restrictions are per-element
// https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/
//
// Unlock a few elements, inspired by https://github.com/goldfire/howler.js/pull/1008/files
export default {
  name: 'StitchES-Vue-NodePool',
  data () {
    return {
      audioNodes: []
    }
  },
  components: {
    AudioNode
  },
  props: {
    playlistId: String,
    size: Number
  },
  computed: {
    ...mapGetters([
      'globalLock',
      'nextNode'
    ])
  },
  mounted () {
    Log.trigger('nodepool:create')
    this.setNodePool()
    if (this.globalLock) {
      document.addEventListener('click', () => this.unlockAllAudioNodes(true), {
        once: true,
        capture: false
      })
    }
    this.audioNodes = this.$refs.audioNodes
    this.audioNodes.forEach(audioNode => {
      audioNode.cleanupCallback = () => {}
    })
  },
  methods: {
    makePreloadingNode (src, cleanupCallback) {
      const AudioNodeClass = Vue.extend(AudioNode)
      const preloader = new AudioNodeClass({
        parent: this,
        propsData: {
          lock: true,
          playlistId: this.playlistId,
          preloadSrc: src
        },
        src: src
      })
      preloader.cleanupCallback = cleanupCallback
      preloader.$mount()
      this.audioNodes.push(preloader)
      // When we grab nodes we want to grab the preloaded one last
      // so the data that has been preloaded has value for longer
      return preloader
    },

    ...mapMutations([
      'SET_NODE_POOL'
    ]),

    // has Last in Last out behaviour e.g. [a, b, c] -> [b, c, a]
    async nextAvailableNode (cleanupCallback) {
      const audioNode = this.audioNodes.shift()

      // run the cleanup callback to cleanup the previous track
      audioNode.cleanupCallback()

      // attach the cleanup callback for the new track
      audioNode.cleanupCallback = cleanupCallback

      this.audioNodes.push(audioNode)

      // if the node is not unlocked (edge case) then unlock it
      // this happens if someone clicks play before interacting with document
      if (!audioNode.unlocked) {
        Log.trigger('nodepool:unlockingnode')
        await audioNode.unlock()
      }
      // fires on documunt interaction
      Log.trigger('nodepool:availablenode')
      return audioNode
    },

    setNodePool () {
      this.SET_NODE_POOL({
        playlistId: this.playlistId,
        pool: this
      })
    },

    unlockAllAudioNodes (delayPreloadingNodeUnlock = false) {
      Log.trigger('nodePool:unlockall')
      for (const audioNode of this.audioNodes) {
        audioNode.unlock(delayPreloadingNodeUnlock)
      }
    }

  }
}
</script>
<style>
</style>
