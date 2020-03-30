import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    globalLock: true,
    playlist: {}
  },
  mutations: {
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
