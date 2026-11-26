---
layout: '~/layouts/WorkExportedDocs.astro'
title: "获取群历史消息"
---

# 获取群历史消息

`POST` `https://api.voischat.cn/v2/corpapi/msg/get-group-history-msg`

状态：**已完成**

**Query 参数**

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
| --- | --- | --- | --- | --- |
| `appid` | string | 是 | 企业接口APPId,提供企业Number给微喇客服创建AppId与AppKey | `kCRXXYUd6h3p` |
| `sign` | string | 是 | Unix时间戳 | `4d1705d1db0d1e4ee79e4a6c4959e657` |
| `et` | string | 是 | 接口鉴权签名,生成规则 md5(et+appkey) | `1795664919` |

**请求 Body**

```jsonc
{
	"group_id": 81000926, // 群ID
	"date": "2026-11-26" // 日期
}
```

**成功（200）**

```jsonc
{
	"errcode": 0,
	"errmsg": "请求成功",
	"data": {
		"messages": [
			{
				"msg_id": 1795671000,
				"user_id": 1255059,
				"created": 1795671176,
				"type": 0,
				"content": "[微笑]"
			},
			{
				"msg_id": 1795670999,
				"user_id": 1255059,
				"created": 1795671167,
				"type": 6,
				"content": {
					"address": "",
					"image": "https://cdn.voischat.cn/weilacache/tmp/2026-11-26/1795671167_4bf4f8eb.png",
					"latitude": "22.543099",
					"longitude": "114.057868",
					"name": ""
				}
			},
			{
				"msg_id": 1795670998,
				"user_id": 1255059,
				"created": 1795671157,
				"type": 2,
				"content": {
					"image": "https://cdn.voischat.cn/weilacache/tmp/2026-11-26/1795671157_19dbfa85.mp4?x-oss-process=video/snapshot,t_0,f_jpg,m_fast,w_320,ar_auto",
					"video_name": "test.mp4",
					"video_size": "652870",
					"video_url": "https://cdn.voischat.cn/weilacache/tmp/2026-11-26/1795671157_19dbfa85.mp4"
				}
			},
			{
				"msg_id": 1795670997,
				"user_id": 1255059,
				"created": 1795671077,
				"type": 4,
				"content": {
					"file_name": "cdn.pcap",
					"file_size": "10235",
					"file_url": "https://cdn.voischat.cn/weilacache/tmp/2026-11-26/1795671077_687c7754.pcap",
					"image": "https://weilaavatar.oss-cn-shenzhen.aliyuncs.com/file/UNKOWN.png"
				}
			},
			{
				"msg_id": 1795670996,
				"user_id": 1255059,
				"created": 1795671066,
				"type": 1,
				"content": {
					"image": "https://cdn.voischat.cn/weilacache/tmp/2026-11-26/1795671066_0775f094.png"
				}
			},
			{
				"msg_id": 1795670995,
				"user_id": 1255059,
				"created": 1795671057,
				"type": 3,
				"content": {
					"duration": 3,
					"url": "https://cdn.voischat.cn/weilacache/aud/corp/g/81000926/1795670995_3.ptt?duration=3"
				}
			},
			{
				"msg_id": 1795670994,
				"user_id": 1255059,
				"created": 1795670994,
				"type": 0,
				"content": "123"
			}
		]
	}
}
```

**响应字段**

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `errcode` | number | 是 | - |
| `errmsg` | string | 是 | 返回文字描述 |
| `data` | object | 是 | 返回数据 |
| `data.messages` | array | 是 | - |
| `data.messages.msg_id` | number | 是 | 消息ID |
| `data.messages.user_id` | number | 是 | 发送者用户ID |
| `data.messages.created` | number | 是 | 发送 |
| `data.messages.type` | number | 是 | 消息类型0文本消息、1图片消息、2视频消息、3语音消息、4文件消息、6位置消息 |
| `data.messages.content` | string | 是 | - |
| `data.messages.content.address` | string | 是 | 位置消息地址 |
| `data.messages.content.image` | string | 是 | 图片消息 |
| `data.messages.content.latitude` | string | 是 | 位置纬度 |
| `data.messages.content.longitude` | string | 是 | 位置经度 |
| `data.messages.content.name` | string | 是 | 位置消息名称 |
| `data.messages.content.video_name` | string | 是 | 视频名称 |
| `data.messages.content.video_size` | string | 是 | 视频大小 |
| `data.messages.content.video_url` | string | 是 | 视频url |
| `data.messages.content.file_name` | string | 是 | 文件 |
| `data.messages.content.file_size` | string | 是 | 文件大小 |
| `data.messages.content.file_url` | string | 是 | 文件url |
| `data.messages.content.duration` | number | 是 | 语音时长 |
| `data.messages.content.url` | string | 是 | 语音url |

**失败（404）**

```jsonc
{
	"errcode": 45008,
	"errmsg": "用户不是企业成员"
}
```
