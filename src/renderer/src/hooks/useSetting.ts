import { queryKeys, terminalConfigQueryOptions } from '@renderer/lib/queries'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { TerminalConfig, TerminalType } from 'src/shared/settings'

export const useSetting = () => {
  const queryClient = useQueryClient()
  const { data: terminalConfig, isLoading: isLoadingTerminalConfig } = useQuery(
    terminalConfigQueryOptions
  )
  const { mutateAsync: updateTerminalConfig, isPending: isUpdatingTerminal } = useMutation({
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
    isLoadingTerminalConfig,
    isUpdatingTerminal,
    onTerminalChange
  }
}
