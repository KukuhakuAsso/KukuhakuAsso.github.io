<template></template>

<style>
@keyframes home-float-in {
  from {
    opacity: 0;
    transform: translateY(24px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.VPHomeHero .name,
.VPHomeHero .text,
.VPHomeHero .tagline,
.VPHomeHero .actions,
.VPFeature {
  animation: home-float-in 700ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.VPHomeHero .name {
  animation-delay: 80ms;
}

.VPHomeHero .text {
  animation-delay: 180ms;
}

.VPHomeHero .tagline {
  animation-delay: 280ms;
}

.VPHomeHero .actions {
  animation-delay: 380ms;
}

.VPFeatures .VPFeature:nth-child(1) {
  animation-delay: 480ms;
}

.VPFeatures .VPFeature:nth-child(2) {
  animation-delay: 580ms;
}

.VPFeatures .VPFeature:nth-child(3) {
  animation-delay: 680ms;
}

@media (prefers-reduced-motion: reduce) {
  .VPHomeHero .name,
  .VPHomeHero .text,
  .VPHomeHero .tagline,
  .VPHomeHero .actions,
  .VPFeature {
    animation: none;
  }
}
</style>
