import { ZettelServices } from '@zettelooo/api-server'
import { CardExtensionData, PageExtensionData } from 'shared'
import { ZETTEL_EXTENSION_ACCESS_KEY, ZETTEL_TARGET_ENVIRONMENT } from './constants'
import { extractCardExtensionData } from './extractCardExtensionData'
import { restApiClient } from './restApiClient'

export function connectWsApi(): void {
  const connection = new ZettelServices.Extension.Ws.GetUpdates<PageExtensionData, CardExtensionData>({
    extensionWsApi: { targetEnvironment: ZETTEL_TARGET_ENVIRONMENT },
    extensionAccessKey: ZETTEL_EXTENSION_ACCESS_KEY,
    startInitially: true,
    retryConnectionTimeoutMilliseconds: 10 * 1000,
    onStatusChange: status => {},
    onMutation: async mutation => {
      switch (mutation.type) {
        case 'page': {
          if (mutation.newPage.isDeleted) break
          const enabledBefore = mutation.oldPage?.hasExtensionInstalled
          const enabledAfter = mutation.newPage.hasExtensionInstalled
          if (!enabledBefore && enabledAfter) {
            if (!mutation.newPage.public) {
              await restApiClient.editPage({
                pageId: mutation.newPage.id,
                updates: { public: true },
                senderRegistrationKey: connection.getRegistrationKey(),
              })
            }
            const { cards } = await restApiClient.getCards({ pageIds: [mutation.newPage.id] })
            await Promise.all(
              cards.map(async card => {
                if (card.extensionData) return
                await restApiClient.setCardExtensionData({
                  cardId: card.id,
                  data: await extractCardExtensionData(card),
                  senderRegistrationKey: connection.getRegistrationKey(),
                })
              })
            )
          } else if (enabledBefore && !enabledAfter) {
            const { cards } = await restApiClient.getCards({ pageIds: [mutation.newPage.id] })
            await Promise.all(
              cards.map(async card => {
                if (!card.extensionData) return
                await restApiClient.setCardExtensionData({
                  cardId: card.id,
                  senderRegistrationKey: connection.getRegistrationKey(),
                })
              })
            )
          }
          break
        }

        case 'card': {
          if (mutation.page.hasExtensionInstalled) {
            if (
              !mutation.newCard.extensionData?.parsed ||
              CardExtensionData.equals(mutation.newCard.extensionData, mutation.oldCard?.extensionData)
            ) {
              await restApiClient.setCardExtensionData({
                cardId: mutation.newCard.id,
                data: await extractCardExtensionData(mutation.newCard),
                senderRegistrationKey: connection.getRegistrationKey(),
              })
            }
          } else if (mutation.newCard.extensionData) {
            await restApiClient.setCardExtensionData({
              cardId: mutation.newCard.id,
              senderRegistrationKey: connection.getRegistrationKey(),
            })
          }
          break
        }
      }
    },
  })
}
