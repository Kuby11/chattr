<script setup lang="ts">
const props = withDefaults(
	defineProps<{
		imageSource?: File | Blob | string | null
		aspectRatio?: number
		shape?: 'rect' | 'circle'
		title?: string
		description?: string
		targetWidth?: number
		targetHeight?: number
		fileName?: string
		outputType?: string
	}>(),
	{
		imageSource: null,
		aspectRatio: 1,
		shape: 'rect',
		title: 'Crop Image',
		description: 'Drag to position and use the slider to zoom.',
		targetWidth: undefined,
		targetHeight: undefined,
		fileName: 'cropped-image.webp',
		outputType: 'image/webp'
	}
)

const emit = defineEmits<{
	(e: 'crop', file: File, previewUrl: string): void
	(e: 'cancel'): void
}>()

const isOpen = defineModel<boolean>('open', { default: false })

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

const imgElement = ref<HTMLImageElement | null>(null)
const isImageLoaded = ref(false)

const zoom = ref(1)
const panX = ref(0)
const panY = ref(0)
const rotation = ref(0)

const minZoom = computed(() => {
	if (!imgElement.value) return 1

	const isRotated = rotation.value % 180 !== 0
	const naturalW = isRotated ? imgElement.value.naturalHeight : imgElement.value.naturalWidth
	const naturalH = isRotated ? imgElement.value.naturalWidth : imgElement.value.naturalHeight

	const { width: cropW, height: cropH } = cropRect.value
	if (!cropW || !cropH || !naturalW || !naturalH) return 1

	const scaleX = cropW / naturalW
	const scaleY = cropH / naturalH
	return Math.max(scaleX, scaleY)
})

const maxZoom = computed(() => {
	return Math.max(minZoom.value * 4, 3)
})

watch(minZoom, (newMin) => {
	if (zoom.value < newMin) {
		zoom.value = newMin
	}
	clampPan()
	renderCanvas()
})

const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const initialTouchDistance = ref<number | null>(null)
const initialTouchZoom = ref(1)

const canvasWidth = ref(520)
const canvasHeight = ref(360)

let sourceObjectUrl: string | null = null

function revokeSourceObjectUrl() {
	if (!sourceObjectUrl) return
	URL.revokeObjectURL(sourceObjectUrl)
	sourceObjectUrl = null
}

const cropRect = computed(() => {
	const padding = 28
	const availableWidth = Math.max(120, canvasWidth.value - padding * 2)
	const availableHeight = Math.max(120, canvasHeight.value - padding * 2)

	const ratio = props.shape === 'circle' ? 1 : props.aspectRatio

	let width = availableWidth
	let height = width / ratio

	if (height > availableHeight) {
		height = availableHeight
		width = height * ratio
	}

	const x = (canvasWidth.value - width) / 2
	const y = (canvasHeight.value - height) / 2

	return { x, y, width, height }
})

function loadImage() {
	revokeSourceObjectUrl()

	if (!props.imageSource) {
		imgElement.value = null
		isImageLoaded.value = false
		return
	}

	let src = ''
	if (typeof props.imageSource === 'string') {
		src = props.imageSource
	} else {
		sourceObjectUrl = URL.createObjectURL(props.imageSource)
		src = sourceObjectUrl
	}

	const img = new Image()
	img.crossOrigin = 'anonymous'
	img.onload = () => {
		if (sourceObjectUrl === src) {
			revokeSourceObjectUrl()
		}
		imgElement.value = img
		isImageLoaded.value = true
		resetTransform()
		renderCanvas()
	}
	img.onerror = () => {
		if (sourceObjectUrl === src) {
			revokeSourceObjectUrl()
		}
	}
	img.src = src
}

function resetTransform() {
	if (!imgElement.value) return

	rotation.value = 0
	zoom.value = minZoom.value
	panX.value = 0
	panY.value = 0
}

