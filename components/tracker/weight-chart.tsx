'use client'

import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { PROFILE } from '@/lib/fitness'

const config = {
  avg: { label: 'TB tuần (kg)', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function WeightChart({ data }: { data: { label: string; avg: number | null; days: number }[] }) {
  const values = data.map((d) => d.avg).filter((v): v is number => v !== null)
  const hasData = values.length > 0
  const min = Math.floor(Math.min(PROFILE.goalWeight, ...values) - 1)
  const max = Math.ceil(Math.max(PROFILE.startWeight, ...values) + 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Xu hướng cân nặng TB tuần</CardTitle>
        <CardDescription>8 tuần gần nhất · Mỗi điểm = trung bình 7 ngày</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer config={config} className="aspect-[4/3] w-full">
            <LineChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
              <YAxis domain={[min, max]} tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
              <ReferenceLine
                y={PROFILE.goalWeight}
                stroke="var(--chart-2)"
                strokeDasharray="4 4"
                label={{ value: `Mục tiêu ${PROFILE.goalWeight}kg`, fill: 'var(--chart-2)', fontSize: 11, position: 'insideBottomRight' }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="avg"
                stroke="var(--color-avg)"
                strokeWidth={3}
                dot={{ r: 4, fill: 'var(--color-avg)' }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed text-center text-sm text-muted-foreground">
            Nhập cân nặng hằng ngày để xem biểu đồ.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
