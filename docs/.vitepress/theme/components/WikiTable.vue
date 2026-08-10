<!--
  WikiTable.vue —— 维基风格表格组件（双模式）

  【模式一】:wiki prop 解析 MediaWiki 管道表格语法（推荐用于数据表/日历表）
    <WikiTable :wiki="`
    {|
    ! 表头A | 表头B | 表头C
    |-
    | 单元格1 | 单元格2 | 单元格3
    |-
    | {青:x} | ...
    |}
    `" />

  【模式二】插槽模式（富 HTML 表格，如含图片/链接/彩色徽章）
    <WikiTable>
      <tr><td>...</td></tr>
    </WikiTable>

  语法（wiki 模式）：
    {|                表格开始
    ! 表头           表头行单元格（<th>），可多格
    |-                行开始（可带 style="..." 行内样式）
    | 单元格          单元格行（<td>），一行可写多个
    |}                表格结束
  彩色单元格（对应 wiki 模板 {{ARG日历/蓝|字符}}，ARG 日历表用）：
    {蓝}    {蓝:x}    深蓝底白字
    {青:x}            青底深蓝字
    {紫:x}            紫底白字
    {白:x}            白底深蓝字

  ⚠ 注意：wiki 内容中不要出现双引号 "（如 {| style="..." 会破坏 :wiki 模板字面量），
  表格样式请放在 <WikiTable style="..."> 属性上。
-->
<script setup>
import { computed } from "vue";

const props = defineProps({
  wiki: { type: String, default: "" },
  style: { type: [String, Object], default: "" },
  cls: { type: String, default: "" },
});

const CAL_COLORS = {
  蓝: { bg: "#000087", fg: "#ffffff" },
  青: { bg: "#AAFFFF", fg: "#000087" },
  紫: { bg: "#870087", fg: "#ffffff" },
  白: { bg: "#ffffff", fg: "#000087" },
};

function parseWiki(text) {
  const table = { style: props.style, rows: [] };
  let curRow = null;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    // 表格开始
    if (line.startsWith("{|")) {
      continue;
    }
    // 表格结束
    if (line === "|}") break;
    // 行开始
    if (line.startsWith("|-")) {
      curRow = { style: "", cells: [] };
      const m = line.match(/style\s*=\s*"([^"]*)"/);
      if (m) curRow.style = m[1];
      table.rows.push(curRow);
      continue;
    }
    // 单元格行（可能一行多个；! 开头为表头单元格 <th>）
    if ((line.startsWith("|") || line.startsWith("!")) && !line.startsWith("||")) {
      if (!curRow) {
        curRow = { style: "", cells: [] };
        table.rows.push(curRow);
      }
      const isHead = line.startsWith("!");
      const parts = line.replace(/^[|!]/, "").split("|");
      for (const part of parts) {
        curRow.cells.push({ ...parseCell(part.trim()), head: isHead });
      }
    }
  }
  return table;
}

function parseCell(s) {
  // {蓝} {蓝:x} {青:x} {紫:x} {白:x}
  const m = s.match(/^\{([^:}]+)(?::(.+))?\}$/);
  if (m && CAL_COLORS[m[1]]) {
    const c = CAL_COLORS[m[1]];
    return {
      text: m[2] ?? "",
      style: `width:30px;height:30px;text-align:center;vertical-align:middle;line-height:30px;padding:0;background-color:${c.bg};color:${c.fg}`,
    };
  }
  return { text: s, style: "" };
}

const parsed = computed(() => parseWiki(props.wiki));
const useWiki = computed(() => props.wiki.trim().length > 0);
</script>

<template>
  <table class="wikitable" :class="cls" :style="style">
    <tbody>
      <template v-if="useWiki">
        <tr v-for="(row, ri) in parsed.rows" :key="ri" :style="row.style">
          <component
            :is="cell.head ? 'th' : 'td'"
            v-for="(cell, ci) in row.cells"
            :key="ci"
            :style="cell.style"
          >
            {{ cell.text }}
          </component>
        </tr>
      </template>
      <!-- 插槽模式：富 HTML 表格 -->
      <slot v-else />
    </tbody>
  </table>
</template>
