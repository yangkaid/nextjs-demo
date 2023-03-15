import { Button } from 'antd'
import { useEffect, useState } from 'react';
//APPID，APISecret，APIKey在控制台-我的应用-语音听写（流式版)页面获取
const config = {
  // 请求地址
  hostUrl: "wss://iat-api.xfyun.cn/v2/iat",
  host: "iat-api.xfyun.cn",
  //在控制台-我的应用-语音听写（流式版）获取
  appid: process.env.NEXT_PUBLIC_APP_ID,
  //在控制台-我的应用-语音听写（流式版）获取
  apiSecret: process.env.NEXT_PUBLIC_API_SECRET,
  //在控制台-我的应用-语音听写（流式版）获取
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
  uri: "/v2/iat",
  highWaterMark: 1280
}
let recorder = null
let socket = null
// 鉴权签名
async function getAuthStr(date) {
  const CryptoJS = (await import('crypto-js')).default;
  let signatureOrigin = `host: ${config.host}\ndate: ${date}\nGET ${config.uri} HTTP/1.1`
  let signatureSha = CryptoJS.HmacSHA256(signatureOrigin, config.apiSecret)
  let signature = CryptoJS.enc.Base64.stringify(signatureSha)
  let authorizationOrigin = `api_key="${config.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
  let authStr = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(authorizationOrigin))
  return authStr
}
async function connectSocket() {
  // 获取当前时间 RFC1123格式
  let date = (new Date().toUTCString())
  let auth = await getAuthStr(date)
  let wssUrl = config.hostUrl + "?authorization=" + auth + "&date=" + date + "&host=" + config.host
  socket = new WebSocket(wssUrl)
  socket.onopen = () => {
    console.log('连接成功')
  }
  socket.onmessage = (e) => {
    console.log(JSON.parse(e.data))
    let data = JSON.parse(e.data)
    if (data.code === 0) {
      getResult(data.data.result)
    }
  }
  socket.onclose = (e) => {
    console.log('连接关闭', e)
  }
  socket.onerror = (err) => {
    console.log('连接错误', err)
  }

}
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result.replace(/^data:\w+\/\w+;base64,/, '');
      resolve(base64String);
    };
    reader.onerror = () => {
      reject(new Error('Failed to convert blob to base64'));
    };
    reader.readAsDataURL(blob);
  });
}

export default function InterView() {
  const [isRecording, setIsRecording] = useState(false);
  const [responseText, setResponseText] = useState('');
  let status = 0
  // 上传音频接口
  const sendAudiaData = (audioData, status) => {
    let params = {}
    if (status === 2) {
      params = {
        data: {
          status: 2,
          format: "audio/L16;rate=16000",
          encoding: "raw",
          audio: audioData
        }
      }
    }
    if (status === 0) {
      params = {
        common: {
          app_id: config.appid
        },
        business: {
          language: "zh_cn",
          domain: "iat",
          accent: "mandarin",
          vad_eos: 10000,
          dwa: "wpgs"
        },
        data: {
          status: 0,
          format: "audio/L16;rate=16000",
          encoding: "raw",
          audio: audioData
        }
      }
    }
    if (status === 1) {
      params = {
        data: {
          status: 1,
          format: "audio/L16;rate=16000",
          encoding: "raw",
          audio: audioData
        }
      }
    }
    socket.send(JSON.stringify(params))
  }
  // 开始录音
  const startRecording = async () => {
    console.log('开始录音')
    await connectSocket()
    const RecordRTC = (await import('recordrtc')).default;
    navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then((stream) => {
      recorder = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/webm;codecs=pcm',
        // 设定采样率
        desiredSampRate: 16000,
        recorderType: RecordRTC.StereoAudioRecorder,
        numberOfAudioChannels: 1,
        timeSlice: 1000,
        ondataavailable: (blob) => {
          blobToBase64(blob).then((base64) => {
            if (status === 0) {
              sendAudiaData(base64, 0)
              status = 1
            }
            if (status === 1) {
              sendAudiaData(base64, 1)
            }
          })
        },
      });
      recorder.startRecording();
    })
    setIsRecording(true)
  }
  // 停止录音
  const stopRecording = () => {
    console.log('停止录音')
    recorder.stopRecording(() => {
      let blob = recorder.getBlob()
      // 获取录音链接
      let url = URL.createObjectURL(blob)
      window.open(url)

      blobToBase64(blob).then((base64) => {
        sendAudiaData(base64, 2)
      })
    });
    setIsRecording(false)
  }
  // 拼接结果
  const getResult = (result) => {
    let responseText = ''
    result.forEach((item) => {
      responseText += item.text
    })
    setResponseText(responseText)
  }
  // 获取聊天记录
  const getChatInfo = async () => {
    console.log('获取聊天记录')
    let res = await fetch('/api/chat', {
      method: 'POST',  // 获取聊天记录
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: '你好' })
    })
    const data = await res.json()
    console.log(data)
  }

  return (
    <div className='flex items-center justify-center flex-col'>
      <div className="text-5xl">interview</div>
      <Button className='mt-5' type="primary" onClick={isRecording ? stopRecording : startRecording}>{isRecording ? '停止录音' : '开始录音'}</Button>
      <div>{responseText}</div>
      <Button className='mt-5' type='primary' onClick={getChatInfo}>发送请求</Button>
    </div>
  );
}
