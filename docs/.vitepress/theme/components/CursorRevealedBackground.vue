<template>
  <div
    class="cursor-revealed-background"
    :class="{ 'is-ready': isReady }"
    :style="{
      '--cursor-x': `${cursorX}px`,
      '--cursor-y': `${cursorY}px`,
    }"
    aria-hidden="true"
  ></div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";

const cursorX = ref(0);
const cursorY = ref(0);
const isReady = ref(false);
let supportsPointerReveal = false;
let animationFrameId = null;
let pendingCursorX = 0;
let pendingCursorY = 0;

const updateCursorPosition = (event) => {
  pendingCursorX = event.clientX;
  pendingCursorY = event.clientY;

  if (animationFrameId !== null) {
    return;
  }

  animationFrameId = window.requestAnimationFrame(() => {
    cursorX.value = pendingCursorX;
    cursorY.value = pendingCursorY;
    animationFrameId = null;
  });
};

onMounted(async () => {
  cursorX.value = 0;
  cursorY.value = 0;
  supportsPointerReveal = window.matchMedia(
    "(hover: hover) and (pointer: fine)",
  ).matches;

  if (supportsPointerReveal) {
    window.addEventListener("pointermove", updateCursorPosition, {
      passive: true,
    });
  }

  await nextTick();
  isReady.value = true;
});

onBeforeUnmount(() => {
  window.removeEventListener("pointermove", updateCursorPosition);

  if (animationFrameId !== null) {
    window.cancelAnimationFrame(animationFrameId);
  }
});
</script>

<style scoped>
.cursor-revealed-background {
  position: fixed;
  z-index: 0;
  inset: 0;
  mask-image: radial-gradient(
    circle 144px at var(--cursor-x) var(--cursor-y),
    #000 0,
    #000 70%,
    transparent 100%
  );
  opacity: 0.1;
  pointer-events: none;
}

.cursor-revealed-background.is-ready {
  background: url("../../../public/favicon.svg") center / 280px no-repeat;
}

html.dark .cursor-revealed-background.is-ready {
  background-image: url("../../../public/favicon_white.svg");
}

@media (hover: none), (pointer: coarse) {
  .cursor-revealed-background {
    display: none;
  }
}
</style>
