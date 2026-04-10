import { useState, useCallback } from 'react'
import type { Cast, PostType, Platform } from '@/lib/types'
import type { WritingStyle } from '@/lib/ai/prompts'

interface UseGenerateOptions {
  cast: Cast
  platforms: Platform[]
}

interface GenerateState {
  text: string
  texts: string[]
  isLoading: boolean
  error: string | null
}

export function useGenerate({ cast, platforms }: UseGenerateOptions) {
  const [state, setState] = useState<GenerateState>({
    text: '', texts: [], isLoading: false, error: null,
  })

  const generate = useCallback(async (
    postType: PostType,
    customNote?: string,
    writingStyle?: WritingStyle,
  ) => {
    setState(s => ({ ...s, isLoading: true, error: null, texts: [] }))
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cast, postType, platforms, customNote, writingStyle }),
      })
      const data = await res.json()
      if (!res.ok) {
        setState(s => ({ ...s, isLoading: false, error: data.error ?? '生成に失敗しました' }))
        return null
      }
      setState(s => ({ ...s, isLoading: false, text: data.text }))
      return data.text as string
    } catch (err) {
      const msg = err instanceof Error ? err.message : '通信エラーが発生しました'
      setState(s => ({ ...s, isLoading: false, error: msg }))
      return null
    }
  }, [cast, platforms])

  const generateVariations = useCallback(async (
    postType: PostType,
    customNote?: string,
  ) => {
    setState(s => ({ ...s, isLoading: true, error: null, text: '' }))
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cast, postType, platforms, customNote, variations: true }),
      })
      const data = await res.json()
      if (!res.ok) {
        setState(s => ({ ...s, isLoading: false, error: data.error ?? '生成に失敗しました' }))
        return null
      }
      setState(s => ({ ...s, isLoading: false, texts: data.texts }))
      return data.texts as string[]
    } catch (err) {
      const msg = err instanceof Error ? err.message : '通信エラーが発生しました'
      setState(s => ({ ...s, isLoading: false, error: msg }))
      return null
    }
  }, [cast, platforms])

  const clear = useCallback(() => {
    setState({ text: '', texts: [], isLoading: false, error: null })
  }, [])

  return { ...state, generate, generateVariations, clear }
}
