// SPDX-FileCopyrightText: Copyright (c) 2025-2026, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { render, screen } from '@/test-utils'
import { describe, expect, test, vi } from 'vitest'
import { AgentResponse } from './AgentResponse'

vi.mock('@/features/layout/store', () => ({
  useLayoutStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      openRightPanel: vi.fn(),
      setResearchPanelTab: vi.fn(),
    }),
}))

vi.mock('../store', () => ({
  useChatStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      reportContent: '',
      deepResearchJobId: null,
      isDeepResearchStreaming: false,
      deepResearchStreamLoaded: false,
      reconnectToActiveJob: vi.fn(),
    }),
}))

vi.mock('../hooks', () => ({
  useLoadJobData: () => ({
    loadResearchPanelTab: vi.fn(),
    isLoading: false,
    error: null,
  }),
}))

describe('AgentResponse native chart rendering', () => {
  test('renders a chart fence from a direct data-science answer', () => {
    const predictionChart = {
      type: 'hbar',
      title: 'Predicted likelihood',
      x: { key: 'customer' },
      y: { format: 'percent' },
      series: [{ key: 'likelihood', label: 'Predicted probability' }],
      data: [
        { customer: 'Customer A', likelihood: 0.82 },
        { customer: 'Customer B', likelihood: 0.71 },
      ],
    }
    const historyChart = {
      type: 'line',
      title: 'Observed monthly activity',
      x: { key: 'month' },
      series: [{ key: 'events', label: 'Observed' }],
      data: [
        { month: 'Jan', events: 41 },
        { month: 'Feb', events: 53 },
      ],
    }
    const content = [
      'Customer A has the highest predicted likelihood.',
      `\`\`\`chart\n${JSON.stringify(predictionChart)}\n\`\`\``,
      'Observed activity increased.',
      `\`\`\`chart\n${JSON.stringify(historyChart)}\n\`\`\``,
    ].join('\n\n')

    render(<AgentResponse content={content} />)

    expect(screen.getByRole('img', { name: /hbar chart: Predicted likelihood/ })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /line chart: Observed monthly activity/ })).toBeInTheDocument()
  })

  test('falls back to readable code for a malformed data-science chart', () => {
    render(<AgentResponse content={'Chart unavailable.\n\n```chart\n{not json\n```'} />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText(/not json/)).toBeInTheDocument()
  })
})
