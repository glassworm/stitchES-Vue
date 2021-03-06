<template>
<div>
  <AudioNode
    :key="s"
    :lock="true"
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
      // audioNodes: []
    }
  },
  components: {
    AudioNode
  },
  props: {
    globalLock: Boolean,
    playlistId: String,
    size: Number
  },
  computed: {
    ...mapGetters([
      'nextNode'
    ])
  },
  mounted () {
    Log.trigger('nodepool:create')
    this.addNodePool()
    if (this.globalLock) {
      document.addEventListener('click', () => this.unlockAllAudioNodes(true), {
        once: true,
        capture: false
      })
    }
    this.$refs.audioNodes.forEach(audioNode => {
      audioNode.cleanupCallback = () => {}
    })
    this.addNodePool()
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
      this.$refs.audioNodes.push(preloader)
      // When we grab nodes we want to grab the preloaded one last
      // so the data that has been preloaded has value for longer
      return preloader
    },

    ...mapMutations([
      'ADD_NODE_POOL'
    ]),

    // has Last in Last out behaviour e.g. [a, b, c] -> [b, c, a]
    async nextAvailableNode (cleanupCallback) {
      // console.log('nextAvailableNode was called.')
      const audioNode = this.$refs.audioNodes.shift()

      // run the cleanup callback to cleanup the previous track
      audioNode.cleanupCallback()

      // attach the cleanup callback for the new track
      audioNode.cleanupCallback = cleanupCallback

      this.$refs.audioNodes.push(audioNode)

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

    addNodePool () {
      this.ADD_NODE_POOL({
        playlistId: this.playlistId,
        pool: this
      })
    },

    unlockAllAudioNodes (delayPreloadingNodeUnlock = false) {
      Log.trigger('nodePool:unlockall')
      for (const audioNode of this.$refs.audioNodes) {
        audioNode.unlock(delayPreloadingNodeUnlock)
      }
    }

  }
}
</script>
<style>
</style>
