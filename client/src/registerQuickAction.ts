import { ZettelExtensions } from '@zettelooo/extension-api'

export const registerQuickAction: ZettelExtensions.Helper<'pagePanel', 'api' | 'pagePanel', [], void> = function ({
  api,
  pagePanelApi,
}) {
  this.register(
    pagePanelApi.registry.quickAction(() => ({
      title: api.header.name,
      description: api.header.description,
      avatarUrl: api.header.avatarUrl,
      disabled: true,
      switchChecked: true,
    }))
  )
}
