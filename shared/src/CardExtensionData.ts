export type CardExtensionData =
  | undefined
  | {
      readonly parsed: true
      readonly url?: string
    }

export namespace CardExtensionData {
  export function equals(first: CardExtensionData, second: CardExtensionData): boolean {
    return first === second || (first?.parsed === second?.parsed && first?.url === second?.url)
  }
}
