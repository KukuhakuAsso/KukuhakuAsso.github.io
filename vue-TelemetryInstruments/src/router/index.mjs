import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import PuzzleLoader from '../views/puzzleLoader.vue'  // 你的组件

const routes = [
  { path: '/', component: Home },
  {
    path: '/puzzle/:level',
    component: PuzzleLoader,
    props: (route) => {
      const level = route.params.level
      // 定义所有关卡的标题和内容
      const puzzleMap = {
        1: {
          title: '一切的开始',
          content: '<p>欢迎，侦探。请输入起始指令来获得第一条线索。</p>'
        },
        2: {
          title: '谜题一',
          content: '<p>你打开 TI01，看到一幅星图……<br>（此处替换为你的谜题描述）</p>'
        },
        3: {
          title: '谜题二',
          content: '<p>TI02 中夹着一张旧报纸……</p>'
        },
        4: {
          title: '谜题三',
          content: '<p>TI03 显示了一段摩斯码……</p>'
        },
        5: {
          title: '谜题四',
          content: '<p>TI04 是一串化学元素符号……</p>'
        },
        6: {
          title: '谜题五',
          content: '<p>TI05 是一张褪色的照片……</p>'
        },
        7: {
          title: '最终谜题',
          content: '<p>你已经接近真相。输入最后的答案，揭开一切。</p>'
        }
      }
      return {
        level: level,
        title: puzzleMap[level]?.title || '未知关卡',
        content: puzzleMap[level]?.content || '<p>关卡数据缺失</p>'
      }
    }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
