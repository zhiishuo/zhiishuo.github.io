# Zhishuo Personal Homepage

A bilingual (Chinese/English) personal homepage ready for GitHub Pages.

## Local preview

```bash
cd /Users/zzs/.openclaw/workspace
python3 -m http.server 8080
# open http://127.0.0.1:8080
```

## Deploy to GitHub Pages (recommended: user site)

For username `zhishuo`, create repo: `zhishuo.github.io`, then:

```bash
# from this folder
cd /Users/zzs/.openclaw/workspace

git init
git add .
git commit -m "feat: launch bilingual personal homepage"
git branch -M main
git remote add origin git@github.com:zhishuo/zhishuo.github.io.git
git push -u origin main
```

Your website will be:

- https://zhishuo.github.io

## Customize quickly

- `index.html`: content blocks
- `styles.css`: visual style
- `script.js`: language switch content

