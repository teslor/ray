const base =
`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{{ title }}</title>
<style>
{{ styleBase }}
{{ styleMain }}
{{ styleExtra }}
</style>
</head>
<body>
<main class="ray-b">
{{ contents }}
</main>
</body>
</html>`

export {
  base
}
