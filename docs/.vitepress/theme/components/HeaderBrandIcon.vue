<template>
  <span class="header-brand-icon" aria-hidden="true"></span>
</template>

<style scoped>
.header-brand-icon {
  width: 24px;
  height: 24px;
  background: url("../../../public/favicon.svg") center / contain no-repeat;
  flex: 0 0 auto;
}

html.dark .header-brand-icon {
  background-image: url("../../../public/favicon_white.svg");
}
</style>
