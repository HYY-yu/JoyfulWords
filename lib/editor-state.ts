import { useRef, useCallback, useState, useMemo } from 'react'

/**
 * 编辑器状态管理 Hook
 * 使用 ref 避免不必要的重渲染，提供高性能的状态访问
 *
 * @module editor-state
 *
 * @example
 * ```tsx
 * function ArticleEditor() {
 *   const editorState = useEditorState()
 *
 *   const handleChange = (text: string, html: string) => {
 *     editorState.setContent({ html, text })
 *   }
 *
 *   return (
 *     <TiptapEditor
 *       content={editorState.content.html}
 *       onChange={handleChange}
 *     />
 *   )
 * }
 * ```
 */

/**
 * 编辑器内容接口
 */
export interface EditorContent {
  html: string              // HTML 格式（主要）
  text: string              // 纯文本（字数统计）
}

/**
 * 编辑器元数据接口
 */
export interface EditorMetadata {
  isDirty: boolean          // 是否有未保存的更改
  lastSaved: string | null  // 最后保存时间
  wordCount: number         // 字数统计
}

/**
 * 编辑器状态接口
 */
export interface EditorState {
  content: EditorContent
  metadata: EditorMetadata

  // 操作方法
  setContent: (content: Partial<EditorContent>) => void
  setDirty: (dirty: boolean) => void
  markSaved: () => void
  reset: () => void
  getSnapshot: () => { content: EditorContent; metadata: EditorMetadata }
}

/**
 * 编辑器状态管理 Hook
 *
 * @param initialHTML - 初始 HTML 内容，默认为空字符串
 * @returns EditorState 对象
 *
 * @example
 * ```tsx
 * const editorState = useEditorState('<p>Initial content</p>')
 *
 * // 访问内容
 * console.log(editorState.content.html)      // HTML
 * console.log(editorState.content.text)      // 纯文本
 *
 * // 访问元数据
 * console.log(editorState.metadata.isDirty)     // 是否有未保存的更改
 * console.log(editorState.metadata.wordCount)   // 字数
 *
 * // 更新内容
 * editorState.setContent({
 *   html: '<p>New content</p>',
 *   text: 'New content'
 * })
 *
 * // 标记为已保存
 * editorState.markSaved()
 *
 * // 重置状态
 * editorState.reset()
 * ```
 */
export function useEditorState(initialHTML: string = ''): EditorState {
  // 使用 ref 存储状态，避免频繁重渲染
  const contentRef = useRef<EditorContent>({
    html: initialHTML,
    text: ''
  })

  const metadataRef = useRef<EditorMetadata>({
    isDirty: false,
    lastSaved: null,
    wordCount: 0
  })

  // 强制重渲染的 state（仅用于触发 UI 更新）
  const [, setTick] = useState(0)

  const triggerUpdate = useCallback(() => {
    setTick(tick => tick + 1)
  }, [])

  /**
   * 设置内容
   * @param newContent - 部分或全部内容
   */
  const setContent = useCallback((newContent: Partial<EditorContent>) => {
    const prevContent = contentRef.current

    // 合并新旧内容
    contentRef.current = {
      ...prevContent,
      ...newContent
    }

    // 更新元数据
    const newText = newContent.text ?? prevContent.text
    metadataRef.current = {
      ...metadataRef.current,
      isDirty: true,
      wordCount: newText.length
    }

    triggerUpdate()
  }, [triggerUpdate])

  /**
   * 设置脏状态
   * @param dirty - 是否为脏状态
   */
  const setDirty = useCallback((dirty: boolean) => {
    metadataRef.current.isDirty = dirty
    triggerUpdate()
  }, [triggerUpdate])

  /**
   * 标记为已保存
   */
  const markSaved = useCallback(() => {
    metadataRef.current.isDirty = false
    metadataRef.current.lastSaved = new Date().toISOString()
    triggerUpdate()
  }, [triggerUpdate])

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    contentRef.current = {
      html: '',
      text: ''
    }
    metadataRef.current = {
      isDirty: false,
      lastSaved: null,
      wordCount: 0
    }
    triggerUpdate()
  }, [triggerUpdate])

  /**
   * 获取快照（用于保存到 localStorage）
   */
  const getSnapshot = useCallback(() => ({
    content: { ...contentRef.current },
    metadata: { ...metadataRef.current }
  }), [])

  // 使用 useMemo 稳定返回对象引用，避免无限循环
  return useMemo(() => ({
    // 使用 Object.freeze 防止外部直接修改 ref 内容
    // 通过 getter 函数访问最新值
    get content() {
      return contentRef.current
    },
    get metadata() {
      return metadataRef.current
    },
    setContent,
    setDirty,
    markSaved,
    reset,
    getSnapshot
  } as EditorState), [setContent, setDirty, markSaved, reset, getSnapshot])
}
