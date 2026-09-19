<template>
  <UError
    redirect="/"
    :error="{
      statusCode: 404,
      statusMessage: 'Page not found',
      message: 'The page you are looking for does not exist.'
    }"
		:ui="{ statusCode: 'sm:text-8xl text-5xl' }"
  />
</template>
