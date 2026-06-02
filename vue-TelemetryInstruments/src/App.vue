<script setup>
import PuzzlePage from './views/puzzleLoader.vue'
import AudioPlayer from './components/audioPlayer.vue';
</script>

<template>
  <div id="app">
    <AudioPlayer />
    <router-view />
    <PuzzlePage />
  </div>
</template>