function clampPan() {
	if (!imgElement.value) return

	const isRotated = rotation.value % 180 !== 0
	const naturalW = isRotated ? imgElement.value.naturalHeight : imgElement.value.naturalWidth
	const naturalH = isRotated ? imgElement.value.naturalWidth : imgElement.value.naturalHeight

	const currentDrawW = naturalW * zoom.value
	const currentDrawH = naturalH * zoom.value

	const { width: cropW, height: cropH } = cropRect.value

	const maxPanX = Math.max(0, (currentDrawW - cropW) / 2)
	const maxPanY = Math.max(0, (currentDrawH - cropH) / 2)

	panX.value = Math.max(-maxPanX, Math.min(maxPanX, panX.value))
	panY.value = Math.max(-maxPanY, Math.min(maxPanY, panY.value))
}

function renderCanvas() {
	const canvas = canvasRef.value
	const img = imgElement.value
	if (!canvas || !img || !isImageLoaded.value) return

	const ctx = canvas.getContext('2d')
	if (!ctx) return

	const dpr = window.devicePixelRatio || 1
	canvas.width = canvasWidth.value * dpr
	canvas.height = canvasHeight.value * dpr
	ctx.scale(dpr, dpr)

	ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)

	const { x: cropX, y: cropY, width: cropW, height: cropH } = cropRect.value
	const cropCenterX = cropX + cropW / 2
	const cropCenterY = cropY + cropH / 2

	ctx.save()
	ctx.translate(cropCenterX + panX.value, cropCenterY + panY.value)
	ctx.rotate((rotation.value * Math.PI) / 180)
	ctx.scale(zoom.value, zoom.value)
	ctx.drawImage(
		img,
		-img.naturalWidth / 2,
		-img.naturalHeight / 2,
		img.naturalWidth,
		img.naturalHeight
	)
	ctx.restore()

	ctx.save()
	ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'

	ctx.beginPath()
	ctx.rect(0, 0, canvasWidth.value, canvasHeight.value)

	if (props.shape === 'circle') {
		const radius = cropW / 2
		ctx.arc(cropCenterX, cropCenterY, radius, 0, Math.PI * 2, true)
	} else {
		ctx.rect(cropX + cropW, cropY, -cropW, cropH)
	}
	ctx.fill('evenodd')
	ctx.restore()

	ctx.save()
	ctx.lineWidth = 2
	ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'

	ctx.beginPath()
	if (props.shape === 'circle') {
		ctx.arc(cropCenterX, cropCenterY, cropW / 2, 0, Math.PI * 2)
	} else {
		ctx.strokeRect(cropX, cropY, cropW, cropH)
	}
	ctx.stroke()

	if (props.shape !== 'circle') {
		ctx.lineWidth = 1
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
		ctx.setLineDash([4, 4])
		ctx.beginPath()
		ctx.moveTo(cropX + cropW / 3, cropY)
		ctx.lineTo(cropX + cropW / 3, cropY + cropH)
		ctx.moveTo(cropX + (cropW * 2) / 3, cropY)
		ctx.lineTo(cropX + (cropW * 2) / 3, cropY + cropH)
		ctx.moveTo(cropX, cropY + cropH / 3)
		ctx.lineTo(cropX + cropW, cropY + cropH / 3)
		ctx.moveTo(cropX, cropY + (cropH * 2) / 3)
		ctx.lineTo(cropX + cropW, cropY + (cropH * 2) / 3)
		ctx.stroke()
	}
	ctx.restore()
}

function onMouseDown(e: MouseEvent) {
	isDragging.value = true
	dragStart.value = { x: e.clientX - panX.value, y: e.clientY - panY.value }
}

function onMouseMove(e: MouseEvent) {
	if (!isDragging.value) return
	panX.value = e.clientX - dragStart.value.x
	panY.value = e.clientY - dragStart.value.y
	clampPan()
	renderCanvas()
}

function onMouseUp() {
	isDragging.value = false
}

function getTouchDistance(touch1: Touch, touch2: Touch) {
	const dx = touch1.clientX - touch2.clientX
	const dy = touch1.clientY - touch2.clientY
	return Math.sqrt(dx * dx + dy * dy)
}

function onTouchStart(e: TouchEvent) {
	if (e.touches.length === 1) {
		const touch = e.touches[0]
		if (!touch) return
		isDragging.value = true
		dragStart.value = { x: touch.clientX - panX.value, y: touch.clientY - panY.value }
	} else if (e.touches.length === 2) {
		const touch1 = e.touches[0]
		const touch2 = e.touches[1]
		if (!touch1 || !touch2) return
		isDragging.value = false
		initialTouchDistance.value = getTouchDistance(touch1, touch2)
		initialTouchZoom.value = zoom.value
	}
}

