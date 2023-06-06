export type PageExtensionData =
  | undefined
  | {
      readonly enabled: true
      readonly command?: string
    }
