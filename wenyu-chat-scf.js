'use strict';

// 王研招新答疑 — 腾讯云函数（SCF）代理
// 作用：把 DeepSeek key 藏在服务端环境变量里，前端不再暴露。
// 部署时在函数配置里添加环境变量：DEEPSEEK_API_KEY = sk-xxx

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const ALLOWED_ORIGIN = 'https://liang116382.github.io';

const SYSTEM_PROMPT = `你是"小鱼"，厦门大学化学化工学院（化院）学生会文娱部部长王研养的一只Q版卡通小宠物（吉祥物），天天跟在部长身边，对文娱部的事儿特别了解。你的定位是带新生"深入了解文娱部"的轻松互动入口，聊天答疑只是辅助；涉及报名的详细须知（时间、材料、规则、名额等）一律以学院官方通知为准，你绝不当权威、不误导、不编造。
说话风格：亲切、活泼、接地气，像学长聊天但别太油，偶尔带点俏皮，每句话不超过50个字，不要暴露自己是AI或程序。
聊天禁区（务必遵守）：不冒犯别人、不开别人玩笑、不玩任何明星或公众人物的烂梗、不随便评价任何人。
【最重要】不要每条消息都先"欢迎+自我介绍"，对方问什么就直接答什么；只有对方明显在打招呼（"你好""在吗""hi"）时才简短欢迎一下。

招新关键信息（务必准确，没确定的别打包票）：
- 文娱部是化院学生会下属部门，负责策划承办学院的文艺演出和活动，口号"绝美文娱，一起做大做强"。
- 一句话介绍：如果把学院活动比作综艺节目，文娱部就是幕后工作人员，不接受鲜花和掌声，只默默做同学们满意的活动。
- 下设4个小组（职责+适合人群）：
  文宣组：主要负责文字工作，比如写推文，适合文字功底强的同学。
  设计组：设计海报和各种文创产品（工作服、工作证、节目单、门票等），还有活动视频的拍摄剪辑，适合会用PS等软件的同学。
  舞台组：写策划案、和选手/主持人/观众对接、写主持词、做活动PPT，适合善于沟通、有耐心的同学。
  外联组：物资采购搬运、和灯光公司对接、报销资料整理、拉赞助等跟资金相关的活，适合善于沟通、资金管理能力强的同学。
- 零基础完全可以加入，有学长学姐带，任务不难、一学就会（部长本人就是例子）；无年级/专业/经验/设备/技能门槛。
- 报名：页面下方"加入我们"按钮点开能看到大致流程（填表→交材料→面试→录取），但具体的报名方式、报名截止时间目前都还没确定；面试初步计划一面10月11日、二面10月17日，地点大概率在同安二106室——这些都还没最终敲定，一律以学院官方通知为准，我不瞎打包票。

部门氛围与常见问题（新生问"累不累""好玩吗"或具体问题时答）：
- 平时不累，只有迎新晚会、十佳歌手这类大活动当天会有点疲惫；每个活动准备时间充裕、任务不多，合理规划不影响学习。
- 快乐来自和大家一起准备道具、灯光舞美的过程，活动圆满后听到同学积极反馈的成就感；部门经常聚餐、出去玩、打桌游，关系好、归属感强。
- 大型活动主要4个：青春之我系列活动、迎新晚会、妇女节系列活动、十佳歌手；迎新晚会和十佳歌手是院内比较大型的。
- 常见问题：期中期末一般没任务；分组填报有一志愿和二志愿、可以跨组帮忙；完全零基础能报、有学长学姐带；没进文娱部以后也能参加活动/演出/志愿；十佳歌手一般和新传学院合办、能认识外院同学；团建很多；分组只在准备阶段分、活动正式开始后不分哪个组，不用担心没参与感或耽误时间，而且还有老师和专业人士帮忙。

部长王研（新生问"部长是谁/啥专业"时简短答）：
- 男，2024级，化学测量学与技术专业，人好说话、热情、有点抽象，口头禅"我靠"。
- 金句："选择文娱绝对让你不后悔。"
- 爱好邓紫棋和Katy Perry，喜欢看演唱会。

学院背景（新生问化院相关时可以答，别瞎编）：
- 厦门大学化学化工学院简称"厦大化院"，1921年建校就设化学，1991年成立学院，百年老牌。
- 下设3个系：化学系、化学工程与生物工程系、化学生物学系。
- 本科专业：化学、能源化学、化学生物学、化学测量学与技术、化学工程与工艺，共5个。
- 化学学科连续两轮入选国家"双一流"，ESI全球排名前1‰，化学和化工都进世界百强。
- 学院培养过20多位院士，卢嘉锡、蔡启瑞等名师辈出。

选组引导（当新生说不知道选哪个组、随便、求推荐时）：
- 别一上来就甩MBTI，先问1-2个轻松的小问题帮TA缩小范围，比如"喜欢台前还是幕后？""爱跟人打交道还是自己琢磨？""文字、设计、表演、社交哪个最来电？"
- 如果对方直接报了自己的MBTI类型，就按下面的映射推荐一个组，配一句简短理由（比如"你是ESFP，爱表现又有感染力，舞台组最对你的味～"）。
- MBTI→小组映射（仅作参考，语气轻松，别强迫）：
  舞台组（台前/表演/气氛）：ESFP、ENFP、ESTP、ESFJ
  外联组（拉赞助/人际/谈判）：ENTJ、ENFJ、ESTJ、ENTP
  设计组（视觉/审美/动手）：ISFP、ISTP、ISFJ、ISTJ
  文宣组（文案/宣传/策划）：INFP、INFJ、INTP、INTJ
- 推荐完补一句"这只是参考，兴趣最重要"，别让TA有压力。

网感与热梗（听得懂就自然接，接不上就正常聊，别硬玩）：
- 用户玩梗你才接，别主动堆梗、别当百科解释；一次回复最多1个梗。
- 拿不准的梗宁可不玩，就当普通消息正常回。
- 活人感：回复有长有短、别老分点、会说"哈哈"、不知道就说不知道、顺着语气来。

如果被问到不确定的问题（比如面试时间、截止日期、材料要求、名额等没写明的细节），就老实说"这个我还不清楚，一切以学院官方通知为准，建议看页面里的说明、或者问部长王研"，不要编造、不要当权威。`;

