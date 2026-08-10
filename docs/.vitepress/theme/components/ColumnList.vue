<!--
  ColumnList.vue —— 分栏列表组件（对应 wiki 模板 {{Column}}）

  用法（wiki 写法）：每行以 * 开头为一个列表项，支持 [文字](链接) markdown 链接
    <ColumnList 列宽="200px" :wiki="`
    * [@玩家musicraft](https://space.bilibili.com/11439687)
    * @夜鸦kora
    * 竹山云海
    `" />

  参数（对应 wiki 模板 {{Column|列数|列宽|间距|分隔线|class|style|1=...}}）：
    :wiki="`...`"    主内容（{{{1|}}}），每行 * 开头 = 一个 <li>
    列数="3"         固定分列数 → column-count
    列宽="200px"     单列宽度   → column-width
    间距="1em"       列间距     → column-gap
    分隔线="1px solid #ccc"  列间分割线 → column-rule
    cls="..."        为 <ul> 补充 class
    style="..."      为 <ul> 补充 style

  ⚠ 注意：wiki 内容中不要出现双引号 "（会破坏 :wiki 模板字面量），
  带双引号 style 的内容请放组件属性上，或使用插槽模式/保留 HTML。
-->
<script setup>
import { computed } from "vue";

const props = defineProps({
  // {{{1|}}} 主内容：wiki 写法，每行 * 开头为一个列表项
  wiki: { type: String, default: "" },
  cls: { type: String, default: "" },
  style: { type: [String, Object], default: "" },
  // === 对应 wiki 模板 {{Column}} 的参数 ===
  列数: { type: [String, Number], default: "" }, // column-count
  列宽: { type: String, default: "" }, // column-width
  间距: { type: String, default: "" }, // column-gap
  分隔线: { type: String, default: "" }, // column-rule
});

const items = computed(() =>
  props.wiki
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("*"))
    .map((l) => l.replace(/^\*\s?/, ""))
);

// 行内解析：[文字](链接) → <a href="链接">文字</a>；其余内容（含 HTML）原样保留
const linkRe = /\[([^\]\[]+)\]\(([^()\s]+)\)/g;
function renderInline(s) {
  return s.replace(linkRe, '<a href="$2">$1</a>');
}

const colStyle = computed(() => {
  const s = { "margin-top": "0.3em" };
  if (props.列数 !== "") s["column-count"] = props.列数;
  if (props.列宽 !== "") s["column-width"] = props.列宽;
  if (props.间距 !== "") s["column-gap"] = props.间距;
  if (props.分隔线 !== "") s["column-rule"] = props.分隔线;
  return s;
});
</script>

<template>
  <ul class="col-list" :class="cls" :style="[colStyle, style]">
    <li v-for="(item, i) in items" :key="i" v-html="renderInline(item)"></li>
  </ul>
</template>
