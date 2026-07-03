const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("M3U8 Proxy is running.");
});

app.use("/proxy", (req, res, next) => {
  const target = req.query.url;

  if (!target) {
    return res.status(400).send("Missing ?url=");
  }

  return createProxyMiddleware({
    target,
    changeOrigin: true,
    secure: false,
    pathRewrite: () => "",
    router: () => target,
    onProxyRes(proxyRes, req, res) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");
    }
  })(req, res, next);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
