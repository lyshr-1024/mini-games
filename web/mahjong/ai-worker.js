importScripts('engine.js', 'ai.js')

onmessage = ({ data: { id, view, seat, actions, level, seed, timeMs } }) => {
  postMessage({ id, action: MJAI.choose(view, seat, actions, level, seed, { timeMs }) })
}
