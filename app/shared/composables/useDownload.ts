export function useDownload() {
	const isDownloading = ref(false)

	async function downloadFile(url: string, filename?: string) {
		if (!url) return
		isDownloading.value = true

		try {
			const response = await fetch(url)
			if (!response.ok)
				throw new Error(`HTTP error status: ${response.status}`)

			const blob = await response.blob()
			const objectUrl = URL.createObjectURL(blob)
			const a = document.createElement("a")
			a.href = objectUrl

			if (!filename) {
				const cleanUrl = url.split("?")[0] ?? ""
				const nameFromUrl = cleanUrl.split("/").pop()
				filename = nameFromUrl ? decodeURIComponent(nameFromUrl) : `download-${Date.now()}`
			}

			a.download = filename
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			URL.revokeObjectURL(objectUrl)
		} catch (err) {
			console.error("Failed to download file:", err)
			throw err
		} finally {
			isDownloading.value = false
		}
	}

	async function downloadFiles(urls: string[]) {
		if (!urls.length) return
		isDownloading.value = true

		try {
			for (const url of urls) {
				if (url) {
					await downloadFile(url)
				}
			}
		} finally {
			isDownloading.value = false
		}
	}

	return {
		isDownloading,
		downloadFile,
		downloadFiles,
	}
}
