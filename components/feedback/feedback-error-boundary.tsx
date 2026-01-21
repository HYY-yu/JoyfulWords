'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class FeedbackErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('Feedback button error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return null // 静默失败，不显示反馈按钮
    }

    return this.props.children
  }
}
