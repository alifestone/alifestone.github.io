---
title: Hello, debug.log — 第一篇文章與 Markdown 範本
date: 2026-07-12
category: 機器人
tags: [meta, markdown, 範本]
excerpt: 部落格開站的第一篇，順便當作 Markdown 撰寫範本——示範標題、清單、引言、程式碼、表格與圖片怎麼寫。
readMin: 4
---

歡迎來到 **debug.log**。這篇文章同時是開站宣言，也是一份 Markdown 撰寫範本：之後每寫一篇新文章，只要在 `src/content/posts/` 底下新增一個 `.md`、填好上面的 frontmatter，Astro 就會自動產生對應頁面。下面把 `.prose` 支援的元素都示範一遍。

## 標題與段落

用 `##` 開一個 h2、`###` 開 h3。段落之間空一行即可。行內可以用 `` `inline code` ``、**粗體**、*斜體*，或放一個[連結](/about/)。

### 這是 h3

h3 適合放在 h2 底下當小節。上面的目錄（TOC）會自動列出所有 h2 / h3。

## 清單

無序清單：

- 收資料時多花一小時做品質檢查
- 訓練時就少浪費一整晚
- `success_rate` 比 loss 更值得盯

有序清單：

1. 收集示範資料
2. 微調模型
3. 評估結果

## 引言

> 經驗法則：能重播的 exploit 才算 exploit，能重現的實驗才算實驗。

## 程式碼區塊

行內 `code` 之外，三個反引號可以開一個程式碼區塊，會套用像素風的深色外框：

```bash
$ python lerobot/scripts/train.py \
    --policy.path=lerobot/smolvla_base \
    --dataset.repo_id=bitolog/grasp_transparent \
    --steps=20000
# success_rate: 0.12 → 0.74 ✔
```

```python
def clip_objective(ratio, adv, eps=0.2):
    unclipped = ratio * adv
    clipped = ratio.clamp(1 - eps, 1 + eps) * adv
    return -torch.min(unclipped, clipped).mean()
```

## 表格

| 設定 | 成功率 | 平均耗時 |
|---|---|---|
| base（zero-shot） | 12% | — |
| 微調 @ 10k steps | 58% | 9.4s |
| 微調 @ 20k steps | **74%** | 7.1s |

## 圖片

內文引用圖片用相對路徑 `![alt](./xxx.png)`，圖片放在文章旁邊或 `src/assets/`，Astro build 時會自動最佳化。這裡先用一個範例（若圖片不存在，換成你自己的檔名即可）：

<!-- 範例：![機械手臂抓透明杯](./cover.png) -->

---

以上就是全部常用元素。想新增文章時，複製這個檔案改內容就好；想改 tag，直接編輯 frontmatter 的 `tags` 陣列。下一篇見。
