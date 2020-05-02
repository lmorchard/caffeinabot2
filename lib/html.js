const html = (strings, ...values) =>
  strings.reduce(
    (result, string, i) => result + string + (values[i] ? values[i] : ''),
    ''
  );

const htmlPage = (...args) => {
  const body = args.pop() || '';
  const head = args.pop() || '';
  return html`
    <!DOCTYPE html>
    <html>
      <head>
        ${head}
        <script src="/reload/reload.js"></script>
      </head>
      <body>
        ${body}
      </body>
    </html>
  `;
};

module.exports = {
  html,
  htmlPage,
};
