import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { mergeAttributes, Node } from "@tiptap/react";
import { Plugin, PluginKey } from '@tiptap/pm/state';

// Create an Underline extension that supports markdown serialization
export const UnderlineWithMarkdown = Underline.extend({
  addStorage() {
    return {
      markdown: {
        serialize: {
          open: '__',
          close: '__',
        },
        parse: {
          // The markdown parsing for underline is handled by markdown-it-ins
          // This would require configuring markdown-it with the ins plugin
        }
      }
    }
  }
});

// Custom Image extension with resize and alignment support
export const CustomImage = Image.extend({
  name: 'customImage',

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: element => element.getAttribute('width'),
        renderHTML: attributes => {
          if (!attributes.width) {
            return {}
          }
          return { width: attributes.width }
        },
      },
      height: {
        default: null,
        parseHTML: element => element.getAttribute('height'),
        renderHTML: attributes => {
          if (!attributes.height) {
            return {}
          }
          return { height: attributes.height }
        },
      },
      align: {
        default: 'center',
        parseHTML: element => element.getAttribute('data-align') || 'center',
        renderHTML: attributes => {
          return { 'data-align': attributes.align }
        },
      },
    }
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const container = document.createElement('div')
      container.className = 'image-container'
      container.setAttribute('data-align', node.attrs.align || 'center')

      const img = document.createElement('img')
      img.src = node.attrs.src
      img.alt = node.attrs.alt || ''
      img.className = 'tiptap-image'

      if (node.attrs.width) {
        img.style.width = typeof node.attrs.width === 'number' ? `${node.attrs.width}px` : node.attrs.width
      }
      if (node.attrs.height) {
        img.style.height = typeof node.attrs.height === 'number' ? `${node.attrs.height}px` : node.attrs.height
      }

      // Make image selectable
      container.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()

        if (typeof getPos === 'function') {
          const pos = getPos()
          if (typeof pos === 'number') {
            editor.commands.setNodeSelection(pos)
          }
        }
      })

      container.appendChild(img)

      return {
        dom: container,
        contentDOM: null,
        update: (updatedNode) => {
          if (updatedNode.type.name !== this.name) {
            return false
          }

          img.src = updatedNode.attrs.src
          img.alt = updatedNode.attrs.alt || ''

          if (updatedNode.attrs.width) {
            img.style.width = typeof updatedNode.attrs.width === 'number' ? `${updatedNode.attrs.width}px` : updatedNode.attrs.width
          } else {
            img.style.width = ''
          }

          if (updatedNode.attrs.height) {
            img.style.height = typeof updatedNode.attrs.height === 'number' ? `${updatedNode.attrs.height}px` : updatedNode.attrs.height
          } else {
            img.style.height = ''
          }

          container.setAttribute('data-align', updatedNode.attrs.align || 'center')

          return true
        },
      }
    }
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { class: 'image-container', 'data-align': HTMLAttributes.align || 'center' },
      ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
    ]
  },
});

// Highlight extension with multi-color support
export const CustomHighlight = Highlight.configure({
  multicolor: true,
});

// TextAlignment extension for paragraphs and headings
export const CustomTextAlign = TextAlign.configure({
  types: ['heading', 'paragraph'],
  alignments: ['left', 'center', 'right', 'justify'],
  defaultAlignment: 'left',
});

// 自定义链接扩展，支持自动退出链接
export const CustomLink = Link.extend({
  name: 'link',

  addKeyboardShortcuts() {
    return {
      // 空格键：退出链接状态并插入空格
      ' ': ({ editor }) => {
        if (editor.isActive('link')) {
          // 直接调用命令来清空 storedMarks 并插入内容
          return insertContentWithoutMarks(editor, ' ');
        }
        return false;
      },

      // 英文标点符号
      ',': ({ editor }) => exitLinkAndInsert(editor, ','),
      '.': ({ editor }) => exitLinkAndInsert(editor, '.'),
      '?': ({ editor }) => exitLinkAndInsert(editor, '?'),
      '!': ({ editor }) => exitLinkAndInsert(editor, '!'),
      ';': ({ editor }) => exitLinkAndInsert(editor, ';'),
      ':': ({ editor }) => exitLinkAndInsert(editor, ':'),

      // 中文标点符号
      '、': ({ editor }) => exitLinkAndInsert(editor, '、'),
      '，': ({ editor }) => exitLinkAndInsert(editor, '，'),
      '。': ({ editor }) => exitLinkAndInsert(editor, '。'),
      '？': ({ editor }) => exitLinkAndInsert(editor, '？'),
      '！': ({ editor }) => exitLinkAndInsert(editor, '！'),
    };
  },
});

