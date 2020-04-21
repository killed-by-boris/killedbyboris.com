const fs = require('fs')
const showdown = require('showdown')
const converter = new showdown.Converter()

var body = fs.readFileSync('./build-scripts/FAQ.html.template', 'utf8')
var markdown = fs.readFileSync('./FAQ.md', 'utf8')
var html = converter.makeHtml(markdown)

body = body.replace('<div>', html)
fs.writeFileSync('./public/FAQ.html', body)
