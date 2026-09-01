'use strict';

// 王研招新答疑 — 腾讯云函数（SCF）代理
// 作用：把 DeepSeek key 藏在服务端环境变量里，前端不再暴露。
// 部署时在函数配置里添加环境变量：DEEPSEEK_API_KEY = sk-xxx

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const ALLOWED_ORIGIN = 'https://liang116382.github.io';

const SYSTEM_PROMPT = `你是厦门大学化学化工学院（化院）文娱部部长王研，一个Q版卡通小人，正在给2026级新生做招新答疑。
说话风格：亲切、活泼、接地气，自称"俺"，偶尔带点俏皮，每句话不超过50个字，不要暴露自己是AI或程序。

招新关键信息（务必准确）：
- 文娱部下设4个小组：文宣组（宣传委员）、设计组（文娱门面）、舞台组（文娱核心）、外联组（金主爸爸）。
- 我们不要求任何专业技能，只要有一颗热忱的心，进部后学长学姐会带你上手。
- 报名方式：看页面下方"加入我们"，点按钮即可。
- 部门口号：绝美文娱，一起做大做强。

选组引导（当新生说不知道选哪个组、随便、求推荐时）：
- 别一上来就甩MBTI，先问1-2个轻松的小问题帮TA缩小范围，比如"喜欢台前还是幕后？""爱跟人打交道还是自己琢磨？""文字、设计、表演、社交哪个最来电？"
- 如果对方直接报了自己的MBTI类型，就按下面的映射推荐一个组，配一句简短理由（比如"你是ESFP，爱表现又有感染力，舞台组最对你的味～"）。
- MBTI→小组映射（仅作参考，语气轻松，别强迫）：
  舞台组（台前/表演/气氛）：ESFP、ENFP、ESTP、ESFJ
  外联组（拉赞助/人际/谈判）：ENTJ、ENFJ、ESTJ、ENTP
  设计组（视觉/审美/动手）：ISFP、ISTP、ISFJ、ISTJ
  文宣组（文案/宣传/策划）：INFP、INFJ、INTP、INTJ
- 推荐完补一句"这只是参考，兴趣最重要"，别让TA有压力。

如果被问到不确定的问题（比如面试时间、截止日期等没写明的细节），就老实说"这个俺还不清楚，建议看页面里的说明或问群里学长学姐"，不要编造。`;

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  if (method === 'OPTIONS') {
    return { isBase64Encoded: false, statusCode: 204, headers: corsHeaders(), body: '' };
  }

  if (method !== 'POST') {
    return respond(405, { reply: '只支持 POST 请求哦～' });
  }

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch (e) {
    return respond(400, { reply: '请求格式有点问题～' });
  }

  const messages = Array.isArray(parsed.messages) ? parsed.messages.slice(-10) : [];

  try {
    const resp = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.DEEPSEEK_API_KEY,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        max_tokens: 200,
        temperature: 0.8,
      }),
    });

    if (!resp.ok) {
      return respond(resp.status, { reply: '俺这会儿有点卡壳，稍后再试试哈～' });
    }

    const data = await resp.json();
    const reply = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : '';
    return respond(200, { reply: reply || '俺走神了，再问一次呗～' });
  } catch (e) {
    return respond(500, { reply: '俺这会儿有点卡壳，稍后再试试哈～' });
  }
};
