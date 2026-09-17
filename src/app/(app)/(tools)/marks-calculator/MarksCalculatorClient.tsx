'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, Clipboard, CheckCircle, AlertCircle, 
  RotateCcw, Trophy, ArrowRight, BookOpen, Calculator, HelpCircle, 
  RefreshCw
} from 'lucide-react'
import { CalculatorResult, QuestionResult } from '@/utils/marks/scoring'

// Dynamic loader for PDF.js CDN
interface PdfTextItem {
  str: string
}

interface PdfPage {
  getTextContent: () => Promise<{ items: PdfTextItem[] }>
}

interface PdfDocument {
  numPages: number
  getPage: (pageNum: number) => Promise<PdfPage>
}

interface PdfJsLib {
  GlobalWorkerOptions: { workerSrc: string }
  getDocument: (params: { data: ArrayBuffer }) => { promise: Promise<PdfDocument> }
}

async function loadPdfJS(): Promise<PdfJsLib> {
  if (typeof window === 'undefined') throw new Error('Window is undefined')
  const win = window as unknown as { pdfjsLib?: PdfJsLib }
  if (win.pdfjsLib) return win.pdfjsLib

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.min.js'
    script.onload = () => {
      const pdfjsLib = (window as unknown as { pdfjsLib: PdfJsLib }).pdfjsLib
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js'
      resolve(pdfjsLib)
    }
    script.onerror = () => reject(new Error('Failed to load PDF parsing library. Check your internet connection or use Copy-Paste mode.'))
    document.body.appendChild(script)
  })
}

interface LeaderboardEntry {
  nickname: string
  exam_type: string
  math_set: string | null
  phy_chem_set: string | null
  math_score: number | null
  phy_chem_score: number
  total_score: number
  created_at: string
}