function onTouchMove(e: TouchEvent) {
	if (e.touches.length === 1 && isDragging.value) {
		const touch = e.touches[0]
		if (!touch) return
		panX.value = touch.clientX - dragStart.value.x
		panY.value = touch.clientY - dragStart.value.y
		clampPan()
		renderCanvas()
	} else if (e.touches.length === 2 && initialTouchDistance.value) {
		const touch1 = e.touches[0]
		const touch2 = e.touches[1]
		if (!touch1 || !touch2) return
		const dist = getTouchDistance(touch1, touch2)
		const scale = dist / initialTouchDistance.value
		zoom.value = Math.max(minZoom.value, Math.min(maxZoom.value, initialTouchZoom.value * scale))
		clampPan()
		renderCanvas()
	}
}

function onTouchEnd() {
	isDragging.value = false
	initialTouchDistance.value = null
}

function onWheel(e: WheelEvent) {
	e.preventDefault()
	const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92
	const nextZoom = zoom.value * zoomFactor
	zoom.value = Math.max(minZoom.value, Math.min(maxZoom.value, nextZoom))
	clampPan()
	renderCanvas()
}

function onZoomChange(val: number | undefined) {
	if (val === undefined || isNaN(val)) return
	zoom.value = val
	clampPan()
	renderCanvas()
}

function rotate90() {
	if (!imgElement.value) return

	const prevMin = minZoom.value
	const wasAtMinZoom = Math.abs(zoom.value - prevMin) < 0.001
	const prevZoomRatio = prevMin > 0 ? zoom.value / prevMin : 1

	rotation.value = (rotation.value + 90) % 360

	const newMin = minZoom.value
	if (wasAtMinZoom) {
		zoom.value = newMin
	} else {
		zoom.value = Math.max(newMin, Math.min(maxZoom.value, newMin * prevZoomRatio))
	}

	const prevPanX = panX.value
	const prevPanY = panY.value
	panX.value = -prevPanY
	panY.value = prevPanX

	clampPan()
	renderCanvas()
}

function zoomIn() {
	zoom.value = Math.min(maxZoom.value, zoom.value * 1.15)
	clampPan()
	renderCanvas()
}

function zoomOut() {
	zoom.value = Math.max(minZoom.value, zoom.value * 0.85)
	clampPan()
	renderCanvas()
}

async function applyCrop() {
	const img = imgElement.value
	if (!img || !isImageLoaded.value) return

	const { width: cropW, height: cropH } = cropRect.value

	let outW = props.targetWidth
	let outH = props.targetHeight

	if (!outW || !outH) {
		if (props.shape === 'circle' || props.aspectRatio === 1) {
			outW = 512
			outH = 512
		} else if (Math.abs(props.aspectRatio - 7 / 2) < 0.1) {
			outW = 1400
			outH = 400
		} else {
			outW = Math.round(cropW * 2)
			outH = Math.round(cropH * 2)
		}
	}

	const outCanvas = document.createElement('canvas')
	outCanvas.width = outW
	outCanvas.height = outH
	const outCtx = outCanvas.getContext('2d')
	if (!outCtx) return

	const scaleRatio = outW / cropW

	outCtx.save()
	outCtx.translate(outW / 2 + panX.value * scaleRatio, outH / 2 + panY.value * scaleRatio)
	outCtx.rotate((rotation.value * Math.PI) / 180)
	outCtx.scale(zoom.value * scaleRatio, zoom.value * scaleRatio)
	outCtx.drawImage(
		img,
		-img.naturalWidth / 2,
		-img.naturalHeight / 2,
		img.naturalWidth,
		img.naturalHeight
	)
	outCtx.restore()

	const mimeType = props.outputType || 'image/webp'
	outCanvas.toBlob(
		(blob) => {
			if (!blob) return

			let name = props.fileName || 'cropped-image.webp'
			if (!name.endsWith('.webp') && mimeType === 'image/webp') {
				name = name.replace(/\.[^/.]+$/, '') + '.webp'
			}

			const file = new File([blob], name, { type: mimeType })
			const previewUrl = URL.createObjectURL(blob)

			emit('crop', file, previewUrl)
			isOpen.value = false
		},
		mimeType,
		0.92
	)
}