// 聊天历史持久化：存腾讯云 COS（对象 chat/<sessionId>.json，内容为 DeepSeek 格式 messages 数组）
let COS = null;
try { COS = require('cos-nodejs-sdk-v5'); } catch (e) { COS = null; }

function cosClient() {
  if (!COS) return null;
  try {
    return new COS({
      SecretId: process.env.COS_SECRET_ID,
      SecretKey: process.env.COS_SECRET_KEY,
    });
  } catch (e) { return null; }
}

function historyKey(sessionId) {
  const safe = String(sessionId || '').replace(/[^a-zA-Z0-9_-]/g, '');
  return safe ? 'chat/' + safe + '.json' : null;
}

function cosCall(cos, action, params) {
  return new Promise((resolve) => {
    cos[action](params, (err, data) => resolve(err ? null : data));
  });
}

async function loadHistory(sessionId) {
  const key = historyKey(sessionId);
  if (!key) return [];
  const cos = cosClient();
  if (!cos) return [];
  try {
    const data = await cosCall(cos, 'getObject', {
      Bucket: process.env.COS_BUCKET,
      Region: process.env.COS_REGION || 'ap-guangzhou',
      Key: key,
    });
    if (!data || !data.Body) return [];
    const arr = JSON.parse(data.Body.toString('utf-8'));
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

async function saveHistory(sessionId, history) {
  const key = historyKey(sessionId);
  if (!key) return;
  const cos = cosClient();
  if (!cos) return;
  try {
    await cosCall(cos, 'putObject', {
      Bucket: process.env.COS_BUCKET,
      Region: process.env.COS_REGION || 'ap-guangzhou',
      Key: key,
      Body: JSON.stringify(history),
      ContentType: 'application/json',
    });
  } catch (e) { /* 写失败不影响对话 */ }
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function respond(statusCode, obj) {
  return {
    isBase64Encoded: false,
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify(obj),
  };
}

exports.main_handler = async (event, context) => {
  const method = (event.httpMethod || (event.requestContext && event.requestContext.httpMethod) || '').toUpperCase();
  const body = event.body || '';
  const qs = event.queryString || event.queryStringParameters || {};

  if (method === 'OPTIONS') {
    return { isBase64Encoded: false, statusCode: 204, headers: corsHeaders(), body: '' };
  }

  // GET：拉取该会话的历史记录（跨设备同步用）
  if (method === 'GET') {
    const sessionId = qs.s || qs.sessionId || '';
    const history = await loadHistory(sessionId);
    return respond(200, { history });
  }

  if (method !== 'POST') {
    return respond(405, { reply: '只支持 GET / POST 请求哦～' });
  }

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch (e) {
    return respond(400, { reply: '请求格式有点问题～' });
  }

  const sessionId = parsed.sessionId || '';
  const content = String(parsed.content || '').trim();
  if (!content) {
    return respond(400, { reply: '想说点什么？我没听清～' });
  }

  const history = await loadHistory(sessionId);

  try {
    const resp = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.DEEPSEEK_API_KEY,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history.slice(-10), { role: 'user', content }],
        max_tokens: 200,
        temperature: 0.6,
      }),
    });

    if (!resp.ok) {
      return respond(resp.status, { reply: '我这边有点卡壳，稍后再试试哈～' });
    }

    const data = await resp.json();
    const reply = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : '';
    const finalReply = reply || '我走神了，再问一次呗～';

    // 把本轮对话追加进历史并写回 COS（最多保留最近 50 条）
    const newHistory = [...history, { role: 'user', content }, { role: 'assistant', content: finalReply }].slice(-50);
    await saveHistory(sessionId, newHistory);

    return respond(200, { reply: finalReply });
  } catch (e) {
    return respond(500, { reply: '我这边有点卡壳，稍后再试试哈～' });
  }
};
