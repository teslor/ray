const defaultValues = {
  mainFont: 'Roboto',
  baseFontSize: '18 px',
  fontColor: '#070707',
  backgroundColor: '#fafdff'
}

const renderHtml = function (source, options) {
  let result = source
  Object.keys(options).forEach(key => {
    result = result.replace(new RegExp(`{{ ${key} }}`, 'g'), options[key])
  })
  return result
}

export {
  defaultValues,
  renderHtml
}
