import { ZettelTypes } from '@zettelooo/api-types'
import { ZettelExtensions } from '@zettelooo/extension-api'
import { CardExtensionData } from 'shared'

export const registerComposer: ZettelExtensions.Helper<
  'pagePanel',
  'api' | 'activated' | 'signedIn' | 'pagePanel',
  [],
  void
> = function ({ api, activatedApi, signedInApi, pagePanelApi }) {
  const composerRegistration = this.register(
    pagePanelApi.registry.composer<{
      readonly linkTitle: string
      readonly linkUrl: string
      readonly linkUrlError?: string
      readonly disabled?: boolean
    }>(() => ({
      initialState: {
        linkTitle: '',
        linkUrl: '',
      },
      render: ({ renderContext, un }) => ({
        html: `
<style>
  #${un.root} {
    border-radius: ${renderContext.theme.unitPx * 1.25}px;
    padding: ${renderContext.theme.unitPx * 2}px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: ${renderContext.theme.unitPx * 1}px;
    background-color: ${renderContext.theme.palette.background.paper};
  }
</style>

<div id="${un.root}" tab-index="-1">
  <div id="${un.titleInputWrapper}"></div>
  <div id="${un.urlInputWrapper}"></div>
  <div id="${un.submitButtonWrapper}"></div>
</div>
`,
        onRendered: ({ sanitizedHtml, containerElement, currentContext }) => {
          const root = containerElement.querySelector(`#${un.root}`) as HTMLDivElement
          const titleInputWrapper = root.querySelector(`#${un.titleInputWrapper}`) as HTMLDivElement
          const urlInputWrapper = root.querySelector(`#${un.urlInputWrapper}`) as HTMLDivElement
          const submitButtonWrapper = root.querySelector(`#${un.submitButtonWrapper}`) as HTMLDivElement

          const submit = async () => {
            if (!currentContext.state.linkUrl) {
              composerRegistration.reference.current?.setState(oldState => ({
                ...oldState,
                linkUrlError: 'Required',
              }))
              return
            }
            try {
              composerRegistration.reference.current?.setState(oldState => ({
                ...oldState,
                linkUrlError: undefined,
                disabled: true,
              }))
              const blocks: ZettelTypes.Extension.Entity.Block[] = []
              if (currentContext.state.linkTitle) {
                blocks.push({
                  type: ZettelTypes.Model.Block.Type.Header,
                  id: api.generateId(),
                  text: currentContext.state.linkTitle,
                  annotations: [],
                  styleGroups: [],
                  level: 6,
                  extensionData: {},
                })
              }
              blocks.push({
                type: ZettelTypes.Model.Block.Type.Paragraph,
                id: api.generateId(),
                text: currentContext.state.linkUrl,
                annotations: [
                  {
                    type: ZettelTypes.Model.Block.StyledText.Annotation.Type.PlainLink,
                    from: 0,
                    to: currentContext.state.linkUrl.length,
                    url: currentContext.state.linkUrl,
                  },
                ],
                styleGroups: [],
                extensionData: {},
              })
              const card = await signedInApi.access.createCard<CardExtensionData>({
                pageId: pagePanelApi.target.pageId,
                blocks,
                extensionData: {
                  parsed: true,
                  url: currentContext.state.linkUrl,
                },
              })
              const cardPublicUrl = activatedApi.access.getCardPublicUrl(card.id)
              activatedApi.access.copyTextToClipboard(cardPublicUrl)
              activatedApi.access.showMessage('Success!', `The mask URL to your link is copied into the clipboard.`, {
                variant: 'success',
              })
              composerRegistration.reference.current?.setState({ linkTitle: '', linkUrl: '' })
            } catch (error) {
              console.error(error)
              composerRegistration.reference.current?.setState(oldState => ({ ...oldState, disabled: true }))
            }
          }

          root.addEventListener('keydown', event => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
              submit()
            }
          })

          const titleInputRegistration = this.register(
            activatedApi.registry.renderedTextField(() => ({
              container: titleInputWrapper,
              variant: 'outlined',
              fullWidth: true,
              placeholder: 'Newsletter CTA',
              disabled: currentContext.state.disabled,
              value: currentContext.state.linkTitle,
              onValueUpdate: newValue =>
                composerRegistration.reference.current?.setState(oldState => ({
                  ...oldState,
                  linkTitle: newValue,
                })),
              label: 'Destination title',
              autoFocus: true,
              margin: 'dense',
            }))
          )

          const urlInputRegistration = this.register(
            activatedApi.registry.renderedTextField(() => ({
              container: urlInputWrapper,
              variant: 'outlined',
              fullWidth: true,
              placeholder: 'https://twitter.com/zettelooo',
              disabled: currentContext.state.disabled,
              required: true,
              value: currentContext.state.linkUrl,
              onValueUpdate: newValue =>
                composerRegistration.reference.current?.setState(oldState => ({
                  ...oldState,
                  linkUrl: newValue,
                  linkUrlError: undefined,
                })),
              label: 'Destination URL',
              helperText: currentContext.state.linkUrlError,
              error: Boolean(currentContext.state.linkUrlError),
              margin: 'dense',
            }))
          )

          const submitButtonRegistration = this.register(
            activatedApi.registry.renderedButton(() => ({
              container: submitButtonWrapper,
              label: 'Share link',
              variant: 'contained',
              size: 'small',
              fullWidth: true,
              color: 'primary',
              disabled: currentContext.state.disabled,
              onClick: submit,
            }))
          )

          return {
            onUpdateState({ previousState }) {
              titleInputRegistration.reference.current?.update({
                disabled: currentContext.state.disabled,
                value: currentContext.state.linkTitle,
              })
              urlInputRegistration.reference.current?.update({
                disabled: currentContext.state.disabled,
                value: currentContext.state.linkUrl,
                helperText: currentContext.state.linkUrlError,
                error: Boolean(currentContext.state.linkUrlError),
              })
              submitButtonRegistration.reference.current?.update({
                disabled: currentContext.state.disabled,
              })
            },
            onCleanUp() {
              titleInputRegistration.deactivate()
              urlInputRegistration.deactivate()
              submitButtonRegistration.deactivate()
            },
          }
        },
      }),
    }))
  )
}
