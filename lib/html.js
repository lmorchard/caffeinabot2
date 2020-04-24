module.exports = {
  html: ({ head = '', body = '' }) => `<!DOCTYPE html>
    <html>
      <head>
        ${head}
      </head>
      <body>
        ${body}
      </body>
    </html>
  `
}