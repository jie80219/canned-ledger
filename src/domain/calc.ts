export const OPS = ['+', '−', '×', '÷']

/** 計算機算式求值（先乘除後加減），不使用 eval */
export function evaluate(s: string): number {
  const tokens = s.match(/(\d+\.?\d*|\.\d+|[+−×÷])/g) ?? []
  const nums: number[] = []
  const ops: string[] = []
  const prec = (o: string) => (o === '×' || o === '÷' ? 2 : 1)
  const apply = () => {
    const b = nums.pop() ?? 0
    const a = nums.pop() ?? 0
    const o = ops.pop()
    nums.push(o === '+' ? a + b : o === '−' ? a - b : o === '×' ? a * b : b === 0 ? 0 : a / b)
  }
  if (OPS.includes(tokens[tokens.length - 1] ?? '')) tokens.pop()
  for (const t of tokens) {
    if (OPS.includes(t)) {
      while (ops.length && prec(ops[ops.length - 1]) >= prec(t)) apply()
      ops.push(t)
    } else nums.push(Number(t))
  }
  while (ops.length) apply()
  return nums[0] ?? 0
}
