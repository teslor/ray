// Do required updates in HTML when opening file
const processHtml = (source) => {
  const keyString = '<main class="ray'
  const b1 = source.indexOf(keyString)
  if (b1 < 0) return { data: source, dataType: '' } // file was not created in Ray
  const b2 = source.lastIndexOf('</main>')

  const dataType = source[b1 + keyString.length + 1]
  if (!['b','c'].includes(dataType)) return { data: null, dataType: '' } // wrong data type (probably file was manually modified)

  let data = source.substring(source.indexOf('>', b1) + 1, b2)
  if (dataType === 'b') { // file created in Ray v0.2.1 - v0.3.1
    // font family conversion
    data = data.replaceAll('class="ql-font-serif"', 'style="font-family: Times New Roman"')
    data = data.replaceAll('class="ql-font-monospace"', 'style="font-family: Courier New"')
    // font size conversion
    data = data.replaceAll('class="ql-size-small"', 'data-font-size="sm"')
    data = data.replaceAll('class="ql-size-large"', 'data-font-size="lg"')
    // text align conversion
    data = data.replaceAll('class="ql-align-center"', 'style="text-align: center"')
    data = data.replaceAll('class="ql-align-right"', 'style="text-align: right"')
    data = data.replaceAll('class="ql-align-justify"', 'style="text-align: justify"')
    // text highlight conversion
    data = data.replace(/<span( style="background-color.+>.*?)<\/span>/g,'<mark$1</mark>')
    // place <img> outside <p>
    data = data.replace(/<p>(<img src="[\w:;,+/=]+?">)<\/p>/g,'$1')
    // remove <br> when there is no other content in the element
    data = data.replace(/<(\w+)(\s[^<>]+?>|>)<br><\/\1>/g,'<$1$2</$1>')
  }
  return { data, dataType }
}

// Do required updates in HTML when saving file
const generateHtml = (source, options) => {
  let result = source
  Object.keys(options).forEach(key => {
    result = result.replace(RegExp(`{{ ${key} }}`, 'g'), options[key])
  })
  return result
}

const findStyleSheet = (selector) => {
  for (let i = document.styleSheets.length - 1; i >= 0; i--) {
    for (let j = document.styleSheets[i].cssRules.length - 1; j >= 0; j--) {
      if (document.styleSheets[i].cssRules[j]?.selectorText === selector) return document.styleSheets[i]
    }
  }
}

const getCssRuleText = (styleSheet, selector) => {
  for (let i = styleSheet.cssRules.length - 1; i >= 0; i--) {
    const rule = styleSheet.cssRules[i]
    if (rule.selectorText === selector) return rule.cssText.replace(/\s{2,}|\n/g, ' ')
  }
}

const unProxy = (obj) => {
  return JSON.parse(JSON.stringify(obj))
}

const isImageUrl = (url) => {
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp']
  for (const ext of imageExtensions) {
    if (url.endsWith(ext)) return true
  }
  return false
}

const getFileErrorInfo = (msg) => {
  if (msg.includes('ENOENT')) return 'File doesn\'t exist.'
  if (msg.includes('EEXIST')) return 'File already exists.'
  if (msg.includes('EPERM')) return 'No permissions.'
  if (msg.includes('EACCES')) return 'Permission denied.'
  if (msg.includes('ENOSPC')) return 'No space left on device.'
  if (msg.includes('auth')) return 'Wrong password.'
  return ''
}

export {
  processHtml,
  generateHtml,
  findStyleSheet,
  getCssRuleText,
  unProxy,
  isImageUrl,
  getFileErrorInfo
}
