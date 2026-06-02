<script setup>
import PuzzlePage from './puzzleLoader.vue'
import AudioPlayer from './components/audioPlayer.vue';
</script>

<template>
  <div id="app">
    <AudioPlayer />
    <router-view />
  </div>
</template>
