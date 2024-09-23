import React, { useState, useRef, useEffect } from "react"

const ID_TOKEN = "your-id-token"

type WebSocketEvent = {
  object: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

const AudioRecorder: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const pcmWorkerRef = useRef<AudioWorkletNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    initializeWebSocket()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const initializeWebSocket = () => {
    try {
      if (wsRef.current) return

      wsRef.current = new WebSocket("ws://localhost:8000/ws/listen", [
        "listen-protocol",
        ID_TOKEN
      ])
      wsRef.current.onopen = () => {
        console.log("WebSocket connection opened.")
      }

      wsRef.current.onclose = (e) => {
        console.log(e)
        console.log(`WebSocket closed: ${e.code} ${e.reason}`)
      }
      wsRef.current.onerror = (e) => {
        console.error("WebSocket error:", e)
      }

      wsRef.current.onmessage = (event: MessageEvent) => {
        if (typeof event.data === "string") {
          console.log(event.data)
          const data: WebSocketEvent = JSON.parse(event.data)

          if (data.object === "transcript_item") {
            // Handle transcript item
            console.log(data)
          } else if (data.object === "error_message") {
            console.error(data.message)
            stopRecording()
          }
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.log("here")
      console.log(wsRef.current)
      console.log(e)
    }
  }

  const initializeMediaStream = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log("yo")
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            sampleSize: 16,
            channelCount: 1
          },
          video: false
        })

        if (mediaStreamRef.current) {
          // const modulePath = new URL("./rawPcm16Processor.js", import.meta.url)
          //   .href
          // console.log(modulePath)

          audioContextRef.current = new AudioContext({ sampleRate: 16000 })
          await audioContextRef.current.audioWorklet.addModule(
            "/public/rawPcm16Processor.ts"
            // "/Users/aliziauddin/Work/sahl-ai/audio-socket-frontend/src/components/audio-socket/rawPcm16Processor.ts"
          )
          console.log(audioContextRef.current)
          console.log("audioContextRef.current, ", audioContextRef.current)
          pcmWorkerRef.current = new AudioWorkletNode(
            audioContextRef.current,
            "raw-pcm-16-worker",
            {
              outputChannelCount: [1]
            }
          )
          console.log(" pcmWorkerRef.current ", pcmWorkerRef.current)

          const mediaSource = audioContextRef.current.createMediaStreamSource(
            mediaStreamRef.current
          )
          mediaSource.connect(pcmWorkerRef.current)

          pcmWorkerRef.current.port.onmessage = (msg: MessageEvent) => {
            const pcm16iSamples = msg.data
            const audioAsBase64String = btoa(
              String.fromCodePoint(...new Uint8Array(pcm16iSamples.buffer))
            )

            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(
                JSON.stringify({
                  object: "audio_chunk",
                  payload: audioAsBase64String,
                  stream_id: "stream1"
                })
              )
            } else {
              console.error("WebSocket is not open")
            }
          }
        }
      } else {
        console.error(
          "Microphone audio stream is not accessible on this browser"
        )
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.log(e)
    }
  }

  const startRecording = async () => {
    if (isRecording) return
    console.log("here")
    setIsRecording(true)
    console.log(wsRef.current?.CONNECTING)
    if (wsRef.current?.CONNECTING) return
    if (wsRef.current) wsRef.current.send(JSON.stringify({ object: "start" }))
    pcmWorkerRef.current?.port.start()
    await initializeMediaStream()
  }

  const stopRecording = async () => {
    console.log("here in stip recording ", isRecording)
    if (!isRecording) return

    setIsRecording(false)
    try {
      console.log("here in here")
      await endConnection({ object: "end" })
      stopAudio()
    } catch (error) {
      console.error("Error stopping recording:", error)
    }
  }

  const endConnection = async (endObject: WebSocketEvent) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(endObject))

      for (let i = 0; i < 50; i++) {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          await sleep(100)
        } else {
          break
        }
      }
    }
  }

  const sleep = (duration: number) =>
    new Promise<void>((r) => setTimeout(r, duration))

  const stopAudio = () => {
    try {
      audioContextRef.current?.close()
    } catch (e) {
      console.error("Error while closing AudioContext", e)
    }

    try {
      pcmWorkerRef.current?.port.close()
      pcmWorkerRef.current?.disconnect()
    } catch (e) {
      console.error("Error while closing PCM worker", e)
    }

    try {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    } catch (e) {
      console.error("Error while stopping media stream", e)
    }
  }

  return (
    <div>
      <button onClick={startRecording} disabled={isRecording}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        Stop Recording
      </button>
    </div>
  )
}

export default AudioRecorder
