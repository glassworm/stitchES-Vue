import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    globalLock: true,
    playlist: {}
  },
  actions: {
    /**
    addAudioNode: async (context, details) => {
      return new Promise((resolve, reject) => {
        context.commit('ADD_AUDIO_NODE', details)
        resolve()
      })
    },
    removeAudioNode: async (context, playlistId) => {
      return new Promise((resolve, reject) => {
        context.commit('REMOVE_AUDIO_NODE', playlistId)
        resolve()
      })
    }
    **/
  },
  mutations: {
    /**
    ADD_AUDIO_NODE: (state, details) => {
      state.playlist[details.playlistId].audioNodes.push(details.node)
    },
    REMOVE_AUDIO_NODE: (state, playlistId) => {
      state.playlist[playlistId].audioNodes.splice(0, 1)
    },
    **/
    ADD_PLAYLIST: (state, playlistId) => {
      state.playlist[playlistId] = {
        audioNodes: [],
        nodePool: null,
        tracks: []
      }
    },
    ADD_TRACK: (state, details) => {
      state.playlist[details.playlistId].tracks.push(details.track)
    },
    SET_NODE_POOL: (state, details) => {
      state.playlist[details.playlistId].nodePool = details.pool
    }
  },
  getters: {
    /**
    audioNodes: state => {
      return function (playlistId) {
        return state.playlist[playlistId].audioNodes
      }
    },
    **/
    globalLock: state => {
      return state.globalLock
    },
    nextNode: state => {
      return function (playlistId) {
        return new Promise((resolve, reject) => {
          resolve(state.playlist[playlistId].audioNodes.slice(0, 1)[0])
        })
      }
    },
    nodePool: state => {
      return function (playlistId) {
        return state.playlist[playlistId].nodePool
      }
    },
    tracks: state => {
      return function (playlistId) {
        return state.playlist[playlistId].tracks
      }
    }
  }
})
