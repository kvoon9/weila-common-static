const METHODS = new Set(['get', 'post', 'put', 'patch', 'delete'])

export function methodClass(method: string): string {
  const name = method.toLowerCase()
  return METHODS.has(name) ? `docs-method-${name}` : 'docs-method-default'
}

export function statusClass(status: string): string {
  if (status === '已完成') return 'docs-status-done'
  if (status === '开发中') return 'docs-status-wip'
  return 'docs-status-default'
}
