<template>
  <div id="app">
    <header>
      <img alt="stitchES-logo" src="./assets/stitchES-logo.svg">&nbsp;
      <img alt="Vue logo" style="margin-bottom: -10px; height: 40px; width: 40px;" src="./assets/logo.png">
    </header>

    <h2>Playlist of 4 different tracks</h2>
    <Playlist
      :trackList="[
        '/mp3/short-continuous-1.mp3',
        '/mp3/short-continuous-2.mp3',
        '/mp3/short-continuous-3.mp3',
        '/mp3/short-continuous-4.mp3'
      ]"
      :nodePoolSize="nodePoolSize"
    />

    <h2>Playlist with duplicate tracks</h2>
    <Playlist
      :trackList="[
        '/mp3/short-continuous-1.mp3',
        '/mp3/short-continuous-1.mp3'
      ]"
      :nodePoolSize="nodePoolSize"
    />
    <div id="debug"></div>
  </div>
</template>

<script>
import Playlist from './components/Playlist/Index.vue'

export default {
  name: 'stitchES-Vue-example-app',
  data () {
    return {
      nodePoolSize: 2
    }
  },
  components: {
    Playlist
  }
}
</script>

<style>
body {
  padding: 15px;
}
h2 {
  margin-top:1em;
  margin-bottom:.5em;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
