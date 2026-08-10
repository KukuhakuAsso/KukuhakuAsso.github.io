<!--
  cb.vue —— 维基转载文章的小字注释（对应 wiki 中 <span style="color:#bc9567;font-size:smaller">）

  用法：<cb>（注释内容，支持 markdown 链接与行内 HTML）</cb>
-->
<script setup>
// 无逻辑：仅渲染小字棕色注释
</script>

<template>
  <span style="color:#bc9567;font-size:smaller"><slot /></span>
</template>