export default function MarksCalculatorClient() {
  // Mode tabs
  const [activeTab, setActiveTab] = useState<'pdf' | 'paste' | 'leaderboard'>('pdf')
  
  // Settings
  const [examType, setExamType] = useState<'both' | 'physics_chemistry'>('both')
  const [mathSet, setMathSet] = useState<'A' | 'B' | 'C' | 'D'>('A')
  const [phyChemSet, setPhyChemSet] = useState<'A' | 'B' | 'C' | 'D'>('A')

  // PDF uploads
  const [mathFile, setMathFile] = useState<File | null>(null)
  const [phyChemFile, setPhyChemFile] = useState<File | null>(null)
  const [isDraggingMath, setIsDraggingMath] = useState(false)
  const [isDraggingPhyChem, setIsDraggingPhyChem] = useState(false)
  const mathFileInputRef = useRef<HTMLInputElement>(null)
  const phyChemFileInputRef = useRef<HTMLInputElement>(null)

  // Pasted text inputs
  const [mathPaste, setMathPaste] = useState('')
  const [phyChemPaste, setPhyChemPaste] = useState('')

  // Parsing & Processing State
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState('')
  const [processingProgress, setProcessingProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Results State
  const [results, setResults] = useState<CalculatorResult | null>(null)
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionResult | null>(null)
  const [activeResultsSubject, setActiveResultsSubject] = useState<'Mathematics' | 'Physics/Chemistry'>('Physics/Chemistry')
  const questionDetailsRef = useRef<HTMLDivElement>(null)

  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [leaderboardFilter, setLeaderboardFilter] = useState<'all' | 'both' | 'physics_chemistry'>('all')
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [nickname, setNickname] = useState('')
  const [appNumber, setAppNumber] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async (filterOverride?: 'all' | 'both' | 'physics_chemistry') => {
    setIsLoadingLeaderboard(true)
    try {
      const activeFilter = filterOverride || leaderboardFilter
      const url = activeFilter === 'all' 
        ? '/api/tools/marks-calculator/leaderboard'
        : `/api/tools/marks-calculator/leaderboard?exam_type=${activeFilter}`
      
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setLeaderboard(data.leaderboard || [])
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err)
    } finally {
      setIsLoadingLeaderboard(false)
    }
  }, [leaderboardFilter])

  // Load leaderboard entries on tab change
  useEffect(() => {
    if (activeTab === 'leaderboard' || results) {
      fetchLeaderboard()
    }
  }, [activeTab, results, fetchLeaderboard])

  // Parse pasted responses
  const parsePasteText = (text: string, subject: 'Mathematics' | 'Physics/Chemistry') => {
    const totalQuestions = subject === 'Mathematics' ? 75 : 80
    const lines = text.split('\n')
    const responses: (string | string[])[] = new Array(totalQuestions).fill('-')
    let parsedCount = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const parts = line.split(/\t|\s{2,}/).map(p => p.trim()).filter(Boolean)
      if (parts.length < 4) continue

      const subjectPart = parts[0]
      const setNum = parts[1]
      const qNumStr = parts[2]
      const response = parts[3]

      const cleanSubject = subjectPart.toLowerCase().replace(/[^a-z]/g, '')
      if (subject === 'Mathematics' && !cleanSubject.includes('math')) continue
      if (subject === 'Physics/Chemistry' && (!cleanSubject.includes('phys') && !cleanSubject.includes('chem'))) continue

      if (!setNum.match(/^\d+$/) || !qNumStr.match(/^Q\d+$/i) || !response.match(/^[A-D](?:,[A-D])*$|^-$/i)) continue

      const qNum = parseInt(qNumStr.replace(/Q/i, '')) - 1
      if (qNum < 0 || qNum >= totalQuestions) continue

      responses[qNum] = response === '-' ? '-' : response.toUpperCase().split(',').map(s => s.trim())
      parsedCount++
    }

    return { responses, parsedCount }
  }

  // Parse PDF file text content
  const parsePdfFile = async (
    file: File,
    subject: 'Mathematics' | 'Physics/Chemistry',
    onProgress: (step: string, percent: number) => void
  ) => {
    const totalQuestions = subject === 'Mathematics' ? 75 : 80
    
    onProgress(`Loading PDF engine for ${subject}...`, 15)
    const pdfjsLib = await loadPdfJS()

    onProgress(`Reading file bytes for ${subject}...`, 35)
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    const responses: (string | string[])[] = new Array(totalQuestions).fill('-')
    let parsedCount = 0

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      onProgress(`Scanning page ${pageNum}/${pdf.numPages} for ${subject}...`, 40 + Math.floor((pageNum / pdf.numPages) * 45))
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      const textItems = textContent.items.map((item) => item.str.trim()).filter(Boolean)

      for (let i = 0; i < textItems.length; i++) {
        const item = textItems[i]
        if (item.match(/^Q\d+$/i)) {
          const questionNumber = parseInt(item.replace(/Q/i, ''))
          if (questionNumber < 1 || questionNumber > totalQuestions) continue

          let response: string | null = null
          for (let j = i + 1; j < Math.min(textItems.length, i + 5); j++) {
            const nextItem = textItems[j]
            if (nextItem.match(/^[A-D](?:,[A-D])*$|^-$/i)) {
              response = nextItem
              break
            }
          }

          if (response !== null) {
            responses[questionNumber - 1] = response === '-' ? '-' : response.toUpperCase().split(',').map(s => s.trim())
            parsedCount++
          }
        }
      }
    }

    if (parsedCount === 0) {
      throw new Error(`No answer responses parsed for ${subject}. Please ensure your PDF contains selectable text (not scanned images).`)
    }

    return { responses }
  }

  // Calculate marks triggers API
  const handleCalculate = async () => {
    setIsProcessing(true)
    setProcessingProgress(0)
    setErrorMsg(null)

    try {
      let finalMathResponses = new Array(75).fill('-')
      let finalPhyChemResponses = new Array(80).fill('-')

      if (activeTab === 'pdf') {
        if (examType === 'both') {
          if (!mathFile || !phyChemFile) {
            throw new Error('Please select both Mathematics and Physics/Chemistry response sheets.')
          }
          
          const mathParsed = await parsePdfFile(mathFile, 'Mathematics', (step, pct) => {
            setProcessingStep(step)
            setProcessingProgress(pct / 2)
          })
          finalMathResponses = mathParsed.responses

          const phyChemParsed = await parsePdfFile(phyChemFile, 'Physics/Chemistry', (step, pct) => {
            setProcessingStep(step)
            setProcessingProgress(50 + pct / 2)
          })
          finalPhyChemResponses = phyChemParsed.responses
        } else {
          if (!phyChemFile) {
            throw new Error('Please select your Physics/Chemistry response sheet.')
          }
          const phyChemParsed = await parsePdfFile(phyChemFile, 'Physics/Chemistry', (step, pct) => {
            setProcessingStep(step)
            setProcessingProgress(pct)
          })
          finalPhyChemResponses = phyChemParsed.responses
        }
      } else {
        if (examType === 'both') {
          if (!mathPaste.trim() || !phyChemPaste.trim()) {
            throw new Error('Please paste your Mathematics and Physics/Chemistry response tables.')
          }
          const mathParsed = parsePasteText(mathPaste, 'Mathematics')
          const phyChemParsed = parsePasteText(phyChemPaste, 'Physics/Chemistry')

          if (mathParsed.parsedCount === 0) {
            throw new Error('No valid Mathematics responses parsed. Check formatting.')
          }
          if (phyChemParsed.parsedCount === 0) {
            throw new Error('No valid Physics/Chemistry responses parsed. Check formatting.')
          }

          finalMathResponses = mathParsed.responses
          finalPhyChemResponses = phyChemParsed.responses
        } else {
          if (!phyChemPaste.trim()) {
            throw new Error('Please paste your Physics/Chemistry response table.')
          }
          const phyChemParsed = parsePasteText(phyChemPaste, 'Physics/Chemistry')

          if (phyChemParsed.parsedCount === 0) {
            throw new Error('No valid Physics/Chemistry responses parsed. Check formatting.')
          }

          finalPhyChemResponses = phyChemParsed.responses
        }
      }

      setProcessingStep('Evaluating answers & scoring...')
      setProcessingProgress(95)

      const response = await fetch('/api/tools/marks-calculator/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examType,
          mathSet: examType === 'both' ? mathSet : null,
          phyChemSet,
          mathResponses: examType === 'both' ? finalMathResponses : null,
          phyChemResponses: finalPhyChemResponses,
        })
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Server failed to calculate marks.')
      }

      const resData: CalculatorResult = await response.json()
      setResults(resData)
      setActiveResultsSubject(examType === 'both' ? 'Mathematics' : 'Physics/Chemistry')
      setProcessingProgress(100)
      
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('Error grading response:', err)
      setErrorMsg(message || 'An unexpected error occurred.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle score submission to leaderboard
  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim()) {
      setSubmitError('Please enter a screen nickname.')
      return
    }
    if (!appNumber.trim()) {
      setSubmitError('Please enter your application number (hashed for anonymity).')
      return
    }
    if (!results) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const isMathIncluded = examType === 'both' && results.Mathematics
      const pcResult = results['Physics/Chemistry']
      if (!pcResult) throw new Error('Missing Physics/Chemistry results')

      const payload = {
        nickname: nickname.trim(),
        applicationNumber: appNumber.trim(),
        examType,
        mathSet: isMathIncluded ? mathSet : null,
        phyChemSet,
        mathResponses: isMathIncluded ? results.Mathematics?.details.map(d => d.user) : null,
        phyChemResponses: pcResult.details.map(d => d.user),
      }

      const res = await fetch('/api/tools/marks-calculator/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit score.')
      }

      setSubmitSuccess(true)
      fetchLeaderboard()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('Submission failed:', err)
      setSubmitError(message || 'Server error occurred during submission.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle question click in matrix (auto-scrolls on small devices)
  const handleSelectQuestion = (qResult: QuestionResult) => {
    setSelectedQuestion(qResult)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setTimeout(() => {
        questionDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
    }
  }

  // Clear results state
  const handleReset = () => {
    setResults(null)
    setMathFile(null)
    setPhyChemFile(null)
    setMathPaste('')
    setPhyChemPaste('')
    setErrorMsg(null)
    setSubmitSuccess(false)
    setNickname('')
    setAppNumber('')
    setSelectedQuestion(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 px-3 py-1 rounded-full text-sm font-medium mb-4"
          >
            <Calculator className="h-4 w-4" />
            <span>WBJEE 2026 Evaluation Tool</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 dark:from-red-400 dark:via-rose-400 dark:to-red-500 bg-clip-text text-transparent"
          >
            WBJEE Marks Calculator
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-3 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400"
          >
            Check your score instantly and securely. Upload your response sheet PDF or paste response tables to get question-by-question analytics and compare with the statewide leaderboard.
          </motion.p>
        </div>

        {/* Main Interface */}
        {!results ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Input Form Column (Left / Main) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-900 shadow-md rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                
                {/* Tabs selection */}
                <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 p-2 gap-1">
                  <button
                    onClick={() => setActiveTab('pdf')}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 px-3 rounded-xl text-sm font-semibold transition-all ${
                      activeTab === 'pdf'
                        ? 'bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-sm border border-gray-200 dark:border-gray-700'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload PDF</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('paste')}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 px-3 rounded-xl text-sm font-semibold transition-all ${
                      activeTab === 'paste'
                        ? 'bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-sm border border-gray-200 dark:border-gray-700'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Clipboard className="h-4 w-4" />
                    <span>Paste Answers</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('leaderboard')}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 px-3 rounded-xl text-sm font-semibold transition-all ${
                      activeTab === 'leaderboard'
                        ? 'bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-sm border border-gray-200 dark:border-gray-700'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Trophy className="h-4 w-4" />
                    <span>Leaderboard</span>
                  </button>
                </div>

                <div className="p-6">
                  <AnimatePresence mode="wait">
                    
                    {/* LEADERBOARD TAB */}
                    {activeTab === 'leaderboard' && (
                      <motion.div
                        key="leaderboard-tab"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                      >
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Statewide Leaderboard</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Top submissions ranked by verified score</p>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Stream Filter Pills */}
                            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs font-semibold">
                              <button
                                onClick={() => { setLeaderboardFilter('all'); fetchLeaderboard('all') }}
                                className={`px-2.5 py-1.5 rounded-lg transition ${leaderboardFilter === 'all' ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-xs' : 'text-gray-500'}`}
                              >
                                All
                              </button>
                              <button
                                onClick={() => { setLeaderboardFilter('both'); fetchLeaderboard('both') }}
                                className={`px-2.5 py-1.5 rounded-lg transition ${leaderboardFilter === 'both' ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-xs' : 'text-gray-500'}`}
                              >
                                Engineering
                              </button>
                              <button
                                onClick={() => { setLeaderboardFilter('physics_chemistry'); fetchLeaderboard('physics_chemistry') }}
                                className={`px-2.5 py-1.5 rounded-lg transition ${leaderboardFilter === 'physics_chemistry' ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-xs' : 'text-gray-500'}`}
                              >
                                Pharmacy
                              </button>
                            </div>

                            <button
                              onClick={() => fetchLeaderboard()}
                              className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 p-2 rounded-lg transition border border-gray-200 dark:border-gray-700"
                              title="Refresh Leaderboard"
                            >
                              <RefreshCw className={`h-4 w-4 ${isLoadingLeaderboard ? 'animate-spin' : ''}`} />
                            </button>
                          </div>
                        </div>

                        {isLoadingLeaderboard ? (
                          <div className="py-16 flex flex-col justify-center items-center gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
                            <span className="text-xs text-gray-500">Loading rankings...</span>
                          </div>
                        ) : leaderboard.length === 0 ? (
                          <div className="py-16 text-center text-gray-500 text-sm">
                            No leaderboard submissions yet for this stream. Be the first to calculate and submit!
                          </div>
                        ) : (
                          <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-xs">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 font-bold text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-800">
                                  <tr>
                                    <th className="py-3 px-4">Rank</th>
                                    <th className="py-3 px-4">Nickname</th>
                                    <th className="py-3 px-4 text-center">Stream</th>
                                    <th className="py-3 px-4 text-center">Math</th>
                                    <th className="py-3 px-4 text-center">Phy/Chem</th>
                                    <th className="py-3 px-4 text-right">Total Score</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                                  {leaderboard.map((entry, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                                      <td className="py-3.5 px-4 font-bold text-gray-700 dark:text-gray-300">
                                        {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                                      </td>
                                      <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                                        {entry.nickname}
                                      </td>
                                      <td className="py-3.5 px-4 text-center text-xs text-gray-500">
                                        {entry.exam_type === 'both' ? 'Engg (200)' : 'Pharm (100)'}
                                      </td>
                                      <td className="py-3.5 px-4 text-center font-mono text-gray-600 dark:text-gray-300">
                                        {entry.math_score !== null ? Number(entry.math_score).toFixed(2) : '-'}
                                      </td>
                                      <td className="py-3.5 px-4 text-center font-mono text-gray-600 dark:text-gray-300">
                                        {Number(entry.phy_chem_score).toFixed(2)}
                                      </td>
                                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-red-600 dark:text-red-400">
                                        {Number(entry.total_score).toFixed(2)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* PDF UPLOAD OR COPY PASTE TAB */}
                    {activeTab !== 'leaderboard' && (
                      <motion.div
                        key="grading-inputs"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                      >
                        {/* Exam Type select */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Exam Stream</label>
                            <select
                              value={examType}
                              onChange={(e) => setExamType(e.target.value as 'both' | 'physics_chemistry')}
                              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                            >
                              <option value="both">Engineering (Math + Physics & Chemistry)</option>
                              <option value="physics_chemistry">Pharmacy / Architecture (Phy & Chem only)</option>
                            </select>
                          </div>

                          <div className="flex gap-4">
                            <div className="flex-1">
                              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Phy/Chem Set</label>
                              <select
                                value={phyChemSet}
                                onChange={(e) => setPhyChemSet(e.target.value as 'A' | 'B' | 'C' | 'D')}
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                              >
                                <option value="A">SET A</option>
                                <option value="B">SET B</option>
                                <option value="C">SET C</option>
                                <option value="D">SET D</option>
                              </select>
                            </div>
                            
                            {examType === 'both' && (
                              <div className="flex-1">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Mathematics Set</label>
                                <select
                                  value={mathSet}
                                  onChange={(e) => setMathSet(e.target.value as 'A' | 'B' | 'C' | 'D')}
                                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                                >
                                  <option value="A">SET A</option>
                                  <option value="B">SET B</option>
                                  <option value="C">SET C</option>
                                  <option value="D">SET D</option>
                                </select>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* PDF Upload Mode inputs */}
                        {activeTab === 'pdf' && (
                          <div className="space-y-4">
                            
                            {/* Physics & Chemistry upload */}
                            <div>
                              <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Physics & Chemistry Recorded Response PDF
                              </span>
                              <div
                                onClick={() => phyChemFileInputRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); setIsDraggingPhyChem(true) }}
                                onDragLeave={() => setIsDraggingPhyChem(false)}
                                onDrop={(e) => {
                                  e.preventDefault()
                                  setIsDraggingPhyChem(false)
                                  if (e.dataTransfer.files?.[0]) setPhyChemFile(e.dataTransfer.files[0])
                                }}
                                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                                  isDraggingPhyChem 
                                    ? 'border-red-500 bg-red-50/30 dark:bg-red-950/20' 
                                    : phyChemFile 
                                    ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10' 
                                    : 'border-gray-200 dark:border-gray-800 hover:border-red-500 dark:hover:border-red-500 bg-gray-50/40 dark:bg-gray-900/30'
                                }`}
                              >
                                <input
                                  type="file"
                                  ref={phyChemFileInputRef}
                                  accept="application/pdf"
                                  onChange={(e) => e.target.files?.[0] && setPhyChemFile(e.target.files[0])}
                                  className="hidden"
                                />
                                <Upload className={`mx-auto h-10 w-10 mb-2 transition ${phyChemFile ? 'text-emerald-500' : 'text-gray-400'}`} />
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                  {phyChemFile ? phyChemFile.name : 'Click to browse or drag & drop Physics/Chemistry PDF'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Official recorded response sheet (PDF)</p>
                              </div>
                            </div>

                            {/* Math upload (Conditional) */}
                            {examType === 'both' && (
                              <div>
                                <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                  Mathematics Recorded Response PDF
                                </span>
                                <div
                                  onClick={() => mathFileInputRef.current?.click()}
                                  onDragOver={(e) => { e.preventDefault(); setIsDraggingMath(true) }}
                                  onDragLeave={() => setIsDraggingMath(false)}
                                  onDrop={(e) => {
                                    e.preventDefault()
                                    setIsDraggingMath(false)
                                    if (e.dataTransfer.files?.[0]) setMathFile(e.dataTransfer.files[0])
                                  }}
                                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                                    isDraggingMath 
                                      ? 'border-red-500 bg-red-50/30 dark:bg-red-950/20' 
                                      : mathFile 
                                      ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10' 
                                      : 'border-gray-200 dark:border-gray-800 hover:border-red-500 dark:hover:border-red-500 bg-gray-50/40 dark:bg-gray-900/30'
                                  }`}
                                >
                                  <input
                                    type="file"
                                    ref={mathFileInputRef}
                                    accept="application/pdf"
                                    onChange={(e) => e.target.files?.[0] && setMathFile(e.target.files[0])}
                                    className="hidden"
                                  />
                                  <Upload className={`mx-auto h-10 w-10 mb-2 transition ${mathFile ? 'text-emerald-500' : 'text-gray-400'}`} />
                                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                    {mathFile ? mathFile.name : 'Click to browse or drag & drop Mathematics PDF'}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">Official recorded response sheet (PDF)</p>
                                </div>
                              </div>
                            )}

                          </div>
                        )}

                        {/* Text paste answers mode */}
                        {activeTab === 'paste' && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                Paste Physics & Chemistry Responses Table
                              </label>
                              <textarea
                                value={phyChemPaste}
                                onChange={(e) => setPhyChemPaste(e.target.value)}
                                rows={6}
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                                placeholder={`Paste responses table directly from portal. Example:\nPhysics and Chemistry    5012015xxx    Q1    A\nPhysics and Chemistry    5012015xxx    Q2    -`}
                              />
                            </div>

                            {examType === 'both' && (
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                  Paste Mathematics Responses Table
                                </label>
                                <textarea
                                  value={mathPaste}
                                  onChange={(e) => setMathPaste(e.target.value)}
                                  rows={6}
                                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                                  placeholder={`Paste responses table directly from portal. Example:\nMathematics    5011015xxx    Q1    C\nMathematics    5011015xxx    Q2    D`}
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Error box */}
                        {errorMsg && (
                          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300 p-4 rounded-xl flex items-start space-x-3">
                            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                            <span className="text-sm font-medium">{errorMsg}</span>
                          </div>
                        )}

                        {/* Calculate Button */}
                        <div className="pt-2">
                          <button
                            onClick={handleCalculate}
                            disabled={isProcessing}
                            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition shadow-md hover:shadow-lg active:scale-[0.99]"
                          >
                            {isProcessing ? (
                              <>
                                <RefreshCw className="h-5 w-5 animate-spin" />
                                <span>{processingStep} ({processingProgress}%)</span>
                              </>
                            ) : (
                              <>
                                <Calculator className="h-5 w-5" />
                                <span>Calculate Marks</span>
                              </>
                            )}
                          </button>
                        </div>

                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>

              </div>
            </div>

            {/* Instruction Column (Right sidebar) */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-900 p-6 shadow-md rounded-2xl border border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <span>How to Get Responses</span>
                </h3>
                <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-4 list-decimal pl-4">
                  <li>
                    <strong className="text-gray-900 dark:text-white">Log in</strong> to the candidate portal at <a href="https://wbjeeb.nic.in" target="_blank" rel="noreferrer" className="text-red-600 underline">wbjeeb.nic.in</a>.
                  </li>
                  <li>
                    Open the <strong className="text-gray-900 dark:text-white">Recorded Response</strong> section.
                  </li>
                  <li>
                    <strong className="text-gray-900 dark:text-white">PDF Method:</strong> Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 text-xs">Ctrl+P</kbd> &rarr; Save as PDF, then drop it here.
                  </li>
                  <li>
                    <strong className="text-gray-900 dark:text-white">Copy-Paste Method:</strong> Select and copy the response table rows and paste them into the paste tab.
                  </li>
                  <li>
                    Double check your question paper set (A, B, C, or D) for each subject!
                  </li>
                </ol>
              </div>

              <div className="bg-gradient-to-br from-red-600 to-rose-700 text-white p-6 shadow-md rounded-2xl">
                <Trophy className="h-10 w-10 mb-4 opacity-90" />
                <h4 className="text-lg font-bold mb-1">Statewide Leaderboard</h4>
                <p className="text-xs text-red-100 leading-relaxed mb-4">
                  Submit your score anonymously. Compare your results with thousands of other candidates and view estimated rank brackets.
                </p>
                <button 
                  onClick={() => setActiveTab('leaderboard')}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center space-x-2 transition"
                >
                  <span>View Leaderboard</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>

          </div>
        ) : (
          
          /* RESULTS VIEW */
          <div id="results-section" className="space-y-8">
            
            {/* Action buttons top */}
            <div className="flex justify-between items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-6 py-4 rounded-2xl shadow-xs">
              <span className="text-sm text-gray-500 font-medium">Evaluation complete against official key standards.</span>
              <button
                onClick={handleReset}
                className="flex items-center space-x-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Calculate Another</span>
              </button>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Total Score box */}
              <div className="bg-gradient-to-br from-red-600 via-rose-600 to-red-700 text-white p-6 rounded-3xl shadow-lg flex flex-col justify-between">
                <div>
                  <span className="text-sm text-red-100 font-medium tracking-wide uppercase">Calculated Total</span>
                  <h2 className="text-5xl font-black mt-2 tracking-tight">
                    {results.totalScore.toFixed(2)}
                  </h2>
                </div>
                <div className="mt-8 border-t border-white/20 pt-4 flex justify-between text-xs text-red-100">
                  <span>Sets Evaluated:</span>
                  <span className="font-bold">
                    {examType === 'both' ? `Math Set ${results.mathSet} | ` : ''}PC Set {results.phyChemSet}
                  </span>
                </div>
              </div>

              {/* Subject Breakdowns */}
              <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Subject Scores</span>
                  <div className="mt-4 space-y-4">
                    {results.Mathematics && (
                      <div>
                        <div className="flex justify-between text-sm font-semibold mb-1">
                          <span>Mathematics</span>
                          <span className="text-red-600 dark:text-red-400 font-mono">
                            {results.Mathematics.totalMarks.toFixed(2)} / 100
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-red-500 h-full" 
                            style={{ width: `${Math.max(0, Math.min(100, results.Mathematics.totalMarks))}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {results['Physics/Chemistry'] && (
                      <div>
                        <div className="flex justify-between text-sm font-semibold mb-1">
                          <span>Physics & Chemistry</span>
                          <span className="text-rose-600 dark:text-rose-400 font-mono">
                            {results['Physics/Chemistry'].totalMarks.toFixed(2)} / 100
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-rose-500 h-full" 
                            style={{ width: `${Math.max(0, Math.min(100, results['Physics/Chemistry'].totalMarks))}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-4">Official marking rules applied (+1/-0.25, +2/-0.5, Cat 3 partial).</div>
              </div>

              {/* Accuracy Meter */}
              <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider self-start">Attempt Accuracy</span>
                
                {(() => {
                  const activeSubData = results[activeResultsSubject]
                  const correct = activeSubData?.correctCount || 0
                  const partial = activeSubData?.partialCount || 0
                  const incorrect = activeSubData?.incorrectCount || 0
                  const totalAttempted = correct + partial + incorrect
                  const accuracyRate = totalAttempted > 0 ? ((correct + partial * 0.5) / totalAttempted) * 100 : 0
                  
                  return (
                    <div className="flex items-center space-x-6 py-2">
                      <div className="relative h-24 w-24">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-gray-100 dark:text-gray-800"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-emerald-500"
                            strokeWidth="3.5"
                            strokeDasharray={`${accuracyRate.toFixed(1)}, 100`}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xl font-extrabold">{accuracyRate.toFixed(0)}%</span>
                          <span className="text-[10px] text-gray-400 font-medium">Accuracy</span>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center space-x-1.5">
                          <div className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span className="text-gray-600 dark:text-gray-300 font-medium">Correct: {correct + partial}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <div className="h-2 w-2 rounded-full bg-red-500" />
                          <span className="text-gray-600 dark:text-gray-300 font-medium">Wrong: {incorrect}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <div className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-700" />
                          <span className="text-gray-600 dark:text-gray-300 font-medium">Skipped: {activeSubData?.unattemptedCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                <div className="text-xs text-gray-400 mt-2">Showing stats for {activeResultsSubject}.</div>
              </div>

            </div>

            {/* Leaderboard Submission Widget */}
            {!submitSuccess ? (
              <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 p-6 rounded-3xl">
                <div className="flex items-center space-x-2 text-red-700 dark:text-red-300 font-bold mb-2">
                  <Trophy className="h-5 w-5" />
                  <span>Submit to Estimated Leaderboard</span>
                </div>
                <p className="text-sm text-red-800/80 dark:text-red-300/80 mb-4 max-w-3xl">
                  Compare your results with other candidates. Your application number is strictly hashed on the server and is never stored in plain text.
                </p>
                <form onSubmit={handleSubmitScore} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-300 mb-1.5">Screen Nickname</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. topper123"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-300 mb-1.5">Application Number</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter Application No."
                      value={appNumber}
                      onChange={(e) => setAppNumber(e.target.value)}
                      className="w-full bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center space-x-2 shadow-xs"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <span>Submit Score</span>
                      )}
                    </button>
                  </div>
                </form>
                {submitError && (
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 mt-2">{submitError}</p>
                )}
              </div>
            ) : (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 p-6 rounded-3xl text-center">
                <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-lg font-bold text-emerald-800 dark:text-emerald-300">Score Submitted Successfully!</h4>
                <p className="text-sm text-emerald-700/80 dark:text-emerald-400/80 mt-1">
                  Your rank position has been recorded. Scroll up and open the Leaderboard tab to check your standing.
                </p>
              </div>
            )}

            {/* Question Breakdown Visualizer */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-xs">
              
              {/* Selector Subject Tab */}
              <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 p-2 gap-2">
                {results.Mathematics && (
                  <button
                    onClick={() => { setActiveResultsSubject('Mathematics'); setSelectedQuestion(null) }}
                    className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${
                      activeResultsSubject === 'Mathematics'
                        ? 'bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-xs border border-gray-200 dark:border-gray-700'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Mathematics (75 Qs)
                  </button>
                )}
                <button
                  onClick={() => { setActiveResultsSubject('Physics/Chemistry'); setSelectedQuestion(null) }}
                  className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${
                    activeResultsSubject === 'Physics/Chemistry'
                      ? 'bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-xs border border-gray-200 dark:border-gray-700'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Physics & Chemistry (80 Qs)
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Bento Grid Cells (Left) */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Responses Matrix ({activeResultsSubject})</h4>
                    <span className="text-xs text-gray-400">Click any question for evaluation details</span>
                  </div>

                  <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
                    {results[activeResultsSubject]?.details.map((qResult: QuestionResult) => {
                      let cellClass = 'bg-gray-100 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 text-gray-500' // Unattempted
                      if (qResult.status === 'correct') {
                        cellClass = 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold'
                      } else if (qResult.status === 'incorrect') {
                        cellClass = 'bg-red-50 dark:bg-red-950/30 border-red-500 text-red-700 dark:text-red-400 font-bold'
                      } else if (qResult.status === 'partial') {
                        cellClass = 'bg-amber-50 dark:bg-amber-950/30 border-amber-500 text-amber-700 dark:text-amber-400 font-bold'
                      }

                      return (
                        <button
                          key={qResult.q}
                          onClick={() => handleSelectQuestion(qResult)}
                          className={`aspect-square border rounded-xl flex flex-col items-center justify-center p-1 cursor-pointer hover:shadow-md transition text-xs font-semibold ${cellClass} ${
                            selectedQuestion?.q === qResult.q ? 'ring-2 ring-red-500 dark:ring-red-400 scale-105' : ''
                          }`}
                        >
                          <span className="opacity-60 text-[9px] mb-0.5">Q{qResult.q}</span>
                          <span className="font-extrabold truncate max-w-full px-1">{qResult.user}</span>
                        </button>
                      )
                    })}
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-xs mt-3 pt-2 text-gray-500 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center space-x-1.5">
                      <div className="h-3 w-3 rounded bg-emerald-500" />
                      <span>Correct (+1 / +2)</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <div className="h-3 w-3 rounded bg-amber-500" />
                      <span>Partial (+0.67 to +1.33)</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <div className="h-3 w-3 rounded bg-red-500" />
                      <span>Wrong (-0.25 / -0.5)</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <div className="h-3 w-3 rounded bg-gray-300 dark:bg-gray-700" />
                      <span>Unattempted (0)</span>
                    </div>
                  </div>
                </div>

                {/* Selected Question Details sidebar (Right) */}
                <div ref={questionDetailsRef} className="bg-gray-50 dark:bg-gray-800/40 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col justify-between">
                  {selectedQuestion ? (
                    <div className="space-y-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-bold text-red-600 dark:text-red-400 tracking-wide uppercase">Question Details</span>
                          <h4 className="text-2xl font-black mt-1">Question Q{selectedQuestion.q}</h4>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                          selectedQuestion.status === 'correct' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' :
                          selectedQuestion.status === 'incorrect' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                          selectedQuestion.status === 'partial' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {selectedQuestion.status}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-sm py-2 border-b border-gray-200/50 dark:border-gray-700/50">
                          <span className="text-gray-500">Category</span>
                          <span className="font-semibold text-gray-900 dark:text-white">Category {selectedQuestion.category}</span>
                        </div>
                        <div className="flex justify-between text-sm py-2 border-b border-gray-200/50 dark:border-gray-700/50">
                          <span className="text-gray-500">Marking Scheme</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {selectedQuestion.category === 1 ? '+1 / -0.25' : selectedQuestion.category === 2 ? '+2 / -0.5' : '+2 / No negative (Partial)'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm py-2 border-b border-gray-200/50 dark:border-gray-700/50">
                          <span className="text-gray-500">Your Marked Option</span>
                          <span className="font-black text-gray-900 dark:text-white text-base">{selectedQuestion.user}</span>
                        </div>
                        <div className="flex justify-between text-sm py-2 border-b border-gray-200/50 dark:border-gray-700/50">
                          <span className="text-gray-500">Official Key</span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">{selectedQuestion.correct}</span>
                        </div>
                        <div className="flex justify-between text-sm py-2">
                          <span className="text-gray-500">Marks Awarded</span>
                          <span className={`font-black text-lg ${selectedQuestion.marks > 0 ? 'text-emerald-600 dark:text-emerald-400' : selectedQuestion.marks < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500'}`}>
                            {selectedQuestion.marks > 0 ? `+${selectedQuestion.marks.toFixed(2)}` : selectedQuestion.marks.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center space-y-3">
                      <HelpCircle className="h-10 w-10 opacity-30" />
                      <p className="text-sm font-medium">Select any question in the matrix to view its grading breakdown and answer comparison.</p>
                    </div>
                  )}

                  {selectedQuestion && (
                    <div className="text-[11px] text-gray-400 leading-relaxed pt-4 mt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                      Category 3 questions are multiple select: partial marks are awarded only if a subset of correct answers are marked with no wrong answers.
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  )
}
