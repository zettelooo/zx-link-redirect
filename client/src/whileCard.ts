import { ZettelExtensions } from '@zettelooo/extension-api'
import { CardExtensionData } from 'shared'

export const whileCard: ZettelExtensions.Helper<
  'pagePanel' | 'publicPageView' | 'publicCardView',
  'api' | 'activated',
  [],
  void
> = function ({ api, activatedApi }) {
  this.while('card', function ({ cardApi }) {
    const extendedHtmlContentRegistration = this.register(
      cardApi.registry.extendedHtmlContent<CardExtensionData>(() => ({
        initialState: undefined,
        render: ({ renderContext, un }) =>
          !renderContext.state?.url
            ? { html: '' }
            : {
                html: `
<style>
  #${un.root} {
    padding: ${renderContext.theme.unitPx * 1}px 0;
    display: flex;
    align-items: center;
    gap: ${renderContext.theme.unitPx * 2}px;
  }
  .${un.linkContainer} {
    width: 0;
    flex-grow: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .${un.link} {
    color: ${renderContext.theme.palette.info.main};
    text-decoration: none;
  }
  #${un.linkButtonWrapper} {
    flex: none;
  }
</style>

<div id="${un.root}">
  <div class="${un.linkContainer}">
    Link:&nbsp;<a class="${un.link}" href="${renderContext.state.url}" target="_blank">${renderContext.state.url}</a>
  </div>
  <a
    id="${un.linkButtonWrapper}"
    href="${activatedApi.access.getCardPublicUrl(cardApi.target.cardId)}"
    target="_blank"
  ></a>
</div>
`,
                onRendered: ({ sanitizedHtml, containerElement, currentContext }) => {
                  const root = containerElement.querySelector(`#${un.root}`) as HTMLDivElement
                  const linkButtonWrapper = root.querySelector(`#${un.linkButtonWrapper}`) as HTMLDivElement

                  const linkButtonRegistration = this.register(
                    activatedApi.registry.renderedButton(() => ({
                      container: linkButtonWrapper,
                      label: 'Mask link',
                      variant: 'outlined',
                      size: 'small',
                      color: 'primary',
                    }))
                  )

                  return {
                    onCleanUp() {
                      linkButtonRegistration.deactivate()
                    },
                  }
                },
              },
        position: 'bottom',
      }))
    )

    this.register(
      cardApi.watch(
        data => data.card.extensionData as CardExtensionData,
        newCardExtensionData => {
          if (newCardExtensionData?.parsed) {
            if (extendedHtmlContentRegistration.isActive()) {
              extendedHtmlContentRegistration.reference.current?.setState(newCardExtensionData)
            } else {
              extendedHtmlContentRegistration.activate()
            }
          } else {
            extendedHtmlContentRegistration.deactivate()
          }
        },
        {
          initialCallback: true,
        }
      )
    )
  })
}
