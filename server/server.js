const Express = require('express');
const compression = require('compression');
const express = require('express');
const path = require('path');
const http = require('http');
const request = require('request');
const fs = require('fs');
const uuidv4 = require('uuid/v4');

const app = new Express(); // app
const server = new http.Server(app); // 服务器

const obj = {
  'index.html': fs.readFileSync('./html/index.html', 'utf8'),
  'index1.html': fs.readFileSync('./html/index1.html', 'utf8'),
  'index2.html': fs.readFileSync('./html/index2.html', 'utf8'),
  'index4.html': fs.readFileSync('./html/index4.html', 'utf8'),
  'index5.html': fs.readFileSync('./html/index5.html', 'utf8'),
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
const filePath = './server/accounts.js';
const busyTips = `<h1 style="position: fixed; top: 38.2%;left: 0%;width: 100%;text-align: center;font-size: 40px;">系统繁忙，请刷新重试！</h1>`
const errUrlTips = `<h1 style="position: fixed; top: 38.2%;left: 0%;width: 100%;text-align: center;font-size: 40px;">你访问的地址不存在，请检查您的url。</h1>`
const disabledTips = `<h1 style="position: fixed; top: 38.2%;left: 0%;width: 100%;text-align: center;font-size: 40px;">您的二维码已失效！请及时联系微信号：chenjianwei140182。</h1>`
function read() {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, function (err, data) {
       if (err) {
           setTimeout(() => {
             fs.readFile(filePath, function (err, data) {
                if (err) {
                    reject();
                } else {
                  resolve(JSON.parse(data.toString()));
                }
             });
           }, 100);
       } else {
         resolve(JSON.parse(data.toString()));
       }
    });
  })
}
function write(str) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, str, function(err) {
       if (err) {
         fs.writeFile(filePath, str, function(err) {
            if (err) {
              reject();
            } else {
              resolve();
            }
         });
       } else {
         resolve();
       }
    });
  })
}
// 同构
app.use((req, res) => {
  const query = req.query;
  if (query.admin === 'chenjianwei' && (parseFloat(query.hours) > 0 || parseFloat(query.num) > 0)) {
    const max = isNaN(parseFloat(query.hours)) ? undefined : parseFloat(query.hours) * 3600000 + new Date().getTime();
    const numbers = isNaN(parseFloat(query.num)) ? undefined : parseFloat(query.num);
    // 异步读取
    read().then(json => {
      const id = uuidv4();
      json[id]= {maxTime: max, numbers: numbers, nowNumber: 0};
      write(JSON.stringify(json)).then(() => {
        res.send(`<h1 style="position: fixed; top: 38.2%;left: 0%;width: 100%;text-align: center;font-size: 40px;">http://laozhao-tech.top/${id}/index.html</h1>`);
      }).catch(() => {
        res.send(busyTips);
      })
    }).catch(err => {
      res.send(busyTips);
    });
    return;
  }
  const pathArr = req._parsedUrl.pathname.substr(1).split('/');
  const userId = pathArr[0];
  const pathKey = pathArr[1];
  if (userId && pathKey) {
    read().then(json => {
      if (!json[userId]) {
        res.send(errUrlTips);
        return;
      }
      const timestamp = new Date().getTime();
      const max = json[userId].maxTime;
      const numbers = json[userId].numbers;
      const nowNumber = json[userId].nowNumber;
      const timeFlag = max ? max > timestamp : false;
      const numFlag = numbers ? numbers > nowNumber : false;
      const timeAndNumFlg = max || numbers;
      if (!timeAndNumFlg) {
        // 没有次数和时间
        res.send(errUrlTips);
      } else if (pathKey === 'index.html' && timeAndNumFlg && timeFlag && numFlag) {
        // 记次数：有次数，有时间，
        json[userId].nowNumber = nowNumber + 1;
        write(JSON.stringify(json)).then(() => {
          res.send(obj[pathKey]);
        }).catch(err => {
          res.send(busyTips);
        });
      } else if (pathKey === 'index.html' && timeAndNumFlg && !max && !timeFlag && numFlag) {
        // 记次数：无时间，有次数
        json[userId].nowNumber = nowNumber + 1;
        write(JSON.stringify(json)).then(() => {
          res.send(obj[pathKey]);
        }).catch(err => {
          res.send(busyTips);
        });
      } else if ((timeAndNumFlg && timeFlag && numFlag) || (timeAndNumFlg && !max && !timeFlag && numFlag) || (timeAndNumFlg && timeFlag && !numbers && !numFlag)) {
        // 不记次数
        // 1，有时间也有次数
        // 2，有次数无时间
        // 3，无次数有时间
        res.send(obj[pathKey]);
      } else {
        res.send(disabledTips);
      }
    }).catch(() => {
      res.send(busyTips);
    })
  } else {
    res.send(errUrlTips);
  }
});
// 提供端口，及打印错误信息
server.listen(80, (err) => {
  if (err) {
    console.error(err);
  }
  console.info('----\n==>  ✅  3012 is running,');
});


