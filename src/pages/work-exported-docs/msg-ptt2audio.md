---
layout: '~/layouts/WorkExportedDocs.astro'
title: "PTT转Audio"
---

# PTT转Audio

`POST` `https://api.voischat.cn/v2/corpapi/msg/ptt2audio`

状态：**开发中**

**Query 参数**

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
| --- | --- | --- | --- | --- |
| `appid` | string | 是 | - | `kCRXXYUd6h3p` |
| `sign` | string | 是 | - | `4d1705d1db0d1e4ee79e4a6c4959e657` |
| `et` | string | 是 | - | `1795664919` |

**请求 Body**

```jsonc
{
    "url":"https://cdn.voischat.cn/weilacache/aud/corp/g/81000926/1795670995_3.ptt?duration=3", "format":"mp3"
}
```

**成功（200）**

```jsonc
{
	"errcode": 0,
	"errmsg": "请求成功",
	"data": {
		"url": "https://cdn.voischat.cn/weilacache/tmp/2026-11-26/1795680837_b204e980.mp3"
	}
}
```
