const FLAGCDN_HOST = "flagcdn.com"

// Primary flag image: flagcdn's sized PNGs (resolution is a width bucket like
// "w40", "w80", "w320"). flagcdn sends `Access-Control-Allow-Origin: *`, which
// the WebGL globes rely on to use the image as a texture.
export function flagSrc(code: string, resolution: string): string {
    return `https://${FLAGCDN_HOST}/${resolution}/${code.toLowerCase()}.png`
}

// Independent fallback path for when flagcdn drops a request: wsrv.nl is a
// separate, CORS-enabled image proxy fetching the same flagcdn source, so a
// transient flagcdn edge failure doesn't leave a broken flag.
export function flagFallbackSrc(code: string, resolution: string): string {
    return `https://wsrv.nl/?url=${FLAGCDN_HOST}/${resolution}/${code.toLowerCase()}.png`
}

export function getFlagUrl(flagCode: string): string {
    return `https://${FLAGCDN_HOST}/${flagCode}.svg`
}
