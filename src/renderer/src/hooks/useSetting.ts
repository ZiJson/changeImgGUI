import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { TerminalConfig, TerminalType } from 'src/main/type/settings'

export const useSetting = () => {
  const queryClient = useQueryClient()
  const { data: terminalConfig, isLoading } = useQuery({
    queryKey: ['terminal', 'config'],
    queryFn: window.api.terminal.getTerminalConfig
  })
  const { mutateAsync: updateTerminalConfig } = useMutation({
    mutationFn: window.api.terminal.updateTerminalConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terminal'] })
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