function onCancel() {
	revokeSourceObjectUrl()
	emit('cancel')
	isOpen.value = false
}

onBeforeUnmount(() => {
	revokeSourceObjectUrl()
})

watch(
	() => [isOpen.value, props.imageSource],
	([open]) => {
		if (open) {
			nextTick(() => {
				if (containerRef.value) {
					const rect = containerRef.value.getBoundingClientRect()
					if (rect.width > 0) {
						canvasWidth.value = Math.min(540, Math.round(rect.width))
						canvasHeight.value = Math.min(380, Math.round(rect.width * 0.7))
					}
				}
				loadImage()
			})
		} else {
			revokeSourceObjectUrl()
		}
	},
	{ immediate: true }
)
</script>

<template>
	<UModal
		v-model:open="isOpen"
		:title="title"
		:description="description"
		:ui="{
			content: 'sm:max-w-xl p-6!',
			header: 'border-none pb-2'
		}"
	>
		<template #body>
			<div class="flex flex-col gap-5 select-none">
				<!-- Canvas Viewport -->
				<div
					ref="containerRef"
					class="relative flex w-full items-center justify-center overflow-hidden rounded-xl border border-default bg-neutral-950/80 shadow-inner"
					:style="{ height: `${canvasHeight}px` }"
				>
					<canvas
						ref="canvasRef"
						:style="{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }"
						class="cursor-grab active:cursor-grabbing touch-none"
						@mousedown="onMouseDown"
						@mousemove="onMouseMove"
						@mouseup="onMouseUp"
						@mouseleave="onMouseUp"
						@touchstart.passive="onTouchStart"
						@touchmove.passive="onTouchMove"
						@touchend="onTouchEnd"
						@wheel="onWheel"
					/>

					<div
						v-if="!isImageLoaded"
						class="absolute inset-0 flex items-center justify-center bg-neutral-950/70"
					>
						<UIcon name="lucide:loader-2" class="size-8 animate-spin text-dimmed" />
					</div>
				</div>

				<!-- Tool Controls -->
				<div class="flex flex-col gap-3">
					<!-- Zoom Slider & Buttons -->
					<div class="flex items-center gap-3">
						<UButton
							type="button"
							size="xs"
							color="neutral"
							variant="soft"
							icon="lucide:zoom-out"
							aria-label="Zoom out"
							@click="zoomOut"
						/>
						<USlider
							:model-value="zoom"
							:min="minZoom"
							:max="maxZoom"
							:step="Math.max(0.001, (maxZoom - minZoom) / 200)"
							aria-label="Zoom"
							class="flex-1"
							@update:model-value="onZoomChange"
						/>
						<UButton
							type="button"
							size="xs"
							color="neutral"
							variant="soft"
							icon="lucide:zoom-in"
							aria-label="Zoom in"
							@click="zoomIn"
						/>
					</div>

					<!-- Quick actions: Rotate & Reset -->
					<div class="flex items-center justify-between border-t border-default/60 pt-3">
						<div class="flex items-center gap-2">
							<UButton
								type="button"
								size="sm"
								color="neutral"
								variant="subtle"
								icon="lucide:rotate-cw"
								label="Rotate 90°"
								@click="rotate90"
							/>
							<UButton
								type="button"
								size="sm"
								color="neutral"
								variant="ghost"
								icon="lucide:rotate-ccw"
								label="Reset"
								@click="resetTransform(); renderCanvas();"
							/>
						</div>

						<div class="flex items-center gap-2">
							<UButton
								type="button"
								color="neutral"
								variant="ghost"
								label="Cancel"
								@click="onCancel"
							/>
							<UButton
								type="button"
								color="primary"
								icon="lucide:check"
								label="Apply Crop"
								:disabled="!isImageLoaded"
								@click="applyCrop"
							/>
						</div>
					</div>
				</div>
			</div>
		</template>
	</UModal>
</template>
