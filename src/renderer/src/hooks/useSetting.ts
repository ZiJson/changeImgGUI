import { queryKeys, terminalConfigQueryOptions } from '@renderer/lib/queries'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { TerminalConfig, TerminalType } from 'src/shared/settings'

export const useSetting = () => {
  const queryClient = useQueryClient()
  const { data: terminalConfig } = useQuery(terminalConfigQueryOptions)
  const { mutateAsync: updateTerminalConfig } = useMutation({
    mutationFn: window.api.terminal.updateTerminalConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.terminal })
    }
  })

  const onTerminalChange = async (value: TerminalType) => {
    const newConfig: TerminalConfig = { ...terminalConfig!, selected: value }
    await updateTerminalConfig(newConfig)
  }
  return {
    terminalConfig,
    onTerminalChange
  }
}
