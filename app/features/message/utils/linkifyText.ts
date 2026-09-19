const URL_REGEX = /(https?:\/\/[^\s<]+[^\s<.,:;!?'")\]])/g

const EXTERNAL_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block shrink-0 ms-0.5 size-3.5 align-middle" aria-hidden="true"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>`

const LINK_STYLE = 'overflow-wrap:anywhere;word-break:break-word'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function linkifyText(text: string, linkClass?: string): string {
  const escaped = escapeHtml(text)

  return escaped.replace(URL_REGEX, (url) => {
    if (!/^https?:\/\//i.test(url)) return url

    return `<a href="${url}" target="_blank" rel="noopener noreferrer nofollow ugc" class="${linkClass}" style="${LINK_STYLE}">${url}${EXTERNAL_ICON_SVG}</a>`
  })
}
