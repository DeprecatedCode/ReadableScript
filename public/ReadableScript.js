const SEPARATOR = ','

function roll(me, appendix, ...stmt) {
 // console.log(me, appendix, ...stmt)
 if (me.focus instanceof Error) {
  console.error(me.focus)
  return
 }
 const stack = []
 const [term, ...args] = stmt
 if (!(me.room in me.engine.rooms)) {
  me.engine.rooms[me.room] = {}
 }
 if (!(me.book in me.engine.rooms[me.room])) {
  me.engine.rooms[me.room][me.book] = {}
 }
 if (!(term in me.engine.rooms[me.room][me.book])) {
  return Error(`term "${term}" not found in ${me.room} -> ${me.book}`)
 }
 //console.log(me.focus, term, args)
 return me.engine.rooms[me.room][me.book][term](me, appendix, ...args)
}

function traverse(a, path) {
 const lastSegment = path.pop()
 let leaf = a
 for (const segment of path) {
  // console.log(leaf, segment)
  leaf = leaf[segment]
 }
 return { lastSegment, leaf }
}

const lang = [
 ["#", (me) => me.focus],
 [
  "add",
  (me, appendix, a) => {
   // console.log(me.focus, a)
   return me.focus + 1 * a
  },
 ],
 [
  "and",
  (me, appendix) => {
   const code = blocks(appendix)
   const lines = me.run(me, code)
   const result = lines.reduce((acc, cur) => Boolean(acc && cur), true)
   // console.log('and', me, appendix, lines, result)
   return result
  },
 ],
 [
  "at",
  (me, appendix, ...path) => {
   // console.log('at', me.names, path)
   const { lastSegment, leaf } = traverse(me.names, path)
   const edge = leaf[lastSegment]
   me.at = typeof edge === "function" ? edge.bind(leaf) : edge
   return me.at
  },
 ],
 [
  "call",
  (me, appendix, ...args) => {
   const prefix = me.stack.splice(0)
   // console.log(me.focus, prefix, args)
   return me.at(...prefix, ...args)
  },
 ],
 [
  "divide",
  (me, appendix, a) => {
   // console.log(me.focus, a)
   return me.focus / a
  },
 ],
 [
  "eq",
  (me, appendix, a) => {
   // console.log('eq', me.focus, a)
   return me.focus === 1 * a
  },
 ],
 [
  "false",
  (me, appendix) => {
   // console.log('false', me, appendix)
   const code = blocks(appendix)
   if (!me.focus) {
    me.run(me, code)
   }
  },
 ],
 [
  "log",
  (me, appendix, ...a) => {
   console.log(me.focus, ...a)
   return me.focus
  },
 ],
 [
  "mod",
  (me, appendix, a) => {
   // console.log('mod', me.focus, a, me.focus % (1 * a))
   return me.focus % (1 * a)
  },
 ],
 [
  "multiply",
  (me, appendix, a) => {
   // console.log(me.focus, a)
   return me.focus * a
  },
 ],
 [
  "name",
  (me, appendix, ...path) => {
   // console.log(me.names, path)
   const { lastSegment, leaf } = traverse(me.names, path)
   leaf[lastSegment] = me.focus
   return me.focus
  },
 ],
 [
  "or",
  (me, appendix) => {
   const code = blocks(appendix)
   const lines = me.run(me, code)
   const result = lines.reduce((acc, cur) => Boolean(acc || cur), true)
   // console.log('or', me, appendix, lines, result)
   return result
  },
 ],
 [
  "out",
  (me) => {
   // console.log('out', me.focus)
   me.out.push(me.focus)
   return me.focus
  },
 ],
 [
  "plain",
  (me, appendix, a) => {
   return a.match(/^\d*$/) ? parseInt(a, 10) : a
  },
 ],
 [
  "push",
  (me) => {
   // console.log('push', me.focus)
   me.stack.push(me.focus)
   return me.focus
  },
 ],
 [
  "repeat",
  (me, appendix, a, b) => {
   // console.log(me, appendix, a, b)
   const repeat = me.names[a]
   const iter = Array.isArray(repeat)
    ? repeat
    : Number.isFinite(repeat)
     ? new Array(repeat).fill().map((x, i) => i)
     : [repeat]
   // if (window.x ++ < 3) console.log(appendix, blocks(appendix))
   const code = blocks(appendix)
   for (const i in iter) {
    me.names[b] = iter[i]
    me.run(me, code)
   }
   return
  },
 ],
 [
  "run",
  (me) => {
   return me.run(me, ReadableScript([me.focus]))
  },
 ],
 [
  "set",
  (me, appendix, ...path) => {
   // console.log('set', me.names, path)
   const value = path.pop()
   const { lastSegment, leaf } = traverse(me.names, path)
   if (typeof leaf !== "object") {
    return new Error(
     `unable to set ${path.join(" ")} ${lastSegment} of ${typeof leaf}`
    )
   }
   leaf[lastSegment] = value
   return value
  },
 ],
 [
  "subtract",
  (me, appendix, a) => {
   // console.log(me.focus, a)
   return me.focus - 1 * a
  },
 ],
 [
  "true",
  (me, appendix) => {
   // console.log('true', me, appendix)
   const code = blocks(appendix)
   if (me.focus) {
    me.run(me, code)
   }
  },
 ],
 [
  "with",
  (me, appendix, ...w) => {
   me.with.push(w)
   // main.me.with.flat().concat(
   return me.focus
  },
 ],
]

// window.x = 0

function blocks(arr) {
 // console.log('formatting', JSON.stringify(arr))
 return arr.reduce(
  (slurp, line) => {
   if (line[0] === SEPARATOR) {
    if (slurp.lines.length === 0) {
     slurp.lines.push([, []])
    }
    const top = slurp.lines[slurp.lines.length - 1]
    if (!(1 in top)) {
     top[1] = []
    }
    top[1].push(line.slice(1))
   } else {
    slurp.lines.push(...split(line, SEPARATOR))
    // console.log('added new lines', JSON.stringify(slurp.lines.slice()))
   }
   return slurp
  },
  { lines: [], level: 0 }
 ).lines
}

function ReadableScript([a]) {
 return blocks(
  a
   .trim()
   .split("\n")
   .map((x) =>
    x
     .trim()
     .replace(/\s+/g, " ")
     .split(" ")
     .filter((x) => x.length)
   )
   .filter((x) => x.length)
 )
}

function split(original, by) {
 const arr = original.slice()
 const parts = []
 while (true) {
  const nextIndex = arr.indexOf(by)
  if (nextIndex > -1) {
   const part = arr.splice(0, nextIndex + 1)
   part.pop()
   parts.push([part])
   // console.log(nextIndex, arr, parts)
   continue
  }
  if (arr.length) {
   parts.push([arr])
  }
  return parts
 }
}
