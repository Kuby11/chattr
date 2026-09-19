import z from "zod"
import { formatBytes } from "@shared/utils"

const MAX_FILE_SIZE = 6 * 1024 * 1024
const MIN_DIMENSIONS = { width: 200, height: 200 }
const MAX_DIMENSIONS = { width: 4096, height: 4096 }
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export const profileSettingsSchema = z.object({
	nickname: z
		.string()
		.max(30, "nickname can be only 30 characters long!")
		.min(3, "nickname should be at least 3 characters long!")
		.optional(),
	bio: z
		.string()
		.max(200, "bio can be only 200 characters long!")
		.optional()
		.nullable(),
	avatar: z
		.instanceof(File, { 
			message: 'please select a image file'
		})
		.refine((file) => file.size <= MAX_FILE_SIZE, {
      message: `The image is too large. Please choose an image smaller than ${formatBytes(MAX_FILE_SIZE)}.`
    })
		.refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), {
      message: 'Please upload a valid image file (JPEG, PNG, or WebP).'
    })
		.refine(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
              const meetsDimensions =
                img.width >= MIN_DIMENSIONS.width &&
                img.height >= MIN_DIMENSIONS.height &&
                img.width <= MAX_DIMENSIONS.width &&
                img.height <= MAX_DIMENSIONS.height
              resolve(meetsDimensions)
            }
            img.src = e.target?.result as string
					}
          reader.readAsDataURL(file)
        }),
      {
        message: `The image dimensions are invalid. Please upload an image between ${MIN_DIMENSIONS.width}x${MIN_DIMENSIONS.height} and ${MAX_DIMENSIONS.width}x${MAX_DIMENSIONS.height} pixels.`
      }
    )
		.optional(),
	coverPicture: z
		.instanceof(File, { 
			message: 'please select an image file'
		})
		.refine((file) => file.size <= MAX_FILE_SIZE, {
			message: `The image is too large. Please choose an image smaller than ${formatBytes(MAX_FILE_SIZE)}.`
		})
		.refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), {
			message: 'Please upload a valid image file (JPEG, PNG, or WebP).'
		})
		.optional()
})

export type ProfileSettingsSchema = z.infer<typeof profileSettingsSchema>
