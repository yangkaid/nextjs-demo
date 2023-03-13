import { Button } from 'antd'
import { useEffect, useState } from 'react';
const config = {
  // 请求地址
  hostUrl: "wss://iat-api.xfyun.cn/v2/iat",
  host: "iat-api.xfyun.cn",
  //在控制台-我的应用-语音听写（流式版）获取
  appid: '9ba29dec',
  //在控制台-我的应用-语音听写（流式版）获取
  apiSecret: 'NjFlZDIwZTU4ZmE3NWQ5MDJmNTgwZmY2',
  //在控制台-我的应用-语音听写（流式版）获取
  apiKey: '6d1570ec7613508c0f019abbd7abf277',
  uri: "/v2/iat",
  highWaterMark: 1280
}
// 对处理后的音频数据进行base64编码，
function toBase64(buffer) {
  var binary = ''
  var bytes = new Uint8Array(buffer)
  var len = bytes.byteLength
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

export default function InterView({ data }) {
  const [audioFile, setAudioFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordRTC, setRecordRTC] = useState(null);
  const [socket, setSocket] = useState(null);
  // const [recordStatus, setRecordStatus] = useState(0);
  // const [blobCount, setBlobCount] = useState(0);
  let blobCount = 0
  useEffect(() => {
    async function fetchData() {
      // 获取当前时间 RFC1123格式
      let date = (new Date().toUTCString())
      let auth = await getAuthStr(date)
      let wssUrl = config.hostUrl + "?authorization=" + auth + "&date=" + date + "&host=" + config.host
      let socket = new WebSocket(wssUrl)
      setSocket(socket)
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
      socket.onopen = () => {
        console.log('连接成功')
      }
      socket.onmessage = (e) => {
        console.log(JSON.parse(e.data))
      }
      socket.onclose = (e) => {
        console.log('连接关闭', e)
      }
      socket.onerror = (err) => {
        console.log('连接错误', err)
      }

    }
    fetchData()
  }, [])
  // 上传音频接口
  const sendAudiaData = (blob) => {
    let render = new FileReader();
    let params = {}
    const status = (count) => {
      if (count === 0) {
        return 0
      } else if (count < 0) {
        return 2
      } else {
        return 1
      }
    }
    render.onload = function (result) {
      console.log(blobCount)
      let buffer = result.target.result
      if (blobCount === 0) {
        params = {
          "common": {
            "app_id": config.appid
          },
          "business": {
            "language": "zh_cn",
            "domain": "iat",
            "accent": "mandarin",
            "vad_eos": 10000
          },
          "data": {
            "status": status(blobCount),
            "format": "audio/L16;rate=16000",
            "encoding": "raw",
            "audio": ''
          }
        }
      } else {
        params = {
          "data": {
            "status": status(blobCount),
            "format": "audio/L16;rate=16000",
            "encoding": "raw",
            "audio": toBase64(buffer)
          }
        }
      }
      console.log(params)
      socket.send(JSON.stringify(params))
      blobCount = blobCount + 1
    }
    render.readAsArrayBuffer(blob)
  }
  const startRecording = async () => {
    const RecordRTC = (await import('recordrtc')).default;
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const record = RecordRTC(stream, {
          type: 'audio',
          mimeType: 'audio/webm',
          audioType: 'pcm',
          recorderType: RecordRTC.StereoAudioRecorder,
          desiredSampRate: 16000,
          sampleRate: 16000,
          sampleBits: 16,
          twoChannel: false,
          timeSlice: 200,
          ondataavailable: (blob) => {
            console.log(blob)
            sendAudiaData(blob)
          }
        })
        record.startRecording();
        setRecordRTC(record);
        setIsRecording(true);
      })
      .catch(err => {
        console.log(err);
      })
  }
  // 停止录音
  const stopRecording = () => {
    recordRTC.stopRecording(() => {
      const blob = recordRTC.getBlob();
      setAudioFile(blob);
      let dataURL = URL.createObjectURL(blob);
      // 浏览器打开链接
      window.open(dataURL);
      blobCount = -1
      sendAudiaData(blob)
      setIsRecording(false);
    }
    );
  }
  return (
    <div>
      <h1 className="text-lg">InterView</h1>
      <p>{data.name}</p>
      <p>{data.price}</p>
      <p>{data.id}</p>
      <Button type="primary" onClick={isRecording ? stopRecording : startRecording}>{isRecording ? '停止录音' : '开始录音'}</Button>
    </div>
  );
}

export async function getServerSideProps({ params }) {
  console.log(params)
  // Fetch data from an API or CMS
  // const res = await fetch(`https://jsonplaceholder.typicode.com/posts`);
  // const product = await res.json();
  const data = {
    id: 1,
    name: "Product 1",
    price: 100,
  }

  return {
    props: {
      data,
    },
  };
}
