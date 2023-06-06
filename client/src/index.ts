import { ZettelExtensions } from '@zettelooo/extension-api'
import { CardExtensionData, PageExtensionData } from 'shared'
import { registerComposer } from './registerComposer'
import { registerQuickAction } from './registerQuickAction'
import { whileCard } from './whileCard'

void ((window as ZettelExtensions.WindowWithStarter).$starter = function (api) {
  this.while('activated', function ({ activatedApi }) {
    this.while('signedIn', function ({ signedInApi }) {
      this.while('pagePanel', function ({ pagePanelApi }) {
        if (!this.scopes.includes(ZettelExtensions.Scope.Page)) return // TODO: This is redundant and should be removed later

        let activating = false
        const activate = async (command?: string): Promise<void> => {
          if (activating) return
          try {
            activating = true
            // TODO: Maybe use command to do something here
          } finally {
            activating = false
          }
        }

        this.register(
          pagePanelApi.watch(
            data => data.page.extensionData as PageExtensionData,
            newPageExtensionData => {
              if (newPageExtensionData?.enabled) {
                signedInApi.access.setPageExtensionData<PageExtensionData>(pagePanelApi.target.pageId, undefined)
                activate(newPageExtensionData.command)
              }
            },
            {
              initialCallback: true,
            }
          )
        )

        registerQuickAction.bind(this)({ api, pagePanelApi })

        registerComposer.bind(this)({ api, activatedApi, signedInApi, pagePanelApi })

        whileCard.bind(this)({ api, activatedApi })
      })
    })

    this.while('publicPageView', function ({ publicPageViewApi }) {
      if (!this.scopes.includes(ZettelExtensions.Scope.Page)) return // TODO: This is redundant and should be removed later

      whileCard.bind(this)({ api, activatedApi })
    })

    this.while('publicCardView', function ({ publicCardViewApi }) {
      if (!this.scopes.includes(ZettelExtensions.Scope.Page)) return // TODO: This is redundant and should be removed later

      const cardExtensionData = publicCardViewApi.data.card.extensionData as CardExtensionData
      if (cardExtensionData?.url) {
        window.location.href = cardExtensionData.url.match(/^https?:\/\//i)
          ? cardExtensionData.url
          : `https://${cardExtensionData.url}`
      } else {
        whileCard.bind(this)({ api, activatedApi })
      }
    })
  })
})
