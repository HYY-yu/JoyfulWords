import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { mergeAttributes } from "@tiptap/react";

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
        default: 'left',
        parseHTML: element => element.getAttribute('data-align') || 'left',
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
      container.setAttribute('data-align', node.attrs.align || 'left')

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

          container.setAttribute('data-align', updatedNode.attrs.align || 'left')

          return true
        },
      }
    }
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { class: 'image-container', 'data-align': HTMLAttributes.align || 'left' },
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