export function refineUrl(url: string): string {
  return url.match(/^https?:\/\//i) ? url : `https://${url}`
}
