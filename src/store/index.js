import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    nodePools: {}
  },
  mutations: {
    ADD_NODE_POOL: (state, details) => {
      state.nodePools[details.playlistId] = details.pool
    }
  },
  getters: {
    nodePools: state => {
      return state.nodePools
    }
  }
})
