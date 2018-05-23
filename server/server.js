const Express = require('express');
const compression = require('compression');
const express = require('express');
const path = require('path');
const http = require('http');
const request = require('request');
const fs = require('fs');

const app = new Express(); // app
const server = new http.Server(app); // 服务器

const obj = {
  '/index.html': fs.readFileSync('./html/index.html', 'utf8'),
  '/index1.html': fs.readFileSync('./html/index1.html', 'utf8'),
  '/index2.html': fs.readFileSync('./html/index2.html', 'utf8'),
  '/index4.html': fs.readFileSync('./html/index4.html', 'utf8'),
  '/index5.html': fs.readFileSync('./html/index5.html', 'utf8'),
};

app.use(compression()); // 压缩响应体
// 加载静态资源
// app.use(favicon(path.join(__dirname, '..', 'static', 'favicon.ico')));
app.use(Express.static(path.join(__dirname, '..', 'static')));
// app.use(Express.static(path.join(__dirname, '..', 'static'), {
  // setHeaders: function(res) {
  //   const now = new Date();
  //   const year = now.getFullYear() + 2;
  //   now.setFullYear(year);
  //   const Expires = now.toGMTString();
  //   res.set('Expires', Expires);
  //   res.set('cache-control', 'max-age=63072000');
  // }
// }));
// 代理转发，解决跨域问题
app.use('/proxy', (req, res) => {
  // const targetUrl = 'http://s.gov.test.qsntzjk.com';
  const targetUrl = '';
  pipe(req, res, targetUrl);
});
const pipe = (req, res, targetUrl) => {
  const url = targetUrl + req.url;
  console.info('==> ✅ talking to API server on %s', url);
  req.pipe(request(url)).pipe(res);
};
// 同构
app.use((req, res) => {
  const query = req.query;
  if (query.admin === 'chenjianwei' && parseFloat(query.hours) > 0) {
    const perHour = 3600000;
    const max = parseFloat(query.hours) * perHour + new Date().getTime();
    const maxtemp = (max - 1527000000000) * 3;
    const c1 = String.fromCharCode(maxtemp % 135);
    res.send(`http://laozhao-tech.top:3012/index.html?c1=${c1}&max=${maxtemp}`);
    return;
  }
  if (query.c1 && query.max) {
    const c1 = decodeURIComponent(query.c1);
    const istime = (((query.max) / 3) % 1 === 0);
    const isChar = (String.fromCharCode((query.max) % 135) === c1);
    if (istime && isChar) {
      const data = obj[req._parsedUrl.pathname];
      res.send(data);
      return;
    }
    res.send(`<h1 style="position: fixed; top: 38.2%;left: 0%;width: 100%;text-align: center;">您的二维码已失效！请及时联系微信号：chenjianwei140182。</h1>`);
    return;
  }
  res.send(`<h1 style="position: fixed; top: 38.2%;left: 0%;width: 100%;text-align: center;">您的二维码已失效！请及时联系微信号：chenjianwei140182。</h1>`);
  // console.log(req.query);
  // console.log(req._parsedUrl.pathname);
  // const data = fs.readFileSync('./html/index1.html', 'utf8');
  // res.send(data);
});
// 提供端口，及打印错误信息
server.listen(3012, (err) => {
  if (err) {
    console.error(err);
  }
  console.info('----\n==>  ✅  3012 is running,');
});


