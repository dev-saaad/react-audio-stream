// audio-worklet.d.ts
declare class AudioWorkletProcessor {
  constructor()
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Map<string, Float32Array>
  ): boolean
  port: MessagePort
}

declare function registerProcessor(
  name: string,
  processorCtor: typeof AudioWorkletProcessor
): void
