const http = require('http');
const url = require('url');
const fs = require('fs');
const qs = require('querystring');

const template_list = (files) => {
  let list = '<ul>';
  list += files
    .map(
      (file) =>
        ` <li><a href="javascript:return false;" onclick="location.href='/?id=${file}'">${file}</a></li>`
    )
    .join('');
  list += '</ul>';
  return list;
};

const template_html = (title, list, des, additionalData) =>
  `      <!DOCTYPE html>
<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>

    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>KOIN-${title}</title>
</head>
<body>
    <a href='/'><h1>자유게시판</h1></a>
    <h2>${title}</h2>
    ${list}
    <p>
    ${des}
    </p>
    ${additionalData}
</body>
</html>`;

const app = http.createServer((req, res) => {
  const queryId = url.parse(req.url, true).query.id;
  const pathname = url.parse(req.url, true).pathname;

  let list;
  let template;

  console.log(pathname);
  if (pathname === '/') {
    if (queryId === undefined) {
      //Home
      fs.readdir('./datas', 'utf-8', (err, files) => {
        list = template_list(files);
        template = template_html(
          'HOME',
          list,
          '내 자유게시판에 온걸 환영합니다',
          `<a href='/create'>글 생성</a>`
        );
        res.writeHead(200);
        res.end(template);
      });
    } else {
      //게시판 목록
      fs.readdir('./datas', 'utf8', (err, files) => {
        list = template_list(files);
      });
      fs.readFile(`./datas/${queryId}`, 'utf8', (err, data) => {
        template = template_html(
          queryId,
          list,
          data,
          `<a href='/create'>글 생성</a> <a href='/update?id=${queryId}'>글 수정</a> <a href='/delete?id=${queryId}'>글 삭제</a>`
        );
        res.writeHead(200);
        res.end(template);
      });
    }
  } else if (pathname === '/create') {
    //Create 페이지
    fs.readdir('./datas', 'utf-8', (err, files) => {
      list = template_list(files);
      template = template_html(
        '글 생성',
        list,
        `
    <form action="/create-process" method="POST">
        <p><input type="text" name="title" /></p>
        <p><textarea name="description"></textarea></p>
        <input type="submit" />
    </form>
      `,
        ''
      );
      res.writeHead(200);
      res.end(template);
    });
  } else if (pathname === '/create-process') {
    let body = '';

    req.on('data', function (data) {
      body += data;
    });

    req.on('end', function () {
      var post = qs.parse(body);
      const title = post.title;
      const description = post.description;
      fs.writeFile(`./datas/${title}`, description, (err) => {
        res.writeHead(302, {
          Location: encodeURI(`/?id=${title}`),
        });
        res.end();
      });
    });
  } else if (pathname === '/update') {
    // update 페이지
    fs.readFile(`./datas/${queryId}`, 'utf8', (err, data) => {
      fs.readdir('./datas', 'utf-8', (err, files) => {
        list = template_list(files);
        template = template_html(
          '글 수정',
          list,
          `
      <form action="/update-process" method="POST">
            <input type="hidden" name="origin" value=${queryId} />
          <p><input type="text" name="title" value=${queryId} /></p>
          <p><textarea name="description">${data}</textarea></p>
          <input type="submit" />
      </form>
        `,
          ''
        );
        res.writeHead(200);
        res.end(template);
      });
    });
  } else if (pathname === '/update-process') {
    let body = '';

    req.on('data', function (data) {
      body += data;
    });

    req.on('end', function () {
      var post = qs.parse(body);
      const origin = post.origin;
      const title = post.title;
      const description = post.description;
      fs.rename(`./datas/${origin}`, `./datas/${title}`, () => {
        fs.writeFile(`./datas/${title}`, description, (err) => {
          res.writeHead(302, {
            Location: encodeURI(`/?id=${title}`),
          });
          res.end();
        });
      });
    });
  } else if (pathname === '/delete') {
    fs.unlink(`./datas/${queryId}`, (err) => {
      res.writeHead(302, {
        Location: '/',
      });
      res.end();
    });
  } else {
    res.writeHead(404);
    res.end('NOT FOUND');
  }
});
app.listen(3000);
