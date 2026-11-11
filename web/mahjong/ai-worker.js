importScripts('engine.js', 'ai.js')

onmessage = ({ data: { id, view, seat, actions, level, seed } }) => {
  postMessage({ id, action: MJAI.choose(view, seat, actions, level, seed) })
}
