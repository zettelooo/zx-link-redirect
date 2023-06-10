import { ZettelTypes } from '@zettelooo/api-types'
import { CardExtensionData, refineUrl } from 'shared'
import { openAiApi } from './openAiApi'

export async function extractCardExtensionData(
  card: Pick<ZettelTypes.Extension.Model.Card<CardExtensionData>, 'text'>
): Promise<CardExtensionData> {
  const cardText = card.text.split('\n').join(' ')

  const chatCompletion = await openAiApi.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: `
You are given one line of text, then have to extract its first link URL.
If a link URL is not explicitly mentioned, just respond with a '-' (dash) character.
`,
      },
      {
        role: 'user',
        content: `
[Text]: The link is google.com and it's not my favorite link
[URL]: https://google.com
###
[Text]: List of bookmarks: mui.com, bing.com, https://unsplash.com
[URL]: https://mui.com
###
[Text]: Title: Cookbook; Address: www dot cookbook dot co; No redirection;
[URL]: https://www.cookbook.co
###
[Text]: My name is classified, how about you?
[URL]: -
###
[Text]: ${cardText}
`,
      },
    ],
    max_tokens: 2000,
    temperature: 0,
  })

  const answer = chatCompletion.data.choices[0].message?.content ?? ''

  const properties = answer
    .split('\n')
    .filter(Boolean)
    .reduce((current, line) => {
      const match = line.match(/^\[(.+)\]:\s(.+)$/)
      if (match) {
        const [, key, value] = match
        current[key] = value.trim()
      }
      return current
    }, {} as Partial<Record<string, string>>)

  const url = properties['URL'] && properties['URL'] !== '-' ? refineUrl(properties['URL']) : null

  return url ? { parsed: true, url } : { parsed: true }
}