// 辅助函数：退出链接并插入字符
function exitLinkAndInsert(editor: any, char: string) {
  if (editor.isActive('link')) {
    return insertContentWithoutMarks(editor, char);
  }
  return false;
}

// 自定义命令：清空 storedMarks 并插入内容，阻止 mark 延伸
function insertContentWithoutMarks(editor: any, content: string) {
  const { state, view } = editor;
  const { tr } = state;

  // 清空 storedMarks，阻止 mark 延伸到新内容
  tr.setStoredMarks([]);

  // 插入文本
  tr.insertText(content, state.selection.from);

  // 派发 transaction
  view.dispatch(tr);

  return true;
}

// ============================================================
// AIPendingBlock - AI 异步编辑等待中的占位节点
// ============================================================
// 特性：
// - atom: true  → 用户无法进入节点内部，也无法逐字删除
// - contenteditable=false → 文本不可编辑
// - 蓝色背景，展示旋转 loading 图标
// - 存储cut_text和exec_id属性供后续通过文本匹配定位和替换
// - 可点击，点击后调用 window.handleAIPendingBlockClick(exec_id)
//
export const AIPendingBlock = Node.create({
  name: 'aiPendingBlock',

  group: 'inline',
  inline: true,
  atom: true,
  draggable: false,
  selectable: true, // 允许选中以便点击

  addAttributes() {
    return {
      text: {
        default: '',
      },
      exec_id: {
        default: null,
      },
    }
  },

  renderHTML({ node }) {
    return [
      'div',
      {
        class: 'ai-pending-block',
        'data-ai-pending': 'true',
        'data-text': node.attrs.text,
        'data-exec-id': node.attrs.exec_id || '',
        contenteditable: 'false',
      },
      [
        'span',
        { class: 'ai-pending-spinner', 'aria-hidden': 'true' },
      ],
      [
        'span',
        { class: 'ai-pending-text' },
        node.attrs.text,
      ],
    ]
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-ai-pending="true"]',
        getAttrs: (element) => ({
          text: (element as HTMLElement).getAttribute('data-text') || '',
          exec_id: (element as HTMLElement).getAttribute('data-exec-id') || null,
        }),
      },
    ]
  },

  addNodeView() {
    return ({ node }) => {
      const wrapper = document.createElement('div')
      wrapper.className = 'ai-pending-block'
      wrapper.setAttribute('data-ai-pending', 'true')
      wrapper.setAttribute('data-text', node.attrs.text)
      wrapper.setAttribute('data-exec-id', node.attrs.exec_id || '')
      wrapper.style.cursor = 'pointer' // 显示可点击

      // Loading spinner
      const spinner = document.createElement('span')
      spinner.className = 'ai-pending-spinner'
      spinner.setAttribute('aria-hidden', 'true')

      // Text content
      const textSpan = document.createElement('span')
      textSpan.className = 'ai-pending-text'
      textSpan.textContent = node.attrs.text

      wrapper.appendChild(spinner)
      wrapper.appendChild(textSpan)

      // 点击事件：通过全局函数调用
      wrapper.addEventListener('click', (e) => {
        console.log('[AIPendingBlock] Native click event fired', {
          execId: node.attrs.exec_id,
          event: e,
          windowHandler: typeof (window as any).handleAIPendingBlockClick
        })

        e.preventDefault()
        e.stopPropagation()

        const execId = node.attrs.exec_id
        if (execId) {
          console.log('[AIPendingBlock] Calling global handler, exec_id:', execId)
          // 调用全局函数
          if (typeof (window as any).handleAIPendingBlockClick === 'function') {
            (window as any).handleAIPendingBlockClick(execId)
          } else {
            console.error('[AIPendingBlock] handleAIPendingBlockClick not found on window')
          }
        } else {
          console.error('[AIPendingBlock] No exec_id on node')
        }
      })

      return {
        dom: wrapper,
        contentDOM: null,
        update: (updatedNode) => {
          if (updatedNode.type.name !== 'aiPendingBlock') return false
          textSpan.textContent = updatedNode.attrs.text
          wrapper.setAttribute('data-text', updatedNode.attrs.text)
          wrapper.setAttribute('data-exec-id', updatedNode.attrs.exec_id || '')
          return true
        },
      }
    }
  },

})
